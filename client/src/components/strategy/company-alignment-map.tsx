import React, { useState } from 'react';
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useTenantContext } from "@/hooks/use-tenant-context";
import { Maximize2, Minimize2, ZoomIn, ZoomOut, Presentation } from "lucide-react";

// Types for our map data
interface TeamTag {
  name: string;
  bgColor?: string;
}

interface User {
  name: string;
  initials: string;
}

interface MapNode {
  id: string;
  title: string;
  progress: number;
  teams?: TeamTag[];
  users?: User[];
  children?: MapNode[];
  parent?: string;
  level: 'company' | 'department' | 'team' | 'individual';
}

export function CompanyAlignmentMap() {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const params = useParams<{ organisation: string }>();
  const { currentTenant } = useTenantContext();
  
  // Build tenant-specific endpoint for API calls
  const organizationId = params?.organisation || currentTenant?.id;
  
  // Fetch data from API - Always call these hooks
  const { data: objectivesData = [] } = useQuery({
    queryKey: ['/api/objectives', organizationId],
    enabled: !!organizationId,
  }) as { data: any[] };
  
  const { data: teamsData = [] } = useQuery({
    queryKey: ['/api/teams', organizationId],
    enabled: !!organizationId,
  }) as { data: any[] };

  // Strategic directions
  const { data: strategicDirections = [] } = useQuery({
    queryKey: ['/api/strategic-directions'],
    enabled: !!organizationId,
  }) as { data: any[] };

  // Create a hierarchical map structure based on real data
  const mapData: MapNode[] = React.useMemo(() => {
    // Transform objectives data into map nodes
    const objectives = objectivesData.map(obj => ({
      id: obj.id,
      title: obj.title,
      progress: obj.progress || 0,
      level: obj.level || 'company' as const,
      teams: teamsData.filter(team => team.id === obj.team_id).map(team => ({
        name: team.name,
        bgColor: team.color
      })),
      users: obj.assigned_to ? [{
        name: obj.assigned_to_name || 'Assigned User',
        initials: (obj.assigned_to_name || 'AU').split(' ').map((n: string) => n[0]).join('').toUpperCase()
      }] : []
    }));

    // Add strategic directions as top-level nodes
    const strategicNodes = strategicDirections.map(direction => ({
      id: direction.id,
      title: direction.title,
      progress: direction.progress || 0,
      level: 'company' as const,
      teams: [],
      users: []
    }));

    return [...strategicNodes, ...objectives];
  }, [objectivesData, teamsData, strategicDirections]);

  // Build hierarchical map nodes
  const mapNodes = React.useMemo(() => {
    // Filter root nodes (company level or no parent)
    const rootNodes = mapData.filter(node => 
      node.level === 'company' || !node.parent
    );
    
    // Add children to each node
    const buildNodeHierarchy = (node: MapNode): MapNode => {
      const children = mapData.filter(child => child.parent === node.id);
      return {
        ...node,
        children: children.map(buildNodeHierarchy)
      };
    };

    return rootNodes.map(buildNodeHierarchy);
  }, [mapData]);

  const togglePresentationMode = () => {
    setIsPresentationMode(!isPresentationMode);
    if (!isPresentationMode) {
      // Enter full screen when entering presentation mode
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      }
    } else {
      // Exit full screen when leaving presentation mode
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Handle keyboard shortcuts for presentation mode
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isPresentationMode) {
        if (e.key === 'Escape') {
          setIsPresentationMode(false);
          if (document.exitFullscreen) {
            document.exitFullscreen();
          }
        } else if (e.key === '+' || e.key === '=') {
          setZoomLevel(prev => Math.min(200, prev + 10));
        } else if (e.key === '-') {
          setZoomLevel(prev => Math.max(50, prev - 10));
        }
      }
    };

    if (isPresentationMode) {
      document.addEventListener('keydown', handleKeyPress);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isPresentationMode]);

  // Render individual node
  const renderNode = (node: MapNode) => (
    <div 
      key={node.id} 
      className="bg-white border-2 border-neutral-200 rounded-lg p-4 min-w-[250px] shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-neutral-900 text-sm leading-tight">{node.title}</h3>
        <div className="flex items-center space-x-1">
          {node.teams && node.teams.map((team, idx) => (
            <div 
              key={idx}
              className="w-3 h-3 rounded-full border border-white"
              style={{ backgroundColor: team.bgColor || '#6B7280' }}
              title={team.name}
            />
          ))}
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-neutral-600">Progress</span>
          <span className="text-xs font-medium text-neutral-900">{node.progress}%</span>
        </div>
        <Progress value={node.progress} className="h-2" />
        
        {node.users && node.users.length > 0 && (
          <div className="flex items-center space-x-1 pt-2">
            {node.users.map((user, idx) => (
              <div 
                key={idx}
                className="w-6 h-6 rounded-full bg-neutral-300 flex items-center justify-center text-xs font-medium text-neutral-700"
                title={user.name}
              >
                {user.initials}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Render child rows recursively
  const renderChildRows = (node: MapNode) => {
    if (!node.children || node.children.length === 0) return null;
    
    return (
      <div className="mt-6 flex flex-col items-center space-y-4">
        <div className="w-px h-8 bg-neutral-300"></div>
        <div className="flex flex-wrap gap-4 justify-center">
          {node.children.map(child => (
            <div key={child.id} className="flex flex-col items-center">
              {renderNode(child)}
              {renderChildRows(child)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isPresentationMode) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Presentation Mode Header */}
        <div className="flex justify-between items-center p-4 bg-slate-900 text-white">
          <h1 className="text-xl font-bold">Company Alignment Map - Presentation Mode</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoomLevel(prev => Math.max(50, prev - 10))}
                className="text-white hover:bg-slate-700"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm min-w-[50px] text-center">{zoomLevel}%</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoomLevel(prev => Math.min(200, prev + 10))}
                className="text-white hover:bg-slate-700"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePresentationMode}
              className="text-white hover:bg-slate-700"
            >
              <Minimize2 className="h-4 w-4 mr-2" />
              Exit Presentation
            </Button>
          </div>
        </div>

        {/* Map Content */}
        <div className="flex-1 overflow-auto bg-neutral-50 p-8">
          <div 
            className="flex flex-col items-center space-y-8"
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          >
            {mapNodes.map(rootNode => (
              <div key={rootNode.id} className="flex flex-col items-center">
                {renderNode(rootNode)}
                {renderChildRows(rootNode)}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Normal mode render
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-neutral-900">Company Alignment Map</h2>
        <Button
          onClick={togglePresentationMode}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Presentation className="h-4 w-4" />
          Present
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}>
        {mapData.map((node) => (
          <div key={node.id} className="bg-white border border-neutral-200 rounded-lg p-4">
            <h3 className="font-medium text-neutral-900 mb-2">{node.title}</h3>
            <Progress value={node.progress} className="mb-2" />
            <span className="text-sm text-neutral-600">{node.progress}% complete</span>
          </div>
        ))}
      </div>
    </div>
  );
}