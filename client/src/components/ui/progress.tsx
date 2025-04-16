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
    
    // If no status is provided, determine color by progress value according to the new requirements
    const progressValue = value || 0;
    if (progressValue >= 76) {
      return "bg-green-500"; // Green: 76-100%
    } else if (progressValue >= 51) {
      return "bg-yellow-500"; // Yellow: 51-75%
    } else if (progressValue >= 26) {
      return "bg-orange-500"; // Orange: 26-50%
    } else {
      return "bg-red-500"; // Red: 0-25%
    }
  };
  
  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800",
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
