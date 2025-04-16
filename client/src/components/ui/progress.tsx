import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  status?: "on_track" | "at_risk" | "behind" | string;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, status, ...props }, ref) => {
  // Determine color based on value or status
  const getProgressColor = () => {
    if (status) {
      switch (status) {
        case "on_track":
          return "bg-green-500";
        case "at_risk":
          return "bg-amber-500";
        case "behind":
          return "bg-red-500";
        default:
          break;
      }
    }
    
    // If no status is provided, determine color by progress value
    const progressValue = value || 0;
    if (progressValue >= 70) {
      return "bg-green-500";
    } else if (progressValue >= 40) {
      return "bg-amber-500";
    } else {
      return "bg-red-500";
    }
  };
  
  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn("h-full w-full flex-1 transition-all", getProgressColor())}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
