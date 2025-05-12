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
  Users,
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

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

// Form validation schema using Zod
const formSchema = z.object({
  setup: z.object({
    createInitialOKRs: z.boolean().default(false),
    template: z.string().optional(),
  }),
});

export default function TenantOnboardingStep4Demo() {
  const [step, setStep] = useState(4); // For demo, always show step 4
  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;
  
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  // Form setup with default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      setup: {
        createInitialOKRs: false,
        template: "",
      }
    },
  });
  
  // Simulate form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    toast({
      title: "Form Submitted",
      description: `Template selected: ${values.setup.template || "None"}`,
    });
  };
  
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
                  
                  {/* Navigation buttons */}
                  <div className="flex justify-between mt-8">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(Math.max(1, step - 1))}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    
                    <Button type="submit">
                      Create Organization
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}