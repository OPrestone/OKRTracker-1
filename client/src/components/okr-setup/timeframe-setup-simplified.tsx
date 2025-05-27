import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, 
  RefreshCw, 
  Loader2,
  CheckCircle,
  Zap,
  Calendar,
  Save,
  X
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

interface Timeframe {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  tenantId: string;
  cadenceId?: string;
}

interface TimeframeSetupProps {
  tenantId: string;
  primaryCadence: "quarterly" | "trimester" | "halfYearly" | "annual";
  startMonth: string;
  onTimeframesSaved?: () => void;
}

function TimeframeSetupSimplified({ tenantId, primaryCadence, startMonth, onTimeframesSaved }: TimeframeSetupProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("create");
  const [generatedTimeframes, setGeneratedTimeframes] = useState<any[]>([]);
  
  // Fetch existing timeframes
  const { 
    data: existingTimeframes = [], 
    isLoading: isLoadingTimeframes,
    refetch: refetchTimeframes 
  } = useQuery<Timeframe[]>({
    queryKey: [`/api/timeframes?tenantId=${tenantId}`],
    enabled: !!tenantId,
    select: (data) => {
      console.log("Fetched timeframes:", data);
      return Array.isArray(data) ? data.filter(tf => tf.tenantId === tenantId) : [];
    }
  });
  
  // Fetch cadences for this tenant
  const { 
    data: cadences = [], 
    isLoading: isLoadingCadences 
  } = useQuery({
    queryKey: ['/api/cadences'],
    enabled: !!tenantId,
    select: (data) => {
      console.log("Fetched cadences:", data);
      return Array.isArray(data) ? data : [];
    }
  });

  // Helper to get month number from name
  const getMonthNumber = (monthName: string): number => {
    const months = [
      "january", "february", "march", "april", "may", "june",
      "july", "august", "september", "october", "november", "december"
    ];
    return months.indexOf(monthName.toLowerCase());
  };

  // Get the appropriate cadence ID for a given cadence type
  const getCadenceId = (cadenceType: string): string | undefined => {
    if (!cadences || cadences.length === 0) {
      console.warn("No cadences available");
      return undefined;
    }
    
    const searchName = cadenceType === 'quarterly' ? 'quarter' : cadenceType;
    
    const matchedCadence = cadences.find(c => 
      c.name.toLowerCase().includes(searchName.toLowerCase())
    );
    
    if (matchedCadence) {
      console.log(`Found cadence for ${cadenceType}:`, matchedCadence);
      return matchedCadence.id;
    }
    
    console.warn(`No cadence found for type: ${cadenceType}`);
    return undefined;
  };

  // Create default timeframes based on primary cadence and start month
  const createDefaultTimeframes = () => {
    if (isLoadingCadences) {
      toast({
        title: "Loading",
        description: "Please wait while we load cadence information.",
      });
      return [];
    }
    
    const now = new Date();
    const year = now.getFullYear();
    const monthNum = getMonthNumber(startMonth);
    
    const defaultTimeframes = [];
    const QUARTERLY_CADENCE_ID = getCadenceId("quarterly");
    const ANNUAL_CADENCE_ID = getCadenceId("annual");
    
    console.log("Using dynamic cadence IDs:", { 
      quarterly: QUARTERLY_CADENCE_ID, 
      annual: ANNUAL_CADENCE_ID,
      availableCadences: cadences
    });
    
    if (!QUARTERLY_CADENCE_ID && !ANNUAL_CADENCE_ID) {
      toast({
        title: "Missing Cadences",
        description: "Could not find appropriate cadences. Please ensure your organization has cadences set up.",
        variant: "destructive"
      });
      return [];
    }
    
    if (primaryCadence === "quarterly") {
      for (let i = 0; i < 4; i++) {
        const startDate = new Date(year, monthNum + (i * 3), 1);
        const endDate = new Date(year, monthNum + ((i + 1) * 3), 0);
        defaultTimeframes.push({
          name: `Q${i + 1} ${year}`,
          description: `Quarter ${i + 1} of ${year}`,
          startDate,
          endDate,
          tenantId,
          cadenceId: QUARTERLY_CADENCE_ID || ANNUAL_CADENCE_ID
        });
      }
    } else if (primaryCadence === "annual") {
      const startDate = new Date(year, monthNum, 1);
      const endDate = new Date(year + 1, monthNum, 0);
      defaultTimeframes.push({
        name: `FY ${year}`,
        description: `Fiscal Year ${year}`,
        startDate,
        endDate,
        tenantId,
        cadenceId: ANNUAL_CADENCE_ID || QUARTERLY_CADENCE_ID
      });
    } else if (primaryCadence === "halfYearly") {
      for (let i = 0; i < 2; i++) {
        const startDate = new Date(year, monthNum + (i * 6), 1);
        const endDate = new Date(year, monthNum + ((i + 1) * 6), 0);
        defaultTimeframes.push({
          name: `H${i + 1} ${year}`,
          description: `Half ${i + 1} of ${year}`,
          startDate,
          endDate,
          tenantId,
          cadenceId: QUARTERLY_CADENCE_ID || ANNUAL_CADENCE_ID
        });
      }
    } else if (primaryCadence === "trimester") {
      for (let i = 0; i < 3; i++) {
        const startDate = new Date(year, monthNum + (i * 4), 1);
        const endDate = new Date(year, monthNum + ((i + 1) * 4), 0);
        defaultTimeframes.push({
          name: `T${i + 1} ${year}`,
          description: `Trimester ${i + 1} of ${year}`,
          startDate,
          endDate,
          tenantId,
          cadenceId: QUARTERLY_CADENCE_ID || ANNUAL_CADENCE_ID
        });
      }
    }
    
    return defaultTimeframes;
  };

  // Create timeframe mutation
  const createTimeframeMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Creating timeframe with data:", data);
      const timeframeData = {
        ...data,
        tenantId: tenantId
      };
      console.log("Sending timeframe with tenant ID:", timeframeData);
      const res = await apiRequest("POST", "/api/timeframes", timeframeData);
      return await res.json();
    },
    onSuccess: (data) => {
      console.log("Timeframe created successfully:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/timeframes"] });
    },
    onError: (error) => {
      console.error("Failed to create timeframe:", error);
      toast({
        title: "Error",
        description: "Failed to create timeframe. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Generate default timeframes and display them
  const handleApplyDefaultTimeframes = () => {
    if (isLoadingCadences) {
      toast({
        title: "Loading",
        description: "Please wait while we load the cadence information.",
      });
      return;
    }

    const defaultFrames = createDefaultTimeframes();
    
    if (defaultFrames.length === 0) {
      return;
    }

    setGeneratedTimeframes(defaultFrames);
    
    toast({
      title: "Timeframes Generated!",
      description: `Generated ${defaultFrames.length} default timeframes. Review them below and click "Save Timeframes" when ready.`
    });
  };

  // Save the generated timeframes to the database
  const handleSaveTimeframes = async () => {
    if (generatedTimeframes.length === 0) {
      toast({
        title: "No Timeframes",
        description: "Please generate timeframes first.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Saving timeframes:", generatedTimeframes);
      let saveCount = 0;
      
      const defaultCadenceId = getCadenceId(primaryCadence);
      console.log("Using default cadence ID:", defaultCadenceId);
      
      for (const timeframe of generatedTimeframes) {
        const timeframeData = {
          ...timeframe,
          startDate: timeframe.startDate instanceof Date ? timeframe.startDate.toISOString() : timeframe.startDate,
          endDate: timeframe.endDate instanceof Date ? timeframe.endDate.toISOString() : timeframe.endDate,
          tenantId: tenantId,
          cadenceId: timeframe.cadenceId || defaultCadenceId
        };
        
        if (!timeframeData.cadenceId) {
          console.warn("Skipping timeframe without cadence ID:", timeframe.name);
          continue;
        }
        
        console.log("Saving timeframe with tenant ID:", timeframeData);
        await createTimeframeMutation.mutateAsync(timeframeData);
        saveCount++;
      }
      
      await refetchTimeframes();
      setGeneratedTimeframes([]);
      
      toast({
        title: "Success!",
        description: `${saveCount} timeframes have been saved to the database.`
      });
      
      setActiveTab("view");
      
      if (onTimeframesSaved) {
        setTimeout(() => {
          onTimeframesSaved();
        }, 500);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save timeframes. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to save timeframes:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-md mb-6 border border-blue-100">
        <h3 className="text-lg font-medium text-blue-700 mb-2">Timeframe Setup</h3>
        <p className="text-blue-600 mb-2">Set up your OKR planning periods based on your selected cadence and start month.</p>
        <ul className="list-disc list-inside text-blue-600 text-sm space-y-1">
          <li>Click <strong>Apply Default Timeframes</strong> to automatically create standard timeframes</li>
          <li>Default timeframes are based on your selected cadence ({primaryCadence}) starting in {startMonth}</li>
          <li>These timeframes will be available when creating objectives</li>
        </ul>
      </div>
      
      {/* Loading overlay */}
      {createTimeframeMutation.isPending && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <h3 className="text-lg font-medium mb-2">Creating Timeframes</h3>
              <p className="text-gray-500 text-center">Please wait while we create your timeframes...</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Tabs for Create/View */}
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="create" className="relative">
              <div className="flex items-center">
                <Zap className="w-4 h-4 mr-2" />
                <span>Apply Default Timeframes</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="view" className="relative">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                <span>Existing Timeframes</span>
                {existingTimeframes.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-blue-100 hover:bg-blue-100">
                    {existingTimeframes.length}
                  </Badge>
                )}
              </div>
            </TabsTrigger>
          </TabsList>
          
          <div className="space-x-2">
            {activeTab === "view" && (
              <Button 
                variant="outline" 
                onClick={() => refetchTimeframes()}
                className="flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            )}
          </div>
        </div>
        
        <TabsContent value="create" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2 text-blue-600" />
                Apply Default Timeframes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Default Configuration</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Cadence:</span>
                    <span className="ml-2 font-medium capitalize">{primaryCadence}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Start Month:</span>
                    <span className="ml-2 font-medium capitalize">{startMonth}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <Button 
                  type="button"
                  onClick={handleApplyDefaultTimeframes}
                  disabled={createTimeframeMutation.isPending || isLoadingCadences}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  size="lg"
                >
                  {createTimeframeMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Timeframes...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Apply Default Timeframes
                    </>
                  )}
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 text-center">
                This will create standard timeframes based on your cadence settings and save them automatically.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="view" className="mt-4">
          {isLoadingTimeframes ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading timeframes...</span>
            </div>
          ) : existingTimeframes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {existingTimeframes.map((timeframe) => (
                <Card key={timeframe.id} className="relative overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{timeframe.name}</CardTitle>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {timeframe.description && (
                      <p className="text-gray-600 text-sm mb-3">{timeframe.description}</p>
                    )}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Start:</span>
                        <span className="font-medium">
                          {format(new Date(timeframe.startDate), "MMM dd, yyyy")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">End:</span>
                        <span className="font-medium">
                          {format(new Date(timeframe.endDate), "MMM dd, yyyy")}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No Timeframes Yet</h3>
                  <p className="text-gray-500 mb-4">
                    You haven't created any timeframes yet. Use the "Apply Default Timeframes" tab to get started.
                  </p>
                  <Button 
                    type="button"
                    onClick={() => setActiveTab("create")}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Apply Default Timeframes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default TimeframeSetupSimplified;