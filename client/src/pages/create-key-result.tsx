import React, { useState, useEffect } from "react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Target,
  TrendingUp,
  Loader2,
  Check,
  ArrowLeft,
  Plus,
  ChevronDown,
  Calendar,
  Users,
  Hash,
  DollarSign,
  BarChart3,
  Star,
  Clock,
  CalendarDays,
  Zap,
  CheckCircle,
  ToggleRight
} from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getQueryFn, apiRequest } from "@/lib/queryClient";

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  username: string;
  teamId?: string | null;
}

interface KeyResult {
  id: string;
  title: string;
  description: string;
  currentValue: number;
  targetValue: number;
  startValue: number;
  progress: number;
  assignedToId?: string;
  type?: string;
  measureType?: string;
  targetType?: string;
  contributors?: string[];
  startDate?: string;
  dueDate?: string;
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
    assignedToId: '',
    measureType: 'percentage',
    targetType: 'increase',
    startValue: 0,
    currentValue: 0,
    targetValue: 100,
    type: 'key-result',
    contributors: [] as string[],
    startDate: '',
    dueDate: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedKeyResults, setSavedKeyResults] = useState<KeyResult[]>([]);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [showDifference, setShowDifference] = useState(false);
  const [contributorsOpen, setContributorsOpen] = useState(false);

  // Generate contextual examples based on objective
  const getExamplesForObjective = () => {
    const objectiveTitle = objective?.title?.toLowerCase() || '';
    
    // Revenue/Financial objectives
    if (objectiveTitle.includes('revenue') || objectiveTitle.includes('sales') || objectiveTitle.includes('profit')) {
      return [
        { name: "Increase monthly recurring revenue from $50K to $75K", type: "Revenue Growth" },
        { name: "Achieve 85% gross profit margin", type: "Profitability" },
        { name: "Generate $200K in new customer revenue", type: "New Business" },
        { name: "Reduce customer acquisition cost from $150 to $100", type: "Cost Efficiency" }
      ];
    }
    
    // Customer/Growth objectives
    if (objectiveTitle.includes('customer') || objectiveTitle.includes('user') || objectiveTitle.includes('growth')) {
      return [
        { name: "Increase monthly active users from 10K to 15K", type: "User Growth" },
        { name: "Achieve 95% customer satisfaction score", type: "Customer Experience" },
        { name: "Acquire 500 new paying customers", type: "Customer Acquisition" },
        { name: "Reduce customer churn rate from 5% to 2%", type: "Retention" }
      ];
    }
    
    // Product/Quality objectives
    if (objectiveTitle.includes('product') || objectiveTitle.includes('quality') || objectiveTitle.includes('feature')) {
      return [
        { name: "Deploy 3 major product features", type: "Product Development" },
        { name: "Achieve 99.9% system uptime", type: "Reliability" },
        { name: "Reduce average page load time to under 2 seconds", type: "Performance" },
        { name: "Complete 100% of security audit recommendations", type: "Security" }
      ];
    }
    
    // Team/Operations objectives
    if (objectiveTitle.includes('team') || objectiveTitle.includes('operation') || objectiveTitle.includes('efficiency')) {
      return [
        { name: "Hire and onboard 5 senior engineers", type: "Team Building" },
        { name: "Achieve 90% employee satisfaction score", type: "Employee Experience" },
        { name: "Reduce project delivery time by 25%", type: "Efficiency" },
        { name: "Complete training for 100% of team members", type: "Development" }
      ];
    }
    
    // Default examples for any objective
    return [
      { name: "Increase key metric from X to Y", type: "Growth" },
      { name: "Achieve Z% completion rate", type: "Performance" },
      { name: "Reduce process time by X%", type: "Efficiency" },
      { name: "Launch N new initiatives", type: "Innovation" }
    ];
  };

  const handleUseExample = (exampleName: string) => {
    setKeyResultData(prev => ({ ...prev, title: exampleName }));
    setShowExamples(false);
  };

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

  // Fetch users for Lead and Contributors
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch teams data to display team name
  const { data: teams = [] } = useQuery({
    queryKey: ['/api/teams'],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Create key result mutation using existing working objectives endpoint
  const createKeyResultMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('=== CREATING KEY RESULT VIA OBJECTIVES UPDATE ===');
      console.log('Data being sent:', data);
      
      // Use the working objectives endpoint that we know functions properly
      const keyResultData = {
        title: data.title,
        description: data.description || '',
        startValue: data.startValue?.toString() || '0',
        currentValue: data.currentValue?.toString() || data.startValue?.toString() || '0',
        targetValue: data.targetValue?.toString() || '100',
        measureType: data.measureType || 'percentage',
        targetType: data.targetType || 'increase',
        assignedToId: data.assignedToId || null,
        status: 'not_started',
        progress: Math.round(((parseFloat(data.currentValue || '0') - parseFloat(data.startValue || '0')) / (parseFloat(data.targetValue || '100') - parseFloat(data.startValue || '0'))) * 100) || 0
      };
      
      // Update the objective to add this key result
      const response = await apiRequest('PUT', `/api/objectives/${objectiveId}/key-results`, keyResultData);
      return response.json();
    },
    onSuccess: (newKeyResult: KeyResult) => {
      setSavedKeyResults(prev => [...prev, newKeyResult]);
      setKeyResultData({
        title: '',
        description: '',
        assignedToId: '',
        measureType: 'numerical',
        targetType: 'increase',
        startValue: 0,
        currentValue: 0,
        targetValue: 100,
        type: 'key-result',
        contributors: [],
        startDate: '',
        dueDate: ''
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
    
    // Description is optional, so no validation needed
    
    if (keyResultData.targetValue <= keyResultData.startValue) {
      newErrors.targetValue = 'Target value must be greater than start value';
    }
    
    // Current value can be equal to start value, only prevent it from being less
    // Remove this validation as it's too restrictive for initial key results
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveKeyResult = async () => {
    console.log('Save button clicked, form data:', keyResultData);
    console.log('Objective ID:', objectiveId);
    
    if (!validateForm()) {
      console.log('Form validation failed, errors:', errors);
      return;
    }
    
    console.log('Form validation passed, submitting...');
    setIsSubmitting(true);
    try {
      const result = await createKeyResultMutation.mutateAsync(keyResultData);
      console.log('Key result created successfully:', result);
    } catch (error) {
      console.error('Error creating key result:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAnother = () => {
    console.log('Add Another button clicked!');
    handleSaveKeyResult();
  };

  const handleFinish = () => {
    console.log('Finish button clicked!');
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
              {savedKeyResults.length === 0 ? 'Add Key Result or Initiative' : 'Add Another Key Result'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="title">Name *</Label>
              <Input
                id="title"
                placeholder="Net profit increase of X%"
                value={keyResultData.title}
                onChange={(e) => setKeyResultData(prev => ({ ...prev, title: e.target.value }))}
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title}</p>
              )}
              <p className="text-sm text-blue-600">Need inspiration? Check <span className="underline cursor-pointer" onClick={() => setShowExamples(true)}>examples</span>.</p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description <span className="text-gray-400">Optional</span></Label>
              <Textarea
                id="description"
                placeholder="Add a description"
                value={keyResultData.description}
                onChange={(e) => setKeyResultData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            {/* Lead */}
            <div className="space-y-2">
              <Label>Lead</Label>
              <Select
                value={keyResultData.assignedToId}
                onValueChange={(value) => setKeyResultData(prev => ({ ...prev, assignedToId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select lead">
                    {keyResultData.assignedToId && users.find(u => u.id === keyResultData.assignedToId) && (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {(users.find(u => u.id === keyResultData.assignedToId)?.firstName?.[0] || '') + 
                             (users.find(u => u.id === keyResultData.assignedToId)?.lastName?.[0] || '')}
                          </AvatarFallback>
                        </Avatar>
                        <span>{users.find(u => u.id === keyResultData.assignedToId)?.firstName} {users.find(u => u.id === keyResultData.assignedToId)?.lastName}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {(user.firstName?.[0] || '') + (user.lastName?.[0] || '')}
                          </AvatarFallback>
                        </Avatar>
                        <span>{user.firstName} {user.lastName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Objective - Auto-populated */}
            <div className="space-y-2">
              <Label>Objective</Label>
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium">{objective?.title}</span>
              </div>
            </div>

            {/* Team & Ownership - Auto-populated from objective */}
            <div className="space-y-3">
              <Label>Team & Ownership</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Owner */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">Owner</Label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                    {(() => {
                      const owner = users.find(u => u.id === objective?.ownerId);
                      return owner ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {(owner.firstName?.[0] || '') + (owner.lastName?.[0] || '')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{owner.firstName} {owner.lastName}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No owner assigned</span>
                      );
                    })()}
                  </div>
                </div>

                {/* Team */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">Team</Label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                    {(() => {
                      const team = teams.find(t => t.id === objective?.teamId);
                      return team ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                            <div className="w-3 h-3 bg-blue-500 rounded"></div>
                          </div>
                          <span className="text-sm font-medium">{team.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No team assigned</span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Measure as */}
            <div className="space-y-2">
              <Label>Measure as</Label>
              <Select
                value={keyResultData.measureType}
                onValueChange={(value) => setKeyResultData(prev => ({ ...prev, measureType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select measurement type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="numerical">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Number
                    </div>
                  </SelectItem>
                  <SelectItem value="percentage">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Percentage (%)
                    </div>
                  </SelectItem>
                  <SelectItem value="currency">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Currency ($)
                    </div>
                  </SelectItem>
                  <SelectItem value="ratio">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Ratio (e.g., 3:1)
                    </div>
                  </SelectItem>
                  <SelectItem value="score">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Score (1-10)
                    </div>
                  </SelectItem>
                  <SelectItem value="time">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Time (hours/days)
                    </div>
                  </SelectItem>
                  <SelectItem value="frequency">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Frequency (per week/month)
                    </div>
                  </SelectItem>
                  <SelectItem value="rate">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Rate (per unit)
                    </div>
                  </SelectItem>
                  <SelectItem value="milestone">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Milestone completion
                    </div>
                  </SelectItem>
                  <SelectItem value="binary">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Yes/No
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Target type, Start value, Increase to */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Target type</Label>
                <Select
                  value={keyResultData.targetType}
                  onValueChange={(value) => setKeyResultData(prev => ({ ...prev, targetType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Increase to" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="increase">Increase to</SelectItem>
                    <SelectItem value="decrease">Decrease to</SelectItem>
                    <SelectItem value="maintain">Maintain at</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Start value</Label>
                <div className="flex items-center">
                  <Hash className="h-4 w-4 text-gray-400 mr-2" />
                  <Input
                    type="number"
                    value={keyResultData.startValue}
                    onChange={(e) => setKeyResultData(prev => ({ ...prev, startValue: Number(e.target.value) }))}
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>{keyResultData.targetType === 'increase' ? 'Increase to' : keyResultData.targetType === 'decrease' ? 'Decrease to' : 'Maintain at'}</Label>
                <div className="flex items-center">
                  <Hash className="h-4 w-4 text-gray-400 mr-2" />
                  <Input
                    type="number"
                    value={keyResultData.targetValue}
                    onChange={(e) => setKeyResultData(prev => ({ ...prev, targetValue: Number(e.target.value) }))}
                    placeholder="100"
                    className={errors.targetValue ? "border-red-500" : ""}
                  />
                </div>
                {errors.targetValue && (
                  <p className="text-sm text-red-600">{errors.targetValue}</p>
                )}
              </div>
            </div>

            {/* Result type */}
            <div className="space-y-3">
              <Label>Result type</Label>
              <div className="space-y-3">
                <div 
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    keyResultData.type === 'key-result' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setKeyResultData(prev => ({ ...prev, type: 'key-result' }))}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 mt-0.5 ${
                      keyResultData.type === 'key-result' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                    }`}>
                      {keyResultData.type === 'key-result' && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">Key Result</h4>
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Measures success for the Objective and impacts its progress and status.</p>
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    keyResultData.type === 'initiative' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setKeyResultData(prev => ({ ...prev, type: 'initiative' }))}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 mt-0.5 ${
                      keyResultData.type === 'initiative' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                    }`}>
                      {keyResultData.type === 'initiative' && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">Initiative</h4>
                        <div className="h-4 w-4 text-green-500">
                          <svg viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                          </svg>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Supporting work that doesn't affect the Objective's progress and status.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>What is the difference?</span>
                <div 
                  className="w-4 h-4 border border-gray-400 rounded-full flex items-center justify-center cursor-pointer hover:border-blue-500 hover:text-blue-500 transition-colors"
                  onClick={() => setShowDifference(true)}
                >
                  <span className="text-xs">?</span>
                </div>
              </div>
            </div>

            {/* Advanced Options */}
            <Collapsible open={showAdvancedOptions} onOpenChange={setShowAdvancedOptions}>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                Advanced Options
                <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedOptions ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-6 mt-6">
                {/* Contributors */}
                <div className="space-y-2">
                  <Label>Contributors <span className="text-gray-400">Optional</span></Label>
                  <div className="space-y-2">
                    {/* Selected Contributors */}
                    {keyResultData.contributors.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {keyResultData.contributors.map((contributorId) => {
                          const contributor = users.find(u => u.id === contributorId);
                          return contributor ? (
                            <div key={contributorId} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                              <Avatar className="h-4 w-4">
                                <AvatarFallback className="text-xs">
                                  {(contributor.firstName?.[0] || '') + (contributor.lastName?.[0] || '')}
                                </AvatarFallback>
                              </Avatar>
                              <span>{contributor.firstName} {contributor.lastName}</span>
                              <button
                                type="button"
                                onClick={() => setKeyResultData(prev => ({
                                  ...prev,
                                  contributors: prev.contributors.filter(id => id !== contributorId)
                                }))}
                                className="ml-1 text-blue-600 hover:text-blue-800"
                              >
                                ×
                              </button>
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                    
                    {/* Contributors Selector */}
                    <Popover open={contributorsOpen} onOpenChange={setContributorsOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={contributorsOpen}
                          className="w-full justify-between"
                        >
                          Add contributors...
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search team members..." />
                          <CommandList>
                            <CommandEmpty>No team member found.</CommandEmpty>
                            <CommandGroup>
                              {users
                                .filter(user => !keyResultData.contributors.includes(user.id))
                                .map((user) => (
                                  <CommandItem
                                    key={user.id}
                                    value={`${user.firstName} ${user.lastName}`}
                                    onSelect={() => {
                                      setKeyResultData(prev => ({
                                        ...prev,
                                        contributors: [...prev.contributors, user.id]
                                      }));
                                      setContributorsOpen(false);
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-6 w-6">
                                        <AvatarFallback className="text-xs">
                                          {(user.firstName?.[0] || '') + (user.lastName?.[0] || '')}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span>{user.firstName} {user.lastName}</span>
                                    </div>
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Integration */}
                <div className="space-y-2">
                  <Label>Integration <span className="text-gray-400">Optional</span></Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google-analytics">Google Analytics</SelectItem>
                      <SelectItem value="salesforce">Salesforce</SelectItem>
                      <SelectItem value="hubspot">HubSpot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Start date */}
                <div className="space-y-2">
                  <Label>Start date <span className="text-gray-400">Optional</span></Label>
                  <div className="relative">
                    <Input
                      type="date"
                      value={keyResultData.startDate}
                      onChange={(e) => setKeyResultData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="pl-10"
                    />
                    <Calendar className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                </div>

                {/* Due date */}
                <div className="space-y-2">
                  <Label>Due date <span className="text-gray-400">Optional</span></Label>
                  <div className="relative">
                    <Input
                      type="date"
                      value={keyResultData.dueDate}
                      onChange={(e) => setKeyResultData(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="pl-10"
                    />
                    <Calendar className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={() => {
                  console.log('Button clicked directly!');
                  alert('Button clicked!');
                  handleAddAnother();
                }}
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

      {/* Examples Dialog */}
      <Dialog open={showExamples} onOpenChange={setShowExamples}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Key Result Examples</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Here are some examples relevant to your objective: <span className="font-medium">"{objective?.title}"</span>
            </p>
            <div className="grid gap-3">
              {getExamplesForObjective().map((example, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleUseExample(example.name)}
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{example.name}</h4>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {example.type}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm">
                    Use This Example
                  </Button>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500">
                Click any example to use it as your key result name. You can always modify it afterwards.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Difference Explanation Dialog */}
      <Dialog open={showDifference} onOpenChange={setShowDifference}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Key Results vs Initiatives</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <p className="text-sm text-gray-600">
              Understanding the difference helps you choose the right type for your goal and ensures proper objective tracking.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Key Results */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-blue-900">Key Results</h3>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="font-medium text-blue-900 mb-2">What they are:</p>
                    <p className="text-blue-800">Measurable outcomes that directly indicate success toward your objective. They answer "How will we know if we achieved our objective?"</p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="font-medium text-gray-900">Key characteristics:</p>
                    <ul className="space-y-1 text-gray-700 ml-4">
                      <li>• <strong>Measurable:</strong> Always have specific numbers or percentages</li>
                      <li>• <strong>Impact objective progress:</strong> Directly affect the objective's completion status</li>
                      <li>• <strong>Outcome-focused:</strong> Focus on results, not activities</li>
                      <li>• <strong>Time-bound:</strong> Have clear deadlines</li>
                    </ul>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="font-medium text-gray-900 mb-1">Examples:</p>
                    <ul className="text-xs text-gray-700 space-y-1">
                      <li>• Increase revenue from $100K to $150K</li>
                      <li>• Achieve 95% customer satisfaction score</li>
                      <li>• Reduce churn rate from 8% to 3%</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Initiatives */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-green-900">Initiatives</h3>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="font-medium text-green-900 mb-2">What they are:</p>
                    <p className="text-green-800">Supporting work and activities that help achieve key results but don't directly measure objective success. They answer "What will we do?"</p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="font-medium text-gray-900">Key characteristics:</p>
                    <ul className="space-y-1 text-gray-700 ml-4">
                      <li>• <strong>Activity-focused:</strong> Track completion of specific tasks or projects</li>
                      <li>• <strong>Supporting role:</strong> Don't affect objective progress directly</li>
                      <li>• <strong>Binary completion:</strong> Either done or not done</li>
                      <li>• <strong>Enablers:</strong> Create conditions for key results to succeed</li>
                    </ul>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="font-medium text-gray-900 mb-1">Examples:</p>
                    <ul className="text-xs text-gray-700 space-y-1">
                      <li>• Launch new marketing campaign</li>
                      <li>• Implement customer feedback system</li>
                      <li>• Train sales team on new processes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 text-yellow-600 mt-0.5">💡</div>
                  <div className="text-sm">
                    <p className="font-medium text-yellow-900 mb-1">Best Practice:</p>
                    <p className="text-yellow-800">Use 2-3 Key Results to measure objective success, and add Initiatives as needed to track supporting work. Key Results should make up the majority of your tracking.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}