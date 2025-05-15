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
  CheckCircle,
  CreditCard,
  FileUp,
  Loader2,
  Mail,
  Plus,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { CSVImport } from "@/components/csv/csv-import";

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
      "Team & individual analytics",
      "Unlimited Admin users",
      "API access for integrations",
      "SSO authentication",
      "Custom branding options",
      "Team engagement scores"
    ],
    maxUsers: 100,
    recommended: false,
    buttonText: "Select Professional Plan"
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Full-featured solution for large organizations",
    price: 99.99,
    popular: false,
    features: [
      "Unlimited users",
      "Unlimited teams with hierarchical structure",
      "Advanced OKR tracking with multi-level alignment",
      "Custom reporting & template library",
      "Advanced analytics & insights dashboard",
      "Dedicated account manager & premium support",
      "Unlimited history retention",
      "Enterprise-grade security & compliance",
      "Full API access with developer support",
      "SSO & advanced security features",
      "Custom integrations with your tools",
      "AI-powered OKR recommendations",
      "Executive dashboards & insights",
      "Advanced engagement analytics",
      "Team performance benchmarking"
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
        importedOKRs: [],
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
        
        // Make the API request with role explicitly set to "owner"
        // This ensures the user becomes the admin of the organization they create
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
      
      // Automatically redirect to the new organization dashboard after a short delay
      if (data && data.tenant && data.tenant.id) {
        // Set the tenant ID in the context first to avoid being redirected back to tenant-onboarding
        if (window) {
          // Store the tenant ID in sessionStorage
          sessionStorage.setItem("selectedTenantId", data.tenant.id);
        }
        
        // Then redirect with a delay to allow the success message to be seen
        setTimeout(() => {
          // Force a full page refresh to ensure all tenant data is properly loaded
          window.location.href = `/${data.tenant.id}`;
        }, 1500);
      }
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
                <Button variant="outline" onClick={() => navigate("/tenants")}>
                  View All Organizations
                </Button>
                <Button onClick={() => navigate(`/t/${createTenantMutation.data?.tenant?.slug}`)}>
                  Go to Dashboard
                </Button>
              </div>
              <div className="text-sm text-muted-foreground mt-4 text-center">
                You'll be automatically redirected to your dashboard in a moment...
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
                
                {/* Step 2: Subscription Plan */}
                {step === 2 && (
                  <div className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 mb-8">
                      <div className="mb-6 border-b pb-4">
                        <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                          <CreditCard className="h-5 w-5 mr-2 text-primary" />
                          Choose a Plan
                        </h3>
                        <p className="text-gray-600 mt-1">Select the subscription plan that works best for your team</p>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="plan.plan"
                        render={({ field }) => (
                          <FormItem className="space-y-6">
                            <FormControl>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {priceTiers.map((tier) => (
                                  <div
                                    key={tier.id}
                                    className={`relative rounded-lg border ${
                                      field.value === tier.id
                                        ? "border-2 border-primary"
                                        : tier.recommended ? "border-2 border-blue-300" : "border-gray-200"
                                    } p-4 cursor-pointer transition-all hover:border-primary/70 hover:shadow-md`}
                                    onClick={() => field.onChange(tier.id)}
                                  >
                                    {/* Recommended badge */}
                                    {tier.recommended && (
                                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                        Recommended
                                      </div>
                                    )}
                                    
                                    {/* Popular badge */}
                                    {tier.popular && (
                                      <div className="absolute -top-3 right-4 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                        Popular
                                      </div>
                                    )}
                                    
                                    <input 
                                      type="radio" 
                                      id={tier.id} 
                                      checked={field.value === tier.id} 
                                      onChange={() => field.onChange(tier.id)} 
                                      className="sr-only"
                                    />
                                    
                                    <div className="flex flex-col h-full">
                                      <div className="mb-4">
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-2 ${
                                          field.value === tier.id 
                                            ? "bg-primary text-white" 
                                            : "bg-primary/10 text-primary"
                                        }`}>
                                          {tier.name}
                                        </span>
                                        <div className="font-bold text-2xl mb-1">
                                          ${tier.price}
                                          <span className="text-sm text-gray-500 font-normal">
                                            {tier.price > 0 ? "/month" : " forever"}
                                          </span>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                          {tier.description}
                                        </p>
                                      </div>
                                      
                                      <div className="space-y-2 mt-2 mb-4">
                                        {tier.features.slice(0, 5).map((feature, i) => (
                                          <div key={i} className="flex items-center text-sm">
                                            <Check className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                                            <span>{feature}</span>
                                          </div>
                                        ))}
                                        
                                        {tier.features.length > 5 && (
                                          <details className="mt-1">
                                            <summary className="text-sm text-primary cursor-pointer">
                                              +{tier.features.length - 5} more features
                                            </summary>
                                            <div className="mt-2 pl-1 space-y-2">
                                              {tier.features.slice(5).map((feature, i) => (
                                                <div key={i} className="flex items-center text-sm">
                                                  <Check className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                                                  <span>{feature}</span>
                                                </div>
                                              ))}
                                            </div>
                                          </details>
                                        )}
                                      </div>
                                      
                                      <div className="mt-auto pt-3 border-t border-gray-100">
                                        <Button
                                          type="button"
                                          variant={field.value === tier.id ? "default" : "outline"}
                                          className="w-full"
                                          onClick={() => field.onChange(tier.id)}
                                        >
                                          {tier.buttonText || `Select ${tier.name}`}
                                        </Button>
                                      </div>
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
                              <FormLabel className="text-gray-700">
                                I agree to the terms and conditions
                              </FormLabel>
                              <FormDescription className="text-gray-500 text-xs">
                                By checking this box, you agree to our Terms of Service and Privacy Policy.
                              </FormDescription>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
                      
                      <div className="mb-6">
                        <h4 className="text-lg font-medium text-gray-700 mb-2">Add Team Members</h4>
                        <p className="text-gray-600 mb-4">
                          Add team members to collaborate with in your organization. You can add members via CSV import or invite them directly by email.
                        </p>
                      </div>
                      
                      {/* Import team members via CSV - Primary method */}
                      <div className="mb-8 border-2 border-primary/30 rounded-lg bg-primary/5 p-6 shadow-sm">
                        <div className="flex gap-4 items-start">
                          <div className="rounded-full bg-primary/20 p-3 text-primary">
                            <Users className="h-6 w-6" />
                          </div>
                          <div className="w-full">
                            <h4 className="text-lg font-semibold text-gray-800 mb-2">Import Team Members</h4>
                            <p className="text-gray-600 mb-4">
                              The fastest way to set up your organization is to import your team using a CSV file. 
                              Download the template, fill it with your team data, and upload it here.
                            </p>
                            
                            <CSVImport 
                              templateFields={["email", "name", "role", "department"]}
                              templateName="Team Members"
                              onImport={(data) => {
                                // Format the imported data to match the form structure
                                const formattedUsers = data.map((user: any) => ({
                                  email: user.email,
                                  role: user.role?.toLowerCase() || "member",
                                  selected: true,
                                  name: user.name,
                                  department: user.department
                                }));
                                
                                // Add the imported users to the form
                                const currentUsers = form.getValues("team.users") || [];
                                const mergedUsers = [...currentUsers];
                                
                                // Add only users that don't already exist in the form
                                formattedUsers.forEach(newUser => {
                                  const existingIndex = mergedUsers.findIndex(
                                    (u: any) => u.email === newUser.email
                                  );
                                  
                                  if (existingIndex >= 0) {
                                    // Update existing user
                                    mergedUsers[existingIndex] = {
                                      ...mergedUsers[existingIndex],
                                      ...newUser
                                    };
                                  } else {
                                    // Add new user
                                    mergedUsers.push(newUser);
                                  }
                                });
                                
                                // Update the form with the new users
                                form.setValue("team.users", mergedUsers);
                                
                                // Show success toast
                                toast({
                                  title: "Team members imported",
                                  description: `Successfully imported ${formattedUsers.length} team members.`,
                                  variant: "default"
                                });
                              }}
                            />
                            
                            {/* Show imported users count if any */}
                            {form.getValues("team.users")?.length > 0 && (
                              <div className="mt-4 bg-green-50 text-green-700 px-4 py-2 rounded border border-green-200 flex items-center">
                                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                                <span className="font-medium">
                                  {form.getValues("team.users").length} team members added
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Invite team members via email */}
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
                    
                      <div className="space-y-6">
                        <div className="space-y-4">
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
                        
                        {/* Import OKRs via CSV */}
                        <div className="border border-emerald-100 rounded-lg bg-emerald-50/50 p-4">
                          <div className="flex gap-3 items-start">
                            <div className="rounded-full bg-emerald-100 p-2 text-emerald-600 mt-0.5">
                              <FileUp className="h-4 w-4" />
                            </div>
                            <div className="w-full">
                              <h4 className="text-sm font-semibold text-emerald-800 mb-1">Import OKRs from CSV</h4>
                              <p className="text-sm text-emerald-700 mb-3">
                                Import your existing objectives and key results from a CSV file
                              </p>
                              
                              <CSVImport 
                                templateFields={["objective_title", "objective_description", "key_result_title", "key_result_description", "key_result_start_value", "key_result_target_value"]}
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