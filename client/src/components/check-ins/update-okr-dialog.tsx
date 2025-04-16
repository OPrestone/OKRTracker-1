import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PlusCircle, Goal, Target } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Objective, KeyResult } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface UpdateOKRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

interface OKRProgressUpdate {
  objectiveId: string;
  keyResultIds: string[];
  objectiveProgress: number;
  objectiveNotes: string;
  keyResults: {
    [id: string]: {
      progress: number;
      notes: string;
    }
  }
}

export function UpdateOKRDialog({ open, onOpenChange, onComplete }: UpdateOKRDialogProps) {
  const { toast } = useToast();
  const [teamId, setTeamId] = useState('');
  const [selectedObjectiveId, setSelectedObjectiveId] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OKRProgressUpdate>({
    objectiveId: '',
    keyResultIds: [],
    objectiveProgress: 0,
    objectiveNotes: '',
    keyResults: {}
  });
  
  // Fetch teams
  const { data: teams } = useQuery({
    queryKey: ['/api/teams'],
  });
  
  // Fetch objectives for selected team
  const { data: objectives, isLoading: objectivesLoading } = useQuery<Objective[]>({
    queryKey: ['/api/teams', teamId, 'objectives'],
    enabled: !!teamId,
  });
  
  // Fetch key results for selected objective
  const { data: keyResults, isLoading: keyResultsLoading } = useQuery<KeyResult[]>({
    queryKey: ['/api/objectives', selectedObjectiveId, 'key-results'],
    enabled: !!selectedObjectiveId,
  });
  
  // Update formData when objective is selected
  useEffect(() => {
    if (selectedObjectiveId) {
      setFormData(prev => ({
        ...prev,
        objectiveId: selectedObjectiveId,
        keyResultIds: keyResults?.map(kr => kr.id.toString()) || [],
        keyResults: keyResults?.reduce((acc, kr) => ({
          ...acc,
          [kr.id]: { progress: kr.progress || 0, notes: '' }
        }), {}) || {}
      }));
    }
  }, [selectedObjectiveId, keyResults]);
  
  const handleObjectiveProgressChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      objectiveProgress: parseInt(value)
    }));
  };
  
  const handleObjectiveNotesChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      objectiveNotes: value
    }));
  };
  
  const handleKeyResultProgressChange = (id: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      keyResults: {
        ...prev.keyResults,
        [id]: {
          ...prev.keyResults[id],
          progress: parseInt(value)
        }
      }
    }));
  };
  
  const handleKeyResultNotesChange = (id: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      keyResults: {
        ...prev.keyResults,
        [id]: {
          ...prev.keyResults[id],
          notes: value
        }
      }
    }));
  };
  
  const nextStep = () => {
    if (currentStep === 1 && !selectedObjectiveId) {
      toast({
        title: "Please select an objective",
        description: "You need to select an objective to continue",
        variant: "destructive"
      });
      return;
    }
    
    setCurrentStep(prev => prev + 1);
  };
  
  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };
  
  const handleSubmit = async () => {
    try {
      // Create check-in for objective
      await apiRequest('POST', '/api/check-ins', {
        objectiveId: parseInt(formData.objectiveId),
        progress: formData.objectiveProgress,
        notes: formData.objectiveNotes
      });
      
      // Create check-in for each key result
      for (const krId of Object.keys(formData.keyResults)) {
        await apiRequest('POST', '/api/check-ins', {
          keyResultId: parseInt(krId),
          progress: formData.keyResults[krId].progress,
          notes: formData.keyResults[krId].notes
        });
      }
      
      // Also update the objective and key result progress
      await apiRequest('PATCH', `/api/objectives/${formData.objectiveId}`, {
        progress: formData.objectiveProgress
      });
      
      for (const krId of Object.keys(formData.keyResults)) {
        await apiRequest('PATCH', `/api/key-results/${krId}`, {
          progress: formData.keyResults[krId].progress
        });
      }
      
      // Show success message
      toast({
        title: "OKRs updated successfully",
        description: "Your objective and key results have been updated with the latest progress."
      });
      
      // Reset form
      setTeamId('');
      setSelectedObjectiveId('');
      setCurrentStep(1);
      setFormData({
        objectiveId: '',
        keyResultIds: [],
        objectiveProgress: 0,
        objectiveNotes: '',
        keyResults: {}
      });
      
      // Close dialog
      onOpenChange(false);
      
      // Call onComplete callback
      if (onComplete) {
        onComplete();
      }
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/check-ins'] });
      queryClient.invalidateQueries({ queryKey: ['/api/objectives'] });
      queryClient.invalidateQueries({ queryKey: ['/api/key-results'] });
      
    } catch (error) {
      toast({
        title: "Error updating OKRs",
        description: "There was an error updating your OKRs. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Function to get progress color class
  const getProgressColorClass = (progress: number) => {
    if (progress <= 25) return 'progress-red';
    if (progress <= 50) return 'progress-amber';
    if (progress <= 75) return 'progress-amber';
    return 'progress-green';
  };
  
  // Selected objective details
  const selectedObjective = objectives?.find(obj => obj.id.toString() === selectedObjectiveId);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Update OKRs</DialogTitle>
          <DialogDescription>
            Update progress on your objectives and key results
          </DialogDescription>
        </DialogHeader>
        
        {currentStep === 1 && (
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-700">
                Select Team
              </label>
              <Select value={teamId} onValueChange={setTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {teams?.map((team: any) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {teamId && (
              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Select Objective
                </label>
                <Select value={selectedObjectiveId} onValueChange={setSelectedObjectiveId}>
                  <SelectTrigger>
                    <SelectValue placeholder={objectivesLoading ? "Loading objectives..." : "Select an objective"} />
                  </SelectTrigger>
                  <SelectContent>
                    {objectives?.map(objective => (
                      <SelectItem key={objective.id} value={objective.id.toString()}>
                        {objective.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {selectedObjectiveId && selectedObjective && (
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold">
                    <div className="flex items-start">
                      <Goal className="h-5 w-5 mr-2 text-primary mt-0.5" />
                      <div>
                        {selectedObjective.title}
                        <div className="text-sm font-normal text-muted-foreground">
                          Current Progress: {selectedObjective.progress || 0}%
                        </div>
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress 
                    value={selectedObjective.progress || 0} 
                    className={cn("h-2", getProgressColorClass(selectedObjective.progress || 0))}
                  />
                  
                  {!keyResultsLoading && keyResults && keyResults.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold mb-2">Key Results ({keyResults.length})</h4>
                      <ul className="space-y-2">
                        {keyResults.map(kr => (
                          <li key={kr.id} className="text-sm flex items-center">
                            <Target className="h-3 w-3 mr-2 text-muted-foreground" />
                            {kr.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
        
        {currentStep === 2 && selectedObjective && (
          <div className="space-y-6 py-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Update Objective Progress
              </h3>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold">
                    <div className="flex items-start">
                      <Goal className="h-5 w-5 mr-2 text-primary mt-0.5" />
                      <div>
                        {selectedObjective.title}
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      Progress (%)
                    </label>
                    <div className="flex space-x-2 items-center">
                      <Input 
                        type="range" 
                        min="0" 
                        max="100" 
                        step="1"
                        value={formData.objectiveProgress.toString()}
                        onChange={(e) => handleObjectiveProgressChange(e.target.value)}
                        className="flex-1"
                      />
                      <span className="w-10 text-center">{formData.objectiveProgress}%</span>
                    </div>
                    <Progress 
                      value={formData.objectiveProgress} 
                      className={cn("h-2", getProgressColorClass(formData.objectiveProgress))}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      Notes
                    </label>
                    <Textarea 
                      placeholder="Add notes about your objective progress..."
                      value={formData.objectiveNotes}
                      onChange={(e) => handleObjectiveNotesChange(e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        
        {currentStep === 3 && keyResults && keyResults.length > 0 && (
          <div className="space-y-6 py-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Update Key Results Progress
              </h3>
              
              <div className="space-y-4">
                {keyResults.map(kr => (
                  <Card key={kr.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold">
                        <div className="flex items-start">
                          <Target className="h-5 w-5 mr-2 text-secondary mt-0.5" />
                          <div>
                            {kr.title}
                          </div>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium text-gray-700">
                          Progress (%)
                        </label>
                        <div className="flex space-x-2 items-center">
                          <Input 
                            type="range" 
                            min="0" 
                            max="100" 
                            step="1"
                            value={formData.keyResults[kr.id]?.progress.toString() || "0"}
                            onChange={(e) => handleKeyResultProgressChange(kr.id.toString(), e.target.value)}
                            className="flex-1"
                          />
                          <span className="w-10 text-center">{formData.keyResults[kr.id]?.progress || 0}%</span>
                        </div>
                        <Progress 
                          value={formData.keyResults[kr.id]?.progress || 0} 
                          className={cn("h-2", getProgressColorClass(formData.keyResults[kr.id]?.progress || 0))}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <label className="text-sm font-medium text-gray-700">
                          Notes
                        </label>
                        <Textarea 
                          placeholder="Add notes about your key result progress..."
                          value={formData.keyResults[kr.id]?.notes || ""}
                          onChange={(e) => handleKeyResultNotesChange(kr.id.toString(), e.target.value)}
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {currentStep === 4 && (
          <div className="space-y-6 py-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Review and Submit
              </h3>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    <div className="flex items-start">
                      <Goal className="h-5 w-5 mr-2 text-primary mt-0.5" />
                      {selectedObjective?.title}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Progress:</span>
                      <span>{formData.objectiveProgress}%</span>
                    </div>
                    <Progress 
                      value={formData.objectiveProgress} 
                      className={cn("h-2 mt-1", getProgressColorClass(formData.objectiveProgress))}
                    />
                  </div>
                  
                  {formData.objectiveNotes && (
                    <div>
                      <span className="text-sm font-medium">Notes:</span>
                      <p className="text-sm mt-1">{formData.objectiveNotes}</p>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-semibold mb-3">Key Results:</h4>
                    
                    <div className="space-y-4">
                      {keyResults?.map(kr => (
                        <div key={kr.id}>
                          <div className="flex items-start">
                            <Target className="h-4 w-4 mr-2 text-secondary mt-0.5" />
                            <div className="flex-1">
                              <div className="text-sm">{kr.title}</div>
                              
                              <div className="flex justify-between text-xs mt-1">
                                <span>Progress:</span>
                                <span>{formData.keyResults[kr.id]?.progress || 0}%</span>
                              </div>
                              <Progress 
                                value={formData.keyResults[kr.id]?.progress || 0} 
                                className={cn("h-1.5 mt-1", getProgressColorClass(formData.keyResults[kr.id]?.progress || 0))}
                              />
                              
                              {formData.keyResults[kr.id]?.notes && (
                                <div className="mt-2">
                                  <span className="text-xs">Notes:</span>
                                  <p className="text-xs mt-0.5 text-muted-foreground">{formData.keyResults[kr.id]?.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        
        <DialogFooter className="flex justify-between">
          {currentStep > 1 && (
            <Button variant="outline" onClick={prevStep}>
              Back
            </Button>
          )}
          
          <div>
            {currentStep < 4 ? (
              <Button onClick={nextStep}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit}>
                Submit Updates
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}