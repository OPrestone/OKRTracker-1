import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  Circle, 
  Download, 
  Edit, 
  Eye, 
  Plus, 
  MoreVertical,
  Rocket, 
  Search, 
  Bell,
  ChevronRight
} from "lucide-react";
import { useState } from "react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Types for strategy map components
interface StrategicPillar {
  id: string;
  name: string;
  health: 'healthy' | 'unhealthy' | 'needs-attention';
  healthScore: string; // e.g. "3/3" or "2/3"
  alignedOkrCount: number;
}

interface StrategicObjective {
  id: string;
  title: string;
  pillarId: string;
  quarter: string; // e.g. "Q3 2024"
  owner: string;
  progress: number;
  status: 'on track' | 'off track' | 'needs attention';
  alignedOkrCount: number;
}

// Component for displaying a strategic pillar
const StrategicPillarCard = ({ pillar }: { pillar: StrategicPillar }) => {
  const healthStatusColors = {
    'healthy': 'bg-green-500',
    'unhealthy': 'bg-red-500',
    'needs-attention': 'bg-yellow-500'
  };
  
  const healthTextColors = {
    'healthy': 'text-green-800',
    'unhealthy': 'text-red-800',
    'needs-attention': 'text-yellow-800'
  };
  
  const healthBgColors = {
    'healthy': 'bg-green-50',
    'unhealthy': 'bg-red-50',
    'needs-attention': 'bg-yellow-50'
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex justify-between items-start">
        <div>
          <div className="mb-1 flex items-center gap-2">
            {pillar.health === 'healthy' ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : pillar.health === 'unhealthy' ? (
              <Circle className="h-4 w-4 text-red-500" />
            ) : (
              <Circle className="h-4 w-4 text-yellow-500" />
            )}
            <h3 className="font-medium">{pillar.name}</h3>
          </div>
          <div className="flex items-center gap-1">
            <span className={cn("text-xs", healthTextColors[pillar.health])}>
              {pillar.healthScore} {pillar.health}
            </span>
            <ChevronRight className="h-3 w-3 text-gray-400" />
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-3 flex items-center text-sm text-gray-500">
        <span>{pillar.alignedOkrCount} aligned OKRs</span>
        <ChevronRight className="h-3 w-3 ml-1" />
      </div>
    </div>
  );
};

// Component for displaying a strategic objective
const StrategicObjectiveCard = ({ objective, colorScheme }: { 
  objective: StrategicObjective, 
  colorScheme: {
    bgColor: string;
    textColor: string;
    borderColor: string;
    iconBgColor: string;
    iconColor: string;
    progressColor: string;
  }
}) => {
  const statusColors = {
    'on track': 'bg-green-500',
    'off track': 'bg-red-500',
    'needs attention': 'bg-yellow-500'
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-sm border-l-4 ${colorScheme.borderColor} p-4 relative`}>
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-3">
          <div className={`${colorScheme.iconBgColor} rounded-full p-2 flex-shrink-0`}>
            <div className={`text-xs font-bold ${colorScheme.iconColor}`}>
              {objective.title.substring(0, 1)}
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-1">{objective.title}</h3>
            <div className="text-xs text-gray-500">
              {objective.owner} • {objective.quarter}
            </div>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>
      
      <div className="mt-5 flex flex-col gap-1">
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-1">
            <div className={`rounded-full w-2 h-2 ${statusColors[objective.status]}`}></div>
            <span className={objective.status === 'on track' ? 'text-green-700' : 
                    objective.status === 'off track' ? 'text-red-700' : 'text-yellow-700'}>
              {objective.status}
            </span>
          </div>
          <span className="text-gray-500">{objective.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div 
            className={`h-1 rounded-full ${colorScheme.progressColor}`} 
            style={{ width: `${objective.progress}%` }}
          ></div>
        </div>
      </div>
      
      <div className="mt-3 flex items-center text-xs text-gray-500">
        <span>{objective.alignedOkrCount} OKR{objective.alignedOkrCount !== 1 ? 's' : ''} aligned</span>
        <ChevronRight className="h-3 w-3 ml-1" />
      </div>
    </div>
  );
};

// Main strategy map component
const StrategyMap = () => {
  // Sample strategic pillars data
  const [pillars] = useState<StrategicPillar[]>([
    { 
      id: 'p1', 
      name: 'Technological Innovation', 
      health: 'unhealthy', 
      healthScore: '2/3',
      alignedOkrCount: 2 
    },
    { 
      id: 'p2', 
      name: 'Market Leadership', 
      health: 'healthy', 
      healthScore: '3/3',
      alignedOkrCount: 3 
    }
  ]);
  
  // Sample strategic objectives data
  const [objectives] = useState<StrategicObjective[]>([
    { 
      id: 'o1', 
      title: 'Develop cutting-edge propulsion systems', 
      pillarId: 'p1',
      quarter: '2024',
      owner: 'Devon Webb',
      progress: 20,
      status: 'off track',
      alignedOkrCount: 1
    },
    { 
      id: 'o2', 
      title: 'Enhance research capabilities for continuous innovation', 
      pillarId: 'p1',
      quarter: '2024',
      owner: 'John Fuente',
      progress: 85,
      status: 'on track',
      alignedOkrCount: 2
    },
    { 
      id: 'o3', 
      title: 'Establish the company as a leader in the market', 
      pillarId: 'p2',
      quarter: '2024',
      owner: 'Devon Miller',
      progress: 60,
      status: 'needs attention',
      alignedOkrCount: 1
    },
    { 
      id: 'o4', 
      title: 'Launch a monthly internal innovation challenge', 
      pillarId: 'p1',
      quarter: 'Q3 2024',
      owner: 'John Fuente',
      progress: 0,
      status: 'off track',
      alignedOkrCount: 0
    },
    { 
      id: 'o5', 
      title: 'Enhance skills and expertise of the research team', 
      pillarId: 'p1',
      quarter: 'Q3 2024',
      owner: 'Wade Cooper',
      progress: 50,
      status: 'on track',
      alignedOkrCount: 0
    },
    { 
      id: 'o6', 
      title: 'Increase the research and development budget', 
      pillarId: 'p1',
      quarter: 'Q3 2024',
      owner: 'John Fuente',
      progress: 50,
      status: 'on track',
      alignedOkrCount: 0
    },
    { 
      id: 'o7', 
      title: 'Implement partnership network for our platform', 
      pillarId: 'p2',
      quarter: 'Q3 2024',
      owner: 'Lawrence Price',
      progress: 30,
      status: 'on track',
      alignedOkrCount: 0
    }
  ]);
  
  // Color schemes for different objectives
  const colorSchemes = {
    'p1': {
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-900',
      borderColor: 'border-blue-400',
      iconBgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      progressColor: 'bg-blue-500'
    },
    'p2': {
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-900',
      borderColor: 'border-purple-400',
      iconBgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
      progressColor: 'bg-purple-500'
    }
  };
  
  // Filter objectives by year
  const [selectedYear] = useState('2024');
  const [selectedQuarter] = useState('Q3 2024');
  
  const objectivesByYear = objectives.filter(obj => 
    obj.quarter === selectedYear || obj.quarter === selectedQuarter
  );
  
  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">Strategy Map</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                className="h-9 pl-9 w-[200px] rounded-md border border-gray-300 bg-white" 
                placeholder="Search..." 
              />
            </div>
            <button className="p-1.5 text-gray-500 rounded-full hover:bg-gray-100">
              <Bell className="h-5 w-5" />
            </button>
            <button className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center">
              <span className="text-sm font-medium">J</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="py-6 px-6">
        {/* Ultimate goal section */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex items-center justify-center mb-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center mr-3">
              <Rocket className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Ultimate goal</div>
              <h2 className="text-lg font-medium text-gray-800">Achieve Technological Leadership and Breakthrough Discoveries</h2>
            </div>
          </div>
        </div>
        
        {/* Strategic pillars section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium">Strategic Pillars</h2>
            <div className="flex items-center gap-2">
              <button className="p-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200">
                <Eye className="h-4 w-4" />
              </button>
              <button className="p-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pillars.map(pillar => (
              <StrategicPillarCard key={pillar.id} pillar={pillar} />
            ))}
          </div>
        </div>
        
        {/* Year filter */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium">2024</h2>
          <div className="flex items-center gap-2">
            <button className="p-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200">
              <Eye className="h-4 w-4" />
            </button>
            <button className="p-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* 2024 Objectives */}
        <div className="mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {objectivesByYear.filter(obj => obj.quarter === '2024').map(objective => (
              <StrategicObjectiveCard 
                key={objective.id} 
                objective={objective} 
                colorScheme={colorSchemes[objective.pillarId as keyof typeof colorSchemes]} 
              />
            ))}
          </div>
        </div>
        
        {/* Quarter filter */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium">Q3 2024</h2>
          <div className="flex items-center gap-2">
            <button className="p-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200">
              <Eye className="h-4 w-4" />
            </button>
            <button className="p-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Q3 2024 Objectives */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {objectivesByYear.filter(obj => obj.quarter === 'Q3 2024').map(objective => (
              <StrategicObjectiveCard 
                key={objective.id} 
                objective={objective} 
                colorScheme={colorSchemes[objective.pillarId as keyof typeof colorSchemes]} 
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function StrategyMapPage() {
  return (
    <StrategyMap />
  );
}
