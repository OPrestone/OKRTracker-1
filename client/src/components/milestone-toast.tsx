import React, { useEffect } from 'react';
import { useMilestone } from '@/contexts/milestone-context';
import { useToast } from '@/hooks/use-toast';
import { Confetti } from '@/components/ui/confetti';
import { ToastAction } from '@/components/ui/toast';
import { LucideAward, LucideCheck, LucideTarget, LucideBarChart3, LucideUsers } from 'lucide-react';

interface MilestoneIconProps {
  type: 'objective_completion' | 'key_result_completion' | 'objective_progress' | 'team_achievement' | 'personal_achievement';
  className?: string;
}

// Component to render the appropriate icon based on milestone type
const MilestoneIcon = ({ type, className = "h-6 w-6" }: MilestoneIconProps) => {
  switch (type) {
    case 'objective_completion':
      return <LucideTarget className={`${className} text-primary`} />;
    case 'key_result_completion':
      return <LucideCheck className={`${className} text-green-500`} />;
    case 'objective_progress':
      return <LucideBarChart3 className={`${className} text-blue-500`} />;
    case 'team_achievement':
      return <LucideUsers className={`${className} text-yellow-500`} />;
    case 'personal_achievement':
      return <LucideAward className={`${className} text-purple-500`} />;
    default:
      return <LucideTarget className={`${className} text-primary`} />;
  }
};

export function MilestoneToast() {
  const { recentMilestone, acknowledgeMilestone } = useMilestone();
  const { toast } = useToast();

  useEffect(() => {
    if (recentMilestone && !recentMilestone.acknowledged) {
      // Show a toast notification for the milestone with icon in the description
      toast({
        title: recentMilestone.title,
        description: (
          <div className="flex items-center gap-3">
            <MilestoneIcon type={recentMilestone.type} />
            <span>{recentMilestone.description}</span>
          </div>
        ),
        duration: 8000, // Longer duration to allow user to read and celebrate
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