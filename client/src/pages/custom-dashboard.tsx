import { useState, useEffect } from "react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  PlusCircle, X, BarChart3, BarChart, PieChart, LineChart, 
  Calendar, Clock, Settings, Layers, Users, Bell, RefreshCcw,
  LayoutGrid, MoreVertical, ChevronDown, Maximize2, Check
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";

// Widget types
type WidgetType = 
  | "objectives_progress" 
  | "recent_activity" 
  | "upcoming_meetings" 
  | "team_performance" 
  | "okr_health" 
  | "calendar" 
  | "checkins" 
  | "notifications";

// Widget size
type WidgetSize = "small" | "medium" | "large";

// Widget interface
interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  size: WidgetSize;
  data?: any;
  hasActions?: boolean;
  hasSettings?: boolean;
}

// Sample data
const sampleWidgets: Widget[] = [
  {
    id: "w1",
    type: "objectives_progress",
    title: "OKR Progress",
    size: "medium",
    hasActions: true,
    hasSettings: true,
  },
  {
    id: "w2",
    type: "recent_activity",
    title: "Recent Activity",
    size: "medium",
    hasActions: true,
    hasSettings: false,
  },
  {
    id: "w3",
    type: "upcoming_meetings",
    title: "Upcoming Meetings",
    size: "small",
    hasActions: false,
    hasSettings: true,
  },
  {
    id: "w4",
    type: "team_performance",
    title: "Team Performance",
    size: "large",
    hasActions: true,
    hasSettings: true,
  },
  {
    id: "w5",
    type: "okr_health",
    title: "OKR Health Metrics",
    size: "medium",
    hasActions: true,
    hasSettings: true,
  },
  {
    id: "w6",
    type: "calendar",
    title: "Calendar",
    size: "small",
    hasActions: false,
    hasSettings: false,
  },
  {
    id: "w7",
    type: "checkins",
    title: "Recent Check-ins",
    size: "medium",
    hasActions: true,
    hasSettings: true,
  },
  {
    id: "w8",
    type: "notifications",
    title: "Notifications",
    size: "small",
    hasActions: true,
    hasSettings: false,
  },
];

// Sample objectives data
const objectives = [
  { id: 1, title: "Increase Revenue by 20%", progress: 65, status: "on_track", level: "company" },
  { id: 2, title: "Launch New Product Line", progress: 30, status: "at_risk", level: "team" },
  { id: 3, title: "Improve Customer Satisfaction", progress: 85, status: "on_track", level: "company" },
  { id: 4, title: "Reduce Operating Costs", progress: 45, status: "behind", level: "department" },
];

// Sample team data
const teams = [
  { id: 1, name: "Marketing", progress: 72, completion: 4, total: 6 },
  { id: 2, name: "Engineering", progress: 85, completion: 7, total: 8 },
  { id: 3, name: "Sales", progress: 58, completion: 3, total: 6 },
  { id: 4, name: "Product", progress: 90, completion: 9, total: 10 },
];

// Sample recent activity
const activities = [
  { 
    id: 1, 
    type: "comment", 
    user: { name: "Sarah Thompson", avatar: "S" }, 
    content: "Added a comment to 'Increase Revenue by 20%'", 
    time: "10 min ago"
  },
  { 
    id: 2, 
    type: "update", 
    user: { name: "Michael Chen", avatar: "M" }, 
    content: "Updated progress on 'Product Launch Timeline'", 
    time: "25 min ago"
  },
  { 
    id: 3, 
    type: "checkin", 
    user: { name: "Emily Johnson", avatar: "E" }, 
    content: "Completed weekly check-in", 
    time: "1 hour ago"
  },
  { 
    id: 4, 
    type: "new", 
    user: { name: "Robert Wilson", avatar: "R" }, 
    content: "Created new objective 'Optimize Customer Onboarding'", 
    time: "2 hours ago"
  },
];

// Sample upcoming meetings
const meetings = [
  { 
    id: 1, 
    title: "Weekly Team Check-in", 
    time: "Today, 2:00 PM", 
    participants: ["ST", "MC", "EJ", "RW"]
  },
  { 
    id: 2, 
    title: "OKR Review with Leadership", 
    time: "Tomorrow, 10:00 AM", 
    participants: ["JD", "ST", "MC"]
  },
  { 
    id: 3, 
    title: "Project Planning Meeting", 
    time: "May 3, 9:30 AM", 
    participants: ["EJ", "RW", "JD"]
  },
];

// Sample notifications
const notifications = [
  { id: 1, type: "update", content: "3 objectives need your attention", time: "10 min ago" },
  { id: 2, type: "reminder", content: "Weekly check-in due today", time: "1 hour ago" },
  { id: 3, type: "alert", content: "Marketing campaign objective at risk", time: "2 hours ago" },
  { id: 4, type: "message", content: "David sent you a message", time: "Yesterday" },
];

function ObjectivesProgressWidget({ widget }: { widget: Widget }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-sm text-gray-500 mb-1">Overall Progress</div>
          <div className="text-xl font-semibold">67%</div>
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[130px] h-8">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Objectives</SelectItem>
            <SelectItem value="mine">My Objectives</SelectItem>
            <SelectItem value="team">Team Objectives</SelectItem>
            <SelectItem value="company">Company OKRs</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-4 mt-3">
        {objectives.map(objective => (
          <div key={objective.id} className="space-y-1">
            <div className="flex justify-between text-sm">
              <div className="font-medium">{objective.title}</div>
              <Badge 
                className={
                  objective.status === "on_track" ? "bg-green-100 text-green-800" : 
                  objective.status === "at_risk" ? "bg-yellow-100 text-yellow-800" : 
                  "bg-red-100 text-red-800"
                }
              >
                {objective.status.replace("_", " ")}
              </Badge>
            </div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-gray-500">{objective.level}</span>
              <span className="font-medium">{objective.progress}%</span>
            </div>
            <Progress value={objective.progress} className="h-1.5" />
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentActivityWidget({ widget }: { widget: Widget }) {
  return (
    <div className="space-y-4">
      {activities.map(activity => (
        <div key={activity.id} className="flex gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{activity.user.avatar}</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm">{activity.content}</div>
            <div className="text-xs text-gray-500 mt-1">{activity.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function UpcomingMeetingsWidget({ widget }: { widget: Widget }) {
  return (
    <div className="space-y-3">
      {meetings.map(meeting => (
        <div key={meeting.id} className="border rounded-md p-2">
          <div className="font-medium text-sm">{meeting.title}</div>
          <div className="flex items-center text-xs text-gray-500 mt-1">
            <Clock className="h-3 w-3 mr-1" />
            {meeting.time}
          </div>
          <div className="flex mt-2 space-x-1">
            {meeting.participants.map((participant, i) => (
              <Avatar key={i} className="h-6 w-6">
                <AvatarFallback className="text-xs">{participant}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TeamPerformanceWidget({ widget }: { widget: Widget }) {
  return (
    <div className="space-y-5">
      <div className="flex justify-between">
        <Tabs defaultValue="progress" className="w-full">
          <TabsList>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="completion">Completion</TabsTrigger>
          </TabsList>
          <TabsContent value="progress" className="space-y-4 pt-3">
            {teams.map(team => (
              <div key={team.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <div className="font-medium">{team.name} Team</div>
                  <div className="font-medium">{team.progress}%</div>
                </div>
                <Progress value={team.progress} className="h-2" />
              </div>
            ))}
          </TabsContent>
          <TabsContent value="completion" className="space-y-4 pt-3">
            {teams.map(team => (
              <div key={team.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <div className="font-medium">{team.name} Team</div>
                  <div className="text-sm">
                    <span className="font-medium">{team.completion}</span>
                    <span className="text-gray-500">/{team.total} objectives</span>
                  </div>
                </div>
                <Progress value={(team.completion / team.total) * 100} className="h-2" />
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function OKRHealthWidget({ widget }: { widget: Widget }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="col-span-1">
        <CardContent className="p-4">
          <div className="text-gray-500 text-xs mb-1">Objective Completion</div>
          <div className="text-2xl font-bold">64%</div>
          <div className="flex items-center text-xs text-green-600 mt-1">
            <ChevronDown className="h-3 w-3 mr-1 transform rotate-180" />
            <span>+5% from last period</span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="col-span-1">
        <CardContent className="p-4">
          <div className="text-gray-500 text-xs mb-1">Alignment Score</div>
          <div className="text-2xl font-bold">83%</div>
          <div className="flex items-center text-xs text-green-600 mt-1">
            <ChevronDown className="h-3 w-3 mr-1 transform rotate-180" />
            <span>+2% from last period</span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="col-span-1">
        <CardContent className="p-4">
          <div className="text-gray-500 text-xs mb-1">Check-in Rate</div>
          <div className="text-2xl font-bold">78%</div>
          <div className="flex items-center text-xs text-red-600 mt-1">
            <ChevronDown className="h-3 w-3 mr-1" />
            <span>-3% from last period</span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="col-span-1">
        <CardContent className="p-4">
          <div className="text-gray-500 text-xs mb-1">At-Risk OKRs</div>
          <div className="text-2xl font-bold">12%</div>
          <div className="flex items-center text-xs text-green-600 mt-1">
            <ChevronDown className="h-3 w-3 mr-1" />
            <span>-2% from last period</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CalendarWidget({ widget }: { widget: Widget }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">May 2025</div>
      <div className="grid grid-cols-7 gap-1 text-center">
        <div className="text-xs text-gray-500">Su</div>
        <div className="text-xs text-gray-500">Mo</div>
        <div className="text-xs text-gray-500">Tu</div>
        <div className="text-xs text-gray-500">We</div>
        <div className="text-xs text-gray-500">Th</div>
        <div className="text-xs text-gray-500">Fr</div>
        <div className="text-xs text-gray-500">Sa</div>
        
        <div className="text-xs text-gray-400">28</div>
        <div className="text-xs text-gray-400">29</div>
        <div className="text-xs text-gray-400">30</div>
        <div className="text-xs">1</div>
        <div className="text-xs">2</div>
        <div className="text-xs bg-blue-100 rounded-full">3</div>
        <div className="text-xs">4</div>
        
        <div className="text-xs">5</div>
        <div className="text-xs">6</div>
        <div className="text-xs">7</div>
        <div className="text-xs">8</div>
        <div className="text-xs bg-green-100 rounded-full">9</div>
        <div className="text-xs">10</div>
        <div className="text-xs">11</div>
        
        <div className="text-xs">12</div>
        <div className="text-xs">13</div>
        <div className="text-xs bg-purple-100 rounded-full">14</div>
        <div className="text-xs">15</div>
        <div className="text-xs">16</div>
        <div className="text-xs">17</div>
        <div className="text-xs">18</div>
        
        <div className="text-xs">19</div>
        <div className="text-xs bg-blue-100 rounded-full">20</div>
        <div className="text-xs">21</div>
        <div className="text-xs">22</div>
        <div className="text-xs">23</div>
        <div className="text-xs">24</div>
        <div className="text-xs">25</div>
        
        <div className="text-xs">26</div>
        <div className="text-xs">27</div>
        <div className="text-xs">28</div>
        <div className="text-xs bg-red-100 rounded-full">29</div>
        <div className="text-xs">30</div>
        <div className="text-xs">31</div>
        <div className="text-xs text-gray-400">1</div>
      </div>
    </div>
  );
}

function CheckinsWidget({ widget }: { widget: Widget }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm font-medium">Recent Check-ins</div>
        <Badge variant="outline">12 new</Badge>
      </div>
      
      {[1, 2, 3].map(i => (
        <div key={i} className="border rounded-md p-3">
          <div className="flex justify-between">
            <div className="font-medium text-sm">Team Check-in</div>
            <Badge className="bg-blue-100 text-blue-800">Weekly</Badge>
          </div>
          <div className="text-xs text-gray-500 mt-1">Marketing Team • 2 days ago</div>
          <Separator className="my-2" />
          <div className="text-sm mt-1">Completed sprint planning for Q2 campaign launches. Identified potential bottlenecks in the content creation process.</div>
          <div className="flex gap-1 mt-2">
            <Badge variant="outline" className="text-xs">strategy</Badge>
            <Badge variant="outline" className="text-xs">marketing</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

function NotificationsWidget({ widget }: { widget: Widget }) {
  return (
    <div className="space-y-2">
      {notifications.map(notification => (
        <div key={notification.id} className="flex items-start gap-3 p-2 rounded hover:bg-gray-50">
          <div className={`
            rounded-full p-1.5 
            ${notification.type === "update" ? "bg-blue-100" : 
              notification.type === "reminder" ? "bg-purple-100" : 
              notification.type === "alert" ? "bg-red-100" : "bg-green-100"}
          `}>
            {notification.type === "update" ? <RefreshCcw className="h-3 w-3 text-blue-600" /> : 
              notification.type === "reminder" ? <Clock className="h-3 w-3 text-purple-600" /> : 
              notification.type === "alert" ? <Bell className="h-3 w-3 text-red-600" /> : 
              <Check className="h-3 w-3 text-green-600" />}
          </div>
          <div className="flex-1">
            <div className="text-sm">{notification.content}</div>
            <div className="text-xs text-gray-500 mt-0.5">{notification.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RenderWidget({ widget }: { widget: Widget }) {
  switch (widget.type) {
    case "objectives_progress":
      return <ObjectivesProgressWidget widget={widget} />;
    case "recent_activity":
      return <RecentActivityWidget widget={widget} />;
    case "upcoming_meetings":
      return <UpcomingMeetingsWidget widget={widget} />;
    case "team_performance":
      return <TeamPerformanceWidget widget={widget} />;
    case "okr_health":
      return <OKRHealthWidget widget={widget} />;
    case "calendar":
      return <CalendarWidget widget={widget} />;
    case "checkins":
      return <CheckinsWidget widget={widget} />;
    case "notifications":
      return <NotificationsWidget widget={widget} />;
    default:
      return <div>Unknown widget type</div>;
  }
}

function SortableWidget({ widget }: { widget: Widget }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        ${widget.size === "small" ? "col-span-1" : 
          widget.size === "medium" ? "col-span-2" : 
          "col-span-3"}
        cursor-move
      `}
    >
      <Card className="h-full">
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
            <div className="flex items-center space-x-1">
              {widget.hasSettings && (
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full">
                  <Settings className="h-4 w-4 text-gray-500" />
                </Button>
              )}
              
              {widget.hasActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full">
                      <MoreVertical className="h-4 w-4 text-gray-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Refresh</DropdownMenuItem>
                    <DropdownMenuItem>Expand</DropdownMenuItem>
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">Remove</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 py-3">
          <RenderWidget widget={widget} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function CustomDashboard() {
  const [layout, setLayout] = useState<Widget[]>([]);
  const [availableWidgets, setAvailableWidgets] = useState<Widget[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  useEffect(() => {
    // Initialize layout from saved settings or use default
    setLayout([
      sampleWidgets[0], // objectives_progress
      sampleWidgets[1], // recent_activity
      sampleWidgets[2], // upcoming_meetings
      sampleWidgets[4], // okr_health
      sampleWidgets[6], // checkins
    ]);
    
    // Set available widgets
    setAvailableWidgets([
      sampleWidgets[3], // team_performance
      sampleWidgets[5], // calendar
      sampleWidgets[7], // notifications
    ]);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    if (activeId === overId) {
      setActiveId(null);
      return;
    }
    
    const oldIndex = layout.findIndex(widget => widget.id === activeId);
    const newIndex = layout.findIndex(widget => widget.id === overId);
    
    setLayout(arrayMove(layout, oldIndex, newIndex));
    setActiveId(null);
  };

  const addWidget = (widgetId: string) => {
    const widgetToAdd = availableWidgets.find(w => w.id === widgetId);
    if (!widgetToAdd) return;
    
    setLayout([...layout, widgetToAdd]);
    setAvailableWidgets(availableWidgets.filter(w => w.id !== widgetId));
  };

  const removeWidget = (widgetId: string) => {
    const widgetToRemove = layout.find(w => w.id === widgetId);
    if (!widgetToRemove) return;
    
    setLayout(layout.filter(w => w.id !== widgetId));
    setAvailableWidgets([...availableWidgets, widgetToRemove]);
  };

  const saveDashboard = () => {
    // Here you would typically save to backend
    setIsEditing(false);
    console.log("Dashboard layout saved:", layout);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Custom Dashboard</h1>
            <p className="text-neutral-600 mt-1">
              Personalize your dashboard with the widgets that matter most to you
            </p>
          </div>
          
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <Button 
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button onClick={saveDashboard}>
                  Save Layout
                </Button>
              </>
            ) : (
              <Button 
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => setIsEditing(true)}
              >
                <LayoutGrid className="h-4 w-4" />
                Customize
              </Button>
            )}
          </div>
        </div>
        
        {isEditing && (
          <div className="mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Available Widgets</CardTitle>
                <CardDescription>Drag these widgets to your dashboard</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 flex-wrap">
                  {availableWidgets.map(widget => (
                    <div key={widget.id} className="border rounded-md p-3 flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-md">
                        {widget.type === "team_performance" ? <BarChart className="h-5 w-5 text-gray-600" /> :
                         widget.type === "calendar" ? <Calendar className="h-5 w-5 text-gray-600" /> :
                         widget.type === "notifications" ? <Bell className="h-5 w-5 text-gray-600" /> :
                         <Layers className="h-5 w-5 text-gray-600" />}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{widget.title}</div>
                        <div className="text-xs text-gray-500">
                          {widget.size === "small" ? "Small" : 
                           widget.size === "medium" ? "Medium" : "Large"} widget
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-2 h-8 w-8 p-0 rounded-full"
                        onClick={() => addWidget(widget.id)}
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        <div className="bg-gray-50 rounded-lg p-4 min-h-[calc(100vh-250px)]">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToParentElement]}
          >
            <div className="grid grid-cols-3 gap-4">
              <SortableContext items={layout.map(widget => widget.id)}>
                {layout.map(widget => (
                  <SortableWidget key={widget.id} widget={widget} />
                ))}
              </SortableContext>
              
              {isEditing && layout.length === 0 && (
                <div className="col-span-3 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                  <div>
                    <div className="text-lg font-medium text-gray-600">Your dashboard is empty</div>
                    <div className="text-sm text-gray-500 mt-1">Add widgets from the available list above</div>
                  </div>
                </div>
              )}
              
              <DragOverlay>
                {activeId ? (
                  <div className={`
                    ${layout.find(w => w.id === activeId)?.size === "small" ? "w-[calc(100%/3-1rem)]" : 
                     layout.find(w => w.id === activeId)?.size === "medium" ? "w-[calc(2*100%/3-1rem)]" : 
                     "w-full"}
                    opacity-75
                  `}>
                    <Card>
                      <CardHeader className="pb-2 pt-4 px-4">
                        <CardTitle className="text-sm font-medium">
                          {layout.find(w => w.id === activeId)?.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 py-3">
                        <div className="bg-gray-100 h-20 rounded animate-pulse"></div>
                      </CardContent>
                    </Card>
                  </div>
                ) : null}
              </DragOverlay>
            </div>
          </DndContext>
          
          {isEditing && layout.length > 0 && (
            <div className="mt-4 bg-white rounded-lg border p-3">
              <div className="text-sm font-medium mb-2">Current Widgets</div>
              <div className="grid grid-cols-2 gap-2">
                {layout.map(widget => (
                  <div key={widget.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">{widget.title}</div>
                      <Badge variant="outline" className="text-xs">
                        {widget.size}
                      </Badge>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0 text-gray-500 hover:text-red-600"
                      onClick={() => removeWidget(widget.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}