import React, { useEffect } from 'react';
import { useMilestone } from '@/contexts/milestone-context';
import { useToast } from '@/hooks/use-toast';
import { Confetti } from '@/components/ui/confetti';
import { ToastAction } from '@/components/ui/toast';
import { 
  CircleCheck, 
  CircleDot, 
  BarChart, 
  Users, 
  Star 
} from 'lucide-react';

interface MilestoneIconProps {
  type: 'objective_completion' | 'key_result_completion' | 'objective_progress' | 'team_achievement' | 'personal_achievement';
  className?: string;
}

// Component to render the appropriate icon based on milestone type - with minimal design
const MilestoneIcon = ({ type, className = "h-5 w-5" }: MilestoneIconProps) => {
  switch (type) {
    case 'objective_completion':
      return <CircleDot className={`${className} text-primary stroke-[1.5]`} />;
    case 'key_result_completion':
      return <CircleCheck className={`${className} text-green-500 stroke-[1.5]`} />;
    case 'objective_progress':
      return <BarChart className={`${className} text-blue-500 stroke-[1.5]`} />;
    case 'team_achievement':
      return <Users className={`${className} text-yellow-500 stroke-[1.5]`} />;
    case 'personal_achievement':
      return <Star className={`${className} text-purple-500 stroke-[1.5]`} />;
    default:
      return <CircleDot className={`${className} text-primary stroke-[1.5]`} />;
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