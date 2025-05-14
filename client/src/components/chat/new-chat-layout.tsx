import { useState, useRef, useEffect } from "react";
import { useChat } from "@/hooks/use-chat";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Phone, Video, MoreHorizontal, Search, Plus, Smile, Paperclip, Send, Loader2 } from "lucide-react";

// CreateChatRoomForm component
type CreateChatRoomFormProps = {
  onClose: () => void;
};

function CreateChatRoomForm({ onClose }: CreateChatRoomFormProps) {
  const { user } = useAuth();
  const { createChatRoom } = useChat();
  const [chatName, setChatName] = useState("");
  const [chatType, setChatType] = useState("direct");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch users for chat creation
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/users"],
    enabled: !!user,
  });
  
  // Filter out current user
  const otherUsers = user ? (users as any[]).filter((u: any) => u.id !== user.id) : [];
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!chatName.trim()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await createChatRoom(
        chatName,
        chatType,
        selectedUsers.map(id => Number(id))
      );
      
      setChatName("");
      setChatType("direct");
      setSelectedUsers([]);
      onClose();
    } catch (error) {
      console.error("Failed to create chat room:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <DialogDescription>
        Create a new chat room to start conversations with team members.
      </DialogDescription>
      
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder="Chat name"
            value={chatName}
            onChange={(e) => setChatName(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label>Type</Label>
          <RadioGroup value={chatType} onValueChange={setChatType} className="flex gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="direct" id="direct" />
              <Label htmlFor="direct">Direct</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="group" id="group" />
              <Label htmlFor="group">Group</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="public" id="public" />
              <Label htmlFor="public">Public</Label>
            </div>
          </RadioGroup>
        </div>
        
        <div className="space-y-2">
          <Label>Members</Label>
          {isLoadingUsers ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="h-[200px] border rounded-md p-2">
              <div className="space-y-2">
                {otherUsers.map((user: any) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                        }
                      }}
                    />
                    <Label htmlFor={`user-${user.id}`} className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.firstName} ${user.lastName}`} />
                        <AvatarFallback>{user.firstName?.[0]}</AvatarFallback>
                      </Avatar>
                      <span>{user.firstName} {user.lastName}</span>
                    </Label>
                  </div>
                ))}
                {otherUsers.length === 0 && (
                  <div className="text-center p-4 text-muted-foreground">
                    No other users found
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={!chatName.trim() || selectedUsers.length === 0 || isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Chat"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ChatHeader component - Displays the current chat header with user info
const ChatHeader = ({ currentRoom }: { currentRoom: any }) => {
  if (!currentRoom) return null;
  
  return (
    <div className="flex justify-between items-center p-4 border-b">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${currentRoom.name}`} alt={currentRoom.name} />
          <AvatarFallback>{currentRoom.name[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-medium">{currentRoom.name}</h2>
          <p className="text-xs text-muted-foreground">
            Last seen {formatDistanceToNow(new Date(currentRoom.updatedAt), { addSuffix: true })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Phone className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Video className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

// ChatMessage component - Renders a single message
const ChatMessage = ({ message, isCurrentUser }: { message: any; isCurrentUser: boolean }) => {
  return (
    <div className={`flex gap-3 mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      {!isCurrentUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage 
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${message.user?.firstName} ${message.user?.lastName}`} 
            alt={message.user?.username} 
          />
          <AvatarFallback>{message.user?.firstName?.[0]}</AvatarFallback>
        </Avatar>
      )}
      <div className={`max-w-[70%] ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'} p-3 rounded-lg`}>
        <p>{message.content}</p>
        <div className="text-[10px] mt-1 opacity-70 text-right">
          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: false })}
        </div>
      </div>
    </div>
  );
};

// NotificationsPanel component - Shows chat notifications
const NotificationsPanel = () => {
  const notifications = [
    { id: 1, user: "Aakriti", action: "mentioned you in", target: "Trip to Goa", time: "10 min ago", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Aakriti" },
    { id: 2, user: "GreenJungleHigh", action: "added you in", target: "Project 'Galaxy'", time: "15 min ago", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=GreenJungleHigh" },
    { id: 3, user: "SamSmith", action: "removed you from", target: "Team 'Galaxy'", time: "20 min ago", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=SamSmith" },
    { id: 4, user: "Nouri", action: "mentioned you in", target: "Public chat", time: "25 min ago", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Nouri" },
    { id: 5, user: "Aakriti", action: "mentioned you in", target: "College Gang", time: "30 min ago", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Aakriti" },
    { id: 6, user: "VikashHigh", action: "added you in", target: "Group 'Designers'", time: "35 min ago", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=VikashHigh" },
  ];

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Notifications</h3>
      <div className="space-y-4">
        {notifications.map((notification) => (
          <div key={notification.id} className="flex items-start gap-3">
            <Avatar>
              <AvatarImage src={notification.avatar} alt={notification.user} />
              <AvatarFallback>{notification.user[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm">
                <span className="font-semibold">@{notification.user}</span> {notification.action}{" "}
                <span className="font-semibold">{notification.target}</span>
              </p>
              <p className="text-xs text-muted-foreground">{notification.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// SuggestionsPanel component - Shows user suggestions
const SuggestionsPanel = () => {
  const suggestions = [
    { id: 1, name: "Abhiman Singh", role: "UI/UX Lead", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Abhiman Singh" },
    { id: 2, name: "Ved Prakash", role: "Developer", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Ved Prakash" },
    { id: 3, name: "Ankit Trivedi", role: "UI/UX Lead", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Ankit Trivedi" },
    { id: 4, name: "Vikash Raj", role: "Developer", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Vikash Raj" },
  ];

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Suggestions</h3>
      <div className="space-y-4">
        {suggestions.map((suggestion) => (
          <div key={suggestion.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={suggestion.avatar} alt={suggestion.name} />
                <AvatarFallback>{suggestion.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{suggestion.name}</p>
                <p className="text-xs text-muted-foreground">{suggestion.role}</p>
              </div>
            </div>
            <Button size="sm" variant="outline">Add</Button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Chat sidebar component
const ChatSidebar = () => {
  const { chatRooms, selectRoom, currentRoom, isLoadingRooms } = useChat();
  const [activeTab, setActiveTab] = useState("direct");
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter rooms by type and search query
  const filteredRooms = chatRooms.filter(room => {
    return room.name.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  const directChats = filteredRooms.filter(room => room.type === "direct");
  const groupChats = filteredRooms.filter(room => room.type === "group");
  const publicChats = filteredRooms.filter(room => room.type === "public");
  
  return (
    <div className="w-80 border-r h-full flex flex-col">
      <div className="p-4 flex justify-between items-center">
        <h2 className="font-bold text-xl">Chats</h2>
        <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Conversation</DialogTitle>
            </DialogHeader>
            <CreateChatRoomForm onClose={() => setShowNewChatDialog(false)} />
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="px-4 pb-2">
        <Tabs defaultValue="direct" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="direct">Direct</TabsTrigger>
            <TabsTrigger value="group">Groups</TabsTrigger>
            <TabsTrigger value="public">Public</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="px-4 pb-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search..." 
            className="pl-8" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        {isLoadingRooms ? (
          <div className="flex justify-center items-center h-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="px-2">
            {activeTab === "direct" && directChats.map((room) => (
              <Button
                key={room.id}
                variant={currentRoom?.id === room.id ? "secondary" : "ghost"}
                className="w-full justify-start mb-1 p-2"
                onClick={() => selectRoom(room.id)}
              >
                <div className="flex items-center gap-2 w-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${room.name}`} />
                    <AvatarFallback>{room.name[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center">
                      <span className="font-medium truncate">{room.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(room.updatedAt), { addSuffix: false })}
                      </span>
                    </div>
                    <p className="text-xs truncate text-muted-foreground">
                      No messages yet
                    </p>
                  </div>
                  {room.unreadCount ? (
                    <Badge variant="default" className="ml-auto h-5 w-5 p-0 text-[10px] flex items-center justify-center">
                      {room.unreadCount}
                    </Badge>
                  ) : null}
                </div>
              </Button>
            ))}
            
            {activeTab === "group" && groupChats.map((room) => (
              <Button
                key={room.id}
                variant={currentRoom?.id === room.id ? "secondary" : "ghost"}
                className="w-full justify-start mb-1 p-2"
                onClick={() => selectRoom(room.id)}
              >
                <div className="flex items-center gap-2 w-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${room.name}`} />
                    <AvatarFallback>{room.name[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center">
                      <span className="font-medium truncate">{room.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(room.updatedAt), { addSuffix: false })}
                      </span>
                    </div>
                    <p className="text-xs truncate text-muted-foreground">
                      No messages yet
                    </p>
                  </div>
                  {room.unreadCount ? (
                    <Badge variant="default" className="ml-auto h-5 w-5 p-0 text-[10px] flex items-center justify-center">
                      {room.unreadCount}
                    </Badge>
                  ) : null}
                </div>
              </Button>
            ))}
            
            {activeTab === "public" && publicChats.map((room) => (
              <Button
                key={room.id}
                variant={currentRoom?.id === room.id ? "secondary" : "ghost"}
                className="w-full justify-start mb-1 p-2"
                onClick={() => selectRoom(room.id)}
              >
                <div className="flex items-center gap-2 w-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${room.name}`} />
                    <AvatarFallback>{room.name[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center">
                      <span className="font-medium truncate">{room.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(room.updatedAt), { addSuffix: false })}
                      </span>
                    </div>
                    <p className="text-xs truncate text-muted-foreground">
                      No messages yet
                    </p>
                  </div>
                  {room.unreadCount ? (
                    <Badge variant="default" className="ml-auto h-5 w-5 p-0 text-[10px] flex items-center justify-center">
                      {room.unreadCount}
                    </Badge>
                  ) : null}
                </div>
              </Button>
            ))}
            
            {((activeTab === "direct" && directChats.length === 0) ||
              (activeTab === "group" && groupChats.length === 0) ||
              (activeTab === "public" && publicChats.length === 0)) && (
              <div className="text-center p-4 text-muted-foreground">
                {searchQuery ? (
                  <div>
                    <p>No conversations matching "{searchQuery}"</p>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => setSearchQuery("")}
                    >
                      Clear search
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p>No conversations found</p>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => setShowNewChatDialog(true)}
                    >
                      Create a new conversation
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

// Main chat layout component
export function NewChatLayout() {
  const { user } = useAuth();
  const { currentRoom, messages, sendMessage, isLoadingMessages, loadMoreMessages, hasMoreMessages } = useChat();
  const [messageText, setMessageText] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle message input submission
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (messageText.trim() && currentRoom) {
      sendMessage(messageText);
      setMessageText("");
    }
  };

  // Handle scroll to top to load more messages
  const handleScroll = () => {
    if (!messagesContainerRef.current || !hasMoreMessages) return;
    
    const { scrollTop } = messagesContainerRef.current;
    if (scrollTop === 0) {
      loadMoreMessages();
    }
  };

  return (
    <div className="flex h-screen">
      <ChatSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {currentRoom ? (
          <>
            <ChatHeader currentRoom={currentRoom} />
            
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4"
              onScroll={handleScroll}
            >
              {isLoadingMessages ? (
                <div className="flex justify-center items-center h-20">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <div className="text-center max-w-xs">
                    <h3 className="text-lg font-medium">No messages yet</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Send your first message to start the conversation.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {hasMoreMessages && (
                    <div className="text-center">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={loadMoreMessages}
                        disabled={isLoadingMessages}
                      >
                        {isLoadingMessages ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Load more messages"
                        )}
                      </Button>
                    </div>
                  )}
                  
                  {messages.map((message) => (
                    <ChatMessage 
                      key={message.id} 
                      message={message} 
                      isCurrentUser={message.userId === user?.id} 
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            
            <div className="border-t p-4">
              <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="pr-20"
                  />
                  <div className="absolute right-2 bottom-1/2 transform translate-y-1/2 flex items-center gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                            <Smile className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Add emoji</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                            <Paperclip className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Attach file</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <Button type="submit" size="icon" disabled={!messageText.trim()}>
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-sm">
              <h2 className="text-2xl font-bold mb-4">Welcome to Chat</h2>
              <p className="text-muted-foreground mb-6">
                Select a conversation from the sidebar or start a new one to begin chatting.
              </p>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>Start a new conversation</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Conversation</DialogTitle>
                  </DialogHeader>
                  <CreateChatRoomForm onClose={() => setShowCreateDialog(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}
      </div>
      
      <div className="w-80 border-l h-full">
        <Tabs defaultValue="notifications">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          </TabsList>
          <TabsContent value="notifications" className="h-[calc(100vh-48px)] overflow-y-auto">
            <NotificationsPanel />
          </TabsContent>
          <TabsContent value="suggestions" className="h-[calc(100vh-48px)] overflow-y-auto">
            <SuggestionsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}