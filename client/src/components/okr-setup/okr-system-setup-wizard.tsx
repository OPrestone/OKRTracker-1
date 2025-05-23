import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, ArrowLeft, CheckCircle2, Settings2, Target, Calendar, Users2, Layers, Zap, Loader2 } from "lucide-react";

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
        const currentTenantId = userData.defaultTenant || (userData.tenants && userData.tenants.length > 0 ? userData.tenants[0].id : null);
        
        if (!currentTenantId) {
          console.error("No tenant ID available");
          setIsLoading(false);
          return;
        }
        
        // Set tenant ID for later use in the submit function
        setTenantId(currentTenantId);
        
        const response = await fetch(`/api/okr-system?tenantId=${currentTenantId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        
        if (response.ok) {
          const config = await response.json();
          console.log("Loaded existing OKR system config:", config);
          
          // Map the database config to form values
          if (config.data) {
            try {
              const data = JSON.parse(config.data);
              
              // Update form with existing values
              form.reset({
                generalSettings: {
                  companyMission: data.generalSettings?.companyMission || "",
                  companyVision: data.generalSettings?.companyVision || "",
                  companyValues: data.generalSettings?.companyValues || "",
                  trackingFrequency: data.generalSettings?.trackingFrequency || "weekly",
                  enableNotifications: data.generalSettings?.enableNotifications !== false,
                },
                timeframes: {
                  primaryCadence: data.timeframes?.primaryCadence || "quarterly",
                  enableQuarterlyCadence: data.timeframes?.enableQuarterlyCadence !== false,
                  enableAnnualCadence: data.timeframes?.enableAnnualCadence !== false,
                  customCadence: data.timeframes?.customCadence || "",
                  startMonth: data.timeframes?.startMonth || "january",
                },
                objectiveSettings: {
                  defaultObjectiveCategory: data.objectiveSettings?.defaultObjectiveCategory || "growth",
                  maxObjectivesPerTeam: data.objectiveSettings?.maxObjectivesPerTeam || "5",
                  maxKeyResultsPerObjective: data.objectiveSettings?.maxKeyResultsPerObjective || "3",
                  requireObjectiveApproval: data.objectiveSettings?.requireObjectiveApproval !== false,
                  enableObjectiveAlignment: data.objectiveSettings?.enableObjectiveAlignment !== false,
                },
                teamConfiguration: {
                  orgStructureType: data.teamConfiguration?.orgStructureType || "functional",
                  enableCrossTeamObjectives: data.teamConfiguration?.enableCrossTeamObjectives !== false,
                  defaultVisibility: data.teamConfiguration?.defaultVisibility || "public",
                },
                integrations: {
                  enableSlackIntegration: data.integrations?.enableSlackIntegration === true,
                  enableEmailNotifications: data.integrations?.enableEmailNotifications !== false,
                  enableCalendarSync: data.integrations?.enableCalendarSync === true,
                  enableAnalyticsReporting: data.integrations?.enableAnalyticsReporting !== false,
                },
              });
              
              toast({
                title: "Configuration Loaded",
                description: "Your existing OKR system configuration has been loaded.",
              });
            } catch (parseError) {
              console.error("Error parsing configuration data:", parseError);
            }
          }
        } else if (response.status !== 404) {
          // 404 is expected for new tenants, only show error for other statuses
          console.warn(`Failed to load OKR system config: ${response.status}`);
        }
      } catch (error) {
        console.error("Error fetching OKR system config:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExistingConfig();
  }, []);

  // State to store the tenant ID
  const [tenantId, setTenantId] = useState<string | null>(null);
  
  // Create mutation for saving OKR system setup
  const saveOKRSystemMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      console.log("Saving OKR system setup:", data);
      
      if (!tenantId) {
        throw new Error("No tenant ID available. Please refresh the page and try again.");
      }
      
      // Make API request to save OKR system setup
      const response = await fetch(`/api/okr-system-setup?tenantId=${tenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-center mb-2 text-primary">OKR System Setup</h1>
        <p className="text-center text-gray-600 max-w-2xl mx-auto">
          Follow this guided workflow to set up your complete OKR system. 
          You'll configure timeframes, objective settings, and team structure.
        </p>
        {isLoading && (
          <div className="flex justify-center mt-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-md">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading existing configuration...</span>
            </div>
          </div>
        )}
      </div>

      <div className="mb-8">
        {/* Progress indicator */}
        <div className="hidden sm:flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div 
              key={step.id} 
              className="flex flex-col items-center"
            >
              <button
                onClick={() => goToStep(step.id)}
                disabled={setupComplete}
                className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 
                  ${activeIndex === index 
                    ? 'border-primary bg-primary text-white' 
                    : index < activeIndex 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-gray-300 bg-white text-gray-400'}`}
              >
                <step.icon className="w-5 h-5" />
              </button>
              <span className={`mt-2 text-xs font-medium ${activeIndex === index ? 'text-primary' : 'text-gray-500'}`}>
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div className={`absolute left-0 right-0 top-5 h-0.5 -z-10 
                  ${index < activeIndex ? 'bg-primary' : 'bg-gray-200'}`}
                  style={{ left: "calc(50% + 1rem)", right: "calc(-50% + 1rem)" }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Mobile steps */}
        <div className="flex overflow-x-auto sm:hidden pb-4 mb-4">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => goToStep(step.id)}
              disabled={setupComplete}
              className={`flex items-center min-w-max px-4 py-2 mx-1 rounded-full text-sm font-medium whitespace-nowrap
                ${activeIndex === index 
                  ? 'bg-primary text-white' 
                  : index < activeIndex 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-gray-100 text-gray-700'}`}
            >
              <step.icon className="w-4 h-4 mr-1.5" />
              {step.label}
            </button>
          ))}
        </div>

        {/* Main form */}
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs value={activePage} className="w-full">
              {/* General Settings */}
              <TabsContent value="general">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold flex items-center">
                        <Settings2 className="mr-2 h-5 w-5 text-primary" />
                        General Settings
                      </h2>
                      <p className="text-gray-600 mb-4">
                        Define your organization's mission, vision, and values to align your OKRs with your strategic goals.
                      </p>
                      
                      <div className="space-y-4">
                        <div className="grid gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Company Mission</label>
                            <Textarea
                              placeholder="Our company's mission is to..."
                              {...form.register("generalSettings.companyMission")}
                              className="resize-none h-20"
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
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Objective Settings */}
              <TabsContent value="objectives">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold flex items-center">
                        <Target className="mr-2 h-5 w-5 text-primary" />
                        Objective Settings
                      </h2>
                      <p className="text-gray-600 mb-4">
                        Configure how objectives and key results will be structured in your organization.
                      </p>
                      
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
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold flex items-center">
                        <Users2 className="mr-2 h-5 w-5 text-primary" />
                        Team Configuration
                      </h2>
                      <p className="text-gray-600 mb-4">
                        Configure how teams will collaborate and organize their OKRs within your system.
                      </p>
                      
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
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Integrations */}
              <TabsContent value="integrations">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold flex items-center">
                        <Layers className="mr-2 h-5 w-5 text-primary" />
                        Integrations & Notifications
                      </h2>
                      <p className="text-gray-600 mb-4">
                        Configure how your OKR system connects with other tools and how users receive updates.
                      </p>
                      
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="enableSlackIntegration"
                            checked={form.getValues("integrations.enableSlackIntegration")}
                            onCheckedChange={(checked) => 
                              form.setValue("integrations.enableSlackIntegration", checked as boolean)
                            }
                          />
                          <label 
                            htmlFor="enableSlackIntegration"
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Enable Slack Integration
                          </label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="enableEmailNotifications"
                            checked={form.getValues("integrations.enableEmailNotifications")}
                            onCheckedChange={(checked) => 
                              form.setValue("integrations.enableEmailNotifications", checked as boolean)
                            }
                          />
                          <label 
                            htmlFor="enableEmailNotifications"
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Enable Email Notifications
                          </label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="enableCalendarSync"
                            checked={form.getValues("integrations.enableCalendarSync")}
                            onCheckedChange={(checked) => 
                              form.setValue("integrations.enableCalendarSync", checked as boolean)
                            }
                          />
                          <label 
                            htmlFor="enableCalendarSync"
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Enable Calendar Sync (Check-ins & Reviews)
                          </label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="enableAnalyticsReporting"
                            checked={form.getValues("integrations.enableAnalyticsReporting")}
                            onCheckedChange={(checked) => 
                              form.setValue("integrations.enableAnalyticsReporting", checked as boolean)
                            }
                          />
                          <label 
                            htmlFor="enableAnalyticsReporting"
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Enable Analytics & Reporting Dashboard
                          </label>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Review */}
              <TabsContent value="review">
                <Card className="bg-gradient-to-r from-emerald-50 to-cyan-50 border-emerald-100">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-emerald-100 text-emerald-700 rounded-full p-3 mt-1">
                        <Zap className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-xl mb-2 text-gray-800">Ready to Launch Your OKR System!</h3>
                        <p className="text-gray-600 mb-3">
                          You've completed setting up your OKR system. Click the button below to save your configuration and start tracking your organizational goals.
                        </p>
                        <p className="text-sm text-gray-500">
                          You can always adjust these settings later from your organization's admin panel.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="mt-6 space-y-4">
                  <h3 className="font-medium text-lg">Configuration Summary</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg border p-4">
                      <h4 className="font-medium text-primary mb-2 flex items-center">
                        <Settings2 className="w-4 h-4 mr-1" /> General Settings
                      </h4>
                      <ul className="space-y-1 text-sm">
                        <li><span className="font-medium">Tracking Frequency:</span> {form.getValues("generalSettings.trackingFrequency")}</li>
                        <li><span className="font-medium">Notifications:</span> {form.getValues("generalSettings.enableNotifications") ? "Enabled" : "Disabled"}</li>
                      </ul>
                    </div>
                    
                    <div className="bg-white rounded-lg border p-4">
                      <h4 className="font-medium text-primary mb-2 flex items-center">
                        <Calendar className="w-4 h-4 mr-1" /> Timeframes
                      </h4>
                      <ul className="space-y-1 text-sm">
                        <li><span className="font-medium">Primary Cadence:</span> {form.getValues("timeframes.primaryCadence")}</li>
                        <li><span className="font-medium">Start Month:</span> {form.getValues("timeframes.startMonth")}</li>
                        <li><span className="font-medium">Additional Cadences:</span> {[
                          form.getValues("timeframes.enableQuarterlyCadence") ? "Quarterly" : "",
                          form.getValues("timeframes.enableAnnualCadence") ? "Annual" : "",
                          form.getValues("timeframes.customCadence") || ""
                        ].filter(Boolean).join(", ") || "None"}</li>
                      </ul>
                    </div>
                    
                    <div className="bg-white rounded-lg border p-4">
                      <h4 className="font-medium text-primary mb-2 flex items-center">
                        <Target className="w-4 h-4 mr-1" /> Objective Settings
                      </h4>
                      <ul className="space-y-1 text-sm">
                        <li><span className="font-medium">Max Objectives/Team:</span> {form.getValues("objectiveSettings.maxObjectivesPerTeam")}</li>
                        <li><span className="font-medium">Max KRs/Objective:</span> {form.getValues("objectiveSettings.maxKeyResultsPerObjective")}</li>
                        <li><span className="font-medium">Approval Required:</span> {form.getValues("objectiveSettings.requireObjectiveApproval") ? "Yes" : "No"}</li>
                        <li><span className="font-medium">Default Category:</span> {form.getValues("objectiveSettings.defaultObjectiveCategory")}</li>
                      </ul>
                    </div>
                    
                    <div className="bg-white rounded-lg border p-4">
                      <h4 className="font-medium text-primary mb-2 flex items-center">
                        <Users2 className="w-4 h-4 mr-1" /> Team Configuration
                      </h4>
                      <ul className="space-y-1 text-sm">
                        <li><span className="font-medium">Org Structure:</span> {form.getValues("teamConfiguration.orgStructureType")}</li>
                        <li><span className="font-medium">Default Visibility:</span> {form.getValues("teamConfiguration.defaultVisibility")}</li>
                        <li><span className="font-medium">Cross-Team Objectives:</span> {form.getValues("teamConfiguration.enableCrossTeamObjectives") ? "Enabled" : "Disabled"}</li>
                      </ul>
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
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving Configuration...
                    </>
                  ) : (
                    <>
                      Save Configuration
                      <Zap className="ml-2 h-4 w-4" />
                    </>
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