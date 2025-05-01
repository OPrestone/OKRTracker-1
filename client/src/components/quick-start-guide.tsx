import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  BookOpen, 
  HelpCircle, 
  Rocket, 
  Settings, 
  Target, 
  Users,
  CheckCircle,
  ChevronDown
} from "lucide-react";

export function QuickStartGuide() {
  const [_, navigate] = useLocation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 border border-indigo-100"
        >
          <HelpCircle className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Get Started</span>
          <ChevronDown className="h-3 w-3 ml-1 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="p-2 text-xs font-medium text-slate-500 border-b border-slate-100">
          QUICK START GUIDE
        </div>
        <DropdownMenuItem 
          onClick={() => navigate("/quick-start-guide")}
          className="flex items-center cursor-pointer py-2"
        >
          <Rocket className="h-4 w-4 mr-2 text-indigo-600" />
          <div className="flex flex-col">
            <span className="text-sm">Quick Start Guide</span>
            <span className="text-xs text-slate-500">Complete setup steps</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => navigate("/create-objective")}
          className="flex items-center cursor-pointer py-2"
        >
          <Target className="h-4 w-4 mr-2 text-emerald-600" />
          <div className="flex flex-col">
            <span className="text-sm">Create First Objective</span>
            <span className="text-xs text-slate-500">Set your first OKR</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => navigate("/teams")}
          className="flex items-center cursor-pointer py-2"
        >
          <Users className="h-4 w-4 mr-2 text-blue-600" />
          <div className="flex flex-col">
            <span className="text-sm">Configure Teams</span>
            <span className="text-xs text-slate-500">Add members & roles</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => navigate("/tutorials")}
          className="flex items-center cursor-pointer py-2"
        >
          <BookOpen className="h-4 w-4 mr-2 text-amber-600" />
          <div className="flex flex-col">
            <span className="text-sm">Video Tutorials</span>
            <span className="text-xs text-slate-500">Learn OKR best practices</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate("/settings")}
          className="flex items-center cursor-pointer py-2"
        >
          <Settings className="h-4 w-4 mr-2 text-slate-600" />
          <div className="flex flex-col">
            <span className="text-sm">Settings</span>
            <span className="text-xs text-slate-500">Configure your workspace</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}