import { useState } from "react";
import { useChat } from "@/hooks/use-chat";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { MessageSquarePlus, Users } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

export function ChatSidebar() {
  const { user } = useAuth();
  const { chatRooms, selectRoom, currentRoom, createChatRoom } = useChat();
  const [open, setOpen] = useState(false);
  const [chatName, setChatName] = useState("");
  const [chatType, setChatType] = useState("direct");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  // Fetch users for chat creation
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    enabled: !!user,
  });

  // Filter out current user
  const otherUsers = users.filter((u: any) => u.id !== user?.id);

  const handleCreateRoom = async () => {
    if (!chatName.trim()) return;
    
    try {
      await createChatRoom(chatName, chatType, selectedUsers);
      setChatName("");
      setChatType("direct");
      setSelectedUsers([]);
      setOpen(false);
    } catch (error) {
      console.error("Failed to create chat room:", error);
    }
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div className="w-64 border-r h-full flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="font-semibold text-lg">Conversations</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <MessageSquarePlus className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Conversation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Chat name"
                  value={chatName}
                  onChange={(e) => setChatName(e.target.value)}
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
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>Participants</Label>
                <ScrollArea className="h-[200px] border rounded-md p-2">
                  {otherUsers.map((u: any) => (
                    <div key={u.id} className="flex items-center space-x-2 py-1">
                      <Checkbox
                        id={`user-${u.id}`}
                        checked={selectedUsers.includes(u.id)}
                        onCheckedChange={() => toggleUserSelection(u.id)}
                      />
                      <Label htmlFor={`user-${u.id}`} className="cursor-pointer">
                        {u.firstName} {u.lastName}
                      </Label>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateRoom} disabled={!chatName.trim() || selectedUsers.length === 0}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {chatRooms.map((room) => (
            <Button
              key={room.id}
              variant={currentRoom?.id === room.id ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => selectRoom(room.id)}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                {room.type === "group" ? (
                  <Users className="shrink-0 h-5 w-5" />
                ) : (
                  <div className="shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary">
                    {room.name[0].toUpperCase()}
                  </div>
                )}
                <span className="truncate">{room.name}</span>
                {room.unreadCount ? (
                  <span className="ml-auto bg-primary text-primary-foreground rounded-full h-5 min-w-5 px-1 text-xs flex items-center justify-center">
                    {room.unreadCount}
                  </span>
                ) : null}
              </div>
            </Button>
          ))}
          {chatRooms.length === 0 && (
            <div className="text-sm text-muted-foreground p-4 text-center">
              No conversations yet
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}