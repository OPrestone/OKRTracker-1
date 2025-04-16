import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Objective } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building, Check, ChevronDown, ChevronUp, Plus, Target, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type StrategyNode = {
  id: string;
  title: string;
  description?: string;
  progress: number;
  team?: string;
  isExpanded?: boolean;
  children?: StrategyNode[];
  assignee?: {
    name: string;
    initials: string;
  };
  level: 'top' | 'middle' | 'bottom';
  status?: 'on_track' | 'at_risk' | 'behind';
  targetValue?: string;
};

const CompanyStrategy = () => {
  const [timeframeFilter, setTimeframeFilter] = useState("current");
  
  // Sample strategy data structure based on the provided design
  const [strategyData, setStrategyData] = useState<StrategyNode[]>([
    {
      id: "top-1",
      title: "Market Expansion & Growth",
      progress: 65,
      team: "ICT Team",
      level: 'top',
      status: 'on_track',
      isExpanded: true,
      children: [
        {
          id: "mid-1",
          title: "Drive new customer acquisition and revenue growth from inbound channels",
          progress: 37,
          team: "ICT Team",
          level: 'middle',
          status: 'behind',
          assignee: {
            name: "Sophie Hansen",
            initials: "SH",
          },
          isExpanded: true,
          children: [
            {
              id: "bottom-1",
              title: "Achieve a 10% increase in average deal size",
              progress: 5,
              team: "Sales",
              level: 'bottom',
              status: 'behind',
              targetValue: '3%'
            },
            {
              id: "bottom-2",
              title: "Generate $5M in new ARR from inbound leads",
              progress: 7,
              team: "Sales",
              level: 'bottom',
              status: 'behind',
              targetValue: '1,200.45'
            }
          ]
        },
        {
          id: "mid-2",
          title: "Build a powerful Outbound engine that drives significant revenue",
          progress: 80,
          team: "ICT Team",
          level: 'middle',
          status: 'on_track',
          assignee: {
            name: "Sophie Hansen",
            initials: "SH",
          },
          isExpanded: true,
          children: [
            {
              id: "bottom-3",
              title: "Increase prospect volume through cold email by 35%",
              progress: 22,
              team: "Sales",
              level: 'bottom',
              status: 'at_risk'
            },
            {
              id: "bottom-4",
              title: "Achieve average cold email open rate of 40% or higher",
              progress: 45,
              team: "Sales",
              level: 'bottom',
              status: 'on_track'
            },
            {
              id: "bottom-5",
              title: "Generate $2M in new ARR through Outbound",
              progress: 90,
              team: "Sales",
              level: 'bottom',
              status: 'on_track',
              targetValue: '90.45'
            }
          ]
        }
      ]
    }
  ]);

  // Fetch objectives from the API
  const { data: objectives, isLoading: objectivesLoading } = useQuery<Objective[]>({
    queryKey: ["/api/objectives"],
  });

  // Fetch timeframes from the API
  const { data: timeframes, isLoading: timeframesLoading } = useQuery({
    queryKey: ["/api/timeframes"],
  });

  const toggleExpand = (nodeId: string) => {
    setStrategyData(prevData => {
      const toggleNode = (nodes: StrategyNode[]): StrategyNode[] => {
        return nodes.map(node => {
          if (node.id === nodeId) {
            return { ...node, isExpanded: !node.isExpanded };
          } else if (node.children) {
            return { ...node, children: toggleNode(node.children) };
          }
          return node;
        });
      };
      return toggleNode(prevData);
    });
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    switch (status) {
      case 'on_track':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">On Track</Badge>;
      case 'at_risk':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">At Risk</Badge>;
      case 'behind':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Behind</Badge>;
      default:
        return null;
    }
  };

  const renderStrategyNode = (node: StrategyNode, level: number = 0) => {
    return (
      <div key={node.id} className="relative strategy-node">
        {/* Connection lines between nodes */}
        {level > 0 && (
          <div className="absolute left-6 -top-10 h-10 border-l border-gray-300 z-0"></div>
        )}
        {level === 2 && node.id !== "bottom-1" && node.id !== "bottom-3" && (
          <div className="absolute left-6 -top-10 w-14 h-10 border-t border-l border-gray-300 z-0"></div>
        )}
        
        {/* Node card */}
        <Card className="relative z-10 mb-20 max-w-lg mx-auto">
          <CardContent className="p-0">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-start mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 bg-indigo-50">
                  <Target className="h-4 w-4 text-indigo-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm">{node.title}</h3>
                </div>
                {node.children && (
                  <button
                    onClick={() => toggleExpand(node.id)}
                    className="ml-2 p-1 rounded-full hover:bg-gray-100"
                  >
                    {node.isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                )}
              </div>
              
              <div className="flex items-center text-xs text-gray-500 mb-1.5">
                {node.team && (
                  <div className="flex items-center mr-3">
                    <Building className="h-3 w-3 mr-1" />
                    <span>{node.team}</span>
                  </div>
                )}
                {node.assignee && (
                  <div className="flex items-center">
                    <Avatar className="h-4 w-4 mr-1">
                      <AvatarFallback className="text-[8px]">{node.assignee.initials}</AvatarFallback>
                    </Avatar>
                    <span>{node.assignee.name}</span>
                  </div>
                )}
                {getStatusBadge(node.status)}
              </div>
              
              <div className="flex items-center">
                <Progress value={node.progress} className="h-1.5 flex-1 mr-2" />
                <span className="text-xs font-medium">{node.progress}%</span>
              </div>
              
              {node.targetValue && (
                <div className="mt-2 text-xs text-gray-500">
                  {node.level === 'bottom' && <span>Target: {node.targetValue}</span>}
                </div>
              )}
            </div>
            
            <div className="p-2 bg-gray-50 flex justify-between items-center">
              <span className="text-xs text-gray-500">On track</span>
              <div className="flex items-center">
                <button className="p-1 rounded-full hover:bg-gray-200">
                  <Check className="h-3 w-3 text-gray-500" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Render children if expanded */}
        {node.isExpanded && node.children && (
          <div className={`pl-${level > 0 ? '16' : '0'} relative`}>
            {/* Horizontal connection line for first level */}
            {level === 0 && (
              <div className="absolute left-1/2 top-0 h-16 border-l border-gray-300 z-0"></div>
            )}
            
            {/* Child nodes */}
            <div className={`grid ${level === 1 ? 'grid-cols-2 gap-8' : 'grid-cols-1'} relative`}>
              {node.children.map((child, i) => (
                <div key={child.id} className="relative">
                  {level === 1 && i > 0 && (
                    <div className="absolute left-0 -top-16 -ml-8 w-8 border-t border-gray-300 z-0"></div>
                  )}
                  {renderStrategyNode(child, level + 1)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout title="Company Strategy">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Strategy</h1>
          <p className="text-gray-600">View and manage strategic objectives across the organization</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeframeFilter} onValueChange={setTimeframeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current Quarter</SelectItem>
              {timeframes?.map((timeframe: any) => (
                <SelectItem key={timeframe.id} value={timeframe.id.toString()}>
                  {timeframe.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Objective
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto pb-8">
        <div className="min-w-[800px] p-8">
          {strategyData.map(node => renderStrategyNode(node))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CompanyStrategy;