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
import DashboardLayout from "@/layouts/dashboard-layout";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Mission() {
  const [location] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Extract tenantId from URL path - format could be either:
  // 1. /:id([A-Z0-9]{26})/mission (new ULID format)
  // 2. /organization/:organisation/mission (legacy format)
  const pathParts = location.split('/');
  const tenantId = pathParts[1] === 'organization' ? pathParts[2] : pathParts[1];

  // State for full page edit mode
  const [fullPageEditMode, setFullPageEditMode] = useState(false);
  const [activeEditTab, setActiveEditTab] = useState<'strategic' | 'boundaries' | 'behaviors'>('strategic');
  
  // State for editable sections (individual card editing)
  const [editMode, setEditMode] = useState<{
    mission: boolean;
    boundaries: boolean;
    behaviors: boolean;
  }>({
    mission: false,
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
  const [oneLevelMission, setOneLevelMission] = useState(
    "To become the biggest reach, most influential and trusted company in the communication business in order to deliver sustainable profits for shareholders and staff - by providing indispensable information and entertainment that enhances the lives of 15-30-year-old Kenyans."
  );
  const [twoLevelMission, setTwoLevelMission] = useState("");
  
  // Override toggles
  const [overrideOneLevelMission, setOverrideOneLevelMission] = useState(false);
  const [overrideTwoLevelMission, setOverrideTwoLevelMission] = useState(false);

  // Vision state
  const [vision, setVision] = useState("");
  const [visionDraft, setVisionDraft] = useState("");
  
  // Purpose state (read from company)
  const [purpose, setPurpose] = useState("Enter Purpose");
  
  // Values state (read from company)
  const [values, setValues] = useState("Enter Values");

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
  const { data: missionData, isLoading: isMissionLoading } = useQuery({
    queryKey: ['/api/organization-mission', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/organization-mission?tenantId=${tenantId}`, { 
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch mission data');
      }
      return response.json();
    },
    enabled: !!tenantId // Only run query when tenantId is available
  });

  // Mutation to save organization mission data
  const saveMissionMutation = useMutation({
    mutationFn: async (data: {
      mission: string;
      vision: string;
      behaviors: string;
      boundaries: string;
      strategicDirection: string;
    }) => {
      // Add tenantId to the request data
      const dataWithTenant = { ...data, tenantId };
      console.log(JSON.stringify(dataWithTenant));
      const response = await fetch('/api/organization-mission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataWithTenant)
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
    
    try {
      await saveMissionMutation.mutateAsync({
        mission: missionDraft,
        vision: visionDraft, 
        strategicDirection: strategicDirectionDraft,
        behaviors: JSON.stringify(behaviorsDraft),
        boundaries: JSON.stringify(boundariesDraft)
      });
      
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
        description: "Organization mission data saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save organization mission data",
        variant: "destructive"
      });
      console.error("Error saving mission data:", error);
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

  // Handle boundaries save (for individual card edits)
  const saveBoundaries = async () => {
    setIsLoading(true);
    
    try {
      await saveMissionMutation.mutateAsync({
        mission: missionStatement,
        vision: vision,
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
          <h1 className="text-3xl font-bold text-gray-900">Mission</h1>
          <div className="flex space-x-3">
            <Button variant="outline" className="flex items-center gap-2">
              <FileDown className="h-4 w-4" />
              <span>Export</span>
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Presentation className="h-4 w-4" />
              <span>Present</span>
            </Button>
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
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setEditMode({...editMode, mission: true});
                    setMissionDraft(missionStatement);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={saveMission}
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
              {!editMode.mission ? (
                <p className="text-gray-700">{missionStatement}</p>
              ) : (
                <Textarea 
                  value={missionDraft} 
                  onChange={(e) => setMissionDraft(e.target.value)}
                  className="min-h-[120px]"
                  placeholder="Enter your team mission statement here"
                />
              )}
            </CardContent>
          </Card>

          {/* Strategic Direction */}
          <Card className="border-t-4 border-t-green-600">
            <CardHeader>
              <CardTitle>Strategic Direction</CardTitle>
              <CardDescription>From CEO Mission</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-line text-gray-700">{strategicDirection}</div>
            </CardContent>
          </Card>

          {/* Vision, Purpose, and Values */}
          <Card className="border-t-4 border-t-purple-600">
            <CardHeader>
              <CardTitle>Company Strategy</CardTitle>
              <CardDescription>Company vision, purpose and values</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="vision">
                  <AccordionTrigger>Vision</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-700">{vision}</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="purpose">
                  <AccordionTrigger>Purpose</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-700">{purpose}</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="values">
                  <AccordionTrigger>Values</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-700">{values}</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
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