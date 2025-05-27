import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTenantContext } from "@/hooks/use-tenant-context";

interface KeyResult {
  id: string;
  title: string;
  description?: string;
  current_value?: string;
  target_value?: string;
  start_value?: string;
  progress?: number;
  assigned_to_id?: string;
  objective_id: string;
  status?: string;
  tenant_id?: string;
  created_at?: string;
}

interface DraftObjective {
  id: string;
  title: string;
  description: string;
  status: string;
  level: string;
  tenant_id: string;
  created_at?: string;
  timeframe_id?: string;
  owner_id?: string;
  keyResults: KeyResult[];
}

interface AIAnalysis {
  overall: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  improvedObjective: {
    title: string;
    description: string;
    keyResults: string[];
  };
}

const mockAIAnalysis: AIAnalysis = {
  overall: "This objective is fairly good but has room for improvement in specificity and measurement.",
  strengths: [
    "Good alignment with company mission",
    "Clear timeframe implied",
    "Addresses important business area"
  ],
  weaknesses: [
    "Key Results could be more specific",
    "Missing baseline measurements in some Key Results",
    "Objective scope may be too broad for a single quarter"
  ],
  suggestions: [
    "Add specific metrics to Key Results",
    "Narrow the objective scope",
    "Include more precise timeframes"
  ],
  improvedObjective: {
    title: "Increase customer engagement and retention rate by 20% in Q2 2023",
    description: "Improve customer experience and strengthen loyalty to reduce churn and increase customer lifetime value, focusing on personalization and response time.",
    keyResults: [
      "Reduce average customer service response time from 6 hours to 2 hours",
      "Increase NPS score from 32 to 45",
      "Improve product engagement metrics by 25% as measured by daily active usage"
    ]
  }
};

export default function DraftOKRs() {
  const { toast } = useToast();
  const { currentTenant } = useTenantContext();
  const [_, navigate] = useLocation();
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<DraftObjective | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  
  const [newDraftData, setNewDraftData] = useState({
    id: "", // Adding id property to fix LSP error
    title: "",
    description: "",
    keyResults: [{ id: "", title: "", objective_id: "" }]
  });
  
  const [editDraftData, setEditDraftData] = useState({
    id: "",
    title: "",
    description: "",
    keyResults: [{ id: "", title: "", objective_id: "" }]
  });
  
  // Fetch draft objectives
  const { data: draftObjectives, isLoading, error } = useQuery<DraftObjective[]>({
    queryKey: ["/api/objectives", "draft", currentTenant?.id],
    queryFn: async () => {
      // First let's get the tenant ID from context or URL
      let tenantId = '';
      
      if (currentTenant) {
        // If tenant context is available, use it
        tenantId = currentTenant.id;
        console.log("Using tenant from context:", tenantId);
      } else {
        // If no tenant in context, check URL pattern for tenant ID
        const ulidMatch = location.pathname.match(/^\/([A-Z0-9]{26})/);
        
        if (ulidMatch) {
          tenantId = ulidMatch[1];
          console.log("Using tenant from URL path:", tenantId);
          // Store the tenant ID for future use
          sessionStorage.setItem('currentTenantId', tenantId);
        } else {
          // Fallback to session storage
          const storedTenantId = sessionStorage.getItem('currentTenantId');
          if (storedTenantId) {
            tenantId = storedTenantId;
            console.log("Using tenant from session storage:", tenantId);
          }
        }
      }
      
      if (!tenantId) {
        throw new Error("No tenant ID found. Please select an organization first.");
      }
      
      // Make API request with proper tenant ID in headers
      const response = await apiRequest("GET", `/api/my-objectives?tenantId=${tenantId}`);
      
      console.log(`Fetching my objectives for tenant: ${tenantId}`);
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Access denied. You don't have permission to view these objectives.");
        }
        throw new Error(`Failed to fetch draft objectives: ${response.statusText}`);
      }
      
      const objectives = await response.json();
      
      // Filter to only show objectives with "draft" status
      const draftOnlyObjectives = objectives.filter((objective: DraftObjective) => 
        objective.status === 'draft'
      );
      
      // Ensure each objective has a keyResults array
      return draftOnlyObjectives.map((objective: DraftObjective) => ({
        ...objective,
        keyResults: objective.keyResults || []
      }));
    },
    retry: 1
  });

  const handleEdit = (objective: DraftObjective) => {
    setSelectedObjective(objective);
    setEditDraftData({
      id: objective.id,
      title: objective.title,
      description: objective.description,
      keyResults: objective.keyResults.length > 0 
        ? objective.keyResults.map(kr => ({
          id: kr.id,
          title: kr.title,
          objective_id: kr.objective_id
        }))
        : [{ id: "", title: "", objective_id: objective.id }]
    });
    setEditDialogOpen(true);
  };

  const handleAIReview = (objective: DraftObjective) => {
    setSelectedObjective(objective);
    setAnalyzing(true);
    setAiDialogOpen(true);
    
    // Make an API call to get AI analysis
    apiRequest("POST", "/api/objectives/analyze", { objective })
      .then(response => response.json())
      .then(analysis => {
        setAnalyzing(false);
        setAiAnalysis(analysis);
      })
      .catch(error => {
        setAnalyzing(false);
        // Fallback to mock data for now until the API endpoint is fully implemented
        setAiAnalysis(mockAIAnalysis);
        
        toast({
          title: "Analysis Warning",
          description: "Using local analysis engine. Remote analysis unavailable.",
          variant: "destructive"
        });
      });
  };

  const handleSubmit = (objective: DraftObjective) => {
    setSelectedObjective(objective);
    setSubmitDialogOpen(true);
  };

  const handleApplySuggestions = async () => {
    if (!selectedObjective || !aiAnalysis) return;

    try {
      // Update the objective with AI suggestions
      const updatedObjective = {
        ...selectedObjective,
        title: aiAnalysis.improvedObjective.title,
        description: aiAnalysis.improvedObjective.description,
        keyResults: aiAnalysis.improvedObjective.keyResults.map((krTitle, index) => ({
          id: selectedObjective.keyResults[index]?.id || `new-${index}`,
          title: krTitle,
          objective_id: selectedObjective.id,
          description: "",
          progress: 0
        }))
      };

      // Save the updated objective to the database
      const response = await apiRequest("PUT", `/api/objectives/${selectedObjective.id}`, updatedObjective);
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "OKR updated with AI suggestions successfully!",
        });
        
        // Refresh the data
        queryClient.invalidateQueries({ queryKey: ["/api/objectives", "draft", currentTenant?.id] });
        
        // Close the AI dialog
        setAiDialogOpen(false);
        setAiAnalysis(null);
      } else {
        throw new Error("Failed to update objective");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply AI suggestions. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSubmitConfirm = () => {
    if (!selectedObjective) return;

    setSubmitting(true);
    
    // Prepare the updated objective with active status
    const updatedObjective = {
      ...selectedObjective,
      status: "active" // Change from draft to active
    };
    
    // Make an API call to update the objective status
    apiRequest("PATCH", `/api/objectives/${selectedObjective.id}`, { status: "active" })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(updatedObj => {
        setSubmitting(false);
        setSubmitDialogOpen(false);
        
        // Optimistically update the UI by removing the objective from the draft list
        if (draftObjectives && Array.isArray(draftObjectives)) {
          queryClient.setQueryData(["/api/objectives", "draft"], 
            draftObjectives.filter(obj => obj.id !== selectedObjective.id)
          );
        }
        
        toast({
          title: "OKR Submitted",
          description: "Your objective has been submitted for approval and is now active.",
        });
        
        // Also invalidate active objectives query if it exists
        queryClient.invalidateQueries({ queryKey: ["/api/objectives", "active"] });
        
        // Invalidate the draft objectives query to refetch in the background
        queryClient.invalidateQueries({ queryKey: ["/api/objectives", "draft"] });
      })
      .catch(error => {
        setSubmitting(false);
        console.error("Error submitting OKR:", error);
        
        toast({
          title: "Error",
          description: `Failed to submit OKR: ${error.message}`,
          variant: "destructive"
        });
      });
  };

  const handleNewDraft = () => {
    // Reset the form data
    setNewDraftData({
      id: "", // Include id property to prevent type error
      title: "",
      description: "",
      keyResults: [{ id: "", title: "", objective_id: "" }]
    });
    
    setCreateDialogOpen(true);
  };
  
  const handleAddNewKeyResult = () => {
    setNewDraftData(prev => ({
      ...prev,
      keyResults: [...prev.keyResults, { 
        id: "", 
        title: "", 
        objective_id: prev.id, // Now the id property exists
        start_value: "0",
        current_value: "0",
        target_value: "100",
        progress: 0,
        status: "not_started"
      }]
    }));
  };
  
  const handleAddEditKeyResult = () => {
    setEditDraftData(prev => {
      // Make sure prev.id is available and not empty
      if (!prev.id) {
        console.warn("No objective ID available for key result");
      }
      
      return {
        ...prev,
        keyResults: [...prev.keyResults, { 
          id: "", 
          title: "", 
          objective_id: prev.id, // This should always have the parent objective's ID
          start_value: "0",
          current_value: "0",
          target_value: "100",
          progress: 0,
          status: "not_started" 
        }]
      };
    });
  };
  
  const handleNewDraftKeyResultChange = (id: string, field: string, value: string) => {
    setNewDraftData(prev => ({
      ...prev,
      keyResults: prev.keyResults.map((kr, index) => 
        kr.id === id || (kr.id === "" && id === String(index))
          ? { ...kr, [field]: value } 
          : kr
      )
    }));
  };
  
  const handleEditDraftKeyResultChange = (id: string, field: string, value: string) => {
    setEditDraftData(prev => ({
      ...prev,
      keyResults: prev.keyResults.map((kr, index) => 
        kr.id === id || (kr.id === "" && id === String(index)) 
          ? { ...kr, [field]: value } 
          : kr
      )
    }));
  };
  
  const handleRemoveNewKeyResult = (index: number) => {
    if (newDraftData.keyResults.length <= 1) {
      toast({
        title: "Cannot Remove",
        description: "You need at least one key result.",
        variant: "destructive"
      });
      return;
    }
    
    setNewDraftData(prev => ({
      ...prev,
      keyResults: prev.keyResults.filter((_, i) => i !== index)
    }));
  };
  
  const handleRemoveEditKeyResult = (index: number) => {
    if (editDraftData.keyResults.length <= 1) {
      toast({
        title: "Cannot Remove",
        description: "You need at least one key result.",
        variant: "destructive"
      });
      return;
    }
    
    setEditDraftData(prev => ({
      ...prev,
      keyResults: prev.keyResults.filter((_, i) => i !== index)
    }));
  };
  
  const handleUpdateDraft = () => {
    // Validate the form data
    if (!editDraftData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Objective title is required.",
        variant: "destructive"
      });
      return;
    }

    if (editDraftData.keyResults.some(kr => !kr.title.trim())) {
      toast({
        title: "Validation Error",
        description: "All key results must have a title.",
        variant: "destructive"
      });
      return;
    }
    
    setCreating(true);
    
    // Prepare the keyResults data, ensuring all key results have objective_id
    const preparedKeyResults = editDraftData.keyResults.map(kr => ({
      ...kr,
      title: kr.title.trim(),
      objective_id: editDraftData.id,
      // For new key results (no ID), we don't include an ID so the server assigns one
      ...(kr.id ? { id: kr.id } : {})
    }));
    
    // Make API call to update the draft objective
    apiRequest("PATCH", `/api/objectives/${editDraftData.id}`, {
      title: editDraftData.title,
      description: editDraftData.description,
      status: "draft", // Ensure it maintains draft status
      keyResults: preparedKeyResults
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(updatedObjective => {
        setCreating(false);
        setEditDialogOpen(false);
        
        // Optimistically update the local UI data
        if (draftObjectives && Array.isArray(draftObjectives)) {
          // Update the client-side cache immediately for instant UI update
          queryClient.setQueryData(["/api/objectives", "draft"], 
            draftObjectives.map(obj => 
              obj.id === updatedObjective.id ? updatedObjective : obj
            )
          );
        }
        
        toast({
          title: "Draft Updated",
          description: "Your draft objective has been updated successfully.",
        });
        
        // Invalidate the query cache to refetch the data in the background
        queryClient.invalidateQueries({ queryKey: ["/api/objectives", "draft"] });
      })
      .catch(error => {
        setCreating(false);
        console.error("Error updating draft:", error);
        
        toast({
          title: "Error",
          description: `Failed to update draft: ${error.message}`,
          variant: "destructive"
        });
      });
  };
  
  const handleCreateDraft = () => {
    // Validate the form data
    if (!newDraftData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Objective title is required.",
        variant: "destructive"
      });
      return;
    }

    if (newDraftData.keyResults.some(kr => !kr.title.trim())) {
      toast({
        title: "Validation Error",
        description: "All key results must have a title.",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);
    
    // Get tenant ID from the tenant context, URL, or session storage
    let tenantId = '';
    
    if (currentTenant) {
      tenantId = currentTenant.id;
    } else {
      // If no tenant in context, check URL pattern for tenant ID
      const ulidMatch = location.pathname.match(/^\/([A-Z0-9]{26})/);
      
      if (ulidMatch) {
        tenantId = ulidMatch[1];
      } else {
        // Fallback to session storage
        tenantId = sessionStorage.getItem('currentTenantId') || '';
      }
    }
    
    if (!tenantId) {
      toast({
        title: "Error",
        description: "No tenant ID found. Please select an organization first.",
        variant: "destructive"
      });
      setCreating(false);
      return;
    }
    
    // Prepare the new objective data
    const newObjective = {
      title: newDraftData.title,
      description: newDraftData.description,
      status: "draft",
      level: "company", // Default level
      tenant_id: tenantId,
      keyResults: newDraftData.keyResults.map(kr => ({
        ...kr,
        title: kr.title.trim(),
        // For new key results, the objective_id will be set by the server
        // after the objective is created
        objective_id: undefined 
      }))
    };
    
    // Make an API call to create the draft objective
    apiRequest("POST", "/api/objectives", newObjective)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(createdObjective => {
        setCreating(false);
        setCreateDialogOpen(false);
        
        // Optimistically update the UI with the new objective
        if (draftObjectives && Array.isArray(draftObjectives)) {
          // Update the client-side cache immediately
          queryClient.setQueryData(["/api/objectives", "draft"], 
            [...draftObjectives, createdObjective]
          );
        }
        
        toast({
          title: "Draft Created",
          description: "Your draft objective has been created successfully.",
        });
        
        // Reset the form data
        setNewDraftData({
          id: "", // Include id property to fix LSP error
          title: "",
          description: "",
          keyResults: [{ id: "", title: "", objective_id: "" }]
        });
        
        // Invalidate the query cache to refetch the data in the background
        queryClient.invalidateQueries({ queryKey: ["/api/objectives", "draft"] });
      })
      .catch(error => {
        setCreating(false);
        console.error("Error creating draft:", error);
        
        toast({
          title: "Error",
          description: `Failed to create draft: ${error.message}`,
          variant: "destructive"
        });
      });
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Draft OKRs</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage objective drafts before finalizing them.
          </p>
        </div>
        <Button onClick={handleNewDraft}>
          <Plus className="mr-2 h-4 w-4" />
          New Draft
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card className="border-destructive shadow-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{(error as Error).message || "Failed to load draft objectives. Please try again later."}</p>
            <Button variant="outline" className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/objectives", "draft"] })}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : draftObjectives && draftObjectives.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {draftObjectives.map((objective) => (
            <Card 
              key={objective.id} 
              className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={(e) => {
                // Prevent navigation if clicking on buttons inside the card
                if ((e.target as HTMLElement).closest('button')) return;
                navigate(`/objective/${objective.id}`);
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-semibold">{objective.title}</CardTitle>
                  <Badge variant="secondary" className="ml-2">Draft</Badge>
                </div>
                {objective.description && (
                  <CardDescription className="mt-2 line-clamp-2">
                    {objective.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pb-2">
                <h4 className="text-sm font-medium mb-2">Key Results</h4>
                {objective.keyResults && objective.keyResults.length > 0 ? (
                  <ul className="space-y-2 list-disc pl-5">
                    {objective.keyResults.slice(0, 3).map((keyResult) => (
                      <li key={keyResult.id} className="text-sm text-muted-foreground">
                        {keyResult.title}
                      </li>
                    ))}
                    {objective.keyResults.length > 3 && (
                      <li className="text-sm text-muted-foreground">
                        +{objective.keyResults.length - 3} more key results
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No key results defined</p>
                )}
              </CardContent>
              <CardFooter className="pt-2 flex justify-between">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(objective)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleAIReview(objective)}>
                    <Sparkles className="h-4 w-4 mr-1" />
                    AI Review
                  </Button>
                </div>
                <Button variant="default" size="sm" onClick={() => handleSubmit(objective)}>
                  Submit
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-sm bg-muted/40">
          <CardHeader>
            <CardTitle>No Draft OKRs</CardTitle>
            <CardDescription>
              You haven't created any draft objectives yet. Create a new draft to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleNewDraft}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Draft
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Create Draft Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Draft OKR</DialogTitle>
            <DialogDescription>
              Draft your objective and key results before submitting them for approval.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="grid gap-3">
              <Label htmlFor="title">Objective Title</Label>
              <Input
                id="title"
                placeholder="Enter a clear, motivating objective..."
                value={newDraftData.title}
                onChange={(e) => setNewDraftData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            
            <div className="grid gap-3">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Provide context and details about this objective..."
                value={newDraftData.description}
                onChange={(e) => setNewDraftData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Key Results</Label>
                <Button variant="outline" size="sm" onClick={handleAddNewKeyResult}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Key Result
                </Button>
              </div>
              
              <div className="space-y-4">
                {newDraftData.keyResults.map((keyResult, index) => (
                  <div key={index} className="grid gap-3 border rounded-md p-4 relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={() => handleRemoveNewKeyResult(index)}
                    >
                      <span className="sr-only">Remove</span>
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                        <path d="M12.8536 2.85355C13.0488 2.65829 13.0488 2.34171 12.8536 2.14645C12.6583 1.95118 12.3417 1.95118 12.1464 2.14645L7.5 6.79289L2.85355 2.14645C2.65829 1.95118 2.34171 1.95118 2.14645 2.14645C1.95118 2.34171 1.95118 2.65829 2.14645 2.85355L6.79289 7.5L2.14645 12.1464C1.95118 12.3417 1.95118 12.6583 2.14645 12.8536C2.34171 13.0488 2.65829 13.0488 2.85355 12.8536L7.5 8.20711L12.1464 12.8536C12.3417 13.0488 12.6583 13.0488 12.8536 12.8536C13.0488 12.6583 13.0488 12.3417 12.8536 12.1464L8.20711 7.5L12.8536 2.85355Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                      </svg>
                    </Button>
                    
                    <div className="grid gap-2">
                      <Label htmlFor={`kr-title-${index}`}>Key Result {index + 1}</Label>
                      <Input
                        id={`kr-title-${index}`}
                        placeholder="Enter a measurable key result..."
                        value={keyResult.title}
                        onChange={(e) => handleNewDraftKeyResultChange(String(index), "title", e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDraft} disabled={creating}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {creating ? "Creating..." : "Create Draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Draft Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Draft OKR</DialogTitle>
            <DialogDescription>
              Update your objective and key results before finalizing.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="grid gap-3">
              <Label htmlFor="edit-title">Objective Title</Label>
              <Input
                id="edit-title"
                placeholder="Enter a clear, motivating objective..."
                value={editDraftData.title}
                onChange={(e) => setEditDraftData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            
            <div className="grid gap-3">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Provide context and details about this objective..."
                value={editDraftData.description}
                onChange={(e) => setEditDraftData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Key Results</Label>
                <Button variant="outline" size="sm" onClick={handleAddEditKeyResult}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Key Result
                </Button>
              </div>
              
              <div className="space-y-4">
                {editDraftData.keyResults.map((keyResult, index) => (
                  <div key={keyResult.id || index} className="grid gap-3 border rounded-md p-4 relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={() => handleRemoveEditKeyResult(index)}
                    >
                      <span className="sr-only">Remove</span>
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                        <path d="M12.8536 2.85355C13.0488 2.65829 13.0488 2.34171 12.8536 2.14645C12.6583 1.95118 12.3417 1.95118 12.1464 2.14645L7.5 6.79289L2.85355 2.14645C2.65829 1.95118 2.34171 1.95118 2.14645 2.14645C1.95118 2.34171 1.95118 2.65829 2.14645 2.85355L6.79289 7.5L2.14645 12.1464C1.95118 12.3417 1.95118 12.6583 2.14645 12.8536C2.34171 13.0488 2.65829 13.0488 2.85355 12.8536L7.5 8.20711L12.1464 12.8536C12.3417 13.0488 12.6583 13.0488 12.8536 12.8536C13.0488 12.6583 13.0488 12.3417 12.8536 12.1464L8.20711 7.5L12.8536 2.85355Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                      </svg>
                    </Button>
                    
                    <div className="grid gap-2">
                      <Label htmlFor={`edit-kr-title-${index}`}>Key Result {index + 1}</Label>
                      <Input
                        id={`edit-kr-title-${index}`}
                        placeholder="Enter a measurable key result..."
                        value={keyResult.title}
                        onChange={(e) => handleEditDraftKeyResultChange(keyResult.id || String(index), "title", e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateDraft} disabled={creating}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {creating ? "Updating..." : "Update Draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Review Dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>AI Review of Your Objective</DialogTitle>
            <DialogDescription>
              Get AI-powered feedback to improve your OKR quality and effectiveness.
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-auto max-h-[calc(80vh-200px)]">
            {analyzing ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Analyzing your objective with AI...</p>
              </div>
            ) : aiAnalysis ? (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Overall Assessment</h3>
                  <p className="text-muted-foreground">{aiAnalysis.overall}</p>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold text-lg mb-2 flex items-center">
                      <span className="text-green-500 mr-2">✓</span> Strengths
                    </h3>
                    <ul className="space-y-2 list-disc pl-5">
                      {aiAnalysis.strengths.map((item, index) => (
                        <li key={index} className="text-muted-foreground">{item}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg mb-2 flex items-center">
                      <span className="text-red-500 mr-2">!</span> Areas to Improve
                    </h3>
                    <ul className="space-y-2 list-disc pl-5">
                      {aiAnalysis.weaknesses.map((item, index) => (
                        <li key={index} className="text-muted-foreground">{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-semibold text-lg mb-4">Suggested Improvements</h3>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium uppercase text-muted-foreground mb-2">Suggestions</h4>
                    <ul className="space-y-2 list-disc pl-5">
                      {aiAnalysis.suggestions.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                      <CardTitle className="text-base">Improved OKR Version</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Objective</h4>
                        <p className="text-primary font-medium">{aiAnalysis.improvedObjective.title}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1">Description</h4>
                        <p className="text-muted-foreground text-sm">{aiAnalysis.improvedObjective.description}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1">Key Results</h4>
                        <ul className="space-y-2 list-disc pl-5">
                          {aiAnalysis.improvedObjective.keyResults.map((item, index) => (
                            <li key={index} className="text-sm">{item}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="bg-muted/30 p-8 rounded-lg text-center">
                <p className="text-muted-foreground">No analysis available</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAiDialogOpen(false)}>
              Close
            </Button>
            {aiAnalysis && !analyzing && (
              <Button onClick={handleApplySuggestions} className="bg-primary text-white hover:bg-primary/90">
                <Sparkles className="h-4 w-4 mr-2" />
                Apply Suggestions
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit OKR Dialog */}
      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit OKR</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit this OKR? Once submitted, it will become active and visible to your organization.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-muted-foreground mb-4">
              This will change the status from "draft" to "active".
            </p>
            
            {selectedObjective && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {selectedObjective.title || "Untitled Objective"}
                  </CardTitle>
                </CardHeader>
                {selectedObjective.keyResults && Array.isArray(selectedObjective.keyResults) && selectedObjective.keyResults.length > 0 && (
                  <CardContent>
                    <h4 className="text-sm font-medium mb-2">Key Results</h4>
                    <ul className="list-disc pl-5 space-y-2">
                      {selectedObjective.keyResults.map((kr, i) => (
                        <li key={kr.id || i} className="text-sm">{kr.title || "Untitled Key Result"}</li>
                      ))}
                    </ul>
                  </CardContent>
                )}
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitConfirm} 
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? "Submitting..." : "Submit OKR"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}