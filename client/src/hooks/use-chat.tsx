import { createContext, ReactNode, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useTenantContext } from "@/hooks/use-tenant-context";

// Types for Chat API
type User = {
  id: string | number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

type ChatRoom = {
  id: string;
  name: string;
  type: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  unreadCount?: number;
};

type ChatRoomWithMembers = ChatRoom & {
  members: ChatRoomMember[];
};

type ChatRoomMember = {
  userId: string;
  chatRoomId: string;
  role: string;
  joinedAt: string;
  lastReadMessageId: string | null;
  user: User;
};

type Attachment = {
  id: string;
  messageId: string;
  type: string;
  url: string;
  name: string;
  size: number;
  createdAt: string;
};

type Reaction = {
  userId: string;
  messageId: string;
  emoji: string;
  createdAt: string;
  user: User;
};

type Message = {
  id: string;
  chatRoomId: string;
  userId: string;
  content: string;
  replyToId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  user: User;
  attachments: Attachment[];
  reactions: Reaction[];
};

type MessageInput = {
  content: string;
  replyToId?: string | null;
};

type ReactionInput = {
  emoji: string;
};

type ChatContext = {
  chatRooms: ChatRoom[];
  currentRoom: ChatRoomWithMembers | null;
  messages: Message[];
  isLoadingRooms: boolean;
  isLoadingMessages: boolean;
  hasMoreMessages: boolean;
  loadMoreMessages: () => void;
  selectRoom: (id: string) => void;
  sendMessage: (message: MessageInput) => Promise<void>;
  editMessage: (id: string, content: string) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
  typing: Set<string>;
  startTyping: () => void;
  stopTyping: () => void;
  createChatRoom: (name: string, type: string, memberIds: string[]) => Promise<void>;
  addMemberToChatRoom: (roomId: string, userId: string) => Promise<void>;
  removeMemberFromChatRoom: (roomId: string, userId: string) => Promise<void>;
  getCurrentTenantId: () => string | null;
};

const ChatContext = createContext<ChatContext | null>(null);

// Create a WebSocket connection
function useWebSocket(url: string, onMessage: (data: any) => void) {
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    
    const connect = () => {
      const socket = new WebSocket(url);
      
      socket.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      socket.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        // Attempt to reconnect after 5 seconds
        setTimeout(connect, 5000);
      };
      
      socketRef.current = socket;
    };
    
    connect();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [url, onMessage, user]);

  const send = useCallback((data: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not ready, message queued:', data);
      // Queue the message to be sent when connection is ready
      setTimeout(() => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify(data));
        }
      }, 1000);
    }
  }, []);

  return { send, isConnected };
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [typing, setTyping] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const [oldestMessageId, setOldestMessageId] = useState<string | null>(null);
  
  // Setup WebSocket
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  
  // Get tenant ID from context, session storage or URL for WebSocket connection
  const { currentTenant } = useTenantContext();
  
  const getCurrentTenantId = useCallback(() => {
    // First priority: Use tenant context if available
    if (currentTenant && currentTenant.id) {
      return currentTenant.id;
    }
    
    // Second priority: Check for direct ULID in path /{id} format
    const directUlidMatch = window.location.pathname.match(/^\/([A-Z0-9]{26})/);
    if (directUlidMatch) {
      return directUlidMatch[1];
    }
    
    // Third priority: Check for legacy ULID in /ulid/{id} format
    const legacyUlidMatch = window.location.pathname.match(/\/ulid\/([A-Z0-9]{26})/);
    if (legacyUlidMatch) {
      return legacyUlidMatch[1];
    }
    
    // Fourth priority: Check for ULID tenant ID in /tenants/{id} pattern
    const tenantsUlidMatch = window.location.pathname.match(/\/tenants\/([A-Z0-9]{26})/);
    if (tenantsUlidMatch) {
      return tenantsUlidMatch[1];
    }
    
    // Fifth priority: Use session storage
    return sessionStorage.getItem('currentTenantId');
  }, [currentTenant]);
  
  const tenantId = getCurrentTenantId();
  const wsUrl = `${protocol}//${window.location.host}/ws${tenantId ? `?tenantId=${tenantId}` : ''}`;
  
  const handleWebSocketMessage = useCallback((data: any) => {
    if (data.type === 'new_message' && data.message && data.message.chatRoomId === currentRoomId) {
      setMessages(prev => [data.message, ...prev]);
    } else if (data.type === 'typing' && data.userId && currentRoomId) {
      setTyping(prev => {
        const newSet = new Set(prev);
        newSet.add(data.userId);
        return newSet;
      });
      
      // Clear typing indicator after 3 seconds
      if (typingTimeoutRef.current[data.userId]) {
        clearTimeout(typingTimeoutRef.current[data.userId]);
      }
      
      typingTimeoutRef.current[data.userId] = setTimeout(() => {
        setTyping(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      }, 3000);
    }
  }, [currentRoomId]);
  
  const { send, isConnected } = useWebSocket(wsUrl, handleWebSocketMessage);
  
  // Join room when changing rooms
  useEffect(() => {
    if (isConnected && currentRoomId) {
      send({
        type: 'join_room',
        roomId: currentRoomId
      });
    }
  }, [isConnected, currentRoomId, send]);
  
  // Fetch chat rooms
  const { 
    data: chatRooms = [] as ChatRoom[], 
    isLoading: isLoadingRooms 
  } = useQuery<ChatRoom[]>({
    queryKey: ['/api/chat/rooms'],
    enabled: !!user,
    queryFn: async () => {
      const currentTenantId = getCurrentTenantId();
      if (!currentTenantId) {
        return [];
      }
      const response = await fetch(`/api/chat/rooms?tenantId=${currentTenantId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch chat rooms');
      }
      return response.json();
    }
  });
  
  // Fetch current room
  const { 
    data: currentRoom = null as ChatRoomWithMembers | null,
    isLoading: isLoadingRoom 
  } = useQuery<ChatRoomWithMembers | null>({
    queryKey: ['/api/chat/rooms', currentRoomId],
    enabled: !!currentRoomId,
    queryFn: async () => {
      const currentTenantId = getCurrentTenantId();
      if (!currentTenantId || !currentRoomId) {
        return null;
      }
      const response = await fetch(`/api/chat/rooms/${currentRoomId}?tenantId=${currentTenantId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch chat room details');
      }
      return response.json();
    }
  });
  
  // Fetch messages
  const {
    data: fetchedMessages,
    isLoading: isLoadingMessages,
    refetch: refetchMessages
  } = useQuery<Message[]>({
    queryKey: ['/api/chat/rooms', currentRoomId, 'messages', oldestMessageId],
    enabled: !!currentRoomId,
    queryFn: async ({ queryKey }) => {
      const [, roomId, , before] = queryKey;
      const currentTenantId = getCurrentTenantId();
      
      if (!currentTenantId || !roomId) {
        return [];
      }
      
      const url = `/api/chat/rooms/${roomId}/messages${before ? `?before=${before}&tenantId=${currentTenantId}` : `?tenantId=${currentTenantId}`}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      return response.json() as Promise<Message[]>;
    }
  });
  
  // Update messages when fetched
  useEffect(() => {
    if (fetchedMessages) {
      // If fetching first batch of messages
      if (!oldestMessageId) {
        setMessages(fetchedMessages);
      } else {
        // Appending more messages
        setMessages(prev => [...prev, ...fetchedMessages]);
      }
      
      // Update hasMoreMessages flag
      setHasMoreMessages(fetchedMessages.length === 50); // Assuming 50 is the page size
      
      // Update oldest message id for pagination
      if (fetchedMessages.length > 0) {
        const oldest = fetchedMessages[fetchedMessages.length - 1];
        setOldestMessageId(oldest.id);
      }
    }
  }, [fetchedMessages, oldestMessageId]);
  
  // Reset states when changing rooms
  useEffect(() => {
    if (currentRoomId) {
      setMessages([]);
      setHasMoreMessages(true);
      setOldestMessageId(null);
    }
  }, [currentRoomId]);
  
  // Function to load more messages
  const loadMoreMessages = useCallback(() => {
    if (hasMoreMessages && !isLoadingMessages) {
      refetchMessages();
    }
  }, [hasMoreMessages, isLoadingMessages, refetchMessages]);
  
  // Function to select a room
  const selectRoom = useCallback((id: string) => {
    setCurrentRoomId(id);
  }, []);
  
  // Function to start typing
  const startTyping = useCallback(() => {
    if (currentRoomId && user) {
      send({
        type: 'typing',
        roomId: currentRoomId,
        userId: user.id
      });
    }
  }, [currentRoomId, user, send]);
  
  // Function to stop typing (does nothing on the server, just to clear the local state)
  const stopTyping = useCallback(() => {}, []);
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ id, message }: { id: string, message: MessageInput }) => {
      const currentTenantId = getCurrentTenantId();
      
      if (!currentTenantId) {
        throw new Error('No tenant ID available. Please select an organization first.');
      }
      
      const response = await fetch(`/api/chat/rooms/${id}/messages?tenantId=${currentTenantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...message,
          tenantId: currentTenantId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to send message');
      }
      
      return response.json();
    },
    onSuccess: (newMessage) => {
      setMessages(prev => [newMessage, ...prev]);
      
      // Broadcast to other clients
      send({
        type: 'new_message',
        roomId: currentRoomId,
        message: newMessage
      });
      
      // Reset typing indicator
      stopTyping();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Function to send a message
  const sendMessage = useCallback(async (message: MessageInput) => {
    if (!currentRoomId) return;
    await sendMessageMutation.mutateAsync({ id: currentRoomId, message });
  }, [currentRoomId, sendMessageMutation]);
  
  // Edit message mutation
  const editMessageMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string, content: string }) => {
      const currentTenantId = getCurrentTenantId();
      
      if (!currentTenantId) {
        throw new Error('No tenant ID available. Please select an organization first.');
      }
      
      const response = await fetch(`/api/chat/messages/${id}?tenantId=${currentTenantId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          content,
          tenantId: currentTenantId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to edit message');
      }
      
      return response.json();
    },
    onSuccess: (updatedMessage) => {
      setMessages(prev => prev.map(msg => 
        msg.id === updatedMessage.id ? updatedMessage : msg
      ));
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Function to edit a message
  const editMessage = useCallback(async (id: string, content: string) => {
    await editMessageMutation.mutateAsync({ id, content });
  }, [editMessageMutation]);
  
  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (id: string) => {
      const currentTenantId = getCurrentTenantId();
      
      if (!currentTenantId) {
        throw new Error('No tenant ID available. Please select an organization first.');
      }
      
      const response = await fetch(`/api/chat/messages/${id}?tenantId=${currentTenantId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to delete message');
      }
    },
    onSuccess: (_, id) => {
      setMessages(prev => prev.filter(msg => msg.id !== id));
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Function to delete a message
  const deleteMessage = useCallback(async (id: string) => {
    await deleteMessageMutation.mutateAsync(id);
  }, [deleteMessageMutation]);
  
  // Add reaction mutation
  const addReactionMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string, emoji: string }) => {
      const currentTenantId = getCurrentTenantId();
      
      if (!currentTenantId) {
        throw new Error('No tenant ID available. Please select an organization first.');
      }
      
      const response = await fetch(`/api/chat/messages/${messageId}/reactions?tenantId=${currentTenantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          emoji,
          tenantId: currentTenantId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to add reaction');
      }
      
      return response.json();
    },
    onSuccess: (reaction) => {
      // Update messages with the new reaction
      setMessages(prev => prev.map(msg => {
        if (msg.id === reaction.messageId) {
          return {
            ...msg,
            reactions: [...msg.reactions, { ...reaction, user }]
          };
        }
        return msg;
      }));
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Function to add a reaction
  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    await addReactionMutation.mutateAsync({ messageId, emoji });
  }, [addReactionMutation]);
  
  // Remove reaction mutation
  const removeReactionMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string, emoji: string }) => {
      const currentTenantId = getCurrentTenantId();
      
      if (!currentTenantId) {
        throw new Error('No tenant ID available. Please select an organization first.');
      }
      
      const response = await fetch(`/api/chat/messages/${messageId}/reactions/${encodeURIComponent(emoji)}?tenantId=${currentTenantId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to remove reaction');
      }
    },
    onSuccess: (_, { messageId, emoji }) => {
      // Update messages by removing the reaction
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId && user) {
          return {
            ...msg,
            reactions: msg.reactions.filter(r => 
              !(r.userId === user.id && r.emoji === emoji)
            )
          };
        }
        return msg;
      }));
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Function to remove a reaction
  const removeReaction = useCallback(async (messageId: string, emoji: string) => {
    await removeReactionMutation.mutateAsync({ messageId, emoji });
  }, [removeReactionMutation]);
  
  // Create chat room mutation
  const createChatRoomMutation = useMutation({
    mutationFn: async ({ name, type, memberIds, tenantId }: { name: string, type: string, memberIds: string[], tenantId: string }) => {
      if (!tenantId) {
        throw new Error('No tenant ID available. Please select an organization first.');
      }
      
      console.log("Creating chat room with tenantId:", tenantId);
      
      // Include tenantId as both a query parameter AND in the request body
      const response = await fetch(`/api/chat/rooms?tenantId=${tenantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          name, 
          type, 
          memberIds, 
          tenantId: tenantId // Include in body as well
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to create chat room');
      }
      
      return response.json();
    },
    onSuccess: (newRoom) => {
      // Invalidate chat rooms query
      queryClient.invalidateQueries({ queryKey: ['/api/chat/rooms'] });
      
      // Select the new room
      setCurrentRoomId(newRoom.id);
      
      toast({
        title: 'Success',
        description: 'Chat room created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Function to create a chat room
  const createChatRoom = useCallback(async (name: string, type: string, memberIds: string[]) => {
    // Get the current tenant ID
    const tenantId = getCurrentTenantId();
    if (!tenantId) {
      throw new Error('No tenant ID available. Please select an organization first.');
    }
    await createChatRoomMutation.mutateAsync({ name, type, memberIds, tenantId });
  }, [createChatRoomMutation, getCurrentTenantId]);
  
  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async ({ roomId, userId }: { roomId: string, userId: string }) => {
      const currentTenantId = getCurrentTenantId();
      
      if (!currentTenantId) {
        throw new Error('No tenant ID available. Please select an organization first.');
      }
      
      const response = await fetch(`/api/chat/rooms/${roomId}/members?tenantId=${currentTenantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          userId, 
          role: 'member',
          tenantId: currentTenantId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to add member to chat room');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate current room query
      queryClient.invalidateQueries({ queryKey: ['/api/chat/rooms', currentRoomId] });
      
      toast({
        title: 'Success',
        description: 'Member added to chat room',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Function to add a member to a chat room
  const addMemberToChatRoom = useCallback(async (roomId: string, userId: string) => {
    await addMemberMutation.mutateAsync({ roomId, userId });
  }, [addMemberMutation]);
  
  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async ({ roomId, userId }: { roomId: string, userId: string }) => {
      const currentTenantId = getCurrentTenantId();
      
      if (!currentTenantId) {
        throw new Error('No tenant ID available. Please select an organization first.');
      }
      
      const response = await fetch(`/api/chat/rooms/${roomId}/members/${userId}?tenantId=${currentTenantId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to remove member from chat room');
      }
    },
    onSuccess: () => {
      // Invalidate current room query
      queryClient.invalidateQueries({ queryKey: ['/api/chat/rooms', currentRoomId] });
      
      toast({
        title: 'Success',
        description: 'Member removed from chat room',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Function to remove a member from a chat room
  const removeMemberFromChatRoom = useCallback(async (roomId: string, userId: string) => {
    await removeMemberMutation.mutateAsync({ roomId, userId });
  }, [removeMemberMutation]);
  
  return (
    <ChatContext.Provider
      value={{
        chatRooms,
        currentRoom,
        messages,
        isLoadingRooms,
        isLoadingMessages: isLoadingMessages || isLoadingRoom,
        hasMoreMessages,
        loadMoreMessages,
        selectRoom,
        sendMessage,
        editMessage,
        deleteMessage,
        addReaction,
        removeReaction,
        typing,
        startTyping,
        stopTyping,
        createChatRoom,
        addMemberToChatRoom,
        removeMemberFromChatRoom,
        getCurrentTenantId
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}