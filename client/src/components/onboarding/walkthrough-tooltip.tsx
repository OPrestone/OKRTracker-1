import React from "react";
import { X, ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboarding, OnboardingStep } from "@/hooks/use-onboarding";
import { createPortal } from "react-dom";

interface WalkthroughTooltipProps {
  step: OnboardingStep;
  title: string;
  description: string;
  position?: "top" | "right" | "bottom" | "left" | "center";
  targetSelector?: string;
}

export function WalkthroughTooltip({
  step,
  title,
  description,
  position = "bottom",
  targetSelector,
}: WalkthroughTooltipProps) {
  const { currentStep, nextStep, prevStep, skipWalkthrough } = useOnboarding();
  const [tooltipStyles, setTooltipStyles] = React.useState({
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  });
  const [arrowStyles, setArrowStyles] = React.useState({});
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  // Only show the tooltip if it matches the current step
  if (currentStep !== step) {
    return null;
  }

  // Position the tooltip based on the target element
  React.useEffect(() => {
    if (!targetSelector) return;

    const targetElement = document.querySelector(targetSelector);
    if (!targetElement || !tooltipRef.current) return;

    const targetRect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    
    let top, left, arrowTop, arrowLeft, arrowStyles;

    switch (position) {
      case "top":
        top = targetRect.top - tooltipRect.height - 10;
        left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
        arrowStyles = {
          bottom: "-8px",
          left: "50%",
          transform: "translateX(-50%) rotate(45deg)",
          borderTop: "none",
          borderLeft: "none",
        };
        break;
      case "right":
        top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
        left = targetRect.right + 10;
        arrowStyles = {
          left: "-8px",
          top: "50%",
          transform: "translateY(-50%) rotate(45deg)",
          borderBottom: "none",
          borderRight: "none",
        };
        break;
      case "bottom":
        top = targetRect.bottom + 10;
        left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
        arrowStyles = {
          top: "-8px",
          left: "50%",
          transform: "translateX(-50%) rotate(45deg)",
          borderBottom: "none",
          borderLeft: "none",
        };
        break;
      case "left":
        top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
        left = targetRect.left - tooltipRect.width - 10;
        arrowStyles = {
          right: "-8px",
          top: "50%",
          transform: "translateY(-50%) rotate(45deg)",
          borderTop: "none",
          borderLeft: "none",
        };
        break;
      case "center":
      default:
        top = window.innerHeight / 2 - tooltipRect.height / 2;
        left = window.innerWidth / 2 - tooltipRect.width / 2;
        arrowStyles = { display: "none" };
    }

    // Adjust if tooltip would go off screen
    if (left < 20) left = 20;
    if (left + tooltipRect.width > window.innerWidth - 20)
      left = window.innerWidth - tooltipRect.width - 20;
    if (top < 20) top = 20;
    if (top + tooltipRect.height > window.innerHeight - 20)
      top = window.innerHeight - tooltipRect.height - 20;

    setTooltipStyles({
      top: `${top}px`,
      left: `${left}px`,
      transform: "none",
    });
    setArrowStyles(arrowStyles);
  }, [targetSelector, position]);

  // Add highlight to target element
  React.useEffect(() => {
    if (!targetSelector) return;
    
    const targetElement = document.querySelector(targetSelector);
    if (!targetElement) return;

    // Add highlight effect
    targetElement.classList.add("onboarding-highlight");
    
    // Clean up
    return () => {
      targetElement.classList.remove("onboarding-highlight");
    };
  }, [targetSelector]);

  // Render the tooltip using a portal to avoid layout issues
  return createPortal(
    <div
      ref={tooltipRef}
      style={tooltipStyles}
      className="fixed z-50 w-80 bg-popover shadow-lg rounded-lg p-4 border animation-bounce-in"
    >
      {/* Tooltip arrow */}
      <div
        className="absolute w-4 h-4 bg-inherit border border-border z-[-1]"
        style={arrowStyles}
      ></div>
      
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2"
        onClick={skipWalkthrough}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </Button>

      {/* Tooltip content */}
      <div className="mb-6">
        <div className="flex items-center mb-2 gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button variant="outline" size="sm" onClick={prevStep}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Previous
        </Button>
        <Button size="sm" onClick={nextStep}>
          Next <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>,
    document.body
  );
}