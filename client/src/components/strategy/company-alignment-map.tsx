import React, { useState } from 'react';
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";

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
  
  // Fetch data from API
  const { data: objectivesData = [] } = useQuery({
    queryKey: ['/api/objectives'],
  }) as { data: any[] };
  
  const { data: teamsData = [] } = useQuery({
    queryKey: ['/api/teams'],
  }) as { data: any[] };

  // Create a sample map data structure based on the image
  // In a real application, this would be constructed from API data
  const mapNodes: MapNode[] = [
    {
      id: 'market-expansion',
      title: 'Market Expansion & Growth',
      level: 'company',
      progress: 35,
      teams: [{ name: 'ICT Team', bgColor: 'bg-blue-100' }],
      children: [
        {
          id: 'customer-acquisition',
          title: 'Drive new customer acquisition and revenue growth from inbound channels',
          level: 'department',
          progress: 37,
          teams: [
            { name: 'Operations', bgColor: 'bg-green-100' }, 
            { name: 'Sales', bgColor: 'bg-orange-100' },
            { name: 'ICT Team', bgColor: 'bg-blue-100' }
          ],
          users: [{ name: 'Sophie Hansen', initials: 'SH' }],
          parent: 'market-expansion',
          children: [
            {
              id: 'increase-deal-size',
              title: 'Achieve a 10% increase in average deal size',
              level: 'team',
              progress: 3,
              teams: [{ name: 'Sales', bgColor: 'bg-orange-100' }],
              parent: 'customer-acquisition'
            },
            {
              id: 'smb-inbound-leads',
              title: 'Generate $5M in new SMB from inbound leads',
              level: 'team',
              progress: 1,
              teams: [{ name: 'Sales', bgColor: 'bg-orange-100' }],
              parent: 'customer-acquisition'
            }
          ]
        },
        {
          id: 'outbound-engine',
          title: 'Build a powerful Outbound engine that drives significant revenue',
          level: 'department',
          progress: 80,
          teams: [
            { name: 'Operations', bgColor: 'bg-green-100' }, 
            { name: 'ICT Team', bgColor: 'bg-blue-100' }
          ],
          users: [{ name: 'Sophie Hansen', initials: 'SH' }],
          parent: 'market-expansion',
          children: [
            {
              id: 'convert-mqls',
              title: 'Convert 12% of MQLs into Opportunities',
              level: 'team',
              progress: 6,
              teams: [{ name: 'Sales', bgColor: 'bg-orange-100' }],
              parent: 'outbound-engine'
            },
            {
              id: 'prospect-volume',
              title: 'Increase prospect volume through cold email by 35%',
              level: 'team',
              progress: 27,
              teams: [{ name: 'Sales', bgColor: 'bg-orange-100' }],
              parent: 'outbound-engine'
            },
            {
              id: 'cold-email-open-rate',
              title: 'Achieve average cold email open rate of 40% or higher',
              level: 'team',
              progress: 45,
              teams: [{ name: 'Sales', bgColor: 'bg-orange-100' }],
              parent: 'outbound-engine'
            },
            {
              id: 'generate-smb',
              title: 'Generate $2M in new SMB ARR through Outbound',
              level: 'team',
              progress: 90,
              teams: [{ name: 'Sales', bgColor: 'bg-orange-100' }],
              parent: 'outbound-engine'
            }
          ]
        }
      ]
    }
  ];

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