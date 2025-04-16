import { useState, useRef, useEffect } from "react";
import { useChat } from "@/hooks/use-chat";
import { ChatSidebar } from "./chat-sidebar";
import { MessageItem } from "./message-item";
import { MessageInput } from "./message-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export function ChatLayout() {
  const { 
    currentRoom, 
    messages, 
    isLoadingMessages, 
    hasMoreMessages, 
    loadMoreMessages,
    typing,
    addMemberToChatRoom,
    removeMemberFromChatRoom
  } = useChat();
  
  const [replyToMessage, setReplyToMessage] = useState<any | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  // Get message by ID to display reply reference
  const getMessageById = (id: number) => {
    return messages.find(msg => msg.id === id);
  };
  
  // Format typing indicator text
  const getTypingText = () => {
    if (!currentRoom || typing.size === 0) return null;
    
    const typingUsers = Array.from(typing).map(userId => {
      const member = currentRoom.members.find(m => m.userId === userId);
      return member ? `${member.user.firstName} ${member.user.lastName}` : "Someone";
    });
    
    if (typingUsers.length === 1) {
      return `${typingUsers[0]} is typing...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0]} and ${typingUsers[1]} are typing...`;
    } else if (typingUsers.length > 2) {
      return `${typingUsers[0]}, ${typingUsers[1]}, and ${typingUsers.length - 2} more are typing...`;
    }
    
    return null;
  };
  
  return (
    <div className="flex h-full">
      <ChatSidebar />
      
      <div className="flex-1 flex flex-col h-full">
        {currentRoom ? (
          <>
            {/* Header */}
            <div className="border-b p-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                {currentRoom.type === "group" ? (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                ) : (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {currentRoom.name[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <h2 className="font-semibold">{currentRoom.name}</h2>
                  <div className="text-xs text-muted-foreground">
                    {currentRoom.members.length} members
                  </div>
                </div>
              </div>
              
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Members
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader>
                    <SheetTitle>Members</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 space-y-3">
                    {currentRoom.members.map((member) => (
                      <div key={member.userId} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {member.user.firstName[0]}{member.user.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.user.firstName} {member.user.lastName}</div>
                            <div className="text-xs text-muted-foreground">{member.user.email}</div>
                          </div>
                        </div>
                        <Badge variant={member.role === "admin" ? "default" : "outline"}>
                          {member.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {isLoadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  {hasMoreMessages && (
                    <div className="flex justify-center">
                      <Button 
                        variant="ghost" 
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
                    <MessageItem 
                      key={message.id} 
                      message={message} 
                      onReply={setReplyToMessage}
                      replyToMessage={message.replyToId ? getMessageById(message.replyToId) : undefined}
                    />
                  ))}
                  
                  {typing.size > 0 && (
                    <div className="text-sm text-muted-foreground italic">
                      {getTypingText()}
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
            
            {/* Input */}
            <MessageInput 
              replyToMessage={replyToMessage} 
              onCancelReply={() => setReplyToMessage(null)} 
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Select a conversation</h2>
            <p className="text-muted-foreground max-w-md">
              Choose an existing conversation from the sidebar or create a new one to start chatting.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}