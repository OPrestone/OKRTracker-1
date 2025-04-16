import DashboardLayout from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter, Search, BarChart, ChevronRight, Calendar, Target, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

// Sample data
const companyObjectives = [
  {
    id: 1,
    title: "Achieve 25% Revenue Growth",
    description: "Increase annual revenue through new customer acquisition and expansion of existing accounts",
    level: "company",
    timeframe: "Q4 2023",
    type: "financial",
    progress: 82,
    status: "on_track",
    assignedTeam: "Executive Team",
    keyResults: [
      { title: "Close $5M in new business", progress: 90 },
      { title: "Upsell 30% of existing customers", progress: 75 },
      { title: "Launch 2 new revenue streams", progress: 60 }
    ]
  },
  {
    id: 2,
    title: "Launch New Product Platform",
    description: "Develop and launch next-generation product platform to drive future growth",
    level: "company",
    timeframe: "Q1 2024",
    type: "product",
    progress: 45,
    status: "at_risk",
    assignedTeam: "Product Team",
    keyResults: [
      { title: "Complete core platform development", progress: 70 },
      { title: "Conduct beta testing with 50 customers", progress: 40 },
      { title: "Achieve platform stability benchmarks", progress: 20 }
    ]
  },
  {
    id: 3,
    title: "Improve Customer Satisfaction Score to 90%",
    description: "Enhance customer experience across all touchpoints to improve overall satisfaction",
    level: "company",
    timeframe: "Q4 2023",
    type: "customer",
    progress: 60,
    status: "on_track",
    assignedTeam: "Customer Success",
    keyResults: [
      { title: "Reduce support ticket resolution time to <24 hours", progress: 75 },
      { title: "Implement customer feedback program", progress: 100 },
      { title: "Decrease churn rate to <5%", progress: 40 }
    ]
  },
  {
    id: 4,
    title: "Establish Market Leadership in Enterprise Segment",
    description: "Position company as the leading solution for enterprise customers in our industry",
    level: "company",
    timeframe: "Q2 2024",
    type: "market",
    progress: 30,
    status: "on_track",
    assignedTeam: "Marketing",
    keyResults: [
      { title: "Publish 5 industry thought leadership pieces", progress: 40 },
      { title: "Secure 3 major enterprise reference customers", progress: 33 },
      { title: "Achieve 25% market share in enterprise segment", progress: 20 }
    ]
  },
  {
    id: 5,
    title: "Build Engineering Excellence",
    description: "Implement best practices and processes to support sustainable growth",
    level: "company",
    timeframe: "Q1 2024",
    type: "operations",
    progress: 55,
    status: "on_track",
    assignedTeam: "Engineering",
    keyResults: [
      { title: "Achieve 90% test coverage", progress: 70 },
      { title: "Reduce regression bugs by 50%", progress: 60 },
      { title: "Implement CI/CD across all repositories", progress: 35 }
    ]
  },
  {
    id: 6,
    title: "Expand Global Team",
    description: "Grow team across key regions to support international expansion",
    level: "company",
    timeframe: "Q2 2024",
    type: "people",
    progress: 35,
    status: "behind",
    assignedTeam: "HR",
    keyResults: [
      { title: "Hire key positions in EMEA region", progress: 50 },
      { title: "Establish Asia-Pacific headquarters", progress: 20 },
      { title: "Implement global onboarding program", progress: 35 }
    ]
  }
];

export default function CompanyOKRs() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredObjectives = companyObjectives.filter(obj => 
    obj.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    obj.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on_track":
        return "bg-green-100 text-green-800";
      case "at_risk":
        return "bg-yellow-100 text-yellow-800";
      case "behind":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "financial":
        return <BarChart className="h-4 w-4" />;
      case "product":
        return <Target className="h-4 w-4" />;
      case "customer":
        return <Users className="h-4 w-4" />;
      case "market":
        return <BarChart className="h-4 w-4" />;
      case "operations":
        return <BarChart className="h-4 w-4" />;
      case "people":
        return <Users className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  return (
    <DashboardLayout title="Company OKRs">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company OKRs</h1>
          <p className="text-gray-600">View and track company-wide objectives and key results</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search objectives..."
              className="pl-8 w-[200px] lg:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>All Objectives</DropdownMenuItem>
              <DropdownMenuItem>Financial Objectives</DropdownMenuItem>
              <DropdownMenuItem>Product Objectives</DropdownMenuItem>
              <DropdownMenuItem>Customer Objectives</DropdownMenuItem>
              <DropdownMenuItem>Current Quarter</DropdownMenuItem>
              <DropdownMenuItem>Next Quarter</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full mb-6">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="current">Current Quarter</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredObjectives.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {filteredObjectives.map((objective) => (
            <Card key={objective.id} className="border-t-4" style={{ borderTopColor: objective.type === 'financial' ? '#818cf8' : objective.type === 'product' ? '#6ee7b7' : objective.type === 'customer' ? '#fcd34d' : '#f472b6' }}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center">
                    <Badge className="mr-2" variant="outline">
                      <span className="flex items-center">
                        {getTypeIcon(objective.type)}
                        <span className="ml-1 capitalize">{objective.type}</span>
                      </span>
                    </Badge>
                    <Badge className={getStatusColor(objective.status)}>
                      {objective.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    <Calendar className="h-3 w-3 mr-1" />
                    {objective.timeframe}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{objective.title}</CardTitle>
                <CardDescription className="mt-1.5">
                  {objective.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">Overall Progress</span>
                    <span>{objective.progress}%</span>
                  </div>
                  <Progress value={objective.progress} className="h-2" />
                </div>
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Key Results:</h4>
                  <ul className="space-y-3">
                    {objective.keyResults.map((kr, idx) => (
                      <li key={idx} className="text-sm">
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-700">{kr.title}</span>
                          <span className="text-gray-500">{kr.progress}%</span>
                        </div>
                        <Progress value={kr.progress} className="h-1.5" />
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="mt-5 text-sm text-gray-500 flex justify-between items-center">
                  <span>Assigned: {objective.assignedTeam}</span>
                  <Button size="sm" variant="ghost">
                    Details <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No company objectives found</CardTitle>
            <CardDescription>
              {searchQuery 
                ? `No objectives match your search: "${searchQuery}"`
                : "There are no company-level objectives at this time."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Company objectives provide direction and alignment for the entire organization.
            </p>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
