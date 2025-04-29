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
  X
} from "lucide-react";
import { TeamsOkrsView } from "@/components/mission/teams-okrs-view";

export default function Mission() {
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
                    placeholder="Add a new behavior commitment"
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
    );
  }

  // Regular view mode
  return (
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
              >
                <Save className="h-4 w-4 mr-2" />
                Save
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
              >
                <Save className="h-4 w-4 mr-2" />
                Save
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
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!editMode.behaviors ? (
              <ul className="space-y-3">
                {behaviors.map((behavior, index) => (
                  <li key={index} className="flex items-start gap-2 border-b pb-2 last:border-0">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700">{behavior}</p>
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
                    placeholder="Add a new behavior commitment"
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
  );
}