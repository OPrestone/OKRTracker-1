import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { Loader2, BookOpen, Lightbulb, ShieldCheck, Compass, UserSquare } from "lucide-react";

// Form validation schema
const missionSchema = z.object({
  mission: z.string().min(1, { message: "Mission statement is required" }),
  vision: z.string().min(1, { message: "Vision is required" }),
  boundaries: z.string().optional(),
  strategicDirection: z.string().optional(),
  behaviors: z.string().optional(),
  tenantId: z.string()
});

type MissionFormValues = z.infer<typeof missionSchema>;

export default function MissionPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("mission");
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    // Check if user has admin rights for this tenant
    if (user?.tenants) {
      const tenant = user.tenants.find(t => t.id === id);
      setIsAdmin(tenant?.userRole === 'admin' || tenant?.userRole === 'owner');
    }
  }, [user, id]);
  
  // Fetch mission data
  const { data: missionData, isLoading } = useQuery({
    queryKey: ['/api/mission', id],
    queryFn: () => apiRequest(`/api/mission/${id}`),
    enabled: !!id
  });
  
  // Form setup
  const form = useForm<MissionFormValues>({
    resolver: zodResolver(missionSchema),
    defaultValues: {
      mission: "",
      vision: "",
      boundaries: "",
      strategicDirection: "",
      behaviors: "",
      tenantId: id || ""
    }
  });
  
  // Update form when mission data is loaded
  useEffect(() => {
    if (missionData) {
      form.reset({
        mission: missionData.mission || "",
        vision: missionData.vision || "",
        boundaries: missionData.boundaries || "",
        strategicDirection: missionData.strategicDirection || "",
        behaviors: missionData.behaviors || "",
        tenantId: id || ""
      });
    }
  }, [missionData, form, id]);
  
  // Save mission data
  const saveMission = useMutation({
    mutationFn: (values: MissionFormValues) => {
      return apiRequest('/api/mission', {
        method: 'POST',
        body: JSON.stringify(values)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mission', id] });
      toast({
        title: "Success",
        description: "Organization mission information updated successfully",
        variant: "default"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update mission information. Please try again.",
        variant: "destructive"
      });
      console.error("Error saving mission:", error);
    }
  });
  
  function onSubmit(values: MissionFormValues) {
    saveMission.mutate(values);
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading organization mission...</span>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink href={`/${id}`}>Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink href={`/${id}/configuration`}>Settings</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>Organization Mission</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Organization Mission</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Organization Purpose and Direction</CardTitle>
          <CardDescription>
            Define your organization's purpose, vision, boundaries, strategic direction, and expected behaviors.
            These core elements will guide your team toward shared goals and values.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 mb-8">
              <TabsTrigger value="mission" className="flex items-center">
                <BookOpen className="w-4 h-4 mr-2" />
                Mission
              </TabsTrigger>
              <TabsTrigger value="vision" className="flex items-center">
                <Lightbulb className="w-4 h-4 mr-2" />
                Vision
              </TabsTrigger>
              <TabsTrigger value="boundaries" className="flex items-center">
                <ShieldCheck className="w-4 h-4 mr-2" />
                Boundaries
              </TabsTrigger>
              <TabsTrigger value="strategic" className="flex items-center">
                <Compass className="w-4 h-4 mr-2" />
                Strategy
              </TabsTrigger>
              <TabsTrigger value="behaviors" className="flex items-center">
                <UserSquare className="w-4 h-4 mr-2" />
                Behaviors
              </TabsTrigger>
            </TabsList>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <TabsContent value="mission">
                  <FormField
                    control={form.control}
                    name="mission"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mission Statement</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What is your organization's core purpose?"
                            className="min-h-[200px]"
                            {...field}
                            disabled={!isAdmin}
                          />
                        </FormControl>
                        <FormDescription>
                          Your mission statement defines why your organization exists and its primary purpose.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <TabsContent value="vision">
                  <FormField
                    control={form.control}
                    name="vision"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vision Statement</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What does your organization aspire to become or achieve?"
                            className="min-h-[200px]"
                            {...field}
                            disabled={!isAdmin}
                          />
                        </FormControl>
                        <FormDescription>
                          Your vision describes the future state your organization strives to create.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <TabsContent value="boundaries">
                  <FormField
                    control={form.control}
                    name="boundaries"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organizational Boundaries</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What are the limits and constraints your organization operates within?"
                            className="min-h-[200px]"
                            {...field}
                            disabled={!isAdmin}
                          />
                        </FormControl>
                        <FormDescription>
                          Boundaries define what your organization will and won't do, creating clarity and focus.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <TabsContent value="strategic">
                  <FormField
                    control={form.control}
                    name="strategicDirection"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Strategic Direction</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What are the key strategic paths your organization will pursue?"
                            className="min-h-[200px]"
                            {...field}
                            disabled={!isAdmin}
                          />
                        </FormControl>
                        <FormDescription>
                          Strategic direction outlines the approach and priorities that will guide your organization toward its vision.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <TabsContent value="behaviors">
                  <FormField
                    control={form.control}
                    name="behaviors"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Behaviors</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What behaviors and values should people demonstrate?"
                            className="min-h-[200px]"
                            {...field}
                            disabled={!isAdmin}
                          />
                        </FormControl>
                        <FormDescription>
                          Expected behaviors define how team members should act to embody your organization's values.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                {isAdmin && (
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={saveMission.isPending}
                      className="mt-4"
                    >
                      {saveMission.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                  </div>
                )}
              </form>
            </Form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}