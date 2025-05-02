import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Edit, Plus, ZoomIn, ZoomOut } from "lucide-react";
import { useState } from "react";
import CompanyAlignmentMap from "@/components/strategy/company-alignment-map";
import TeamsOKRView from "@/components/strategy/teams-okr-view";
import KeyResultSummary from "@/components/strategy/key-results-summary";
import DashboardLayout from "@/layouts/dashboard-layout";

// Component to render strategy map elements
const StrategyMap = () => {
  const [zoomLevel, setZoomLevel] = useState(100);
  
  // Increment/decrement zoom level
  const zoomIn = () => setZoomLevel(prev => Math.min(prev + 10, 150));
  const zoomOut = () => setZoomLevel(prev => Math.max(prev - 10, 50));
  
  // Company objectives
  const { data: objectives = [] } = useQuery({
    queryKey: ['/api/objectives/company'],
  }) as { data: any[] };
  
  // Teams
  const { data: teams = [] } = useQuery({
    queryKey: ['/api/teams'],
  }) as { data: any[] };
  
  return (
    <div className="relative">
      {/* Zoom controls */}
      <div className="absolute top-4 right-4 flex space-x-2 bg-white p-1 rounded-md shadow-sm z-10">
        <Button variant="outline" size="icon" onClick={zoomOut} title="Zoom out">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="flex items-center text-sm font-medium px-2">{zoomLevel}%</span>
        <Button variant="outline" size="icon" onClick={zoomIn} title="Zoom in">
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Strategy map visualization container */}
      <div 
        className="bg-white rounded-lg border border-neutral-200 p-8 min-h-[600px] overflow-auto"
        style={{ transform: `scale(${zoomLevel/100})`, transformOrigin: 'top center' }}
      >
        {objectives && teams ? (
          <div className="flex flex-col items-center">
            {/* Company Mission */}
            <div className="w-full max-w-md p-4 bg-neutral-100 rounded-lg text-center mb-8">
              <h3 className="font-medium text-lg text-neutral-900 mb-2">Company Mission</h3>
              <p className="text-sm text-neutral-700">
                To empower teams with tools and methodologies for achieving measurable success
              </p>
            </div>
            
            {/* Strategic Pillars */}
            <div className="grid grid-cols-4 gap-8 mb-8 w-full max-w-5xl">
              <div className="bg-primary-50 p-4 rounded-lg text-center border border-primary-200">
                <h4 className="font-medium text-primary-900">Financial</h4>
              </div>
              <div className="bg-primary-50 p-4 rounded-lg text-center border border-primary-200">
                <h4 className="font-medium text-primary-900">Customer</h4>
              </div>
              <div className="bg-primary-50 p-4 rounded-lg text-center border border-primary-200">
                <h4 className="font-medium text-primary-900">Internal Process</h4>
              </div>
              <div className="bg-primary-50 p-4 rounded-lg text-center border border-primary-200">
                <h4 className="font-medium text-primary-900">Learning & Growth</h4>
              </div>
            </div>
            
            {/* Company Objectives */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 w-full max-w-5xl">
              {objectives.map((objective: any) => (
                <div key={objective.id} className="bg-white p-4 rounded-lg border border-primary-300 shadow-sm">
                  <h4 className="font-medium text-neutral-900 mb-1">{objective.title}</h4>
                  <div className="w-full bg-neutral-200 rounded-full h-1.5 mb-1">
                    <div 
                      className="bg-primary-500 h-1.5 rounded-full" 
                      style={{ width: `${objective.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-neutral-500">{objective.progress}% complete</p>
                </div>
              ))}
            </div>
            
            {/* Team Objectives Connection Lines */}
            <div className="w-full max-w-5xl border-l-2 border-r-2 border-dashed border-neutral-300 h-20 relative">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4">
                <span className="text-sm text-neutral-600">Aligns with</span>
              </div>
            </div>
            
            {/* Teams Layer */}
            <div className="grid grid-cols-2 gap-6 mb-8 w-full max-w-4xl">
              {teams.slice(0, 4).map((team: any) => (
                <div key={team.id} className="bg-white p-4 rounded-lg border border-neutral-300 shadow-sm">
                  <h4 className="font-medium text-neutral-900 mb-1">{team.name}</h4>
                  <p className="text-xs text-neutral-600 mb-2">{team.memberCount} members</p>
                  <div className="w-full bg-neutral-200 rounded-full h-1.5 mb-1">
                    <div 
                      className="bg-accent-500 h-1.5 rounded-full" 
                      style={{ width: `${team.performance}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-neutral-500">{team.performance}% performance</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-neutral-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              <h3 className="text-lg font-medium text-neutral-900 mb-1">Strategy Map Visualization</h3>
              <p className="text-sm text-neutral-600 mb-4 max-w-md mx-auto">
                Visualize how your team's objectives connect to company-wide goals to ensure alignment.
              </p>
              <Button variant="outline" className="text-primary-700 border-primary-300 hover:bg-primary-50">
                Create Strategy Map
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function StrategyMapPage() {
  return (
    <DashboardLayout title="Strategy Map" subtitle="Visualize the relationships between objectives across your organization">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Strategy Map</h1>
          <p className="text-neutral-600">Visualize the relationships between objectives across your organization</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="flex items-center gap-1">
            <Edit className="h-4 w-4" />
            Edit Strategy
          </Button>
        </div>
      </div>

      <Tabs defaultValue="alignment" className="mb-8">
        <TabsList>
          <TabsTrigger value="alignment">Company Alignment</TabsTrigger>
          <TabsTrigger value="teams-okr">Teams OKR</TabsTrigger>
          <TabsTrigger value="key-results">Key Results Summary</TabsTrigger>
          <TabsTrigger value="map">Visual Map</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="alignment" className="pt-4">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Company Alignment Map</CardTitle>
            </CardHeader>
            <CardContent>
              <CompanyAlignmentMap />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="teams-okr" className="pt-4">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Teams Objectives & Key Results</CardTitle>
            </CardHeader>
            <CardContent>
              <TeamsOKRView />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="key-results" className="pt-4">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Key Results Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <KeyResultSummary />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="map" className="pt-4">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Strategic Alignment Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <StrategyMap />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="table" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Strategy Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600 mb-4">
                Tabular view of strategic objectives and their interconnections would be shown here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Guidelines for Strategy Mapping</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-neutral-900 mb-1">What is a Strategy Map?</h3>
              <p className="text-sm text-neutral-600">
                A strategy map is a visual tool that shows how different objectives relate to one another and support overall organizational goals. It helps ensure alignment across all levels of the organization.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-neutral-900 mb-1">How to Use the Strategy Map</h3>
              <p className="text-sm text-neutral-600">
                Use this map to trace how team and individual objectives support higher-level company goals. Identify gaps or misalignments in your strategy, and ensure that all activities are connected to meaningful outcomes.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-neutral-900 mb-1">Best Practices</h3>
              <p className="text-sm text-neutral-600">
                Maintain a clear line of sight from company objectives down to team and individual objectives. Regularly review and update the strategy map as priorities evolve. Use the map in planning discussions to ensure new initiatives align with strategic goals.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
