import { useState, useEffect } from "react";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  FileDown, 
  FileUp, 
  PenBox, 
  Save, 
  Edit, 
  Presentation, 
  CheckCircle2,
  XCircle,
  Check,
  X,
  Loader2
} from "lucide-react";
import { TeamsOkrsView } from "@/components/mission/teams-okrs-view";
import { StrategicDirectionsDisplay } from "@/components/mission/strategic-directions-display";
import DashboardLayout from "@/layouts/dashboard-layout";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

export default function Mission() {
  const [location] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Get tenant ID from multiple sources to ensure it's available
  let extractedTenantId = '';
  
  // 1. Try to extract from URL path - format could be either:
  //    - /:id([A-Z0-9]{26})/mission (new ULID format)
  //    - /organization/:organisation/mission (legacy format)
  const pathParts = location.split('/');
  extractedTenantId = pathParts[1] === 'organization' ? pathParts[2] : pathParts[1];
  
  // 2. If not valid ID format or missing, try from localStorage
  if (!extractedTenantId || !/^[A-Z0-9]{26}$/.test(extractedTenantId)) {
    const localTenant = localStorage.getItem('currentTenant');
    if (localTenant) extractedTenantId = localTenant;
  }
  
  // 3. If still not found, try from sessionStorage
  if (!extractedTenantId || !/^[A-Z0-9]{26}$/.test(extractedTenantId)) {
    const sessionTenant = sessionStorage.getItem('currentTenantId');
    if (sessionTenant) extractedTenantId = sessionTenant;
  }
  
  // 4. If still not found, try from user object
  if ((!extractedTenantId || !/^[A-Z0-9]{26}$/.test(extractedTenantId)) && window.__USER__?.defaultTenant) {
    extractedTenantId = window.__USER__.defaultTenant;
  }
  
  // 5. If still no tenant ID, get it from the user's first tenant
  if ((!extractedTenantId || !/^[A-Z0-9]{26}$/.test(extractedTenantId)) && 
      window.__USER__?.tenants && window.__USER__.tenants.length > 0) {
    extractedTenantId = window.__USER__.tenants[0].id;
  }
  
  const tenantId = extractedTenantId;
  console.log("Using tenant ID:", tenantId);

  // State for full page edit mode
  const [fullPageEditMode, setFullPageEditMode] = useState(false);
  const [activeEditTab, setActiveEditTab] = useState<'strategic' | 'boundaries' | 'behaviors'>('strategic');
  
  // State for editable sections (individual card editing)
  const [editMode, setEditMode] = useState<{
    mission: boolean;
    vision: boolean;
    purpose: boolean;
    values: boolean;
    boundaries: boolean;
    behaviors: boolean;
  }>({
    mission: false,
    vision: false,
    purpose: false,
    values: false,
    boundaries: false,
    behaviors: false,
  });

  // State for current user info
  const [owner, setOwner] = useState("Bonface Nderitu");
  const [title, setTitle] = useState("Head of Information, Communication & Technology");

  // Mission state
  const [missionStatement, setMissionStatement] = useState("");
  const [missionDraft, setMissionDraft] = useState("");

  // Strategic Direction state
  const [strategicDirection, setStrategicDirection] = useState("");
  const [strategicDirectionDraft, setStrategicDirectionDraft] = useState("");

  // Level mission statements
  const [oneLevelMission, setOneLevelMission] = useState("");
  const [twoLevelMission, setTwoLevelMission] = useState("");
  
  // Override toggles
  const [overrideOneLevelMission, setOverrideOneLevelMission] = useState(false);
  const [overrideTwoLevelMission, setOverrideTwoLevelMission] = useState(false);

  // Vision state
  const [vision, setVision] = useState("");
  const [visionDraft, setVisionDraft] = useState("");
  
  // Purpose state (read from company)
  const [purpose, setPurpose] = useState("");
  const [purposeDraft, setPurposeDraft] = useState("");
  
  // Values state (read from company)
  const [values, setValues] = useState("");
  const [valuesDraft, setValuesDraft] = useState("");

  // Behaviors state
  const [behaviors, setBehaviors] = useState<string[]>([]);
  const [behaviorsDraft, setBehaviorsDraft] = useState<string[]>([]);
  const [newBehavior, setNewBehavior] = useState("");
  
  // Boundaries state
  const [boundaries, setBoundaries] = useState<{
    freedoms: string[];
    constraints: string[];
  }>({
    freedoms: [],
    constraints: []
  });
  
  const [boundariesDraft, setBoundariesDraft] = useState<{
    freedoms: string[];
    constraints: string[];
  }>({
    freedoms: [],
    constraints: []
  });
  
  const [newFreedom, setNewFreedom] = useState("");
  const [newConstraint, setNewConstraint] = useState("");
  
  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Query to fetch organization mission data
  const { data: missionData, isLoading: isMissionLoading, error: missionError } = useQuery({
    queryKey: ['/api/organization-mission', tenantId],
    queryFn: async () => {
      console.log("Fetching mission data with tenant ID:", tenantId);
      
      // Make sure we have a valid tenant ID
      if (!tenantId) {
        console.error("No tenant ID available");
        throw new Error("No tenant ID available");
      }
      
      // Add tenant ID in query parameters to ensure it's available on the server
      const url = `/api/organization-mission?tenantId=${encodeURIComponent(tenantId)}`;
      
      try {
        // Include credentials to ensure cookies for authentication are sent
        const response = await fetch(url, { 
          method: 'GET',
          credentials: 'include', // Important: Include credentials for authentication
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': tenantId // Use the custom header for tenant ID
          }
        });
        
        // Log the response to help debug
        console.log("Response status:", response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error fetching mission data:', errorText);
          throw new Error('Failed to fetch mission data: ' + errorText);
        }
        
        return response.json();
      } catch (err) {
        console.error("Error in mission data fetch:", err);
        throw err;
      }
    },
    enabled: !!tenantId, // Only run query when tenantId is available
    retry: 3 // Retry failed queries up to 3 times
  });

  // Query to fetch strategic directions data
  const { data: strategicDirectionsData, isLoading: isDirectionsLoading, error: directionsError } = useQuery({
    queryKey: ['/api/strategic-directions', tenantId],
    queryFn: async () => {
      console.log("Fetching strategic directions with tenant ID:", tenantId);
      
      if (!tenantId) {
        throw new Error("No tenant ID available");
      }
      
      const response = await fetch('/api/strategic-directions', { 
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error fetching strategic directions:', errorText);
        throw new Error('Failed to fetch strategic directions: ' + errorText);
      }
      
      return response.json();
    },
    enabled: !!tenantId,
    retry: 3
  });

  // Query to get user role for permission-based access
  const { data: userRole, isLoading: isRoleLoading } = useQuery({
    queryKey: ['/api/user/role', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      
      const response = await fetch(`/api/user/role?tenantId=${tenantId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user role: ${response.status}`);
      }
      
      return response.json();
    },
    enabled: !!tenantId
  });

  // Permission checks based on user role
  const canEditMission = userRole?.role === 'owner' || userRole?.role === 'admin' || userRole?.role === 'executive';
  const canEditBehaviors = userRole?.role === 'owner' || userRole?.role === 'admin' || userRole?.role === 'manager' || userRole?.role === 'executive';
  const canViewOnly = userRole?.role === 'user';

  // Mutation to save organization mission data
  const saveMissionMutation = useMutation({
    mutationFn: async (data: {
      mission: string;
      vision: string;
      purpose: string;
      values: string;
      behaviors: string;
      boundaries: string;
      strategicDirection: string;
    }) => {
      console.log("Saving mission data with tenant ID:", tenantId);
      
      // Add tenant ID in all possible locations to ensure it's available
      // 1. In the URL query parameters
      const url = `/api/organization-mission?tenantId=${encodeURIComponent(tenantId)}`;
      
      // 2. In the request headers
      // 3. In the request body
      const requestData = {
        ...data,
        tenantId: tenantId // Include tenant ID in the body too
      };
      
      console.log("Complete request data:", JSON.stringify(requestData));
      
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include', // Important: Include cookies for authentication
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId // Use the custom header for tenant ID
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error('Failed to save mission data: ' + errorText);
      }
      
      const text = await response.text();
      return text ? JSON.parse(text) : {};
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Mission and vision data saved successfully",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/organization-mission', tenantId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save mission and vision data",
        variant: "destructive"
      });
      console.error("Error saving mission data:", error);
    }
  });

  // Initialize data when mission data is loaded
  useEffect(() => {
    if (missionData?.exists) {
      setMissionStatement(missionData.mission || "");
      setMissionDraft(missionData.mission || "");
      
      setVision(missionData.vision || "");
      setVisionDraft(missionData.vision || "");
      
      setPurpose(missionData.purpose || "");
      setPurposeDraft(missionData.purpose || "");
      
      setValues(missionData.values || "");
      setValuesDraft(missionData.values || "");
      
      setStrategicDirection(missionData.strategicDirection || "");
      setStrategicDirectionDraft(missionData.strategicDirection || "");
      
      // Parse behaviors from JSON string if available
      try {
        const parsedBehaviors = missionData.behaviors ? JSON.parse(missionData.behaviors) : [];
        setBehaviors(Array.isArray(parsedBehaviors) ? parsedBehaviors : []);
        setBehaviorsDraft(Array.isArray(parsedBehaviors) ? [...parsedBehaviors] : []);
      } catch (error) {
        console.error("Error parsing behaviors:", error);
        setBehaviors([]);
        setBehaviorsDraft([]);
      }
      
      // Parse boundaries from JSON string if available
      try {
        const parsedBoundaries = missionData.boundaries ? JSON.parse(missionData.boundaries) : { freedoms: [], constraints: [] };
        setBoundaries({
          freedoms: Array.isArray(parsedBoundaries.freedoms) ? parsedBoundaries.freedoms : [],
          constraints: Array.isArray(parsedBoundaries.constraints) ? parsedBoundaries.constraints : []
        });
        setBoundariesDraft({
          freedoms: Array.isArray(parsedBoundaries.freedoms) ? [...parsedBoundaries.freedoms] : [],
          constraints: Array.isArray(parsedBoundaries.constraints) ? [...parsedBoundaries.constraints] : []
        });
      } catch (error) {
        console.error("Error parsing boundaries:", error);
        setBoundaries({ freedoms: [], constraints: [] });
        setBoundariesDraft({ freedoms: [], constraints: [] });
      }
    } else {
      // Set default values if no data exists
      const defaultBehaviors = [
        "I will mentor my team more effectively by acknowledging their achievements and challenges",
        "I will delegate more tasks and responsibilities to my team",
        "I will strive to deliver efficient and cost-effective solutions",
        "I will keep abreast with emerging technologies and encourage innovation within the team"
      ];
      
      const defaultBoundaries = {
        freedoms: [
          "Supportive management team", 
          "Motivated and professional team", 
          "Flexibility to experiment and implement new solutions"
        ],
        constraints: [
          "Financial resources, affecting ability to invest in new technologies",
          "Delivery timelines",
          "Resistance to change challenges"
        ]
      };
      
      setBehaviors(defaultBehaviors);
      setBehaviorsDraft([...defaultBehaviors]);
      
      setBoundaries(defaultBoundaries);
      setBoundariesDraft({...defaultBoundaries});
    }
  }, [missionData]);

  // Boundaries state is already defined above, no need to re-declare

  // Handle full page edit save
  const saveFullPageEdit = async () => {
    setIsLoading(true);
    
    console.log("Starting save process...");
    console.log("Mission draft:", missionDraft);
    console.log("Tenant ID:", tenantId);
    
    try {
      const saveData = {
        mission: missionDraft,
        vision: visionDraft,
        purpose: purposeDraft,
        values: valuesDraft,
        strategicDirection: strategicDirectionDraft,
        behaviors: JSON.stringify(behaviorsDraft),
        boundaries: JSON.stringify(boundariesDraft)
      };
      
      console.log("Saving data:", saveData);
      
      await saveMissionMutation.mutateAsync(saveData);
      
      // Update local state after successful save
      setMissionStatement(missionDraft);
      setVision(visionDraft);
      setStrategicDirection(strategicDirectionDraft);
      setBoundaries({
        freedoms: [...boundariesDraft.freedoms],
        constraints: [...boundariesDraft.constraints]
      });
      setBehaviors([...behaviorsDraft]);
      setFullPageEditMode(false);
      
      toast({
        title: "Success",
        description: "Mission data saved successfully",
      });
      
      console.log("Save completed successfully");
    } catch (error) {
      console.error("Save failed with error:", error);
      
      let errorMessage = "Failed to save mission data";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Save Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel full page edit
  const cancelFullPageEdit = () => {
    setMissionDraft(missionStatement);
    setBoundariesDraft({
      freedoms: [...boundaries.freedoms],
      constraints: [...boundaries.constraints]
    });
    setBehaviorsDraft([...behaviors]);
    setFullPageEditMode(false);
  };

  // Handle mission save (for individual card edits)
  const saveMission = async () => {
    setIsLoading(true);
    
    try {
      await saveMissionMutation.mutateAsync({
        mission: missionDraft,
        vision: vision,
        purpose: purpose,
        values: values,
        strategicDirection: strategicDirection,
        behaviors: JSON.stringify(behaviors),
        boundaries: JSON.stringify(boundaries)
      });
      
      setMissionStatement(missionDraft);
      setEditMode({...editMode, mission: false});
      
      toast({
        title: "Success",
        description: "Mission statement updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update mission statement",
        variant: "destructive"
      });
      console.error("Error saving mission:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle behaviors save (for individual card edits)
  const saveBehaviors = async () => {
    setIsLoading(true);
    
    try {
      await saveMissionMutation.mutateAsync({
        mission: missionStatement,
        vision: vision,
        strategicDirection: strategicDirection,
        behaviors: JSON.stringify(behaviorsDraft),
        boundaries: JSON.stringify(boundaries)
      });
      
      setBehaviors([...behaviorsDraft]);
      setEditMode({...editMode, behaviors: false});
      setNewBehavior("");
      
      toast({
        title: "Success",
        description: "Behaviors updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update behaviors",
        variant: "destructive"
      });
      console.error("Error saving behaviors:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle purpose save (for individual card edits)
  const savePurpose = async () => {
    setIsLoading(true);
    
    try {
      await saveMissionMutation.mutateAsync({
        mission: missionStatement,
        vision: vision,
        purpose: purposeDraft,
        values: values,
        strategicDirection: strategicDirection,
        behaviors: JSON.stringify(behaviors),
        boundaries: JSON.stringify(boundaries)
      });
      
      setPurpose(purposeDraft);
      setEditMode({...editMode, purpose: false});
      
      toast({
        title: "Success",
        description: "Purpose updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update purpose",
        variant: "destructive"
      });
      console.error("Error saving purpose:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle values save (for individual card edits)
  const saveValues = async () => {
    setIsLoading(true);
    
    try {
      await saveMissionMutation.mutateAsync({
        mission: missionStatement,
        vision: vision,
        purpose: purpose,
        values: valuesDraft,
        strategicDirection: strategicDirection,
        behaviors: JSON.stringify(behaviors),
        boundaries: JSON.stringify(boundaries)
      });
      
      setValues(valuesDraft);
      setEditMode({...editMode, values: false});
      
      toast({
        title: "Success",
        description: "Values updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update values",
        variant: "destructive"
      });
      console.error("Error saving values:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle boundaries save (for individual card edits)
  const saveBoundaries = async () => {
    setIsLoading(true);
    
    try {
      await saveMissionMutation.mutateAsync({
        mission: missionStatement,
        vision: vision,
        purpose: purpose,
        values: values,
        strategicDirection: strategicDirection,
        behaviors: JSON.stringify(behaviors),
        boundaries: JSON.stringify(boundariesDraft)
      });
      
      setBoundaries({
        freedoms: [...boundariesDraft.freedoms],
        constraints: [...boundariesDraft.constraints]
      });
      setEditMode({...editMode, boundaries: false});
      setNewFreedom("");
      setNewConstraint("");
      
      toast({
        title: "Success",
        description: "Boundaries updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update boundaries",
        variant: "destructive"
      });
      console.error("Error saving boundaries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add new behavior
  const addBehavior = () => {
    if (newBehavior.trim()) {
      setBehaviorsDraft([...behaviorsDraft, newBehavior]);
      setNewBehavior("");
    }
  };

  // Remove behavior
  const removeBehavior = (index: number) => {
    setBehaviorsDraft(behaviorsDraft.filter((_, i) => i !== index));
  };

  // Add new freedom
  const addFreedom = () => {
    if (newFreedom.trim()) {
      setBoundariesDraft({
        ...boundariesDraft,
        freedoms: [...boundariesDraft.freedoms, newFreedom]
      });
      setNewFreedom("");
    }
  };

  // Remove freedom
  const removeFreedom = (index: number) => {
    setBoundariesDraft({
      ...boundariesDraft,
      freedoms: boundariesDraft.freedoms.filter((_, i) => i !== index)
    });
  };

  // Add new constraint
  const addConstraint = () => {
    if (newConstraint.trim()) {
      setBoundariesDraft({
        ...boundariesDraft,
        constraints: [...boundariesDraft.constraints, newConstraint]
      });
      setNewConstraint("");
    }
  };

  // Remove constraint
  const removeConstraint = (index: number) => {
    setBoundariesDraft({
      ...boundariesDraft,
      constraints: boundariesDraft.constraints.filter((_, i) => i !== index)
    });
  };

  // Render full page edit mode
  if (fullPageEditMode) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">FY24 Mission</h1>
            
            <div className="border-b border-gray-200 mb-6">
              <div className="flex space-x-6">
                <button 
                  className={`pb-3 px-1 ${activeEditTab === 'strategic' ? 'border-b-2 border-blue-600 font-medium text-blue-600' : 'text-gray-500'}`}
                  onClick={() => setActiveEditTab('strategic')}
                >
                  Strategic Direction
                </button>
                <button 
                  className={`pb-3 px-1 ${activeEditTab === 'boundaries' ? 'border-b-2 border-blue-600 font-medium text-blue-600' : 'text-gray-500'}`}
                  onClick={() => setActiveEditTab('boundaries')}
                >
                  Boundaries
                </button>
                <button 
                  className={`pb-3 px-1 ${activeEditTab === 'behaviors' ? 'border-b-2 border-blue-600 font-medium text-blue-600' : 'text-gray-500'}`}
                  onClick={() => setActiveEditTab('behaviors')}
                >
                  Behaviours
                </button>
              </div>
            </div>

            <div className="absolute top-6 right-6 flex space-x-2">
              <Button 
                onClick={saveFullPageEdit}
                className="bg-green-100 hover:bg-green-200 text-green-700 rounded-md"
              >
                <Check className="h-5 w-5" />
              </Button>
              <Button 
                onClick={cancelFullPageEdit}
                className="bg-red-100 hover:bg-red-200 text-red-700 rounded-md"
                variant="outline"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {activeEditTab === 'strategic' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="owner" className="text-sm font-medium">
                    Owner <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="owner"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    className="max-w-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="max-w-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mission" className="text-sm font-medium">
                    Mission Statement <span className="text-red-500">*</span>
                  </Label>
                  <Textarea 
                    id="mission"
                    value={missionDraft}
                    onChange={(e) => setMissionDraft(e.target.value)}
                    className="min-h-[100px] max-w-xl"
                  />
                </div>

                <div className="space-y-2 mt-8">
                  <Label className="text-sm font-medium">One Up Mission Statement</Label>
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200 max-w-xl">
                    <p className="text-gray-700 text-sm">{oneLevelMission}</p>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <Switch 
                      checked={overrideOneLevelMission}
                      onCheckedChange={setOverrideOneLevelMission}
                      id="override-one-up"
                    />
                    <Label htmlFor="override-one-up" className="text-sm font-medium cursor-pointer">
                      Override
                    </Label>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label className="text-sm font-medium">Two Up Mission Statement</Label>
                  {twoLevelMission ? (
                    <div className="bg-gray-50 p-4 rounded-md border border-gray-200 max-w-xl">
                      <p className="text-gray-700 text-sm">{twoLevelMission}</p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-md border border-gray-200 max-w-xl">
                      <p className="text-gray-400 text-sm italic">No mission statement defined</p>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 mt-2">
                    <Switch 
                      checked={overrideTwoLevelMission}
                      onCheckedChange={setOverrideTwoLevelMission}
                      id="override-two-up"
                      disabled={!twoLevelMission}
                    />
                    <Label htmlFor="override-two-up" className="text-sm font-medium cursor-pointer">
                      Override
                    </Label>
                  </div>
                </div>

                <div className="mt-10">
                  <Button 
                    onClick={saveFullPageEdit}
                    className="bg-primary text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>
            )}

            {activeEditTab === 'boundaries' && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Freedoms</h3>
                  <div className="space-y-3 max-w-xl">
                    {boundariesDraft.freedoms.map((freedom, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input 
                          value={freedom}
                          onChange={(e) => {
                            const updatedFreedoms = [...boundariesDraft.freedoms];
                            updatedFreedoms[index] = e.target.value;
                            setBoundariesDraft({
                              ...boundariesDraft,
                              freedoms: updatedFreedoms
                            });
                          }}
                        />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeFreedom(index)}
                        >
                          <XCircle className="h-5 w-5 text-red-500" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 mt-4">
                      <Input 
                        placeholder="Add a new freedom"
                        value={newFreedom}
                        onChange={(e) => setNewFreedom(e.target.value)}
                      />
                      <Button 
                        variant="outline" 
                        onClick={addFreedom}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Constraints</h3>
                  <div className="space-y-3 max-w-xl">
                    {boundariesDraft.constraints.map((constraint, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input 
                          value={constraint}
                          onChange={(e) => {
                            const updatedConstraints = [...boundariesDraft.constraints];
                            updatedConstraints[index] = e.target.value;
                            setBoundariesDraft({
                              ...boundariesDraft,
                              constraints: updatedConstraints
                            });
                          }}
                        />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeConstraint(index)}
                        >
                          <XCircle className="h-5 w-5 text-red-500" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 mt-4">
                      <Input 
                        placeholder="Add a new constraint"
                        value={newConstraint}
                        onChange={(e) => setNewConstraint(e.target.value)}
                      />
                      <Button 
                        variant="outline" 
                        onClick={addConstraint}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-10">
                  <Button 
                    onClick={saveFullPageEdit}
                    className="bg-primary text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>
            )}

            {activeEditTab === 'behaviors' && (
              <div className="space-y-6">
                <div className="space-y-3 max-w-xl">
                  {behaviorsDraft.map((behavior, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input 
                        value={behavior}
                        onChange={(e) => {
                          const updatedBehaviors = [...behaviorsDraft];
                          updatedBehaviors[index] = e.target.value;
                          setBehaviorsDraft(updatedBehaviors);
                        }}
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeBehavior(index)}
                      >
                        <XCircle className="h-5 w-5 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 mt-4">
                    <Input 
                      placeholder="Add a new behavior"
                      value={newBehavior}
                      onChange={(e) => setNewBehavior(e.target.value)}
                    />
                    <Button 
                      variant="outline" 
                      onClick={addBehavior}
                    >
                      Add
                    </Button>
                  </div>
                </div>

                <div className="mt-10">
                  <Button 
                    onClick={saveFullPageEdit}
                    className="bg-primary text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Regular view mode
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-900">Mission</h1>
            {canViewOnly && (
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                View Only
              </span>
            )}
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" className="flex items-center gap-2">
              <FileDown className="h-4 w-4" />
              <span>Export</span>
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Presentation className="h-4 w-4" />
              <span>Present</span>
            </Button>
            {canEditMission && (
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => {
                  setMissionDraft(missionStatement);
                  setBoundariesDraft({
                    freedoms: [...boundaries.freedoms],
                    constraints: [...boundaries.constraints]
                  });
                  setBehaviorsDraft([...behaviors]);
                  setFullPageEditMode(true);
                  setActiveEditTab('strategic');
                }}
              >
                <PenBox className="h-4 w-4" />
                <span>Edit</span>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mission Statement */}
          <Card className="border-t-4 border-t-blue-600">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Mission Statement</CardTitle>
                <CardDescription>Team mission statement, who are we and what do we do?</CardDescription>
              </div>
              {!editMode.mission ? (
                canEditMission && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setEditMode({...editMode, mission: true});
                      setMissionDraft(missionStatement);
                    }}
                    className="hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )
              ) : (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setMissionDraft(missionStatement);
                      setEditMode({...editMode, mission: false});
                    }}
                    disabled={isLoading}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={saveMission}
                    disabled={isLoading || !missionDraft.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!editMode.mission ? (
                <div className="space-y-2">
                  <p className="text-gray-700 leading-relaxed">
                    {missionStatement || "No mission statement defined yet. Click Edit to add one."}
                  </p>
                  {!missionStatement && (
                    <p className="text-sm text-gray-500 italic">
                      A clear mission statement helps align your team's objectives and goals.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <Textarea 
                    value={missionDraft} 
                    onChange={(e) => setMissionDraft(e.target.value)}
                    className="min-h-[120px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your team mission statement here..."
                  />
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{missionDraft.length} characters</span>
                    <span className="text-xs">
                      Tip: A good mission statement is clear, concise, and inspiring
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Strategic Directions - Real Database Data */}
          <StrategicDirectionsDisplay className="border-t-4 border-t-green-600" />

          {/* Vision */}
          <Card className="border-t-4 border-t-purple-600">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Vision</CardTitle>
                <CardDescription>Our vision for the future</CardDescription>
              </div>
              {!editMode.vision ? (
                canEditMission && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setEditMode({...editMode, vision: true});
                      setVisionDraft(vision);
                    }}
                    className="hover:bg-purple-50 hover:text-purple-700 transition-colors"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )
              ) : (
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setEditMode({...editMode, vision: false});
                      setVisionDraft(vision);
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={async () => {
                      setIsLoading(true);
                      try {
                        await saveMissionMutation.mutateAsync({
                          mission: missionStatement,
                          vision: visionDraft,
                          purpose: purpose,
                          values: values,
                          strategicDirection: strategicDirection,
                          behaviors: JSON.stringify(behaviors),
                          boundaries: JSON.stringify(boundaries)
                        });
                        setVision(visionDraft);
                        setEditMode({...editMode, vision: false});
                        toast({
                          title: "Success",
                          description: "Vision updated successfully",
                        });
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Failed to update vision",
                          variant: "destructive"
                        });
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    disabled={isLoading || !visionDraft.trim()}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!editMode.vision ? (
                <div className="space-y-2">
                  <p className="text-gray-700 leading-relaxed">
                    {vision || "No vision statement defined yet. Click Edit to add one."}
                  </p>
                  {!vision && (
                    <p className="text-sm text-gray-500 italic">
                      A compelling vision statement inspires and guides your organization toward the future.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <Textarea 
                    value={visionDraft} 
                    onChange={(e) => setVisionDraft(e.target.value)}
                    className="min-h-[120px] focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter your vision statement here..."
                  />
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{visionDraft.length} characters</span>
                    <span className="text-xs">
                      Tip: A vision statement should be inspiring and future-focused
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Purpose */}
          <Card className="border-t-4 border-t-indigo-600">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Purpose</CardTitle>
                <CardDescription>Why we exist and what drives us</CardDescription>
              </div>
              {!editMode.purpose ? (
                canEditMission && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setEditMode({...editMode, purpose: true});
                      setPurposeDraft(purpose);
                    }}
                    className="hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )
              ) : (
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setEditMode({...editMode, purpose: false});
                      setPurposeDraft(purpose);
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={savePurpose}
                    disabled={isLoading || !purposeDraft.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!editMode.purpose ? (
                <div className="space-y-2">
                  <p className="text-gray-700 leading-relaxed">
                    {purpose || "No purpose statement defined yet. Click Edit to add one."}
                  </p>
                  {!purpose && (
                    <p className="text-sm text-gray-500 italic">
                      A clear purpose statement explains why your organization exists.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <Textarea 
                    value={purposeDraft} 
                    onChange={(e) => setPurposeDraft(e.target.value)}
                    className="min-h-[120px] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your purpose statement here..."
                  />
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{purposeDraft.length} characters</span>
                    <span className="text-xs">
                      Tip: A purpose statement should explain why your organization exists
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Values */}
          <Card className="border-t-4 border-t-teal-600">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Values</CardTitle>
                <CardDescription>Core principles that guide our behavior</CardDescription>
              </div>
              {!editMode.values ? (
                canEditMission && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setEditMode({...editMode, values: true});
                      setValuesDraft(values);
                    }}
                    className="hover:bg-teal-50 hover:text-teal-700 transition-colors"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )
              ) : (
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setEditMode({...editMode, values: false});
                      setValuesDraft(values);
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={saveValues}
                    disabled={isLoading || !valuesDraft.trim()}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!editMode.values ? (
                <div className="space-y-2">
                  <p className="text-gray-700 leading-relaxed">
                    {values || "No values defined yet. Click Edit to add them."}
                  </p>
                  {!values && (
                    <p className="text-sm text-gray-500 italic">
                      Values represent the core principles that guide your organization's behavior.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <Textarea 
                    value={valuesDraft} 
                    onChange={(e) => setValuesDraft(e.target.value)}
                    className="min-h-[120px] focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Enter your core values here..."
                  />
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{valuesDraft.length} characters</span>
                    <span className="text-xs">
                      Tip: Values should be clear, actionable principles that guide decisions
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Boundaries */}
          <Card className="border-t-4 border-t-amber-600">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Boundaries</CardTitle>
                <CardDescription>Freedoms and constraints that impact our work</CardDescription>
              </div>
              {!editMode.boundaries ? (
                canEditBehaviors && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setEditMode({...editMode, boundaries: true});
                      setBoundariesDraft({
                        freedoms: [...boundaries.freedoms],
                        constraints: [...boundaries.constraints]
                      });
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={saveBoundaries}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="freedoms">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="freedoms">Freedoms</TabsTrigger>
                  <TabsTrigger value="constraints">Constraints</TabsTrigger>
                </TabsList>
                
                <TabsContent value="freedoms">
                  {!editMode.boundaries ? (
                    <ul className="space-y-2">
                      {boundaries.freedoms.map((freedom, index) => (
                        <li key={index} className="text-gray-700 flex items-start">
                          <span className="mr-2">•</span>
                          <span>{freedom}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="space-y-3">
                      {boundariesDraft.freedoms.map((freedom, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input 
                            value={freedom}
                            onChange={(e) => {
                              const updatedFreedoms = [...boundariesDraft.freedoms];
                              updatedFreedoms[index] = e.target.value;
                              setBoundariesDraft({
                                ...boundariesDraft,
                                freedoms: updatedFreedoms
                              });
                            }}
                          />
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeFreedom(index)}
                          >
                            <XCircle className="h-5 w-5 text-red-500" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex items-center gap-2 mt-4">
                        <Input 
                          placeholder="Add a new freedom"
                          value={newFreedom}
                          onChange={(e) => setNewFreedom(e.target.value)}
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={addFreedom}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="constraints">
                  {!editMode.boundaries ? (
                    <ul className="space-y-2">
                      {boundaries.constraints.map((constraint, index) => (
                        <li key={index} className="text-gray-700 flex items-start">
                          <span className="mr-2">•</span>
                          <span>{constraint}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="space-y-3">
                      {boundariesDraft.constraints.map((constraint, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input 
                            value={constraint}
                            onChange={(e) => {
                              const updatedConstraints = [...boundariesDraft.constraints];
                              updatedConstraints[index] = e.target.value;
                              setBoundariesDraft({
                                ...boundariesDraft,
                                constraints: updatedConstraints
                              });
                            }}
                          />
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeConstraint(index)}
                          >
                            <XCircle className="h-5 w-5 text-red-500" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex items-center gap-2 mt-4">
                        <Input 
                          placeholder="Add a new constraint"
                          value={newConstraint}
                          onChange={(e) => setNewConstraint(e.target.value)}
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={addConstraint}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Behaviors */}
          <Card className="border-t-4 border-t-cyan-600 lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Behaviors</CardTitle>
                <CardDescription>Behaviors we commit to displaying</CardDescription>
              </div>
              {!editMode.behaviors ? (
                canEditBehaviors && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setEditMode({...editMode, behaviors: true});
                      setBehaviorsDraft([...behaviors]);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={saveBehaviors}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {!editMode.behaviors ? (
                <ul className="space-y-3">
                  {behaviors.map((behavior, index) => (
                    <li key={index} className="flex items-start gap-2 border-b pb-2 last:border-0">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{behavior}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="space-y-3">
                  {behaviorsDraft.map((behavior, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input 
                        value={behavior}
                        onChange={(e) => {
                          const updatedBehaviors = [...behaviorsDraft];
                          updatedBehaviors[index] = e.target.value;
                          setBehaviorsDraft(updatedBehaviors);
                        }}
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeBehavior(index)}
                      >
                        <XCircle className="h-5 w-5 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 mt-4">
                    <Input 
                      placeholder="Add a new behavior"
                      value={newBehavior}
                      onChange={(e) => setNewBehavior(e.target.value)}
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={addBehavior}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Teams OKRs Section */}
          <div className="lg:col-span-2 mt-6">
            <TeamsOkrsView />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}