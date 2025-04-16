import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/hooks/use-chat";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MoreVertical, Pencil, Trash2, Reply } from "lucide-react";

type MessageProps = {
  message: {
    id: number;
    content: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    user: {
      id: number;
      firstName: string;
      lastName: string;
    };
    attachments: any[];
    reactions: any[];
    replyToId: number | null;
  };
  onReply: (messageId: number) => void;
  replyToMessage?: any;
};

export function MessageItem({ message, onReply, replyToMessage }: MessageProps) {
  const { user } = useAuth();
  const { editMessage, deleteMessage, addReaction, removeReaction } = useChat();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const isCurrentUser = user?.id === message.user.id;
  const formattedDate = formatDistanceToNow(new Date(message.createdAt), { addSuffix: true });
  const isDeleted = !!message.deletedAt;
  const wasEdited = new Date(message.updatedAt).getTime() > new Date(message.createdAt).getTime();
  
  const handleEdit = () => {
    setIsEditing(true);
    setEditedContent(message.content);
  };
  
  const handleSaveEdit = async () => {
    if (editedContent.trim() !== message.content) {
      await editMessage(message.id, editedContent);
    }
    setIsEditing(false);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
  };
  
  const handleDelete = async () => {
    await deleteMessage(message.id);
    setShowDeleteConfirm(false);
  };
  
  const toggleReaction = (emoji: string) => {
    const hasReacted = message.reactions.some(
      r => r.userId === user?.id && r.emoji === emoji
    );
    
    if (hasReacted) {
      removeReaction(message.id, emoji);
    } else {
      addReaction(message.id, emoji);
    }
  };
  
  // Group reactions by emoji
  const groupedReactions = message.reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = { count: 0, users: [] };
    }
    acc[reaction.emoji].count += 1;
    acc[reaction.emoji].users.push(reaction.user.firstName + " " + reaction.user.lastName);
    return acc;
  }, {} as Record<string, { count: number; users: string[] }>);

  const commonEmojis = ["👍", "❤️", "😂", "🎉", "👏", "🚀"];
  
  return (
    <div className={`flex gap-2 mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        {/* Reply reference */}
        {replyToMessage && (
          <div className={`text-xs text-muted-foreground mb-1 flex items-center gap-1 ${isCurrentUser ? 'mr-2' : 'ml-2'}`}>
            <Reply className="h-3 w-3" />
            <span>Reply to {replyToMessage.user.firstName} {replyToMessage.user.lastName}</span>
          </div>
        )}
        
        <div className={`relative group ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-lg px-3 py-2`}>
          {!isEditing ? (
            <>
              {/* Message header */}
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm">
                  {message.user.firstName} {message.user.lastName}
                </span>
                <span className="text-xs opacity-70">{formattedDate}</span>
              </div>
              
              {/* Message content */}
              <div className="whitespace-pre-wrap break-words">
                {isDeleted ? (
                  <span className="italic text-muted-foreground">This message was deleted</span>
                ) : (
                  message.content
                )}
                {wasEdited && !isDeleted && <span className="text-xs ml-1 opacity-70">(edited)</span>}
              </div>
              
              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-2">
                  {message.attachments.map((attachment) => (
                    <div key={attachment.id} className="border rounded-md p-2 mt-1 flex items-center gap-2">
                      <span className="truncate text-xs">{attachment.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(attachment.size / 1024)} KB
                      </span>
                      <Button variant="ghost" size="sm" className="ml-auto" asChild>
                        <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                          Download
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Message actions */}
              {!isDeleted && (
                <div className={`absolute ${isCurrentUser ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} top-0 hidden group-hover:flex items-center gap-1`}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7" 
                    onClick={() => onReply(message.id)}
                  >
                    <Reply className="h-4 w-4" />
                  </Button>
                  
                  {isCurrentUser && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={isCurrentUser ? "end" : "start"}>
                        <DropdownMenuItem onClick={handleEdit}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setShowDeleteConfirm(true)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              )}
              
              {/* Reactions */}
              {!isDeleted && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {Object.entries(groupedReactions).map(([emoji, { count, users }]) => (
                    <TooltipProvider key={emoji}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className={`h-6 px-1 py-0 text-xs ${
                              users.includes(user?.firstName + " " + user?.lastName) 
                                ? "bg-primary/10" 
                                : ""
                            }`}
                            onClick={() => toggleReaction(emoji)}
                          >
                            {emoji} {count}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs">{users.join(", ")}</div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                  
                  {!isDeleted && (
                    <DropdownMenu open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-6 px-1 py-0 text-xs">
                          +
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={isCurrentUser ? "end" : "start"}>
                        <div className="flex gap-1 p-1">
                          {commonEmojis.map(emoji => (
                            <Button
                              key={emoji}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                toggleReaction(emoji);
                                setShowEmojiPicker(false);
                              }}
                            >
                              {emoji}
                            </Button>
                          ))}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2">
              <Textarea 
                value={editedContent} 
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[100px] resize-none"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveEdit}>
                  Save
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Message</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this message? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}