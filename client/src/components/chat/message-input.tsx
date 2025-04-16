import { useState, useRef, useEffect } from "react";
import { useChat } from "@/hooks/use-chat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Paperclip, Send } from "lucide-react";

type MessageInputProps = {
  replyToMessage: any | null;
  onCancelReply: () => void;
};

export function MessageInput({ replyToMessage, onCancelReply }: MessageInputProps) {
  const { sendMessage, startTyping, stopTyping } = useChat();
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-focus when component mounts or reply is set
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyToMessage]);
  
  // Handle sending message
  const handleSend = async () => {
    if (!message.trim() && attachments.length === 0) return;
    
    try {
      // Start by sending the message content
      await sendMessage({
        content: message.trim(),
        replyToId: replyToMessage?.id || null
      });
      
      // Reset state
      setMessage("");
      setAttachments([]);
      if (replyToMessage) {
        onCancelReply();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };
  
  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
    
    // Reset the input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  // Handle key press (Ctrl/Cmd + Enter to send)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
    
    // Start typing indicator
    startTyping();
  };
  
  // Remove an attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
  return (
    <div className="border-t p-3">
      {/* Reply preview */}
      {replyToMessage && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground border-l-2 border-primary pl-2 mb-2">
          <span>
            Replying to <span className="font-medium">{replyToMessage.user.firstName} {replyToMessage.user.lastName}</span>:
          </span>
          <span className="truncate">{replyToMessage.content}</span>
          <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto" onClick={onCancelReply}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
      
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map((file, index) => (
            <div key={index} className="flex items-center gap-1 bg-muted p-1 rounded text-xs">
              <span className="truncate max-w-[100px]">{file.name}</span>
              <span className="text-muted-foreground">({Math.round(file.size / 1024)}KB)</span>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeAttachment(index)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {isUploading && <div className="text-xs text-muted-foreground">Uploading...</div>}
        </div>
      )}
      
      {/* Message input area */}
      <div className="flex gap-2">
        <div className="flex-1 flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            placeholder="Type a message..."
            className="min-h-[60px] resize-none"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={stopTyping}
          />
          
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            onChange={handleFileSelect}
          />
          
          {/* File attachment button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Send button */}
        <Button
          className="h-10"
          disabled={(!message.trim() && attachments.length === 0) || isUploading}
          onClick={handleSend}
        >
          <Send className="h-4 w-4 mr-2" />
          Send
        </Button>
      </div>
      
      {/* Help text */}
      <div className="text-xs text-muted-foreground mt-1">
        Press Ctrl+Enter to send
      </div>
    </div>
  );
}