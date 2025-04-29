import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

// Mock data for demonstration
const teamsData = [
  {
    id: 1,
    name: "Marketing Team",
    progress: 78,
    objectives: [
      { id: 1, title: "Increase brand awareness", progress: 85, status: "on_track" },
      { id: 2, title: "Launch new website", progress: 65, status: "at_risk" },
      { id: 3, title: "Improve social media engagement", progress: 92, status: "on_track" },
    ],
  },
  {
    id: 2,
    name: "Product Team",
    progress: 62,
    objectives: [
      { id: 4, title: "Release new product features", progress: 45, status: "behind" },
      { id: 5, title: "Improve user onboarding", progress: 80, status: "on_track" },
    ],
  },
  {
    id: 3,
    name: "Sales Team",
    progress: 85,
    objectives: [
      { id: 6, title: "Increase quarterly sales", progress: 90, status: "on_track" },
      { id: 7, title: "Expand to new markets", progress: 70, status: "on_track" },
      { id: 8, title: "Improve customer retention", progress: 95, status: "on_track" },
    ],
  },
  {
    id: 4,
    name: "Engineering Team",
    progress: 72,
    objectives: [
      { id: 9, title: "Reduce system downtime", progress: 88, status: "on_track" },
      { id: 10, title: "Improve code quality", progress: 56, status: "at_risk" },
    ],
  },
];

// Helper to get status badge
const getStatusBadge = (status: string) => {
  switch (status) {
    case "on_track":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">On Track</Badge>;
    case "at_risk":
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">At Risk</Badge>;
    case "behind":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Behind</Badge>;
    case "completed":
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Completed</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Not Started</Badge>;
  }
};

// Get progress color based on value
const getProgressColor = (progress: number) => {
  if (progress >= 80) return "bg-green-500";
  if (progress >= 60) return "bg-amber-500";
  return "bg-red-500";
};

interface TeamsOkrsViewProps {
  // You can add props here when connecting to real data
}

export function TeamsOkrsView(props: TeamsOkrsViewProps) {
  const [viewMode, setViewMode] = useState<"all" | "byTeam">("all");

  return (
    <div className="space-y-6">
      <Tabs defaultValue="all" className="w-full" onValueChange={(v) => setViewMode(v as "all" | "byTeam")}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Teams</TabsTrigger>
          <TabsTrigger value="byTeam">By Team</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {teamsData.map((team) => (
            <Card key={team.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                  </div>
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                    {team.progress}% Complete
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-3">
                  <Progress value={team.progress} className={`h-2 ${getProgressColor(team.progress)}`} />
                </div>
                <div className="space-y-2">
                  {team.objectives.map((objective) => (
                    <div key={objective.id} className="flex justify-between items-center py-1 border-b border-gray-100">
                      <div className="text-sm">{objective.title}</div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(objective.status)}
                        <span className="text-xs font-medium">{objective.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        
        <TabsContent value="byTeam" className="space-y-4">
          <Tabs defaultValue={teamsData[0].id.toString()} className="w-full">
            <TabsList className="mb-4 flex flex-wrap gap-1">
              {teamsData.map((team) => (
                <TabsTrigger key={team.id} value={team.id.toString()}>
                  {team.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {teamsData.map((team) => (
              <TabsContent key={team.id} value={team.id.toString()}>
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>{team.name}</CardTitle>
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                        {team.progress}% Complete
                      </Badge>
                    </div>
                    <div className="mt-2">
                      <Progress value={team.progress} className={`h-2 ${getProgressColor(team.progress)}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {team.objectives.map((objective) => (
                        <Card key={objective.id} className="border border-gray-200">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center mb-3">
                              <h3 className="font-medium">{objective.title}</h3>
                              {getStatusBadge(objective.status)}
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={objective.progress} 
                                className={`h-2 flex-1 ${getProgressColor(objective.progress)}`} 
                              />
                              <span className="text-sm font-medium">{objective.progress}%</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}