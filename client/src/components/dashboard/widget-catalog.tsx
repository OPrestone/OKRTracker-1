import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Clock,
  LineChart,
  ListTodo,
  MessageSquare,
  PieChart,
  PlusCircle,
  Target,
  PieChartIcon,
  Users,
  Calendar,
} from "lucide-react";

interface WidgetCatalogProps {
  onAddWidget: (widgetType: string) => void;
}

interface WidgetType {
  type: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export function WidgetCatalog({ onAddWidget }: WidgetCatalogProps) {
  const availableWidgets: WidgetType[] = [
    {
      type: "progress-summary",
      title: "Progress Summary",
      description: "Shows overall progress and status distribution",
      icon: <PieChartIcon className="h-8 w-8 text-indigo-500" />,
    },
    {
      type: "my-objectives",
      title: "My Objectives",
      description: "List of your assigned objectives and progress",
      icon: <Target className="h-8 w-8 text-blue-500" />,
    },
    {
      type: "recent-check-ins",
      title: "Recent Check-ins",
      description: "Latest check-ins and updates across the organization",
      icon: <MessageSquare className="h-8 w-8 text-green-500" />,
    },
    {
      type: "team-performance",
      title: "Team Performance",
      description: "Overview of team progress and status distribution",
      icon: <Users className="h-8 w-8 text-purple-500" />,
    },
    {
      type: "upcoming-deadlines",
      title: "Upcoming Deadlines",
      description: "Objectives with approaching due dates",
      icon: <Calendar className="h-8 w-8 text-red-500" />,
    },
    {
      type: "recent-activity",
      title: "Recent Activity",
      description: "Activity feed showing recent actions and updates",
      icon: <Clock className="h-8 w-8 text-amber-500" />,
    },
    {
      type: "objective-completion",
      title: "Completion Rate",
      description: "Percentage of completed objectives",
      icon: <PieChart className="h-8 w-8 text-emerald-500" />,
    },
    {
      type: "team-alignment",
      title: "Team Alignment",
      description: "How well team objectives align with company objectives",
      icon: <BarChart3 className="h-8 w-8 text-cyan-500" />,
    },
    {
      type: "key-metrics",
      title: "Key Metrics",
      description: "Important metrics and KPIs over time",
      icon: <LineChart className="h-8 w-8 text-violet-500" />,
    },
  ];

  return (
    <>
      {availableWidgets.map((widget) => (
        <Card key={widget.type} className="border hover:shadow-md transition-shadow">
          <CardContent className="p-3 flex flex-col items-center text-center">
            <div className="p-3 rounded-full bg-muted mb-2">
              {widget.icon}
            </div>
            <h3 className="text-sm font-medium">{widget.title}</h3>
            <p className="text-xs text-gray-500 mb-3 line-clamp-2">{widget.description}</p>
            <Button 
              variant="outline" 
              size="sm"
              className="mt-auto w-full"
              onClick={() => onAddWidget(widget.type)}
            >
              <PlusCircle className="h-3.5 w-3.5 mr-1" />
              Add Widget
            </Button>
          </CardContent>
        </Card>
      ))}
    </>
  );
}