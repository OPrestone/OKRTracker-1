import React, { useState } from 'react';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Check, 
  X, 
  Goal, 
  Calendar, 
  MessageSquare,
  Clock,
  User
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

export type NotificationType = 'mention' | 'assignment' | 'update' | 'reminder' | 'approval';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  createdAt: string; // ISO date string
  read: boolean;
  actionUrl?: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

// Get notification icon based on type
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'mention':
      return <MessageSquare className="h-4 w-4 text-blue-500" />;
    case 'assignment':
      return <User className="h-4 w-4 text-violet-500" />;
    case 'update':
      return <Goal className="h-4 w-4 text-green-500" />;
    case 'reminder':
      return <Clock className="h-4 w-4 text-amber-500" />;
    case 'approval':
      return <Calendar className="h-4 w-4 text-red-500" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
};

// Mock notifications data
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'update',
    title: 'OKR Update',
    description: 'Marketing Team has updated their Q2 objectives progress to 75%',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    read: false,
    sender: {
      id: '101',
      name: 'Sarah Chen',
      avatar: '',
    },
    actionUrl: '/my-okrs'
  },
  {
    id: '2',
    type: 'reminder',
    title: 'Weekly Check-in',
    description: 'Your weekly OKR check-in is due today',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    read: false,
    actionUrl: '/checkins'
  },
  {
    id: '3',
    type: 'mention',
    title: 'Comment Mention',
    description: 'Michael Thompson mentioned you in a comment on "Increase user engagement"',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    read: true,
    sender: {
      id: '102',
      name: 'Michael Thompson',
      avatar: '',
    },
    actionUrl: '/objectives/123'
  },
  {
    id: '4',
    type: 'assignment',
    title: 'New Key Result Assigned',
    description: 'You have been assigned as owner of a new key result',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    read: true,
    actionUrl: '/my-okrs'
  },
  {
    id: '5',
    type: 'approval',
    title: 'OKR Approval Request',
    description: 'Engineering Team is requesting approval for their new quarterly OKRs',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    read: true,
    sender: {
      id: '103',
      name: 'David Wilson',
      avatar: '',
    },
    actionUrl: '/draft-okrs'
  }
];

const NotificationItem = ({ notification, onMarkAsRead }: { notification: Notification, onMarkAsRead: (id: string) => void }) => {
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });
  
  return (
    <div className={cn(
      "p-3 hover:bg-muted transition-colors rounded-md cursor-pointer",
      notification.read ? "opacity-70" : ""
    )}>
      <div className="flex items-start gap-3">
        <div className="mt-1">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={cn(
              "text-sm font-medium truncate",
              !notification.read && "font-semibold"
            )}>
              {notification.title}
            </p>
            {!notification.read && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-5 w-5 rounded-full hover:bg-muted-foreground/20" 
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead(notification.id);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{notification.description}</p>
          <div className="flex items-center mt-1 justify-between">
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
            {notification.sender && (
              <span className="text-xs text-muted-foreground">from {notification.sender.name}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const NotificationDropdown = () => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const filteredNotifications = activeTab === "all" 
    ? notifications 
    : activeTab === "unread" 
      ? notifications.filter(n => !n.read)
      : notifications.filter(n => n.read);
  
  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };
  
  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };
  
  const handleClearAll = () => {
    setNotifications([]);
  };
  
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    handleMarkAsRead(notification.id);
    
    // Navigate to the action URL if provided
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    
    // Close the dropdown
    setOpen(false);
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-2 w-2 rounded-full bg-primary">
              {unreadCount > 9 && (
                <span className="absolute -top-3 -right-3 flex items-center justify-center h-4 w-4 rounded-full bg-primary text-[8px] text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        className="w-[380px] p-0 max-h-[500px] flex flex-col"
      >
        <div className="p-4 pb-2 flex justify-between items-center border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-xs text-muted-foreground"
                onClick={handleMarkAllAsRead}
              >
                <Check className="h-3 w-3 mr-1" />
                Mark all as read
              </Button>
            )}
          </div>
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="border-b px-4">
            <TabsList className="bg-transparent p-0 h-10 w-full justify-start gap-4">
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none h-10 px-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                All
              </TabsTrigger>
              <TabsTrigger 
                value="unread" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none h-10 px-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                Unread
                {unreadCount > 0 && (
                  <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {unreadCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="read" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none h-10 px-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                Read
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="all" className="mt-0 flex-1 overflow-auto px-1">
            <div className="py-1">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                  <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground font-medium">No notifications</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">You're all caught up!</p>
                </div>
              ) : (
                filteredNotifications.map(notification => (
                  <div key={notification.id} onClick={() => handleNotificationClick(notification)}>
                    <NotificationItem 
                      notification={notification} 
                      onMarkAsRead={handleMarkAsRead} 
                    />
                  </div>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="unread" className="mt-0 flex-1 overflow-auto px-1">
            <div className="py-1">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                  <Check className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground font-medium">No unread notifications</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">You're all caught up!</p>
                </div>
              ) : (
                filteredNotifications.map(notification => (
                  <div key={notification.id} onClick={() => handleNotificationClick(notification)}>
                    <NotificationItem 
                      notification={notification} 
                      onMarkAsRead={handleMarkAsRead} 
                    />
                  </div>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="read" className="mt-0 flex-1 overflow-auto px-1">
            <div className="py-1">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                  <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground font-medium">No read notifications</p>
                </div>
              ) : (
                filteredNotifications.map(notification => (
                  <div key={notification.id} onClick={() => handleNotificationClick(notification)}>
                    <NotificationItem 
                      notification={notification} 
                      onMarkAsRead={handleMarkAsRead} 
                    />
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2 flex justify-center">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs w-full text-muted-foreground"
                onClick={handleClearAll}
              >
                Clear all notifications
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationDropdown;