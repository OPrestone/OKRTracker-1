import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Objective, KeyResult } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Flag, Target, ChevronRight, User, Calendar, Network } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const CompanyStrategy = () => {
  const [timeframeFilter, setTimeframeFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("goals");

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

      {/* Strategy Map & Goals */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Company Strategy Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div className="relative w-full max-w-4xl overflow-x-auto">
              <div className="min-w-[800px] pb-6">
                {/* Top Navigation Bar - similar to the one in the image */}
                <div className="flex items-center border-b border-gray-200 pb-2 mb-6">
                  <div className="flex space-x-2 text-sm">
                    <button 
                      onClick={() => setActiveTab("goals")} 
                      className={`flex items-center px-3 py-1 ${activeTab === "goals" ? "border-b-2 border-primary font-medium" : ""}`}
                    >
                      <Flag className="h-4 w-4 mr-1.5" />
                      <span>Goals</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab("strategy-map")} 
                      className={`flex items-center px-3 py-1 ${activeTab === "strategy-map" ? "border-b-2 border-primary font-medium" : ""}`}
                    >
                      <Target className="h-4 w-4 mr-1.5" />
                      <span>Strategy Map</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab("network")} 
                      className={`flex items-center px-3 py-1 ${activeTab === "network" ? "border-b-2 border-primary font-medium" : ""}`}
                    >
                      <Network className="h-4 w-4 mr-1.5" />
                      <span>Network</span>
                    </button>
                  </div>
                  <div className="ml-auto text-sm text-gray-500">
                    {new Date().toISOString().split('T')[0]}
                  </div>
                </div>
                
                {activeTab === "goals" && (
                  <div className="space-y-6">
                    <div className="bg-white p-6 border border-gray-200 rounded-md">
                      <h3 className="text-lg font-bold mb-4">Strategic Goals</h3>
                      <div className="space-y-4">
                        <div className="p-4 border border-gray-200 rounded-md">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-lg">Market Expansion & Growth</h4>
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                          </div>
                          <p className="text-gray-600 mb-3">Expand our market presence and drive significant revenue growth through both inbound and outbound channels.</p>
                          <div className="flex items-center">
                            <Progress value={70} className="h-2 flex-1 mr-2" />
                            <span className="text-sm font-medium">70%</span>
                          </div>
                        </div>
                        
                        <div className="p-4 border border-gray-200 rounded-md">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-lg">Product Excellence</h4>
                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Progress</Badge>
                          </div>
                          <p className="text-gray-600 mb-3">Create industry-leading products that deliver exceptional value to our customers.</p>
                          <div className="flex items-center">
                            <Progress value={45} className="h-2 flex-1 mr-2" />
                            <span className="text-sm font-medium">45%</span>
                          </div>
                        </div>
                        
                        <div className="p-4 border border-gray-200 rounded-md">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-lg">Operational Excellence</h4>
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Planning</Badge>
                          </div>
                          <p className="text-gray-600 mb-3">Optimize internal processes to maximize efficiency and reduce operational costs.</p>
                          <div className="flex items-center">
                            <Progress value={25} className="h-2 flex-1 mr-2" />
                            <span className="text-sm font-medium">25%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === "network" && (
                  <div className="space-y-6">
                    <div className="bg-white p-6 border border-gray-200 rounded-md">
                      <h3 className="text-lg font-bold mb-4">Strategy Network</h3>
                      <div className="flex justify-center mb-6">
                        <div className="p-4 border border-gray-200 rounded-lg bg-blue-50">
                          <p className="text-gray-600 mb-4 text-center">This view shows how objectives and key results connect across departments and teams.</p>
                          
                          <div className="relative p-6 bg-white border border-gray-200 rounded-lg">
                            <div className="flex justify-center mb-6">
                              <div className="w-32 h-32 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                                <div className="text-center">
                                  <div className="font-bold text-primary text-sm">Market</div>
                                  <div className="font-bold text-primary text-sm">Expansion</div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4">
                              <div className="flex justify-center">
                                <div className="w-24 h-24 rounded-full bg-blue-100 border border-blue-300 flex items-center justify-center">
                                  <div className="text-center">
                                    <div className="font-medium text-blue-800 text-xs">Sales</div>
                                    <div className="text-blue-800 text-xs">Team</div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex justify-center">
                                <div className="w-24 h-24 rounded-full bg-green-100 border border-green-300 flex items-center justify-center">
                                  <div className="text-center">
                                    <div className="font-medium text-green-800 text-xs">Marketing</div>
                                    <div className="text-green-800 text-xs">Team</div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex justify-center">
                                <div className="w-24 h-24 rounded-full bg-purple-100 border border-purple-300 flex items-center justify-center">
                                  <div className="text-center">
                                    <div className="font-medium text-purple-800 text-xs">Product</div>
                                    <div className="text-purple-800 text-xs">Team</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="absolute inset-0 pointer-events-none">
                              <svg width="100%" height="100%" viewBox="0 0 600 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M300 120 L200 220" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="2" strokeDasharray="5,5" />
                                <path d="M300 120 L300 220" stroke="rgba(16, 185, 129, 0.5)" strokeWidth="2" strokeDasharray="5,5" />
                                <path d="M300 120 L400 220" stroke="rgba(168, 85, 247, 0.5)" strokeWidth="2" strokeDasharray="5,5" />
                              </svg>
                            </div>
                          </div>
                          
                          <p className="text-gray-500 text-sm mt-4 text-center">
                            This visualization shows cross-functional collaboration between teams working toward market expansion goals.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === "strategy-map" && (
                  <>
                    {/* Top Level Strategy Node */}
                    <div className="flex justify-center mb-16">
                      <div className="w-[280px] border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                        <div className="bg-emerald-50 p-4 border-l-4 border-emerald-400">
                          <div className="flex items-start mb-2">
                            <div className="h-2 w-2 mt-1.5 rounded-full bg-emerald-400 mr-1.5"></div>
                            <div>
                              <h3 className="font-medium text-gray-800">Market Expansion & Growth</h3>
                            </div>
                          </div>
                          <div className="ml-3.5 text-xs text-gray-500">ICT Team</div>
                        </div>
                        <div className="flex justify-end p-1.5 bg-white border-t border-gray-200">
                          <button className="p-1 text-gray-400 hover:text-gray-700">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8 12H16M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </button>
                          <button className="p-1 text-gray-400 hover:text-gray-700">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Connecting Line */}
                    <div className="h-20 flex justify-center items-center">
                      <div className="border-l border-gray-300 h-full"></div>
                    </div>

                    {/* Second Level - Two Strategy Boxes */}
                    <div className="grid grid-cols-2 gap-x-24 mb-16">
                      {/* Left Strategy Box */}
                      <div className="w-full border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                        <div className="bg-emerald-50 p-4 border-l-4 border-emerald-400">
                          <div className="flex items-start mb-2">
                            <div className="h-2 w-2 mt-1.5 rounded-full bg-emerald-400 mr-1.5"></div>
                            <div>
                              <h3 className="font-medium text-gray-800">Drive new customer acquisition and revenue growth from inbound channels</h3>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center">
                            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                              <div className="bg-emerald-400 h-full rounded-full" style={{ width: '37%' }}></div>
                            </div>
                            <span className="ml-2 text-xs text-gray-600">37%</span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-1">
                            <div className="px-2 py-0.5 bg-gray-100 rounded-sm text-xs flex items-center">
                              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1"></span>
                              Operations
                            </div>
                            <div className="px-2 py-0.5 bg-gray-100 rounded-sm text-xs flex items-center">
                              <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                              Sales
                            </div>
                            <div className="px-2 py-0.5 bg-gray-100 rounded-sm text-xs flex items-center">
                              <span className="w-2 h-2 bg-purple-500 rounded-full mr-1"></span>
                              ICT Team
                            </div>
                          </div>
                          <div className="mt-3 flex items-center text-xs text-gray-500">
                            <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                              <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            Sophie Hansen
                            <div className="ml-2 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-sm">
                              On track
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end p-1.5 bg-white border-t border-gray-200">
                          <button className="p-1 text-gray-400 hover:text-gray-700">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8 12H16M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </button>
                          <button className="p-1 text-gray-400 hover:text-gray-700">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Right Strategy Box */}
                      <div className="w-full border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                        <div className="bg-emerald-50 p-4 border-l-4 border-emerald-400">
                          <div className="flex items-start mb-2">
                            <div className="h-2 w-2 mt-1.5 rounded-full bg-emerald-400 mr-1.5"></div>
                            <div>
                              <h3 className="font-medium text-gray-800">Build a powerful Outbound engine that drives significant revenue</h3>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center">
                            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                              <div className="bg-emerald-400 h-full rounded-full" style={{ width: '80%' }}></div>
                            </div>
                            <span className="ml-2 text-xs text-gray-600">80%</span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-1">
                            <div className="px-2 py-0.5 bg-gray-100 rounded-sm text-xs flex items-center">
                              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1"></span>
                              Operations
                            </div>
                            <div className="px-2 py-0.5 bg-gray-100 rounded-sm text-xs flex items-center">
                              <span className="w-2 h-2 bg-purple-500 rounded-full mr-1"></span>
                              ICT Team
                            </div>
                          </div>
                          <div className="mt-3 flex items-center text-xs text-gray-500">
                            <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                              <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            Sophie Hansen
                            <div className="ml-2 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-sm">
                              On track
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end p-1.5 bg-white border-t border-gray-200">
                          <button className="p-1 text-gray-400 hover:text-gray-700">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8 12H16M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </button>
                          <button className="p-1 text-gray-400 hover:text-gray-700">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Connecting Lines */}
                    <div className="grid grid-cols-2 gap-x-24 mb-2">
                      <div className="flex justify-center">
                        <div className="border-l border-gray-300 h-16"></div>
                      </div>
                      <div className="flex justify-center">
                        <div className="border-l border-gray-300 h-16"></div>
                      </div>
                    </div>

                    {/* Bottom Row - Multiple Key Results */}
                    <div className="grid grid-cols-5 gap-2">
                      {/* Key Result 1 */}
                      <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                        <div className="bg-white p-3">
                          <div className="flex items-start mb-2">
                            <div>
                              <h3 className="text-xs font-medium text-gray-800">Achieve a 10% increase in average deal size</h3>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center">
                            <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-blue-400 h-full rounded-full" style={{ width: '5%' }}></div>
                            </div>
                            <span className="ml-2 text-xs text-gray-600">5%</span>
                          </div>
                          <div className="mt-2 flex items-center text-xs">
                            <div className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">
                              <span>Sales</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Key Result 2 */}
                      <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                        <div className="bg-white p-3">
                          <div className="flex items-start mb-2">
                            <div>
                              <h3 className="text-xs font-medium text-gray-800">Generate $5M in new ARR from inbound leads</h3>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center">
                            <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-blue-400 h-full rounded-full" style={{ width: '25%' }}></div>
                            </div>
                            <span className="ml-2 text-xs text-gray-600">25%</span>
                          </div>
                          <div className="mt-2 flex items-center text-xs">
                            <div className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">
                              <span>Sales</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Key Result 3 */}
                      <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                        <div className="bg-white p-3">
                          <div className="flex items-start mb-2">
                            <div>
                              <h3 className="text-xs font-medium text-gray-800">Convert 12% of MQLs into Opportunities</h3>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center">
                            <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-blue-400 h-full rounded-full" style={{ width: '8%' }}></div>
                            </div>
                            <span className="ml-2 text-xs text-gray-600">8%</span>
                          </div>
                          <div className="mt-2 flex items-center text-xs">
                            <div className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">
                              <span>Sales</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Key Result 4 */}
                      <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                        <div className="bg-white p-3">
                          <div className="flex items-start mb-2">
                            <div>
                              <h3 className="text-xs font-medium text-gray-800">Achieve average cold email open rate of 40% or higher</h3>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center">
                            <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-emerald-400 h-full rounded-full" style={{ width: '64%' }}></div>
                            </div>
                            <span className="ml-2 text-xs text-gray-600">64%</span>
                          </div>
                          <div className="mt-2 flex items-center text-xs">
                            <div className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">
                              <span>Sales</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Key Result 5 */}
                      <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                        <div className="bg-white p-3">
                          <div className="flex items-start mb-2">
                            <div>
                              <h3 className="text-xs font-medium text-gray-800">Generate $2M in new ARR through Outbound</h3>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center">
                            <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-emerald-400 h-full rounded-full" style={{ width: '60%' }}></div>
                            </div>
                            <span className="ml-2 text-xs text-gray-600">60%</span>
                          </div>
                          <div className="mt-2 flex items-center text-xs">
                            <div className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">
                              <span>Sales</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
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
            {timeframes && Array.isArray(timeframes) && timeframes.map((timeframe: any) => (
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
                          {objective.level ? objective.level.charAt(0).toUpperCase() + objective.level.slice(1) : "N/A"}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={getStatusColor(objective.status || "")}
                        >
                          {objective.status ? objective.status.charAt(0).toUpperCase() + objective.status.slice(1) : "N/A"}
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
                            stroke={objective.progress && objective.progress >= 75 ? "#10B981" : 
                                   objective.progress && objective.progress >= 50 ? "#3B82F6" : 
                                   objective.progress && objective.progress >= 25 ? "#F59E0B" : "#EF4444"} 
                            strokeWidth="2" 
                            strokeDasharray="100" 
                            strokeDashoffset={100 - (objective.progress || 0)}
                            transform="rotate(-90 18 18)"
                          ></circle>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold">{objective.progress || 0}%</span>
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
                                backgroundColor: keyResult.progress && keyResult.progress >= 75 ? "#10B981" : 
                                              keyResult.progress && keyResult.progress >= 50 ? "#3B82F6" : 
                                              keyResult.progress && keyResult.progress >= 25 ? "#F59E0B" : "#EF4444"
                              }}
                            ></span>
                            <span className="text-sm font-medium">{keyResult.title}</span>
                          </div>
                          <span className="text-sm font-medium">{keyResult.progress || 0}%</span>
                        </div>
                        <Progress value={keyResult.progress || 0} className="h-1.5" />
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
                <span className="text-sm">Release mobile application</span>
                <Badge className="ml-auto bg-green-100 text-green-800 hover:bg-green-100">90%</Badge>
              </div>
              <div className="flex items-center">
                <ChevronRight className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-sm">Implement user feedback</span>
                <Badge className="ml-auto bg-blue-100 text-blue-800 hover:bg-blue-100">45%</Badge>
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
                <Badge className="ml-auto bg-blue-100 text-blue-800 hover:bg-blue-100">72%</Badge>
              </div>
              <div className="flex items-center">
                <ChevronRight className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-sm">Expand into new markets</span>
                <Badge className="ml-auto bg-amber-100 text-amber-800 hover:bg-amber-100">35%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CompanyStrategy;