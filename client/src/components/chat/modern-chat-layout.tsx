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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Phone, 
  Video, 
  MoreHorizontal, 
  Search, 
  Plus, 
  Smile, 
  Paperclip, 
  Send, 
  Loader2,
  Users,
  FileText,
  Info,
  ChevronRight,
  ArrowRight,
  Menu,
  MessageSquare
} from "lucide-react";

// CreateChatRoomForm component - Enhanced version
function CreateChatRoomForm({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const { createChatRoom, getCurrentTenantId } = useChat();
  const [chatName, setChatName] = useState("");
  const [chatType, setChatType] = useState("direct");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get the current tenant ID
  const tenantId = getCurrentTenantId();
  
  // Fetch users for chat creation with tenant filter
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/users", tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/users?tenantId=${tenantId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return response.json();
    },
    enabled: !!user && !!tenantId,
  });
  
  // Filter out current user
  const otherUsers = user ? (users as any[]).filter((u: any) => u.id !== user.id) : [];
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!chatName.trim() || !tenantId) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await createChatRoom(
        chatName,
        chatType,
        selectedUsers
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogDescription>
        Create a new conversation to collaborate with your team members.
      </DialogDescription>
      
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">Conversation Name</Label>
          <Input
            id="name"
            placeholder="Enter a name for this conversation"
            value={chatName}
            onChange={(e) => setChatName(e.target.value)}
            className="w-full"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label>Conversation Type</Label>
          <RadioGroup value={chatType} onValueChange={setChatType} className="flex gap-4">
            <div className="flex items-center space-x-2 bg-background rounded-md px-4 py-2 border border-input">
              <RadioGroupItem value="direct" id="direct" />
              <Label htmlFor="direct" className="font-normal cursor-pointer">Direct Message</Label>
            </div>
            <div className="flex items-center space-x-2 bg-background rounded-md px-4 py-2 border border-input">
              <RadioGroupItem value="group" id="group" />
              <Label htmlFor="group" className="font-normal cursor-pointer">Group Chat</Label>
            </div>
          </RadioGroup>
        </div>
        
        <div className="space-y-2">
          <Label>Add Members</Label>
          {isLoadingUsers ? (
            <div className="flex items-center justify-center p-4 bg-muted/30 rounded-md">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="h-[200px] border rounded-md p-2 bg-background">
              <div className="space-y-1">
                {otherUsers.map((user: any) => (
                  <div 
                    key={user.id} 
                    className={`flex items-center space-x-2 p-2 hover:bg-accent/50 rounded-md transition-colors ${
                      selectedUsers.includes(user.id) ? 'bg-accent/30' : ''
                    }`}
                  >
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
                    <Label htmlFor={`user-${user.id}`} className="flex items-center space-x-2 cursor-pointer flex-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.firstName} ${user.lastName}`} />
                        <AvatarFallback>{user.firstName?.[0]}</AvatarFallback>
                      </Avatar>
                      <span>{user.firstName} {user.lastName}</span>
                    </Label>
                    <Badge variant="outline" className="text-xs">{user.role || 'Member'}</Badge>
                  </div>
                ))}
                {otherUsers.length === 0 && (
                  <div className="text-center p-4 text-muted-foreground">
                    No other users found in this organization
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
        <Button 
          type="submit" 
          disabled={!chatName.trim() || selectedUsers.length === 0 || isSubmitting}
          className="gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Create Conversation
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ChatHeader component - Shows the current conversation info
function ChatHeader({ 
  currentRoom, 
  onToggleRightPanel 
}: { 
  currentRoom: any;
  onToggleRightPanel: (panel: 'info' | 'members' | 'files' | null) => void;
}) {
  if (!currentRoom) return null;
  
  return (
    <div className="flex justify-between items-center p-3 border-b border-border bg-card/70">
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 border-2 border-primary/10">
          <AvatarImage 
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${currentRoom.name}`} 
            alt={currentRoom.name} 
          />
          <AvatarFallback>{currentRoom.name[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-medium text-base">{currentRoom.name}</h2>
            {currentRoom.type === 'direct' && (
              <Badge variant="outline" className="text-xs font-normal">
                Direct
              </Badge>
            )}
            {currentRoom.type === 'group' && (
              <Badge variant="outline" className="text-xs font-normal bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                Group
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Last active {formatDistanceToNow(new Date(currentRoom.updatedAt), { addSuffix: true })}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => onToggleRightPanel('info')}
                className="h-8 w-8"
              >
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Conversation Info</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => onToggleRightPanel('members')}  
                className="h-8 w-8"
              >
                <Users className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Members</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => onToggleRightPanel('files')}
                className="h-8 w-8"
              >
                <FileText className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Shared Files</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

// ChatMessage component - Enhanced message display
function EnhancedChatMessage({ message, isCurrentUser }: { message: any; isCurrentUser: boolean }) {
  const timeAgo = formatDistanceToNow(new Date(message.createdAt), { addSuffix: false });
  
  return (
    <div className={`flex gap-3 mb-1 group ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      {!isCurrentUser && (
        <Avatar className="h-8 w-8 mt-1">
          <AvatarImage 
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${message.user?.firstName} ${message.user?.lastName}`} 
            alt={message.user?.username} 
          />
          <AvatarFallback>{message.user?.firstName?.[0]}</AvatarFallback>
        </Avatar>
      )}
      
      <div className="max-w-[75%]">
        {!isCurrentUser && (
          <p className="text-xs font-medium ml-1 mb-1">
            {message.user?.firstName} {message.user?.lastName}
          </p>
        )}
        
        <div className={`p-3 rounded-lg ${
          isCurrentUser 
            ? 'bg-primary text-primary-foreground rounded-tr-none' 
            : 'bg-muted rounded-tl-none'
        }`}>
          <p>{message.content}</p>
          <div className={`text-[10px] mt-1 opacity-0 group-hover:opacity-70 transition-opacity ${
            isCurrentUser ? 'text-primary-foreground' : 'text-muted-foreground'
          }`}>
            {timeAgo}
          </div>
        </div>
      </div>
      
      {isCurrentUser && (
        <Avatar className="h-8 w-8 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <AvatarImage 
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${message.user?.firstName} ${message.user?.lastName}`} 
            alt={message.user?.username} 
          />
          <AvatarFallback>{message.user?.firstName?.[0]}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

// ChatSidebar component - Enhanced sidebar with filters and search
function EnhancedChatSidebar({ onMobileMenuToggle }: { onMobileMenuToggle?: () => void }) {
  const { chatRooms, selectRoom, currentRoom, isLoadingRooms } = useChat();
  const [activeTab, setActiveTab] = useState("all");
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter rooms by search query
  const filteredRooms = chatRooms.filter(room => {
    return room.name.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  // Filter by type
  const filteredByTab = activeTab === "all" 
    ? filteredRooms 
    : filteredRooms.filter(room => room.type === activeTab);
    
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 flex justify-between items-center border-b border-border">
        <div className="flex items-center">
          {onMobileMenuToggle && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onMobileMenuToggle}
              className="mr-2 md:hidden h-8 w-8"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <h2 className="font-bold text-lg">Messages</h2>
        </div>
        <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1">
              <Plus className="h-4 w-4" />
              <span>New</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Conversation</DialogTitle>
            </DialogHeader>
            <CreateChatRoomForm onClose={() => setShowNewChatDialog(false)} />
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="p-3">
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search messages..." 
            className="pl-9 bg-muted/40" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="direct">Direct</TabsTrigger>
            <TabsTrigger value="group">Groups</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <ScrollArea className="flex-1 px-2">
        {isLoadingRooms ? (
          <div className="flex justify-center items-center h-20">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filteredByTab.length === 0 ? (
          <div className="text-center p-4 text-muted-foreground text-sm">
            {searchQuery 
              ? "No conversations match your search" 
              : activeTab === "all"
                ? "No conversations yet"
                : `No ${activeTab} conversations`}
          </div>
        ) : (
          <div className="space-y-1 py-2">
            {filteredByTab.map((room) => (
              <Button
                key={room.id}
                variant={currentRoom?.id === room.id ? "secondary" : "ghost"}
                className="w-full justify-start gap-3 p-2 h-auto"
                onClick={() => selectRoom(room.id)}
              >
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${room.name}`} />
                  <AvatarFallback>{room.name[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden text-left">
                  <div className="flex justify-between items-center w-full">
                    <span className="font-medium truncate">{room.name}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(room.updatedAt), { addSuffix: false })}
                    </span>
                  </div>
                  <p className="text-xs truncate text-muted-foreground">
                    {room.description || "No messages yet"}
                  </p>
                </div>
                {room.unreadCount ? (
                  <Badge className="ml-auto">{room.unreadCount}</Badge>
                ) : null}
              </Button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// Main modernized chat layout component
export function ModernChatLayout() {
  const { user } = useAuth();
  const { currentRoom, messages, sendMessage, isLoadingMessages, loadMoreMessages, hasMoreMessages, typing } = useChat();
  
  const [messageText, setMessageText] = useState("");
  const [rightPanelOpen, setRightPanelOpen] = useState<'info' | 'members' | 'files' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
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
      sendMessage({ content: messageText });
      setMessageText("");
      setShowEmojiPicker(false);
    }
  };
  
  // Handle scroll to load more messages
  const handleScroll = () => {
    if (!messagesContainerRef.current || !hasMoreMessages) return;
    
    const { scrollTop } = messagesContainerRef.current;
    if (scrollTop === 0) {
      loadMoreMessages();
    }
  };
  
  // Toggle right panel
  const toggleRightPanel = (panel: 'info' | 'members' | 'files' | null) => {
    setRightPanelOpen(rightPanelOpen === panel ? null : panel);
  };
  
  // Get typing users
  const typingUsers = Array.from(typing).filter(id => String(id) !== String(user?.id));
  
  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, any[]>);
  
  return (
    <div className="flex h-full overflow-hidden">
      {/* Mobile sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[300px] p-0 sm:max-w-md">
          <EnhancedChatSidebar onMobileMenuToggle={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>
      
      {/* Desktop sidebar */}
      <div className="hidden md:block w-72 border-r border-border h-full bg-card/30">
        <EnhancedChatSidebar />
      </div>
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Chat header with mobile menu toggle */}
        <div className="flex items-center md:hidden p-3 border-b border-border">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setMobileMenuOpen(true)}
            className="mr-2 h-8 w-8"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h2 className="font-bold">Messages</h2>
        </div>
        
        {currentRoom ? (
          <>
            {/* Chat conversation header */}
            <ChatHeader 
              currentRoom={currentRoom} 
              onToggleRightPanel={toggleRightPanel} 
            />
            
            {/* Messages with optional right panel */}
            <div className="flex flex-1 overflow-hidden">
              {/* Messages section */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 bg-background"
                onScroll={handleScroll}
              >
                {isLoadingMessages ? (
                  <div className="flex justify-center items-center h-20">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="text-center max-w-sm bg-card p-6 rounded-lg shadow-sm">
                      <div className="p-3 bg-primary/10 text-primary inline-flex rounded-full mb-3">
                        <Send className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-medium">No messages yet</h3>
                      <p className="text-sm text-muted-foreground mt-2 mb-4">
                        Start the conversation with {currentRoom.name} by sending your first message.
                      </p>
                      <Button 
                        onClick={() => document.getElementById('message-input')?.focus()}
                        className="gap-2"
                      >
                        <ArrowRight className="h-4 w-4" />
                        Start conversation
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Load more button */}
                    {hasMoreMessages && (
                      <div className="text-center mb-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={loadMoreMessages}
                          disabled={isLoadingMessages}
                          className="rounded-full px-4"
                        >
                          {isLoadingMessages ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            "Load older messages"
                          )}
                        </Button>
                      </div>
                    )}
                    
                    {/* Messages grouped by date */}
                    {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                      <div key={date} className="mb-6">
                        <div className="relative flex items-center py-2">
                          <div className="flex-grow border-t border-border"></div>
                          <span className="flex-shrink mx-4 text-xs text-muted-foreground bg-background px-2">
                            {new Date(date).toDateString() === new Date().toDateString() 
                              ? 'Today' 
                              : new Date(date).toDateString() === new Date(Date.now() - 86400000).toDateString()
                                ? 'Yesterday'
                                : date}
                          </span>
                          <div className="flex-grow border-t border-border"></div>
                        </div>
                        
                        <div className="space-y-1">
                          {dateMessages.map((message) => (
                            <EnhancedChatMessage 
                              key={message.id} 
                              message={message} 
                              isCurrentUser={String(message.userId) === String(user?.id)} 
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    {/* Typing indicator */}
                    {typingUsers.length > 0 && (
                      <div className="text-xs text-muted-foreground animate-pulse flex items-center">
                        <div className="flex space-x-1 mr-2">
                          <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                          <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                          <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "600ms" }}></span>
                        </div>
                        {typingUsers.length === 1
                          ? `${typingUsers[0]} is typing...`
                          : `${typingUsers.length} people are typing...`}
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
              
              {/* Right panel */}
              {rightPanelOpen && (
                <div className="w-72 border-l border-border bg-card/60 overflow-y-auto">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">
                        {rightPanelOpen === 'info' && 'Conversation Info'}
                        {rightPanelOpen === 'members' && 'Members'}
                        {rightPanelOpen === 'files' && 'Shared Files'}
                      </h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setRightPanelOpen(null)}
                        className="h-8 w-8"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </div>
                    
                    <Separator className="mb-4" />
                    
                    {rightPanelOpen === 'info' && (
                      <div className="space-y-3">
                        <div className="bg-background p-3 rounded-md">
                          <p className="text-xs text-muted-foreground">Created</p>
                          <p className="text-sm">{new Date(currentRoom.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="bg-background p-3 rounded-md">
                          <p className="text-xs text-muted-foreground">Type</p>
                          <p className="text-sm capitalize">{currentRoom.type}</p>
                        </div>
                        <div className="bg-background p-3 rounded-md">
                          <p className="text-xs text-muted-foreground">Total messages</p>
                          <p className="text-sm">{messages.length}</p>
                        </div>
                      </div>
                    )}
                    
                    {rightPanelOpen === 'members' && (
                      <div className="space-y-2">
                        {/* Example member */}
                        <div className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md bg-background">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{user?.username?.charAt(0)?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{user?.username || 'You'}</p>
                            <p className="text-xs text-muted-foreground">Online</p>
                          </div>
                          <Badge variant="outline" className="text-xs">Admin</Badge>
                        </div>
                      </div>
                    )}
                    
                    {rightPanelOpen === 'files' && (
                      <div className="bg-background text-center text-muted-foreground text-sm p-6 rounded-md">
                        <Paperclip className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2"/>
                        <p>No files shared in this conversation yet</p>
                        <p className="text-xs mt-1">Attachments will appear here</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Message input */}
            <div className="border-t border-border p-3 bg-card/30">
              <form onSubmit={handleSendMessage} className="relative">
                <div className="flex items-center space-x-2 rounded-lg border border-input bg-background p-1 pl-3">
                  <Input 
                    id="message-input"
                    placeholder="Type your message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-transparent"
                  />
                  
                  <div className="flex items-center gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          >
                            <Smile className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Add emoji</TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <Paperclip className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Attach file</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <Button 
                      type="submit" 
                      disabled={!messageText.trim()}
                      size="sm"
                      className="rounded-full px-3"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-muted/10">
            <div className="max-w-md text-center">
              <div className="p-4 bg-primary/10 text-primary inline-flex rounded-full mb-4">
                <MessageSquare className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-bold mb-2">No conversation selected</h2>
              <p className="text-muted-foreground mb-6">
                Choose an existing conversation from the sidebar or create a new one to start messaging
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Start a new conversation</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Conversation</DialogTitle>
                  </DialogHeader>
                  <CreateChatRoomForm onClose={() => {}} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}