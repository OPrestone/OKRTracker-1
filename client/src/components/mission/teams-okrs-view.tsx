import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ChevronRight, 
  ChevronDown, 
  CheckCircle, 
  Circle, 
  Users, 
  User, 
  Search,
  Filter
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface OKRItem {
  id: string;
  title: string;
  team: string[];
  owner: {
    name: string;
    initials: string;
  };
  progress: number;
  status: 'on-track' | 'at-risk' | 'behind';
  isExpanded: boolean;
  children?: OKRItem[];
}

const MOCK_OKRS: OKRItem[] = [
  {
    id: '1',
    title: 'Market Expansion & Growth',
    team: ['ICT Team'],
    owner: { name: 'Team Lead', initials: 'TL' },
    progress: 45,
    status: 'on-track',
    isExpanded: true,
    children: [
      {
        id: '1-1',
        title: 'Enhance technical website performance to improve UX and search rankings',
        team: ['ICT Team', 'Operations'],
        owner: { name: 'Bryan Little', initials: 'BL' },
        progress: 39,
        status: 'on-track',
        isExpanded: false
      },
      {
        id: '1-2',
        title: 'Drive new customer acquisition and revenue growth from inbound channels',
        team: ['ICT Team', 'Operations', 'Sales'],
        owner: { name: 'Sophia Hansen', initials: 'SH' },
        progress: 37,
        status: 'on-track',
        isExpanded: false
      },
      {
        id: '1-3',
        title: 'Build a powerful Outbound engine that drives significant revenue',
        team: ['ICT Team', 'Operations'],
        owner: { name: 'Sophia Hansen', initials: 'SH' },
        progress: 69,
        status: 'on-track',
        isExpanded: false
      }
    ]
  },
  {
    id: '2',
    title: 'Fill the Sales pipeline with tons of qualified organic leads',
    team: ['ICT Team', 'Operations'],
    owner: { name: 'Bryan Little', initials: 'BL' },
    progress: 36,
    status: 'on-track',
    isExpanded: false
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'on-track':
      return 'text-green-500 bg-green-50';
    case 'at-risk':
      return 'text-yellow-500 bg-yellow-50';
    case 'behind':
      return 'text-red-500 bg-red-50';
    default:
      return 'text-gray-500 bg-gray-50';
  }
};

// Custom Progress component that accepts color
function CustomProgress({ value, color }: { value: number; color: string }) {
  return (
    <Progress 
      value={value} 
      className="h-2"
      style={{ 
        '--progress-color': color
      } as React.CSSProperties}
    />
  );
};

export function TeamsOkrsView() {
  const [activeTab, setActiveTab] = useState<'okrs' | 'check-ins' | 'dashboard'>('okrs');
  const [okrs, setOkrs] = useState<OKRItem[]>(MOCK_OKRS);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleExpand = (id: string) => {
    setOkrs(prevOkrs => 
      prevOkrs.map(okr => {
        if (okr.id === id) {
          return { ...okr, isExpanded: !okr.isExpanded };
        }
        
        if (okr.children) {
          const updatedChildren = okr.children.map(child => {
            if (child.id === id) {
              return { ...child, isExpanded: !child.isExpanded };
            }
            return child;
          });
          return { ...okr, children: updatedChildren };
        }
        
        return okr;
      })
    );
  };

  const filteredOkrs = okrs.filter(okr => {
    const matchesQuery = okr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      okr.owner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      okr.team.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const childrenMatch = okr.children?.some(child => 
      child.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      child.owner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      child.team.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    return matchesQuery || childrenMatch;
  });

  const renderOkrItem = (okr: OKRItem, isChild: boolean = false) => (
    <div key={okr.id} className={`border-b last:border-b-0 py-3 ${isChild ? 'pl-8' : ''}`}>
      <div className="flex items-center gap-2">
        <button 
          onClick={() => toggleExpand(okr.id)} 
          className="text-gray-500 hover:text-gray-700"
        >
          {okr.children && okr.children.length > 0 ? (
            okr.isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
        </button>
        
        <div className="flex-1 grid grid-cols-12 gap-2 items-center">
          <div className="col-span-5">
            <p className={`text-sm font-medium ${isChild ? '' : 'text-blue-600'}`}>{okr.title}</p>
          </div>
          
          <div className="col-span-2 flex items-center space-x-1">
            {okr.team.map((team, idx) => (
              <div key={idx} className="flex items-center text-xs text-gray-500">
                {idx === 0 ? <Users className="h-3 w-3 mr-1" /> : null}
                <span>{team}</span>
                {idx < okr.team.length - 1 ? ", " : ""}
              </div>
            ))}
          </div>
          
          <div className="col-span-2 flex items-center text-xs text-gray-500">
            <div className="bg-gray-200 rounded-full h-5 w-5 flex items-center justify-center mr-1 text-[10px]">
              {okr.owner.initials}
            </div>
            {okr.owner.name}
          </div>
          
          <div className="col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Progress value={okr.progress} className="h-2" />
              </div>
              <span className="text-xs font-medium">{okr.progress}%</span>
            </div>
          </div>
          
          <div className="col-span-1">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(okr.status)}`}>
              {okr.status === 'on-track' ? 'On track' : okr.status === 'at-risk' ? 'At risk' : 'Behind'}
            </span>
          </div>
        </div>
      </div>
      
      {okr.isExpanded && okr.children && (
        <div className="mt-2">
          {okr.children.map(child => renderOkrItem(child, true))}
        </div>
      )}
    </div>
  );

  return (
    <Card className="border-t-4 border-t-indigo-600">
      <CardHeader>
        <CardTitle>Teams OKRs</CardTitle>
        <CardDescription>Track team objectives and key results progress</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="okrs" value={activeTab} onValueChange={(val) => setActiveTab(val as any)}>
          <TabsList className="mb-4">
            <TabsTrigger value="okrs" className="px-6">OKRs</TabsTrigger>
            <TabsTrigger value="check-ins" className="px-6">Check-ins</TabsTrigger>
            <TabsTrigger value="dashboard" className="px-6">Dashboard</TabsTrigger>
          </TabsList>
          
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm font-medium">
              Cascade
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input 
                  placeholder="Search..." 
                  className="pl-8 h-9 w-60" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" className="h-9">
                <Filter className="h-4 w-4 mr-1" />
                Filter
              </Button>
            </div>
          </div>
          
          <TabsContent value="okrs" className="m-0">
            <div className="border rounded-md">
              <div className="bg-gray-50 border-b py-2 px-4">
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500">
                  <div className="col-span-5">Name</div>
                  <div className="col-span-2">Team</div>
                  <div className="col-span-2">Owner</div>
                  <div className="col-span-2">Progress</div>
                  <div className="col-span-1">Status</div>
                </div>
              </div>
              
              <div className="px-4">
                {filteredOkrs.length > 0 ? (
                  filteredOkrs.map(okr => renderOkrItem(okr))
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    No OKRs match your search criteria
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="check-ins" className="m-0">
            <div className="border rounded-md p-8 text-center">
              <h3 className="font-medium text-lg mb-2">Check-ins Coming Soon</h3>
              <p className="text-gray-500">This feature will allow you to view team check-ins and progress updates.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="dashboard" className="m-0">
            <div className="border rounded-md p-8 text-center">
              <h3 className="font-medium text-lg mb-2">Strategy Dashboard Coming Soon</h3>
              <p className="text-gray-500">The dashboard will show strategy map and visualizations of team performance.</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}