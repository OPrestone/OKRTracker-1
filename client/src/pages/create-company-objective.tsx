import { useState } from "react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  AlertCircle,
  Building,
  Calendar,
  ChevronDown,
  CircleUser,
  Code,
  Edit,
  LinkIcon,
  Loader2,
  MoreHorizontal,
  NetworkIcon,
  PenSquare,
  Gauge,
  Plus,
  Target, 
  Users,
  X,
  Check,
  Tag,
  ArrowLeft,
  Trophy,
  Sparkles,
  Goal,
  ListChecks,
  MoveLeft,
  MoveRight,
  InfoIcon,
  Trash2,
  BarChart
} from "lucide-react";
import { useLocation } from "wouter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InsertObjective } from "@shared/schema";
import { apiRequest, getQueryFn, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface User {
  id: string;
  name: string;
  fullName: string;
  username: string;
  teamId: string | null;
  email?: string;
  avatarUrl?: string;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  ownerId: string | null;
  color?: string;
  icon?: string;
}

interface Timeframe {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  cadenceId: string | null;
  tenantId: string;
}

interface KeyResult {
  id?: string;
  title: string;
  description?: string;
  start_value: string;
  current_value: string;
  target_value: string;
  format?: string;
  progress?: number;
  assignedToId?: string;
}

// Form schema for creating objectives
const objectiveFormSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  description: z.string().optional(),
  teamId: z.string().optional(),
  ownerId: z.string().optional(),
  timeframeId: z.string().optional(),
  status: z.enum(["draft", "active", "completed", "archived"]).default("draft"),
  parentId: z.string().optional(),
  // Tags and contributors will be handled separately
});

// Form schema for key result
const keyResultSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().optional(),
  start_value: z.string().default("0"),
  current_value: z.string().default("0"),
  target_value: z.string().default("100"),
  assignedToId: z.string().optional(),
  format: z.enum(["number", "percentage", "currency", "boolean"]).default("number"),
});

type ObjectiveFormValues = z.infer<typeof objectiveFormSchema>;
type KeyResultFormValues = z.infer<typeof keyResultSchema>;

export default function CreateCompanyObjective() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [alignmentOption, setAlignmentOption] = useState<string>("strategic-pillar");
  const [progressDriver, setProgressDriver] = useState<string>("key-results");
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedContributors, setSelectedContributors] = useState<string[]>([]);
  const [keyResults, setKeyResults] = useState<KeyResult[]>([
    { title: "", description: "", start_value: "0", current_value: "0", target_value: "100", format: "number" }
  ]);
  const [activeTab, setActiveTab] = useState<string>("details");
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [objectiveType, setObjectiveType] = useState<string>("financial");
  
  // Set of objective types (matching the filtering options in company-okrs.tsx)
  const objectiveTypes = [
    { value: 'financial', label: 'Financial', icon: <BarChart className="h-4 w-4" /> },
    { value: 'product', label: 'Product', icon: <Target className="h-4 w-4" /> },
    { value: 'customer', label: 'Customer', icon: <Users className="h-4 w-4" /> },
    { value: 'market', label: 'Market', icon: <Target className="h-4 w-4" /> },
    { value: 'operations', label: 'Operations', icon: <Users className="h-4 w-4" /> },
    { value: 'people', label: 'People', icon: <Users className="h-4 w-4" /> },
    { value: 'process', label: 'Process', icon: <Goal className="h-4 w-4" /> },
    { value: 'technology', label: 'Technology', icon: <Code className="h-4 w-4" /> },
  ];
  
  // Set of tags based on request
  const availableTags = [
    "Innovation",
    "Customer Experience",
    "Growth",
    "Operational Excellence",
    "Sustainability"
  ];

  // Form setup
  const form = useForm<ObjectiveFormValues>({
    resolver: zodResolver(objectiveFormSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'draft',
      teamId: undefined,
      ownerId: undefined,
      timeframeId: undefined,
      parentId: undefined,
    }
  });

  // Key results form setup
  const keyResultForm = useForm<KeyResultFormValues>({
    resolver: zodResolver(keyResultSchema),
    defaultValues: {
      title: '',
      description: '',
      start_value: '0',
      current_value: '0',
      target_value: '100',
      format: 'number',
    }
  });

  // Create objective mutation
  const createObjectiveMutation = useMutation({
    mutationFn: async (payload: any) => {
      // Log the payload for debugging
      console.log("Sending payload to API:", payload);

      const response = await apiRequest("POST", "/api/objectives", payload);
      if (!response.ok) {
        const errorData = await response.json();
        // Check if it's a permissions error
        if (response.status === 403) {
          throw new Error(errorData.error || "Unauthorized. Only organization owners and admins can create company objectives.");
        }
        throw new Error(errorData.message || errorData.error || "Failed to create objective");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
      toast({
        title: "Company objective created",
        description: "Your company objective has been successfully created",
      });
      // Navigate to the company objectives list
      setLocation("/company-okrs");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create company objective",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch teams from API
  const { data: teams = [], isError: teamsError, error: teamsErrorData } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  // Fetch users from API
  const { data: users = [], isError: usersError, error: usersErrorData } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  // Fetch timeframes from API
  const { data: timeframes = [], isError: timeframesError, error: timeframesErrorData } = useQuery<Timeframe[]>({
    queryKey: ['/api/timeframes'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  // Fetch parent objectives from API for alignment
  const { data: objectives = [], isError: objectivesError, error: objectivesErrorData } = useQuery({
    queryKey: ['/api/objectives'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });
  
  // Check for any data loading errors
  const hasAuthError = teamsError || usersError || timeframesError || objectivesError;
  const isAuthError = 
    (teamsErrorData instanceof Error && teamsErrorData.message.includes("Unauthorized")) ||
    (usersErrorData instanceof Error && usersErrorData.message.includes("Unauthorized")) ||
    (timeframesErrorData instanceof Error && timeframesErrorData.message.includes("Unauthorized")) ||
    (objectivesErrorData instanceof Error && objectivesErrorData.message.includes("Unauthorized"));
  
  // Filter team members based on the selected team
  const teamMembers = users?.filter((user: User) => 
    selectedTeam && user.teamId === selectedTeam
  ) || [];

  const handleCancel = () => {
    setLocation("/company-okrs");
  };

  const onSubmit = (values: ObjectiveFormValues) => {
    // Log the form values and key results for debugging
    console.log("Form values:", values);
    console.log("Key results:", keyResults);
    
    // Validate key results before submission
    if (progressDriver === "key-results") {
      // Check if any key result doesn't have a title or has a title shorter than 3 characters
      const emptyKeyResults = keyResults.filter(kr => !kr.title || kr.title.trim().length < 3);
      
      if (emptyKeyResults.length > 0) {
        toast({
          title: "Validation Error",
          description: "Each key result must have a title of at least 3 characters",
          variant: "destructive",
        });
        setCurrentStep(3); // Ensure we're on the key results step
        return;
      }
      
      // If there are no key results defined, add a default one
      if (keyResults.length === 0) {
        const defaultKeyResult = { 
          title: "Achieve target goal", 
          description: "Default key result", 
          start_value: "0", 
          current_value: "0", 
          target_value: "100",
          format: "number"
        };
        setKeyResults([defaultKeyResult]);
        
        // If we added a default key result, wait a moment to ensure state update before submission
        setTimeout(() => {
          // Create a payload with the default key result
          const payload = {
            ...values,
            level: "company", // Set level to company for company objectives
            type: objectiveType, // Include the objective type
            keyResults: [{
              title: "Achieve target goal", 
              description: "Default key result", 
              start_value: "0", 
              current_value: "0", 
              target_value: "100",
              progress: 0,
              status: "not_started"
            }],
            tags: selectedTags,
            contributors: selectedContributors
          };
          console.log("Submitting payload with default key result:", payload);
          // Create the objective with the default key result
          createObjectiveMutation.mutate(payload);
        }, 100);
        return;
      }
    }

    // Create combined payload with form values and key results
    const payload = {
      ...values,
      level: "company", // Set level to company for company objectives
      type: objectiveType, // Include the objective type
      keyResults: keyResults.map(kr => ({
        title: kr.title,
        description: kr.description || "",
        start_value: kr.start_value || "0",
        current_value: kr.current_value || kr.start_value || "0",
        target_value: kr.target_value || "100",
        progress: kr.progress || 0,
        status: "not_started",
        assigned_to_id: kr.assignedToId
      })),
      tags: selectedTags,
      contributors: selectedContributors
    };
    
    console.log("Submitting payload:", payload);
    
    // Submit the payload directly through the mutation
    createObjectiveMutation.mutate(payload);
  };

  const handleTeamChange = (teamId: string) => {
    setSelectedTeam(teamId);
    form.setValue('teamId', teamId);
    // Reset selected contributors when team changes
    setSelectedContributors([]);
  };

  const handleContributorToggle = (userId: string) => {
    if (selectedContributors.includes(userId)) {
      setSelectedContributors(selectedContributors.filter(id => id !== userId));
    } else {
      setSelectedContributors([...selectedContributors, userId]);
    }
  };

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddKeyResult = () => {
    setKeyResults([...keyResults, { 
      title: "", 
      description: "", 
      start_value: "0", 
      current_value: "0", 
      target_value: "100",
      format: "number"
    }]);
  };

  const handleRemoveKeyResult = (index: number) => {
    const newKeyResults = [...keyResults];
    newKeyResults.splice(index, 1);
    setKeyResults(newKeyResults);
  };

  const handleKeyResultChange = (index: number, field: keyof KeyResult, value: string | number) => {
    const newKeyResults = [...keyResults];
    newKeyResults[index] = { ...newKeyResults[index], [field]: value };
    
    // Calculate progress based on values if it's a numeric field
    if (field === 'current_value' || field === 'target_value' || field === 'start_value') {
      const kr = newKeyResults[index];
      const start = parseFloat(kr.start_value) || 0;
      const current = parseFloat(kr.current_value) || 0;
      const target = parseFloat(kr.target_value) || 100;
      
      // Only calculate if target is different from start to avoid division by zero
      if (target !== start) {
        const progress = ((current - start) / (target - start)) * 100;
        newKeyResults[index].progress = Math.max(0, Math.min(100, progress));
      }
    }
    
    setKeyResults(newKeyResults);
  };

  const nextStep = () => {
    // Validate current step
    if (currentStep === 1) {
      const result = form.trigger(["title", "description"]);
      if (!result) return;
    }
    
    setCurrentStep(Math.min(currentStep + 1, 3));
    if (currentStep === 1) setActiveTab("alignment");
    if (currentStep === 2) setActiveTab("key-results");
  };

  const prevStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 1));
    if (currentStep === 3) setActiveTab("alignment");
    if (currentStep === 2) setActiveTab("details");
  };

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return "Company Objective Details";
      case 2: return "Alignment & Ownership";
      case 3: return "Key Results";
      default: return "Create Company Objective";
    }
  };

  // Show error message for authentication issues
  if (hasAuthError) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6 max-w-5xl">
          <Card className="overflow-hidden border-none shadow-lg">
            <CardHeader className="border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-primary/10 p-1.5">
                    <AlertCircle className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Authentication Required</CardTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={handleCancel}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="rounded-full bg-red-100 p-3 mb-4">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Authentication Error</h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  You need to be logged in and have the right permissions to create company objectives. Only organization owners and administrators can create company-level objectives.
                </p>
                <Button variant="default" onClick={handleCancel}>
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Show loading state when authentication is being checked
  if (createObjectiveMutation.isPending) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6 max-w-5xl">
          <Card className="overflow-hidden border-none shadow-lg">
            <CardHeader className="border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-primary/10 p-1.5">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Creating Company Objective...</CardTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={handleCancel} disabled>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative mb-6">
                  <div className="h-20 w-20 rounded-full border-4 border-primary/20"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  </div>
                </div>
                <h2 className="text-xl font-medium mb-2">Creating your company objective</h2>
                <p className="text-muted-foreground">Please wait while we save your Company OKR...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 max-w-5xl">
        <Card className="overflow-hidden border-none shadow-lg">
          <CardHeader className="border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-primary/10 p-1.5">
                  <Building className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{getStepTitle(currentStep)}</CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCancel}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="flex flex-col-reverse md:flex-row">
              {/* Main Content */}
              <div className="flex-1 p-6 md:border-r">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {/* Step 1: Details - First step */}
                    <AnimatePresence mode="wait">
                      {currentStep === 1 && (
                        <motion.div
                          key="step1"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-6"
                        >
                          <div className="space-y-2 mb-6">
                            <Label htmlFor="objective-type" className="text-base">Objective Type</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {objectiveTypes.map((type) => (
                                <div
                                  key={type.value}
                                  className={`flex items-center cursor-pointer p-3 rounded-md border-2 transition-all ${
                                    objectiveType === type.value
                                      ? "border-primary bg-primary/5"
                                      : "border-border hover:border-primary/50"
                                  }`}
                                  onClick={() => setObjectiveType(type.value)}
                                >
                                  <div className="mr-2 rounded-full bg-background p-1.5">
                                    {type.icon}
                                  </div>
                                  <span className="text-sm font-medium">{type.label}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Objective Title</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="e.g., Increase Market Share" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  A clear, concise title that summarizes the objective
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Add details about this company-level objective..." 
                                    className="min-h-[120px]" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  Provide context and details about why this objective is important for the company
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="timeframeId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Timeframe</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a timeframe for this objective" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {timeframes.map((timeframe) => (
                                      <SelectItem key={timeframe.id} value={timeframe.id}>
                                        {timeframe.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  The period during which this objective should be achieved
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="space-y-2">
                            <Label className="text-base">Tags</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {availableTags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                                  className="cursor-pointer px-3 py-1.5"
                                  onClick={() => handleTagToggle(tag)}
                                >
                                  <Tag className="mr-1.5 h-3 w-3" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Step 2: Alignment & Ownership */}
                    <AnimatePresence mode="wait">
                      {currentStep === 2 && (
                        <motion.div
                          key="step2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-6"
                        >
                          <div className="space-y-4">
                            <Label className="text-base">Ownership</Label>
                            <FormField
                              control={form.control}
                              name="ownerId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Primary Owner</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select a primary owner" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {users.map((user) => (
                                        <SelectItem key={user.id} value={user.id}>
                                          {user.fullName || user.name || user.username}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>
                                    The person ultimately responsible for this objective
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="teamId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Responsible Team</FormLabel>
                                  <Select
                                    onValueChange={(value) => {
                                      handleTeamChange(value);
                                      field.onChange(value);
                                    }}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select a team" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {teams.map((team) => (
                                        <SelectItem key={team.id} value={team.id}>
                                          {team.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>
                                    The team responsible for leading this company objective
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="space-y-4">
                            <Label className="text-base">Contributors</Label>
                            <div className="border rounded-md p-4 space-y-3">
                              <p className="text-sm text-muted-foreground mb-4">
                                Add contributors who will be involved in this company objective
                              </p>
                              <div className="space-y-2">
                                {teamMembers.length > 0 ? (
                                  <div className="grid grid-cols-2 gap-2">
                                    {teamMembers.map((member) => (
                                      <div 
                                        key={member.id}
                                        className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
                                          selectedContributors.includes(member.id)
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/20"
                                        }`}
                                        onClick={() => handleContributorToggle(member.id)}
                                      >
                                        <Avatar className="h-6 w-6">
                                          <AvatarFallback>
                                            {member.name?.charAt(0) || member.username?.charAt(0) || "U"}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm">{member.fullName || member.name || member.username}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-4 text-sm text-muted-foreground">
                                    {selectedTeam 
                                      ? "No team members found for selected team"
                                      : "Select a team to view members"}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <Label className="text-base">Strategic Alignment</Label>
                            <RadioGroup value={alignmentOption} onValueChange={setAlignmentOption}>
                              <div className="flex flex-col space-y-3">
                                <div className={`
                                  flex items-start space-x-3 border rounded-md p-3 cursor-pointer
                                  ${alignmentOption === "strategic-pillar" ? "border-primary" : "border-border"}
                                `}>
                                  <RadioGroupItem value="strategic-pillar" id="strategic-pillar" className="mt-1" />
                                  <div>
                                    <Label htmlFor="strategic-pillar" className="font-medium">Strategic Pillar</Label>
                                    <p className="text-sm text-muted-foreground">
                                      This objective is a top-level company strategy
                                    </p>
                                  </div>
                                </div>
                                <div className={`
                                  flex items-start space-x-3 border rounded-md p-3 cursor-pointer
                                  ${alignmentOption === "parent-objective" ? "border-primary" : "border-border"}
                                `}>
                                  <RadioGroupItem value="parent-objective" id="parent-objective" className="mt-1" />
                                  <div className="flex-1">
                                    <Label htmlFor="parent-objective" className="font-medium">
                                      Align with Parent Objective
                                    </Label>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      This objective supports another company objective
                                    </p>
                                    <Select
                                      disabled={alignmentOption !== "parent-objective"}
                                      onValueChange={(value) => form.setValue('parentId', value)}
                                    >
                                      <SelectTrigger className={alignmentOption !== "parent-objective" ? "opacity-50" : ""}>
                                        <SelectValue placeholder="Select parent objective" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {objectives
                                          .filter((obj: any) => obj.level === "company" && obj.status !== "completed")
                                          .map((obj: any) => (
                                            <SelectItem key={obj.id} value={obj.id}>
                                              {obj.title}
                                            </SelectItem>
                                          ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>
                            </RadioGroup>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Step 3: Key Results */}
                    <AnimatePresence mode="wait">
                      {currentStep === 3 && (
                        <motion.div
                          key="step3"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-6"
                        >
                          <div className="space-y-4">
                            <Label className="text-base">Measure Progress With</Label>
                            <RadioGroup value={progressDriver} onValueChange={setProgressDriver}>
                              <div className="flex flex-col space-y-3">
                                <div className={`
                                  flex items-start space-x-3 border rounded-md p-3 cursor-pointer
                                  ${progressDriver === "key-results" ? "border-primary" : "border-border"}
                                `}>
                                  <RadioGroupItem value="key-results" id="key-results" className="mt-1" />
                                  <div>
                                    <Label htmlFor="key-results" className="font-medium">Key Results</Label>
                                    <p className="text-sm text-muted-foreground">
                                      Track progress through measurable key results with start, current, and target values
                                    </p>
                                  </div>
                                </div>
                                <div className={`
                                  flex items-start space-x-3 border rounded-md p-3 cursor-pointer
                                  ${progressDriver === "manual-updates" ? "border-primary" : "border-border"}
                                `}>
                                  <RadioGroupItem value="manual-updates" id="manual-updates" className="mt-1" />
                                  <div>
                                    <Label htmlFor="manual-updates" className="font-medium">Manual Updates</Label>
                                    <p className="text-sm text-muted-foreground">
                                      Update progress manually with status updates and check-ins
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </RadioGroup>
                          </div>

                          {progressDriver === "key-results" && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <Label className="text-base">Key Results</Label>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={handleAddKeyResult}
                                  className="h-8"
                                >
                                  <Plus className="h-3.5 w-3.5 mr-1" />
                                  Add Key Result
                                </Button>
                              </div>
                              <div className="space-y-6">
                                {keyResults.map((keyResult, index) => (
                                  <Card key={index} className="relative">
                                    <CardHeader className="pb-2">
                                      <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                          <Badge variant="outline" className="rounded-full px-2 py-1 h-6">
                                            {index + 1}
                                          </Badge>
                                          <CardTitle className="text-base">Key Result</CardTitle>
                                        </div>
                                        {keyResults.length > 1 && (
                                          <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => handleRemoveKeyResult(index)}
                                            className="h-8 p-0 w-8"
                                          >
                                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                          </Button>
                                        )}
                                      </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`kr-title-${index}`}>Title</Label>
                                        <Input 
                                          id={`kr-title-${index}`}
                                          value={keyResult.title}
                                          onChange={(e) => handleKeyResultChange(index, 'title', e.target.value)}
                                          placeholder="e.g., Increase revenue by 20%"
                                          className={!keyResult.title || keyResult.title.length < 3 ? "border-destructive" : ""}
                                        />
                                        {(!keyResult.title || keyResult.title.length < 3) && (
                                          <p className="text-xs text-destructive">Title must be at least 3 characters</p>
                                        )}
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`kr-description-${index}`}>Description (Optional)</Label>
                                        <Textarea 
                                          id={`kr-description-${index}`}
                                          value={keyResult.description || ""}
                                          onChange={(e) => handleKeyResultChange(index, 'description', e.target.value)}
                                          placeholder="Add details about this key result..."
                                          className="min-h-[80px]"
                                        />
                                      </div>
                                      <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                          <Label htmlFor={`kr-start-${index}`}>Start Value</Label>
                                          <Input 
                                            id={`kr-start-${index}`}
                                            value={keyResult.start_value}
                                            onChange={(e) => handleKeyResultChange(index, 'start_value', e.target.value)}
                                            type="text"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor={`kr-current-${index}`}>Current Value</Label>
                                          <Input 
                                            id={`kr-current-${index}`}
                                            value={keyResult.current_value}
                                            onChange={(e) => handleKeyResultChange(index, 'current_value', e.target.value)}
                                            type="text"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor={`kr-target-${index}`}>Target Value</Label>
                                          <Input 
                                            id={`kr-target-${index}`}
                                            value={keyResult.target_value}
                                            onChange={(e) => handleKeyResultChange(index, 'target_value', e.target.value)}
                                            type="text"
                                          />
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`kr-format-${index}`}>Value Format</Label>
                                        <Select
                                          value={keyResult.format}
                                          onValueChange={(value: any) => handleKeyResultChange(index, 'format', value)}
                                        >
                                          <SelectTrigger id={`kr-format-${index}`}>
                                            <SelectValue placeholder="Select format" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="number">Number</SelectItem>
                                            <SelectItem value="percentage">Percentage</SelectItem>
                                            <SelectItem value="currency">Currency</SelectItem>
                                            <SelectItem value="boolean">Completion (Yes/No)</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <Label htmlFor={`kr-progress-${index}`}>Progress</Label>
                                          <span className="text-sm">{Math.round(keyResult.progress || 0)}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                          <div 
                                            className="h-full bg-primary rounded-full" 
                                            style={{ width: `${keyResult.progress || 0}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`kr-owner-${index}`}>Assigned To (Optional)</Label>
                                        <Select
                                          value={keyResult.assignedToId}
                                          onValueChange={(value) => handleKeyResultChange(index, 'assignedToId', value)}
                                        >
                                          <SelectTrigger id={`kr-owner-${index}`}>
                                            <SelectValue placeholder="Select owner" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {users.map((user) => (
                                              <SelectItem key={user.id} value={user.id}>
                                                {user.fullName || user.name || user.username}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="pt-4 flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0">
                      <div>
                        {currentStep > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={prevStep}
                            className="w-full sm:w-auto"
                          >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Previous
                          </Button>
                        )}
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancel}
                          className="w-full sm:w-auto"
                        >
                          Cancel
                        </Button>
                        {currentStep < 3 ? (
                          <Button
                            type="button"
                            onClick={nextStep}
                            className="w-full sm:w-auto"
                          >
                            Next
                            <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                          </Button>
                        ) : (
                          <Button
                            type="submit"
                            className="w-full sm:w-auto bg-primary"
                          >
                            Create Company Objective
                          </Button>
                        )}
                      </div>
                    </div>
                  </form>
                </Form>
              </div>

              {/* Sidebar */}
              <div className="w-full md:w-80 md:shrink-0 bg-muted/10 p-6">
                <div className="sticky top-6 space-y-6">
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-medium">Company Objective</h3>
                    <p className="text-xs text-muted-foreground">
                      Creating a company-level objective that will be visible to everyone in the organization.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-sm font-medium">Current Step</h3>
                    <div className="space-y-3">
                      <div 
                        className={`flex items-center space-x-2 cursor-pointer`}
                        onClick={() => currentStep > 1 ? setCurrentStep(1) : null}
                      >
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs
                          ${currentStep === 1 
                            ? "bg-primary text-white" 
                            : currentStep > 1 
                              ? "bg-primary/20 text-primary" 
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {currentStep > 1 ? <Check className="h-3 w-3" /> : "1"}
                        </div>
                        <span className={`text-sm ${currentStep === 1 ? "font-medium" : ""}`}>
                          Objective Details
                        </span>
                      </div>

                      <div 
                        className={`flex items-center space-x-2 cursor-pointer`}
                        onClick={() => currentStep > 2 ? setCurrentStep(2) : null}
                      >
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs
                          ${currentStep === 2 
                            ? "bg-primary text-white" 
                            : currentStep > 2 
                              ? "bg-primary/20 text-primary" 
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {currentStep > 2 ? <Check className="h-3 w-3" /> : "2"}
                        </div>
                        <span className={`text-sm ${currentStep === 2 ? "font-medium" : ""}`}>
                          Alignment & Ownership
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs
                          ${currentStep === 3 
                            ? "bg-primary text-white" 
                            : "bg-muted text-muted-foreground"
                          }`}
                        >
                          3
                        </div>
                        <span className={`text-sm ${currentStep === 3 ? "font-medium" : ""}`}>
                          Key Results
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-sm font-medium">Tips</h3>
                    <div className="text-xs text-muted-foreground space-y-3">
                      {currentStep === 1 && (
                        <>
                          <p>• Use clear, specific language for your objective title</p>
                          <p>• Include the "what" and the "why" in your description</p>
                          <p>• Tags help with filtering and categorization</p>
                        </>
                      )}

                      {currentStep === 2 && (
                        <>
                          <p>• Assign a primary owner who is accountable for this objective</p>
                          <p>• Select the team primarily responsible for implementation</p>
                          <p>• Add contributors who will help accomplish this objective</p>
                          <p>• Align with strategic pillars or other company objectives</p>
                        </>
                      )}

                      {currentStep === 3 && (
                        <>
                          <p>• Key Results should be specific and measurable</p>
                          <p>• Include 2-5 key results for each objective</p>
                          <p>• Set realistic but ambitious target values</p>
                          <p>• Assign owners to each key result if possible</p>
                        </>
                      )}
                    </div>
                  </div>

                  <Card className="bg-yellow-50 border-yellow-100">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-2">
                        <InfoIcon className="h-4 w-4 text-yellow-600 mt-0.5" />
                        <div className="space-y-1">
                          <h4 className="text-xs font-medium text-yellow-800">Important Note</h4>
                          <p className="text-xs text-yellow-700">
                            Company objectives are visible to everyone in your organization and help
                            align teams around common goals.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}