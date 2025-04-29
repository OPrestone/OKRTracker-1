import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Award,
  TrendingUp,
  Trophy,
  Target,
  BarChart as BarChartIcon,
  PieChart,
  LineChart as LineChartIcon,
} from "lucide-react";

// Mock data for individual users
const USERS = [
  {
    id: "1",
    name: "Alex Morgan",
    role: "Product Manager",
    avatar: "",
    team: "Product Team",
    initials: "AM",
    email: "alex.morgan@example.com",
  },
  {
    id: "2",
    name: "Jamie Chen",
    role: "Marketing Director",
    avatar: "",
    team: "Marketing Team",
    initials: "JC",
    email: "jamie.chen@example.com",
  },
  {
    id: "3",
    name: "Taylor Wilson",
    role: "Lead Developer",
    avatar: "",
    team: "Development Team",
    initials: "TW",
    email: "taylor.wilson@example.com",
  },
  {
    id: "4",
    name: "Jordan Lee",
    role: "Customer Success Manager",
    avatar: "",
    team: "Customer Support",
    initials: "JL",
    email: "jordan.lee@example.com",
  },
  {
    id: "5",
    name: "Casey Smith",
    role: "Sales Manager",
    avatar: "",
    team: "Sales Team",
    initials: "CS",
    email: "casey.smith@example.com",
  },
];

// Mock data for user objectives
interface ObjectiveType {
  id: string;
  title: string;
  description: string;
  progress: number;
  status: 'on-track' | 'at-risk' | 'behind' | 'completed';
  dueDate: string;
  keyResults: KeyResultType[];
  priority: 'high' | 'medium' | 'low';
  teamId: string;
  ownerId: string;
}

interface KeyResultType {
  id: string;
  title: string;
  progress: number;
  target: string;
  current: string;
  metric: string;
  status: 'on-track' | 'at-risk' | 'behind' | 'completed';
}

const MOCK_OBJECTIVES: Record<string, ObjectiveType[]> = {
  "1": [
    {
      id: "obj1",
      title: "Improve product onboarding experience",
      description: "Redesign the onboarding flow to increase user activation rate",
      progress: 75,
      status: 'on-track',
      dueDate: "2025-06-30",
      priority: 'high',
      teamId: "product",
      ownerId: "1",
      keyResults: [
        {
          id: "kr1",
          title: "Increase activation rate from 60% to 80%",
          progress: 70,
          target: "80%",
          current: "76%",
          metric: "Activation Rate",
          status: 'on-track',
        },
        {
          id: "kr2",
          title: "Reduce time to value from 10 minutes to 2 minutes",
          progress: 90,
          target: "2 minutes",
          current: "3 minutes",
          metric: "Time to Value",
          status: 'on-track',
        },
        {
          id: "kr3",
          title: "Achieve a user satisfaction score of 4.5/5 for the new onboarding",
          progress: 65,
          target: "4.5/5",
          current: "4.1/5",
          metric: "User Satisfaction",
          status: 'at-risk',
        }
      ]
    },
    {
      id: "obj2",
      title: "Launch new analytics dashboard",
      description: "Create a new analytics dashboard with enhanced reporting capabilities",
      progress: 40,
      status: 'at-risk',
      dueDate: "2025-07-15",
      priority: 'medium',
      teamId: "product",
      ownerId: "1",
      keyResults: [
        {
          id: "kr4",
          title: "Complete development of 5 new visualization types",
          progress: 60,
          target: "5 types",
          current: "3 types",
          metric: "Development Completion",
          status: 'on-track',
        },
        {
          id: "kr5",
          title: "Achieve 50% adoption rate within first month",
          progress: 20,
          target: "50%",
          current: "10%",
          metric: "Adoption Rate",
          status: 'behind',
        }
      ]
    },
    {
      id: "obj3",
      title: "Reduce customer churn rate",
      description: "Implement retention strategies to reduce monthly customer churn",
      progress: 85,
      status: 'on-track',
      dueDate: "2025-05-30",
      priority: 'high',
      teamId: "product",
      ownerId: "1",
      keyResults: [
        {
          id: "kr6",
          title: "Reduce churn rate from 5% to 2%",
          progress: 90,
          target: "2%",
          current: "2.3%",
          metric: "Churn Rate",
          status: 'on-track',
        },
        {
          id: "kr7",
          title: "Implement 3 new retention features",
          progress: 100,
          target: "3 features",
          current: "3 features",
          metric: "Feature Development",
          status: 'completed',
        },
        {
          id: "kr8",
          title: "Increase customer lifetime value by 25%",
          progress: 65,
          target: "25% increase",
          current: "16% increase",
          metric: "Customer LTV",
          status: 'at-risk',
        }
      ]
    }
  ],
  "2": [
    {
      id: "obj4",
      title: "Expand social media presence",
      description: "Grow our audience across social media platforms",
      progress: 60,
      status: 'on-track',
      dueDate: "2025-08-15",
      priority: 'high',
      teamId: "marketing",
      ownerId: "2",
      keyResults: [
        {
          id: "kr9",
          title: "Increase Instagram followers from 10K to 25K",
          progress: 65,
          target: "25K followers",
          current: "19.7K followers",
          metric: "Instagram Followers",
          status: 'on-track',
        },
        {
          id: "kr10",
          title: "Achieve 5K Twitter followers",
          progress: 40,
          target: "5K followers",
          current: "2K followers",
          metric: "Twitter Followers",
          status: 'at-risk',
        }
      ]
    }
  ],
  "3": [
    {
      id: "obj5",
      title: "Optimize application performance",
      description: "Improve load times and responsiveness across the application",
      progress: 90,
      status: 'on-track',
      dueDate: "2025-05-10",
      priority: 'high',
      teamId: "development",
      ownerId: "3",
      keyResults: [
        {
          id: "kr11",
          title: "Reduce page load time from 3s to 1s",
          progress: 85,
          target: "1s",
          current: "1.3s",
          metric: "Page Load Time",
          status: 'on-track',
        },
        {
          id: "kr12",
          title: "Improve Google Lighthouse performance score from 70 to 95",
          progress: 95,
          target: "95 score",
          current: "93 score",
          metric: "Lighthouse Score",
          status: 'on-track',
        }
      ]
    }
  ],
  "4": [
    {
      id: "obj6",
      title: "Improve customer satisfaction",
      description: "Enhance the customer support experience to improve satisfaction metrics",
      progress: 35,
      status: 'behind',
      dueDate: "2025-06-20",
      priority: 'high',
      teamId: "support",
      ownerId: "4",
      keyResults: [
        {
          id: "kr13",
          title: "Increase CSAT score from 3.8 to 4.5",
          progress: 20,
          target: "4.5 CSAT",
          current: "4.0 CSAT",
          metric: "CSAT Score",
          status: 'behind',
        },
        {
          id: "kr14",
          title: "Reduce average response time from 8 hours to 2 hours",
          progress: 50,
          target: "2 hours",
          current: "5 hours",
          metric: "Response Time",
          status: 'at-risk',
        }
      ]
    }
  ],
  "5": [
    {
      id: "obj7",
      title: "Increase new business revenue",
      description: "Drive growth through new client acquisition",
      progress: 30,
      status: 'behind',
      dueDate: "2025-09-30",
      priority: 'high',
      teamId: "sales",
      ownerId: "5",
      keyResults: [
        {
          id: "kr15",
          title: "Close 15 new enterprise deals",
          progress: 40,
          target: "15 deals",
          current: "6 deals",
          metric: "Enterprise Deals",
          status: 'behind',
        },
        {
          id: "kr16",
          title: "Achieve $2M in new business revenue",
          progress: 25,
          target: "$2M",
          current: "$500K",
          metric: "New Revenue",
          status: 'behind',
        }
      ]
    }
  ]
};

// Performance over time data
interface PerformanceData {
  month: string;
  progress: number;
}

interface CompetencyData {
  subject: string;
  A: number;
  fullMark: number;
}

interface FeedbackData {
  date: string;
  content: string;
  rating: number;
  from: string;
}

type PerformanceHistoryType = Record<string, PerformanceData[]>;
type CompetencyDataType = Record<string, CompetencyData[]>;
type FeedbackHistoryType = Record<string, FeedbackData[]>;

const PERFORMANCE_HISTORY: PerformanceHistoryType = {
  "1": [
    { month: "Jan", progress: 20 },
    { month: "Feb", progress: 35 },
    { month: "Mar", progress: 45 },
    { month: "Apr", progress: 60 },
    { month: "May", progress: 68 },
    { month: "Jun", progress: 74 },
    { month: "Jul", progress: 79 },
    { month: "Aug", progress: 83 },
  ],
  "2": [
    { month: "Jan", progress: 15 },
    { month: "Feb", progress: 25 },
    { month: "Mar", progress: 40 },
    { month: "Apr", progress: 50 },
    { month: "May", progress: 55 },
    { month: "Jun", progress: 58 },
    { month: "Jul", progress: 62 },
    { month: "Aug", progress: 65 },
  ],
  "3": [
    { month: "Jan", progress: 30 },
    { month: "Feb", progress: 45 },
    { month: "Mar", progress: 60 },
    { month: "Apr", progress: 70 },
    { month: "May", progress: 78 },
    { month: "Jun", progress: 85 },
    { month: "Jul", progress: 88 },
    { month: "Aug", progress: 92 },
  ],
  "4": [
    { month: "Jan", progress: 10 },
    { month: "Feb", progress: 15 },
    { month: "Mar", progress: 20 },
    { month: "Apr", progress: 22 },
    { month: "May", progress: 25 },
    { month: "Jun", progress: 30 },
    { month: "Jul", progress: 34 },
    { month: "Aug", progress: 38 },
  ],
  "5": [
    { month: "Jan", progress: 5 },
    { month: "Feb", progress: 10 },
    { month: "Mar", progress: 15 },
    { month: "Apr", progress: 18 },
    { month: "May", progress: 20 },
    { month: "Jun", progress: 22 },
    { month: "Jul", progress: 26 },
    { month: "Aug", progress: 32 },
  ]
};

// Competency radar chart data
const COMPETENCY_DATA: CompetencyDataType = {
  "1": [
    { subject: 'Strategy', A: 85, fullMark: 100 },
    { subject: 'Execution', A: 90, fullMark: 100 },
    { subject: 'Communication', A: 75, fullMark: 100 },
    { subject: 'Leadership', A: 80, fullMark: 100 },
    { subject: 'Technical', A: 70, fullMark: 100 },
    { subject: 'Innovation', A: 95, fullMark: 100 },
  ],
  "2": [
    { subject: 'Strategy', A: 90, fullMark: 100 },
    { subject: 'Execution', A: 75, fullMark: 100 },
    { subject: 'Communication', A: 95, fullMark: 100 },
    { subject: 'Leadership', A: 85, fullMark: 100 },
    { subject: 'Technical', A: 60, fullMark: 100 },
    { subject: 'Innovation', A: 80, fullMark: 100 },
  ],
  "3": [
    { subject: 'Strategy', A: 70, fullMark: 100 },
    { subject: 'Execution', A: 95, fullMark: 100 },
    { subject: 'Communication', A: 65, fullMark: 100 },
    { subject: 'Leadership', A: 75, fullMark: 100 },
    { subject: 'Technical', A: 98, fullMark: 100 },
    { subject: 'Innovation', A: 88, fullMark: 100 },
  ],
  "4": [
    { subject: 'Strategy', A: 60, fullMark: 100 },
    { subject: 'Execution', A: 70, fullMark: 100 },
    { subject: 'Communication', A: 90, fullMark: 100 },
    { subject: 'Leadership', A: 65, fullMark: 100 },
    { subject: 'Technical', A: 50, fullMark: 100 },
    { subject: 'Innovation', A: 55, fullMark: 100 },
  ],
  "5": [
    { subject: 'Strategy', A: 80, fullMark: 100 },
    { subject: 'Execution', A: 75, fullMark: 100 },
    { subject: 'Communication', A: 80, fullMark: 100 },
    { subject: 'Leadership', A: 90, fullMark: 100 },
    { subject: 'Technical', A: 40, fullMark: 100 },
    { subject: 'Innovation', A: 65, fullMark: 100 },
  ],
};

// Feedback history
const FEEDBACK_HISTORY: FeedbackHistoryType = {
  "1": [
    { date: "Aug 15, 2025", content: "Excellent job leading the product team through the new feature rollout. Your strategic planning was exceptional.", rating: 5, from: "Director of Product" },
    { date: "Jul 10, 2025", content: "Good progress on the onboarding redesign. Consider involving customer support earlier in the design process.", rating: 4, from: "VP of Customer Experience" },
    { date: "Jun 05, 2025", content: "Your leadership on the analytics dashboard project has been transformative. Keep up the momentum.", rating: 5, from: "CEO" },
  ],
  "2": [
    { date: "Aug 20, 2025", content: "The social media campaign exceeded expectations. Great work coordinating across teams.", rating: 5, from: "CMO" },
    { date: "Jul 25, 2025", content: "Good content strategy, but we need to improve on conversion metrics.", rating: 3, from: "Head of Growth" },
  ],
  "3": [
    { date: "Aug 10, 2025", content: "The performance optimization work has made a significant impact. Impressive results.", rating: 5, from: "CTO" },
    { date: "Jul 01, 2025", content: "Excellent technical leadership on the backend refactoring project.", rating: 5, from: "VP of Engineering" },
    { date: "Jun 15, 2025", content: "Code quality has improved dramatically under your leadership.", rating: 4, from: "Senior Architect" },
  ],
  "4": [
    { date: "Aug 05, 2025", content: "Customer satisfaction metrics are still below target. Need to see more progress.", rating: 2, from: "COO" },
    { date: "Jul 20, 2025", content: "Good effort on implementing the new support workflow.", rating: 3, from: "Director of Operations" },
  ],
  "5": [
    { date: "Aug 25, 2025", content: "Sales targets are significantly behind. Need to reassess strategy.", rating: 2, from: "VP of Sales" },
    { date: "Jul 15, 2025", content: "Good relationship building with potential clients, but need to improve on closing.", rating: 3, from: "Sales Director" },
  ]
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'on-track':
      return 'bg-green-500';
    case 'at-risk':
      return 'bg-yellow-500';
    case 'behind':
      return 'bg-red-500';
    case 'completed':
      return 'bg-blue-500';
    default:
      return 'bg-gray-500';
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'on-track':
      return <Badge className="bg-green-100 text-green-800">On Track</Badge>;
    case 'at-risk':
      return <Badge className="bg-yellow-100 text-yellow-800">At Risk</Badge>;
    case 'behind':
      return <Badge className="bg-red-100 text-red-800">Behind</Badge>;
    case 'completed':
      return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
  }
};

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'high':
      return <Badge className="bg-red-100 text-red-800">High Priority</Badge>;
    case 'medium':
      return <Badge className="bg-blue-100 text-blue-800">Medium Priority</Badge>;
    case 'low':
      return <Badge className="bg-green-100 text-green-800">Low Priority</Badge>;
    default:
      return null;
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }).format(date);
};

const getRatingStars = (rating: number) => {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
};

export function IndividualProgress() {
  const [selectedUser, setSelectedUser] = useState(USERS[0]);
  const [activeTab, setActiveTab] = useState("objectives");
  const [expandedObjectives, setExpandedObjectives] = useState<Record<string, boolean>>({});

  const handleUserChange = (userId: string) => {
    const user = USERS.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setExpandedObjectives({});
    }
  };

  const toggleObjectiveExpansion = (objectiveId: string) => {
    setExpandedObjectives(prev => ({
      ...prev,
      [objectiveId]: !prev[objectiveId]
    }));
  };

  const userObjectives = MOCK_OBJECTIVES[selectedUser.id] || [];
  const performanceData = PERFORMANCE_HISTORY[selectedUser.id] || [];
  const competencyData = COMPETENCY_DATA[selectedUser.id] || [];
  const feedbackData = FEEDBACK_HISTORY[selectedUser.id] || [];

  // Calculate overall progress
  const calculateOverallProgress = () => {
    if (userObjectives.length === 0) return 0;
    const sum = userObjectives.reduce((acc, obj) => acc + obj.progress, 0);
    return Math.round(sum / userObjectives.length);
  };

  // Stats for objectives
  const getObjectiveStats = () => {
    const total = userObjectives.length;
    const completed = userObjectives.filter(obj => obj.progress === 100).length;
    const onTrack = userObjectives.filter(obj => obj.status === 'on-track' && obj.progress < 100).length;
    const atRisk = userObjectives.filter(obj => obj.status === 'at-risk').length;
    const behind = userObjectives.filter(obj => obj.status === 'behind').length;
    
    return { total, completed, onTrack, atRisk, behind };
  };

  const objectiveStats = getObjectiveStats();
  const overallProgress = calculateOverallProgress();

  return (
    <div className="space-y-6">
      {/* User selection and overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Team Member</CardTitle>
            <CardDescription>Select a team member to view progress</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedUser.id} onValueChange={handleUserChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a team member" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Team Members</SelectLabel>
                  {USERS.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} - {user.team}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <div className="mt-6 flex flex-col items-center">
              <Avatar className="h-20 w-20 mb-4">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {selectedUser.initials}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-medium text-lg">{selectedUser.name}</h3>
              <p className="text-muted-foreground text-sm">{selectedUser.role}</p>
              <Badge className="mt-2">{selectedUser.team}</Badge>
              
              <div className="w-full mt-6 pt-4 border-t">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm font-medium">{overallProgress}%</span>
                </div>
                <Progress value={overallProgress} className="h-2" />
                
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs">Total Objectives</span>
                    <span className="text-xs font-medium">{objectiveStats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs">Completed</span>
                    <span className="text-xs font-medium">{objectiveStats.completed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs">On Track</span>
                    <span className="text-xs font-medium">{objectiveStats.onTrack}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs">At Risk</span>
                    <span className="text-xs font-medium">{objectiveStats.atRisk}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs">Behind</span>
                    <span className="text-xs font-medium">{objectiveStats.behind}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle>Individual Performance Dashboard</CardTitle>
            <CardDescription>
              Track progress and performance metrics for {selectedUser.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="objectives">Objectives</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="competencies">Competencies</TabsTrigger>
                <TabsTrigger value="feedback">Feedback</TabsTrigger>
              </TabsList>
              
              {/* Objectives Tab */}
              <TabsContent value="objectives" className="space-y-4 pt-4">
                {userObjectives.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No objectives assigned to this user
                  </div>
                ) : (
                  userObjectives.map(objective => (
                    <Card key={objective.id} className="border-l-4" style={{ borderLeftColor: objective.status === 'on-track' ? '#22c55e' : objective.status === 'at-risk' ? '#f59e0b' : '#ef4444' }}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{objective.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {objective.description}
                            </CardDescription>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getPriorityBadge(objective.priority)}
                            {getStatusBadge(objective.status)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium">Progress</span>
                              <span className="text-sm font-medium">{objective.progress}%</span>
                            </div>
                            <Progress value={objective.progress} className="h-2" />
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                              <span>Due: {formatDate(objective.dueDate)}</span>
                            </div>
                            <div className="flex items-center">
                              <Target className="mr-2 h-4 w-4 text-gray-500" />
                              <span>{objective.keyResults.length} Key Results</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Button 
                          variant="ghost" 
                          className="w-full justify-between"
                          onClick={() => toggleObjectiveExpansion(objective.id)}
                        >
                          {expandedObjectives[objective.id] ? 'Hide Key Results' : 'View Key Results'}
                          <ChevronRight className={`h-4 w-4 transition-transform ${expandedObjectives[objective.id] ? 'rotate-90' : ''}`} />
                        </Button>
                      </CardFooter>
                      
                      {expandedObjectives[objective.id] && (
                        <div className="px-6 pb-6">
                          <h4 className="font-medium text-sm mb-3">Key Results</h4>
                          <div className="space-y-4">
                            {objective.keyResults.map(kr => (
                              <div key={kr.id} className="bg-muted/50 p-3 rounded-md">
                                <div className="flex justify-between items-start mb-2">
                                  <h5 className="font-medium text-sm">{kr.title}</h5>
                                  {getStatusBadge(kr.status)}
                                </div>
                                <div className="mb-2">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs">Progress</span>
                                    <span className="text-xs font-medium">{kr.progress}%</span>
                                  </div>
                                  <Progress value={kr.progress} className="h-1.5" />
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
                                  <div className="flex items-center">
                                    <span className="text-gray-500 mr-1">Target:</span>
                                    <span>{kr.target}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="text-gray-500 mr-1">Current:</span>
                                    <span>{kr.current}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="text-gray-500 mr-1">Metric:</span>
                                    <span>{kr.metric}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  ))
                )}
              </TabsContent>
              
              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-4 pt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Performance Trend</CardTitle>
                    <CardDescription>Progress over the last 8 months</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip formatter={(value) => [`${value}%`, 'Progress']} />
                        <Legend />
                        <Line type="monotone" dataKey="progress" stroke="#6366f1" strokeWidth={2} activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Status Distribution</CardTitle>
                      <CardDescription>Objectives by status</CardDescription>
                    </CardHeader>
                    <CardContent className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={[
                            { name: 'On Track', value: objectiveStats.onTrack, fill: '#22c55e' },
                            { name: 'At Risk', value: objectiveStats.atRisk, fill: '#f59e0b' },
                            { name: 'Behind', value: objectiveStats.behind, fill: '#ef4444' },
                            { name: 'Completed', value: objectiveStats.completed, fill: '#3b82f6' },
                          ]}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis allowDecimals={false} />
                          <Tooltip formatter={(value) => [value, 'Objectives']} />
                          <Bar 
                            dataKey="value" 
                            name="Objectives" 
                            fill="#8884d8"
                          >
                            {/* Using bars with different colors instead of Cell */}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">OKR Health Metrics</CardTitle>
                      <CardDescription>Key performance indicators</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">Completion Rate</span>
                            <span className="text-sm font-medium">
                              {objectiveStats.total ? 
                                Math.round((objectiveStats.completed / objectiveStats.total) * 100) : 0}%
                            </span>
                          </div>
                          <Progress 
                            value={objectiveStats.total ? 
                              Math.round((objectiveStats.completed / objectiveStats.total) * 100) : 0} 
                            className="h-2" 
                          />
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">On-Track Rate</span>
                            <span className="text-sm font-medium">
                              {objectiveStats.total ? 
                                Math.round(((objectiveStats.onTrack + objectiveStats.completed) / objectiveStats.total) * 100) : 0}%
                            </span>
                          </div>
                          <Progress 
                            value={objectiveStats.total ? 
                              Math.round(((objectiveStats.onTrack + objectiveStats.completed) / objectiveStats.total) * 100) : 0} 
                            className="h-2" 
                          />
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">Key Results Completion</span>
                            <span className="text-sm font-medium">
                              {(() => {
                                let completed = 0;
                                let total = 0;
                                userObjectives.forEach(obj => {
                                  obj.keyResults.forEach(kr => {
                                    total++;
                                    if (kr.progress === 100) completed++;
                                  });
                                });
                                return total ? Math.round((completed / total) * 100) : 0;
                              })()}%
                            </span>
                          </div>
                          <Progress 
                            value={(() => {
                              let completed = 0;
                              let total = 0;
                              userObjectives.forEach(obj => {
                                obj.keyResults.forEach(kr => {
                                  total++;
                                  if (kr.progress === 100) completed++;
                                });
                              });
                              return total ? Math.round((completed / total) * 100) : 0;
                            })()} 
                            className="h-2" 
                          />
                        </div>
                        
                        <div className="pt-4 grid grid-cols-2 gap-4">
                          <div className="flex flex-col items-center p-3 bg-muted/50 rounded-md">
                            <Award className="h-6 w-6 text-amber-500 mb-1" />
                            <span className="text-sm font-medium">Top Performer</span>
                            <span className="text-xs text-muted-foreground">
                              {userObjectives.length > 0 ? 
                                userObjectives.some(obj => obj.progress >= 90) ? 'Yes' : 'No' : 'N/A'}
                            </span>
                          </div>
                          
                          <div className="flex flex-col items-center p-3 bg-muted/50 rounded-md">
                            <TrendingUp className="h-6 w-6 text-green-500 mb-1" />
                            <span className="text-sm font-medium">Improvement</span>
                            <span className="text-xs text-muted-foreground">
                              {performanceData.length >= 2 ? 
                                `+${performanceData[performanceData.length - 1].progress - 
                                   performanceData[performanceData.length - 2].progress}%` : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Competencies Tab */}
              <TabsContent value="competencies" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Competency Radar</CardTitle>
                      <CardDescription>Skill assessment across key areas</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={competencyData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} />
                          <Radar name="Skills" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                          <Tooltip />
                          <Legend />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Skill Summary</CardTitle>
                      <CardDescription>Detailed breakdown of competencies</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {competencyData.map((skill: CompetencyData) => (
                          <div key={skill.subject}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium">{skill.subject}</span>
                              <span className="text-sm font-medium">{skill.A}%</span>
                            </div>
                            <Progress value={skill.A} className="h-2" />
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-6 pt-4 border-t">
                        <h4 className="font-medium text-sm mb-3">Strengths & Development Areas</h4>
                        <div className="space-y-3">
                          <div>
                            <h5 className="text-sm font-medium text-green-600 flex items-center">
                              <Trophy className="h-4 w-4 mr-1" />
                              Top Strengths
                            </h5>
                            <ul className="mt-1 space-y-1">
                              {competencyData
                                .sort((a: CompetencyData, b: CompetencyData) => b.A - a.A)
                                .slice(0, 2)
                                .map((skill: CompetencyData) => (
                                  <li key={skill.subject} className="text-sm flex items-center">
                                    <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
                                    {skill.subject} ({skill.A}%)
                                  </li>
                                ))
                              }
                            </ul>
                          </div>
                          
                          <div>
                            <h5 className="text-sm font-medium text-amber-600 flex items-center">
                              <Target className="h-4 w-4 mr-1" />
                              Development Areas
                            </h5>
                            <ul className="mt-1 space-y-1">
                              {competencyData
                                .sort((a: CompetencyData, b: CompetencyData) => a.A - b.A)
                                .slice(0, 2)
                                .map((skill: CompetencyData) => (
                                  <li key={skill.subject} className="text-sm flex items-center">
                                    <AlertTriangle className="h-3 w-3 text-amber-500 mr-1" />
                                    {skill.subject} ({skill.A}%)
                                  </li>
                                ))
                              }
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Feedback Tab */}
              <TabsContent value="feedback" className="space-y-4 pt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Recent Feedback</CardTitle>
                    <CardDescription>Performance feedback and reviews</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {feedbackData.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        No feedback available
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {feedbackData.map((feedback: FeedbackData, index: number) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="text-sm font-medium">{feedback.from}</p>
                                <p className="text-xs text-muted-foreground">{feedback.date}</p>
                              </div>
                              <div className="text-amber-500 text-sm font-medium">
                                {getRatingStars(feedback.rating)}
                              </div>
                            </div>
                            <p className="text-sm">{feedback.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Average Rating</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="text-3xl font-bold text-amber-500">
                        {(() => {
                          if (feedbackData.length === 0) return 'N/A';
                          const sum = feedbackData.reduce((acc, item) => acc + item.rating, 0);
                          return (sum / feedbackData.length).toFixed(1);
                        })()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        out of 5.0 stars
                      </p>
                      <div className="text-sm mt-2 text-amber-500">
                        {(() => {
                          if (feedbackData.length === 0) return '';
                          const sum = feedbackData.reduce((acc, item) => acc + item.rating, 0);
                          const avg = sum / feedbackData.length;
                          return getRatingStars(Math.round(avg));
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Feedback Count</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="text-3xl font-bold">
                        {feedbackData.length}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        pieces of feedback received
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Latest Feedback</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      {feedbackData.length > 0 ? (
                        <>
                          <div className="text-sm font-medium">
                            {feedbackData[0].from}
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {feedbackData[0].date}
                          </p>
                          <div className="text-amber-500 text-sm">
                            {getRatingStars(feedbackData[0].rating)}
                          </div>
                        </>
                      ) : (
                        <p className="text-muted-foreground">No feedback</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}