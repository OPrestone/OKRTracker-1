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
                  <div className="space-y-6">
                    <div className="text-lg font-semibold mb-4">Organization Details</div>
                    
                    <FormField
                      control={form.control}
                      name="orgDetails.displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Acme Inc." {...field} />
                          </FormControl>
                          <FormDescription>
                            The name of your organization as it will be displayed
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
                          <FormLabel>URL Identifier</FormLabel>
                          <FormControl>
                            <Input placeholder="acme-inc" {...field} />
                          </FormControl>
                          <FormDescription>
                            Used in URLs and for technical identification (no spaces or special characters)
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
                              placeholder="Briefly describe your organization" 
                              rows={3}
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
                            Select your industry (optional)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                
                {/* Step 2: Plan Selection */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div className="text-lg font-semibold mb-4">Select a Plan</div>
                    
                    <FormField
                      control={form.control}
                      name="plan.plan"
                      render={({ field }) => (
                        <FormItem className="space-y-4">
                          <FormLabel>Available Plans</FormLabel>
                          <FormControl>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {plans.map((plan) => (
                                <div 
                                  key={plan.id}
                                  className={`relative rounded-lg border p-4 hover:border-primary/80 transition-colors cursor-pointer ${
                                    field.value === plan.id ? "border-primary" : ""
                                  }`}
                                  onClick={() => field.onChange(plan.id)}
                                >
                                  {plan.popular && (
                                    <Badge className="absolute right-2 top-2" variant="secondary">
                                      Popular
                                    </Badge>
                                  )}
                                  <div className="space-y-3">
                                    <h3 className="font-medium">{plan.name}</h3>
                                    <div className="text-2xl font-bold">
                                      ${plan.price} <span className="text-sm font-normal">/month</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {plan.description}
                                    </p>
                                    <ul className="space-y-2 text-sm">
                                      {plan.features.map((feature, index) => (
                                        <li key={index} className="flex items-center">
                                          <Check className="h-4 w-4 mr-2 text-primary" />
                                          {feature}
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
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                
                {/* Step 3: Team Members */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div className="text-lg font-semibold mb-4">Invite Team Members</div>
                    
                    <FormField
                      control={form.control}
                      name="team.users"
                      render={({ field }) => (
                        <FormItem className="space-y-4">
                          <FormLabel>Available Users</FormLabel>
                          <FormControl>
                            <div className="border rounded-md overflow-hidden">
                              <div className="px-4 py-3 bg-muted font-medium text-sm grid grid-cols-5">
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
                                      <div key={availableUser.id} className="px-4 py-3 grid grid-cols-5 items-center">
                                        <div className="col-span-2 flex items-center gap-3">
                                          <Avatar className="h-8 w-8">
                                            <AvatarImage src={availableUser.avatar} alt={availableUser.name} />
                                            <AvatarFallback>
                                              {availableUser.name?.charAt(0) || availableUser.email?.charAt(0)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div>
                                            <div className="font-medium">{availableUser.name}</div>
                                            <div className="text-sm text-muted-foreground">{availableUser.email}</div>
                                          </div>
                                        </div>
                                        <div>
                                          <Select 
                                            value={userInForm.role} 
                                            onValueChange={(value) => updateUser({ role: value as any })}
                                          >
                                            <SelectTrigger className="h-8 w-28">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="admin">Admin</SelectItem>
                                              <SelectItem value="member">Member</SelectItem>
                                              <SelectItem value="viewer">Viewer</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          {availableUser.department || "-"}
                                        </div>
                                        <div className="text-right">
                                          <Checkbox
                                            checked={userInForm.selected}
                                            onCheckedChange={(checked) => 
                                              updateUser({ selected: !!checked })
                                            }
                                          />
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="px-4 py-8 text-center text-muted-foreground">
                                    No users available. You'll be the only member of this organization.
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
                    
                    <Alert>
                      <UserPlus className="h-4 w-4" />
                      <AlertTitle>No users to invite?</AlertTitle>
                      <AlertDescription>
                        You can invite team members later from the organization settings page.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
                
                {/* Step 4: Initial Setup */}
                {step === 4 && (
                  <div className="space-y-6">
                    <div className="text-lg font-semibold mb-4">Initial Setup</div>
                    
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
                            <FormLabel>
                              Create initial OKRs from a template
                            </FormLabel>
                            <FormDescription>
                              Start with a set of pre-defined objectives and key results
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    {form.watch("setup.createInitialOKRs") && (
                      <FormField
                        control={form.control}
                        name="setup.selectedTemplate"
                        render={({ field }) => (
                          <FormItem className="ml-7 mt-4">
                            <FormLabel>Select a Template</FormLabel>
                            <FormControl>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {okrTemplates.map((template) => (
                                  <div 
                                    key={template.id}
                                    className={`border rounded-md p-3 cursor-pointer hover:border-primary transition-colors ${
                                      field.value === template.id ? "border-primary bg-primary/5" : ""
                                    }`}
                                    onClick={() => field.onChange(template.id)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="font-medium">{template.name}</div>
                                      <Badge variant="outline">{template.objectives} objectives</Badge>
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
                    
                    <Separator className="my-6" />
                    
                    <div className="rounded-lg border p-6 bg-muted/40">
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
            <div></div> // Empty div to maintain spacing
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