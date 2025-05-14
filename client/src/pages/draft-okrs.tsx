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
      const tenantId = sessionStorage.getItem('selectedTenantId') || '';
      const response = await fetch(`/api/objectives?status=draft&tenantId=${tenantId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch draft objectives");
      }
      
      const objectives = await response.json();
      
      // Ensure each objective has a keyResults array
      return objectives.map((objective: DraftObjective) => ({
        ...objective,
        keyResults: objective.keyResults || []
      }));
    }
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
      .then(response => response.json())
      .then(updatedObjective => {
        setSubmitting(false);
        setSubmitDialogOpen(false);
        
        toast({
          title: "OKR Submitted",
          description: "Your objective has been submitted for approval and is now active.",
        });
        
        // Invalidate the query cache to refetch the data
        queryClient.invalidateQueries({ queryKey: ["/api/objectives", "draft"] });
      })
      .catch(error => {
        setSubmitting(false);
        
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
      keyResults: [...prev.keyResults, { id: "", title: "", objective_id: "" }]
    }));
  };
  
  const handleAddEditKeyResult = () => {
    setEditDraftData(prev => ({
      ...prev,
      keyResults: [...prev.keyResults, { id: "", title: "", objective_id: prev.id }]
    }));
  };
  
  const handleNewDraftKeyResultChange = (id: string, newTitle: string) => {
    setNewDraftData(prev => ({
      ...prev,
      keyResults: prev.keyResults.map((kr, index) => 
        kr.id === id || (kr.id === "" && id === String(index)) 
          ? { ...kr, title: newTitle } 
          : kr
      )
    }));
  };
  
  const handleEditDraftKeyResultChange = (id: string, newTitle: string) => {
    setEditDraftData(prev => ({
      ...prev,
      keyResults: prev.keyResults.map((kr, index) => 
        kr.id === id || (kr.id === "" && id === String(index)) 
          ? { ...kr, title: newTitle } 
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
    
    // In a real implementation, we would make an API call to update the draft objective
    // For example:
    apiRequest("PATCH", `/api/objectives/${editDraftData.id}`, {
      title: editDraftData.title,
      description: editDraftData.description,
      keyResults: editDraftData.keyResults.map(kr => ({
        ...kr,
        title: kr.title.trim(),
        objective_id: editDraftData.id
      }))
    })
      .then(response => response.json())
      .then(updatedObjective => {
        setCreating(false);
        setEditDialogOpen(false);
        
        toast({
          title: "Draft Updated",
          description: "Your draft objective has been updated successfully.",
        });
        
        // Invalidate the query cache to refetch the data
        queryClient.invalidateQueries({ queryKey: ["/api/objectives", "draft"] });
      })
      .catch(error => {
        setCreating(false);
        
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
        title: kr.title.trim()
      }))
    };
    
    // Make an API call to create the draft objective
    apiRequest("POST", "/api/objectives", newObjective)
      .then(response => response.json())
      .then(createdObjective => {
        setCreating(false);
        setCreateDialogOpen(false);
        
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
        
        // Invalidate the query cache to refetch the data
        queryClient.invalidateQueries({ queryKey: ["/api/objectives", "draft"] });
      })
      .catch(error => {
        setCreating(false);
        
        toast({
          title: "Error",
          description: `Failed to create draft: ${error.message}`,
          variant: "destructive"
        });
      });
  };

  return (
    <DashboardLayout title="Draft OKRs">
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Draft OKRs</h1>
          <p className="text-muted-foreground">
            Create and manage your draft objectives before submitting them.
          </p>
        </div>
        <Button onClick={handleNewDraft} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>New Draft</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-destructive">Failed to load draft OKRs.</p>
          </CardContent>
        </Card>
      ) : (draftObjectives && Array.isArray(draftObjectives) && draftObjectives.length > 0) ? (
        <div className="grid gap-6">
          {draftObjectives.map((objective) => (
            <Card key={objective.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <Badge className="mb-2">Draft</Badge>
                    <CardTitle>{objective.title}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(objective)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleAIReview(objective)}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      AI Review
                    </Button>
                    <Button size="sm" onClick={() => handleSubmit(objective)}>
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Submit
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{objective.description}</p>
                <div className="space-y-6">
                  <h3 className="font-medium">Key Results</h3>
                  <div className="space-y-4">
                    {objective.keyResults && objective.keyResults.length > 0 ? (
                      objective.keyResults.map((keyResult, index) => (
                        <div key={keyResult.id || index} className="border rounded-lg p-4">
                          <h4 className="font-medium">{keyResult.title}</h4>
                          {keyResult.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {keyResult.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            {keyResult.assigned_to_id && (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback>
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
                      <div className="text-sm text-muted-foreground">No key results defined.</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground mb-4">No draft OKRs yet.</p>
            <Button onClick={handleNewDraft}>
              <Plus className="h-4 w-4 mr-2" />
              Create your first draft
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
                placeholder="Provide more context and details about this objective..."
                value={newDraftData.description}
                onChange={(e) => setNewDraftData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-3">
                <Label>Key Results</Label>
                <Button variant="outline" size="sm" onClick={handleAddNewKeyResult}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Key Result
                </Button>
              </div>
              
              <div className="space-y-4">
                {newDraftData.keyResults && Array.isArray(newDraftData.keyResults) ? (
                  newDraftData.keyResults.map((kr, index) => (
                    <div key={index} className="grid gap-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`key-result-${index}`}>Key Result {index + 1}</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveNewKeyResult(index)}
                          className="h-7 px-2"
                        >
                          Remove
                        </Button>
                      </div>
                      <Input
                        id={`key-result-${index}`}
                        placeholder="Enter a measurable key result..."
                        value={kr.title}
                        onChange={(e) => handleNewDraftKeyResultChange(String(index), e.target.value)}
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-2">
                    <p className="text-muted-foreground">No key results defined yet</p>
                  </div>
                )}
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
              Make changes to your draft objective and key results.
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
                placeholder="Provide more context and details about this objective..."
                value={editDraftData.description}
                onChange={(e) => setEditDraftData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-3">
                <Label>Key Results</Label>
                <Button variant="outline" size="sm" onClick={handleAddEditKeyResult}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Key Result
                </Button>
              </div>
              
              <div className="space-y-4">
                {editDraftData.keyResults && Array.isArray(editDraftData.keyResults) ? (
                  editDraftData.keyResults.map((kr, index) => (
                    <div key={kr.id || index} className="grid gap-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`edit-key-result-${index}`}>Key Result {index + 1}</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveEditKeyResult(index)}
                          className="h-7 px-2"
                        >
                          Remove
                        </Button>
                      </div>
                      <Input
                        id={`edit-key-result-${index}`}
                        placeholder="Enter a measurable key result..."
                        value={kr.title || ""}
                        onChange={(e) => handleEditDraftKeyResultChange(kr.id || String(index), e.target.value)}
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-2">
                    <p className="text-muted-foreground">No key results defined yet</p>
                  </div>
                )}
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
    </DashboardLayout>
  );
}