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

// Using TanStack Query to fetch draft objectives from the API

// Mock AI analysis response data
const mockAIAnalysis: AIAnalysis = {
  overall: "Good alignment with OKR principles, but some improvements are needed.",
  strengths: [
    "Clear, measurable objectives with specific targets",
    "Good alignment with company goals",
    "Time-bound objectives with realistic timeframes"
  ],
  weaknesses: [
    "Some key results could be more specific and measurable",
    "Consider adding more outcome-focused key results instead of output-focused ones"
  ],
  suggestions: [
    "For KR #1: 'Achieve 15 new enterprise customers' - consider adding revenue target to make it more impactful",
    "For KR #2: Add geographical specificity to focus efforts",
    "Consider adding a key result focused on customer retention or satisfaction"
  ],
  improvedObjective: {
    title: "Expand customer base in EMEA region with focus on high-value enterprise clients",
    description: "Target enterprise customers in Europe, Middle East, and Africa to increase market share and establish a strong presence in key financial centers",
    keyResults: [
      "Achieve 15 new enterprise customers generating at least €4M in annual revenue",
      "Generate €2M in new annual revenue with 30% from financial services sector",
      "Establish 3 strategic partnerships with local industry leaders in UK, Germany and UAE"
    ]
  }
};

export default function DraftOKRs() {
  const { toast } = useToast();
  const [selectedObjective, setSelectedObjective] = useState<DraftObjective | null>(null);
  const [aiReviewOpen, setAiReviewOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  
  // Fetch objectives with status="draft" from the API
  const { 
    data: draftObjectives,
    isLoading: loadingObjectives,
    error: objectivesError
  } = useQuery<DraftObjective[]>({
    queryKey: ["/api/objectives", "draft"],
    queryFn: async () => {
      const response = await fetch("/api/objectives?status=draft");
      if (!response.ok) {
        throw new Error("Failed to fetch draft objectives");
      }
      return response.json();
    }
  });
  
  // Fetch key results for draft objectives
  const {
    data: keyResults,
    isLoading: loadingKeyResults,
    error: keyResultsError
  } = useQuery<KeyResult[]>({
    queryKey: ["/api/key-results"],
    enabled: !!draftObjectives && draftObjectives.length > 0,
  });
  
  // Combine objectives with their key results
  const draftObjectivesWithKeyResults = draftObjectives?.map(objective => ({
    ...objective,
    keyResults: keyResults?.filter(kr => kr.objective_id === objective.id) || []
  })) || [];
  
  const [editFormData, setEditFormData] = useState<{
    title: string;
    description: string;
    keyResults: KeyResult[];
  }>({
    title: "",
    description: "",
    keyResults: []
  });
  
  const [newDraftData, setNewDraftData] = useState<{
    title: string;
    description: string;
    keyResults: KeyResult[];
  }>({
    title: "",
    description: "",
    keyResults: [{ id: "", title: "", objective_id: "" }]
  });

  const handleEdit = (objective: DraftObjective) => {
    setSelectedObjective(objective);
    setEditFormData({
      title: objective.title,
      description: objective.description,
      keyResults: objective.keyResults ? [...objective.keyResults] : [] // Create a copy to avoid mutation, handle undefined
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = () => {
    if (!selectedObjective) return;
    
    // In a real app, this would update the data in the database
    // For now, we'll just show a toast notification
    toast({
      title: "Draft OKR Updated",
      description: "Your changes have been saved successfully.",
    });
    setEditDialogOpen(false);
  };

  const handleKeyResultChange = (id: string, newTitle: string) => {
    setEditFormData(prev => ({
      ...prev,
      keyResults: prev.keyResults.map(kr => 
        kr.id === id ? { ...kr, title: newTitle } : kr
      )
    }));
  };

  const addKeyResult = () => {
    // Generate a unique temporary ID for the new key result
    const tempId = `temp-${Date.now()}`;
    
    setEditFormData(prev => ({
      ...prev,
      keyResults: [...prev.keyResults, { 
        id: tempId, 
        title: "", 
        objective_id: selectedObjective?.id || "" 
      }]
    }));
  };

  const removeKeyResult = (id: string) => {
    setEditFormData(prev => ({
      ...prev,
      keyResults: prev.keyResults.filter(kr => kr.id !== id)
    }));
  };

  const handleAIReview = (objective: DraftObjective) => {
    setSelectedObjective(objective);
    setAiReviewOpen(true);
    setIsAnalyzing(true);
    setAiAnalysis(null);

    // Simulate AI analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      setAiAnalysis(mockAIAnalysis);
    }, 2000);
  };

  const applyAISuggestions = () => {
    if (!aiAnalysis || !selectedObjective) return;
    
    // In a real app, this would update the data in the database
    // For now, we'll just show a toast notification
    toast({
      title: "AI Suggestions Applied",
      description: "The suggested improvements have been applied to your draft OKR.",
    });
    setAiReviewOpen(false);
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
    
    // In a real implementation, we would make an API call to update the objective status
    // For example: 
    // const response = await fetch(`/api/objectives/${selectedObjective.id}`, {
    //   method: "PATCH", 
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ status: "active" })
    // });
    
    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      setSubmitDialogOpen(false);
      
      toast({
        title: "OKR Submitted",
        description: "Your objective has been submitted for approval and is now active.",
      });
      
      // In a real implementation, we would invalidate the query cache to refetch the data
      // queryClient.invalidateQueries(["/api/objectives", "draft"]);
    }, 1500);
  };

  const handleNewDraft = () => {
    // Reset the form data
    setNewDraftData({
      title: "",
      description: "",
      keyResults: [{ id: 1, title: "" }]
    });
    setCreateDialogOpen(true);
  };

  const handleNewDraftKeyResultChange = (id: number, newTitle: string) => {
    setNewDraftData(prev => ({
      ...prev,
      keyResults: prev.keyResults.map(kr => 
        kr.id === id ? { ...kr, title: newTitle } : kr
      )
    }));
  };

  const addNewDraftKeyResult = () => {
    // Generate a unique temporary ID for the new key result
    const tempId = `temp-${Date.now()}`;
    
    setNewDraftData(prev => ({
      ...prev,
      keyResults: [...prev.keyResults, { id: tempId, title: "", objective_id: "" }]
    }));
  };

  const removeNewDraftKeyResult = (id: string) => {
    setNewDraftData(prev => ({
      ...prev,
      keyResults: prev.keyResults.filter(kr => kr.id !== id)
    }));
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
    
    // In a real implementation, we would make an API call to create the draft objective
    // For now, simulate the API call
    setTimeout(() => {
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
      
      // In a real implementation, we would invalidate the query cache to refetch the data
      // queryClient.invalidateQueries(["/api/objectives", "draft"]);
    }, 1000);
  };

  return (
    <DashboardLayout title="Draft OKRs">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Draft OKRs</h1>
          <p className="text-gray-600">Manage objectives that are in draft state before approval</p>
        </div>
        
        <Button onClick={handleNewDraft}>
          <Plus className="h-4 w-4 mr-2" />
          New Draft
        </Button>
      </div>

      {/* Loading state */}
      {(loadingObjectives || loadingKeyResults) && (
        <div className="flex justify-center items-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <p>Loading draft objectives...</p>
        </div>
      )}
      
      {/* Error state */}
      {(objectivesError || keyResultsError) && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Data</CardTitle>
            <CardDescription>
              {objectivesError ? objectivesError.message : keyResultsError?.message}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Data loaded successfully */}
      {!loadingObjectives && !loadingKeyResults && !objectivesError && !keyResultsError && (
        <>
          {draftObjectivesWithKeyResults && draftObjectivesWithKeyResults.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {draftObjectivesWithKeyResults.map((objective) => (
                <Card key={objective.id} className="border-l-4 border-l-amber-400">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="bg-amber-50">Draft</Badge>
                      <div className="text-sm text-gray-500">
                        {objective.created_at ? `Created ${new Date(objective.created_at).toLocaleDateString()}` : ''}
                      </div>
                    </div>
                    <CardTitle>{objective.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {objective.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Key Results</h4>
                      {objective.keyResults && objective.keyResults.length > 0 ? (
                        <ul className="space-y-1 text-sm text-gray-700">
                          {objective.keyResults.map((kr) => (
                            <li key={kr.id} className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>{kr.title}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No key results defined yet</p>
                      )}
                    </div>
                    <Separator className="my-4" />
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarFallback>
                          {objective.owner_id ? objective.owner_id.substring(0, 2) : "??"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-sm">
                        <p className="font-medium">Owner ID: {objective.owner_id || "Not assigned"}</p>
                        <p className="text-xs text-gray-500">Draft Owner</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="grid grid-cols-3 gap-2 pt-0">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(objective)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => handleAIReview(objective)}>
                      <Sparkles className="h-4 w-4 mr-1 text-purple-500" />
                      AI Review
                    </Button>
                    <Button size="sm" onClick={() => handleSubmit(objective)}>
                      Submit
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No draft objectives</CardTitle>
                <CardDescription>
                  You don't have any draft objectives yet.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={handleNewDraft}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first draft
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* AI Review Dialog */}
      <Dialog open={aiReviewOpen} onOpenChange={setAiReviewOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-purple-500" />
                AI Review of Draft OKR
              </div>
            </DialogTitle>
            <DialogDescription>
              Analysis based on OKR best practices and principles
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="h-12 w-12 animate-spin text-purple-500 mb-4" />
                <p className="text-lg text-center">AI is analyzing your OKR...</p>
                <p className="text-sm text-muted-foreground text-center mt-2">This will just take a moment</p>
              </div>
            ) : aiAnalysis ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Overall Assessment</h3>
                  <p className="mt-2">{aiAnalysis.overall}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-green-600 text-sm">Strengths</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-5 space-y-2">
                        {aiAnalysis.strengths.map((strength, index) => (
                          <li key={index} className="text-sm">{strength}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-amber-600 text-sm">Areas for Improvement</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-5 space-y-2">
                        {aiAnalysis.weaknesses.map((weakness, index) => (
                          <li key={index} className="text-sm">{weakness}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Specific Suggestions</h3>
                  <ul className="space-y-2 bg-purple-50 p-4 rounded-lg">
                    {aiAnalysis.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm flex items-start">
                        <Sparkles className="h-4 w-4 mr-2 text-purple-500 mt-0.5 shrink-0" />
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Improved Version</h3>
                  <Card className="border-l-4 border-l-purple-400">
                    <CardHeader>
                      <CardTitle className="text-base">{aiAnalysis.improvedObjective.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {aiAnalysis.improvedObjective.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <h4 className="text-sm font-medium mb-2">Key Results</h4>
                      <ul className="space-y-2 text-sm text-gray-700">
                        {aiAnalysis.improvedObjective.keyResults.map((kr, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{kr}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAiReviewOpen(false)}>
              Cancel
            </Button>
            <Button 
              disabled={isAnalyzing || !aiAnalysis} 
              onClick={applyAISuggestions}
            >
              Apply AI Suggestions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center">
                <Edit className="h-5 w-5 mr-2" />
                Edit Draft OKR
              </div>
            </DialogTitle>
            <DialogDescription>
              Make changes to your draft objective and key results
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Objective Title</Label>
              <Input 
                id="title" 
                value={editFormData.title}
                onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter the main objective"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={editFormData.description}
                onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what you want to achieve"
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Key Results</Label>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline"
                  onClick={addKeyResult}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Key Result
                </Button>
              </div>
              
              <div className="space-y-3">
                {editFormData.keyResults.map((kr, index) => (
                  <div key={kr.id} className="flex gap-2 items-start">
                    <Input 
                      value={kr.title}
                      onChange={(e) => handleKeyResultChange(kr.id, e.target.value)}
                      placeholder={`Key Result ${index + 1}`}
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeKeyResult(kr.id)}
                      className="h-10 w-10 shrink-0"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="24" 
                        height="24" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="h-4 w-4 text-red-500"
                      >
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Dialog */}
      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Draft OKR</DialogTitle>
            <DialogDescription>
              This will submit your draft objective for review and approval.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
                <h4 className="font-medium text-amber-800 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 mr-2"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  Before you submit
                </h4>
                <p className="text-sm text-amber-700 mt-2">
                  Once submitted, this OKR will be reviewed by your manager or OKR administrator.
                  You won't be able to edit it further until it's approved or sent back for revisions.
                </p>
              </div>
              
              {selectedObjective && (
                <div className="rounded-md border p-4">
                  <h4 className="font-medium">{selectedObjective.title}</h4>
                  <p className="text-sm text-gray-500 mt-1 mb-3">{selectedObjective.description}</p>
                  
                  <div>
                    <h5 className="text-sm font-medium mb-2 text-gray-700">Key Results:</h5>
                    <ul className="space-y-1">
                      {selectedObjective.keyResults.map((kr) => (
                        <li key={kr.id} className="text-sm flex items-start">
                          <span className="mr-2">•</span>
                          <span>{kr.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSubmitDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={handleSubmitConfirm}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Confirm & Submit
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create New Draft Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Create New Draft OKR
              </div>
            </DialogTitle>
            <DialogDescription>
              Create a new draft objective and key results for review before submission
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-title">Objective Title</Label>
              <Input 
                id="new-title" 
                value={newDraftData.title}
                onChange={(e) => setNewDraftData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter the main objective"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-description">Description</Label>
              <Textarea 
                id="new-description" 
                value={newDraftData.description}
                onChange={(e) => setNewDraftData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what you want to achieve"
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Key Results</Label>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline"
                  onClick={addNewDraftKeyResult}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Key Result
                </Button>
              </div>
              
              <div className="space-y-3">
                {newDraftData.keyResults.map((kr, index) => (
                  <div key={kr.id} className="flex gap-2 items-start">
                    <Input 
                      value={kr.title}
                      onChange={(e) => handleNewDraftKeyResultChange(kr.id, e.target.value)}
                      placeholder={`Key Result ${index + 1}`}
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeNewDraftKeyResult(kr.id)}
                      className="h-10 w-10 shrink-0"
                      disabled={newDraftData.keyResults.length <= 1}
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="24" 
                        height="24" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="h-4 w-4 text-red-500"
                      >
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    </Button>
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
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : "Create Draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
