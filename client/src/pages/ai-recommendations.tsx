import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Brain, Check, HelpCircle, Lightbulb, Loader2, Target, Zap } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Interfaces for AI recommendation types
interface ObjectiveRecommendation {
  title: string;
  description: string;
  level: "company" | "department" | "team" | "individual";
  reasoning: string;
  suggestedKeyResults: {
    title: string;
    description: string;
    targetValue?: string;
  }[];
}

interface KeyResultRecommendation {
  title: string;
  description: string;
  targetValue?: string;
  reasoning: string;
}

interface OKRImprovement {
  originalObjective: {
    id: number;
    title: string;
    description: string | null;
    level: string;
  };
  improvedTitle?: string;
  improvedDescription?: string;
  reasoning: string;
  keyResultSuggestions?: KeyResultRecommendation[];
}

interface AlignmentAnalysis {
  alignmentScore: number;
  analysis: string;
  recommendations: string[];
}

const AIRecommendations = () => {
  const { toast } = useToast();
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [selectedObjective, setSelectedObjective] = useState<string>("");
  
  // Fetch teams for dropdown
  const { data: teams = [] } = useQuery({
    queryKey: ["/api/teams"],
    queryFn: ({ signal }) => fetch("/api/teams", { signal }).then(res => res.json()),
  });
  
  // Fetch objectives for dropdown (all objectives for now, will filter by team if needed)
  const { data: objectives = [] } = useQuery({
    queryKey: ["/api/objectives"],
    queryFn: ({ signal }) => fetch("/api/objectives", { signal }).then(res => res.json()),
  });
  
  // Query for objective recommendations
  const {
    data: objectiveRecommendations,
    isLoading: isLoadingObjectiveRecs,
    error: objectiveRecsError,
    refetch: refetchObjectiveRecs
  } = useQuery({
    queryKey: ["/api/recommendations/objectives", selectedTeam],
    queryFn: ({ signal }) => 
      selectedTeam 
        ? fetch(`/api/recommendations/objectives/${selectedTeam}`, { signal }).then(res => res.json())
        : Promise.resolve([]),
    enabled: !!selectedTeam,
  });
  
  // Query for key result recommendations
  const {
    data: keyResultRecommendations,
    isLoading: isLoadingKeyResultRecs,
    error: keyResultRecsError,
    refetch: refetchKeyResultRecs
  } = useQuery({
    queryKey: ["/api/recommendations/key-results", selectedObjective],
    queryFn: ({ signal }) => 
      selectedObjective 
        ? fetch(`/api/recommendations/key-results/${selectedObjective}`, { signal }).then(res => res.json())
        : Promise.resolve([]),
    enabled: !!selectedObjective,
  });
  
  // Query for objective improvement suggestions
  const {
    data: okrImprovement,
    isLoading: isLoadingImprovement,
    error: improvementError,
    refetch: refetchImprovement
  } = useQuery({
    queryKey: ["/api/recommendations/improve", selectedObjective],
    queryFn: ({ signal }) => 
      selectedObjective 
        ? fetch(`/api/recommendations/improve/${selectedObjective}`, { signal }).then(res => res.json())
        : Promise.resolve(null),
    enabled: !!selectedObjective,
  });
  
  // Query for team alignment analysis
  const {
    data: alignmentAnalysis,
    isLoading: isLoadingAlignment,
    error: alignmentError,
    refetch: refetchAlignment
  } = useQuery({
    queryKey: ["/api/recommendations/alignment", selectedTeam],
    queryFn: ({ signal }) => 
      selectedTeam 
        ? fetch(`/api/recommendations/alignment/${selectedTeam}`, { signal }).then(res => res.json())
        : Promise.resolve(null),
    enabled: !!selectedTeam,
  });
  
  // Mutations for creating objectives and key results from recommendations
  const createObjectiveMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/objectives", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
      toast({
        title: "Objective created",
        description: "Objective has been successfully created from recommendation",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create objective",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const createKeyResultMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/key-results", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/key-results"] });
      toast({
        title: "Key Result created",
        description: "Key Result has been successfully created from recommendation",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create Key Result",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateObjectiveMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PATCH", `/api/objectives/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
      toast({
        title: "Objective updated",
        description: "Objective has been successfully updated with improvements",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update objective",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Function to create objective from recommendation
  const handleCreateObjective = (recommendation: ObjectiveRecommendation) => {
    const selectedTeamObj = teams.find((team: any) => team.id.toString() === selectedTeam);
    
    if (!selectedTeamObj) {
      toast({
        title: "Team not found",
        description: "Please select a valid team",
        variant: "destructive",
      });
      return;
    }
    
    // Timeframe ID would need to be set - using the first available timeframe for demo
    // In a real app, you'd want to prompt the user to select a timeframe
    createObjectiveMutation.mutate({
      title: recommendation.title,
      description: recommendation.description,
      level: recommendation.level,
      teamId: selectedTeamObj.id,
      ownerId: 1, // Default to admin or should prompt to select owner
      timeframeId: 1, // Default to first timeframe - should prompt to select in real app
      status: "draft"
    });
  };
  
  // Function to create key result from recommendation
  const handleCreateKeyResult = (recommendation: KeyResultRecommendation) => {
    if (!selectedObjective) {
      toast({
        title: "No objective selected",
        description: "Please select an objective to add key results to",
        variant: "destructive",
      });
      return;
    }
    
    createKeyResultMutation.mutate({
      title: recommendation.title,
      description: recommendation.description,
      objectiveId: parseInt(selectedObjective),
      targetValue: recommendation.targetValue || "100",
      currentValue: "0",
      startValue: "0",
      format: "percentage",
      ownerId: 1 // Default to admin or should prompt to select owner
    });
  };
  
  // Function to apply improvements to an objective
  const handleApplyImprovements = () => {
    if (!okrImprovement || !selectedObjective) return;
    
    const improvementData: any = {};
    if (okrImprovement.improvedTitle) {
      improvementData.title = okrImprovement.improvedTitle;
    }
    if (okrImprovement.improvedDescription) {
      improvementData.description = okrImprovement.improvedDescription;
    }
    
    updateObjectiveMutation.mutate({
      id: parseInt(selectedObjective),
      data: improvementData
    });
    
    // If there are key result suggestions, we could prompt the user to create those as well
    if (okrImprovement.keyResultSuggestions && okrImprovement.keyResultSuggestions.length > 0) {
      toast({
        title: "Key Result suggestions available",
        description: "Don't forget to review and add the suggested key results to this objective",
      });
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Smart OKR Recommendations</h1>
          <p className="text-muted-foreground mt-1">
            Use AI to generate, improve, and align your objectives and key results
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-md">
              <p>The Smart Recommendation Engine uses AI to help you create better OKRs. Select a team or objective to get started.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <Tabs defaultValue="objectives" className="mt-6">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="objectives">
            <Lightbulb className="mr-2 h-4 w-4" />
            Objective Ideas
          </TabsTrigger>
          <TabsTrigger value="keyresults">
            <Target className="mr-2 h-4 w-4" />
            Key Result Ideas
          </TabsTrigger>
          <TabsTrigger value="improve">
            <Zap className="mr-2 h-4 w-4" />
            Improve OKRs
          </TabsTrigger>
          <TabsTrigger value="alignment">
            <Brain className="mr-2 h-4 w-4" />
            Alignment Analysis
          </TabsTrigger>
        </TabsList>
        
        {/* Objective Recommendations Tab */}
        <TabsContent value="objectives" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Objective Ideas</CardTitle>
              <CardDescription>
                Get AI-powered recommendations for new objectives based on your team's focus
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex items-center gap-4">
                  <div className="grid gap-2 flex-1">
                    <label htmlFor="team-select" className="text-sm font-medium">
                      Select Team
                    </label>
                    <Select
                      value={selectedTeam}
                      onValueChange={setSelectedTeam}
                    >
                      <SelectTrigger id="team-select">
                        <SelectValue placeholder="Select a team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team: any) => (
                          <SelectItem key={team.id} value={team.id.toString()}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="self-end">
                    <Button
                      variant="outline"
                      onClick={() => refetchObjectiveRecs()}
                      disabled={!selectedTeam || isLoadingObjectiveRecs}
                    >
                      {isLoadingObjectiveRecs ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Brain className="mr-2 h-4 w-4" />
                          Generate Ideas
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                {objectiveRecsError ? (
                  <div className="flex items-center p-4 text-sm border border-red-200 rounded-md bg-red-50 text-red-600">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <p>Error loading recommendations. Please try again.</p>
                  </div>
                ) : !selectedTeam ? (
                  <div className="text-center p-6 text-muted-foreground">
                    <Lightbulb className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p>Select a team to generate objective recommendations</p>
                  </div>
                ) : isLoadingObjectiveRecs ? (
                  <div className="flex flex-col items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p>Generating objective recommendations...</p>
                  </div>
                ) : objectiveRecommendations && objectiveRecommendations.length > 0 ? (
                  <div className="grid gap-4">
                    {objectiveRecommendations.map((rec: ObjectiveRecommendation, index: number) => (
                      <Card key={index} className="border-l-4 border-l-primary">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <Badge variant="outline" className="mb-2">
                                {rec.level.charAt(0).toUpperCase() + rec.level.slice(1)} Level
                              </Badge>
                              <CardTitle>{rec.title}</CardTitle>
                              <CardDescription className="mt-2">
                                {rec.description}
                              </CardDescription>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleCreateObjective(rec)}
                              disabled={createObjectiveMutation.isPending}
                            >
                              {createObjectiveMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Check className="h-4 w-4 mr-1" /> Use This
                                </>
                              )}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1">
                              <AccordionTrigger>Why this objective?</AccordionTrigger>
                              <AccordionContent>
                                {rec.reasoning}
                              </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2">
                              <AccordionTrigger>Suggested Key Results</AccordionTrigger>
                              <AccordionContent>
                                <div className="grid gap-2">
                                  {rec.suggestedKeyResults.map((kr, idx) => (
                                    <div key={idx} className="border p-3 rounded-md bg-muted/50">
                                      <div className="font-medium">{kr.title}</div>
                                      <div className="text-sm text-muted-foreground mt-1">
                                        {kr.description}
                                      </div>
                                      {kr.targetValue && (
                                        <div className="text-sm mt-1">
                                          <span className="font-medium">Target:</span> {kr.targetValue}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : selectedTeam && !isLoadingObjectiveRecs ? (
                  <div className="text-center p-6 text-muted-foreground">
                    <p>No recommendations generated yet. Click "Generate Ideas" to start.</p>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Key Result Recommendations Tab */}
        <TabsContent value="keyresults" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Key Result Ideas</CardTitle>
              <CardDescription>
                Get AI-powered recommendations for key results that will help measure your objectives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex items-center gap-4">
                  <div className="grid gap-2 flex-1">
                    <label htmlFor="objective-select" className="text-sm font-medium">
                      Select Objective
                    </label>
                    <Select
                      value={selectedObjective}
                      onValueChange={setSelectedObjective}
                    >
                      <SelectTrigger id="objective-select">
                        <SelectValue placeholder="Select an objective" />
                      </SelectTrigger>
                      <SelectContent>
                        {objectives.map((objective: any) => (
                          <SelectItem key={objective.id} value={objective.id.toString()}>
                            {objective.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="self-end">
                    <Button
                      variant="outline"
                      onClick={() => refetchKeyResultRecs()}
                      disabled={!selectedObjective || isLoadingKeyResultRecs}
                    >
                      {isLoadingKeyResultRecs ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Target className="mr-2 h-4 w-4" />
                          Generate Key Results
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                {keyResultRecsError ? (
                  <div className="flex items-center p-4 text-sm border border-red-200 rounded-md bg-red-50 text-red-600">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <p>Error loading key result recommendations. Please try again.</p>
                  </div>
                ) : !selectedObjective ? (
                  <div className="text-center p-6 text-muted-foreground">
                    <Target className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p>Select an objective to generate key result recommendations</p>
                  </div>
                ) : isLoadingKeyResultRecs ? (
                  <div className="flex flex-col items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p>Generating key result recommendations...</p>
                  </div>
                ) : keyResultRecommendations && keyResultRecommendations.length > 0 ? (
                  <div className="grid gap-4">
                    {keyResultRecommendations.map((rec: KeyResultRecommendation, index: number) => (
                      <Card key={index} className="border-l-4 border-l-primary">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle>{rec.title}</CardTitle>
                              <CardDescription className="mt-2">
                                {rec.description}
                              </CardDescription>
                              {rec.targetValue && (
                                <Badge variant="outline" className="mt-2">
                                  Target: {rec.targetValue}
                                </Badge>
                              )}
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleCreateKeyResult(rec)}
                              disabled={createKeyResultMutation.isPending}
                            >
                              {createKeyResultMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Check className="h-4 w-4 mr-1" /> Use This
                                </>
                              )}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1">
                              <AccordionTrigger>Why this key result?</AccordionTrigger>
                              <AccordionContent>
                                {rec.reasoning}
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : selectedObjective && !isLoadingKeyResultRecs ? (
                  <div className="text-center p-6 text-muted-foreground">
                    <p>No recommendations generated yet. Click "Generate Key Results" to start.</p>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Improve OKRs Tab */}
        <TabsContent value="improve" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Improve Existing OKRs</CardTitle>
              <CardDescription>
                Get suggestions to improve the quality and effectiveness of your objectives and key results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex items-center gap-4">
                  <div className="grid gap-2 flex-1">
                    <label htmlFor="objective-improve-select" className="text-sm font-medium">
                      Select Objective to Improve
                    </label>
                    <Select
                      value={selectedObjective}
                      onValueChange={setSelectedObjective}
                    >
                      <SelectTrigger id="objective-improve-select">
                        <SelectValue placeholder="Select an objective" />
                      </SelectTrigger>
                      <SelectContent>
                        {objectives.map((objective: any) => (
                          <SelectItem key={objective.id} value={objective.id.toString()}>
                            {objective.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="self-end">
                    <Button
                      variant="outline"
                      onClick={() => refetchImprovement()}
                      disabled={!selectedObjective || isLoadingImprovement}
                    >
                      {isLoadingImprovement ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Zap className="mr-2 h-4 w-4" />
                          Analyze & Improve
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                {improvementError ? (
                  <div className="flex items-center p-4 text-sm border border-red-200 rounded-md bg-red-50 text-red-600">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <p>Error analyzing OKR. Please try again.</p>
                  </div>
                ) : !selectedObjective ? (
                  <div className="text-center p-6 text-muted-foreground">
                    <Zap className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p>Select an objective to get improvement suggestions</p>
                  </div>
                ) : isLoadingImprovement ? (
                  <div className="flex flex-col items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p>Analyzing your OKR and generating improvements...</p>
                  </div>
                ) : okrImprovement ? (
                  <div className="space-y-6">
                    <Card className="border-l-4 border-l-amber-500">
                      <CardHeader>
                        <CardTitle>Original Objective</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <div className="font-semibold">Title:</div>
                            <div>{okrImprovement.originalObjective.title}</div>
                          </div>
                          <div>
                            <div className="font-semibold">Description:</div>
                            <div>{okrImprovement.originalObjective.description || "No description"}</div>
                          </div>
                          <div>
                            <div className="font-semibold">Level:</div>
                            <div>{okrImprovement.originalObjective.level}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-l-4 border-l-green-500">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle>Suggested Improvements</CardTitle>
                          <Button 
                            onClick={handleApplyImprovements} 
                            disabled={updateObjectiveMutation.isPending || (!okrImprovement.improvedTitle && !okrImprovement.improvedDescription)}
                          >
                            {updateObjectiveMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-1" /> Apply Improvements
                              </>
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {okrImprovement.improvedTitle && (
                            <div className="space-y-2">
                              <div className="font-semibold">Improved Title:</div>
                              <div className="p-3 bg-muted rounded-md">{okrImprovement.improvedTitle}</div>
                            </div>
                          )}
                          
                          {okrImprovement.improvedDescription && (
                            <div className="space-y-2">
                              <div className="font-semibold">Improved Description:</div>
                              <div className="p-3 bg-muted rounded-md">{okrImprovement.improvedDescription}</div>
                            </div>
                          )}
                          
                          <div className="space-y-2">
                            <div className="font-semibold">Analysis:</div>
                            <div className="p-3 bg-muted rounded-md">{okrImprovement.reasoning}</div>
                          </div>
                          
                          {okrImprovement.keyResultSuggestions && okrImprovement.keyResultSuggestions.length > 0 && (
                            <div className="space-y-2">
                              <div className="font-semibold">Suggested Key Results:</div>
                              <div className="grid gap-3">
                                {okrImprovement.keyResultSuggestions.map((kr, idx) => (
                                  <div key={idx} className="border p-3 rounded-md relative pr-12">
                                    <div className="font-medium">{kr.title}</div>
                                    <div className="text-sm mt-1">{kr.description}</div>
                                    {kr.targetValue && (
                                      <div className="text-sm mt-1">
                                        <span className="font-medium">Target:</span> {kr.targetValue}
                                      </div>
                                    )}
                                    <div className="absolute right-2 top-2">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleCreateKeyResult(kr)}
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : selectedObjective && !isLoadingImprovement ? (
                  <div className="text-center p-6 text-muted-foreground">
                    <p>No analysis yet. Click "Analyze & Improve" to start.</p>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Alignment Analysis Tab */}
        <TabsContent value="alignment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alignment Analysis</CardTitle>
              <CardDescription>
                Analyze how well your team's objectives align with company goals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex items-center gap-4">
                  <div className="grid gap-2 flex-1">
                    <label htmlFor="team-alignment-select" className="text-sm font-medium">
                      Select Team
                    </label>
                    <Select
                      value={selectedTeam}
                      onValueChange={setSelectedTeam}
                    >
                      <SelectTrigger id="team-alignment-select">
                        <SelectValue placeholder="Select a team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team: any) => (
                          <SelectItem key={team.id} value={team.id.toString()}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="self-end">
                    <Button
                      variant="outline"
                      onClick={() => refetchAlignment()}
                      disabled={!selectedTeam || isLoadingAlignment}
                    >
                      {isLoadingAlignment ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Brain className="mr-2 h-4 w-4" />
                          Analyze Alignment
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                {alignmentError ? (
                  <div className="flex items-center p-4 text-sm border border-red-200 rounded-md bg-red-50 text-red-600">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <p>Error analyzing alignment. Please try again.</p>
                  </div>
                ) : !selectedTeam ? (
                  <div className="text-center p-6 text-muted-foreground">
                    <Brain className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p>Select a team to analyze alignment with company objectives</p>
                  </div>
                ) : isLoadingAlignment ? (
                  <div className="flex flex-col items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p>Analyzing team alignment with company objectives...</p>
                  </div>
                ) : alignmentAnalysis ? (
                  <div className="space-y-6">
                    <div className="flex justify-center">
                      <div className="relative h-48 w-48">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-4xl font-bold">{alignmentAnalysis.alignmentScore}%</div>
                        </div>
                        <svg
                          className="h-full w-full"
                          viewBox="0 0 100 100"
                        >
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth="10"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke={alignmentAnalysis.alignmentScore >= 70 ? "#10b981" : alignmentAnalysis.alignmentScore >= 40 ? "#f59e0b" : "#ef4444"}
                            strokeWidth="10"
                            strokeDasharray={`${alignmentAnalysis.alignmentScore * 2.83}, 283`}
                            strokeLinecap="round"
                            transform="rotate(-90, 50, 50)"
                          />
                        </svg>
                      </div>
                    </div>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Alignment Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="whitespace-pre-line">{alignmentAnalysis.analysis}</p>
                      </CardContent>
                    </Card>
                    
                    {alignmentAnalysis.recommendations && alignmentAnalysis.recommendations.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Recommendations to Improve Alignment</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2 list-disc pl-5">
                            {alignmentAnalysis.recommendations.map((rec, idx) => (
                              <li key={idx}>{rec}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : selectedTeam && !isLoadingAlignment ? (
                  <div className="text-center p-6 text-muted-foreground">
                    <p>No analysis yet. Click "Analyze Alignment" to start.</p>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIRecommendations;