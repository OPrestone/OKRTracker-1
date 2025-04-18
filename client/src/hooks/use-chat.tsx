import { createContext, ReactNode, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// Types for Chat API
type User = {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

type ChatRoom = {
  id: number;
  name: string;
  type: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  unreadCount?: number;
};

type ChatRoomWithMembers = ChatRoom & {
  members: ChatRoomMember[];
};

type ChatRoomMember = {
  userId: number;
  chatRoomId: number;
  role: string;
  joinedAt: string;
  lastReadMessageId: number | null;
  user: User;
};

type Attachment = {
  id: number;
  messageId: number;
  type: string;
  url: string;
  name: string;
  size: number;
  createdAt: string;
};

type Reaction = {
  userId: number;
  messageId: number;
  emoji: string;
  createdAt: string;
  user: User;
};

type Message = {
  id: number;
  chatRoomId: number;
  userId: number;
  content: string;
  replyToId: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  user: User;
  attachments: Attachment[];
  reactions: Reaction[];
};

type MessageInput = {
  content: string;
  replyToId?: number | null;
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
  selectRoom: (id: number) => void;
  sendMessage: (message: MessageInput) => Promise<void>;
  editMessage: (id: number, content: string) => Promise<void>;
  deleteMessage: (id: number) => Promise<void>;
  addReaction: (messageId: number, emoji: string) => Promise<void>;
  removeReaction: (messageId: number, emoji: string) => Promise<void>;
  typing: Set<number>;
  startTyping: () => void;
  stopTyping: () => void;
  createChatRoom: (name: string, type: string, memberIds: number[]) => Promise<void>;
  addMemberToChatRoom: (roomId: number, userId: number) => Promise<void>;
  removeMemberFromChatRoom: (roomId: number, userId: number) => Promise<void>;
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
    if (socketRef.current && isConnected) {
      socketRef.current.send(JSON.stringify(data));
    }
  }, [isConnected]);

  return { send, isConnected };
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentRoomId, setCurrentRoomId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [typing, setTyping] = useState<Set<number>>(new Set());
  const typingTimeoutRef = useRef<Record<number, NodeJS.Timeout>>({});
  const [oldestMessageId, setOldestMessageId] = useState<number | null>(null);
  
  // Setup WebSocket
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  
  // Create WebSocket URL with explicit port handling
  // This ensures WebSocket works when using custom ports like 3000
  const wsUrl = `${protocol}//${host}/ws`;
  
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
    data: chatRooms = [], 
    isLoading: isLoadingRooms 
  } = useQuery({
    queryKey: ['/api/chat/rooms'],
    enabled: !!user,
  });
  
  // Fetch current room
  const { 
    data: currentRoom = null,
    isLoading: isLoadingRoom 
  } = useQuery({
    queryKey: ['/api/chat/rooms', currentRoomId],
    enabled: !!currentRoomId,
  });
  
  // Fetch messages
  const {
    data: fetchedMessages,
    isLoading: isLoadingMessages,
    refetch: refetchMessages
  } = useQuery({
    queryKey: ['/api/chat/rooms', currentRoomId, 'messages', oldestMessageId],
    enabled: !!currentRoomId,
    queryFn: async ({ queryKey }) => {
      const [, roomId, , before] = queryKey;
      const url = `/api/chat/rooms/${roomId}/messages${before ? `?before=${before}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      return response.json();
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
  const selectRoom = useCallback((id: number) => {
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
    mutationFn: async ({ id, message }: { id: number, message: MessageInput }) => {
      const response = await fetch(`/api/chat/rooms/${id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
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
    mutationFn: async ({ id, content }: { id: number, content: string }) => {
      const response = await fetch(`/api/chat/messages/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });
      
      if (!response.ok) {
        throw new Error('Failed to edit message');
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
  const editMessage = useCallback(async (id: number, content: string) => {
    await editMessageMutation.mutateAsync({ id, content });
  }, [editMessageMutation]);
  
  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/chat/messages/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete message');
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
  const deleteMessage = useCallback(async (id: number) => {
    await deleteMessageMutation.mutateAsync(id);
  }, [deleteMessageMutation]);
  
  // Add reaction mutation
  const addReactionMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: number, emoji: string }) => {
      const response = await fetch(`/api/chat/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ emoji })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add reaction');
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
  const addReaction = useCallback(async (messageId: number, emoji: string) => {
    await addReactionMutation.mutateAsync({ messageId, emoji });
  }, [addReactionMutation]);
  
  // Remove reaction mutation
  const removeReactionMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: number, emoji: string }) => {
      const response = await fetch(`/api/chat/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove reaction');
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
  const removeReaction = useCallback(async (messageId: number, emoji: string) => {
    await removeReactionMutation.mutateAsync({ messageId, emoji });
  }, [removeReactionMutation]);
  
  // Create chat room mutation
  const createChatRoomMutation = useMutation({
    mutationFn: async ({ name, type, memberIds }: { name: string, type: string, memberIds: number[] }) => {
      const response = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, type, memberIds })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create chat room');
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
  const createChatRoom = useCallback(async (name: string, type: string, memberIds: number[]) => {
    await createChatRoomMutation.mutateAsync({ name, type, memberIds });
  }, [createChatRoomMutation]);
  
  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async ({ roomId, userId }: { roomId: number, userId: number }) => {
      const response = await fetch(`/api/chat/rooms/${roomId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, role: 'member' })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add member to chat room');
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
  const addMemberToChatRoom = useCallback(async (roomId: number, userId: number) => {
    await addMemberMutation.mutateAsync({ roomId, userId });
  }, [addMemberMutation]);
  
  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async ({ roomId, userId }: { roomId: number, userId: number }) => {
      const response = await fetch(`/api/chat/rooms/${roomId}/members/${userId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove member from chat room');
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
  const removeMemberFromChatRoom = useCallback(async (roomId: number, userId: number) => {
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
        removeMemberFromChatRoom
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