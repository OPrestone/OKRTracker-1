import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PlusCircle, Target, AlertTriangle, Users, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Objective, KeyResult } from "@shared/schema";

const Home = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("mission");

  // Fetch user's objectives
  const { data: userObjectives, isLoading: objectivesLoading } = useQuery<Objective[]>({
    queryKey: ["/api/users", user?.id, "objectives"],
    enabled: !!user,
  });

  // Fetch team objectives if user has a team
  const { data: teamObjectives, isLoading: teamObjectivesLoading } = useQuery<Objective[]>({
    queryKey: ["/api/teams", user?.teamId, "objectives"],
    enabled: !!user?.teamId,
  });

  // Fetch key results for the first objective (for demonstration)
  const { data: keyResults, isLoading: keyResultsLoading } = useQuery<KeyResult[]>({
    queryKey: ["/api/objectives", userObjectives?.[0]?.id, "key-results"],
    enabled: !!(userObjectives && userObjectives.length > 0),
  });

  // Fetch recent check-ins
  const { data: checkIns, isLoading: checkInsLoading } = useQuery({
    queryKey: ["/api/check-ins"],
  });

  return (
    <DashboardLayout title="Home">
      <Tabs defaultValue="mission" onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="mission">Mission</TabsTrigger>
          <TabsTrigger value="okrs">OKRs</TabsTrigger>
          <TabsTrigger value="checkins">Check-ins</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        {/* Mission Tab */}
        <TabsContent value="mission" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-gray-600">
                  Our mission is to create excellent products that delight our customers, 
                  while fostering a collaborative and innovative work environment.
                </p>
                <h3 className="text-lg font-medium mt-6">Company Pillars</h3>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-primary mr-2"></span>
                    <span>Customer-centricity in all decisions</span>
                  </li>
                  <li className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-primary mr-2"></span>
                    <span>Innovation and continuous improvement</span>
                  </li>
                  <li className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-primary mr-2"></span>
                    <span>Data-driven strategy and execution</span>
                  </li>
                  <li className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-primary mr-2"></span>
                    <span>Collaboration across all teams</span>
                  </li>
                </ul>

                <div className="mt-8">
                  <Button variant="outline">Edit Mission</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* OKRs Tab */}
        <TabsContent value="okrs" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium">My Objectives</h2>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Objective
            </Button>
          </div>

          {objectivesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-slate-200 h-10 w-10"></div>
                <div className="flex-1 space-y-6 py-1">
                  <div className="h-2 bg-slate-200 rounded"></div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="h-2 bg-slate-200 rounded col-span-2"></div>
                      <div className="h-2 bg-slate-200 rounded col-span-1"></div>
                    </div>
                    <div className="h-2 bg-slate-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : userObjectives && userObjectives.length > 0 ? (
            <div className="space-y-4">
              {userObjectives.map((objective) => (
                <Card key={objective.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-medium">{objective.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{objective.description}</p>
                        
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">Progress</span>
                            <span className="text-sm font-medium">{objective.progress}%</span>
                          </div>
                          <Progress value={objective.progress} className="h-2" />
                        </div>
                      </div>
                      <div className="bg-primary-50 text-primary rounded-full px-3 py-1 text-xs font-medium">
                        {objective.status}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Alert>
              <Target className="h-4 w-4" />
              <AlertTitle>No objectives found</AlertTitle>
              <AlertDescription>
                You don't have any objectives assigned yet. Create a new objective to get started.
              </AlertDescription>
            </Alert>
          )}

          {user?.teamId && (
            <>
              <h2 className="text-xl font-medium mt-8 mb-4">Team Objectives</h2>
              {teamObjectivesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-pulse flex space-x-4">
                    <div className="rounded-full bg-slate-200 h-10 w-10"></div>
                    <div className="flex-1 space-y-6 py-1">
                      <div className="h-2 bg-slate-200 rounded"></div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="h-2 bg-slate-200 rounded col-span-2"></div>
                          <div className="h-2 bg-slate-200 rounded col-span-1"></div>
                        </div>
                        <div className="h-2 bg-slate-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : teamObjectives && teamObjectives.length > 0 ? (
                <div className="space-y-4">
                  {teamObjectives.map((objective) => (
                    <Card key={objective.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-medium">{objective.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">{objective.description}</p>
                            
                            <div className="mt-4">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">Progress</span>
                                <span className="text-sm font-medium">{objective.progress}%</span>
                              </div>
                              <Progress value={objective.progress} className="h-2" />
                            </div>
                          </div>
                          <div className="bg-primary-50 text-primary rounded-full px-3 py-1 text-xs font-medium">
                            {objective.status}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Alert>
                  <Target className="h-4 w-4" />
                  <AlertTitle>No team objectives found</AlertTitle>
                  <AlertDescription>
                    Your team doesn't have any objectives yet.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </TabsContent>

        {/* Check-ins Tab */}
        <TabsContent value="checkins" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium">Recent Check-ins</h2>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Check-in
            </Button>
          </div>

          {checkInsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-slate-200 h-10 w-10"></div>
                <div className="flex-1 space-y-6 py-1">
                  <div className="h-2 bg-slate-200 rounded"></div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="h-2 bg-slate-200 rounded col-span-2"></div>
                      <div className="h-2 bg-slate-200 rounded col-span-1"></div>
                    </div>
                    <div className="h-2 bg-slate-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : checkIns && checkIns.length > 0 ? (
            <div className="space-y-4">
              {checkIns.map((checkIn: any) => (
                <Card key={checkIn.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">
                          {checkIn.objectiveId ? 'Objective Check-in' : 'Key Result Check-in'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {checkIn.notes || 'No notes provided'}
                        </p>
                        
                        {checkIn.progress !== undefined && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">Progress</span>
                              <span className="text-sm font-medium">{checkIn.progress}%</span>
                            </div>
                            <Progress value={checkIn.progress} className="h-2" />
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(checkIn.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>No check-ins found</AlertTitle>
              <AlertDescription>
                You haven't recorded any check-ins yet. Create a new check-in to track your progress.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              {user?.teamId ? (
                <div className="space-y-4">
                  {/* Team members would be fetched and displayed here */}
                  <div className="flex items-center p-3 hover:bg-gray-50 rounded-md">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary font-medium mr-3">
                      JD
                    </div>
                    <div>
                      <h3 className="font-medium">John Doe</h3>
                      <p className="text-sm text-gray-500">Product Manager</p>
                    </div>
                    <div className="ml-auto text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 hover:bg-gray-50 rounded-md">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary font-medium mr-3">
                      JS
                    </div>
                    <div>
                      <h3 className="font-medium">Jane Smith</h3>
                      <p className="text-sm text-gray-500">Designer</p>
                    </div>
                    <div className="ml-auto text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 hover:bg-gray-50 rounded-md">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary font-medium mr-3">
                      RJ
                    </div>
                    <div>
                      <h3 className="font-medium">Robert Johnson</h3>
                      <p className="text-sm text-gray-500">Developer</p>
                    </div>
                    <div className="ml-auto text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        On Leave
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <Alert>
                  <Users className="h-4 w-4" />
                  <AlertTitle>No team assigned</AlertTitle>
                  <AlertDescription>
                    You are not currently assigned to any team. Contact your administrator to join a team.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Home;
