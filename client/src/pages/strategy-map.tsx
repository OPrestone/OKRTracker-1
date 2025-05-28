import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Download, Edit, Plus, ZoomIn, ZoomOut, Settings } from "lucide-react";
import { useState } from "react";
import { useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import CompanyAlignmentMap from "@/components/strategy/company-alignment-map";
import TeamsOKRView from "@/components/strategy/teams-okr-view";
import KeyResultSummary from "@/components/strategy/key-results-summary";
import DashboardLayout from "@/layouts/dashboard-layout";
import { useTenantContext } from "@/hooks/use-tenant-context";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Form schemas
const missionSchema = z.object({
  mission: z.string().min(10, "Mission must be at least 10 characters"),
});

const objectiveSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  level: z.string().default("company"),
});

// Component to render strategy map elements
const StrategyMap = () => {
  const params = useParams<{ organisation: string }>();
  const { currentTenant } = useTenantContext();
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Build tenant-specific endpoint for API calls
  const organizationId = params?.organisation || currentTenant?.id;
  
  // Increment/decrement zoom level
  const zoomIn = () => setZoomLevel(prev => Math.min(prev + 10, 150));
  const zoomOut = () => setZoomLevel(prev => Math.max(prev - 10, 50));
  
  // Company objectives
  const { data: objectives = [] } = useQuery({
    queryKey: ['/api/objectives'],
    enabled: !!organizationId,
  }) as { data: any[] };
  
  // Teams with performance data
  const { data: teams = [] } = useQuery({
    queryKey: ['/api/teams'],
    enabled: !!organizationId,
  }) as { data: any[] };

  // Organization/tenant data for mission
  const { data: organizationData } = useQuery({
    queryKey: ['/api/tenants'],
    enabled: !!organizationId,
  });

  // Key results for progress calculations
  const { data: keyResults = [] } = useQuery({
    queryKey: ['/api/key-results'],
    enabled: !!organizationId,
  }) as { data: any[] };

  // Strategic directions
  const { data: strategicDirections = [] } = useQuery({
    queryKey: ['/api/strategic-directions'],
    enabled: !!organizationId,
  }) as { data: any[] };

  // Calculate progress for objectives based on key results
  const objectivesWithProgress = objectives.map(objective => {
    const relatedKeyResults = keyResults.filter(kr => kr.objectiveId === objective.id);
    if (relatedKeyResults.length === 0) return { ...objective, progress: 0 };
    
    const totalProgress = relatedKeyResults.reduce((sum, kr) => {
      if (kr.targetValue && kr.currentValue) {
        return sum + (parseFloat(kr.currentValue) / parseFloat(kr.targetValue)) * 100;
      }
      return sum;
    }, 0);
    
    return {
      ...objective,
      progress: Math.min(100, Math.round(totalProgress / relatedKeyResults.length))
    };
  });

  // Calculate team performance based on their objectives
  const teamsWithPerformance = teams.map(team => {
    const teamObjectives = objectives.filter(obj => obj.teamId === team.id);
    if (teamObjectives.length === 0) return { ...team, performance: 0 };
    
    const completedObjectives = teamObjectives.filter(obj => obj.status === 'completed').length;
    const performance = Math.round((completedObjectives / teamObjectives.length) * 100);
    
    return {
      ...team,
      performance,
      objectiveCount: teamObjectives.length,
      completedObjectives
    };
  });

  // Get current organization mission
  const currentOrganization = organizationData?.find(org => org.id === organizationId);
  const companyMission = currentOrganization?.mission || 
    "To empower teams with tools and methodologies for achieving measurable success";

  // Mutations for editing
  const updateMissionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof missionSchema>) => {
      return apiRequest(`/api/tenants/${organizationId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      toast({ title: "Mission updated successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to update mission", variant: "destructive" });
    },
  });

  const createObjectiveMutation = useMutation({
    mutationFn: async (data: z.infer<typeof objectiveSchema>) => {
      return apiRequest("/api/objectives", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
      toast({ title: "Objective created successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to create objective", variant: "destructive" });
    },
  });

  // Form for editing mission
  const missionForm = useForm<z.infer<typeof missionSchema>>({
    resolver: zodResolver(missionSchema),
    defaultValues: {
      mission: companyMission,
    },
  });

  // Form for creating objectives
  const objectiveForm = useForm<z.infer<typeof objectiveSchema>>({
    resolver: zodResolver(objectiveSchema),
    defaultValues: {
      title: "",
      description: "",
      level: "company",
    },
  });

  const onMissionSubmit = (data: z.infer<typeof missionSchema>) => {
    updateMissionMutation.mutate(data);
  };

  const onObjectiveSubmit = (data: z.infer<typeof objectiveSchema>) => {
    createObjectiveMutation.mutate(data);
    objectiveForm.reset();
  };
  
  return (
    <div className="relative">
      {/* Controls */}
      <div className="absolute top-4 right-4 flex space-x-2 bg-white p-1 rounded-md shadow-sm z-10">
        <Button 
          variant={isEditing ? "default" : "outline"} 
          size="icon" 
          onClick={() => setIsEditing(!isEditing)} 
          title={isEditing ? "Exit edit mode" : "Enter edit mode"}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={zoomOut} title="Zoom out">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="flex items-center text-sm font-medium px-2">{zoomLevel}%</span>
        <Button variant="outline" size="icon" onClick={zoomIn} title="Zoom in">
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Strategy map visualization container */}
      <div 
        className="bg-white rounded-lg border border-neutral-200 p-8 min-h-[600px] overflow-auto"
        style={{ transform: `scale(${zoomLevel/100})`, transformOrigin: 'top center' }}
      >
        {objectivesWithProgress && teamsWithPerformance ? (
          <div className="flex flex-col items-center">
            {/* Company Mission */}
            <div className="w-full max-w-md p-4 bg-neutral-100 rounded-lg text-center mb-8 relative">
              <h3 className="font-medium text-lg text-neutral-900 mb-2">Company Mission</h3>
              <p className="text-sm text-neutral-700">
                {companyMission}
              </p>
              {isEditing && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2"
                      title="Edit mission"
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Edit Company Mission</DialogTitle>
                    </DialogHeader>
                    <Form {...missionForm}>
                      <form onSubmit={missionForm.handleSubmit(onMissionSubmit)} className="space-y-4">
                        <FormField
                          control={missionForm.control}
                          name="mission"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mission Statement</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Enter your company mission..."
                                  className="resize-none"
                                  rows={4}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          disabled={updateMissionMutation.isPending}
                          className="w-full"
                        >
                          {updateMissionMutation.isPending ? "Updating..." : "Update Mission"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            
            {/* Strategic Directions */}
            <div className={`grid gap-8 mb-8 w-full max-w-5xl ${strategicDirections.length <= 2 ? 'grid-cols-2' : strategicDirections.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
              {strategicDirections.length > 0 ? strategicDirections.map((direction: any) => (
                <div key={direction.id} className="bg-primary-50 p-4 rounded-lg text-center border border-primary-200">
                  <h4 className="font-medium text-primary-900">{direction.title}</h4>
                  {direction.description && (
                    <p className="text-xs text-primary-700 mt-1">{direction.description}</p>
                  )}
                </div>
              )) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-neutral-500">No strategic directions found. Set up strategic directions to see them in the strategy map.</p>
                </div>
              )}
            </div>
            
            {/* Company Objectives */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 w-full max-w-5xl">
              {objectivesWithProgress.length > 0 ? objectivesWithProgress.map((objective: any) => (
                <div key={objective.id} className="bg-white p-4 rounded-lg border border-primary-300 shadow-sm">
                  <h4 className="font-medium text-neutral-900 mb-1">{objective.title}</h4>
                  <div className="w-full bg-neutral-200 rounded-full h-1.5 mb-1">
                    <div 
                      className="bg-primary-500 h-1.5 rounded-full" 
                      style={{ width: `${objective.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-neutral-500">{objective.progress}% complete</p>
                  <p className="text-xs text-neutral-400 mt-1">{objective.status}</p>
                </div>
              )) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-neutral-500">No company objectives found. Create objectives to see them in the strategy map.</p>
                </div>
              )}
              {isEditing && (
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="bg-white p-4 rounded-lg border border-dashed border-primary-300 shadow-sm cursor-pointer hover:bg-primary-50 transition-colors flex items-center justify-center">
                      <div className="text-center">
                        <Plus className="h-6 w-6 text-primary-500 mx-auto mb-2" />
                        <p className="text-sm font-medium text-primary-700">Add Objective</p>
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Create New Objective</DialogTitle>
                    </DialogHeader>
                    <Form {...objectiveForm}>
                      <form onSubmit={objectiveForm.handleSubmit(onObjectiveSubmit)} className="space-y-4">
                        <FormField
                          control={objectiveForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Objective Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter objective title..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={objectiveForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description (Optional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Enter objective description..."
                                  className="resize-none"
                                  rows={3}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          disabled={createObjectiveMutation.isPending}
                          className="w-full"
                        >
                          {createObjectiveMutation.isPending ? "Creating..." : "Create Objective"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            
            {/* Team Objectives Connection Lines */}
            <div className="w-full max-w-5xl border-l-2 border-r-2 border-dashed border-neutral-300 h-20 relative">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4">
                <span className="text-sm text-neutral-600">Aligns with</span>
              </div>
            </div>
            
            {/* Teams Layer */}
            <div className="grid grid-cols-2 gap-6 mb-8 w-full max-w-4xl">
              {teamsWithPerformance.length > 0 ? teamsWithPerformance.slice(0, 4).map((team: any) => (
                <div key={team.id} className="bg-white p-4 rounded-lg border border-neutral-300 shadow-sm">
                  <h4 className="font-medium text-neutral-900 mb-1">{team.name}</h4>
                  <p className="text-xs text-neutral-600 mb-2">
                    {team.objectiveCount || 0} objectives • {team.completedObjectives || 0} completed
                  </p>
                  <div className="w-full bg-neutral-200 rounded-full h-1.5 mb-1">
                    <div 
                      className="bg-accent-500 h-1.5 rounded-full" 
                      style={{ width: `${team.performance}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-neutral-500">{team.performance}% performance</p>
                  {team.leaderId && (
                    <p className="text-xs text-neutral-400 mt-1">Leader assigned</p>
                  )}
                </div>
              )) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-neutral-500">No teams found. Create teams to see them in the strategy map.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-neutral-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              <h3 className="text-lg font-medium text-neutral-900 mb-1">Strategy Map Visualization</h3>
              <p className="text-sm text-neutral-600 mb-4 max-w-md mx-auto">
                Visualize how your team's objectives connect to company-wide goals to ensure alignment.
              </p>
              <Button variant="outline" className="text-primary-700 border-primary-300 hover:bg-primary-50">
                Create Strategy Map
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function StrategyMapPage() {
  const params = useParams<{ organisation: string }>();
  const { currentTenant } = useTenantContext();
  
  // Get organization name from tenant or use "Organization" as fallback
  const organizationName = currentTenant?.displayName || "Organization";
  
  return (
    <DashboardLayout title="Strategy Map" subtitle={`Visualize the relationships between objectives across ${organizationName}`}>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Strategy Map</h1>
          <p className="text-neutral-600">Visualize the relationships between objectives across {organizationName}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="flex items-center gap-1">
            <Edit className="h-4 w-4" />
            Edit Strategy
          </Button>
        </div>
      </div>

      <Tabs defaultValue="alignment" className="mb-8">
        <TabsList>
          <TabsTrigger value="alignment">Company Alignment</TabsTrigger>
          <TabsTrigger value="teams-okr">Teams OKR</TabsTrigger>
          <TabsTrigger value="key-results">Key Results Summary</TabsTrigger>
          <TabsTrigger value="map">Visual Map</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="alignment" className="pt-4">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Company Alignment Map</CardTitle>
            </CardHeader>
            <CardContent>
              <CompanyAlignmentMap />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="teams-okr" className="pt-4">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Teams Objectives & Key Results</CardTitle>
            </CardHeader>
            <CardContent>
              <TeamsOKRView />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="key-results" className="pt-4">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Key Results Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <KeyResultSummary />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="map" className="pt-4">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Strategic Alignment Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <StrategyMap />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="table" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Strategy Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600 mb-4">
                Tabular view of strategic objectives and their interconnections would be shown here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Guidelines for Strategy Mapping</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-neutral-900 mb-1">What is a Strategy Map?</h3>
              <p className="text-sm text-neutral-600">
                A strategy map is a visual tool that shows how different objectives relate to one another and support overall organizational goals. It helps ensure alignment across all levels of the organization.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-neutral-900 mb-1">How to Use the Strategy Map</h3>
              <p className="text-sm text-neutral-600">
                Use this map to trace how team and individual objectives support higher-level company goals. Identify gaps or misalignments in your strategy, and ensure that all activities are connected to meaningful outcomes.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-neutral-900 mb-1">Best Practices</h3>
              <p className="text-sm text-neutral-600">
                Maintain a clear line of sight from company objectives down to team and individual objectives. Regularly review and update the strategy map as priorities evolve. Use the map in planning discussions to ensure new initiatives align with strategic goals.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
