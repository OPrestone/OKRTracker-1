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
  Circle,
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
import { invalidateObjectiveQueries } from "@/lib/query-invalidation";
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

interface StrategicDirection {
  id: string;
  title: string;
  description: string;
  tenantId: string;
  createdById: string;
  createdAt: string;
}

// Form schema for creating objectives
const objectiveFormSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  description: z.string().optional(),
  teamId: z.string().optional(),
  ownerId: z.string().optional(),
  timeframeId: z.string(), // Making timeframeId required
  status: z.enum(["draft", "active", "completed", "archived"]).default("draft"),
  parentId: z.string().optional(),
  strategyId: z.string().optional(),
  // Tags and contributors will be handled separately
});

type ObjectiveFormValues = z.infer<typeof objectiveFormSchema>;

export default function CreateMyOKR() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [alignmentOption, setAlignmentOption] = useState<string>("strategic-pillar");
  const [progressDriver, setProgressDriver] = useState<string>("manual");
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedContributors, setSelectedContributors] = useState<string[]>([]);
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
    { value: 'other', label: 'Other', icon: <Circle className="h-4 w-4" /> },
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
      timeframeId: '', // Using empty string as initial value until user selects a timeframe
      parentId: undefined,
      strategyId: undefined,
    }
  });

  // Create objective mutation
  const createObjectiveMutation = useMutation({
    mutationFn: async (payload: any) => {
      console.log("Creating personal objective:", payload);

      const response = await apiRequest("POST", "/api/objectives", payload);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || "Failed to create objective");
      }
      return await response.json();
    },
    onSuccess: (data) => {
      // Use centralized invalidation to refresh all related queries across the app
      invalidateObjectiveQueries(queryClient);
      toast({
        title: "Personal objective created successfully!",
        description: "Your objective has been added to your personal OKRs.",
      });
      setLocation("/my-okrs");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create objective",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create objective and add another mutation
  const createObjectiveAndAddAnotherMutation = useMutation({
    mutationFn: async (payload: any) => {
      console.log("Creating personal objective and adding another:", payload);

      const response = await apiRequest("POST", "/api/objectives", payload);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || "Failed to create objective");
      }
      return await response.json();
    },
    onSuccess: (data) => {
      // Use centralized invalidation to refresh all related queries across the app
      invalidateObjectiveQueries(queryClient);
      toast({
        title: "Personal objective created successfully!",
        description: "Ready to create another objective.",
      });
      // Reset form and go back to step 1
      form.reset();
      setCurrentStep(1);
      setActiveTab("details");
      setSelectedTags([]);
      setSelectedContributors([]);
      setSelectedTeam("");
      setObjectiveType("financial");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create objective",
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

  // Fetch strategic directions from API for alignment
  const { data: strategicDirections = [], isError: strategicDirectionsError, error: strategicDirectionsErrorData } = useQuery<StrategicDirection[]>({
    queryKey: ['/api/strategic-directions'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });
  
  // Check for any data loading errors
  const hasAuthError = teamsError || usersError || timeframesError || objectivesError || strategicDirectionsError;
  const isAuthError = 
    (teamsErrorData instanceof Error && teamsErrorData.message.includes("Unauthorized")) ||
    (usersErrorData instanceof Error && usersErrorData.message.includes("Unauthorized")) ||
    (timeframesErrorData instanceof Error && timeframesErrorData.message.includes("Unauthorized")) ||
    (objectivesErrorData instanceof Error && objectivesErrorData.message.includes("Unauthorized")) ||
    (strategicDirectionsErrorData instanceof Error && strategicDirectionsErrorData.message.includes("Unauthorized"));
  
  // Filter team members based on the selected team
  const teamMembers = users?.filter((user: User) => 
    selectedTeam && user.teamId === selectedTeam
  ) || [];

  const handleCancel = () => {
    setLocation("/my-okrs");
  };

  const onSubmit = (values: ObjectiveFormValues) => {
    // Check if timeframeId is missing or empty
    if (!values.timeframeId) {
      if (timeframes && timeframes.length > 0) {
        values.timeframeId = timeframes[0].id;
        console.log("Using default timeframe ID:", values.timeframeId);
      } else {
        toast({
          title: "Timeframe Required",
          description: "Please create a timeframe before creating objectives.",
          variant: "destructive",
        });
        return;
      }
    }

    // Step 1: Create the objective (without key results)
    const objectivePayload = {
      ...values,
      level: "personal", // Different from company objectives
      type: objectiveType,
      tags: selectedTags,
      contributors: selectedContributors
    };
    
    console.log("Step 1: Creating personal objective:", objectivePayload);
    createObjectiveMutation.mutate(objectivePayload);
  };

  const handleSaveAndAddAnother = async () => {
    // Validate the form first
    const isValid = await form.trigger();
    if (!isValid) return;

    const values = form.getValues();
    
    // Check if timeframeId is missing or empty
    if (!values.timeframeId) {
      if (timeframes && timeframes.length > 0) {
        values.timeframeId = timeframes[0].id;
        console.log("Using default timeframe ID:", values.timeframeId);
      } else {
        toast({
          title: "Timeframe Required",
          description: "Please create a timeframe before creating objectives.",
          variant: "destructive",
        });
        return;
      }
    }

    // Create objective payload
    const objectivePayload = {
      ...values,
      level: "personal", // Different from company objectives
      type: objectiveType,
      tags: selectedTags,
      contributors: selectedContributors
    };
    
    console.log("Save and add another: Creating personal objective:", objectivePayload);
    createObjectiveAndAddAnotherMutation.mutate(objectivePayload);
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

  const nextStep = async () => {
    // Validate current step
    if (currentStep === 1) {
      const result = await form.trigger(["title", "description"]);
      if (!result) return;
    }
    
    setCurrentStep(Math.min(currentStep + 1, 2));
    if (currentStep === 1) setActiveTab("alignment");
  };

  const prevStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 1));
    if (currentStep === 2) setActiveTab("details");
  };

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return "Personal Objective Details";
      case 2: return "Alignment & Ownership";
      default: return "Create Personal Objective";
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
                  You need to be logged in to create personal objectives.
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
                  <CardTitle>Creating Personal Objective...</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <h2 className="text-xl font-semibold mb-2">Creating Your Objective</h2>
                <p className="text-muted-foreground">
                  Please wait while we create your personal objective...
                </p>
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="overflow-hidden border-none shadow-lg">
            <CardHeader className="border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-primary/10 p-1.5">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-semibold">{getStepTitle(currentStep)}</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Create a personal objective to track your individual goals and progress
                    </CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={handleCancel}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Progress steps */}
              <div className="flex items-center gap-4 mt-6">
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {currentStep > 1 ? <Check className="h-4 w-4" /> : '1'}
                  </div>
                  <span className={`text-sm font-medium ${currentStep >= 1 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    Objective Details
                  </span>
                </div>
                
                <div className={`h-px w-12 ${currentStep > 1 ? 'bg-primary' : 'bg-muted'}`} />
                
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    2
                  </div>
                  <span className={`text-sm font-medium ${currentStep >= 2 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    Alignment & Ownership
                  </span>
                </div>
              </div>
            </CardHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="p-0">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="hidden" />
                    
                    <TabsContent value="details" className="mt-0">
                      <div className="p-8 space-y-8">
                        {/* Basic Information */}
                        <div className="space-y-6">
                          <div className="flex items-center gap-2 mb-4">
                            <Target className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-semibold">Personal Objective Information</h3>
                          </div>
                          
                          <div className="grid gap-6">
                            <FormField
                              control={form.control}
                              name="title"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-base font-medium">
                                    Objective Title *
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="e.g., Improve my technical skills and deliver high-quality projects"
                                      className="text-base"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Write a clear, measurable objective that describes what you want to achieve
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
                                  <FormLabel className="text-base font-medium">Description</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Provide additional context about your objective, why it matters, and how it contributes to your personal growth..."
                                      className="min-h-[120px] text-base"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Add context and explain the importance of this objective
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* Objective Type */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Tag className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-semibold">Objective Category</h3>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3">
                            {objectiveTypes.map((type) => (
                              <Button
                                key={type.value}
                                type="button"
                                variant={objectiveType === type.value ? "default" : "outline"}
                                className="flex items-center gap-2 p-4 h-auto"
                                onClick={() => setObjectiveType(type.value)}
                              >
                                {type.icon}
                                <span className="text-sm">{type.label}</span>
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Timeframe Selection */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-semibold">Timeframe</h3>
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="timeframeId"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a timeframe for this objective" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectGroup>
                                        {timeframes?.map((timeframe) => (
                                          <SelectItem key={timeframe.id} value={timeframe.id}>
                                            <div className="flex flex-col">
                                              <span className="font-medium">{timeframe.name}</span>
                                              <span className="text-sm text-muted-foreground">
                                                {new Date(timeframe.startDate).toLocaleDateString()} - {new Date(timeframe.endDate).toLocaleDateString()}
                                              </span>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectGroup>
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Tags */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Tag className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-semibold">Tags</h3>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {availableTags.map((tag) => (
                              <Button
                                key={tag}
                                type="button"
                                variant={selectedTags.includes(tag) ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleTagToggle(tag)}
                                className="text-sm"
                              >
                                {tag}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="alignment" className="mt-0">
                      <div className="p-8 space-y-8">
                        {/* Alignment Options */}
                        <div className="space-y-6">
                          <div className="flex items-center gap-2 mb-4">
                            <NetworkIcon className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-semibold">Alignment & Dependencies</h3>
                          </div>

                          <div className="space-y-4">
                            <Label className="text-base font-medium">Align this objective with:</Label>
                            <RadioGroup value={alignmentOption} onValueChange={setAlignmentOption}>
                              <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="strategic-pillar" id="strategic-pillar" />
                                  <Label htmlFor="strategic-pillar" className="flex items-center gap-2">
                                    <Building className="h-4 w-4" />
                                    Strategic Direction
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="company-objective" id="company-objective" />
                                  <Label htmlFor="company-objective" className="flex items-center gap-2">
                                    <Target className="h-4 w-4" />
                                    Company Objective
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="none" id="none" />
                                  <Label htmlFor="none" className="flex items-center gap-2">
                                    <Circle className="h-4 w-4" />
                                    No alignment (standalone objective)
                                  </Label>
                                </div>
                              </div>
                            </RadioGroup>
                          </div>

                          {/* Strategic Direction Selection */}
                          {alignmentOption === "strategic-pillar" && (
                            <div className="space-y-4">
                              <FormField
                                control={form.control}
                                name="strategyId"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Strategic Direction</FormLabel>
                                    <FormControl>
                                      <Select onValueChange={field.onChange} value={field.value || ""}>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select a strategic direction to align with" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectGroup>
                                            {strategicDirections?.map((direction) => (
                                              <SelectItem key={direction.id} value={direction.id}>
                                                <div className="flex flex-col">
                                                  <span className="font-medium">{direction.title}</span>
                                                  <span className="text-sm text-muted-foreground">
                                                    {direction.description}
                                                  </span>
                                                </div>
                                              </SelectItem>
                                            ))}
                                          </SelectGroup>
                                        </SelectContent>
                                      </Select>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}

                          {/* Company Objective Selection */}
                          {alignmentOption === "company-objective" && (
                            <div className="space-y-4">
                              <FormField
                                control={form.control}
                                name="parentId"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Company Objective</FormLabel>
                                    <FormControl>
                                      <Select onValueChange={field.onChange} value={field.value || ""}>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select a company objective to align with" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectGroup>
                                            {objectives?.filter((obj: any) => obj.level === "company").map((objective: any) => (
                                              <SelectItem key={objective.id} value={objective.id}>
                                                <div className="flex flex-col">
                                                  <span className="font-medium">{objective.title}</span>
                                                  <span className="text-sm text-muted-foreground">
                                                    {objective.description}
                                                  </span>
                                                </div>
                                              </SelectItem>
                                            ))}
                                          </SelectGroup>
                                        </SelectContent>
                                      </Select>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}
                        </div>

                        {/* Team Association */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-semibold">Team Association (Optional)</h3>
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="teamId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Associated Team</FormLabel>
                                <FormControl>
                                  <Select onValueChange={(value) => handleTeamChange(value)} value={field.value || ""}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a team to associate this objective with (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectGroup>
                                        <SelectItem value="">
                                          <span className="text-muted-foreground">No team association</span>
                                        </SelectItem>
                                        {teams?.map((team) => (
                                          <SelectItem key={team.id} value={team.id}>
                                            <div className="flex items-center gap-2">
                                              <div 
                                                className="h-3 w-3 rounded-full" 
                                                style={{ backgroundColor: team.color || '#6B7280' }}
                                              />
                                              <span>{team.name}</span>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectGroup>
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormDescription>
                                  Optionally associate this objective with a team for better organization
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Contributors */}
                        {selectedTeam && teamMembers.length > 0 && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <CircleUser className="h-5 w-5 text-primary" />
                              <h3 className="text-lg font-semibold">Contributors</h3>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              {teamMembers.map((user) => (
                                <div
                                  key={user.id}
                                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                    selectedContributors.includes(user.id)
                                      ? 'border-primary bg-primary/5'
                                      : 'border-border hover:border-primary/50'
                                  }`}
                                  onClick={() => handleContributorToggle(user.id)}
                                >
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.avatarUrl} />
                                    <AvatarFallback className="text-xs">
                                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{user.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                  </div>
                                  {selectedContributors.includes(user.id) && (
                                    <Check className="h-4 w-4 text-primary" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>

                <CardFooter className="border-t bg-muted/20 p-6">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      {currentStep > 1 && (
                        <Button type="button" variant="outline" onClick={prevStep}>
                          <MoveLeft className="h-4 w-4 mr-2" />
                          Previous
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Button type="button" variant="outline" onClick={handleCancel}>
                        Cancel
                      </Button>
                      
                      {currentStep === 2 && (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleSaveAndAddAnother}
                            disabled={createObjectiveAndAddAnotherMutation.isPending}
                          >
                            {createObjectiveAndAddAnotherMutation.isPending ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Plus className="h-4 w-4 mr-2" />
                            )}
                            Save & Add Another
                          </Button>
                          
                          <Button 
                            type="submit"
                            disabled={createObjectiveMutation.isPending}
                          >
                            {createObjectiveMutation.isPending ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4 mr-2" />
                            )}
                            Create Personal Objective
                          </Button>
                        </>
                      )}
                      
                      {currentStep === 1 && (
                        <Button type="button" onClick={nextStep}>
                          Next
                          <MoveRight className="h-4 w-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}