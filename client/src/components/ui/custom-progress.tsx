import * as React from "react";
import { cn } from "@/lib/utils";

export interface CustomProgressProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  indicatorClassName?: string;
}

const CustomProgress = React.forwardRef<HTMLDivElement, CustomProgressProps>(
  ({ className, value, max = 100, indicatorClassName, ...props }, ref) => {
    const percentage = value != null ? Math.min(Math.max(value, 0), max) : 0;
    const calculatedValue = (percentage / max) * 100;

    return (
      <div
        ref={ref}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-primary/10",
          className
        )}
        {...props}
      >
        <div
          className={cn("h-full w-full flex-1 transition-all", indicatorClassName)}
          style={{ transform: `translateX(-${100 - calculatedValue}%)` }}
        />
      </div>
    );
  }
);
CustomProgress.displayName = "CustomProgress";

export { CustomProgress };