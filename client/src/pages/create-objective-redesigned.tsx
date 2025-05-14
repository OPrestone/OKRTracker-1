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

export default function CreateObjective() {
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
          throw new Error(errorData.error || "Unauthorized. Only organization owners and admins can create objectives.");
        }
        throw new Error(errorData.message || errorData.error || "Failed to create objective");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
      toast({
        title: "Objective created",
        description: "Your objective has been successfully created",
      });
      // Navigate to the objectives list or another relevant page
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
    setLocation("/my-okrs");
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
      case 1: return "Objective Details";
      case 2: return "Alignment & Ownership";
      case 3: return "Key Results";
      default: return "Create Objective";
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
                  You need to be logged in to create objectives. Please log in or register to continue.
                </p>
                <Card className="bg-red-50 border-red-100 mb-6 w-full max-w-md">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-medium text-red-800 mb-2">Details:</h3>
                    <ul className="text-xs text-red-700 list-disc list-inside space-y-1">
                      {teamsErrorData && <li>Teams data: {teamsErrorData.message}</li>}
                      {usersErrorData && <li>Users data: {usersErrorData.message}</li>}
                      {timeframesErrorData && <li>Timeframes data: {timeframesErrorData.message}</li>}
                      {objectivesErrorData && <li>Objectives data: {objectivesErrorData.message}</li>}
                    </ul>
                  </CardContent>
                </Card>
                <Button 
                  onClick={() => setLocation("/auth")} 
                  className="flex items-center gap-2"
                >
                  Go to Login
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
                  <CardTitle>Creating Objective...</CardTitle>
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
                <h2 className="text-xl font-medium mb-2">Creating your objective</h2>
                <p className="text-muted-foreground">Please wait while we save your OKR...</p>
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
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{getStepTitle(currentStep)}</CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCancel}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          
          {/* Progress Steps */}
          <div className="bg-muted/10 px-8 pt-6 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div 
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${currentStep >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}
                >
                  1
                </div>
                <div className={`w-12 h-1 ${currentStep >= 2 ? 'bg-primary' : 'bg-gray-200'}`}></div>
                <div 
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${currentStep >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}
                >
                  2
                </div>
                <div className={`w-12 h-1 ${currentStep >= 3 ? 'bg-primary' : 'bg-gray-200'}`}></div>
                <div 
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${currentStep >= 3 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}
                >
                  3
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Step {currentStep} of 3
              </div>
            </div>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {currentStep === 1 && (
                    <CardContent className="p-6 sm:p-8">
                      <div className="space-y-6">
                        {/* Title */}
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-medium">Objective Title</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Improve customer onboarding experience" 
                                  className="text-lg"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Be specific and outcome-focused in your objective title.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Description */}
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-medium">Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Describe what success looks like for this objective..." 
                                  className="min-h-[120px] resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Provide context on why this objective matters and what it aims to achieve.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Tags */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-base font-medium">Tags</Label>
                            <span className="text-xs text-muted-foreground">Select all that apply</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {availableTags.map(tag => (
                              <Badge 
                                key={tag}
                                variant={selectedTags.includes(tag) ? "default" : "outline"}
                                className={`cursor-pointer py-2 px-3 rounded-full ${
                                  selectedTags.includes(tag) 
                                    ? 'bg-primary hover:bg-primary/90' 
                                    : 'bg-transparent hover:bg-muted'
                                }`}
                                onClick={() => handleTagToggle(tag)}
                              >
                                {selectedTags.includes(tag) && (
                                  <Check className="h-3 w-3 mr-1" />
                                )}
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}

                  {currentStep === 2 && (
                    <CardContent className="p-6 sm:p-8">
                      <div className="space-y-6">
                        {/* Team */}
                        <FormField
                          control={form.control}
                          name="teamId"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel className="text-base font-medium">Team</FormLabel>
                              <Select 
                                onValueChange={(value) => handleTeamChange(value)} 
                                value={field.value || undefined}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Team..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <div className="max-h-[240px] overflow-y-auto">
                                    {teams && teams.length > 0 ? (
                                      teams.map((team: Team) => (
                                        <SelectItem key={team.id} value={team.id}>
                                          <div className="flex items-center">
                                            <div className={`h-8 w-8 rounded-full bg-${team.color || 'blue'}-100 flex items-center justify-center text-${team.color || 'blue'}-800 font-medium text-sm mr-2`}>
                                              {team.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            {team.name}
                                          </div>
                                        </SelectItem>
                                      ))
                                    ) : (
                                      <SelectItem value="no-teams" disabled>
                                        <div className="flex items-center text-muted-foreground">
                                          <Users className="h-5 w-5 mr-2" />
                                          <span>No teams available</span>
                                        </div>
                                      </SelectItem>
                                    )}
                                  </div>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                The team responsible for driving this objective.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Owner */}
                        <FormField
                          control={form.control}
                          name="ownerId"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel className="text-base font-medium">Owner</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                value={field.value || undefined}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Owner..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <div className="max-h-[240px] overflow-y-auto">
                                    {users && users.length > 0 ? (
                                      users.map((user: User) => {
                                        // Generate initials for the avatar
                                        const name = user.fullName || user.username || '';
                                        const initials = name
                                          .split(' ')
                                          .map(part => part.charAt(0))
                                          .join('')
                                          .toUpperCase()
                                          .substring(0, 2);
                                          
                                        return (
                                          <SelectItem key={user.id} value={user.id} className="py-2">
                                            <div className="flex items-center">
                                              <Avatar className="h-8 w-8 mr-3">
                                                {user.avatarUrl ? (
                                                  <AvatarImage src={user.avatarUrl} alt={user.fullName || user.username} />
                                                ) : (
                                                  <AvatarFallback className="bg-primary/10 text-primary">
                                                    {initials}
                                                  </AvatarFallback>
                                                )}
                                              </Avatar>
                                              <div>
                                                <div className="font-medium">{user.fullName || user.username}</div>
                                                {user.email && (
                                                  <div className="text-xs text-muted-foreground">{user.email}</div>
                                                )}
                                              </div>
                                            </div>
                                          </SelectItem>
                                        );
                                      })
                                    ) : (
                                      <SelectItem value="no-users" disabled>
                                        <div className="flex items-center text-muted-foreground">
                                          <CircleUser className="h-5 w-5 mr-2" />
                                          <span>No users available</span>
                                        </div>
                                      </SelectItem>
                                    )}
                                  </div>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Who is primarily responsible for this objective's success.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Timeframe */}
                        <FormField
                          control={form.control}
                          name="timeframeId"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel className="text-base font-medium">Timeframe</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                value={field.value || undefined}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Timeframe..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {timeframes && timeframes.length > 0 ? (
                                    timeframes.map((timeframe: Timeframe) => {
                                      // Format dates for display
                                      const startDate = new Date(timeframe.startDate).toLocaleDateString();
                                      const endDate = new Date(timeframe.endDate).toLocaleDateString();
                                      
                                      return (
                                        <SelectItem key={timeframe.id} value={timeframe.id} className="py-2">
                                          <div>
                                            <div className="flex items-center font-medium">
                                              <Calendar className="h-4 w-4 mr-2 text-primary" />
                                              {timeframe.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground ml-6 mt-1">
                                              {startDate} - {endDate}
                                            </div>
                                          </div>
                                        </SelectItem>
                                      );
                                    })
                                  ) : (
                                    <SelectItem value="no-timeframes" disabled>
                                      <div className="flex items-center text-muted-foreground">
                                        <Calendar className="h-5 w-5 mr-2" />
                                        <span>No timeframes available</span>
                                      </div>
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                The period during which this objective should be achieved.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Alignment */}
                        <div className="space-y-3">
                          <Label className="text-base font-medium">Alignment</Label>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div 
                              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                alignmentOption === 'strategic-pillar' 
                                  ? 'border-primary bg-primary/5 shadow-sm' 
                                  : 'hover:bg-muted/50'
                              }`}
                              onClick={() => setAlignmentOption('strategic-pillar')}
                            >
                              <div className="flex items-center mb-2">
                                <div className="rounded-full bg-green-100 p-1.5">
                                  <Building className="h-4 w-4 text-green-600" />
                                </div>
                                <div className="ml-3 font-medium">Strategic Pillar</div>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Align with your organization's strategic direction
                              </p>
                            </div>
                            
                            <div 
                              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                alignmentOption === 'team-objective' 
                                  ? 'border-primary bg-primary/5 shadow-sm' 
                                  : 'hover:bg-muted/50'
                              }`}
                              onClick={() => setAlignmentOption('team-objective')}
                            >
                              <div className="flex items-center mb-2">
                                <div className="rounded-full bg-blue-100 p-1.5">
                                  <Users className="h-4 w-4 text-blue-600" />
                                </div>
                                <div className="ml-3 font-medium">Team Objective</div>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Align with another team's objectives
                              </p>
                            </div>
                            
                            <div 
                              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                alignmentOption === 'company-objective' 
                                  ? 'border-primary bg-primary/5 shadow-sm' 
                                  : 'hover:bg-muted/50'
                              }`}
                              onClick={() => setAlignmentOption('company-objective')}
                            >
                              <div className="flex items-center mb-2">
                                <div className="rounded-full bg-red-100 p-1.5">
                                  <Target className="h-4 w-4 text-red-600" />
                                </div>
                                <div className="ml-3 font-medium">Company Objective</div>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Align with a top-level company objective
                              </p>
                            </div>
                          </div>
                          
                          {alignmentOption === 'strategic-pillar' && (
                            <Select defaultValue="growth">
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select Strategic Pillar..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="growth">
                                  <div className="flex items-center">
                                    <BarChart className="h-4 w-4 mr-2 text-green-600" />
                                    Growth
                                  </div>
                                </SelectItem>
                                <SelectItem value="customer-satisfaction">
                                  <div className="flex items-center">
                                    <Users className="h-4 w-4 mr-2 text-blue-600" />
                                    Customer Satisfaction
                                  </div>
                                </SelectItem>
                                <SelectItem value="innovation">
                                  <div className="flex items-center">
                                    <Sparkles className="h-4 w-4 mr-2 text-purple-600" />
                                    Innovation
                                  </div>
                                </SelectItem>
                                <SelectItem value="operational-excellence">
                                  <div className="flex items-center">
                                    <Gauge className="h-4 w-4 mr-2 text-orange-600" />
                                    Operational Excellence
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}

                          {alignmentOption === 'company-objective' && (
                            <FormField
                              control={form.control}
                              name="parentId"
                              render={({ field }) => (
                                <FormItem>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select Parent Objective..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <div className="max-h-[240px] overflow-y-auto">
                                        {objectives && objectives.length > 0 ? (
                                          objectives.map((objective: any) => (
                                            <SelectItem key={objective.id} value={objective.id}>
                                              <div className="flex items-center">
                                                <Target className="h-4 w-4 mr-2 text-primary" />
                                                <span className="truncate max-w-[250px]">{objective.title}</span>
                                              </div>
                                            </SelectItem>
                                          ))
                                        ) : (
                                          <SelectItem value="no-objectives" disabled>
                                            <div className="flex items-center text-muted-foreground">
                                              <Target className="h-5 w-5 mr-2" />
                                              <span>No parent objectives available</span>
                                            </div>
                                          </SelectItem>
                                        )}
                                      </div>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}

                  {currentStep === 3 && (
                    <CardContent className="p-6 sm:p-8">
                      <div className="space-y-6">
                        {/* Progress Tracking Method */}
                        <div className="space-y-3">
                          <Label className="text-base font-medium">Progress Tracking Method</Label>
                          <RadioGroup 
                            defaultValue="key-results" 
                            className="flex flex-col space-y-3"
                            onValueChange={setProgressDriver}
                            value={progressDriver}
                          >
                            <div className={`flex items-start space-x-3 rounded-lg border p-4 ${progressDriver === 'key-results' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                              <RadioGroupItem value="key-results" id="key-results" className="mt-1" />
                              <div className="flex-1">
                                <Label htmlFor="key-results" className="text-base font-medium">Key Results</Label>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Track progress through measurable key results. Best for objectives with clear, measurable outcomes.
                                </p>
                              </div>
                            </div>
                            <div className={`flex items-start space-x-3 rounded-lg border p-4 ${progressDriver === 'initiative-completion' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                              <RadioGroupItem value="initiative-completion" id="initiative-completion" className="mt-1" />
                              <div className="flex-1">
                                <Label htmlFor="initiative-completion" className="text-base font-medium">Initiative Completion</Label>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Track progress by completing initiatives. Best for project-based objectives.
                                </p>
                              </div>
                            </div>
                            <div className={`flex items-start space-x-3 rounded-lg border p-4 ${progressDriver === 'manual' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                              <RadioGroupItem value="manual" id="manual" className="mt-1" />
                              <div className="flex-1">
                                <Label htmlFor="manual" className="text-base font-medium">Manual Updates</Label>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Update progress manually. Best for qualitative objectives or those with complex measurements.
                                </p>
                              </div>
                            </div>
                          </RadioGroup>
                        </div>

                        {/* Key Results Section */}
                        {progressDriver === 'key-results' && (
                          <div className="space-y-6">
                            <div className="flex items-center justify-between">
                              <h3 className="text-base font-medium">Key Results</h3>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">
                                      Key results should be specific, measurable outcomes that define success for your objective.
                                      Aim for 2-5 key results per objective.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            
                            <div className="space-y-4">
                              {keyResults.map((kr, index) => (
                                <Card key={index} className="border-border overflow-hidden">
                                  <CardHeader className="p-4 pb-0 flex justify-between items-start">
                                    <div className="flex items-center">
                                      <div className="rounded-full bg-primary/10 p-1.5 mr-3">
                                        <Trophy className="h-4 w-4 text-primary" />
                                      </div>
                                      <div className="space-y-1 flex-1">
                                        <Input
                                          className="font-medium text-base border-none p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                                          placeholder="Key Result Title"
                                          value={kr.title}
                                          onChange={(e) => handleKeyResultChange(index, 'title', e.target.value)}
                                        />
                                        <div className="flex items-center text-xs text-muted-foreground">
                                          <span>Key Result #{index + 1}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRemoveKeyResult(index)}
                                      disabled={keyResults.length <= 1}
                                      className="text-muted-foreground hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </CardHeader>
                                  <CardContent className="p-4 pt-3">
                                    <div className="space-y-4">
                                      <Textarea
                                        placeholder="Describe this key result..."
                                        className="resize-none min-h-[60px]"
                                        value={kr.description || ''}
                                        onChange={(e) => handleKeyResultChange(index, 'description', e.target.value)}
                                      />
                                      
                                      <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                          <Label className="text-xs">Format</Label>
                                          <Select
                                            value={kr.format || "number"}
                                            onValueChange={(value) => handleKeyResultChange(index, 'format', value)}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Number" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="number">Number</SelectItem>
                                              <SelectItem value="percentage">Percentage</SelectItem>
                                              <SelectItem value="currency">Currency</SelectItem>
                                              <SelectItem value="boolean">Yes/No</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="space-y-2">
                                          <Label className="text-xs">Start Value</Label>
                                          <Input
                                            type="text"
                                            value={kr.start_value}
                                            onChange={(e) => handleKeyResultChange(index, 'start_value', e.target.value)}
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label className="text-xs">Target Value</Label>
                                          <Input
                                            type="text"
                                            value={kr.target_value}
                                            onChange={(e) => handleKeyResultChange(index, 'target_value', e.target.value)}
                                          />
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                          <Label className="text-xs">Assigned To</Label>
                                        </div>
                                        <Select
                                          value={kr.assignedToId}
                                          onValueChange={(value) => handleKeyResultChange(index, 'assignedToId', value)}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select owner" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {users && users.length > 0 ? (
                                              users.map((user: User) => {
                                                const name = user.fullName || user.username || '';
                                                const initials = name
                                                  .split(' ')
                                                  .map(part => part.charAt(0))
                                                  .join('')
                                                  .toUpperCase()
                                                  .substring(0, 2);
                                                  
                                                return (
                                                  <SelectItem key={user.id} value={user.id}>
                                                    <div className="flex items-center">
                                                      <Avatar className="h-6 w-6 mr-2">
                                                        {user.avatarUrl ? (
                                                          <AvatarImage src={user.avatarUrl} alt={name} />
                                                        ) : (
                                                          <AvatarFallback className="text-xs">
                                                            {initials}
                                                          </AvatarFallback>
                                                        )}
                                                      </Avatar>
                                                      {name || `User ${user.id}`}
                                                    </div>
                                                  </SelectItem>
                                                );
                                              })
                                            ) : (
                                              <SelectItem value="no-users" disabled>
                                                No users available
                                              </SelectItem>
                                            )}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}

                              <Button
                                type="button"
                                variant="outline"
                                className="w-full py-6 border-dashed flex items-center gap-2"
                                onClick={handleAddKeyResult}
                              >
                                <Plus className="h-4 w-4" />
                                Add Key Result
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                </motion.div>
              </AnimatePresence>

              <CardFooter className="flex items-center justify-between p-6 bg-muted/10 border-t">
                {currentStep > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    className="gap-2"
                  >
                    <MoveLeft className="h-4 w-4" />
                    Previous
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                )}

                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="gap-2"
                  >
                    Next
                    <MoveRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="gap-2"
                    disabled={createObjectiveMutation.isPending}
                  >
                    {createObjectiveMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        Create Objective
                        <Sparkles className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </DashboardLayout>
  );
}