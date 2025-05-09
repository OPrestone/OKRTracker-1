import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "wouter";
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
  TargetIcon,
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
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
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

  // Fetch available users
  const { data: availableUsers = [] } = useQuery({
    queryKey: ['/api/users'],
    enabled: step === 3,
  });

  // Calculate progress percentage
  const progress = (step / totalSteps) * 100;

  // Handle tenant creation with all collected data
  const createTenantMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // First create the tenant
      const orgResponse = await apiRequest("POST", "/api/tenants", {
        name: values.orgDetails.name,
        displayName: values.orgDetails.displayName,
        description: values.orgDetails.description,
        industry: values.orgDetails.industry,
        plan: values.plan.plan,
      });
      
      if (!orgResponse.ok) {
        const errorData = await orgResponse.json();
        throw new Error(errorData.message || "Failed to create organization");
      }
      
      const orgData = await orgResponse.json();
      const tenantId = orgData.id;
      
      // If users were selected, add them to the tenant
      if (values.team.users && values.team.users.length > 0) {
        const selectedUsers = values.team.users.filter(u => u.selected);
        
        for (const user of selectedUsers) {
          const userResponse = await apiRequest("POST", `/api/tenants/${tenantId}/users`, {
            email: user.email,
            role: user.role,
          });
          
          if (!userResponse.ok) {
            // Continue even if some users fail
            console.error(`Failed to add user ${user.email}`);
          }
        }
      }
      
      // If initial OKRs are requested, create them
      if (values.setup.createInitialOKRs) {
        const templateId = values.setup.selectedTemplate;
        
        if (templateId) {
          const okrResponse = await apiRequest("POST", `/api/tenants/${tenantId}/templates`, {
            templateId,
          });
          
          if (!okrResponse.ok) {
            console.error("Failed to create initial OKRs");
          }
        }
      }
      
      return orgData;
    },
    onSuccess: (data) => {
      toast({
        title: "Organization created",
        description: "Your new organization has been created successfully.",
      });
      
      // Invalidate tenants query to refresh list
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      
      // Navigate to the new tenant page
      navigate(`/tenants/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create organization",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission on final step
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createTenantMutation.mutate(values);
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

  return (
    <div className="container max-w-5xl py-8">
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Set Up Your Organization</CardTitle>
          <CardDescription>
            Create and configure your organization for OKR tracking in just a few steps
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress bar and steps indicator */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-muted-foreground">Step {step} of {totalSteps}</span>
              <span className="text-sm font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            
            <div className="flex justify-between mt-4">
              <div className={`flex flex-col items-center ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {step > 1 ? <Check className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                </div>
                <span className="text-xs mt-1">Organization</span>
              </div>
              <div className={`flex flex-col items-center ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {step > 2 ? <Check className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                </div>
                <span className="text-xs mt-1">Plan</span>
              </div>
              <div className={`flex flex-col items-center ${step >= 3 ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {step > 3 ? <Check className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                </div>
                <span className="text-xs mt-1">Team</span>
              </div>
              <div className={`flex flex-col items-center ${step >= 4 ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 4 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <TargetIcon className="h-4 w-4" />
                </div>
                <span className="text-xs mt-1">Setup</span>
              </div>
            </div>
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
      </Card>
    </div>
  );
}