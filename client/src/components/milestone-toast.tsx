import React, { useEffect } from 'react';
import { useMilestone } from '@/contexts/milestone-context';
import { useToast } from '@/hooks/use-toast';
import { Confetti } from '@/components/ui/confetti';
import { ToastAction } from '@/components/ui/toast';
import { LucideAward, LucideCheck, LucideTarget, LucideBarChart3, LucideUsers } from 'lucide-react';

// Icon mapping based on milestone type
const milestoneIcons = {
  objective_completion: <LucideTarget className="h-6 w-6 text-primary" />,
  key_result_completion: <LucideCheck className="h-6 w-6 text-green-500" />,
  objective_progress: <LucideBarChart3 className="h-6 w-6 text-blue-500" />,
  team_achievement: <LucideUsers className="h-6 w-6 text-yellow-500" />,
  personal_achievement: <LucideAward className="h-6 w-6 text-purple-500" />,
};

export function MilestoneToast() {
  const { recentMilestone, acknowledgeMilestone } = useMilestone();
  const { toast } = useToast();

  useEffect(() => {
    if (recentMilestone && !recentMilestone.acknowledged) {
      // Show a toast notification for the milestone
      toast({
        title: recentMilestone.title,
        description: recentMilestone.description,
        duration: 8000, // Longer duration to allow user to read and celebrate
        icon: milestoneIcons[recentMilestone.type],
        action: (
          <ToastAction 
            altText="Acknowledge" 
            onClick={() => acknowledgeMilestone(recentMilestone.id)}
          >
            Got it
          </ToastAction>
        ),
      });
      
      // Auto-acknowledge after 10 seconds (in case user doesn't manually acknowledge)
      const timer = setTimeout(() => {
        acknowledgeMilestone(recentMilestone.id);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [recentMilestone, acknowledgeMilestone, toast]);

  return (
    <Confetti 
      trigger={!!(recentMilestone && !recentMilestone.acknowledged)}
      type={recentMilestone?.type === 'objective_completion' ? 'completion' : 
            recentMilestone?.type === 'key_result_completion' ? 'milestone' :
            recentMilestone?.type === 'team_achievement' ? 'celebration' : 'achievement'}
    />
  );
}