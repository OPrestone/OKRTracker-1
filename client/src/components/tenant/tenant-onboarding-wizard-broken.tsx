import { useState } from "react";
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
  CreditCard,
  Loader2,
  Mail,
  Plus,
  UserPlus,
  Users,
  X,
} from "lucide-react";

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

// Example OKR templates
const okrTemplates = [
  {
    id: "growth",
    name: "Growth & Expansion",
    description: "Focus on market expansion and revenue growth",
  },
  {
    id: "product",
    name: "Product Development",
    description: "Accelerate product development and innovation",
  },
  {
    id: "customer",
    name: "Customer Success",
    description: "Improve customer satisfaction and retention",
  },
  {
    id: "operational",
    name: "Operational Excellence",
    description: "Streamline operations and improve efficiency",
  },
];

// Example price tiers for the subscription plans
const priceTiers = [
  {
    id: "free",
    name: "Free",
    description: "Basic features for small teams",
    price: 0,
    features: [
      "Up to 10 users",
      "Basic OKR tracking",
      "Standard templates",
      "Email support",
      "7-day history",
    ],
    maxUsers: 10,
  },
  {
    id: "starter",
    name: "Starter",
    description: "Great for small teams getting started",
    price: 9.99,
    features: [
      "Up to 25 users",
      "Advanced OKR tracking",
      "Custom templates",
      "Priority support",
      "30-day history",
      "Basic analytics",
    ],
    maxUsers: 25,
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
      "Custom reporting & templates",
      "Advanced analytics & insights",
      "Dedicated support manager",
      "API access & custom integrations",
      "SSO & advanced security",
    ],
    maxUsers: Infinity,
  },
];

// Form validation schema using Zod
const formSchema = z.object({
  setup: z.object({
    createInitialOKRs: z.boolean().default(false),
    template: z.string().optional(),
  }),
  plan: z.object({
    plan: z.enum(["free", "starter", "professional", "enterprise"]),
    agreeToTerms: z.literal(true),
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
    })).optional(),
  }),
});

export default function TenantOnboardingWizard() {
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;
  
  const [availableUsers] = useState([
    { id: 1, name: "Jane Cooper", email: "jane@example.com", department: "Marketing" },
    { id: 2, name: "Wade Warren", email: "wade@example.com", department: "Engineering" },
    { id: 3, name: "Esther Howard", email: "esther@example.com", department: "Product" },
    { id: 4, name: "Cameron Williamson", email: "cameron@example.com", department: "Sales" },
    { id: 5, name: "Brooklyn Simmons", email: "brooklyn@example.com", department: "Design" },
  ]);
  
  const [isQuickSetup, setIsQuickSetup] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tenantCreated, setTenantCreated] = useState(false);
  
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  // Form setup with default values
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
        users: [],
      },
      setup: {
        createInitialOKRs: false,
        template: "",
      },
    },
  });
  
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
        
        // Make the API request
        const response = await apiRequest('POST', '/api/tenants', requestData);
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
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create organization",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Continue to next step
  const nextStep = () => {
    if (step === totalSteps) {
      onSubmit(form.getValues());
    } else {
      const isStepValid = validateStep();
      if (isStepValid) {
        setStep(step + 1);
      }
    }
  };
  
  // Go back to previous step
  const prevStep = () => {
    setStep(Math.max(1, step - 1));
  };
  
  // Submit the form
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createTenantMutation.mutate(values);
  };
  
  // Validate current step before proceeding
  const validateStep = () => {
    let isValid = true;
    
    if (step === 1) {
      const orgDetails = form.getValues("orgDetails");
      
      if (!orgDetails.name || !orgDetails.displayName) {
        form.setError("orgDetails.name", {
          type: "manual",
          message: "Organization name is required",
        });
        form.setError("orgDetails.displayName", {
          type: "manual",
          message: "Display name is required",
        });
        isValid = false;
      }
    }
    
    if (step === 2) {
      const plan = form.getValues("plan");
      
      if (!plan.agreeToTerms) {
        form.setError("plan.agreeToTerms", {
          type: "manual",
          message: "You must agree to the terms",
        });
        isValid = false;
      }
    }
    
    return isValid;
  };
  
  // If tenant was successfully created, show the success page
  if (tenantCreated) {
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
              
              <div className="flex gap-4 justify-center">
                <Button onClick={() => navigate("/tenants")}>
                  View All Organizations
                </Button>
                <Button variant="outline" onClick={() => navigate(`/t/${createTenantMutation.data?.slug}`)}>
                  Go to Dashboard
                </Button>
              </div>
            </div>
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
                  <Building2 className="h-6 w-6" />
                </div>
                <span className="mt-2 text-sm font-medium">Details</span>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className={`h-px w-full ${step >= 2 ? "bg-primary" : "bg-muted"}`}></div>
              </div>
              <div className={`flex flex-col items-center ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <CreditCard className="h-6 w-6" />
                </div>
                <span className="mt-2 text-sm font-medium">Plan</span>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className={`h-px w-full ${step >= 3 ? "bg-primary" : "bg-muted"}`}></div>
              </div>
              <div className={`flex flex-col items-center ${step >= 3 ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <Users className="h-6 w-6" />
                </div>
                <span className="mt-2 text-sm font-medium">Team</span>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className={`h-px w-full ${step >= 4 ? "bg-primary" : "bg-muted"}`}></div>
              </div>
              <div className={`flex flex-col items-center ${step >= 4 ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${step >= 4 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <Check className="h-6 w-6" />
                </div>
                <span className="mt-2 text-sm font-medium">Setup</span>
              </div>
            </div>
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
                          name="orgDetails.name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-800 font-medium">Organization Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Acme Corporation" className="bg-white" {...field} />
                              </FormControl>
                              <FormDescription>
                                This will be used for identification in the system
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
                              <FormLabel className="text-gray-800 font-medium">URL Identifier *</FormLabel>
                              <FormControl>
                                <Input placeholder="acme" className="bg-white" {...field} />
                              </FormControl>
                              <FormDescription>
                                This will be used in the URL: example.com/t/<span className="text-primary font-medium">{field.value || "your-org"}</span>
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
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
                
                {/* Navigation buttons */}
                <div className="flex justify-between mt-8 max-w-3xl mx-auto">
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
                      <>
                        Create Organization
                      </>
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