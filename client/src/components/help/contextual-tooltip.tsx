import React, { useState, useEffect, forwardRef } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  HelpCircle, 
  XCircle,
  ChevronRight,
  Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useHelp } from "@/hooks/use-help-context";
import { useToast } from "@/hooks/use-toast";

export interface ContextualTooltipProps {
  id: string;
  title: string;
  description: string;
  children?: React.ReactNode;
  showFor?: number; // number of times to show for new users
  placement?: "top" | "right" | "bottom" | "left";
  priority?: "low" | "medium" | "high";
  showDismiss?: boolean;
  onDismiss?: () => void;
  helpfulTips?: string[];
}

// Use localStorage to track which tooltips the user has seen and dismissed
const TOOLTIP_VIEWS_KEY = "okr-tooltip-views";
const TOOLTIP_DISMISSED_KEY = "okr-tooltip-dismissed";

export const ContextualTooltip = forwardRef<HTMLDivElement, ContextualTooltipProps>((props, ref) => {
  const {
    id,
    title,
    description,
    children,
    showFor = 3,
    placement = "right",
    priority = "medium",
    showDismiss = true,
    onDismiss,
    helpfulTips = []
  } = props;
  
  const { isNewUser } = useHelp();
  const { toast } = useToast();
  const [showTooltip, setShowTooltip] = useState(false);
  const [views, setViews] = useState(0);
  const [open, setOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  // Load view and dismissed state on mount, but don't auto-show tooltips
  useEffect(() => {
    const loadTooltipState = () => {
      // Get view count
      const tooltipViews = localStorage.getItem(TOOLTIP_VIEWS_KEY);
      let viewsObj: Record<string, number> = {};
      
      if (tooltipViews) {
        try {
          viewsObj = JSON.parse(tooltipViews);
        } catch (e) {
          console.error("Failed to parse tooltip views", e);
        }
      }
      
      // Get dismissed state
      const tooltipDismissed = localStorage.getItem(TOOLTIP_DISMISSED_KEY);
      let dismissedObj: Record<string, boolean> = {};
      
      if (tooltipDismissed) {
        try {
          dismissedObj = JSON.parse(tooltipDismissed);
        } catch (e) {
          console.error("Failed to parse tooltip dismissed state", e);
        }
      }
      
      const viewCount = viewsObj[id] || 0;
      const dismissed = dismissedObj[id] || false;
      
      setViews(viewCount);
      setIsDismissed(dismissed);
      setOpen(false); // Ensure tooltip is closed on initial load
      setShowTooltip(false); // Ensure tooltip is not auto-shown
      
      return { viewCount, dismissed };
    };
    
    loadTooltipState();
    
    // No auto-show functionality - tooltips will only appear on hover or click
  }, [id]);

  const handleTriggerClick = () => {
    setOpen(!open);
  };

  const handleDismiss = () => {
    setOpen(false);
    setIsDismissed(true);
    
    // Store dismissed state
    const tooltipDismissed = localStorage.getItem(TOOLTIP_DISMISSED_KEY);
    let dismissedObj: Record<string, boolean> = {};
    
    if (tooltipDismissed) {
      try {
        dismissedObj = JSON.parse(tooltipDismissed);
      } catch (e) {
        console.error("Failed to parse tooltip dismissed state", e);
      }
    }
    
    dismissedObj[id] = true;
    localStorage.setItem(TOOLTIP_DISMISSED_KEY, JSON.stringify(dismissedObj));
    
    // Call onDismiss callback if provided
    if (onDismiss) {
      onDismiss();
    }
    
    // Show toast notification
    toast({
      title: "Tooltip hidden",
      description: "You can still access help by clicking the info icons",
      duration: 3000
    });
  };

  const handleNextTip = () => {
    if (currentTipIndex < helpfulTips.length - 1) {
      setCurrentTipIndex(currentTipIndex + 1);
    } else {
      setCurrentTipIndex(0);
    }
  };

  // Determine badge color based on priority
  const getBadgeVariant = () => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild onClick={handleTriggerClick}>
          {children ? (
            <div
              onMouseEnter={() => {
                // Update view count and show tooltip on hover
                setOpen(true);
                
                const tooltipViews = localStorage.getItem(TOOLTIP_VIEWS_KEY);
                let viewsObj: Record<string, number> = {};
                
                if (tooltipViews) {
                  try {
                    viewsObj = JSON.parse(tooltipViews);
                  } catch (e) {
                    console.error("Failed to parse tooltip views", e);
                  }
                }
                
                const viewCount = viewsObj[id] || 0;
                viewsObj[id] = viewCount + 1;
                localStorage.setItem(TOOLTIP_VIEWS_KEY, JSON.stringify(viewsObj));
                setViews(viewCount + 1);
              }}
              onMouseLeave={() => {
                setOpen(false);
              }}
            >
              {children}
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className={`h-6 w-6 rounded-full relative ${isNewUser && !isDismissed ? 'animate-pulse' : ''}`}
              onMouseEnter={() => {
                // Update view count and show tooltip on hover
                setOpen(true);
                
                const tooltipViews = localStorage.getItem(TOOLTIP_VIEWS_KEY);
                let viewsObj: Record<string, number> = {};
                
                if (tooltipViews) {
                  try {
                    viewsObj = JSON.parse(tooltipViews);
                  } catch (e) {
                    console.error("Failed to parse tooltip views", e);
                  }
                }
                
                const viewCount = viewsObj[id] || 0;
                viewsObj[id] = viewCount + 1;
                localStorage.setItem(TOOLTIP_VIEWS_KEY, JSON.stringify(viewsObj));
                setViews(viewCount + 1);
              }}
              onMouseLeave={() => {
                setOpen(false);
              }}
            >
              <HelpCircle className={`h-4 w-4 ${isNewUser && !isDismissed ? 'text-primary' : 'text-muted-foreground'}`} />
              {isNewUser && !isDismissed && priority === "high" && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </Button>
          )}
        </TooltipTrigger>
        <TooltipContent 
          side={placement} 
          className="max-w-xs p-4 z-50 border border-border bg-card text-card-foreground shadow-lg"
          sideOffset={8}
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-base">{title}</h4>
                {isNewUser && !isDismissed && (
                  <Badge variant={getBadgeVariant()} className="text-[10px] px-1.5 py-0">
                    {priority === "high" ? "Important" : "Tip"}
                  </Badge>
                )}
              </div>
              {showDismiss && isNewUser && !isDismissed && (
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleDismiss}>
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground">{description}</p>
            
            {helpfulTips.length > 0 && (
              <div className="mt-3 pt-2 border-t text-xs">
                <div className="flex items-center gap-1 text-muted-foreground mb-1">
                  <Lightbulb className="h-3 w-3" />
                  <span>Helpful tip:</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{helpfulTips[currentTipIndex]}</p>
                  {helpfulTips.length > 1 && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5 ml-1" 
                      onClick={handleNextTip}
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

ContextualTooltip.displayName = "ContextualTooltip";