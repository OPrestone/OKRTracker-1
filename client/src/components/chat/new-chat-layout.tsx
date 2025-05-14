import { useState, useRef, useEffect } from "react";
import { useChat } from "@/hooks/use-chat";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";
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
  DialogTrigger
} from "@/components/ui/dialog";
import { Phone, Video, MoreHorizontal, Search, Plus, Smile, Paperclip, Send } from "lucide-react";

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
  const { chatRooms, selectRoom, currentRoom } = useChat();
  const [activeTab, setActiveTab] = useState("direct");
  
  // Filter rooms by type
  const directChats = chatRooms.filter(room => room.type === "direct");
  const groupChats = chatRooms.filter(room => room.type === "group");
  const publicChats = chatRooms.filter(room => room.type === "public");
  
  return (
    <div className="w-80 border-r h-full flex flex-col">
      <div className="p-4 flex justify-between items-center">
        <h2 className="font-bold text-xl">Chats</h2>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
          <Plus className="h-4 w-4" />
        </Button>
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
          <Input placeholder="Search..." className="pl-8" />
        </div>
      </div>
      
      <ScrollArea className="flex-1">
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
                    Are you missing today's call...
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
                    Last message preview...
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
                    Last message preview...
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
              No conversations found
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

// Main chat layout component
export function NewChatLayout() {
  const { user } = useAuth();
  const { currentRoom, messages, sendMessage, isLoadingMessages, loadMoreMessages, hasMoreMessages } = useChat();
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  // Handle sending a message
  const handleSendMessage = () => {
    if (messageText.trim()) {
      sendMessage({ content: messageText.trim() });
      setMessageText("");
    }
  };
  
  // Handle key press (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Handle scroll to load more messages
  useEffect(() => {
    const messagesContainer = messagesContainerRef.current;
    if (!messagesContainer) return;
    
    const handleScroll = () => {
      if (messagesContainer.scrollTop === 0 && hasMoreMessages && !isLoadingMessages) {
        loadMoreMessages();
      }
    };
    
    messagesContainer.addEventListener("scroll", handleScroll);
    return () => messagesContainer.removeEventListener("scroll", handleScroll);
  }, [hasMoreMessages, isLoadingMessages, loadMoreMessages]);
  
  return (
    <div className="flex h-full bg-background">
      {/* Left sidebar */}
      <ChatSidebar />
      
      {/* Middle chat section */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-xl font-bold">Chat ONN</h1>
          <div className="text-sm text-muted-foreground">Create memorable talks</div>
        </div>
        
        {currentRoom ? (
          <>
            <ChatHeader currentRoom={currentRoom} />
            
            {/* Messages container */}
            <div 
              className="flex-1 overflow-y-auto p-4"
              ref={messagesContainerRef}
            >
              {isLoadingMessages && (
                <div className="flex justify-center mb-4">
                  <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                </div>
              )}
              
              {messages.length === 0 && !isLoadingMessages ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <p>No messages yet</p>
                    <p>Start a conversation</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <ChatMessage 
                      key={message.id} 
                      message={message}
                      isCurrentUser={message.userId === Number(user?.id)}
                    />
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Message input */}
            <div className="border-t p-4">
              <div className="flex items-center gap-2 bg-background rounded-lg border p-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                        <Paperclip className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Attach files</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <Input 
                  type="text" 
                  placeholder="Type a message here..." 
                  className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0" 
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyPress}
                />
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                        <Smile className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Add emoji</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="primary" size="icon" className="h-8 w-8 rounded-full" onClick={handleSendMessage}>
                        <Send className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Send message</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md p-8">
              <h2 className="text-2xl font-bold mb-4">Welcome to Chat</h2>
              <p className="text-muted-foreground mb-6">
                Select a conversation from the sidebar or start a new one to begin chatting.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Start a new conversation</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Conversation</DialogTitle>
                  </DialogHeader>
                  {/* New conversation form would go here */}
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}
      </div>
      
      {/* Right sidebar */}
      <div className="w-80 border-l h-full">
        <Tabs defaultValue="notifications">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          </TabsList>
          <TabsContent value="notifications">
            <NotificationsPanel />
          </TabsContent>
          <TabsContent value="suggestions">
            <SuggestionsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}