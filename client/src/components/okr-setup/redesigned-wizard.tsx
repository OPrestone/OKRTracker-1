import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowRight, ArrowLeft, CheckCircle2, Settings2, Target, Calendar, 
  Users2, Layers, Zap, Loader2, Check, User, Upload, FileText, 
  AlertCircle, UserPlus, ChevronDown, X, HelpCircle
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

// User interface for CSV upload
interface UserImport {
  email: string;
  name?: string;
  role: string;
  department?: string;
  team?: string;
  isValid?: boolean;
  error?: string;
}

// Step type definition
interface Step {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

// Define the form schema
const formSchema = z.object({
  generalSettings: z.object({
    companyMission: z.string().min(1, "Company mission is required"),
    companyVision: z.string().min(1, "Company vision is required"),
    companyValues: z.string().min(1, "Company values are required"),
    trackingFrequency: z.enum(["weekly", "biweekly", "monthly"]),
    enableNotifications: z.boolean(),
  }),
  timeframes: z.object({
    primaryCadence: z.enum(["quarterly", "trimester", "halfYearly", "annual"]),
    enableQuarterlyCadence: z.boolean(),
    enableAnnualCadence: z.boolean(),
    customCadence: z.string().optional(),
    startMonth: z.enum([
      "january", "february", "march", "april", "may", "june", 
      "july", "august", "september", "october", "november", "december"
    ]),
  }),
  objectiveSettings: z.object({
    defaultObjectiveCategory: z.enum(["growth", "product", "customer", "people", "financial", "operations", "other"]),
    maxObjectivesPerTeam: z.enum(["3", "4", "5", "6", "7", "8"]),
    maxKeyResultsPerObjective: z.enum(["3", "4", "5", "6"]),
    requireObjectiveApproval: z.boolean(),
    enableObjectiveAlignment: z.boolean(),
  }),
  teamConfiguration: z.object({
    orgStructureType: z.enum(["functional", "divisional", "matrix", "flat", "hierarchical"]),
    enableCrossTeamObjectives: z.boolean(),
    defaultVisibility: z.enum(["public", "team", "private"]),
    selectedTeams: z.array(z.string()),
    defaultTeams: z.array(z.string()),
    csvUsers: z.array(z.any()),
    useDefaultTeams: z.boolean(),
  }),
  integrations: z.object({
    enableSlackIntegration: z.boolean(),
    enableEmailNotifications: z.boolean(),
    enableCalendarSync: z.boolean(),
    enableAnalyticsReporting: z.boolean(),
  }),
});

type FormValues = z.infer<typeof formSchema>;

// Default team templates
const defaultTeamTemplates = [
  {
    id: "marketing",
    name: "Marketing Team",
    description: "Handles marketing campaigns, content, and brand strategy",
    color: "#4f46e5",
    icon: "📣",
  },
  {
    id: "sales",
    name: "Sales Team",
    description: "Manages customer relationships and sales processes",
    color: "#0ea5e9",
    icon: "💰",
  },
  {
    id: "engineering",
    name: "Engineering Team",
    description: "Develops and maintains software products",
    color: "#059669",
    icon: "💻",
  },
  {
    id: "product",
    name: "Product Team",
    description: "Oversees product strategy and roadmap",
    color: "#8b5cf6",
    icon: "🛠️",
  },
  {
    id: "customer_success",
    name: "Customer Success",
    description: "Ensures customer satisfaction and retention",
    color: "#f59e0b",
    icon: "👥",
  },
  {
    id: "finance",
    name: "Finance Team",
    description: "Manages financial planning and operations",
    color: "#10b981",
    icon: "📊",
  },
  {
    id: "hr",
    name: "Human Resources",
    description: "Handles employee onboarding, development, and culture",
    color: "#ec4899",
    icon: "👤",
  },
  {
    id: "operations",
    name: "Operations Team",
    description: "Manages day-to-day business operations",
    color: "#6366f1",
    icon: "⚙️",
  }
];

export default function RedesignedOKRSystemWizard() {
  const [navigate, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for the active step
  const [activePage, setActivePage] = useState("general");
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);

  // Define steps
  const steps: Step[] = [
    {
      id: "general",
      title: "General",
      description: "Define your company's mission, vision, values, and tracking preferences",
      icon: <Settings2 className="h-4 w-4" />
    },
    {
      id: "timeframes",
      title: "Timeframes",
      description: "Set up planning cycles and timeframes for your OKR system",
      icon: <Calendar className="h-4 w-4" />
    },
    {
      id: "objectives",
      title: "Objectives",
      description: "Configure how objectives will be created and managed",
      icon: <Target className="h-4 w-4" />
    },
    {
      id: "teams",
      title: "Teams",
      description: "Set up your organizational structure and team settings",
      icon: <Users2 className="h-4 w-4" />
    },
    {
      id: "integrations",
      title: "Integrations",
      description: "Connect with other tools and set up notifications",
      icon: <Layers className="h-4 w-4" />
    }
  ];

  // Initialize the form
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
        defaultTeams: [] as string[],
        csvUsers: [] as any[],
        useDefaultTeams: true, // Default to true for better UX
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
            defaultTeams: [],
            csvUsers: [],
            useDefaultTeams: true,
          },
          integrations: {
            enableSlackIntegration: false,
            enableEmailNotifications: true,
            enableCalendarSync: false,
            enableAnalyticsReporting: true,
          },
        };
        
        // Fetch mission data
        const missionResponse = await fetch(`/api/organization-mission?tenantId=${currentTenantId}`, {
          credentials: 'include'
        });
        
        if (missionResponse.ok) {
          const missionData = await missionResponse.json();
          console.log("Mission data:", missionData);
          
          // Update form values with mission data
          if (missionData.mission) {
            formValues.generalSettings.companyMission = missionData.mission;
          }
          
          if (missionData.vision) {
            formValues.generalSettings.companyVision = missionData.vision;
          }
          
          if (missionData.behaviors) {
            formValues.generalSettings.companyValues = missionData.behaviors;
          }
        }
        
        // Then try to fetch existing OKR system configuration
        console.log("Fetching OKR system config for tenant:", currentTenantId);
        
        const configResponse = await fetch(`/api/okr-system?tenantId=${currentTenantId}`, {
          credentials: 'include'
        });
        
        if (configResponse.ok) {
          const systemConfig = await configResponse.json();
          console.log("Existing OKR system config:", systemConfig);
          
          // Update form values with system config data
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
          
          formValues.integrations.enableSlackIntegration = systemConfig.enable_slack_integration || false;
          formValues.integrations.enableEmailNotifications = systemConfig.enable_email_notifications !== false;
          formValues.integrations.enableCalendarSync = systemConfig.enable_calendar_sync || false;
          formValues.integrations.enableAnalyticsReporting = systemConfig.enable_analytics_reporting !== false;
        }
        
        // Reset the form with the loaded values
        form.reset(formValues);
        
      } catch (error) {
        console.error("Error loading configuration:", error);
        toast({
          title: "Error Loading Configuration",
          description: "An error occurred while loading your configuration. Some fields may not be pre-filled.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExistingConfig();
  }, []);

  // Save OKR system configuration mutation
  const saveOKRSystemMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      console.log("Saving OKR system setup:", data);
      
      if (!tenantId) {
        throw new Error("No tenant ID available. Please refresh the page and try again.");
      }
      
      // Make API request to save OKR system setup
      console.log("Using tenant ID for save:", tenantId);
      
      // Get selected default teams 
      const selectedDefaultTeamIds = data.teamConfiguration.defaultTeams || [];
      
      // Create a new object with tenant_id property
      const formDataWithTenant = {
        ...data,
        tenant_id: tenantId, // Add tenant ID to the request body
        
        // Process default teams if enabled
        default_teams: data.teamConfiguration.useDefaultTeams ? 
          defaultTeamTemplates
            .filter(template => selectedDefaultTeamIds.includes(template.id))
            .map(template => ({
              name: template.name,
              description: template.description,
              color: template.color,
              icon: template.icon,
              tenant_id: tenantId
            })) 
          : [],
          
        // Include CSV users
        csv_users: Array.isArray(data.teamConfiguration.csvUsers) ? 
          data.teamConfiguration.csvUsers
            .filter(user => user && user.email)
            .map(user => ({
              email: user.email,
              name: user.name || '',
              role: user.role || 'member',
              department: user.department || '',
              team: user.team || '',
              tenant_id: tenantId
            }))
          : []
      };
      
      // Log the full data being sent
      console.log("Sending data with tenant:", formDataWithTenant);
      
      console.log("Sending OKR system config with tenant ID:", tenantId);
      
      // Use the simplified endpoint with more flexible validation
      const response = await fetch(`/api/okr-system-setup-simple?tenantId=${tenantId}`, {
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
          description: "Your OKR system is ready to use. You will now be redirected to create your first company objective.",
        });
        
        // Navigate to the create company objective page
        setTimeout(() => {
          navigate("/create-company-objective");
        }, 800);
      }, 1500);
    },
    onError: (error: any) => {
      console.error("Error in OKR system setup submission:", error);
      setIsSubmitting(false);
      
      // Show more detailed error information
      toast({
        title: "Error Saving OKR System",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      
      // Log the current form values for debugging
      console.log("Current form values:", form.getValues());
    }
  });

  // Submit handler
  const onSubmitForm = (data: FormValues) => {
    console.log("Form submitted with data:", data);
    setIsSubmitting(true);
    
    // Make sure teamConfiguration has all required properties to prevent submission errors
    const validatedData = {
      ...data,
      teamConfiguration: {
        ...data.teamConfiguration,
        defaultTeams: data.teamConfiguration.defaultTeams || [],
        csvUsers: data.teamConfiguration.csvUsers || [],
        // Make sure useDefaultTeams is present and properly set
        useDefaultTeams: typeof data.teamConfiguration.useDefaultTeams === 'boolean' 
          ? data.teamConfiguration.useDefaultTeams 
          : true // Default to true if not present
      }
    };
    
    console.log("Validated form data:", validatedData);
    saveOKRSystemMutation.mutate(validatedData);
  };

  // Function to check if current step is valid
  const isCurrentStepValid = () => {
    const currentStep = steps.find(s => s.id === activePage);
    
    if (currentStep?.id === "general") {
      const { generalSettings } = form.getValues();
      return !!generalSettings.companyMission && 
             !!generalSettings.companyVision && 
             !!generalSettings.companyValues;
    }
    
    if (currentStep?.id === "timeframes") {
      return true; // Timeframes always have defaults
    }
    
    return true; // For other steps, we always allow progression
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

  // If loading, show loading indicator
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Loading Your OKR System</h3>
          <p className="text-sm text-gray-500">Please wait while we prepare your setup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          OKR System Setup
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Configure your OKR system to drive exceptional results and transform how your organization tracks performance.
        </p>
      </div>

      {/* Progress Tracker */}
      <div className="mb-10">
        {/* Desktop Progress indicator */}
        <div className="hidden sm:block mb-8">
          <div className="flex justify-between items-center mb-4 relative">
            {/* Background line */}
            <div className="absolute left-0 right-0 h-1 bg-gray-200 top-1/2 -translate-y-1/2 z-0"></div>
            
            {/* Step indicators */}
            {steps.map((step, index) => {
              const isActive = activePage === step.id;
              const isCompleted = index < steps.findIndex(s => s.id === activePage);
              
              return (
                <div 
                  key={step.id} 
                  className={`flex flex-col items-center z-10 transition-all duration-300 ${
                    isActive ? 'scale-110' : ''
                  }`}
                  style={{ width: `${100 / steps.length}%` }}
                >
                  <button
                    onClick={() => goToStep(step.id)}
                    disabled={isSubmitting}
                    className={`w-14 h-14 rounded-full flex items-center justify-center border-2 mb-3 transition-all duration-300
                      ${isActive 
                        ? 'border-primary bg-primary text-white shadow-md shadow-primary/20' 
                        : isCompleted
                          ? 'border-primary/70 bg-primary/10 text-primary'
                          : 'border-gray-200 bg-white text-gray-400'
                      }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <div className="flex flex-col items-center">
                        <span className="text-lg font-semibold">{index + 1}</span>
                        <span className="text-[0.6rem] -mt-1.5">{isActive ? 'ACTIVE' : ''}</span>
                      </div>
                    )}
                  </button>
                  <span 
                    className={`text-sm font-medium transition-all duration-300 ${
                      isActive ? 'text-primary' : isCompleted ? 'text-primary/70' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </span>
                  <div className="flex items-center mt-1.5">
                    {step.icon && (
                      <span className={`mr-1.5 ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                        {step.icon}
                      </span>
                    )}
                    <span className={`text-xs ${isActive ? 'text-gray-600' : 'text-gray-400'}`}>
                      {index + 1} of {steps.length}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Progress bar */}
          <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-4">
            <div 
              className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ 
                width: `${((steps.findIndex(s => s.id === activePage)) / (steps.length - 1)) * 100}%`
              }}
            />
          </div>
        </div>

        {/* Mobile progress indicator */}
        <div className="sm:hidden mb-8">
          <div className="flex justify-between items-center mb-3 relative">
            {/* Background line */}
            <div className="absolute left-0 right-0 h-0.5 bg-gray-200 top-1/2 -translate-y-1/2"></div>
            
            {/* Step dots */}
            {steps.map((step, index) => {
              const isActive = activePage === step.id;
              const isCompleted = index < steps.findIndex(s => s.id === activePage);
              
              return (
                <div key={step.id} className="flex-1 flex justify-center z-10">
                  <button
                    onClick={() => goToStep(step.id)}
                    disabled={isSubmitting}
                    className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all
                      ${isActive 
                        ? 'border-primary bg-primary text-white shadow-sm shadow-primary/20' 
                        : isCompleted
                          ? 'border-primary/70 bg-primary/10 text-primary'
                          : 'border-gray-200 bg-white text-gray-400'
                      }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-medium">{index + 1}</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
          
          {/* Current step label */}
          <div className="text-center">
            <span className="inline-block px-4 py-1.5 bg-primary/5 rounded-full text-sm font-medium text-primary">
              Step {steps.findIndex(s => s.id === activePage) + 1}: {steps.find(step => step.id === activePage)?.title}
            </span>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: General Settings */}
          {activePage === "general" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right duration-300">
              <Card className="border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4 border-b border-primary/10">
                  <h3 className="text-xl font-semibold flex items-center text-primary">
                    <Settings2 className="mr-3 h-5 w-5" />
                    Define Company Mission, Vision, and Values
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Set the foundation for your OKR system by defining your organization's purpose and direction.
                  </p>
                </div>
                <CardContent className="pt-6 bg-white">
                  <div className="space-y-6">
                    <div className="grid gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">Company Mission</label>
                        <div className="relative">
                          <Textarea
                            placeholder="What is your company's mission? E.g., 'To accelerate the world's transition to sustainable energy'"
                            className="min-h-[100px] pr-8 bg-white border-gray-300 focus:border-primary focus:ring focus:ring-primary/20"
                            value={form.getValues("generalSettings.companyMission")}
                            onChange={(e) => form.setValue("generalSettings.companyMission", e.target.value)}
                          />
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="absolute right-2 top-2 text-gray-400 hover:text-primary">
                                  <HelpCircle className="h-4 w-4" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="w-[220px] text-xs">
                                  Your mission statement explains why your company exists and its core purpose.
                                  Keep it concise and inspiring.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">Company Vision</label>
                        <div className="relative">
                          <Textarea
                            placeholder="What is your company's vision? E.g., 'To create the most compelling car company of the 21st century'"
                            className="min-h-[100px] pr-8 bg-white border-gray-300 focus:border-primary focus:ring focus:ring-primary/20"
                            value={form.getValues("generalSettings.companyVision")}
                            onChange={(e) => form.setValue("generalSettings.companyVision", e.target.value)}
                          />
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="absolute right-2 top-2 text-gray-400 hover:text-primary">
                                  <HelpCircle className="h-4 w-4" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="w-[220px] text-xs">
                                  Your vision statement describes the future you want to create.
                                  Make it ambitious but achievable.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">Company Values</label>
                        <div className="relative">
                          <Textarea
                            placeholder="What values drive your company culture? E.g., 'Innovation, Sustainability, Excellence'"
                            className="min-h-[100px] pr-8 bg-white border-gray-300 focus:border-primary focus:ring focus:ring-primary/20"
                            value={form.getValues("generalSettings.companyValues")}
                            onChange={(e) => form.setValue("generalSettings.companyValues", e.target.value)}
                          />
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="absolute right-2 top-2 text-gray-400 hover:text-primary">
                                  <HelpCircle className="h-4 w-4" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="w-[220px] text-xs">
                                  Your company values guide behavior and decision-making.
                                  List core principles that define your culture.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4 border-b border-primary/10">
                  <h3 className="text-xl font-semibold flex items-center text-primary">
                    <Zap className="mr-3 h-5 w-5" />
                    OKR Tracking Preferences
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Configure how often OKRs will be tracked and reviewed in your organization.
                  </p>
                </div>
                <CardContent className="pt-6 bg-white">
                  <div className="space-y-6">
                    <div className="grid gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">OKR Check-in Frequency</label>
                        <div className="relative">
                          <Select 
                            defaultValue={form.getValues("generalSettings.trackingFrequency")}
                            onValueChange={(value) => form.setValue("generalSettings.trackingFrequency", value as "weekly" | "biweekly" | "monthly")}
                          >
                            <SelectTrigger className="bg-white border-gray-300 focus:border-primary focus:ring focus:ring-primary/20">
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500 mt-2">
                            <span className="font-semibold">Recommended:</span> Weekly check-ins drive better engagement and accountability.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 pt-2">
                        <Checkbox 
                          id="enableNotifications"
                          checked={form.getValues("generalSettings.enableNotifications")}
                          onCheckedChange={(checked) => 
                            form.setValue("generalSettings.enableNotifications", checked as boolean)
                          }
                          className="h-5 w-5 border-gray-300 rounded data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <div>
                          <label 
                            htmlFor="enableNotifications"
                            className="text-sm font-medium"
                          >
                            Enable Check-in Reminders and Notifications
                          </label>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Send automated reminders to team members when check-ins are due
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  disabled={true}
                  className="border-gray-300 text-gray-400"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                
                <div className="space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={saveMissionData}
                    disabled={isSubmitting}
                    className="border-primary/80 text-primary hover:bg-primary/5"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Save Progress
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    type="button" 
                    onClick={goToNextStep}
                    disabled={!isCurrentStepValid() || isSubmitting}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    Next Step
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons for Step 5 */}
          {activePage === "integrations" && (
            <div className="flex justify-between">
              <Button 
                type="button" 
                onClick={goToPreviousStep} 
                variant="outline"
                disabled={isSubmitting}
                className="border-gray-300"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Complete Setup
                  </>
                )}
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}