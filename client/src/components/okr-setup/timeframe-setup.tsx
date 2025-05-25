import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { format, addMonths, parseISO } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trash2, PlusCircle, CalendarIcon, RefreshCw, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface Timeframe {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  cadenceId?: string;
  tenantId: string;
}

interface TimeframeSetupProps {
  tenantId: string;
  primaryCadence: string;
  startMonth: string;
}

export default function TimeframeSetup({ tenantId, primaryCadence, startMonth }: TimeframeSetupProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [timeframes, setTimeframes] = useState<any[]>([]);
  const [isAddingTimeframe, setIsAddingTimeframe] = useState(false);
  const [activeTab, setActiveTab] = useState("create");
  
  // Fetch existing timeframes with modified query to use the relaxed authentication endpoint
  const { 
    data: existingTimeframes = [], 
    isLoading: isLoadingTimeframes,
    refetch: refetchTimeframes 
  } = useQuery<Timeframe[]>({
    queryKey: [`/api/timeframes?tenantId=${tenantId}`],
    enabled: !!tenantId,
    // Add a function to handle the query response
    select: (data) => {
      console.log("Fetched timeframes:", data);
      // Filter to only include timeframes for this tenant
      return Array.isArray(data) ? data.filter(tf => tf.tenantId === tenantId) : [];
    }
  });
  
  // New timeframe form state
  const [formState, setFormState] = useState({
    name: "",
    description: "",
    startDate: new Date(),
    endDate: addMonths(new Date(), 3), // Default to 3 months for quarterly
  });

  // Helper to get month number from name
  const getMonthNumber = (monthName: string): number => {
    const months = [
      "january", "february", "march", "april", "may", "june",
      "july", "august", "september", "october", "november", "december"
    ];
    return months.indexOf(monthName.toLowerCase());
  };

  // Helper to get default timeframe duration based on cadence
  const getCadenceDuration = (cadence: string): number => {
    switch (cadence) {
      case "quarterly": return 3;
      case "trimester": return 4;
      case "halfYearly": return 6;
      case "annual": return 12;
      default: return 3;
    }
  };

  // Create default timeframes based on primary cadence and start month
  const createDefaultTimeframes = () => {
    const now = new Date();
    const year = now.getFullYear();
    const monthNum = getMonthNumber(startMonth);
    const duration = getCadenceDuration(primaryCadence);
    
    // Create timeframes for the current year
    const defaultTimeframes = [];
    
    if (primaryCadence === "quarterly") {
      // Create 4 quarters
      for (let i = 0; i < 4; i++) {
        const startDate = new Date(year, monthNum + (i * 3), 1);
        const endDate = new Date(year, monthNum + ((i + 1) * 3), 0);
        defaultTimeframes.push({
          name: `Q${i + 1} ${year}`,
          description: `Quarter ${i + 1} of ${year}`,
          startDate,
          endDate,
          tenantId,
        });
      }
    } else if (primaryCadence === "annual") {
      // Create annual timeframe
      const startDate = new Date(year, monthNum, 1);
      const endDate = new Date(year + 1, monthNum, 0);
      defaultTimeframes.push({
        name: `FY ${year}`,
        description: `Fiscal Year ${year}`,
        startDate,
        endDate,
        tenantId,
      });
    } else if (primaryCadence === "halfYearly") {
      // Create 2 half-year timeframes
      for (let i = 0; i < 2; i++) {
        const startDate = new Date(year, monthNum + (i * 6), 1);
        const endDate = new Date(year, monthNum + ((i + 1) * 6), 0);
        defaultTimeframes.push({
          name: `H${i + 1} ${year}`,
          description: `Half ${i + 1} of ${year}`,
          startDate,
          endDate,
          tenantId,
        });
      }
    } else if (primaryCadence === "trimester") {
      // Create 3 trimesters
      for (let i = 0; i < 3; i++) {
        const startDate = new Date(year, monthNum + (i * 4), 1);
        const endDate = new Date(year, monthNum + ((i + 1) * 4), 0);
        defaultTimeframes.push({
          name: `T${i + 1} ${year}`,
          description: `Trimester ${i + 1} of ${year}`,
          startDate,
          endDate,
          tenantId,
        });
      }
    }
    
    return defaultTimeframes;
  };
  
  // When Apply Default Timeframes button is clicked
  const handleApplyDefaultTimeframes = () => {
    const defaultFrames = createDefaultTimeframes();
    setTimeframes(defaultFrames);
  };

  // Create timeframe mutation
  const createTimeframeMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Creating timeframe with data:", data);
      // Ensure tenant ID is explicitly included in the request
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
      toast({
        title: "Success!",
        description: "Timeframe has been created."
      });
      
      // Reset form and hide the form
      setFormState({
        name: "",
        description: "",
        startDate: new Date(),
        endDate: addMonths(new Date(), getCadenceDuration(primaryCadence)),
      });
      setIsAddingTimeframe(false);
      
      // Add the new timeframe to the local list
      setTimeframes(prev => prev.map(tf => tf.id ? tf : {...tf, id: data.id}));
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

  // Save all timeframes to the database
  const saveAllTimeframes = async () => {
    if (timeframes.length === 0) {
      toast({
        title: "No Timeframes",
        description: "Please create at least one timeframe before saving.",
        variant: "destructive",
      });
      return;
    }
    
    // Save each timeframe to the database
    try {
      console.log("Saving timeframes:", timeframes);
      let saveCount = 0;
      
      for (const timeframe of timeframes) {
        if (!timeframe.id) { // Only save new timeframes
          // Format dates properly for the API and ensure tenant ID is included
          const timeframeData = {
            ...timeframe,
            startDate: timeframe.startDate instanceof Date ? timeframe.startDate.toISOString() : timeframe.startDate,
            endDate: timeframe.endDate instanceof Date ? timeframe.endDate.toISOString() : timeframe.endDate,
            tenantId: tenantId // Explicitly set tenant ID
          };
          
          console.log("Saving timeframe with tenant ID:", timeframeData);
          await createTimeframeMutation.mutateAsync(timeframeData);
          saveCount++;
        }
      }
      
      // After saving, refresh the existing timeframes list
      await refetchTimeframes();
      
      // Clear the local draft timeframes list since they're now in the database
      setTimeframes([]);
      
      toast({
        title: "Success!",
        description: `${saveCount} timeframes have been saved to the database.`
      });
      
      // Switch to the "view" tab to show the saved timeframes
      setActiveTab("view");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save all timeframes. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to save timeframes:", error);
    }
  };

  // Handle input changes for the new timeframe form
  const handleInputChange = (field: string, value: any) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Add a new timeframe to the list
  const handleAddTimeframe = () => {
    // Basic validation
    if (!formState.name) {
      toast({
        title: "Validation Error",
        description: "Please provide a name for the timeframe.",
        variant: "destructive",
      });
      return;
    }
    
    if (formState.startDate >= formState.endDate) {
      toast({
        title: "Date Error",
        description: "End date must be after start date.",
        variant: "destructive",
      });
      return;
    }
    
    // Add the new timeframe to the list
    const newTimeframe = {
      ...formState,
      tenantId,
    };
    
    setTimeframes(prev => [...prev, newTimeframe]);
    
    // Reset form and hide it
    setFormState({
      name: "",
      description: "",
      startDate: new Date(),
      endDate: addMonths(new Date(), getCadenceDuration(primaryCadence)),
    });
    setIsAddingTimeframe(false);
  };

  // Remove a timeframe from the list
  const handleRemoveTimeframe = (index: number) => {
    setTimeframes(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-md mb-6 border border-blue-100">
        <h3 className="text-lg font-medium text-blue-700 mb-2">About Timeframes</h3>
        <p className="text-blue-600 mb-2">Timeframes define your OKR planning periods (e.g., quarters, years) and help you organize objectives within specific time boundaries.</p>
        <ul className="list-disc list-inside text-blue-600 text-sm space-y-1">
          <li>Use <strong>Apply Default Timeframes</strong> to quickly create standard timeframes based on your selected cadence</li>
          <li>Click <strong>Add Timeframe</strong> to create custom timeframes for special planning periods</li>
          <li>You can edit and remove timeframes before saving them</li>
          <li>Your saved timeframes will be available when creating objectives</li>
        </ul>
      </div>
      
      {/* Loading overlay */}
      {createTimeframeMutation.isPending && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <h3 className="text-lg font-medium mb-2">Saving Timeframes</h3>
              <p className="text-gray-500 text-center">Please wait while we save your timeframes to the database...</p>
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
                <PlusCircle className="w-4 h-4 mr-2" />
                <span>Create Timeframes</span>
                {timeframes.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-blue-100 hover:bg-blue-100">
                    {timeframes.length}
                  </Badge>
                )}
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
            {activeTab === "create" && (
              <>
                <Button 
                  type="button"
                  variant="default" 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  onClick={(e) => {
                    e.preventDefault();
                    handleApplyDefaultTimeframes();
                  }}
                >
                  Apply Default Timeframes
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddingTimeframe(true)}
                  disabled={isAddingTimeframe}
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Timeframe
                </Button>
              </>
            )}
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
          {/* Add new timeframe form */}
          {isAddingTimeframe && (
        <Card className="border border-dashed">
          <CardHeader>
            <CardTitle>New Timeframe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Q1 2025"
                value={formState.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="First quarter of 2025"
                value={formState.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formState.startDate ? format(formState.startDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formState.startDate}
                      onSelect={(date) => handleInputChange("startDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formState.endDate ? format(formState.endDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formState.endDate}
                      onSelect={(date) => handleInputChange("endDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost" onClick={() => setIsAddingTimeframe(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTimeframe}>
              Add Timeframe
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {/* List of timeframes */}
      {timeframes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {timeframes.map((timeframe, index) => (
            <Card key={index} className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => handleRemoveTimeframe(index)}
              >
                <Trash2 className="h-4 w-4 text-gray-500" />
              </Button>
              <CardHeader>
                <CardTitle>{timeframe.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  {timeframe.description && (
                    <p className="text-gray-500 mb-2">{timeframe.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Start Date:</p>
                      <p>{format(new Date(timeframe.startDate), "PPP")}</p>
                    </div>
                    <div>
                      <p className="font-semibold">End Date:</p>
                      <p>{format(new Date(timeframe.endDate), "PPP")}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center p-8 border rounded-md bg-gray-50">
          <p className="text-gray-500">No timeframes added yet. Click "Add Timeframe" to create one or use "Apply Default Timeframes".</p>
        </div>
      )}
      
      {timeframes.length > 0 && (
        <div className="flex justify-end mt-4">
          <Button onClick={saveAllTimeframes} disabled={createTimeframeMutation.isPending}>
            {createTimeframeMutation.isPending ? "Saving..." : "Save All Timeframes"}
          </Button>
        </div>
      )}
        </TabsContent>
      
        <TabsContent value="view" className="mt-4">
          {isLoadingTimeframes ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : existingTimeframes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {existingTimeframes.map((timeframe) => (
                <Card key={timeframe.id} className="relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-1 bg-blue-500 text-xs text-white rounded-bl-md">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <CardHeader>
                    <CardTitle>{timeframe.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm">
                      {timeframe.description && (
                        <p className="text-gray-500 mb-2">{timeframe.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">Start Date:</p>
                          <p>{format(new Date(timeframe.startDate), "PPP")}</p>
                        </div>
                        <div>
                          <p className="font-semibold">End Date:</p>
                          <p>{format(new Date(timeframe.endDate), "PPP")}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 border rounded-md bg-gray-50">
              <AlertCircle className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No timeframes found. Create your first timeframe on the "Create Timeframes" tab.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}