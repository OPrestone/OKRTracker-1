import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle, 
  CreditCard,
  FileUp,
  Loader2,
  Mail,
  Plus,
  UserPlus,
  Users,
  X,
  Rocket,
  BarChart3,
  Target,
  Landmark,
  Award,
  Zap,
  Sparkles,
} from "lucide-react";

import { CSVImport } from "@/components/csv/csv-import";
import { cn } from "@/lib/utils";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// OKR templates - must match backend template ids
const okrTemplates = [
  {
    id: "startup",
    name: "Startup Growth",
    description: "Focus on product-market fit and team building",
  },
  {
    id: "sales",
    name: "Sales & Revenue",
    description: "Focus on market expansion and revenue growth",
  },
  {
    id: "product",
    name: "Product Development",
    description: "Accelerate product development and innovation",
  },
];

// Subscription plans with detailed features
const priceTiers = [
  {
    id: "free",
    name: "Free",
    description: "Basic features for small teams",
    price: 0,
    popular: false,
    features: [
      "Up to 10 users",
      "3 teams maximum",
      "Basic OKR tracking",
      "Default OKR templates",
      "Weekly check-ins",
      "Email support (48hr response)",
      "7-day history retention",
      "Public dashboard sharing",
      "Basic progress reporting",
      "1 Admin user"
    ],
    maxUsers: 10,
    recommended: false,
    buttonText: "Start Free Plan"
  },
  {
    id: "starter",
    name: "Starter",
    description: "Great for small teams getting started",
    price: 9.99,
    popular: true,
    features: [
      "Up to 25 users",
      "10 teams maximum",
      "Comprehensive OKR tracking",
      "Custom OKR templates",
      "Daily & weekly check-ins",
      "Priority email support (24hr response)",
      "30-day history retention",
      "Custom dashboard layouts",
      "Team analytics dashboard",
      "Up to 3 Admin users",
      "Progress tracking notifications",
      "Engagement metrics"
    ],
    maxUsers: 25,
    recommended: true,
    buttonText: "Select Starter Plan"
  },
  {
    id: "professional",
    name: "Professional",
    description: "Enhanced features for growing teams",
    price: 29.99,
    popular: false,
    features: [
      "Up to 100 users",
      "Unlimited teams",
      "Advanced OKR tracking & alignment",
      "Custom templates library",
      "Scheduled & ad-hoc check-ins",
      "Priority support with dedicated account manager",
      "90-day history retention",
      "Advanced reporting & export",
      "Department analytics",
      "Unlimited Admin users",
      "API access",
      "Custom integrations",
      "SSO authentication"
    ],
    maxUsers: 100,
    recommended: false,
    buttonText: "Select Professional Plan"
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Full solution for large organizations",
    price: 99.99,
    popular: false,
    features: [
      "Unlimited users",
      "Unlimited teams",
      "Enterprise-grade security",
      "Advanced permissions & roles",
      "Custom OKR methodologies",
      "Advanced alignment tools",
      "Custom check-in schedules",
      "24/7 priority support",
      "Unlimited history retention",
      "Executive dashboard",
      "Advanced analytics & insights",
      "Custom training & onboarding",
      "Dedicated success manager",
      "On-premise deployment option",
      "Custom contract terms"
    ],
    maxUsers: Infinity,
    recommended: false,
    buttonText: "Contact Sales"
  },
];

// Form validation schema using Zod
const formSchema = z.object({
  setup: z.object({
    createInitialOKRs: z.boolean().default(false),
    template: z.string().optional(),
    importedOKRs: z.array(z.record(z.string(), z.any())).optional(),
  }).refine(data => {
    // If createInitialOKRs is true, either a template or importedOKRs must be provided
    if (data.createInitialOKRs) {
      return !!data.template || (data.importedOKRs && data.importedOKRs.length > 0);
    }
    return true;
  }, {
    message: "Please select a template or import OKRs when 'Create initial OKRs' is checked",
    path: ["template"]
  }),
  plan: z.object({
    plan: z.enum(["free", "starter", "professional", "enterprise"]),
    agreeToTerms: z.boolean(),
  }),
  orgDetails: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    displayName: z.string().min(2, "Display name must be at least 2 characters"),
    description: z.string().optional(),
    industry: z.string().optional(),
  }),
  team: z.object({
    users: z.array(z.object({
      email: z.string().email(),
      role: z.enum(["admin", "member", "viewer"]),
      selected: z.boolean(),
      name: z.string().optional(),
      department: z.string().optional(),
    })).optional(),
  }),
});

export default function TenantOnboardingWizard() {
  const [activePage, setActivePage] = useState<string>("organization");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tenantCreated, setTenantCreated] = useState(false);
  const [animateProgress, setAnimateProgress] = useState(0);
  
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  // Steps configuration
  const steps = [
    { id: "organization", label: "Organization", icon: Building2 },
    { id: "plan", label: "Subscription", icon: CreditCard },
    { id: "team", label: "Team", icon: Users },
    { id: "setup", label: "Initial Setup", icon: Rocket }
  ];
  
  // Find active step index
  const activeIndex = steps.findIndex(step => step.id === activePage);
  
  // Calculate progress percentage
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateProgress(((activeIndex + 1) / steps.length) * 100);
    }, 100);
    return () => clearTimeout(timer);
  }, [activeIndex]);
  
  // Form setup with default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orgDetails: {
        name: "",
        displayName: "",
        description: "",
        industry: "technology",
      },
      plan: {
        plan: "free",
        agreeToTerms: false,
      },
      team: {
        users: [],
      },
      setup: {
        createInitialOKRs: false,
        template: "",
        importedOKRs: [],
      },
    },
  });
  
  // Watch for values changes for conditional rendering
  const createInitialOKRs = form.watch("setup.createInitialOKRs");
  const selectedTemplate = form.watch("setup.template");
  const teamMembers = form.watch("team.users") || [];
  const selectedPlan = form.watch("plan.plan");
  const agreeToTerms = form.watch("plan.agreeToTerms");
  
  // Mutation for creating a new tenant
  const createTenantMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      setIsSubmitting(true);
      
      try {
        // Extract users that were selected
        const selectedUsers = values.team.users?.filter(user => user.selected) || [];
        
        const requestData = {
          name: values.orgDetails.name,
          displayName: values.orgDetails.displayName,
          description: values.orgDetails.description,
          industry: values.orgDetails.industry,
          planType: values.plan.plan,
          users: selectedUsers,
          setup: values.setup,
        };
        
        // Make the API request with role explicitly set to "owner"
        const requestDataWithRole = {
          ...requestData,
          role: "owner" // Set creator's role to owner (highest privilege level)
        };
        
        const response = await apiRequest('POST', '/api/tenants', requestDataWithRole);
        const orgData = await response.json();
        
        return orgData;
      } finally {
        setIsSubmitting(false);
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Organization created!",
        description: "Your new organization has been set up successfully.",
      });
      
      // Invalidate tenants query to refresh list
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      
      setTenantCreated(true);
      
      // Navigate to the new tenant's dashboard
      setTimeout(() => {
        navigate("/");
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Error creating organization",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  });
  
  const handleSubmit = form.handleSubmit((data) => {
    createTenantMutation.mutate(data);
  });
  
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
  
  const addTeamMember = () => {
    const currentUsers = form.getValues("team.users") || [];
    
    form.setValue("team.users", [
      ...currentUsers,
      {
        email: "",
        role: "member",
        selected: true,
        name: "",
        department: "",
      }
    ]);
  };
  
  // Check if current step is valid
  const isCurrentStepValid = () => {
    switch (activePage) {
      case "organization":
        const org = form.getValues().orgDetails;
        return org.name && org.name.length >= 2 && org.displayName && org.displayName.length >= 2;
      case "plan":
        return form.getValues().plan.agreeToTerms;
      case "team":
        // Team members are optional
        return true;
      case "setup":
        // If createInitialOKRs is checked, a template or imported OKRs is required
        const setup = form.getValues().setup;
        if (setup.createInitialOKRs) {
          return !!setup.template || (setup.importedOKRs && setup.importedOKRs.length > 0);
        }
        return true;
    }
    return false;
  };
  
  if (tenantCreated) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-tr from-indigo-50 via-white to-cyan-50">
        <div className="max-w-md mx-auto text-center py-16 px-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-8 animate-bounce">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-4 text-gray-900">Organization Created Successfully!</h1>
          <p className="text-gray-600 mb-8 text-lg">
            Your new organization has been set up. You'll be redirected to your dashboard in a moment.
          </p>
          <div className="flex items-center justify-center text-primary">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            <span>Redirecting to dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Left sidebar/cover area */}
      <div className="w-full lg:w-1/3 bg-gradient-to-br from-blue-900 to-indigo-900 text-white p-8 flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] [mask-image:linear-gradient(0deg,transparent,transparent)]" />
        
        <div className="relative">
          <div className="flex items-center mb-10">
            <div className="mr-3 bg-white/10 rounded-lg p-2">
              <Target className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold">OKR Platform</h1>
          </div>
          
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-4">Create Your Organization</h2>
            <p className="text-white/80 text-lg">
              Set up your organization and start tracking your objectives and key results in a few simple steps.
            </p>
          </div>
          
          <div className="space-y-8 mb-12">
            <div className="relative">
              <div className="h-1 bg-white/20 rounded-full mb-6 overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-500 ease-in-out rounded-full"
                  style={{ width: `${animateProgress}%` }}
                />
              </div>
              <div className="space-y-5">
                {steps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isActive = step.id === activePage;
                  const isPast = steps.findIndex(s => s.id === activePage) > index;
                  
                  return (
                    <div 
                      key={step.id}
                      className={`flex items-center space-x-4 cursor-pointer transition-all ${
                        isActive ? 'opacity-100' : isPast ? 'opacity-70' : 'opacity-50'
                      }`}
                      onClick={() => goToStep(step.id)}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isActive 
                          ? 'bg-white text-blue-900 shadow-lg shadow-white/10'
                          : isPast 
                            ? 'bg-white/30 text-white' 
                            : 'bg-white/10 text-white/70'
                      }`}>
                        {isPast ? (
                          <Check className="h-6 w-6" />
                        ) : (
                          <StepIcon className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <h3 className={`font-semibold text-lg ${isActive ? 'text-white' : ''}`}>
                          {step.label}
                        </h3>
                        <p className="text-white/60 text-sm">
                          {index === 0 && "Enter your organization details"}
                          {index === 1 && "Choose a subscription plan"}
                          {index === 2 && "Add your team members"}
                          {index === 3 && "Set up initial OKRs"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-auto relative">
          <div className="p-6 bg-white/5 rounded-xl border border-white/10">
            <h3 className="font-medium mb-2 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-amber-300" /> 
              Pro Tip
            </h3>
            <p className="text-white/80 text-sm">
              {activePage === "organization" && "Choose a descriptive name that reflects your organization's identity and mission."}
              {activePage === "plan" && "Consider your team size and growth plans when selecting a subscription tier."}
              {activePage === "team" && "Import team members from CSV to quickly add multiple users at once."}
              {activePage === "setup" && "Start with a template to save time and follow best practices for your OKRs."}
            </p>
          </div>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="w-full lg:w-2/3 overflow-y-auto p-8">
        <Form {...form}>
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <Tabs value={activePage} onValueChange={goToStep} className="w-full">
              {/* Organization Details */}
              <TabsContent value="organization" className="mt-0 space-y-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Organization Details</h2>
                  <p className="text-gray-500">Tell us about your organization</p>
                </div>
                
                <Card>
                  <CardContent className="pt-6 space-y-6">
                    <FormField
                      control={form.control}
                      name="orgDetails.name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Acme Inc." {...field} />
                          </FormControl>
                          <FormDescription>
                            This will be used for your organization's identifier
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="orgDetails.displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Acme" {...field} />
                          </FormControl>
                          <FormDescription>
                            A shorter name for your organization
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="orgDetails.description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="A brief description of your organization" 
                              className="resize-none min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="orgDetails.industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industry</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an industry" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="technology">Technology</SelectItem>
                              <SelectItem value="healthcare">Healthcare</SelectItem>
                              <SelectItem value="finance">Finance</SelectItem>
                              <SelectItem value="education">Education</SelectItem>
                              <SelectItem value="retail">Retail</SelectItem>
                              <SelectItem value="manufacturing">Manufacturing</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Subscription Plan */}
              <TabsContent value="plan" className="mt-0 space-y-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Choose a Plan</h2>
                  <p className="text-gray-500">Select the right subscription for your organization</p>
                </div>
                
                <Card>
                  <CardContent className="pt-6">
                    <FormField
                      control={form.control}
                      name="plan.plan"
                      render={({ field }) => (
                        <FormItem className="space-y-6">
                          <FormLabel className="sr-only">Subscription Plan</FormLabel>
                          <FormControl>
                            <RadioGroup 
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="grid grid-cols-1 gap-6"
                            >
                              {priceTiers.map((tier) => (
                                <div key={tier.id} className="relative">
                                  <RadioGroupItem
                                    value={tier.id}
                                    id={tier.id}
                                    className="sr-only"
                                  />
                                  <Label
                                    htmlFor={tier.id}
                                    className={`flex flex-col md:flex-row border rounded-xl p-4 cursor-pointer transition-all ${
                                      field.value === tier.id
                                        ? "border-primary shadow-md bg-primary/5" 
                                        : "border-gray-200 hover:border-gray-300"
                                    } ${tier.popular ? "ring-2 ring-primary/20" : ""}`}
                                  >
                                    {tier.popular && (
                                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold">
                                        Most Popular
                                      </div>
                                    )}
                                    
                                    <div className="w-full md:w-1/3 pr-0 md:pr-6 mb-4 md:mb-0 flex flex-col">
                                      <div className="mb-2">
                                        <div className="flex justify-between items-center mb-1">
                                          <h3 className="font-semibold text-lg">{tier.name}</h3>
                                          {field.value === tier.id && (
                                            <Check className="h-5 w-5 text-primary" />
                                          )}
                                        </div>
                                        <p className="text-sm text-gray-500">{tier.description}</p>
                                      </div>
                                      <div className="mb-4">
                                        <span className="text-3xl font-bold">
                                          {tier.price === 0 ? "Free" : `$${tier.price}`}
                                        </span>
                                        {tier.price > 0 && (
                                          <span className="text-gray-500 text-sm">/month</span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="w-full md:w-2/3 border-t md:border-t-0 md:border-l border-gray-200 md:pl-6 pt-4 md:pt-0">
                                      <div className="text-sm font-medium text-gray-700 mb-3">
                                        Top features:
                                      </div>
                                      <ul className="text-sm text-gray-600 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                                        {tier.features.slice(0, 6).map((feature, index) => (
                                          <li key={index} className="flex items-center">
                                            <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                            <span>{feature}</span>
                                          </li>
                                        ))}
                                      </ul>
                                      {tier.features.length > 6 && (
                                        <div className="text-sm text-primary font-medium mt-3">
                                          + {tier.features.length - 6} more features
                                        </div>
                                      )}
                                    </div>
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="plan.agreeToTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-6">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I agree to the <a href="#" className="text-primary underline">Terms of Service</a> and <a href="#" className="text-primary underline">Privacy Policy</a>
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Team */}
              <TabsContent value="team" className="mt-0 space-y-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Team Members</h2>
                  <p className="text-gray-500">Add your team members to your organization</p>
                </div>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 mb-6">
                      <div className="flex gap-3 items-center">
                        <div className="rounded-full bg-amber-100 p-2 text-amber-600">
                          <FileUp className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-amber-800">Import Team Members</h4>
                          <p className="text-sm text-amber-700">
                            Quickly add multiple team members by importing a CSV file
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <CSVImport 
                          templateFields={["name", "email", "department", "role"]}
                          templateName="Team Members"
                          onImport={(data) => {
                            // Convert imported data to the required format
                            const formattedData = data.map(user => ({
                              name: user.name || "",
                              email: user.email || "",
                              department: user.department || "",
                              role: (user.role || "member").toLowerCase(),
                              selected: true
                            }));
                            
                            // Set the imported data to the form
                            form.setValue("team.users", formattedData);
                            
                            // Show success toast
                            toast({
                              title: "Team imported",
                              description: `Successfully imported ${data.length} team members.`,
                              variant: "default"
                            });
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-800">Team Members</h4>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={addTeamMember}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1.5" />
                          Add Member
                        </Button>
                      </div>
                      
                      {teamMembers.length === 0 ? (
                        <div className="border border-dashed rounded-lg p-8 text-center">
                          <UserPlus className="h-10 w-10 mx-auto text-gray-400 mb-4" />
                          <h4 className="text-base font-medium text-gray-800 mb-2">No team members added yet</h4>
                          <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
                            Import team members from CSV or add them manually. You can also add team members later from the organization settings.
                          </p>
                          <Button 
                            type="button" 
                            variant="secondary" 
                            onClick={addTeamMember}
                          >
                            <Plus className="h-4 w-4 mr-1.5" />
                            Add Team Member
                          </Button>
                        </div>
                      ) : (
                        <div className="border rounded-lg overflow-hidden bg-white">
                          <div className="bg-muted/30 px-4 py-3 text-sm font-medium text-gray-600 grid grid-cols-12 gap-4">
                            <div className="col-span-5">Email</div>
                            <div className="col-span-3">Name</div>
                            <div className="col-span-3">Role</div>
                            <div className="col-span-1 text-right">Actions</div>
                          </div>
                          <div className="divide-y">
                            {teamMembers.map((_, index) => (
                              <div key={index} className="px-4 py-3 grid grid-cols-12 gap-4 items-center text-sm">
                                <div className="col-span-5">
                                  <FormField
                                    control={form.control}
                                    name={`team.users.${index}.email`}
                                    render={({ field }) => (
                                      <FormItem className="mb-0">
                                        <FormControl>
                                          <Input placeholder="Email" {...field} />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                <div className="col-span-3">
                                  <FormField
                                    control={form.control}
                                    name={`team.users.${index}.name`}
                                    render={({ field }) => (
                                      <FormItem className="mb-0">
                                        <FormControl>
                                          <Input placeholder="Name (optional)" {...field} />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                <div className="col-span-3">
                                  <FormField
                                    control={form.control}
                                    name={`team.users.${index}.role`}
                                    render={({ field }) => (
                                      <FormItem className="mb-0">
                                        <Select 
                                          onValueChange={field.onChange} 
                                          defaultValue={field.value}
                                        >
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Role" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="member">Member</SelectItem>
                                            <SelectItem value="viewer">Viewer</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                <div className="col-span-1 text-right">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      const currentUsers = form.getValues("team.users") || [];
                                      const newUsers = [
                                        ...currentUsers.slice(0, index),
                                        ...currentUsers.slice(index + 1)
                                      ];
                                      form.setValue("team.users", newUsers);
                                    }}
                                  >
                                    <X className="h-4 w-4 text-gray-500" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                          {teamMembers.length > 0 && (
                            <div className="bg-muted/20 px-4 py-3 text-sm text-gray-500">
                              {teamMembers.length} team member{teamMembers.length > 1 ? 's' : ''} added
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Initial Setup */}
              <TabsContent value="setup" className="mt-0 space-y-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Initial Setup</h2>
                  <p className="text-gray-500">Configure initial OKR settings for your organization</p>
                </div>
                
                <Card>
                  <CardContent className="pt-6 space-y-6">
                    <div>
                      <FormField
                        control={form.control}
                        name="setup.createInitialOKRs"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-gray-700 font-medium">
                                Create initial OKRs from a template
                              </FormLabel>
                              <FormDescription className="text-gray-500">
                                Jump-start your OKR process with a pre-configured template
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {createInitialOKRs && (
                      <FormField
                        control={form.control}
                        name="setup.template"
                        render={({ field }) => (
                          <FormItem className="ml-7">
                            <FormLabel>Select a Template</FormLabel>
                            <FormControl>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {okrTemplates.map((template) => {
                                  let icon;
                                  switch(template.id) {
                                    case 'startup':
                                      icon = <Rocket className="h-10 w-10 text-blue-600 mb-2" />;
                                      break;
                                    case 'sales':
                                      icon = <BarChart3 className="h-10 w-10 text-green-600 mb-2" />;
                                      break;
                                    case 'product':
                                      icon = <Landmark className="h-10 w-10 text-purple-600 mb-2" />;
                                      break;
                                    default:
                                      icon = <Target className="h-10 w-10 text-blue-600 mb-2" />;
                                  }
                                  
                                  return (
                                    <div 
                                      key={template.id}
                                      className={`border rounded-lg p-4 cursor-pointer transition-all hover:bg-gray-50 ${
                                        field.value === template.id 
                                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                                          : "border-gray-200"
                                      }`}
                                      onClick={() => field.onChange(template.id)}
                                    >
                                      <div className="flex justify-end">
                                        {field.value === template.id && (
                                          <div className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center">
                                            <Check className="h-4 w-4" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-center mb-3">
                                        {icon}
                                      </div>
                                      <div className="text-center">
                                        <div className="font-medium mb-1">{template.name}</div>
                                        <div className="text-sm text-gray-500">
                                          {template.description}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    <div className="pt-4">
                      <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                        <div className="flex gap-3 items-start">
                          <div className="rounded-full bg-amber-100 p-2 text-amber-600 mt-0.5">
                            <FileUp className="h-4 w-4" />
                          </div>
                          <div className="w-full">
                            <h4 className="font-medium text-amber-800 mb-1">Import OKRs from CSV</h4>
                            <p className="text-sm text-amber-700 mb-3">
                              Import your existing objectives and key results from a CSV file
                            </p>
                            
                            <CSVImport 
                              templateFields={[
                                "objective_title", 
                                "objective_description", 
                                "key_result_title", 
                                "key_result_description", 
                                "key_result_start_value", 
                                "key_result_target_value"
                              ]}
                              templateName="OKRs"
                              onImport={(data) => {
                                // Show success toast
                                toast({
                                  title: "OKRs imported",
                                  description: `Successfully imported ${data.length} OKR entries. These will be processed when you finish creating your organization.`,
                                  variant: "default"
                                });
                                
                                // Set createInitialOKRs to true since we're importing OKRs
                                form.setValue("setup.createInitialOKRs", true);
                                form.setValue("setup.importedOKRs", data);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-r from-emerald-50 to-cyan-50 border-emerald-100">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-emerald-100 text-emerald-700 rounded-full p-3 mt-1">
                        <Zap className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-xl mb-2 text-gray-800">Ready to Launch Your OKR Platform</h3>
                        <p className="text-gray-600 mb-3">
                          You're all set to create your organization. Click the button below to finish setup and start tracking your objectives and key results.
                        </p>
                        <p className="text-sm text-gray-500">
                          You can always update these settings later from your organization's admin panel.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            {/* Navigation buttons */}
            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={goToPreviousStep}
                disabled={activeIndex === 0}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              
              {activeIndex < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={goToNextStep}
                  disabled={!isCurrentStepValid()}
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting || !isCurrentStepValid()}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Organization...
                    </>
                  ) : (
                    <>
                      Create Organization
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