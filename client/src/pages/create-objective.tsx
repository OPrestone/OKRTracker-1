import { useState } from "react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
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
  Plus,
  Target, 
  Users,
  X,
  Check,
  Tag
} from "lucide-react";
import { useLocation } from "wouter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

interface User {
  id: string;
  name: string;
  fullName: string;
  username: string;
  teamId: string | null;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  ownerId: string | null;
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

type ObjectiveFormValues = z.infer<typeof objectiveFormSchema>;

export default function CreateObjective() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [alignmentOption, setAlignmentOption] = useState<string>("strategic-pillar");
  const [progressDriver, setProgressDriver] = useState<string>("key-results");
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedContributors, setSelectedContributors] = useState<string[]>([]);
  
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

  // Create objective mutation
  const createObjectiveMutation = useMutation({
    mutationFn: async (data: ObjectiveFormValues) => {
      const response = await apiRequest("POST", "/api/objectives", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create objective");
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
  const { data: teams = [], isError: teamsError } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  // Fetch users from API
  const { data: users = [], isError: usersError } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  // Fetch timeframes from API
  const { data: timeframes = [], isError: timeframesError } = useQuery<Timeframe[]>({
    queryKey: ['/api/timeframes'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  // Fetch parent objectives from API for alignment
  const { data: objectives = [], isError: objectivesError } = useQuery({
    queryKey: ['/api/objectives'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });
  
  // Check for any data loading errors  
  const hasErrors = usersError || timeframesError || objectivesError || teamsError;

  // Filter team members based on the selected team
  const teamMembers = users?.filter((user: User) => 
    selectedTeam && user.teamId === selectedTeam
  ) || [];

  const handleCancel = () => {
    setLocation("/my-okrs");
  };

  const onSubmit = (values: ObjectiveFormValues) => {
    // Create the objective
    createObjectiveMutation.mutate(values, {
      onSuccess: () => {
        toast({
          title: "Objective created",
          description: "Your objective has been created successfully",
        });
        setLocation("/my-okrs");
      }
    });
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

  // Show error message for authentication issues
  if (hasErrors) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6 max-w-4xl bg-white shadow">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Authentication Required</h1>
            <button 
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Error</h2>
            <p className="text-gray-600 mb-6">
              You need to be logged in to create objectives. Please log in or register to continue.
            </p>
            <Button 
              onClick={() => setLocation("/auth")} 
              className="flex items-center gap-2"
            >
              Go to Login
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show loading state when authentication is being checked
  if (createObjectiveMutation.isPending) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6 max-w-4xl bg-white shadow">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Creating Objective...</h1>
            <button 
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="flex flex-col items-center justify-center p-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-gray-600">Please wait while we create your objective...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 max-w-4xl bg-white shadow">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Create New Objective</h1>
          <button 
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <div className="flex gap-2 mt-1">
                      <Input 
                        placeholder="Improve customer onboarding experience" 
                        className="flex-1"
                        {...field}
                      />
                      <Button type="button" variant="outline" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Alignment */}
            <div>
              <Label>Alignment</Label>
              <div className="grid grid-cols-2 gap-4 mt-1">
                <Select defaultValue="strategic-pillar" onValueChange={setAlignmentOption}>
                  <SelectTrigger className="w-full">
                    <div className="flex items-center">
                      <Building className="h-5 w-5 mr-2 text-green-600" />
                      <span>Support a Strategic Pillar</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strategic-pillar">
                      <div className="flex items-center">
                        <Building className="h-5 w-5 mr-2 text-green-600" />
                        Support a Strategic Pillar
                      </div>
                    </SelectItem>
                    <SelectItem value="team-objective">
                      <div className="flex items-center">
                        <Users className="h-5 w-5 mr-2 text-blue-600" />
                        Support a Team Objective
                      </div>
                    </SelectItem>
                    <SelectItem value="company-objective">
                      <div className="flex items-center">
                        <Target className="h-5 w-5 mr-2 text-red-600" />
                        Support a Company Objective
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {alignmentOption === 'strategic-pillar' && (
                  <Select>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Strategic Pillar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="growth">Growth</SelectItem>
                      <SelectItem value="customer-satisfaction">Customer Satisfaction</SelectItem>
                      <SelectItem value="innovation">Innovation</SelectItem>
                      <SelectItem value="operational-excellence">Operational Excellence</SelectItem>
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
                            {objectives?.map((objective: any) => (
                              <SelectItem key={objective.id} value={objective.id}>
                                {objective.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            {/* Team */}
            <FormField
              control={form.control}
              name="teamId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleTeamChange(value);
                    }} 
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Team..." />
                    </SelectTrigger>
                    <SelectContent>
                      {teams && teams.length > 0 ? (
                        teams.map((team: Team) => (
                          <SelectItem key={team.id} value={team.id}>
                            <div className="flex items-center">
                              <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-medium text-sm mr-2">
                                {team.name ? team.name.substring(0, 2).toUpperCase() : 'TM'}
                              </div>
                              <span>{team.name || 'Team ' + team.id}</span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-teams" disabled>
                          <div className="flex items-center text-gray-500">
                            <Building className="h-5 w-5 mr-2" />
                            <span>No teams available</span>
                          </div>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          
          {/* Contributors */}
          <div>
            <Label className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-blue-600" />
              Contributors
            </Label>
            <div className="mt-1">
              {selectedTeam ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2 mt-2 min-h-[40px] p-2 border border-dashed border-gray-300 rounded-md">
                    {selectedContributors.length > 0 ? (
                      selectedContributors.map(userId => {
                        const user = users.find(u => u.id === userId);
                        if (!user) return null;
                        const initials = user.fullName
                          .split(' ')
                          .map(name => name[0])
                          .join('')
                          .toUpperCase();
                        
                        return (
                          <Badge 
                            key={user.id} 
                            variant="outline" 
                            className="flex items-center gap-1 px-3 py-1 bg-blue-50"
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <span>{user.fullName}</span>
                            <button 
                              className="ml-1 text-gray-500 hover:text-gray-900"
                              onClick={() => handleContributorToggle(user.id)}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })
                    ) : (
                      <p className="text-sm text-gray-500 p-1">Select team members below to add contributors</p>
                    )}
                  </div>
                  
                  <div className="mt-2 border rounded-md p-3 bg-gray-50">
                    <h4 className="text-sm font-medium mb-3 flex items-center">
                      <Users className="h-4 w-4 mr-2 text-gray-600" />
                      {teamMembers.length > 0 ? 'Team Members' : 'No team members found'}
                    </h4>
                    <div className="space-y-1">
                      {teamMembers.map(user => {
                        const initials = user.fullName
                          .split(' ')
                          .map(name => name[0])
                          .join('')
                          .toUpperCase();
                        const isSelected = selectedContributors.includes(user.id);
                        
                        return (
                          <div 
                            key={user.id}
                            className={`flex items-center p-2 rounded-md cursor-pointer ${
                              isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-white'
                            }`}
                            onClick={() => handleContributorToggle(user.id)}
                          >
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarFallback className="bg-blue-100 text-blue-700">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="flex-1">{user.fullName}</span>
                            {isSelected ? (
                              <Check className="h-4 w-4 text-blue-600" />
                            ) : (
                              <div className="h-5 w-5 rounded-full border border-gray-300"></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-md mt-2 flex items-center">
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Please select a team first to see available contributors.
                </p>
              )}
            </div>
          </div>

            {/* Lead and Timeframe */}
            <div className="grid grid-cols-2 gap-4">
              {/* Lead */}
              <FormField
                control={form.control}
                name="ownerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Lead..." />
                      </SelectTrigger>
                      <SelectContent>
                        {users && users.length > 0 ? (
                          users.map((user: User) => {
                            const initials = user.fullName
                              ? user.fullName
                                .split(' ')
                                .map(name => name[0])
                                .join('')
                                .toUpperCase()
                              : 'U';
                              
                            return (
                              <SelectItem key={user.id} value={user.id}>
                                <div className="flex items-center">
                                  <div className="h-7 w-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-800 font-medium text-sm mr-2">
                                    {initials}
                                  </div>
                                  {user.fullName || user.username || 'User ' + user.id}
                                </div>
                              </SelectItem>
                            );
                          })
                        ) : (
                          <SelectItem value="no-users" disabled>
                            <div className="flex items-center text-gray-500">
                              <CircleUser className="h-5 w-5 mr-2" />
                              <span>No users available</span>
                            </div>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Timeframe */}
              <FormField
                control={form.control}
                name="timeframeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timeframe</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || undefined}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Timeframe..." />
                      </SelectTrigger>
                      <SelectContent>
                        {timeframes && timeframes.length > 0 ? (
                          timeframes.map((timeframe: Timeframe) => (
                            <SelectItem key={timeframe.id} value={timeframe.id}>
                              <div className="flex items-center">
                                <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                                <span>{timeframe.name}</span>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-timeframes" disabled>
                            <div className="flex items-center text-gray-500">
                              <Calendar className="h-5 w-5 mr-2" />
                              <span>No timeframes available</span>
                            </div>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

          {/* Advanced Options */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="advanced-options">
              <AccordionTrigger className="text-blue-600 font-medium">
                Advanced Options
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6 pt-2">
                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between">
                          <FormLabel>Description</FormLabel>
                          <span className="text-sm text-gray-500">Optional</span>
                        </div>
                        <FormControl>
                          <Textarea 
                            placeholder="Why is this objective a priority?" 
                            className="h-24"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Update frequency */}
                  <div>
                    <Label>Update frequency</Label>
                    <div className="mt-1">
                      <Select defaultValue="weekly">
                        <SelectTrigger className="w-full">
                          <span>Weekly</span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="biweekly">Bi-weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <Label className="flex items-center">
                      <Tag className="h-4 w-4 mr-2 text-gray-600" />
                      Tags
                    </Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {availableTags.map(tag => (
                        <Badge 
                          key={tag}
                          variant={selectedTags.includes(tag) ? "default" : "outline"}
                          className={`cursor-pointer ${
                            selectedTags.includes(tag) 
                              ? "bg-primary text-white hover:bg-primary-600" 
                              : "hover:bg-gray-100"
                          }`}
                          onClick={() => handleTagToggle(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Bottom buttons */}
          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              variant="outline"
              className="mr-2"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary-600 hover:bg-primary-700 text-white"
              disabled={createObjectiveMutation.isPending}
            >
              {createObjectiveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Objective"
              )}
            </Button>
          </div>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}