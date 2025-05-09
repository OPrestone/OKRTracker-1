import { useState } from "react";
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

interface DraftObjective {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  owner: {
    firstName: string;
    lastName: string;
  };
  keyResults: {
    id: number;
    title: string;
  }[];
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

// Sample data
const draftObjectives: DraftObjective[] = [
  {
    id: 1,
    title: "Expand customer base in EMEA region",
    description: "Target enterprise customers in Europe, Middle East, and Africa to increase market share",
    createdAt: "2023-09-15",
    owner: { firstName: "Alex", lastName: "Morgan" },
    keyResults: [
      { id: 1, title: "Achieve 15 new enterprise customers" },
      { id: 2, title: "Generate €2M in new annual revenue" },
      { id: 3, title: "Establish 3 strategic partnerships" }
    ]
  },
  {
    id: 2,
    title: "Implement data-driven marketing strategy",
    description: "Use analytics to optimize marketing campaigns and improve ROI",
    createdAt: "2023-09-18",
    owner: { firstName: "Jamie", lastName: "Taylor" },
    keyResults: [
      { id: 4, title: "Increase marketing qualified leads by 30%" },
      { id: 5, title: "Reduce customer acquisition cost by 20%" },
      { id: 6, title: "Improve conversion rate by 15%" }
    ]
  },
  {
    id: 3,
    title: "Revamp customer onboarding process",
    description: "Streamline the onboarding experience to improve customer satisfaction and reduce churn",
    createdAt: "2023-09-20",
    owner: { firstName: "Sam", lastName: "Johnson" },
    keyResults: [
      { id: 7, title: "Reduce onboarding time from 14 days to 7 days" },
      { id: 8, title: "Achieve 90% customer satisfaction score" },
      { id: 9, title: "Decrease 30-day churn by 25%" }
    ]
  }
];

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
  const [editFormData, setEditFormData] = useState<{
    title: string;
    description: string;
    keyResults: { id: number; title: string }[];
  }>({
    title: "",
    description: "",
    keyResults: []
  });
  const [newDraftData, setNewDraftData] = useState<{
    title: string;
    description: string;
    keyResults: { id: number; title: string }[];
  }>({
    title: "",
    description: "",
    keyResults: [{ id: 1, title: "" }]
  });

  const handleEdit = (objective: DraftObjective) => {
    setSelectedObjective(objective);
    setEditFormData({
      title: objective.title,
      description: objective.description,
      keyResults: [...objective.keyResults] // Create a copy to avoid mutation
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

  const handleKeyResultChange = (id: number, newTitle: string) => {
    setEditFormData(prev => ({
      ...prev,
      keyResults: prev.keyResults.map(kr => 
        kr.id === id ? { ...kr, title: newTitle } : kr
      )
    }));
  };

  const addKeyResult = () => {
    // Generate a unique ID for the new key result
    const newId = Math.max(0, ...editFormData.keyResults.map(kr => kr.id)) + 1;
    
    setEditFormData(prev => ({
      ...prev,
      keyResults: [...prev.keyResults, { id: newId, title: "" }]
    }));
  };

  const removeKeyResult = (id: number) => {
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
    
    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      setSubmitDialogOpen(false);
      
      // In a real app, this would update the status in the database
      toast({
        title: "OKR Submitted",
        description: "Your objective has been submitted for approval.",
      });
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
    // Generate a unique ID for the new key result
    const newId = Math.max(0, ...newDraftData.keyResults.map(kr => kr.id)) + 1;
    
    setNewDraftData(prev => ({
      ...prev,
      keyResults: [...prev.keyResults, { id: newId, title: "" }]
    }));
  };

  const removeNewDraftKeyResult = (id: number) => {
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
    
    // Simulate API call
    setTimeout(() => {
      setCreating(false);
      setCreateDialogOpen(false);
      
      // In a real app, this would create a new draft objective in the database
      toast({
        title: "Draft Created",
        description: "Your draft objective has been created successfully.",
      });
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

      {draftObjectives && draftObjectives.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {draftObjectives.map((objective) => (
            <Card key={objective.id} className="border-l-4 border-l-amber-400">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="bg-amber-50">Draft</Badge>
                  <div className="text-sm text-gray-500">Created {objective.createdAt}</div>
                </div>
                <CardTitle>{objective.title}</CardTitle>
                <CardDescription className="mt-2">
                  {objective.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <h4 className="text-sm font-medium mb-2">Key Results</h4>
                  <ul className="space-y-1 text-sm text-gray-700">
                    {objective.keyResults.map((kr) => (
                      <li key={kr.id} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{kr.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Separator className="my-4" />
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarFallback>{`${objective.owner.firstName[0]}${objective.owner.lastName[0]}`}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <p className="font-medium">{objective.owner.firstName} {objective.owner.lastName}</p>
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
