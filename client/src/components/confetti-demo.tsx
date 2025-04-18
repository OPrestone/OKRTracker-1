import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Confetti } from '@/components/ui/confetti';
import { useMilestone, MilestoneType } from '@/contexts/milestone-context';
import { LucideTarget, LucideCheck, LucideBarChart3, LucideUsers, LucideAward } from 'lucide-react';

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
          title: '🎯 Objective Complete!',
          description: 'You have completed an important objective',
          entityId: 1,
        };
        break;
      
      case 'key_result_completion':
        milestoneData = {
          type,
          title: '🚀 Key Result Achieved!',
          description: 'You have achieved a key result',
          entityId: 1,
        };
        break;
      
      case 'objective_progress':
        milestoneData = {
          type,
          title: `📈 Milestone Reached: ${progress}%`,
          description: `You've reached ${progress}% progress on your objective`,
          entityId: 1,
          threshold: progress,
        };
        break;
      
      case 'team_achievement':
        milestoneData = {
          type,
          title: '🏆 Team Achievement!',
          description: 'Your team has reached an important milestone',
          entityId: 1,
        };
        break;
      
      case 'personal_achievement':
        milestoneData = {
          type,
          title: '⭐ Personal Achievement!',
          description: 'You have reached a personal achievement',
          entityId: 1,
        };
        break;
    }
    
    addMilestone(milestoneData);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Milestone Celebration Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Manual Confetti Testing */}
        <Card>
          <CardHeader>
            <CardTitle>Test Confetti Animation</CardTitle>
            <CardDescription>
              Manually test different confetti animation styles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Confetti Type</label>
              <Select
                value={confettiType}
                onValueChange={(value) => setConfettiType(value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select confetti type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Confetti Types</SelectLabel>
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
            >
              Trigger Confetti
            </Button>
          </CardFooter>
        </Card>

        {/* Milestone Testing */}
        <Card>
          <CardHeader>
            <CardTitle>Test Milestone Celebration</CardTitle>
            <CardDescription>
              Test the full milestone celebration with toast notification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Progress Value (for Objective Progress)</label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[progress]}
                  onValueChange={(value) => setProgress(value[0])}
                  max={100}
                  step={5}
                  className="flex-1"
                />
                <span className="w-12 text-right">{progress}%</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col space-y-2">
            <div className="grid grid-cols-2 gap-2 w-full">
              <Button
                onClick={() => handleCreateMilestone('objective_completion')}
                className="w-full"
                variant="outline"
              >
                <LucideTarget className="mr-2 h-4 w-4" />
                Objective
              </Button>
              <Button
                onClick={() => handleCreateMilestone('key_result_completion')}
                className="w-full"
                variant="outline"
              >
                <LucideCheck className="mr-2 h-4 w-4" />
                Key Result
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2 w-full">
              <Button
                onClick={() => handleCreateMilestone('objective_progress')}
                className="w-full"
                variant="outline"
              >
                <LucideBarChart3 className="mr-2 h-4 w-4" />
                Progress
              </Button>
              <Button
                onClick={() => handleCreateMilestone('team_achievement')}
                className="w-full"
                variant="outline"
              >
                <LucideUsers className="mr-2 h-4 w-4" />
                Team
              </Button>
              <Button
                onClick={() => handleCreateMilestone('personal_achievement')}
                className="w-full"
                variant="outline"
              >
                <LucideAward className="mr-2 h-4 w-4" />
                Personal
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
      
      {/* Confetti component with controlled trigger */}
      <Confetti trigger={showConfetti} type={confettiType} />
    </div>
  );
}