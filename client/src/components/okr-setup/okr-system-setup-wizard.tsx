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
import { ArrowRight, ArrowLeft, CheckCircle2, Settings2, Target, Calendar, Users2, Layers, Zap, Loader2, Check, User, Lightbulb } from "lucide-react";
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
  
  // Fetch teams from the API - use the built-in query client
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
    
    // Call the onChange handler if provided
    if (onChange) {
      onChange(updatedTeams);
    }
  };

  // If loading, show loading indicator
  if (isLoading) {
    return (
      <div className="flex items-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
        <span>Loading teams...</span>
      </div>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-500">Error loading teams. Please try again.</p>
      </div>
    );
  }

  // If loading, show loading indicator 
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border rounded-md p-4 opacity-70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-500">Error loading teams. Please try again.</p>
      </div>
    );
  }

  // If no teams, show message
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
  { 
    id: "general", 
    label: "General", 
    icon: Settings2,
    description: "Define your company's mission, vision, and core values",
    hint: "This foundational information guides all your organization's objectives"
  },
  { 
    id: "timeframes", 
    label: "Timeframes", 
    icon: Calendar,
    description: "Set up planning periods for your OKR cycles",
    hint: "Most companies use quarterly and annual timeframes for tracking objectives"
  },
  { 
    id: "objectives", 
    label: "Objectives", 
    icon: Target,
    description: "Configure objective settings and defaults",
    hint: "These settings determine how objectives are created and tracked"
  },
  { 
    id: "teams", 
    label: "Teams", 
    icon: Users2,
    description: "Select which teams will participate in OKRs",
    hint: "Team alignment is critical for successful OKR implementation"
  },
  { 
    id: "integrations", 
    label: "Integrations", 
    icon: Layers,
    description: "Connect your OKR system with other tools",
    hint: "Integrations help embed OKRs into your team's daily workflow"
  },
  { 
    id: "review", 
    label: "Review", 
    icon: CheckCircle2,
    description: "Review your configuration before launching",
    hint: "Verify all settings before going live with your OKR system"
  },
];

export default function OKRSystemSetupWizard() {
  const [activePage, setActivePage] = useState("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
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
        console.log("User data received:", userData);
        
        // First try to get default tenant, then first tenant from array if available
        const currentTenantId = userData.defaultTenant || 
                               (userData.tenants && userData.tenants.length > 0 && userData.tenants[0].id);
        
        console.log("Detected tenant ID:", currentTenantId);
        
        if (!currentTenantId) {
          console.error("No tenant ID available");
          setIsLoading(false);
          return;
        }
        
        // Set tenant ID for later use in the submit function
        setTenantId(currentTenantId);
        
        // First, fetch organization mission data to prefill mission and vision fields
        console.log("Fetching organization mission data for tenant:", currentTenantId);
        
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
          console.log("Organization mission data loaded:", missionData);
          
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
            
            console.log("Prefilled form with mission data:", {
              mission: formValues.generalSettings.companyMission,
              vision: formValues.generalSettings.companyVision,
              values: formValues.generalSettings.companyValues
            });
          }
        }
        
        // Then fetch OKR system config for remaining form fields
        console.log("Fetching OKR system config with tenant ID:", currentTenantId);
        
        const systemResponse = await fetch(`/api/okr-system?tenantId=${currentTenantId}`, {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'X-Tenant-ID': currentTenantId
          },
          credentials: 'include'
        });
        
        // If OKR system config is available, use it to populate remaining fields
        if (systemResponse.ok) {
          const systemConfig = await systemResponse.json();
          console.log("Loaded existing OKR system config:", systemConfig);
          
          // Map database fields to form fields
          if (systemConfig) {
            // Only override mission/vision if not already set from mission API
            if (!formValues.generalSettings.companyMission && systemConfig.company_mission) {
              formValues.generalSettings.companyMission = systemConfig.company_mission;
            }
            
            if (!formValues.generalSettings.companyVision && systemConfig.company_vision) {
              formValues.generalSettings.companyVision = systemConfig.company_vision;
            }
            
            if (!formValues.generalSettings.companyValues && systemConfig.company_values) {
              formValues.generalSettings.companyValues = systemConfig.company_values;
            }
            
            // Map remaining fields
            if (systemConfig.tracking_frequency) {
              formValues.generalSettings.trackingFrequency = systemConfig.tracking_frequency;
            }
            
            formValues.generalSettings.enableNotifications = systemConfig.enable_notifications !== false;
            
            if (systemConfig.primary_cadence) {
              formValues.timeframes.primaryCadence = systemConfig.primary_cadence;
            }
            
            formValues.timeframes.enableQuarterlyCadence = systemConfig.enable_quarterly_cadence !== false;
            formValues.timeframes.enableAnnualCadence = systemConfig.enable_annual_cadence !== false;
            
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
              formValues.objectiveSettings.maxObjectivesPerTeam = systemConfig.max_objectives_per_team.toString();
            }
            
            if (systemConfig.max_key_results_per_objective) {
              formValues.objectiveSettings.maxKeyResultsPerObjective = 
                systemConfig.max_key_results_per_objective.toString();
            }
            
            formValues.objectiveSettings.requireObjectiveApproval = 
              systemConfig.require_objective_approval !== false;
            
            formValues.objectiveSettings.enableObjectiveAlignment = 
              systemConfig.enable_objective_alignment !== false;
            
            if (systemConfig.org_structure_type) {
              formValues.teamConfiguration.orgStructureType = systemConfig.org_structure_type;
            }
            
            formValues.teamConfiguration.enableCrossTeamObjectives = 
              systemConfig.enable_cross_team_objectives !== false;
            
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
        
        // Finally, reset the form with all the collected data
        console.log("Resetting form with data:", formValues);
        form.reset(formValues);
        
        // Update internal state to match the loaded data
        setActivePage("general"); // Start on the general page where mission data is displayed
        
        // Show notification that data was loaded if mission or vision is available
        if (formValues.generalSettings.companyMission || formValues.generalSettings.companyVision) {
          toast({
            title: "Configuration Loaded",
            description: "Your existing mission and vision data has been loaded. You can edit and save changes using the Complete Mission Setup button.",
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

  // Using the tenantId state initialized above
  
  // Create mutation for saving OKR system setup
  const saveOKRSystemMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      console.log("Saving OKR system setup:", data);
      
      if (!tenantId) {
        throw new Error("No tenant ID available. Please refresh the page and try again.");
      }
      
      // Make API request to save OKR system setup
      console.log("Using tenant ID for save:", tenantId);
      
      // Create a new object with tenant_id property
      const formDataWithTenant = {
        ...data,
        tenant_id: tenantId // Add tenant ID to the request body
      };
      
      // Log the full data being sent
      console.log("Sending data with tenant:", formDataWithTenant);
      
      console.log("Sending OKR system config with tenant ID:", tenantId);
      
      const response = await fetch(`/api/okr-system-setup?tenantId=${tenantId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId // Add tenant ID in header for middleware
        },
        body: JSON.stringify(formDataWithTenant),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to save OKR system setup:", response.status, errorData);
        throw new Error(errorData.error || "Failed to save OKR system setup");
      }
      
      return await response.json();
    },
    onSuccess: async (data) => {
      console.log("OKR system setup saved successfully:", data);
      setSetupComplete(true);
      
      // Show success message
      toast({
        title: "OKR System Setup Complete!",
        description: "Your OKR system has been configured successfully.",
      });
      
      // Invalidate any relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/okr-system"] });
      
      // Show completion message and redirect
      setTimeout(() => {
        console.log("Setup complete");
        
        toast({
          title: "Ready to Launch your OKR Platform!",
          description: "Your OKR system is ready to use. You will now be redirected to your dashboard.",
        });
        
        // Navigate to the dashboard
        setTimeout(() => {
          navigate("/dashboard");
        }, 800);
      }, 1500);
    },
    onError: (error: any) => {
      setIsSubmitting(false);
      toast({
        title: "Error Saving OKR System",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  });

  // Function to check if current step is valid
  const isCurrentStepValid = () => {
    const currentStep = steps[activeIndex];
    
    if (currentStep.id === "general") {
      const { generalSettings } = form.getValues();
      return !!generalSettings.companyMission && 
             !!generalSettings.companyVision && 
             !!generalSettings.companyValues;
    }
    
    if (currentStep.id === "timeframes") {
      return true; // All fields have defaults
    }
    
    if (currentStep.id === "objectives") {
      return true; // All fields have defaults
    }
    
    if (currentStep.id === "teams") {
      return true; // All fields have defaults
    }
    
    if (currentStep.id === "integrations") {
      return true; // All fields have defaults
    }
    
    return true;
  };

  // Submit handler
  const onSubmitForm = (data: FormValues) => {
    console.log("Form submitted with data:", data);
    setIsSubmitting(true);
    saveOKRSystemMutation.mutate(data);
  };
  
  // Handle saving just the mission data
  const saveMissionData = async () => {
    try {
      // Get values from the form
      const { generalSettings } = form.getValues();
      
      if (!tenantId) {
        toast({
          title: "Error",
          description: "No tenant ID available. Please refresh the page and try again.",
          variant: "destructive",
        });
        return;
      }
      
      if (!generalSettings.companyMission || !generalSettings.companyVision) {
        toast({
          title: "Validation Error",
          description: "Please fill in both mission and vision statements.",
          variant: "destructive",
        });
        return;
      }
      
      // Show loading state
      setIsSubmitting(true);
      
      // Prepare the data for the mission API
      const missionData = {
        mission: generalSettings.companyMission,
        vision: generalSettings.companyVision,
        behaviors: generalSettings.companyValues,
        tenantId: tenantId
      };
      
      console.log("Saving mission data:", missionData);
      
      // Send the request to the mission API
      const response = await fetch(`/api/organization-mission?tenantId=${tenantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId
        },
        body: JSON.stringify(missionData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save mission data: ${errorText}`);
      }
      
      // Show success message
      toast({
        title: "Mission Setup Complete!",
        description: "Your company mission, vision, and values have been saved.",
      });
      
      // Move to the next step automatically
      goToNextStep();
      
    } catch (error) {
      console.error("Error saving mission data:", error);
      toast({
        title: "Error Saving Mission",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSubmit = form.handleSubmit(onSubmitForm);

  // Navigation handlers
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

      <div className="mb-8">
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
        
        {/* Desktop step navigator */}
        <div className="hidden md:block mb-8">
          <div className="flex items-center justify-between relative">
            {/* Connecting line */}
            <div className="absolute h-1 bg-gray-200 left-0 right-0 top-1/2 transform -translate-y-1/2 -z-10"></div>
            
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center relative z-10">
                <div className="mb-3">
                  {index < activeIndex ? (
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                  ) : activeIndex === index ? (
                    <div className="w-10 h-10 rounded-full bg-primary border-4 border-blue-100 flex items-center justify-center shadow-md">
                      {step.icon === Settings2 && <Settings2 className="h-5 w-5 text-white" />}
                      {step.icon === Calendar && <Calendar className="h-5 w-5 text-white" />}
                      {step.icon === Target && <Target className="h-5 w-5 text-white" />}
                      {step.icon === Users2 && <Users2 className="h-5 w-5 text-white" />}
                      {step.icon === Layers && <Layers className="h-5 w-5 text-white" />}
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 font-medium">{index + 1}</span>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => goToStep(step.id)}
                  disabled={setupComplete || index > activeIndex + 1}
                  className={`text-sm font-medium ${
                    activeIndex === index
                      ? 'text-primary'
                      : index < activeIndex
                        ? 'text-green-600' 
                        : 'text-gray-500'
                  } ${index <= activeIndex + 1 && !setupComplete ? 'cursor-pointer hover:underline' : 'cursor-default'}`}
                >
                  {step.label}
                </button>
                
                {activeIndex === index && (
                  <p className="text-xs text-gray-500 mt-1 max-w-[120px] text-center">
                    {step.hint}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile steps */}
        <div className="md:hidden mb-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
                {steps[activeIndex].icon === Settings2 && <Settings2 className="w-5 h-5" />}
                {steps[activeIndex].icon === Calendar && <Calendar className="w-5 h-5" />}
                {steps[activeIndex].icon === Target && <Target className="w-5 h-5" />}
                {steps[activeIndex].icon === Users2 && <Users2 className="w-5 h-5" />}
                {steps[activeIndex].icon === Layers && <Layers className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Step {activeIndex + 1}: {steps[activeIndex].label}</h3>
                <p className="text-sm text-gray-500">{steps[activeIndex].description}</p>
              </div>
            </div>
            
            <div className="flex overflow-x-auto py-2 gap-2">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => goToStep(step.id)}
                  disabled={setupComplete || index > activeIndex + 1}
                  className={`flex items-center min-w-max px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border
                    ${activeIndex === index
                      ? 'bg-primary text-white border-primary'
                      : index < activeIndex
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-gray-50 text-gray-700 border-gray-200'}`}
                >
                  {index < activeIndex ? (
                    <Check className="w-3 h-3 mr-1" />
                  ) : (
                    <>
                      {step.icon === Settings2 && <Settings2 className="w-3 h-3 mr-1" />}
                      {step.icon === Calendar && <Calendar className="w-3 h-3 mr-1" />}
                      {step.icon === Target && <Target className="w-3 h-3 mr-1" />}
                      {step.icon === Users2 && <Users2 className="w-3 h-3 mr-1" />}
                      {step.icon === Layers && <Layers className="w-3 h-3 mr-1" />}
                    </>
                  )}
                  {step.label}
                </button>
              ))}
            </div>
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
                      <div className="border-b pb-4">
                        <h2 className="text-2xl font-semibold flex items-center text-gray-800">
                          <Settings2 className="mr-3 h-6 w-6 text-primary" />
                          General Settings
                        </h2>
                        <p className="text-gray-600 mt-2">
                          Define your organization's mission, vision, and values to align your OKRs with your strategic goals.
                        </p>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-md border border-blue-100 mb-6">
                        <h3 className="text-blue-700 font-medium mb-2 flex items-center">
                          <Lightbulb className="mr-2 h-4 w-4" /> Why this matters
                        </h3>
                        <p className="text-blue-600 text-sm">
                          Your mission and vision statements provide direction and context for all OKRs. Teams will use these foundational statements to ensure their objectives align with your organization's purpose.
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="grid gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Company Mission</label>
                            <Textarea
                              placeholder="Our company's mission is to..."
                              {...form.register("generalSettings.companyMission")}
                              className="resize-none h-20"
                              defaultValue={form.getValues("generalSettings.companyMission")}
                            />
                            {form.formState.errors.generalSettings?.companyMission && (
                              <p className="text-sm text-red-500 mt-1">
                                {form.formState.errors.generalSettings.companyMission.message}
                              </p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-1">Company Vision</label>
                            <Textarea
                              placeholder="Our vision for the future is..."
                              {...form.register("generalSettings.companyVision")}
                              className="resize-none h-20"
                              defaultValue={form.getValues("generalSettings.companyVision")}
                            />
                            {form.formState.errors.generalSettings?.companyVision && (
                              <p className="text-sm text-red-500 mt-1">
                                {form.formState.errors.generalSettings.companyVision.message}
                              </p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-1">Company Values</label>
                            <Textarea
                              placeholder="Our core values include..."
                              {...form.register("generalSettings.companyValues")}
                              className="resize-none h-20"
                              defaultValue={form.getValues("generalSettings.companyValues")}
                            />
                            {form.formState.errors.generalSettings?.companyValues && (
                              <p className="text-sm text-red-500 mt-1">
                                {form.formState.errors.generalSettings.companyValues.message}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">OKR Tracking Frequency</label>
                            <Select
                              defaultValue={form.getValues("generalSettings.trackingFrequency")}
                              onValueChange={(value) => form.setValue("generalSettings.trackingFrequency", value as "weekly" | "biweekly" | "monthly")}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select tracking frequency" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="biweekly">Biweekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {/* Complete Mission Setup button */}
                          <div className="col-span-1 md:col-span-2 mt-6">
                            <Button 
                              type="button"
                              onClick={saveMissionData}
                              disabled={isSubmitting || !form.getValues("generalSettings.companyMission") || !form.getValues("generalSettings.companyVision")}
                              className="w-full"
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  Complete Mission Setup
                                </>
                              )}
                            </Button>
                          </div>
                          
                          <div className="flex items-center space-x-2 pt-6">
                            <Checkbox
                              id="enableNotifications"
                              checked={form.getValues("generalSettings.enableNotifications")}
                              onCheckedChange={(checked) => 
                                form.setValue("generalSettings.enableNotifications", checked as boolean)
                              }
                            />
                            <label 
                              htmlFor="enableNotifications"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Enable Progress Notifications
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Timeframes */}
              <TabsContent value="timeframes">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold flex items-center">
                        <Calendar className="mr-2 h-5 w-5 text-primary" />
                        OKR Timeframes
                      </h2>
                      <p className="text-gray-600 mb-4">
                        Configure your OKR planning cycles and timeframes to establish your organization's rhythm.
                      </p>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium mb-1">Primary OKR Cadence</label>
                          <Select
                            defaultValue={form.getValues("timeframes.primaryCadence")}
                            onValueChange={(value) => form.setValue("timeframes.primaryCadence", value as "quarterly" | "trimester" | "halfYearly" | "annual")}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select primary cadence" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="quarterly">Quarterly (3 months)</SelectItem>
                              <SelectItem value="trimester">Trimester (4 months)</SelectItem>
                              <SelectItem value="halfYearly">Half-yearly (6 months)</SelectItem>
                              <SelectItem value="annual">Annual (12 months)</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500 mt-1">This will be your main planning cycle length</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-3">Additional Time Cadences</label>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="enableQuarterlyCadence"
                                checked={form.getValues("timeframes.enableQuarterlyCadence")}
                                onCheckedChange={(checked) => 
                                  form.setValue("timeframes.enableQuarterlyCadence", checked as boolean)
                                }
                              />
                              <label 
                                htmlFor="enableQuarterlyCadence"
                                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Enable Quarterly OKRs
                              </label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="enableAnnualCadence"
                                checked={form.getValues("timeframes.enableAnnualCadence")}
                                onCheckedChange={(checked) => 
                                  form.setValue("timeframes.enableAnnualCadence", checked as boolean)
                                }
                              />
                              <label 
                                htmlFor="enableAnnualCadence"
                                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Enable Annual OKRs
                              </label>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Custom Cadence (Optional)</label>
                          <Input
                            placeholder="e.g., Sprint-based (2 weeks)"
                            {...form.register("timeframes.customCadence")}
                          />
                          <p className="text-xs text-gray-500 mt-1">If your organization uses a unique timeframe for planning</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">OKR Year Start Month</label>
                          <Select
                            defaultValue={form.getValues("timeframes.startMonth")}
                            onValueChange={(value) => form.setValue("timeframes.startMonth", value as "january" | "february" | "march" | "april" | "may" | "june" | "july" | "august" | "september" | "october" | "november" | "december")}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select start month" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="january">January</SelectItem>
                              <SelectItem value="february">February</SelectItem>
                              <SelectItem value="march">March</SelectItem>
                              <SelectItem value="april">April</SelectItem>
                              <SelectItem value="may">May</SelectItem>
                              <SelectItem value="june">June</SelectItem>
                              <SelectItem value="july">July</SelectItem>
                              <SelectItem value="august">August</SelectItem>
                              <SelectItem value="september">September</SelectItem>
                              <SelectItem value="october">October</SelectItem>
                              <SelectItem value="november">November</SelectItem>
                              <SelectItem value="december">December</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500 mt-1">When your OKR year begins</p>
                        </div>

                        <div className="pt-6 border-t mt-6">
                          <h3 className="text-lg font-medium mb-4">Create Your OKR Timeframes</h3>
                          <p className="text-sm text-gray-600 mb-4">
                            Set up specific timeframes for your OKR cycles. These will be used when creating objectives.
                          </p>
                          
                          {tenantId && (
                            <TimeframeSetup
                              tenantId={tenantId}
                              primaryCadence={form.getValues("timeframes.primaryCadence")}
                              startMonth={form.getValues("timeframes.startMonth")}
                            />
                          )}
                          <p className="text-xs text-gray-500 mt-4">
                            Tip: Creating timeframes now will make it easier for your team to align objectives to specific time periods.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Objective Settings */}
              <TabsContent value="objectives">
                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      <div className="border-b pb-4">
                        <h2 className="text-2xl font-semibold flex items-center text-gray-800">
                          <Target className="mr-3 h-6 w-6 text-primary" />
                          Objective Settings
                        </h2>
                        <p className="text-gray-600 mt-2">
                          Configure how objectives and key results will be structured within your organization.
                        </p>
                      </div>

                      <div className="bg-indigo-50 p-4 rounded-md border border-indigo-100 mb-6">
                        <h3 className="text-indigo-700 font-medium mb-2 flex items-center">
                          <Lightbulb className="mr-2 h-4 w-4" /> OKR Best Practices
                        </h3>
                        <ul className="text-indigo-600 text-sm space-y-2">
                          <li className="flex items-start">
                            <Check className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                            <span>Limit to 3-5 objectives per team to maintain focus</span>
                          </li>
                          <li className="flex items-start">
                            <Check className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                            <span>Each objective should have 2-5 measurable key results</span>
                          </li>
                          <li className="flex items-start">
                            <Check className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                            <span>Objectives should be ambitious but achievable</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium mb-1">Default Objective Category</label>
                          <Select
                            defaultValue={form.getValues("objectiveSettings.defaultObjectiveCategory")}
                            onValueChange={(value) => form.setValue("objectiveSettings.defaultObjectiveCategory", value as "growth" | "product" | "customer" | "people" | "financial" | "operations" | "other")}
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium mb-1">Max Objectives Per Team</label>
                            <Select
                              defaultValue={form.getValues("objectiveSettings.maxObjectivesPerTeam")}
                              onValueChange={(value) => form.setValue("objectiveSettings.maxObjectivesPerTeam", value as "3" | "4" | "5" | "6" | "7" | "8")}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select maximum" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="3">3 objectives</SelectItem>
                                <SelectItem value="4">4 objectives</SelectItem>
                                <SelectItem value="5">5 objectives</SelectItem>
                                <SelectItem value="6">6 objectives</SelectItem>
                                <SelectItem value="7">7 objectives</SelectItem>
                                <SelectItem value="8">8 objectives</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">Recommended: 3-5 for focus</p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-1">Max Key Results Per Objective</label>
                            <Select
                              defaultValue={form.getValues("objectiveSettings.maxKeyResultsPerObjective")}
                              onValueChange={(value) => form.setValue("objectiveSettings.maxKeyResultsPerObjective", value as "3" | "4" | "5" | "6")}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select maximum" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="3">3 key results</SelectItem>
                                <SelectItem value="4">4 key results</SelectItem>
                                <SelectItem value="5">5 key results</SelectItem>
                                <SelectItem value="6">6 key results</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">Recommended: 3-4 for clarity</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="requireObjectiveApproval"
                              checked={form.getValues("objectiveSettings.requireObjectiveApproval")}
                              onCheckedChange={(checked) => 
                                form.setValue("objectiveSettings.requireObjectiveApproval", checked as boolean)
                              }
                            />
                            <label 
                              htmlFor="requireObjectiveApproval"
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Require Approval for New Objectives
                            </label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="enableObjectiveAlignment"
                              checked={form.getValues("objectiveSettings.enableObjectiveAlignment")}
                              onCheckedChange={(checked) => 
                                form.setValue("objectiveSettings.enableObjectiveAlignment", checked as boolean)
                              }
                            />
                            <label 
                              htmlFor="enableObjectiveAlignment"
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Enable Parent-Child Objective Alignment
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Teams Configuration */}
              <TabsContent value="teams">
                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      <div className="border-b pb-4">
                        <h2 className="text-2xl font-semibold flex items-center text-gray-800">
                          <Users2 className="mr-3 h-6 w-6 text-primary" />
                          Team Configuration
                        </h2>
                        <p className="text-gray-600 mt-2">
                          Configure how teams will collaborate and organize their OKRs within your system.
                        </p>
                      </div>

                      <div className="bg-green-50 p-4 rounded-md border border-green-100 mb-6">
                        <h3 className="text-green-700 font-medium mb-2 flex items-center">
                          <Lightbulb className="mr-2 h-4 w-4" /> Team Collaboration Benefits
                        </h3>
                        <ul className="text-green-600 text-sm space-y-2">
                          <li className="flex items-start">
                            <Check className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                            <span>Cross-team OKRs help break down organizational silos</span>
                          </li>
                          <li className="flex items-start">
                            <Check className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                            <span>Public visibility encourages accountability and knowledge sharing</span>
                          </li>
                          <li className="flex items-start">
                            <Check className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                            <span>Choosing the right org structure ensures OKRs follow your existing workflows</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium mb-1">Organization Structure Type</label>
                          <Select
                            defaultValue={form.getValues("teamConfiguration.orgStructureType")}
                            onValueChange={(value) => form.setValue("teamConfiguration.orgStructureType", value as "functional" | "divisional" | "matrix" | "flat" | "hierarchical")}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select organization structure" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="functional">Functional (Marketing, Sales, Engineering)</SelectItem>
                              <SelectItem value="divisional">Divisional (Product Lines, Geographic)</SelectItem>
                              <SelectItem value="matrix">Matrix (Dual Reporting)</SelectItem>
                              <SelectItem value="flat">Flat (Few Hierarchical Layers)</SelectItem>
                              <SelectItem value="hierarchical">Hierarchical (Traditional)</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500 mt-1">How your organization is structured</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Default OKR Visibility</label>
                          <Select
                            defaultValue={form.getValues("teamConfiguration.defaultVisibility")}
                            onValueChange={(value) => form.setValue("teamConfiguration.defaultVisibility", value as "public" | "team" | "private")}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select default visibility" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="public">Public (Entire Organization)</SelectItem>
                              <SelectItem value="team">Team Only</SelectItem>
                              <SelectItem value="private">Private (Individual/Manager Only)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="enableCrossTeamObjectives"
                            checked={form.getValues("teamConfiguration.enableCrossTeamObjectives")}
                            onCheckedChange={(checked) => 
                              form.setValue("teamConfiguration.enableCrossTeamObjectives", checked as boolean)
                            }
                          />
                          <label 
                            htmlFor="enableCrossTeamObjectives"
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Enable Cross-Team Objectives
                          </label>
                        </div>
                        
                        {/* Team Selection Section */}
                        <div className="mt-6 border-t pt-6">
                          <h3 className="text-lg font-medium mb-4">Select Teams to Include in OKR System</h3>
                          <p className="text-sm text-gray-600 mb-4">
                            Select the teams that will be participating in your OKR program. Teams not selected can be added later.
                          </p>
                          
                          <TeamSelectionSection 
                            tenantId={tenantId}
                            value={form.getValues("teamConfiguration.selectedTeams")}
                            onChange={(selectedTeams) => {
                              form.setValue("teamConfiguration.selectedTeams", selectedTeams);
                            }}
                          />
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
                      <div className="border-b pb-4">
                        <h2 className="text-2xl font-semibold flex items-center text-gray-800">
                          <Layers className="mr-3 h-6 w-6 text-primary" />
                          Integrations & Notifications
                        </h2>
                        <p className="text-gray-600 mt-2">
                          Connect your OKR system with other tools and configure how users receive updates.
                        </p>
                      </div>

                      <div className="bg-purple-50 p-4 rounded-md border border-purple-100 mb-6">
                        <h3 className="text-purple-700 font-medium mb-2 flex items-center">
                          <Lightbulb className="mr-2 h-4 w-4" /> Integration Benefits
                        </h3>
                        <ul className="text-purple-600 text-sm space-y-2">
                          <li className="flex items-start">
                            <Check className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                            <span>Slack integration brings OKR updates directly to your communication channels</span>
                          </li>
                          <li className="flex items-start">
                            <Check className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                            <span>Email notifications ensure team members stay informed even when offline</span>
                          </li>
                          <li className="flex items-start">
                            <Check className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                            <span>Calendar syncing helps schedule check-ins and review meetings automatically</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-3">
                              <div className="bg-indigo-100 rounded-md p-2 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-indigo-600">
                                  <path d="M22 11.5c0-1-.1-1.9-.3-2.8A8.5 8.5 0 0 0 7.2 3.3L2 6.2l7 3.8L0 11.5h3c0 1 .1 1.9.3 2.8A8.5 8.5 0 0 0 16.8 19.7L22 16.8l-7-3.8L24 11.5z"></path>
                                </svg>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <h3 className="font-medium">Slack Integration</h3>
                                  <Checkbox
                                    id="enableSlackIntegration"
                                    checked={form.getValues("integrations.enableSlackIntegration")}
                                    onCheckedChange={(checked) => 
                                      form.setValue("integrations.enableSlackIntegration", checked as boolean)
                                    }
                                  />
                                </div>
                                <p className="text-xs text-gray-500">Post updates and notifications directly to Slack channels</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-3">
                              <div className="bg-blue-100 rounded-md p-2 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-blue-600">
                                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                  <polyline points="22,6 12,13 2,6"></polyline>
                                </svg>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <h3 className="font-medium">Email Notifications</h3>
                                  <Checkbox
                                    id="enableEmailNotifications"
                                    checked={form.getValues("integrations.enableEmailNotifications")}
                                    onCheckedChange={(checked) => 
                                      form.setValue("integrations.enableEmailNotifications", checked as boolean)
                                    }
                                  />
                                </div>
                                <p className="text-xs text-gray-500">Send timely email updates about OKR progress</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-3">
                              <div className="bg-green-100 rounded-md p-2 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-green-600">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                  <line x1="16" y1="2" x2="16" y2="6"></line>
                                  <line x1="8" y1="2" x2="8" y2="6"></line>
                                  <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <h3 className="font-medium">Calendar Sync</h3>
                                  <Checkbox
                                    id="enableCalendarSync"
                                    checked={form.getValues("integrations.enableCalendarSync")}
                                    onCheckedChange={(checked) => 
                                      form.setValue("integrations.enableCalendarSync", checked as boolean)
                                    }
                                  />
                                </div>
                                <p className="text-xs text-gray-500">Sync OKR check-ins and reviews with calendars</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-3">
                              <div className="bg-orange-100 rounded-md p-2 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-orange-600">
                                  <path d="M3 3v18h18"></path>
                                  <path d="m19 9-5 5-4-4-3 3"></path>
                                </svg>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <h3 className="font-medium">Analytics & Reporting</h3>
                                  <Checkbox
                                    id="enableAnalyticsReporting"
                                    checked={form.getValues("integrations.enableAnalyticsReporting")}
                                    onCheckedChange={(checked) => 
                                      form.setValue("integrations.enableAnalyticsReporting", checked as boolean)
                                    }
                                  />
                                </div>
                                <p className="text-xs text-gray-500">Generate detailed performance reports and insights</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Note:</span> You can modify these integration settings later in your organization settings.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Review */}
              <TabsContent value="review">
                <Card className="bg-gradient-to-r from-emerald-50 to-cyan-50 border-emerald-100 shadow-md">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-emerald-100 text-emerald-700 rounded-full p-3 mt-1">
                        <Zap className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-2xl mb-2 text-gray-800">Ready to Launch Your OKR System!</h3>
                        <p className="text-gray-600 mb-3">
                          You've completed setting up your OKR system. Review your configuration below and click the button to save your settings and start tracking your organizational goals.
                        </p>
                        <p className="text-sm text-gray-500">
                          You can always adjust these settings later from your organization's admin panel.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="mt-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                      <ClipboardCheck className="h-5 w-5 text-primary" />
                      Configuration Summary
                    </h3>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1">
                      All sections completed
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg border hover:border-primary/40 transition-colors p-5 shadow-sm">
                      <h4 className="font-medium text-primary mb-3 flex items-center">
                        <Settings2 className="w-4 h-4 mr-2" /> General Settings
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <span className="w-1/2 font-medium text-gray-700">Tracking Frequency:</span> 
                          <span className="bg-gray-50 px-2 py-1 rounded text-gray-800">{form.getValues("generalSettings.trackingFrequency")}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1/2 font-medium text-gray-700">Notifications:</span> 
                          <Badge variant={form.getValues("generalSettings.enableNotifications") ? "default" : "outline"} className={form.getValues("generalSettings.enableNotifications") ? "bg-green-100 text-green-800 hover:bg-green-100" : "text-gray-500"}>
                            {form.getValues("generalSettings.enableNotifications") ? "Enabled" : "Disabled"}
                          </Badge>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1/2 font-medium text-gray-700">Visibility Mode:</span> 
                          <span className="bg-gray-50 px-2 py-1 rounded text-gray-800">
                            {form.getValues("generalSettings.defaultVisibility")}
                          </span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="bg-white rounded-lg border hover:border-primary/40 transition-colors p-5 shadow-sm">
                      <h4 className="font-medium text-primary mb-3 flex items-center">
                        <Calendar className="w-4 h-4 mr-2" /> Timeframes
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <span className="w-1/2 font-medium text-gray-700">Primary Cadence:</span> 
                          <span className="bg-gray-50 px-2 py-1 rounded text-gray-800">{form.getValues("timeframes.primaryCadence")}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1/2 font-medium text-gray-700">Start Month:</span> 
                          <span className="bg-gray-50 px-2 py-1 rounded text-gray-800">{form.getValues("timeframes.startMonth")}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1/2 font-medium text-gray-700">Additional Cadences:</span> 
                          <div className="flex flex-wrap gap-1">
                            {form.getValues("timeframes.enableQuarterlyCadence") && (
                              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Quarterly</Badge>
                            )}
                            {form.getValues("timeframes.enableAnnualCadence") && (
                              <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100">Annual</Badge>
                            )}
                            {form.getValues("timeframes.customCadence") && (
                              <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">{form.getValues("timeframes.customCadence")}</Badge>
                            )}
                            {!form.getValues("timeframes.enableQuarterlyCadence") && 
                             !form.getValues("timeframes.enableAnnualCadence") && 
                             !form.getValues("timeframes.customCadence") && (
                              <span className="text-gray-500 italic">None</span>
                            )}
                          </div>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="bg-white rounded-lg border hover:border-primary/40 transition-colors p-5 shadow-sm">
                      <h4 className="font-medium text-primary mb-3 flex items-center">
                        <Target className="w-4 h-4 mr-2" /> Objective Settings
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <span className="w-1/2 font-medium text-gray-700">Max Objectives/Team:</span> 
                          <span className="bg-gray-50 px-2 py-1 rounded text-gray-800">{form.getValues("objectiveSettings.maxObjectivesPerTeam")}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1/2 font-medium text-gray-700">Max KRs/Objective:</span> 
                          <span className="bg-gray-50 px-2 py-1 rounded text-gray-800">{form.getValues("objectiveSettings.maxKeyResultsPerObjective")}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1/2 font-medium text-gray-700">Approval Required:</span> 
                          <Badge variant={form.getValues("objectiveSettings.requireObjectiveApproval") ? "default" : "outline"} className={form.getValues("objectiveSettings.requireObjectiveApproval") ? "bg-green-100 text-green-800 hover:bg-green-100" : "text-gray-500"}>
                            {form.getValues("objectiveSettings.requireObjectiveApproval") ? "Yes" : "No"}
                          </Badge>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1/2 font-medium text-gray-700">Default Category:</span> 
                          <span className="bg-gray-50 px-2 py-1 rounded text-gray-800">{form.getValues("objectiveSettings.defaultObjectiveCategory") || "None"}</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="bg-white rounded-lg border hover:border-primary/40 transition-colors p-5 shadow-sm">
                      <h4 className="font-medium text-primary mb-3 flex items-center">
                        <Users2 className="w-4 h-4 mr-2" /> Team Configuration
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <span className="w-1/2 font-medium text-gray-700">Organization Structure:</span> 
                          <span className="bg-gray-50 px-2 py-1 rounded text-gray-800 capitalize">{form.getValues("teamConfiguration.orgStructureType")}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1/2 font-medium text-gray-700">Default Visibility:</span> 
                          <span className="bg-gray-50 px-2 py-1 rounded text-gray-800 capitalize">{form.getValues("teamConfiguration.defaultVisibility")}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1/2 font-medium text-gray-700">Cross-Team Objectives:</span> 
                          <Badge variant={form.getValues("teamConfiguration.enableCrossTeamObjectives") ? "default" : "outline"} className={form.getValues("teamConfiguration.enableCrossTeamObjectives") ? "bg-green-100 text-green-800 hover:bg-green-100" : "text-gray-500"}>
                            {form.getValues("teamConfiguration.enableCrossTeamObjectives") ? "Enabled" : "Disabled"}
                          </Badge>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1/2 font-medium text-gray-700">Selected Teams:</span> 
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                            {form.getValues("teamConfiguration.selectedTeams")?.length || 0} teams
                          </Badge>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                      <ArrowRight className="mr-2 h-5 w-5 text-primary" />
                      Next Steps
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="bg-white p-5 rounded-lg border hover:border-primary/40 transition-colors shadow-sm">
                        <div className="bg-blue-50 text-blue-700 p-2 rounded-md w-12 h-12 flex items-center justify-center mb-3">
                          <Target className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">Create Your First Objective</h3>
                        <p className="text-sm text-gray-600 mb-3">Start defining your organization's key objectives for the current timeframe.</p>
                        <Button variant="outline" size="sm" className="mt-1 w-full">
                          <Target className="h-4 w-4 mr-2" /> Create Objective
                        </Button>
                      </div>
                      
                      <div className="bg-white p-5 rounded-lg border hover:border-primary/40 transition-colors shadow-sm">
                        <div className="bg-green-50 text-green-700 p-2 rounded-md w-12 h-12 flex items-center justify-center mb-3">
                          <Users2 className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">Invite Team Members</h3>
                        <p className="text-sm text-gray-600 mb-3">Add members to your teams so they can start collaborating on OKRs.</p>
                        <Button variant="outline" size="sm" className="mt-1 w-full">
                          <Users2 className="h-4 w-4 mr-2" /> Manage Teams
                        </Button>
                      </div>
                      
                      <div className="bg-white p-5 rounded-lg border hover:border-primary/40 transition-colors shadow-sm">
                        <div className="bg-purple-50 text-purple-700 p-2 rounded-md w-12 h-12 flex items-center justify-center mb-3">
                          <Layers className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">Set Up Integrations</h3>
                        <p className="text-sm text-gray-600 mb-3">Connect your OKR platform with other tools to streamline workflows.</p>
                        <Button variant="outline" size="sm" className="mt-1 w-full">
                          <Layers className="h-4 w-4 mr-2" /> Configure Integrations
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={goToPreviousStep}
                disabled={activeIndex === 0 || setupComplete}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              {activeIndex < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={goToNextStep}
                  disabled={!isCurrentStepValid() || setupComplete}
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
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