import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Confetti } from '@/components/ui/confetti';
import { useMilestone, MilestoneType } from '@/contexts/milestone-context';
import { 
  CircleCheck, 
  CircleDot, 
  BarChart, 
  Users, 
  Star 
} from 'lucide-react';

import ErrorBoundary from "@/components/error-boundary";

export function ConfettiDemo() {
  const [confettiType, setConfettiType] = useState<'achievement' | 'milestone' | 'completion' | 'celebration'>('celebration');
  const [progress, setProgress] = useState<number>(50);
  const [showConfetti, setShowConfetti] = useState(false);
  const { addMilestone } = useMilestone();

  const handleTriggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
  };

  const handleCreateMilestone = (type: MilestoneType) => {
    let milestoneData;
    
    switch (type) {
      case 'objective_completion':
        milestoneData = {
          type,
          title: 'Objective Complete',
          description: 'You have completed an important objective',
          entityId: 1,
        };
        break;
      
      case 'key_result_completion':
        milestoneData = {
          type,
          title: 'Key Result Achieved',
          description: 'You have achieved a key result',
          entityId: 1,
        };
        break;
      
      case 'objective_progress':
        milestoneData = {
          type,
          title: `Progress: ${progress}%`,
          description: `You've reached ${progress}% progress on your objective`,
          entityId: 1,
          threshold: progress,
        };
        break;
      
      case 'team_achievement':
        milestoneData = {
          type,
          title: 'Team Achievement',
          description: 'Your team has reached an important milestone',
          entityId: 1,
        };
        break;
      
      case 'personal_achievement':
        milestoneData = {
          type,
          title: 'Personal Achievement',
          description: 'You have reached a personal achievement',
          entityId: 1,
        };
        break;
    }
    
    addMilestone(milestoneData);
  };

  return (
    <ErrorBoundary>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-medium mb-8 text-center">Milestone Celebration Demo</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Manual Confetti Testing */}
        <Card className="border-muted/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Test Confetti Animation</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Select a confetti style and trigger a celebration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pb-2">
            <div>
              <label className="text-sm font-medium mb-2 block">Confetti Type</label>
              <Select
                value={confettiType}
                onValueChange={(value) => setConfettiType(value as any)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Animation Types</SelectLabel>
                    <SelectItem value="achievement">Achievement</SelectItem>
                    <SelectItem value="milestone">Milestone</SelectItem>
                    <SelectItem value="completion">Completion</SelectItem>
                    <SelectItem value="celebration">Celebration</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleTriggerConfetti}
              className="w-full"
              variant="default"
              size="sm"
            >
              Trigger Confetti
            </Button>
          </CardFooter>
        </Card>

        {/* Milestone Testing */}
        <Card className="border-muted/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Test Milestone Notifications</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Trigger milestone celebrations with toast notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pb-2">
            <div>
              <label className="text-sm font-medium mb-2 block">Progress Value</label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[progress]}
                  onValueChange={(value) => setProgress(value[0])}
                  max={100}
                  step={5}
                  className="flex-1"
                />
                <span className="w-12 text-right text-sm">{progress}%</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col space-y-2">
            <div className="grid grid-cols-2 gap-2 w-full">
              <Button
                onClick={() => handleCreateMilestone('objective_completion')}
                className="w-full h-8 text-xs"
                variant="outline"
                size="sm"
              >
                <CircleDot className="mr-2 h-3.5 w-3.5 stroke-[1.5]" />
                Objective
              </Button>
              <Button
                onClick={() => handleCreateMilestone('key_result_completion')}
                className="w-full h-8 text-xs"
                variant="outline"
                size="sm"
              >
                <CircleCheck className="mr-2 h-3.5 w-3.5 stroke-[1.5]" />
                Key Result
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2 w-full">
              <Button
                onClick={() => handleCreateMilestone('objective_progress')}
                className="w-full h-8 text-xs"
                variant="outline"
                size="sm"
              >
                <BarChart className="mr-2 h-3.5 w-3.5 stroke-[1.5]" />
                Progress
              </Button>
              <Button
                onClick={() => handleCreateMilestone('team_achievement')}
                className="w-full h-8 text-xs"
                variant="outline"
                size="sm"
              >
                <Users className="mr-2 h-3.5 w-3.5 stroke-[1.5]" />
                Team
              </Button>
              <Button
                onClick={() => handleCreateMilestone('personal_achievement')}
                className="w-full h-8 text-xs"
                variant="outline"
                size="sm"
              >
                <Star className="mr-2 h-3.5 w-3.5 stroke-[1.5]" />
                Personal
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
      
      {/* Explanation */}
      <div className="mt-8 p-5 rounded-lg border border-muted bg-muted/20">
        <h2 className="text-lg font-medium mb-3">How to Use Celebrations</h2>
        <p className="text-sm text-muted-foreground mb-2">
          The confetti celebration system provides visual feedback when users complete important milestones:
        </p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          <li>Different celebration styles based on achievement type</li>
          <li>Customizable animation patterns and colors</li>
          <li>Toast notifications with acknowledgment option</li>
          <li>Auto-dismissal to prevent notification overload</li>
        </ul>
      </div>
      
      {/* Confetti component with controlled trigger */}
      <Confetti trigger={showConfetti} type={confettiType} />
    </div>
    </ErrorBoundary>
  );
}