import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Objective, KeyResult } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Flag, Target, ChevronRight, User, Calendar } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const CompanyStrategy = () => {
  const [timeframeFilter, setTimeframeFilter] = useState("all");

  // Fetch timeframes
  const { data: timeframes, isLoading: timeframesLoading } = useQuery({
    queryKey: ["/api/timeframes"],
  });

  // Fetch company objectives
  const { data: objectives, isLoading: objectivesLoading } = useQuery<Objective[]>({
    queryKey: ["/api/objectives"],
  });

  // Fetch key results for objectives if they exist
  const { data: allKeyResults, isLoading: keyResultsLoading } = useQuery<KeyResult[]>({
    queryKey: ["/api/key-results"],
    enabled: !!(objectives && objectives.length > 0),
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'on_track':
      case 'on track':
        return 'bg-green-100 text-green-800 border-green-800';
      case 'at_risk':
      case 'at risk':
        return 'bg-amber-100 text-amber-800 border-amber-800';
      case 'behind':
        return 'bg-red-100 text-red-800 border-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-800';
    }
  };

  const getKeyResultsForObjective = (objectiveId: number) => {
    return allKeyResults?.filter(kr => kr.objectiveId === objectiveId) || [];
  };

  // Filter objectives by timeframe if selected
  const filteredObjectives = timeframeFilter === "all" 
    ? objectives 
    : objectives?.filter(obj => obj.timeframeId === parseInt(timeframeFilter));

  return (
    <DashboardLayout title="Company Strategy">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Company Strategy</h1>
        <p className="text-gray-600">
          View and track the company's strategic objectives and their alignment across the organization.
        </p>
      </div>

      {/* Strategy Map */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Strategy Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div className="relative w-full max-w-3xl overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Vision & Mission */}
                <div className="mb-8 text-center">
                  <div className="bg-primary-50 border border-primary py-6 px-8 rounded-lg">
                    <h3 className="text-lg font-bold text-primary mb-1">Our Vision</h3>
                    <p className="text-gray-700">
                      To be the leading innovative platform that transforms how organizations achieve their goals
                    </p>
                  </div>

                  <div className="h-8 border-l border-dashed border-gray-300 mx-auto"></div>

                  <div className="bg-blue-50 border border-blue-200 py-6 px-8 rounded-lg">
                    <h3 className="text-lg font-bold text-blue-600 mb-1">Our Mission</h3>
                    <p className="text-gray-700">
                      Empower teams to align, focus, and achieve extraordinary results through effective goal management
                    </p>
                  </div>
                </div>

                {/* Strategic Pillars */}
                <h3 className="text-center font-bold text-gray-700 mb-3">Strategic Pillars</h3>
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
                    <h4 className="font-semibold text-green-700 mb-2">Customer Success</h4>
                    <p className="text-sm text-gray-600">Deliver exceptional value and experience</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg text-center">
                    <h4 className="font-semibold text-purple-700 mb-2">Product Excellence</h4>
                    <p className="text-sm text-gray-600">Build innovative and reliable solutions</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-center">
                    <h4 className="font-semibold text-amber-700 mb-2">Operational Efficiency</h4>
                    <p className="text-sm text-gray-600">Optimize processes and maximize resources</p>
                  </div>
                </div>

                {/* Connection lines */}
                <div className="h-8 flex justify-center items-center mb-4">
                  <div className="border-b border-dashed border-gray-300 w-3/4"></div>
                </div>

                {/* Strategic Objectives */}
                <h3 className="text-center font-bold text-gray-700 mb-3">Key Company Objectives</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border border-gray-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Expand Global Market Presence</h4>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Progress value={75} className="h-1.5 flex-1 mr-2" />
                      <span>75%</span>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Improve Customer Experience</h4>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Progress value={45} className="h-1.5 flex-1 mr-2" />
                      <span>45%</span>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Launch Mobile Platform</h4>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Progress value={90} className="h-1.5 flex-1 mr-2" />
                      <span>90%</span>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Increase Quarterly Revenue</h4>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Progress value={82} className="h-1.5 flex-1 mr-2" />
                      <span>82%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Objectives Section */}
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Company Objectives</h2>
        
        <Select value={timeframeFilter} onValueChange={setTimeframeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Timeframes</SelectItem>
            {timeframes?.map((timeframe: any) => (
              <SelectItem key={timeframe.id} value={timeframe.id.toString()}>
                {timeframe.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {objectivesLoading ? (
        <div className="flex justify-center py-12">
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
      ) : filteredObjectives && filteredObjectives.length > 0 ? (
        <div className="space-y-6">
          {filteredObjectives.map((objective) => (
            <Card key={objective.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-5 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Badge variant="outline" className="mr-2 bg-indigo-100 text-indigo-800">
                          {objective.level.charAt(0).toUpperCase() + objective.level.slice(1)}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={getStatusColor(objective.status)}
                        >
                          {objective.status.charAt(0).toUpperCase() + objective.status.slice(1)}
                        </Badge>
                      </div>
                      
                      <h3 className="text-lg font-semibold mb-1">{objective.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{objective.description}</p>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <div className="flex items-center mr-4">
                          <User className="h-4 w-4 mr-1" />
                          <span>Owner ID: {objective.ownerId}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>Timeframe ID: {objective.timeframeId}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-6 flex-shrink-0">
                      <div className="relative group">
                        <svg className="w-16 h-16" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="16" fill="none" stroke="#e5e7eb" strokeWidth="2"></circle>
                          <circle 
                            className="transition-all duration-500 ease-in-out" 
                            cx="18" 
                            cy="18" 
                            r="16" 
                            fill="none" 
                            stroke={objective.progress >= 75 ? "#10B981" : 
                                    objective.progress >= 50 ? "#3B82F6" : 
                                    objective.progress >= 25 ? "#F59E0B" : "#EF4444"} 
                            strokeWidth="2" 
                            strokeDasharray="100" 
                            strokeDashoffset={100 - objective.progress}
                            transform="rotate(-90 18 18)"
                          ></circle>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold">{objective.progress}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-5">
                  <h4 className="font-medium text-sm mb-3">Key Results</h4>
                  
                  {keyResultsLoading ? (
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-slate-200 rounded"></div>
                      <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                      <div className="h-4 bg-slate-200 rounded w-4/6"></div>
                    </div>
                  ) : (
                    getKeyResultsForObjective(objective.id).map((keyResult) => (
                      <div className="mb-3" key={keyResult.id}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center">
                            <span 
                              className="w-4 h-4 rounded-full mr-3" 
                              style={{ 
                                backgroundColor: keyResult.progress >= 75 ? "#10B981" : 
                                                keyResult.progress >= 50 ? "#3B82F6" : 
                                                keyResult.progress >= 25 ? "#F59E0B" : "#EF4444"
                              }}
                            ></span>
                            <span className="text-sm font-medium">{keyResult.title}</span>
                          </div>
                          <span className="text-sm font-medium">{keyResult.progress}%</span>
                        </div>
                        <Progress value={keyResult.progress} className="h-1.5" />
                      </div>
                    ))
                  )}
                  
                  {getKeyResultsForObjective(objective.id).length === 0 && !keyResultsLoading && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No key results found for this objective
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No objectives found</AlertTitle>
          <AlertDescription>
            No objectives were found for the selected filters. Try changing your selection or create new objectives.
          </AlertDescription>
        </Alert>
      )}

      {/* Team Alignment Section */}
      <h2 className="text-xl font-semibold mt-8 mb-4">Team Alignment</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Marketing Team</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center">
                <ChevronRight className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-sm">Increase brand awareness</span>
                <Badge className="ml-auto bg-green-100 text-green-800 hover:bg-green-100">85%</Badge>
              </div>
              <div className="flex items-center">
                <ChevronRight className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-sm">Launch new content strategy</span>
                <Badge className="ml-auto bg-amber-100 text-amber-800 hover:bg-amber-100">60%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Product Team</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center">
                <ChevronRight className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-sm">Launch new mobile app</span>
                <Badge className="ml-auto bg-green-100 text-green-800 hover:bg-green-100">90%</Badge>
              </div>
              <div className="flex items-center">
                <ChevronRight className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-sm">Reduce load time by 30%</span>
                <Badge className="ml-auto bg-red-100 text-red-800 hover:bg-red-100">35%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Sales Team</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center">
                <ChevronRight className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-sm">Increase quarterly revenue</span>
                <Badge className="ml-auto bg-green-100 text-green-800 hover:bg-green-100">92%</Badge>
              </div>
              <div className="flex items-center">
                <ChevronRight className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-sm">Expand customer base</span>
                <Badge className="ml-auto bg-green-100 text-green-800 hover:bg-green-100">85%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights/Activity Section */}
      <h2 className="text-xl font-semibold mt-8 mb-4">Insights & Activity</h2>
      
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="progress">Progress Over Time</TabsTrigger>
          <TabsTrigger value="alignment">Alignment Score</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-700 mb-2">On Track</h3>
                  <p className="text-3xl font-bold text-green-700">70%</p>
                  <p className="text-sm text-green-600 mt-1">15 objectives</p>
                </div>
                
                <div className="bg-amber-50 p-4 rounded-lg">
                  <h3 className="font-medium text-amber-700 mb-2">At Risk</h3>
                  <p className="text-3xl font-bold text-amber-700">20%</p>
                  <p className="text-sm text-amber-600 mt-1">5 objectives</p>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-medium text-red-700 mb-2">Behind</h3>
                  <p className="text-3xl font-bold text-red-700">10%</p>
                  <p className="text-sm text-red-600 mt-1">3 objectives</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="progress" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
                <p className="text-gray-500">Progress chart will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="alignment" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
                <p className="text-gray-500">Alignment visualization will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default CompanyStrategy;
