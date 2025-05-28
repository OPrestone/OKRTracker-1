import React, { useState } from 'react';
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useTenantContext } from "@/hooks/use-tenant-context";

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
  const params = useParams<{ organisation: string }>();
  const { currentTenant } = useTenantContext();
  
  // Build tenant-specific endpoint for API calls
  const organizationId = params?.organisation || currentTenant?.id;
  
  // Fetch data from API
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

  // Create map data structure from real strategic directions and objectives
  const mapNodes: MapNode[] = React.useMemo(() => {
    if (strategicDirections.length === 0) {
      return [];
    }

    // Map strategic directions to company-level nodes
    return strategicDirections.map((direction: any) => {
      // Find objectives that align with this strategic direction
      const alignedObjectives = objectivesData.filter((obj: any) => 
        obj.strategicDirectionId === direction.id
      );

      // Calculate average progress for this strategic direction
      const totalProgress = alignedObjectives.reduce((sum: number, obj: any) => sum + (obj.progress || 0), 0);
      const averageProgress = alignedObjectives.length > 0 ? Math.round(totalProgress / alignedObjectives.length) : 0;

      return {
        id: direction.id,
        title: direction.title,
        level: 'company' as const,
        progress: averageProgress,
        teams: [], // Will be populated from objectives
        children: alignedObjectives.map((objective: any) => ({
          id: objective.id,
          title: objective.title,
          level: 'department' as const,
          progress: objective.progress || 0,
          teams: objective.teamName ? [{ 
            name: objective.teamName, 
            bgColor: 'bg-blue-100' 
          }] : [],
          users: objective.ownerName ? [{ 
            name: objective.ownerName, 
            initials: objective.ownerName.split(' ').map((n: string) => n[0]).join('').toUpperCase()
          }] : [],
          parent: direction.id,
          children: [] // Key results could be added here if needed
        }))
      };
    });
  }, [strategicDirections, objectivesData]);

  // If no strategic directions exist, show empty state
  if (mapNodes.length === 0) {
    return (
      <div className="p-8 bg-slate-50 rounded-lg border">
        <div className="text-center py-12">
          <p className="text-neutral-500 text-lg">No strategic directions found.</p>
          <p className="text-neutral-400 text-sm mt-2">Set up strategic directions to see the company alignment map.</p>
        </div>
      </div>
    );
  }



  // Function to render a node
  const renderNode = (node: MapNode) => {
    const nodeClasses: Record<string, string> = {
      company: 'bg-white border border-green-300 p-4 rounded-lg shadow-sm max-w-xs',
      department: 'bg-white border border-blue-300 p-4 rounded-lg shadow-sm max-w-xs',
      team: 'bg-white border border-gray-300 p-3 rounded-lg shadow-sm max-w-xs',
      individual: 'bg-white border border-gray-300 p-3 rounded-lg shadow-sm max-w-xs'
    };

    return (
      <div className={nodeClasses[node.level]} key={node.id}>
        {node.level === 'company' && (
          <div className="w-8 h-8 rounded-full bg-green-100 mb-2 flex items-center justify-center">
            <span className="text-green-800 text-xs">♦</span>
          </div>
        )}
        {node.level === 'department' && (
          <div className="w-8 h-8 rounded-full bg-blue-100 mb-2 flex items-center justify-center">
            <span className="text-blue-800 text-xs">♦</span>
          </div>
        )}
        <h3 className="font-medium text-sm mb-1">{node.title}</h3>
        
        <div className="flex flex-wrap gap-1 mb-2">
          {node.teams?.map((team, index) => (
            <span key={index} className={`${team.bgColor || 'bg-gray-100'} text-xs px-2 py-0.5 rounded-full`}>
              {team.name}
            </span>
          ))}
        </div>
        
        {node.users && node.users.length > 0 && (
          <div className="flex mb-2">
            {node.users.map((user, index) => (
              <div 
                key={index} 
                className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs mr-1"
                title={user.name}
              >
                {user.initials}
              </div>
            ))}
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <Progress className="h-2 flex-grow" value={node.progress} />
          <span className="text-xs font-medium">{node.progress}%</span>
        </div>
        
        {node.level === 'department' && (
          <div className="mt-1">
            <span className="text-xs text-gray-500">On track</span>
          </div>
        )}
      </div>
    );
  };

  // Render connector lines
  const renderConnector = () => (
    <div className="w-px h-12 bg-gray-300 mx-auto"></div>
  );

  // Render a row of nodes
  const renderNodesRow = (nodes: MapNode[]) => (
    <div className="flex justify-center gap-16">
      {nodes.map(node => renderNode(node))}
    </div>
  );

  // Render child rows with appropriate spacing
  const renderChildRows = (parentNode: MapNode) => {
    if (!parentNode.children || parentNode.children.length === 0) return null;

    return (
      <>
        {renderConnector()}
        <div className="flex justify-center gap-16">
          {parentNode.children.map(childNode => (
            <div key={childNode.id} className="flex flex-col items-center">
              {renderNode(childNode)}
              {childNode.children && childNode.children.length > 0 && (
                <>
                  {renderConnector()}
                  <div className="flex justify-center gap-8">
                    {childNode.children.map(grandChild => (
                      <div key={grandChild.id} className="flex flex-col items-center">
                        {renderNode(grandChild)}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="p-8 bg-slate-50 rounded-lg border overflow-auto">
      <div 
        className="flex flex-col items-center min-w-[1000px]"
        style={{ transform: `scale(${zoomLevel/100})`, transformOrigin: 'top center' }}
      >
        {mapNodes.map(rootNode => (
          <div key={rootNode.id} className="flex flex-col items-center">
            {renderNode(rootNode)}
            {renderChildRows(rootNode)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CompanyAlignmentMap;