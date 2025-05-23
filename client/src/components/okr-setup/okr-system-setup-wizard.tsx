import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLocation } from "wouter";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, ArrowLeft, CheckCircle2, Settings2, Target, Calendar, Users2, Layers, Zap, Loader2, Check, ChevronLeft, ChevronRight } from "lucide-react";
import TimeframeSetup from "./timeframe-setup";

// Team interface
interface Team {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  selected?: boolean;
}

// Team Selection Component
const TeamSelectionSection = ({ 
  tenantId, 
  value = [], 
  onChange 
}: { 
  tenantId: string; 
  value?: string[]; 
  onChange?: (selectedTeams: string[]) => void;
}) => {
  const [selectedTeams, setSelectedTeams] = useState<string[]>(value);
  
  // Fetch teams from the API
  const { data: teams = [] as Team[], isLoading, error } = useQuery<Team[]>({
    queryKey: ['/api/teams', tenantId],
    enabled: !!tenantId,
    meta: { requiresTenant: true },
  });

  // Toggle team selection
  const toggleTeamSelection = (teamId: string) => {
    const updatedTeams = selectedTeams.includes(teamId)
      ? selectedTeams.filter(id => id !== teamId)
      : [...selectedTeams, teamId];
    
    setSelectedTeams(updatedTeams);
    
    if (onChange) {
      onChange(updatedTeams);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
        <span>Loading teams...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-500">Error loading teams. Please try again.</p>
      </div>
    );
  }

  if (!teams || (Array.isArray(teams) && teams.length === 0)) {
    return (
      <div className="bg-yellow-50 p-4 rounded-md">
        <p className="text-yellow-700">No teams found. Please create teams first in the Team Management section.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teams.map((team: Team) => {
          // Get team initials for the avatar
          const initials = team.name
            .split(' ')
            .map(word => word[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
            
          return (
            <div 
              key={team.id}
              className={`border rounded-md p-4 cursor-pointer transition-all ${
                selectedTeams.includes(team.id) 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => toggleTeamSelection(team.id)}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: team.color || '#6366F1' }}
                >
                  {team.icon ? (
                    <span className="text-lg">{team.icon}</span>
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                
                <div className="flex-1">
                  <h4 className="font-medium">{team.name}</h4>
                  <p className="text-sm text-gray-500 truncate">{team.description || `Team in ${team.name} department`}</p>
                </div>
                
                <div className="flex-shrink-0">
                  {selectedTeams.includes(team.id) ? (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Define the form schema for OKR system setup
const formSchema = z.object({
  generalSettings: z.object({
    companyMission: z.string().min(1, "Company mission is required"),
    companyVision: z.string().min(1, "Company vision is required"),
    companyValues: z.string().min(1, "Company values are required"),
    trackingFrequency: z.enum(["weekly", "biweekly", "monthly"]),
    enableNotifications: z.boolean().default(true),
  }),
  timeframes: z.object({
    primaryCadence: z.enum(["quarterly", "trimester", "halfYearly", "annual"]),
    enableQuarterlyCadence: z.boolean().default(true),
    enableAnnualCadence: z.boolean().default(true),
    customCadence: z.string().optional(),
    startMonth: z.enum(["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]).default("january"),
  }),
  objectiveSettings: z.object({
    defaultObjectiveCategory: z.enum(["growth", "product", "customer", "people", "financial", "operations", "other"]).default("growth"),
    maxObjectivesPerTeam: z.enum(["3", "4", "5", "6", "7", "8"]).default("5"),
    maxKeyResultsPerObjective: z.enum(["3", "4", "5", "6"]).default("3"),
    requireObjectiveApproval: z.boolean().default(true),
    enableObjectiveAlignment: z.boolean().default(true),
  }),
  teamConfiguration: z.object({
    orgStructureType: z.enum(["functional", "divisional", "matrix", "flat", "hierarchical"]),
    enableCrossTeamObjectives: z.boolean().default(true),
    defaultVisibility: z.enum(["public", "team", "private"]).default("public"),
    selectedTeams: z.array(z.string()).default([]),
  }),
  integrations: z.object({
    enableSlackIntegration: z.boolean().default(false),
    enableEmailNotifications: z.boolean().default(true),
    enableCalendarSync: z.boolean().default(false),
    enableAnalyticsReporting: z.boolean().default(true),
  }),
});

// Type for the form values
type FormValues = z.infer<typeof formSchema>;

const steps = [
  { id: "general", label: "General", icon: Settings2 },
  { id: "timeframes", label: "Timeframes", icon: Calendar },
  { id: "objectives", label: "Objectives", icon: Target },
  { id: "teams", label: "Teams", icon: Users2 },
  { id: "integrations", label: "Integrations", icon: Layers },
  { id: "review", label: "Review", icon: CheckCircle2 },
];

export default function OKRSystemSetupWizard() {
  const [activePage, setActivePage] = useState("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string>("");
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  // Find the active step index
  const activeIndex = steps.findIndex((step) => step.id === activePage);

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      generalSettings: {
        companyMission: "",
        companyVision: "",
        companyValues: "",
        trackingFrequency: "weekly",
        enableNotifications: true,
      },
      timeframes: {
        primaryCadence: "quarterly",
        enableQuarterlyCadence: true,
        enableAnnualCadence: true,
        customCadence: "",
        startMonth: "january",
      },
      objectiveSettings: {
        defaultObjectiveCategory: "growth",
        maxObjectivesPerTeam: "5",
        maxKeyResultsPerObjective: "3",
        requireObjectiveApproval: true,
        enableObjectiveAlignment: true,
      },
      teamConfiguration: {
        orgStructureType: "functional",
        enableCrossTeamObjectives: true,
        defaultVisibility: "public",
        selectedTeams: [] as string[],
      },
      integrations: {
        enableSlackIntegration: false,
        enableEmailNotifications: true,
        enableCalendarSync: false,
        enableAnalyticsReporting: true,
      },
    },
  });
  
  // Fetch existing OKR system configuration
  useEffect(() => {
    const fetchExistingConfig = async () => {
      try {
        setIsLoading(true);
        
        // Get active tenant ID from session if available
        const userResponse = await fetch('/api/user', {
          credentials: 'include'
        });
        
        if (!userResponse.ok) {
          console.error("Failed to get user information");
          setIsLoading(false);
          return;
        }
        
        const userData = await userResponse.json();
        
        // First try to get default tenant, then first tenant from array if available
        const currentTenantId = userData.defaultTenant || 
                              (userData.tenants && userData.tenants.length > 0 && userData.tenants[0].id);
        
        if (!currentTenantId) {
          console.error("No tenant ID available");
          setIsLoading(false);
          return;
        }
        
        // Set tenant ID for later use in the submit function
        setTenantId(currentTenantId);
        
        // Create a FormValues object to store our form data
        const formValues: FormValues = {
          generalSettings: {
            companyMission: "",
            companyVision: "",
            companyValues: "",
            trackingFrequency: "weekly",
            enableNotifications: true,
          },
          timeframes: {
            primaryCadence: "quarterly",
            enableQuarterlyCadence: true,
            enableAnnualCadence: true,
            customCadence: "",
            startMonth: "january",
          },
          objectiveSettings: {
            defaultObjectiveCategory: "growth",
            maxObjectivesPerTeam: "5",
            maxKeyResultsPerObjective: "3",
            requireObjectiveApproval: true,
            enableObjectiveAlignment: true,
          },
          teamConfiguration: {
            orgStructureType: "functional",
            enableCrossTeamObjectives: true,
            defaultVisibility: "public",
            selectedTeams: [],
          },
          integrations: {
            enableSlackIntegration: false,
            enableEmailNotifications: true,
            enableCalendarSync: false,
            enableAnalyticsReporting: true,
          },
        };
        
        // Prioritize mission data from the organization-mission API
        const missionResponse = await fetch(`/api/organization-mission?tenantId=${currentTenantId}`, {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'X-Tenant-ID': currentTenantId
          },
          credentials: 'include'
        });
        
        // If mission data is available, use it for mission, vision, and values
        if (missionResponse.ok) {
          const missionData = await missionResponse.json();
          
          // Check if data exists by checking for mission, id, or mission string
          if (missionData && (missionData.id || missionData.mission)) {
            // Populate the mission and vision fields from organization mission data
            formValues.generalSettings.companyMission = missionData.mission || "";
            formValues.generalSettings.companyVision = missionData.vision || "";
            
            // If behaviors is a JSON string, parse it; otherwise, use as is
            if (missionData.behaviors) {
              try {
                // Check if it's a JSON string that needs parsing
                if (typeof missionData.behaviors === 'string' && 
                    (missionData.behaviors.startsWith('[') || missionData.behaviors.startsWith('{'))) {
                  const parsedBehaviors = JSON.parse(missionData.behaviors);
                  
                  // If it's an array, join with commas
                  if (Array.isArray(parsedBehaviors)) {
                    formValues.generalSettings.companyValues = parsedBehaviors.join(', ');
                  } else {
                    formValues.generalSettings.companyValues = missionData.behaviors;
                  }
                } else {
                  formValues.generalSettings.companyValues = missionData.behaviors;
                }
              } catch (e) {
                // If parsing fails, use the raw string
                formValues.generalSettings.companyValues = missionData.behaviors;
              }
            }
          }
        }
        
        // Now, try to fetch OKR system configuration if it exists
        const configResponse = await fetch(`/api/okr-system-config?tenantId=${currentTenantId}`, {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'X-Tenant-ID': currentTenantId
          },
          credentials: 'include'
        });
        
        if (configResponse.ok) {
          const systemConfig = await configResponse.json();
          
          if (systemConfig) {
            // Fill in form values from existing configuration
            
            if (systemConfig.tracking_frequency) {
              formValues.generalSettings.trackingFrequency = systemConfig.tracking_frequency;
            }
            
            if (systemConfig.enable_notifications !== undefined) {
              formValues.generalSettings.enableNotifications = systemConfig.enable_notifications;
            }
            
            if (systemConfig.primary_cadence) {
              formValues.timeframes.primaryCadence = systemConfig.primary_cadence;
            }
            
            if (systemConfig.enable_quarterly_cadence !== undefined) {
              formValues.timeframes.enableQuarterlyCadence = systemConfig.enable_quarterly_cadence;
            }
            
            if (systemConfig.enable_annual_cadence !== undefined) {
              formValues.timeframes.enableAnnualCadence = systemConfig.enable_annual_cadence;
            }
            
            if (systemConfig.custom_cadence) {
              formValues.timeframes.customCadence = systemConfig.custom_cadence;
            }
            
            if (systemConfig.start_month) {
              formValues.timeframes.startMonth = systemConfig.start_month;
            }
            
            if (systemConfig.default_objective_category) {
              formValues.objectiveSettings.defaultObjectiveCategory = systemConfig.default_objective_category;
            }
            
            if (systemConfig.max_objectives_per_team) {
              formValues.objectiveSettings.maxObjectivesPerTeam = systemConfig.max_objectives_per_team;
            }
            
            if (systemConfig.max_key_results_per_objective) {
              formValues.objectiveSettings.maxKeyResultsPerObjective = systemConfig.max_key_results_per_objective;
            }
            
            if (systemConfig.require_objective_approval !== undefined) {
              formValues.objectiveSettings.requireObjectiveApproval = systemConfig.require_objective_approval;
            }
            
            if (systemConfig.enable_objective_alignment !== undefined) {
              formValues.objectiveSettings.enableObjectiveAlignment = systemConfig.enable_objective_alignment;
            }
            
            if (systemConfig.org_structure_type) {
              formValues.teamConfiguration.orgStructureType = systemConfig.org_structure_type;
            }
            
            if (systemConfig.enable_cross_team_objectives !== undefined) {
              formValues.teamConfiguration.enableCrossTeamObjectives = systemConfig.enable_cross_team_objectives;
            }
            
            if (systemConfig.default_visibility) {
              formValues.teamConfiguration.defaultVisibility = systemConfig.default_visibility;
            }
            
            // If there are selected teams in the config, use them
            if (systemConfig.selected_teams && Array.isArray(systemConfig.selected_teams)) {
              formValues.teamConfiguration.selectedTeams = systemConfig.selected_teams;
            } else {
              formValues.teamConfiguration.selectedTeams = [];
            }
            
            formValues.integrations.enableSlackIntegration = 
              systemConfig.enable_slack_integration === true;
            
            formValues.integrations.enableEmailNotifications = 
              systemConfig.enable_email_notifications !== false;
            
            formValues.integrations.enableCalendarSync = 
              systemConfig.enable_calendar_sync === true;
            
            formValues.integrations.enableAnalyticsReporting = 
              systemConfig.enable_analytics_reporting !== false;
          }
        }
        
        // Reset the form with all the collected data
        form.reset(formValues);
        
        // Show notification that data was loaded if mission or vision is available
        if (formValues.generalSettings.companyMission || formValues.generalSettings.companyVision) {
          toast({
            title: "Configuration Loaded",
            description: "Your existing data has been loaded. You can edit and save any changes.",
          });
        }
        
      } catch (error) {
        console.error("Error fetching configuration data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExistingConfig();
  }, [form, toast]);
  
  // Create mutation for saving OKR system setup
  const saveOKRSystemMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      console.log("Saving OKR system setup:", data);
      
      if (!tenantId) {
        throw new Error("No tenant ID available. Please refresh the page and try again.");
      }
      
      // Convert form data to snake_case for the API
      const apiData = {
        tenant_id: tenantId,
        // General Settings
        tracking_frequency: data.generalSettings.trackingFrequency,
        enable_notifications: data.generalSettings.enableNotifications,
        // Timeframes
        primary_cadence: data.timeframes.primaryCadence,
        enable_quarterly_cadence: data.timeframes.enableQuarterlyCadence,
        enable_annual_cadence: data.timeframes.enableAnnualCadence,
        custom_cadence: data.timeframes.customCadence,
        start_month: data.timeframes.startMonth,
        // Objective Settings
        default_objective_category: data.objectiveSettings.defaultObjectiveCategory,
        max_objectives_per_team: data.objectiveSettings.maxObjectivesPerTeam,
        max_key_results_per_objective: data.objectiveSettings.maxKeyResultsPerObjective,
        require_objective_approval: data.objectiveSettings.requireObjectiveApproval,
        enable_objective_alignment: data.objectiveSettings.enableObjectiveAlignment,
        // Team Configuration
        org_structure_type: data.teamConfiguration.orgStructureType,
        enable_cross_team_objectives: data.teamConfiguration.enableCrossTeamObjectives,
        default_visibility: data.teamConfiguration.defaultVisibility,
        selected_teams: data.teamConfiguration.selectedTeams,
        // Integrations
        enable_slack_integration: data.integrations.enableSlackIntegration,
        enable_email_notifications: data.integrations.enableEmailNotifications,
        enable_calendar_sync: data.integrations.enableCalendarSync,
        enable_analytics_reporting: data.integrations.enableAnalyticsReporting,
      };
      
      // Save the organization mission/vision/values first
      const missionData = {
        tenant_id: tenantId,
        mission: data.generalSettings.companyMission,
        vision: data.generalSettings.companyVision,
        behaviors: data.generalSettings.companyValues,
      };
      
      // Save mission data
      await fetch('/api/organization-mission', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId
        },
        body: JSON.stringify(missionData),
        credentials: 'include'
      });
      
      // Then save the OKR system configuration
      const response = await fetch('/api/okr-system-config', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId
        },
        body: JSON.stringify(apiData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save OKR system configuration");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Show success message
      toast({
        title: "Configuration Saved Successfully",
        description: "Your OKR system is now set up and ready to use.",
      });
      
      // Mark setup as complete
      setSetupComplete(true);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/okr-system-config'] });
      queryClient.invalidateQueries({ queryKey: ['/api/organization-mission'] });
      
      // Set last step as active
      setActivePage("review");
    },
    onError: (error) => {
      // Show error message
      toast({
        title: "Failed to Save Configuration",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    }
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate form data
      const valid = await form.trigger();
      
      if (!valid) {
        console.error("Form validation failed", form.formState.errors);
        // Show error toast
        toast({
          title: "Validation Error",
          description: "Please check all required fields and try again.",
          variant: "destructive",
        });
        return;
      }
      
      // If on review page, submit the form
      if (activePage === "review") {
        setIsSubmitting(true);
        
        // Get form values
        const values = form.getValues();
        
        // Submit form data
        await saveOKRSystemMutation.mutateAsync(values);
      } else {
        // Otherwise go to next step
        goToNextStep();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "Failed to save OKR system configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const goToNextStep = () => {
    const currentIndex = steps.findIndex(step => step.id === activePage);
    if (currentIndex < steps.length - 1) {
      setActivePage(steps[currentIndex + 1].id);
    }
  };
  
  const goToPreviousStep = () => {
    const currentIndex = steps.findIndex(step => step.id === activePage);
    if (currentIndex > 0) {
      setActivePage(steps[currentIndex - 1].id);
    }
  };
  
  const goToStep = (stepId: string) => {
    setActivePage(stepId);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">OKR System Setup</h1>
        <p className="text-gray-600 text-sm">
          Configure your OKR tracking system in 5 quick steps.
        </p>
        {isLoading && (
          <div className="mt-2">
            <div className="flex items-center gap-2 text-sm px-3 py-1.5 bg-primary-50 text-primary-700 rounded-md inline-block">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Loading...</span>
            </div>
          </div>
        )}
      </div>

      <div className="mb-4">
        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between mb-1">
            <span className="text-xs font-medium">Step {activeIndex + 1} of {steps.length}</span>
            <span className="text-xs font-medium">{Math.round((activeIndex / (steps.length - 1)) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-primary h-1.5 rounded-full transition-all duration-300" 
              style={{ width: `${Math.round((activeIndex / (steps.length - 1)) * 100)}%` }}
            ></div>
          </div>
        </div>
        
        {/* Step navigation */}
        <div className="mb-4">
          <div className="flex items-center justify-between border-b pb-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white">
                <span className="text-xs font-medium">{activeIndex + 1}</span>
              </div>
              <h3 className="font-medium text-gray-900">{steps[activeIndex].label}</h3>
            </div>
          </div>
          
          <div className="grid grid-cols-5 gap-1 bg-gray-50 p-1 rounded">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => index <= activeIndex && goToStep(step.id)}
                disabled={setupComplete || index > activeIndex + 1}
                className={`flex items-center justify-center px-2 py-1.5 rounded text-xs font-medium
                  ${activeIndex === index
                    ? 'bg-white shadow-sm text-primary'
                    : index < activeIndex
                      ? 'text-green-600'
                      : 'text-gray-500'}`}
              >
                {index < activeIndex ? (
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                ) : (
                  <span className={`flex-shrink-0 inline-flex items-center justify-center rounded-full h-4 w-4 text-[10px] mr-1
                    ${activeIndex === index 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-200 text-gray-600'}`}
                  >
                    {index + 1}
                  </span>
                )}
                <span className="hidden sm:inline">{step.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main form */}
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs value={activePage} className="w-full">
              {/* General Settings */}
              <TabsContent value="general">
                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      <div className="border-b pb-4 mb-4">
                        <h2 className="text-lg font-medium text-gray-800">
                          General Settings
                        </h2>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Company Mission</label>
                          <Textarea 
                            {...form.register("generalSettings.companyMission")}
                            placeholder="Enter your company's mission statement..."
                            className="min-h-[80px]"
                          />
                          {form.formState.errors.generalSettings?.companyMission && (
                            <p className="text-red-500 text-xs">{form.formState.errors.generalSettings.companyMission.message}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Company Vision</label>
                          <Textarea 
                            {...form.register("generalSettings.companyVision")}
                            placeholder="Enter your company's vision statement..."
                            className="min-h-[80px]"
                          />
                          {form.formState.errors.generalSettings?.companyVision && (
                            <p className="text-red-500 text-xs">{form.formState.errors.generalSettings.companyVision.message}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Company Values</label>
                          <Textarea 
                            {...form.register("generalSettings.companyValues")}
                            placeholder="Enter your company's core values..."
                            className="min-h-[80px]"
                          />
                          {form.formState.errors.generalSettings?.companyValues && (
                            <p className="text-red-500 text-xs">{form.formState.errors.generalSettings.companyValues.message}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium">OKR Tracking Frequency</label>
                          <Select 
                            onValueChange={(value) => form.setValue("generalSettings.trackingFrequency", value as "weekly" | "biweekly" | "monthly")}
                            defaultValue={form.getValues("generalSettings.trackingFrequency")}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select tracking frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="biweekly">Bi-weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="enableNotifications" 
                            checked={form.getValues("generalSettings.enableNotifications")}
                            onCheckedChange={(checked) => form.setValue("generalSettings.enableNotifications", checked as boolean)}
                          />
                          <label htmlFor="enableNotifications" className="text-sm font-medium">
                            Enable email notifications for OKR updates
                          </label>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Timeframes Settings */}
              <TabsContent value="timeframes">
                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      <div className="border-b pb-4 mb-4">
                        <h2 className="text-lg font-medium text-gray-800">
                          Timeframes Settings
                        </h2>
                      </div>
                      
                      <TimeframeSetup form={form} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Objective Settings */}
              <TabsContent value="objectives">
                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      <div className="border-b pb-4 mb-4">
                        <h2 className="text-lg font-medium text-gray-800">
                          Objective Settings
                        </h2>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Default Objective Category</label>
                          <Select 
                            onValueChange={(value) => form.setValue("objectiveSettings.defaultObjectiveCategory", value as any)}
                            defaultValue={form.getValues("objectiveSettings.defaultObjectiveCategory")}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select default category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="growth">Growth</SelectItem>
                              <SelectItem value="product">Product</SelectItem>
                              <SelectItem value="customer">Customer</SelectItem>
                              <SelectItem value="people">People</SelectItem>
                              <SelectItem value="financial">Financial</SelectItem>
                              <SelectItem value="operations">Operations</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Max Objectives Per Team</label>
                            <Select 
                              onValueChange={(value) => form.setValue("objectiveSettings.maxObjectivesPerTeam", value as any)}
                              defaultValue={form.getValues("objectiveSettings.maxObjectivesPerTeam")}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select maximum" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="3">3</SelectItem>
                                <SelectItem value="4">4</SelectItem>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="6">6</SelectItem>
                                <SelectItem value="7">7</SelectItem>
                                <SelectItem value="8">8</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Max Key Results Per Objective</label>
                            <Select 
                              onValueChange={(value) => form.setValue("objectiveSettings.maxKeyResultsPerObjective", value as any)}
                              defaultValue={form.getValues("objectiveSettings.maxKeyResultsPerObjective")}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select maximum" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="3">3</SelectItem>
                                <SelectItem value="4">4</SelectItem>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="6">6</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="requireObjectiveApproval" 
                              checked={form.getValues("objectiveSettings.requireObjectiveApproval")}
                              onCheckedChange={(checked) => form.setValue("objectiveSettings.requireObjectiveApproval", checked as boolean)}
                            />
                            <label htmlFor="requireObjectiveApproval" className="text-sm font-medium">
                              Require manager approval for new objectives
                            </label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="enableObjectiveAlignment" 
                              checked={form.getValues("objectiveSettings.enableObjectiveAlignment")}
                              onCheckedChange={(checked) => form.setValue("objectiveSettings.enableObjectiveAlignment", checked as boolean)}
                            />
                            <label htmlFor="enableObjectiveAlignment" className="text-sm font-medium">
                              Enable objective alignment across teams and departments
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Team Configuration */}
              <TabsContent value="teams">
                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      <div className="border-b pb-4 mb-4">
                        <h2 className="text-lg font-medium text-gray-800">
                          Team Configuration
                        </h2>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Organization Structure Type</label>
                          <Select 
                            onValueChange={(value) => form.setValue("teamConfiguration.orgStructureType", value as any)}
                            defaultValue={form.getValues("teamConfiguration.orgStructureType")}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select organization structure" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="functional">Functional</SelectItem>
                              <SelectItem value="divisional">Divisional</SelectItem>
                              <SelectItem value="matrix">Matrix</SelectItem>
                              <SelectItem value="flat">Flat</SelectItem>
                              <SelectItem value="hierarchical">Hierarchical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Default Visibility</label>
                          <Select 
                            onValueChange={(value) => form.setValue("teamConfiguration.defaultVisibility", value as any)}
                            defaultValue={form.getValues("teamConfiguration.defaultVisibility")}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select default visibility" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="public">Public (visible to all)</SelectItem>
                              <SelectItem value="team">Team Only</SelectItem>
                              <SelectItem value="private">Private</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-center space-x-2 pt-2">
                          <Checkbox 
                            id="enableCrossTeamObjectives" 
                            checked={form.getValues("teamConfiguration.enableCrossTeamObjectives")}
                            onCheckedChange={(checked) => form.setValue("teamConfiguration.enableCrossTeamObjectives", checked as boolean)}
                          />
                          <label htmlFor="enableCrossTeamObjectives" className="text-sm font-medium">
                            Enable cross-team objectives
                          </label>
                        </div>
                        
                        <div className="space-y-2 pt-4">
                          <label className="text-sm font-medium">Select Teams for OKRs</label>
                          <p className="text-xs text-gray-500 mb-3">Select which teams will participate in the OKR process.</p>
                          
                          {tenantId && (
                            <TeamSelectionSection
                              tenantId={tenantId}
                              value={form.getValues("teamConfiguration.selectedTeams")}
                              onChange={(teams) => form.setValue("teamConfiguration.selectedTeams", teams)}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Integrations */}
              <TabsContent value="integrations">
                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      <div className="border-b pb-4 mb-4">
                        <h2 className="text-lg font-medium text-gray-800">
                          Integrations
                        </h2>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="enableSlackIntegration" 
                            checked={form.getValues("integrations.enableSlackIntegration")}
                            onCheckedChange={(checked) => form.setValue("integrations.enableSlackIntegration", checked as boolean)}
                          />
                          <label htmlFor="enableSlackIntegration" className="text-sm font-medium">
                            Enable Slack integration
                          </label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="enableEmailNotifications" 
                            checked={form.getValues("integrations.enableEmailNotifications")}
                            onCheckedChange={(checked) => form.setValue("integrations.enableEmailNotifications", checked as boolean)}
                          />
                          <label htmlFor="enableEmailNotifications" className="text-sm font-medium">
                            Enable email notifications
                          </label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="enableCalendarSync" 
                            checked={form.getValues("integrations.enableCalendarSync")}
                            onCheckedChange={(checked) => form.setValue("integrations.enableCalendarSync", checked as boolean)}
                          />
                          <label htmlFor="enableCalendarSync" className="text-sm font-medium">
                            Enable calendar sync
                          </label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="enableAnalyticsReporting" 
                            checked={form.getValues("integrations.enableAnalyticsReporting")}
                            onCheckedChange={(checked) => form.setValue("integrations.enableAnalyticsReporting", checked as boolean)}
                          />
                          <label htmlFor="enableAnalyticsReporting" className="text-sm font-medium">
                            Enable analytics reporting
                          </label>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Review & Submit */}
              <TabsContent value="review">
                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      <div className="border-b pb-4 mb-4">
                        <h2 className="text-lg font-medium text-gray-800">
                          Review & Launch OKR System
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          Review your configuration before launching your OKR system.
                        </p>
                      </div>
                      
                      {setupComplete ? (
                        <div className="bg-green-50 p-4 rounded-md border border-green-200">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                              <CheckCircle2 className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                              <h3 className="font-medium text-green-800">OKR System Setup Complete!</h3>
                              <p className="text-sm text-green-700">Your OKR system is now ready to use.</p>
                            </div>
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-green-200">
                            <h4 className="font-medium text-green-800 mb-2">Next Steps:</h4>
                            <ul className="space-y-2 text-sm text-green-700">
                              <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                                <span>Create company-level objectives</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                                <span>Invite team leaders to create team objectives</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                                <span>Schedule your first OKR review meeting</span>
                              </li>
                            </ul>
                          </div>
                          
                          <div className="mt-4 flex justify-center">
                            <Button 
                              onClick={() => navigate("/dashboard")}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Go to Dashboard
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="border rounded-md p-4">
                              <h3 className="font-medium mb-2">General Settings</h3>
                              <p className="text-sm mb-1"><span className="font-medium">Tracking Frequency:</span> {form.getValues("generalSettings.trackingFrequency")}</p>
                              <p className="text-sm"><span className="font-medium">Notifications:</span> {form.getValues("generalSettings.enableNotifications") ? "Enabled" : "Disabled"}</p>
                            </div>
                            
                            <div className="border rounded-md p-4">
                              <h3 className="font-medium mb-2">Timeframes</h3>
                              <p className="text-sm mb-1"><span className="font-medium">Primary Cadence:</span> {form.getValues("timeframes.primaryCadence")}</p>
                              <p className="text-sm"><span className="font-medium">Start Month:</span> {form.getValues("timeframes.startMonth")}</p>
                            </div>
                            
                            <div className="border rounded-md p-4">
                              <h3 className="font-medium mb-2">Objective Settings</h3>
                              <p className="text-sm mb-1"><span className="font-medium">Max Objectives:</span> {form.getValues("objectiveSettings.maxObjectivesPerTeam")} per team</p>
                              <p className="text-sm"><span className="font-medium">Max Key Results:</span> {form.getValues("objectiveSettings.maxKeyResultsPerObjective")} per objective</p>
                            </div>
                            
                            <div className="border rounded-md p-4">
                              <h3 className="font-medium mb-2">Team Configuration</h3>
                              <p className="text-sm mb-1"><span className="font-medium">Structure:</span> {form.getValues("teamConfiguration.orgStructureType")}</p>
                              <p className="text-sm"><span className="font-medium">Selected Teams:</span> {form.getValues("teamConfiguration.selectedTeams").length}</p>
                            </div>
                          </div>
                          
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">Please review the settings above and click "Launch OKR System" to complete the setup.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Navigation buttons */}
            <div className="flex justify-between mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={goToPreviousStep}
                disabled={activeIndex === 0 || setupComplete}
                className="h-9"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              
              {activeIndex < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={goToNextStep}
                  disabled={setupComplete}
                  className="h-9"
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault();
                    console.log("Save Configuration button clicked");
                    handleSubmit(e);
                  }}
                  disabled={isSubmitting || setupComplete}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-6 py-5 h-auto text-base shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      <span>Saving Your Configuration...</span>
                    </>
                  ) : setupComplete ? (
                    <>
                      <CheckCircle2 className="mr-3 h-5 w-5" />
                      <span>Configuration Successfully Saved!</span>
                    </>
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className="text-base font-medium">Launch Your OKR System</span>
                      <span className="text-xs opacity-90 mt-1">Save configuration and get started</span>
                    </div>
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}