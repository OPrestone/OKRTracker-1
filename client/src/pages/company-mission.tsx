import { useState } from "react";
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
  User
} from "lucide-react";
import { TeamsOkrsView } from "@/components/mission/teams-okrs-view";
import DashboardLayout from "@/layouts/dashboard-layout";

export default function CompanyMission() {
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
  const [missionStatement, setMissionStatement] = useState(
    "To provide cutting edge technological and digital solutions that ensures RAL is able to generate 1.5B in revenue and a cumulative audience of 37M"
  );
  const [missionDraft, setMissionDraft] = useState(missionStatement);

  // Strategic Direction state (read from company)
  const strategicDirection = `One Level Up
To become the biggest reach, most influential and trusted company in the communications
landscape in order to deliver sustainable profits for shareholders and staff - by providing
indispensable information and entertainment that enhance the lives of 16-35 year old
Kenyans.`;

  // Level mission statements
  const [oneLevelMission, setOneLevelMission] = useState(
    "To become the biggest reach, most influential and trusted company in the communication business in order to deliver sustainable profits for shareholders and staff - by providing indispensable information and entertainment that enhances the lives of 15-30-year-old Kenyans."
  );
  const [twoLevelMission, setTwoLevelMission] = useState("");
  
  // Override toggles
  const [overrideOneLevelMission, setOverrideOneLevelMission] = useState(false);
  const [overrideTwoLevelMission, setOverrideTwoLevelMission] = useState(false);

  // Vision state (read from company)
  const [vision, setVision] = useState("Enter Vision");
  
  // Purpose state (read from company)
  const [purpose, setPurpose] = useState("Enter Purpose");
  
  // Values state (read from company)
  const [values, setValues] = useState("Enter Values");

  // Behaviors state
  const [behaviors, setBehaviors] = useState([
    "I will mentor my team more effectively by acknowledging their achievements and challenges",
    "I will delegate more task and responsibilities to my team",
    "I will strive to deliver efficient and cost efficient ICT solutions",
    "I will keep abreast with emerging technologies and encourage innovation within the team"
  ]);
  const [behaviorsDraft, setBehaviorsDraft] = useState([...behaviors]);
  const [newBehavior, setNewBehavior] = useState("");

  // Boundaries state
  const [boundaries, setBoundaries] = useState({
    freedoms: [
      "Supportive GCEO, GCCO and management team",
      "Motivated and professional team",
      "Flexibility to experiment and implement ICT solutions"
    ],
    constraints: [
      "Financial resources, affecting their ability to invest in new technologies or upgrades",
      "Consultant Delivery Timelines",
      "Resistance to Change challenges"
    ]
  });
  
  const [boundariesDraft, setBoundariesDraft] = useState({
    freedoms: [...boundaries.freedoms],
    constraints: [...boundaries.constraints]
  });
  
  const [newFreedom, setNewFreedom] = useState("");
  const [newConstraint, setNewConstraint] = useState("");

  // Handle full page edit save
  const saveFullPageEdit = () => {
    setMissionStatement(missionDraft);
    setBoundaries({
      freedoms: [...boundariesDraft.freedoms],
      constraints: [...boundariesDraft.constraints]
    });
    setBehaviors([...behaviorsDraft]);
    setFullPageEditMode(false);
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
  const saveMission = () => {
    setMissionStatement(missionDraft);
    setEditMode({...editMode, mission: false});
  };

  // Handle behaviors save (for individual card edits)
  const saveBehaviors = () => {
    setBehaviors([...behaviorsDraft]);
    setEditMode({...editMode, behaviors: false});
    setNewBehavior("");
  };

  // Handle boundaries save (for individual card edits)
  const saveBoundaries = () => {
    setBoundaries({
      freedoms: [...boundariesDraft.freedoms],
      constraints: [...boundariesDraft.constraints]
    });
    setEditMode({...editMode, boundaries: false});
    setNewFreedom("");
    setNewConstraint("");
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
      <DashboardLayout title="FY24 Mission - Edit Mode">
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
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Behaviors</h3>
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

  return (
    <DashboardLayout title="FY24 Mission">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">FY24 Mission</h1>
            <div className="flex items-center text-sm text-gray-500">
              <span className="inline-flex items-center mr-2">
                <User className="h-4 w-4 text-gray-400 mr-1" />
                {owner}
              </span>
              <span className="inline-flex items-center">
                <span className="text-gray-400">•</span>
                <span className="ml-2">{title}</span>
              </span>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" size="sm" className="h-9">
              <FileDown className="mr-2 h-4 w-4" />
              <span>Export</span>
            </Button>
            <Button variant="outline" size="sm" className="h-9">
              <Presentation className="mr-2 h-4 w-4" />
              <span>Present</span>
            </Button>
            <Button 
              size="sm" 
              className="h-9"
              onClick={() => setFullPageEditMode(true)}
            >
              <PenBox className="mr-2 h-4 w-4" />
              <span>Edit All</span>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="mission-page">
          <TabsList className="w-full bg-gray-50 border border-gray-200 rounded-lg p-1">
            <TabsTrigger 
              value="mission-page" 
              className="rounded-md flex-1 data-[state=active]:shadow-sm py-2.5"
            >
              Mission & Strategic Direction
            </TabsTrigger>
            <TabsTrigger 
              value="boundaries-page" 
              className="rounded-md flex-1 data-[state=active]:shadow-sm py-2.5"
            >
              Boundaries
            </TabsTrigger>
            <TabsTrigger 
              value="behaviors-page" 
              className="rounded-md flex-1 data-[state=active]:shadow-sm py-2.5"
            >
              Behaviours
            </TabsTrigger>
            <TabsTrigger 
              value="team-alignment" 
              className="rounded-md flex-1 data-[state=active]:shadow-sm py-2.5"
            >
              Team OKRs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mission-page" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-3">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Mission Statement</CardTitle>
                    <CardDescription>
                      The core purpose of your department or team
                    </CardDescription>
                  </div>
                  {!editMode.mission && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditMode({...editMode, mission: true});
                        setMissionDraft(missionStatement);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {editMode.mission ? (
                    <div className="space-y-4">
                      <Textarea
                        value={missionDraft}
                        onChange={(e) => setMissionDraft(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <div className="flex space-x-2">
                        <Button onClick={saveMission} size="sm">
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditMode({...editMode, mission: false});
                            setMissionDraft(missionStatement);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-base">{missionStatement}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Strategic Alignment</CardTitle>
                  <CardDescription>
                    How your mission aligns with higher-level organizational objectives
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center">
                          <FileUp className="h-4 w-4 mr-2 text-gray-400" />
                          <span>One Level Up Strategic Direction</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="border-l-2 border-gray-200 pl-4 ml-2 mt-2">
                        <p className="text-sm whitespace-pre-line">{strategicDirection}</p>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center">
                          <FileUp className="h-4 w-4 mr-2 text-gray-400" />
                          <span>Vision</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="border-l-2 border-gray-200 pl-4 ml-2 mt-2">
                        <p className="text-sm">{vision}</p>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center">
                          <FileUp className="h-4 w-4 mr-2 text-gray-400" />
                          <span>Core Purpose</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="border-l-2 border-gray-200 pl-4 ml-2 mt-2">
                        <p className="text-sm">{purpose}</p>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-4">
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center">
                          <FileUp className="h-4 w-4 mr-2 text-gray-400" />
                          <span>Values</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="border-l-2 border-gray-200 pl-4 ml-2 mt-2">
                        <p className="text-sm">{values}</p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="boundaries-page" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Boundaries</CardTitle>
                  <CardDescription>
                    The freedoms and constraints that define your operational context
                  </CardDescription>
                </div>
                {!editMode.boundaries && (
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
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {editMode.boundaries ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-3 text-blue-600">Freedoms</h3>
                      <div className="space-y-2">
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

                    <div>
                      <h3 className="font-medium mb-3 text-red-600">Constraints</h3>
                      <div className="space-y-2">
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

                    <div className="flex space-x-2 pt-4">
                      <Button onClick={saveBoundaries} size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditMode({...editMode, boundaries: false});
                          setBoundariesDraft({
                            freedoms: [...boundaries.freedoms],
                            constraints: [...boundaries.constraints]
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-3 text-blue-600">Freedoms</h3>
                      <ul className="space-y-2 list-inside pl-5">
                        {boundaries.freedoms.map((freedom, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                            <span>{freedom}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-medium mb-3 text-red-600">Constraints</h3>
                      <ul className="space-y-2 list-inside pl-5">
                        {boundaries.constraints.map((constraint, index) => (
                          <li key={index} className="flex items-start">
                            <XCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                            <span>{constraint}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="behaviors-page" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Behaviors</CardTitle>
                  <CardDescription>
                    Key behaviors that will help achieve your mission
                  </CardDescription>
                </div>
                {!editMode.behaviors && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditMode({...editMode, behaviors: true});
                      setBehaviorsDraft([...behaviors]);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {editMode.behaviors ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
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

                    <div className="flex space-x-2 pt-4">
                      <Button onClick={saveBehaviors} size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditMode({...editMode, behaviors: false});
                          setBehaviorsDraft([...behaviors]);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <ul className="space-y-4 pl-5">
                    {behaviors.map((behavior, index) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-800 mr-3 flex-shrink-0 mt-0">
                          {index + 1}
                        </span>
                        <span>{behavior}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team-alignment" className="mt-6">
            <TeamsOkrsView />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}