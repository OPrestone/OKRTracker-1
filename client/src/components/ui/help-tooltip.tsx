import { useState, useEffect } from "react";
import { HelpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useHelp } from "@/hooks/use-help-context";

export interface HelpTooltipProps {
  id: string;
  title: string;
  description: string;
  position?: "top" | "right" | "bottom" | "left";
  className?: string;
  persistent?: boolean;
  onDismiss?: () => void;
  showForNewUsers?: boolean;
  feature?: "overview" | "search" | "objective" | "reports";
}

const TOOLTIPS_KEY = "okr-tooltips-seen";

export function HelpTooltip({
  id,
  title,
  description,
  position = "bottom",
  className,
  persistent = false,
  onDismiss,
  showForNewUsers = true,
  feature,
}: HelpTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hasBeenSeen, setHasBeenSeen] = useState(false);
  const { isNewUser } = useHelp();
  
  // Check local storage to see if this tooltip has been dismissed before
  useEffect(() => {
    // If we should only show for new users and the user is not new, don't show
    if (showForNewUsers && !isNewUser) {
      return;
    }
    
    try {
      const tooltipsSeen = JSON.parse(localStorage.getItem(TOOLTIPS_KEY) || '{}');
      const hasBeenDismissed = tooltipsSeen[id];
      
      if (!hasBeenDismissed && !hasBeenSeen) {
        // Only auto-show for first time users if persistent is true
        if (persistent) {
          setIsVisible(true);
          setHasBeenSeen(true);
        }
      }
    } catch (error) {
      console.error('Error parsing tooltips from localStorage', error);
      localStorage.setItem(TOOLTIPS_KEY, JSON.stringify({}));
    }
  }, [id, persistent, hasBeenSeen, isNewUser, showForNewUsers]);
  
  const { markOverviewSeen, markSearchUsed, markObjectiveCreated, markReportsViewed } = useHelp();
  
  const handleDismiss = () => {
    setIsVisible(false);
    
    try {
      // Store the dismissal in localStorage
      const tooltipsSeen = JSON.parse(localStorage.getItem(TOOLTIPS_KEY) || '{}');
      tooltipsSeen[id] = true;
      localStorage.setItem(TOOLTIPS_KEY, JSON.stringify(tooltipsSeen));
      
      // Mark the corresponding feature as seen if provided
      if (feature === "overview") {
        markOverviewSeen();
      } else if (feature === "search") {
        markSearchUsed();
      } else if (feature === "objective") {
        markObjectiveCreated();
      } else if (feature === "reports") {
        markReportsViewed();
      }
      
      if (onDismiss) {
        onDismiss();
      }
    } catch (error) {
      console.error('Error saving tooltip dismissal', error);
    }
  };
  
  const positionClasses = {
    top: "bottom-full mb-2",
    right: "left-full ml-2",
    bottom: "top-full mt-2",
    left: "right-full mr-2"
  };
  
  return (
    <div className="relative inline-flex">
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        onClick={() => setIsVisible(!isVisible)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <HelpCircle className="h-4 w-4" />
      </Button>
      
      {(isVisible || (isHovered && !persistent)) && (
        <Card 
          className={cn(
            "absolute z-50 w-72 shadow-md",
            positionClasses[position],
            className
          )}
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleDismiss}
                className="h-5 w-5 -mr-1 -mt-1"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-xs">{description}</CardDescription>
          </CardContent>
          {persistent && (
            <CardFooter className="pt-1 pb-2 flex justify-end">
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleDismiss}
                className="text-xs h-7 px-2"
              >
                Got it
              </Button>
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
}