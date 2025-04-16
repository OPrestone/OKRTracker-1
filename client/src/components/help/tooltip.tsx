import React, { useState, useEffect, forwardRef } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface HelpTooltipProps {
  id: string;
  title: string;
  description: string;
  children?: React.ReactNode;
  showFor?: number; // number of times to show for new users
}

// Use localStorage to track which tooltips the user has seen
const TOOLTIP_VIEWS_KEY = "okr-tooltip-views";

export const HelpTooltip = forwardRef<HTMLDivElement, HelpTooltipProps>((props, ref) => {
  const {
    id,
    title,
    description,
    children,
    showFor = 3
  } = props;
  const [showTooltip, setShowTooltip] = useState(false);
  const [views, setViews] = useState(0);
  const [open, setOpen] = useState(false);

  // On mount, check if we should show this tooltip based on view count
  useEffect(() => {
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
    
    // Auto-show the tooltip if user hasn't seen it enough times
    if (viewCount < showFor) {
      setShowTooltip(true);
      setOpen(true);
      
      // Update view count
      tooltipViewsObj[id] = viewCount + 1;
      localStorage.setItem(TOOLTIP_VIEWS_KEY, JSON.stringify(tooltipViewsObj));
      
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        setOpen(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [id, showFor]);

  const handleTriggerClick = () => {
    setOpen(!open);
  };

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild onClick={handleTriggerClick}>
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