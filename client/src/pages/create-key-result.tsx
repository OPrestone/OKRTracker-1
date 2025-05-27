import { useState, useEffect } from "react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Target,
  TrendingUp,
  Loader2,
  Check,
  ArrowLeft,
  Plus
} from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface KeyResult {
  id: string;
  title: string;
  description: string;
  currentValue: number;
  targetValue: number;
  startValue: number;
  progress: number;
}

interface Objective {
  id: string;
  title: string;
  description: string;
  status: string;
  level: string;
  keyResults?: KeyResult[];
}

export default function CreateKeyResult() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get objective ID from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const objectiveId = urlParams.get('objectiveId');
  
  const [keyResultData, setKeyResultData] = useState({
    title: '',
    description: '',
    startValue: 0,
    currentValue: 0,
    targetValue: 100
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedKeyResults, setSavedKeyResults] = useState<KeyResult[]>([]);

  // Fetch objective details
  const { data: objective, isLoading } = useQuery({
    queryKey: ['/api/objectives', objectiveId],
    queryFn: async () => {
      if (!objectiveId) throw new Error('No objective ID provided');
      const response = await fetch(`/api/objectives/${objectiveId}`);
      if (!response.ok) throw new Error('Failed to fetch objective');
      const data = await response.json();
      return data as Objective;
    },
    enabled: !!objectiveId
  });

  // Create key result mutation
  const createKeyResultMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/key-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          objectiveId,
          progress: Math.round(((data.currentValue - data.startValue) / (data.targetValue - data.startValue)) * 100)
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create key result');
      }
      
      return response.json();
    },
    onSuccess: (newKeyResult: KeyResult) => {
      setSavedKeyResults(prev => [...prev, newKeyResult]);
      setKeyResultData({
        title: '',
        description: '',
        startValue: 0,
        currentValue: 0,
        targetValue: 100
      });
      setErrors({});
      toast({
        title: "Key Result Created",
        description: "Your key result has been successfully created.",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/objectives', objectiveId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to create key result. Please try again.",
        variant: "destructive",
      });
    }
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!keyResultData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!keyResultData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (keyResultData.targetValue <= keyResultData.startValue) {
      newErrors.targetValue = 'Target value must be greater than start value';
    }
    
    if (keyResultData.currentValue < keyResultData.startValue) {
      newErrors.currentValue = 'Current value cannot be less than start value';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveKeyResult = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await createKeyResultMutation.mutateAsync(keyResultData);
    } catch (error) {
      console.error('Error creating key result:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAnother = () => {
    handleSaveKeyResult();
  };

  const handleFinish = () => {
    if (keyResultData.title.trim() || keyResultData.description.trim()) {
      // Save current key result first if there's data
      handleSaveKeyResult();
      setTimeout(() => {
        setLocation(`/objective/${objectiveId}`);
      }, 1000);
    } else {
      setLocation(`/objective/${objectiveId}`);
    }
  };

  if (!objectiveId) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6 max-w-4xl">
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">No Objective Selected</h2>
            <p className="text-gray-500 mb-4">Please select an objective to create key results for.</p>
            <Button onClick={() => setLocation('/')}>Go to Dashboard</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6 max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading objective...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Add Key Results" 
      subtitle={`Define measurable key results for: ${objective?.title}`}
    >
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation(`/objective/${objectiveId}`)}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="rounded-full bg-primary/10 p-2">
              <TrendingUp className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Add Key Results</h1>
              <p className="text-sm text-gray-500 mt-1">Create measurable outcomes for your objective</p>
            </div>
          </div>
        </div>

        {/* Objective Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Objective
            </CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold text-lg mb-2">{objective?.title}</h3>
            <p className="text-gray-600">{objective?.description}</p>
          </CardContent>
        </Card>

        {/* Saved Key Results */}
        {savedKeyResults.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                Saved Key Results ({savedKeyResults.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {savedKeyResults.map((kr, index) => (
                  <div key={kr.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex-shrink-0">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{kr.title}</h4>
                      <p className="text-sm text-gray-600">{kr.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Result Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {savedKeyResults.length === 0 ? 'Create Your First Key Result' : 'Add Another Key Result'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Increase monthly active users"
                value={keyResultData.title}
                onChange={(e) => setKeyResultData(prev => ({ ...prev, title: e.target.value }))}
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe what success looks like and how it will be measured"
                value={keyResultData.description}
                onChange={(e) => setKeyResultData(prev => ({ ...prev, description: e.target.value }))}
                className={errors.description ? "border-red-500" : ""}
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Values */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startValue">Start Value</Label>
                <Input
                  id="startValue"
                  type="number"
                  value={keyResultData.startValue}
                  onChange={(e) => setKeyResultData(prev => ({ ...prev, startValue: Number(e.target.value) }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currentValue">Current Value</Label>
                <Input
                  id="currentValue"
                  type="number"
                  value={keyResultData.currentValue}
                  onChange={(e) => setKeyResultData(prev => ({ ...prev, currentValue: Number(e.target.value) }))}
                  className={errors.currentValue ? "border-red-500" : ""}
                />
                {errors.currentValue && (
                  <p className="text-sm text-red-600">{errors.currentValue}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="targetValue">Target Value *</Label>
                <Input
                  id="targetValue"
                  type="number"
                  value={keyResultData.targetValue}
                  onChange={(e) => setKeyResultData(prev => ({ ...prev, targetValue: Number(e.target.value) }))}
                  className={errors.targetValue ? "border-red-500" : ""}
                />
                {errors.targetValue && (
                  <p className="text-sm text-red-600">{errors.targetValue}</p>
                )}
              </div>
            </div>

            {/* Progress Preview */}
            {keyResultData.targetValue > keyResultData.startValue && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <Label className="text-sm font-medium">Progress Preview</Label>
                <div className="mt-2">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Current Progress</span>
                    <span>
                      {Math.round(((keyResultData.currentValue - keyResultData.startValue) / (keyResultData.targetValue - keyResultData.startValue)) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300" 
                      style={{ 
                        width: `${Math.max(0, Math.min(100, ((keyResultData.currentValue - keyResultData.startValue) / (keyResultData.targetValue - keyResultData.startValue)) * 100))}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={handleAddAnother}
                disabled={isSubmitting}
                variant="outline"
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Save & Add Another
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleFinish}
                disabled={isSubmitting}
                className="flex-1"
              >
                {savedKeyResults.length === 0 ? 'Save & Finish' : 'Finish Adding Key Results'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}