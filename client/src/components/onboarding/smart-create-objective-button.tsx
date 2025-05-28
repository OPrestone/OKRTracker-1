import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { 
  Target, 
  Plus, 
  GraduationCap,
  Shield,
  Users,
  Building
} from "lucide-react";
import { OKRLearningTour } from "./okr-learning-tour";

interface SmartCreateObjectiveButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function SmartCreateObjectiveButton({ 
  variant = "default", 
  size = "default", 
  className = "",
  showIcon = true,
  children
}: SmartCreateObjectiveButtonProps) {
  const { permissions } = useAuth();
  const [_, setLocation] = useLocation();
  const [showLearningTour, setShowLearningTour] = useState(false);

  const handleCreateObjective = () => {
    // Check if user has permission to create objectives
    if (permissions.canCreateObjectives) {
      // Route to appropriate creation page based on role
      if (permissions.isAdmin || permissions.role === 'owner' || permissions.role === 'executive') {
        // High-level users can create company objectives
        setLocation('/create-company-objective');
      } else if (permissions.role === 'manager') {
        // Managers can create team objectives
        setLocation('/create-objective');
      } else {
        // Regular users can create personal objectives
        setLocation('/create-objective');
      }
    } else {
      // Regular users without creation permissions get the learning tour
      setShowLearningTour(true);
    }
  };

  const getButtonText = () => {
    if (children) return children;
    
    if (permissions.canCreateObjectives) {
      if (permissions.isAdmin || permissions.role === 'owner') {
        return "Create Company Objective";
      } else if (permissions.role === 'manager') {
        return "Create Team Objective";
      } else {
        return "Create Objective";
      }
    } else {
      return "Learn About OKRs";
    }
  };

  const getButtonIcon = () => {
    if (!showIcon) return null;
    
    if (permissions.canCreateObjectives) {
      if (permissions.isAdmin || permissions.role === 'owner') {
        return <Building className="h-4 w-4" />;
      } else if (permissions.role === 'manager') {
        return <Users className="h-4 w-4" />;
      } else {
        return <Target className="h-4 w-4" />;
      }
    } else {
      return <GraduationCap className="h-4 w-4" />;
    }
  };

  const getTooltipText = () => {
    if (permissions.canCreateObjectives) {
      if (permissions.isAdmin || permissions.role === 'owner') {
        return "Create strategic objectives for your organization";
      } else if (permissions.role === 'manager') {
        return "Create objectives for your team";
      } else {
        return "Create personal or team objectives";
      }
    } else {
      return "Start your OKR journey with an interactive learning experience";
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleCreateObjective}
        title={getTooltipText()}
      >
        {getButtonIcon()}
        {getButtonIcon() && <span className="ml-2">{getButtonText()}</span>}
        {!getButtonIcon() && getButtonText()}
      </Button>

      <OKRLearningTour 
        isOpen={showLearningTour} 
        onClose={() => setShowLearningTour(false)} 
      />
    </>
  );
}

// Convenience components for different contexts
export function CreateFirstObjectiveCard() {
  const { permissions } = useAuth();
  
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-8 text-center">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        {permissions.canCreateObjectives ? (
          <Target className="h-8 w-8 text-blue-600" />
        ) : (
          <GraduationCap className="h-8 w-8 text-blue-600" />
        )}
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {permissions.canCreateObjectives ? "Ready to Set Your First Objective?" : "Ready to Learn About OKRs?"}
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {permissions.canCreateObjectives 
          ? "Start driving results by creating your first strategic objective with measurable key results."
          : "Discover how Objectives and Key Results can transform your productivity and goal achievement."
        }
      </p>
      
      <SmartCreateObjectiveButton size="lg" />
      
      {!permissions.canCreateObjectives && (
        <div className="mt-4 text-sm text-gray-500">
          <div className="flex items-center justify-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Contact your admin to create organizational objectives</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function QuickCreateButton() {
  return (
    <SmartCreateObjectiveButton 
      variant="outline" 
      size="sm" 
      className="flex items-center gap-2"
    >
      <Plus className="h-4 w-4" />
      <span className="hidden sm:inline">Create</span>
    </SmartCreateObjectiveButton>
  );
}