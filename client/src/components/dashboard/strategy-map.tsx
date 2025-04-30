import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpCircle, ArrowDownCircle, ArrowLeftCircle, ArrowRightCircle, Download, PenLine, Maximize } from "lucide-react";
import { useState } from "react";

// Strategy objective type
interface StrategyObjective {
  id: string;
  title: string;
  category: "financial" | "customer" | "process" | "learning";
  description: string;
  progress: number;
  color?: string;
}

export function StrategyMap() {
  // Sample strategy map data
  const [strategyData] = useState<StrategyObjective[]>([
    // Financial objectives
    { id: "fin1", title: "Increase Revenue to $1.5B", category: "financial", description: "Growing our revenue streams through expanding markets and services", progress: 42, color: "#4169E1" },
    { id: "fin2", title: "Reduce Operational Costs", category: "financial", description: "Streamline operations to improve margins", progress: 65, color: "#3C82F6" },
    
    // Customer objectives
    { id: "cust1", title: "Build Audience to 37M", category: "customer", description: "Expand our audience reach across all platforms", progress: 35, color: "#8A2BE2" },
    { id: "cust2", title: "Improve Customer Satisfaction", category: "customer", description: "Enhance customer experience to industry-leading levels", progress: 72, color: "#9F7AEA" },
    { id: "cust3", title: "Increase Brand Trust", category: "customer", description: "Build strongest brand presence in the market", progress: 60, color: "#B794F4" },

    // Internal process objectives
    { id: "proc1", title: "Enhance Digital Solutions", category: "process", description: "Develop cutting-edge technological solutions", progress: 55, color: "#10B981" },
    { id: "proc2", title: "Optimize Content Delivery", category: "process", description: "Create efficient distribution channels", progress: 48, color: "#34D399" },
    
    // Learning & growth objectives
    { id: "learn1", title: "Develop Technical Skills", category: "learning", description: "Upskill workforce in emerging technologies", progress: 30, color: "#F59E0B" },
    { id: "learn2", title: "Foster Innovation Culture", category: "learning", description: "Create environment that encourages experimentation", progress: 40, color: "#FBBF24" },
  ]);

  // Function to render progress indicator
  const renderProgressBar = (progress: number, color?: string) => {
    return (
      <div className="w-full bg-gray-200 rounded-full h-2 my-2">
        <div 
          className="h-2 rounded-full" 
          style={{ 
            width: `${progress}%`, 
            backgroundColor: color || 'hsl(var(--primary))' 
          }}
        ></div>
      </div>
    );
  };

  return (
    <Card className="mb-8">
      <CardHeader className="px-5 py-4 flex justify-between items-center">
        <CardTitle className="text-lg font-medium text-neutral-900">Strategy Map</CardTitle>
        <div>
          <Button variant="outline" size="sm" className="mr-2">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button size="sm">
            <PenLine className="h-4 w-4 mr-1" />
            Edit Strategy
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <div className="p-4 border-b border-neutral-200 bg-neutral-50">
            <p className="text-sm text-neutral-600">
              This strategy map shows how your objectives align across different business perspectives to achieve organizational goals.
            </p>
          </div>
          
          {/* Strategy Map Content */}
          <div className="p-6">
            {/* Financial Perspective */}
            <div className="mb-8">
              <div className="flex items-center mb-3">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <ArrowUpCircle className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-neutral-900">Financial Perspective</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-11">
                {strategyData
                  .filter(obj => obj.category === "financial")
                  .map(objective => (
                    <div 
                      key={objective.id} 
                      className="p-4 rounded-lg border border-blue-200 bg-blue-50 hover:shadow-md transition-shadow"
                    >
                      <h4 className="font-medium text-blue-900">{objective.title}</h4>
                      <p className="text-sm text-blue-700 mb-1">{objective.description}</p>
                      {renderProgressBar(objective.progress, objective.color)}
                      <p className="text-xs text-right text-blue-700">{objective.progress}% complete</p>
                    </div>
                  ))
                }
              </div>
            </div>
            
            {/* Customer Perspective */}
            <div className="mb-8">
              <div className="flex items-center mb-3">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                  <ArrowRightCircle className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-medium text-neutral-900">Customer Perspective</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-11">
                {strategyData
                  .filter(obj => obj.category === "customer")
                  .map(objective => (
                    <div 
                      key={objective.id} 
                      className="p-4 rounded-lg border border-purple-200 bg-purple-50 hover:shadow-md transition-shadow"
                    >
                      <h4 className="font-medium text-purple-900">{objective.title}</h4>
                      <p className="text-sm text-purple-700 mb-1">{objective.description}</p>
                      {renderProgressBar(objective.progress, objective.color)}
                      <p className="text-xs text-right text-purple-700">{objective.progress}% complete</p>
                    </div>
                  ))
                }
              </div>
            </div>
            
            {/* Internal Process Perspective */}
            <div className="mb-8">
              <div className="flex items-center mb-3">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <ArrowLeftCircle className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-neutral-900">Internal Process Perspective</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-11">
                {strategyData
                  .filter(obj => obj.category === "process")
                  .map(objective => (
                    <div 
                      key={objective.id} 
                      className="p-4 rounded-lg border border-green-200 bg-green-50 hover:shadow-md transition-shadow"
                    >
                      <h4 className="font-medium text-green-900">{objective.title}</h4>
                      <p className="text-sm text-green-700 mb-1">{objective.description}</p>
                      {renderProgressBar(objective.progress, objective.color)}
                      <p className="text-xs text-right text-green-700">{objective.progress}% complete</p>
                    </div>
                  ))
                }
              </div>
            </div>
            
            {/* Learning & Growth Perspective */}
            <div>
              <div className="flex items-center mb-3">
                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                  <ArrowDownCircle className="h-5 w-5 text-amber-600" />
                </div>
                <h3 className="text-lg font-medium text-neutral-900">Learning & Growth Perspective</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-11">
                {strategyData
                  .filter(obj => obj.category === "learning")
                  .map(objective => (
                    <div 
                      key={objective.id} 
                      className="p-4 rounded-lg border border-amber-200 bg-amber-50 hover:shadow-md transition-shadow"
                    >
                      <h4 className="font-medium text-amber-900">{objective.title}</h4>
                      <p className="text-sm text-amber-700 mb-1">{objective.description}</p>
                      {renderProgressBar(objective.progress, objective.color)}
                      <p className="text-xs text-right text-amber-700">{objective.progress}% complete</p>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
          
          {/* Connection indicators */}
          <div className="flex justify-center p-4 border-t border-neutral-200 bg-neutral-50">
            <Button variant="outline" className="flex items-center gap-2">
              <Maximize className="h-4 w-4" />
              View Full Strategy Map
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
