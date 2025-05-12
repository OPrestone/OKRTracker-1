import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Icons
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  Check,
  CreditCard,
  FileText,
  Loader2,
  Sparkles,
  Target as TargetIcon,
  UserPlus,
  Users,
} from "lucide-react";

// Validation schema for each step
const orgDetailsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  displayName: z.string().min(2, "Display name must be at least 2 characters."),
  description: z.string().optional(),
  industry: z.string().optional(),
});

const planSchema = z.object({
  plan: z.enum(["free", "starter", "professional", "enterprise"]),
  agreeToTerms: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the terms and conditions" }),
  }),
});

const teamSchema = z.object({
  users: z.array(
    z.object({
      email: z.string().email("Invalid email address"),
      name: z.string().optional(),
      role: z.enum(["admin", "member", "viewer"]),
      selected: z.boolean().optional(),
    })
  ).optional(),
});

const setupSchema = z.object({
  createInitialOKRs: z.boolean().optional(),
  importFromTemplate: z.boolean().optional(),
  selectedTemplate: z.string().optional(),
});

// Combined schema for all steps
const formSchema = z.object({
  orgDetails: orgDetailsSchema,
  plan: planSchema,
  team: teamSchema,
  setup: setupSchema,
});

// Define plan options
const plans = [
  {
    id: "free",
    name: "Free",
    description: "Basic OKR tracking for small teams",
    price: 0,
    features: [
      "Up to 5 users",
      "Basic OKR tracking",
      "Team management",
      "Limited reporting",
    ],
    maxUsers: 5,
  },
  {
    id: "starter",
    name: "Starter",
    description: "Everything in Free plus advanced features",
    price: 9.99,
    popular: true,
    features: [
      "Up to 20 users",
      "Advanced OKR tracking",
      "Team management",
      "Basic reporting and analytics",
      "Email support",
    ],
    maxUsers: 20,
  },
  {
    id: "professional",
    name: "Professional",
    description: "Enhanced features for growing teams",
    price: 29.99,
    features: [
      "Up to 100 users",
      "Advanced OKR tracking",
      "Custom reporting",
      "Advanced analytics",
      "Priority support",
      "API access",
    ],
    maxUsers: 100,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Full-featured solution for large organizations",
    price: 99.99,
    features: [
      "Unlimited users",
      "Advanced OKR tracking",
      "Custom reporting",
      "Advanced analytics",
      "Dedicated support",
      "API access",
      "Custom integrations",
      "SSO and advanced security",
      "Dedicated account manager",
    ],
    maxUsers: 1000,
  },
];

// OKR Templates
const okrTemplates = [
  {
    id: "company-quarterly",
    name: "Company Quarterly OKRs",
    description: "Standard quarterly OKRs for overall company performance",
    objectives: 3,
  },
  {
    id: "product-launch",
    name: "Product Launch",
    description: "OKRs focused on successful product launches",
    objectives: 4,
  },
  {
    id: "sales-team",
    name: "Sales Team",
    description: "Revenue and growth focused OKRs for sales teams",
    objectives: 3,
  },
  {
    id: "engineering",
    name: "Engineering Team",
    description: "Development and quality focused OKRs for engineering teams",
    objectives: 4,
  },
];

export default function TenantOnboardingWizard() {
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const [_, setLocation] = useLocation();
  // Implement custom navigate function that forces a full page reload to reset state
  const navigate = (path: string) => { window.location.href = path; };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creationSuccess, setCreationSuccess] = useState(false);
  const [newTenantId, setNewTenantId] = useState<string | null>(null);
  
  // Create a form instance with the combined schema
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orgDetails: {
        name: "",
        displayName: "",
        description: "",
        industry: "",
      },
      plan: {
        plan: "free",
        agreeToTerms: false,
      },
      team: {
        users: []
      },
      setup: {
        createInitialOKRs: false,
        importFromTemplate: false,
        selectedTemplate: "",
      },
    },
  });

  // Fetch available users for the team step
  const { data: availableUsers = [] } = useQuery({
    queryKey: ['/api/users'],
    enabled: step === 3,
  });

  // Calculate progress percentage
  const progress = (step / totalSteps) * 100;

  // Handle simpler tenant creation focusing on the essential first step
  const createTenantMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      setIsSubmitting(true);
      try {
        // First create the tenant with minimal required information
        const orgResponse = await apiRequest("POST", "/api/tenants", {
          name: values.orgDetails.name,
          displayName: values.orgDetails.displayName,
          description: values.orgDetails.description || undefined,
          industry: values.orgDetails.industry || undefined,
          plan: values.plan.plan || "free",
        });
        
        if (!orgResponse.ok) {
          const errorData = await orgResponse.json();
          throw new Error(errorData.message || "Failed to create organization");
        }
        
        const orgData = await orgResponse.json();
        const tenantId = orgData.id;
        setNewTenantId(tenantId);
        
        // Process remaining steps asynchronously
        
        // If users were selected, add them to the tenant
        if (values.team.users && values.team.users.length > 0) {
          const selectedUsers = values.team.users.filter(u => u.selected);
          
          for (const user of selectedUsers) {
            try {
              await apiRequest("POST", `/api/tenants/${tenantId}/users`, {
                email: user.email,
                role: user.role,
              });
            } catch (err) {
              console.error(`Failed to add user ${user.email}:`, err);
              // Continue with other users even if one fails
            }
          }
        }
        
        // If initial OKRs are requested, create them
        if (values.setup.createInitialOKRs && values.setup.selectedTemplate) {
          try {
            await apiRequest("POST", `/api/tenants/${tenantId}/templates`, {
              templateId: values.setup.selectedTemplate,
            });
          } catch (err) {
            console.error("Failed to create initial OKRs:", err);
            // Continue anyway as this is optional
          }
        }
        
        setCreationSuccess(true);
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
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create organization",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Direct navigation to new tenant
  const goToNewTenant = () => {
    if (newTenantId) {
      navigate(`/tenants/${newTenantId}`);
    }
  };

  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createTenantMutation.mutate(values);
  };

  // Try simple organization creation first (just first step) if submit button clicked
  const createSimpleOrganization = () => {
    // Validate only the organization details
    form.trigger("orgDetails").then(isValid => {
      if (isValid) {
        // Submit with just the essential data
        const values = form.getValues();
        createTenantMutation.mutate(values);
      }
    });
  };

  // Step management functions
  const nextStep = () => {
    const currentStepValid = validateCurrentStep();
    
    if (currentStepValid) {
      if (step < totalSteps) {
        setStep(step + 1);
      } else {
        // On last step, submit the form
        form.handleSubmit(onSubmit)();
      }
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Validate the current step before proceeding
  const validateCurrentStep = () => {
    let isValid = false;
    
    switch (step) {
      case 1:
        isValid = form.trigger("orgDetails", { shouldFocus: true });
        break;
      case 2:
        isValid = form.trigger("plan", { shouldFocus: true });
        break;
      case 3:
        isValid = form.trigger("team", { shouldFocus: true });
        break;
      case 4:
        isValid = form.trigger("setup", { shouldFocus: true });
        break;
      default:
        isValid = true;
    }
    
    return isValid;
  };

  // Show success screen if organization was created
  if (creationSuccess && newTenantId) {
    return (
      <div className="container max-w-5xl py-12">
        <Card className="border shadow-lg overflow-hidden">
          <div className="bg-green-50 py-8 px-6 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-green-100 border-4 border-green-200 flex items-center justify-center text-green-600 mb-4 shadow-sm">
              <Check className="h-10 w-10" />
            </div>
            <CardTitle className="text-3xl font-bold text-center text-green-800">Organization Created Successfully!</CardTitle>
            <CardDescription className="text-center text-green-700 text-lg mt-2">
              Your organization has been set up and is ready to use
            </CardDescription>
          </div>
          <CardContent className="flex flex-col items-center py-8 px-6">
            <div className="max-w-md text-center mb-8">
              <p className="mb-6 text-gray-700 text-lg leading-relaxed">
                You can now start setting up your objectives and key results, invite team members, and track your progress toward your goals.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start">
                  <TargetIcon className="text-blue-500 mt-1 mr-3 h-5 w-5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-blue-800">Create Your First OKR</h3>
                    <p className="text-sm text-blue-700">Define your objectives and key results</p>
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 flex items-start">
                  <Users className="text-purple-500 mt-1 mr-3 h-5 w-5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-purple-800">Invite Your Team</h3>
                    <p className="text-sm text-purple-700">Get your team on board</p>
                  </div>
                </div>
              </div>
            </div>
            <Button 
              size="lg" 
              onClick={goToNewTenant} 
              className="min-w-[250px] py-6 text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-md"
            >
              Go to Organization Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-12">
      <Card className="border shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center mb-2">
              <Building2 className="h-7 w-7 text-primary mr-3" />
              <CardTitle className="text-3xl font-bold text-gray-800">Set Up Your Organization</CardTitle>
            </div>
            <CardDescription className="text-gray-600 text-lg">
              Create your organization for OKR tracking in just a few steps
            </CardDescription>
          </div>
        </div>
        <CardContent className="pt-8 px-6">
          {/* Progress bar and steps indicator */}
          <div className="mb-8 max-w-3xl mx-auto">
            <div className="flex justify-between mb-3">
              <span className="text-sm font-medium text-primary">Step {step} of {totalSteps}</span>
              <span className="text-sm font-medium">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2.5 bg-gray-100" />
            
            <div className="flex justify-between mt-8">
              <div className={`flex flex-col items-center ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {step > 1 ? <Check className="h-6 w-6" /> : <Building2 className="h-6 w-6" />}
                </div>
                <span className="text-sm font-medium mt-2">Organization</span>
              </div>
              <div className={`flex flex-col items-center ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {step > 2 ? <Check className="h-6 w-6" /> : <CreditCard className="h-6 w-6" />}
                </div>
                <span className="text-sm font-medium mt-2">Plan</span>
              </div>
              <div className={`flex flex-col items-center ${step >= 3 ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {step > 3 ? <Check className="h-6 w-6" /> : <Users className="h-6 w-6" />}
                </div>
                <span className="text-sm font-medium mt-2">Team</span>
              </div>
              <div className={`flex flex-col items-center ${step >= 4 ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${step >= 4 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <TargetIcon className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium mt-2">Setup</span>
              </div>
            </div>
            
            {step === 1 && (
              <Alert className="mt-8 bg-blue-50 border border-blue-200 shadow-sm">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <AlertTitle className="text-blue-800 font-medium">Quick Setup Available</AlertTitle>
                <AlertDescription className="text-blue-700">
                  You can create your organization with just the basic details and configure additional settings later.
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          {/* Form wrapper */}
          <div className="mt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                {/* Step 1: Organization Details */}
                {step === 1 && (
                  <div className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 mb-8">
                      <div className="mb-6 border-b pb-4">
                        <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                          <Building2 className="h-5 w-5 mr-2 text-primary" />
                          Organization Details
                        </h3>
                        <p className="text-gray-600 mt-1">Enter the basic information about your organization</p>
                      </div>
                      
                      <div className="space-y-6">
                        <FormField
                          control={form.control}
                          name="orgDetails.displayName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-800 font-medium">Organization Name *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Acme Inc." 
                                  {...field} 
                                  className="h-11 focus:ring-2 focus:ring-primary/20"
                                />
                              </FormControl>
                              <FormDescription>
                                The name of your organization as it will be displayed throughout the platform
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="orgDetails.name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-800 font-medium">URL Identifier *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="acme-inc" 
                                  {...field} 
                                  className="h-11 focus:ring-2 focus:ring-primary/20"
                                />
                              </FormControl>
                              <FormDescription>
                                Used in URLs and for technical identification (no spaces or special characters)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="orgDetails.description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-800 font-medium">Description</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Briefly describe your organization" 
                                    rows={4}
                                    className="focus:ring-2 focus:ring-primary/20 resize-none"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  A short description of your organization (optional)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="orgDetails.industry"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-800 font-medium">Industry</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger className="h-11 focus:ring-2 focus:ring-primary/20">
                                      <SelectValue placeholder="Select industry" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="technology">Technology</SelectItem>
                                    <SelectItem value="finance">Finance</SelectItem>
                                    <SelectItem value="healthcare">Healthcare</SelectItem>
                                    <SelectItem value="education">Education</SelectItem>
                                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                                    <SelectItem value="retail">Retail</SelectItem>
                                    <SelectItem value="services">Services</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  The primary industry of your organization (optional)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        {/* Quick create button */}
                        <div className="mt-8 pt-6 border-t border-gray-100">
                          <Button
                            type="button"
                            size="lg"
                            onClick={createSimpleOrganization}
                            className="w-full py-6 text-lg font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary-600 hover:to-primary/95 shadow-md transition-all"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                Creating Organization...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-5 w-5 mr-2" />
                                Create Organization Now
                              </>
                            )}
                          </Button>
                          <p className="text-center text-sm text-gray-500 mt-3">
                            You can configure additional settings after creating your organization
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Step 2: Plan Selection */}
                {step === 2 && (
                  <div className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 mb-8">
                      <div className="mb-6 border-b pb-4">
                        <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                          <CreditCard className="h-5 w-5 mr-2 text-primary" />
                          Select a Subscription Plan
                        </h3>
                        <p className="text-gray-600 mt-1">Choose the plan that best fits your organization's needs</p>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="plan.plan"
                        render={({ field }) => (
                          <FormItem className="space-y-6">
                            <FormControl>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {plans.map((plan) => (
                                  <div 
                                    key={plan.id}
                                    className={`relative rounded-xl border-2 p-5 transition-all cursor-pointer hover:shadow-md ${
                                      field.value === plan.id 
                                        ? "border-primary bg-primary/5 shadow-sm" 
                                        : "border-gray-200 hover:border-primary/30"
                                    }`}
                                    onClick={() => field.onChange(plan.id)}
                                  >
                                    {plan.popular && (
                                      <Badge className="absolute right-3 top-3 bg-blue-500 hover:bg-blue-500/90 text-white">
                                        Most Popular
                                      </Badge>
                                    )}
                                    <div className="space-y-4">
                                      <div className="flex justify-between items-center">
                                        <h3 className={`text-lg font-semibold ${field.value === plan.id ? "text-primary" : "text-gray-800"}`}>
                                          {plan.name}
                                        </h3>
                                        {field.value === plan.id && (
                                          <Check className="h-5 w-5 text-primary" />
                                        )}
                                      </div>
                                      
                                      <div className="flex items-baseline">
                                        <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                                        <span className="text-sm text-gray-500 ml-1">/month</span>
                                      </div>
                                      
                                      <p className="text-sm text-gray-600 border-t border-gray-100 pt-3">
                                        {plan.description}
                                      </p>
                                      
                                      <ul className="space-y-2 mt-4">
                                        {plan.features.map((feature, index) => (
                                          <li key={index} className="flex items-start text-sm">
                                            <div className="mt-0.5 mr-2 rounded-full bg-green-100 p-1 text-green-600">
                                              <Check className="h-3 w-3" />
                                            </div>
                                            <span className="text-gray-700">{feature}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="mt-8 pt-4 border-t border-gray-100">
                        <FormField
                          control={form.control}
                          name="plan.agreeToTerms"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-gray-700">
                                  I agree to the <a href="#" className="text-primary font-medium hover:underline">Terms of Service</a> and <a href="#" className="text-primary font-medium hover:underline">Privacy Policy</a>
                                </FormLabel>
                                <FormDescription className="text-gray-500 text-xs">
                                  You can change your plan at any time from your account settings
                                </FormDescription>
                                <FormMessage />
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Step 3: Team Members */}
                {step === 3 && (
                  <div className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 mb-8">
                      <div className="mb-6 border-b pb-4">
                        <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                          <Users className="h-5 w-5 mr-2 text-primary" />
                          Invite Your Team
                        </h3>
                        <p className="text-gray-600 mt-1">Add team members to collaborate on objectives and key results</p>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="team.users"
                        render={({ field }) => (
                          <FormItem className="space-y-4">
                            <div className="flex justify-between items-center">
                              <FormLabel className="text-gray-800 font-medium text-base">Available Users</FormLabel>
                              
                              <Select defaultValue="all">
                                <SelectTrigger className="h-9 w-[180px]">
                                  <SelectValue placeholder="Filter users" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Users</SelectItem>
                                  <SelectItem value="selected">Selected Only</SelectItem>
                                  <SelectItem value="unselected">Unselected Only</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <FormControl>
                              <div className="border rounded-lg overflow-hidden shadow-sm">
                                <div className="px-4 py-3 bg-gray-50 font-medium text-sm grid grid-cols-5 border-b">
                                  <div className="col-span-2">User</div>
                                  <div>Role</div>
                                  <div>Department</div>
                                  <div className="text-right">Add</div>
                                </div>
                              <div className="divide-y">
                                {availableUsers.length > 0 ? (
                                  availableUsers.map((availableUser: any, index: number) => {
                                    // Find this user in our form state or create a new entry
                                    const existingUserIndex = field.value?.findIndex(
                                      (u: any) => u.email === availableUser.email
                                    ) ?? -1;
                                    
                                    const userInForm = existingUserIndex >= 0
                                      ? field.value?.[existingUserIndex]
                                      : { email: availableUser.email, role: "member", selected: false };
                                    
                                    const updateUser = (updates: Partial<typeof userInForm>) => {
                                      const newUsers = [...(field.value || [])];
                                      
                                      if (existingUserIndex >= 0) {
                                        newUsers[existingUserIndex] = { ...userInForm, ...updates };
                                      } else {
                                        newUsers.push({ ...userInForm, ...updates });
                                      }
                                      
                                      field.onChange(newUsers);
                                    };
                                    
                                    return (
                                      <div 
                                        key={availableUser.id || index} 
                                        className={`px-4 py-3 grid grid-cols-5 items-center hover:bg-gray-50 transition-colors
                                          ${userInForm.selected ? "bg-blue-50/70 hover:bg-blue-50/90" : ""}`
                                        }
                                      >
                                        <div className="col-span-2 flex items-center gap-3">
                                          <Avatar className="h-10 w-10 border">
                                            <AvatarImage src={availableUser.avatar} alt={availableUser.name} />
                                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                              {availableUser.name?.charAt(0) || availableUser.email?.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div>
                                            <div className="font-medium text-gray-800">{availableUser.name || "Unnamed User"}</div>
                                            <div className="text-sm text-gray-500">{availableUser.email}</div>
                                          </div>
                                        </div>
                                        <div>
                                          <Select 
                                            value={userInForm.role} 
                                            onValueChange={(value) => updateUser({ role: value as any })}
                                          >
                                            <SelectTrigger className="h-9 w-28 focus:ring-2 focus:ring-primary/20">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="admin">Admin</SelectItem>
                                              <SelectItem value="member">Member</SelectItem>
                                              <SelectItem value="viewer">Viewer</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="text-sm text-gray-600">
                                          {availableUser.department || "-"}
                                        </div>
                                        <div className="text-right">
                                          <div className="flex justify-end">
                                            <Button
                                              type="button"
                                              variant={userInForm.selected ? "destructive" : "outline"}
                                              size="sm"
                                              className={`px-3 ${userInForm.selected ? "" : "border-primary text-primary hover:bg-primary/5"}`}
                                              onClick={() => updateUser({ selected: !userInForm.selected })}
                                            >
                                              {userInForm.selected ? (
                                                <>
                                                  <X className="h-4 w-4 mr-1" />
                                                  Remove
                                                </>
                                              ) : (
                                                <>
                                                  <Plus className="h-4 w-4 mr-1" />
                                                  Add
                                                </>
                                              )}
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="p-6 text-center text-gray-500">
                                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                    <p className="font-medium text-gray-700 mb-1">No users available</p>
                                    <p className="text-sm">You'll be the only member of this organization. Invite others below.</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Select users to add to your organization. You can manage this later.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="mt-8 border border-blue-100 rounded-lg bg-blue-50/50 p-4">
                      <div className="flex gap-3 items-start">
                        <div className="rounded-full bg-blue-100 p-2 text-blue-600 mt-0.5">
                          <UserPlus className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-blue-800 mb-1">Invite team members via email</h4>
                          <p className="text-sm text-blue-700 mb-3">
                            Don't see someone you need to add? Send them an invitation directly.
                          </p>
                          
                          <div className="flex gap-2 mb-2">
                            <Input 
                              type="email" 
                              placeholder="colleague@example.com" 
                              className="max-w-sm h-9 bg-white border-blue-200 focus-visible:ring-blue-400"
                            />
                            <Select defaultValue="member">
                              <SelectTrigger className="h-9 w-28 bg-white border-blue-200 focus:ring-blue-400">
                                <SelectValue placeholder="Role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button type="button" size="sm" className="h-9 bg-blue-600 hover:bg-blue-700">
                              <Mail className="h-4 w-4 mr-1" />
                              Invite
                            </Button>
                          </div>
                          
                          <p className="text-xs text-blue-600">
                            You can also manage team members later from the organization settings.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Step 4: Initial Setup */}
                {step === 4 && (
                  <div className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 mb-8">
                      <div className="mb-6 border-b pb-4">
                        <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                          <Check className="h-5 w-5 mr-2 text-primary" />
                          Initial Setup
                        </h3>
                        <p className="text-gray-600 mt-1">Configure initial OKR settings for your organization</p>
                      </div>
                    
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
                      
                      {form.watch("setup.createInitialOKRs") && (
                        <FormField
                          control={form.control}
                          name="setup.template"
                          render={({ field }) => (
                            <FormItem className="ml-7 mt-4">
                              <FormLabel>Select a Template</FormLabel>
                              <FormControl>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {okrTemplates.map((template) => (
                                    <div 
                                      key={template.id}
                                      className={`border rounded-md p-3 cursor-pointer transition-all ${
                                        field.value === template.id 
                                          ? "border-primary bg-primary/5"
                                          : "hover:border-gray-300"
                                      }`}
                                      onClick={() => field.onChange(template.id)}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="font-medium">{template.name}</div>
                                        {field.value === template.id && <Check className="h-4 w-4 text-primary" />}
                                      </div>
                                      <div className="mt-1 text-sm text-muted-foreground">
                                        {template.description}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                    
                    <div className="rounded-lg border p-6 bg-muted/40">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 text-primary rounded-full p-3">
                          <AlertCircle className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg mb-2">Ready to Create Your Organization</h4>
                          <p className="text-muted-foreground">
                            Click the "Create Organization" button below to finish setting up your organization. You can always update these settings later.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 text-primary rounded-full p-3">
                          <Sparkles className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-medium text-lg">Ready to Go!</h3>
                          <p className="text-muted-foreground text-sm mt-1">
                            Review your organization setup and click "Create Organization" to finish the setup process.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Navigation buttons */}
                <div className="flex justify-between mt-8">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={step === 1 || createTenantMutation.isPending}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={createTenantMutation.isPending}
                  >
                    {createTenantMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : step === totalSteps ? (
                      "Create Organization"
                    ) : (
                      <>
                        Next
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-6">
          {step > 1 ? (
            <Button type="button" variant="outline" onClick={prevStep}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          ) : (
            {/* Empty div to maintain spacing */}
            <div></div>
          )}
          
          <div className="flex gap-2">
            {/* Show simple create button only on first step */}
            {step === 1 && (
              <Button 
                type="button" 
                variant="default" 
                onClick={createSimpleOrganization}
                disabled={isSubmitting}
                className="min-w-[140px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create Organization 
                  </>
                )}
              </Button>
            )}
            
            {/* Regular next/submit button */}
            {step < totalSteps ? (
              <Button 
                type="button" 
                onClick={nextStep}
                disabled={isSubmitting}
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                type="submit" 
                onClick={() => form.handleSubmit(onSubmit)()}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Complete
                    <Check className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}