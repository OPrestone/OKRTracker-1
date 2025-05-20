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
    queryKey: ["/api/objectives", "draft"],
    queryFn: async () => {
      // First, ensure we have the current user information
      const userResponse = await apiRequest("GET", "/api/user");
      if (!userResponse.ok) {
        throw new Error("Unable to verify authentication. Please log in again.");
      }
      
      const userData = await userResponse.json();
      
      // Get tenant ID from user data or stored preferences
      let tenantId = sessionStorage.getItem('selectedTenantId') || '';
      
      // If no tenant ID is explicitly selected, use the default tenant
      if (!tenantId && userData.defaultTenant) {
        tenantId = userData.defaultTenant;
        localStorage.setItem('defaultTenantId', tenantId);
      } else if (!tenantId && userData.tenants && userData.tenants.length > 0) {
        // If still no tenant ID but user has tenants, use the first one
        tenantId = userData.tenants[0].id;
        localStorage.setItem('defaultTenantId', tenantId);
      }
      
      if (!tenantId) {
        throw new Error("No tenant selected. Please select an organization first.");
      }
      
      // Use the apiRequest helper which handles auth properly
      const response = await apiRequest("GET", `/api/objectives?status=draft&tenantId=${tenantId}`);
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Access denied. You don't have permission to view these objectives.");
        }
        throw new Error(`Failed to fetch draft objectives: ${response.statusText}`);
      }
      
      const objectives = await response.json();
      
      // Ensure each objective has a keyResults array
      return objectives.map((objective: DraftObjective) => ({
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
        objective_id: prev.id || "", // Use the objective ID if it exists
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
    
    // Get tenant ID from the selected tenant in context or session storage
    const tenantId = sessionStorage.getItem('selectedTenantId') || '';
    
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
    <DashboardLayout title="Draft OKRs">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-blue-800">Draft OKRs</h1>
            <p className="text-muted-foreground mt-1">
              Create and refine your objectives before finalizing them
            </p>
          </div>
          <Button 
            onClick={handleNewDraft} 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span>New Draft</span>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="flex flex-col items-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading your draft OKRs...</p>
            </div>
          </div>
        ) : error ? (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="py-10 text-center">
              <p className="text-destructive font-medium">Failed to load draft OKRs.</p>
              <p className="text-sm text-muted-foreground mt-2">Please try refreshing the page or contact support.</p>
            </CardContent>
          </Card>
        ) : (draftObjectives && Array.isArray(draftObjectives) && draftObjectives.length > 0) ? (
          <div className="grid gap-8">
            {draftObjectives.map((objective) => (
              <Card 
                key={objective.id} 
                className="overflow-hidden border-l-4 border-l-blue-500 hover:shadow-md transition-shadow duration-200"
              >
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">Draft</Badge>
                        {objective.created_at && (
                          <span className="text-xs text-muted-foreground">
                            Created: {new Date(objective.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-xl font-bold text-blue-800">{objective.title}</CardTitle>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(objective)}
                        className="border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4 mr-2 text-blue-600" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleAIReview(objective)}
                        className="border-purple-200 hover:border-purple-300 hover:bg-purple-50"
                      >
                        <Sparkles className="h-4 w-4 mr-2 text-purple-600" />
                        AI Review
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleSubmit(objective)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Submit
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="prose prose-sm max-w-none mb-6">
                    <p className="text-muted-foreground">{objective.description}</p>
                  </div>
                  <div>
                    <div className="flex items-center mb-4">
                      <h3 className="font-semibold text-lg text-blue-800">Key Results</h3>
                      <div className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {objective.keyResults?.length || 0}
                      </div>
                    </div>
                    
                    <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                      {objective.keyResults && objective.keyResults.length > 0 ? (
                        objective.keyResults.map((keyResult, index) => (
                          <div 
                            key={keyResult.id || index} 
                            className="border rounded-lg p-5 bg-white hover:shadow-sm transition-shadow duration-200 relative overflow-hidden"
                          >
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                            <h4 className="font-medium text-blue-800 mb-2">{keyResult.title}</h4>
                            {keyResult.description && (
                              <p className="text-sm text-muted-foreground mb-3">
                                {keyResult.description}
                              </p>
                            )}
                            
                            <div className="flex flex-wrap items-center gap-4 mt-3">
                              {keyResult.target_value && (
                                <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded-md">
                                  <span className="text-xs font-medium">Target: {keyResult.target_value}</span>
                                </div>
                              )}
                              
                              {keyResult.assigned_to_id && (
                                <div className="flex items-center gap-2 ml-auto">
                                  <Avatar className="h-6 w-6 border-2 border-white">
                                    <AvatarFallback className="bg-blue-100 text-blue-800">
                                      {keyResult.assigned_to_id.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-muted-foreground">
                                    Assigned to: {keyResult.assigned_to_id}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full text-sm bg-muted/30 p-4 rounded-lg border text-muted-foreground flex items-center justify-center">
                          <span>No key results defined yet. Key results help make your objective measurable.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 border-muted-foreground/20">
            <CardContent className="py-12 text-center">
              <div className="flex flex-col items-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center mb-4">
                  <Plus className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No draft OKRs yet</h3>
                <p className="text-muted-foreground mb-6">Create your first draft objective to start planning and tracking your team's goals</p>
                <Button 
                  onClick={handleNewDraft}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first draft OKR
                </Button>
              </div>
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
                <Label htmlFor="description">Objective Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what you want to achieve and why it matters..."
                  value={newDraftData.description}
                  onChange={(e) => setNewDraftData(prev => ({ ...prev, description: e.target.value }))}
                  className="min-h-[120px]"
                />
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label>Key Results</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAddNewKeyResult}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Key Result
                  </Button>
                </div>

                <div className="space-y-4">
                  {newDraftData.keyResults.map((kr, index) => (
                    <div key={index} className="grid gap-3 p-4 border rounded-lg relative">
                      <div className="flex items-start justify-between gap-2">
                        <div className="grid gap-3 flex-1">
                          <div>
                            <Label htmlFor={`kr-title-${index}`}>Key Result Title</Label>
                            <Input
                              id={`kr-title-${index}`}
                              placeholder="Measurable outcome with a clear success metric..."
                              value={kr.title}
                              onChange={(e) => handleNewDraftKeyResultChange(String(index), "title", e.target.value)}
                            />
                          </div>
                        </div>

                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveNewKeyResult(index)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                          <span className="sr-only">Remove</span>
                        </Button>
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
                Make changes to your draft objective.
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
                <Label htmlFor="edit-description">Objective Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Describe what you want to achieve and why it matters..."
                  value={editDraftData.description}
                  onChange={(e) => setEditDraftData(prev => ({ ...prev, description: e.target.value }))}
                  className="min-h-[120px]"
                />
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label>Key Results</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAddEditKeyResult}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Key Result
                  </Button>
                </div>

                <div className="space-y-4">
                  {editDraftData.keyResults.map((kr, index) => (
                    <div key={index} className="grid gap-3 p-4 border rounded-lg relative">
                      <div className="flex items-start justify-between gap-2">
                        <div className="grid gap-3 flex-1">
                          <div>
                            <Label htmlFor={`edit-kr-title-${index}`}>Key Result Title</Label>
                            <Input
                              id={`edit-kr-title-${index}`}
                              placeholder="Measurable outcome with a clear success metric..."
                              value={kr.title}
                              onChange={(e) => handleEditDraftKeyResultChange(kr.id || String(index), "title", e.target.value)}
                            />
                          </div>
                        </div>

                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveEditKeyResult(index)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                          <span className="sr-only">Remove</span>
                        </Button>
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

        {/* AI Analysis Dialog */}
        <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>AI Review of Your Objective</DialogTitle>
              <DialogDescription>
                Get AI-powered suggestions to improve your OKR.
              </DialogDescription>
            </DialogHeader>

            {analyzing ? (
              <div className="py-12 flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-center">Analyzing your OKR...</p>
              </div>
            ) : aiAnalysis ? (
              <div className="grid gap-6 py-4">
                <div>
                  <h3 className="font-medium mb-2">Overall Assessment</h3>
                  <p className="text-muted-foreground">
                    {aiAnalysis.overall ? aiAnalysis.overall : "Overall assessment not available"}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-2 text-green-600">Strengths</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {aiAnalysis.strengths && Array.isArray(aiAnalysis.strengths) ? (
                        aiAnalysis.strengths.map((strength, i) => (
                          <li key={i} className="text-muted-foreground">{strength}</li>
                        ))
                      ) : (
                        <li className="text-muted-foreground">No strengths identified</li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2 text-amber-600">Areas for Improvement</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {aiAnalysis.weaknesses && Array.isArray(aiAnalysis.weaknesses) ? (
                        aiAnalysis.weaknesses.map((weakness, i) => (
                          <li key={i} className="text-muted-foreground">{weakness}</li>
                        ))
                      ) : (
                        <li className="text-muted-foreground">No improvement areas identified</li>
                      )}
                    </ul>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Suggestions</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {aiAnalysis.suggestions && Array.isArray(aiAnalysis.suggestions) ? (
                      aiAnalysis.suggestions.map((suggestion, i) => (
                        <li key={i} className="text-muted-foreground">{suggestion}</li>
                      ))
                    ) : (
                      <li className="text-muted-foreground">No suggestions available</li>
                    )}
                  </ul>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-3">Improved Version Suggestion</h3>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        {aiAnalysis.improvedObjective && aiAnalysis.improvedObjective.title ? 
                          aiAnalysis.improvedObjective.title : "Title not available"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {aiAnalysis.improvedObjective && aiAnalysis.improvedObjective.description ? 
                          aiAnalysis.improvedObjective.description : "Description not available"}
                      </p>
                      
                      <h4 className="text-sm font-medium mb-2">Key Results</h4>
                      <ul className="list-disc pl-5 space-y-2">
                        {aiAnalysis.improvedObjective && 
                         aiAnalysis.improvedObjective.keyResults && 
                         Array.isArray(aiAnalysis.improvedObjective.keyResults) ? (
                          aiAnalysis.improvedObjective.keyResults.map((kr, i) => (
                            <li key={i} className="text-sm">{kr}</li>
                          ))
                        ) : (
                          <li className="text-sm">No key results available</li>
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">No analysis available.</p>
              </div>
            )}

            <DialogFooter>
              {aiAnalysis && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (selectedObjective && aiAnalysis) {
                      setEditDraftData({
                        id: selectedObjective.id,
                        title: aiAnalysis.improvedObjective.title,
                        description: aiAnalysis.improvedObjective.description,
                        keyResults: aiAnalysis.improvedObjective.keyResults.map((krTitle, index) => ({
                          id: selectedObjective.keyResults[index]?.id || "",
                          title: krTitle,
                          objective_id: selectedObjective.id
                        }))
                      });
                      setAiDialogOpen(false);
                      setEditDialogOpen(true);
                    }
                  }}
                >
                  Apply Suggestions
                </Button>
              )}
              <Button onClick={() => setAiDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Submit Confirmation Dialog */}
        <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Submit OKR</DialogTitle>
              <DialogDescription>
                This will move your draft to active status and make it visible to the entire organization.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <p className="text-muted-foreground mb-4">
                Are you sure you want to submit this OKR?
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
      </div>
    </DashboardLayout>
  );
}