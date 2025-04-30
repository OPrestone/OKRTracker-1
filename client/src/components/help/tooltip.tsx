import React, { useState, useEffect, forwardRef } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon, X, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHelp } from "@/hooks/use-help-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface HelpTooltipProps {
  id: string;
  title: string;
  description: string;
  children?: React.ReactNode;
  showFor?: number; // number of times to show for new users
  persistent?: boolean; // whether to show as a card instead of a tooltip
  position?: "top" | "right" | "bottom" | "left"; // position of the persistent tooltip
  feature?: "overview" | "search" | "objective" | "reports"; // feature to mark as seen
  className?: string;
}

// Use localStorage to track which tooltips the user has seen
const TOOLTIP_VIEWS_KEY = "okr-tooltip-views";
const TOOLTIPS_DISMISSED_KEY = "okr-tooltips-dismissed";

export const HelpTooltip = forwardRef<HTMLDivElement, HelpTooltipProps>((props, ref) => {
  const {
    id,
    title,
    description,
    children,
    showFor = 3,
    persistent = false,
    position = "bottom",
    feature,
    className
  } = props;
  
  const [showTooltip, setShowTooltip] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [views, setViews] = useState(0);
  const [open, setOpen] = useState(false);
  const { isNewUser, markOverviewSeen, markSearchUsed, markObjectiveCreated, markReportsViewed } = useHelp();

  // Initialize view tracking without auto-showing tooltips
  useEffect(() => {
    // Still track views for analytics purposes but don't auto-show tooltips
    if (!persistent) {
      const tooltipViews = localStorage.getItem(TOOLTIP_VIEWS_KEY);
      let tooltipViewsObj: Record<string, number> = {};
      
      if (tooltipViews) {
        try {
          tooltipViewsObj = JSON.parse(tooltipViews);
        } catch (e) {
          console.error("Failed to parse tooltip views", e);
        }
      }
      
      const viewCount = tooltipViewsObj[id] || 0;
      setViews(viewCount);
      
      // Don't auto-show tooltips, only track views when manually triggered
      setShowTooltip(false);
      setOpen(false);
    } else {
      // For persistent tooltips, check if the tooltip has been dismissed but don't auto-open
      try {
        const dismissedTooltips = JSON.parse(localStorage.getItem(TOOLTIPS_DISMISSED_KEY) || '{}');
        const hasBeenDismissed = dismissedTooltips[id];
        setOpen(false); // Always start closed regardless of previous state
      } catch (error) {
        console.error('Error parsing dismissed tooltips from localStorage', error);
        localStorage.setItem(TOOLTIPS_DISMISSED_KEY, JSON.stringify({}));
      }
    }
  }, [id, showFor, persistent, isNewUser]);

  const handleDismiss = () => {
    setOpen(false);
    
    // For persistent tooltips, mark as dismissed
    if (persistent) {
      try {
        const dismissedTooltips = JSON.parse(localStorage.getItem(TOOLTIPS_DISMISSED_KEY) || '{}');
        dismissedTooltips[id] = true;
        localStorage.setItem(TOOLTIPS_DISMISSED_KEY, JSON.stringify(dismissedTooltips));
        
        // Mark the feature as seen if provided
        if (feature === "overview") {
          markOverviewSeen();
        } else if (feature === "search") {
          markSearchUsed();
        } else if (feature === "objective") {
          markObjectiveCreated();
        } else if (feature === "reports") {
          markReportsViewed();
        }
      } catch (error) {
        console.error('Error saving tooltip dismissal', error);
      }
    }
  };

  const handleTriggerClick = () => {
    setOpen(!open);
  };

  // Positions for the persistent tooltip
  const positionClasses = {
    top: "bottom-full mb-2",
    right: "left-full ml-2",
    bottom: "top-full mt-2",
    left: "right-full mr-2"
  };

  // If it's a persistent tooltip
  if (persistent) {
    return (
      <div className="relative inline-flex">
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={() => setOpen(!open)}
          onMouseEnter={() => {
            setIsHovered(true);
            // Show tooltip on hover
            setOpen(true);
          }}
          onMouseLeave={() => {
            setIsHovered(false);
            // Only hide tooltip on mouseleave if it was opened by hover (not by click)
            if (!open || isHovered) {
              setOpen(false);
            }
          }}
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
        
        {open && (
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
          </Card>
        )}
      </div>
    );
  }
  
  // For regular tooltips
  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild 
          onClick={handleTriggerClick}
          onMouseEnter={() => {
            // Show tooltip on hover
            setOpen(true);
            // Track view
            const tooltipViews = localStorage.getItem(TOOLTIP_VIEWS_KEY);
            let tooltipViewsObj: Record<string, number> = {};
            
            if (tooltipViews) {
              try {
                tooltipViewsObj = JSON.parse(tooltipViews);
              } catch (e) {
                console.error("Failed to parse tooltip views", e);
              }
            }
            
            const viewCount = tooltipViewsObj[id] || 0;
            tooltipViewsObj[id] = viewCount + 1;
            localStorage.setItem(TOOLTIP_VIEWS_KEY, JSON.stringify(tooltipViewsObj));
          }}
          onMouseLeave={() => {
            // Hide tooltip on mouse leave
            setOpen(false);
          }}
        >
          {children ? (
            children
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full"
            >
              <InfoIcon className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <h4 className="font-medium">{title}</h4>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});