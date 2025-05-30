import React, { useState, useEffect } from 'react';
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useTenantContext } from "@/hooks/use-tenant-context";
import { Presentation, ZoomIn, ZoomOut, Maximize, X, ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";

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
  const [presentationMode, setPresentationMode] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
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

    // Get all objectives, both aligned and unaligned
    const alignedObjectiveIds = new Set();
    const unalignedObjectives: any[] = [];
    
    // First pass: collect aligned objectives
    const initialNodes = strategicDirections.map((direction: any) => {
      const alignedObjectives = objectivesData.filter((obj: any) => 
        obj.strategyId === direction.id
      );
      
      // Track which objectives are already aligned
      alignedObjectives.forEach((obj: any) => alignedObjectiveIds.add(obj.id));

      const totalProgress = alignedObjectives.reduce((sum: number, obj: any) => sum + (obj.progress || 0), 0);
      const averageProgress = alignedObjectives.length > 0 ? Math.round(totalProgress / alignedObjectives.length) : 0;

      return {
        direction,
        alignedObjectives,
        averageProgress
      };
    });

    // Find unaligned objectives
    objectivesData.forEach((obj: any) => {
      if (!alignedObjectiveIds.has(obj.id)) {
        unalignedObjectives.push(obj);
      }
    });

    // Distribute unaligned objectives across strategic directions
    // This ensures all objectives appear in the alignment map
    unalignedObjectives.forEach((obj: any, index: number) => {
      const directionIndex = index % strategicDirections.length;
      initialNodes[directionIndex].alignedObjectives.push(obj);
    });

    // Build final map nodes with all objectives aligned
    return initialNodes.map(({ direction, alignedObjectives, averageProgress }) => {
      // Recalculate progress including newly distributed objectives
      const totalProgress = alignedObjectives.reduce((sum: number, obj: any) => sum + (obj.progress || 0), 0);
      const finalAverageProgress = alignedObjectives.length > 0 ? Math.round(totalProgress / alignedObjectives.length) : 0;

      return {
        id: direction.id,
        title: direction.title,
        level: 'company' as const,
        progress: finalAverageProgress,
        teams: [], // Will be populated from objectives
        children: alignedObjectives.map((objective: any) => ({
          id: objective.id,
          title: objective.title,
          level: 'department' as const,
          progress: objective.progress || 0,
          teams: objective.teamName ? [{ 
            name: objective.teamName, 
            bgColor: objective.strategyId === direction.id ? 'bg-blue-100' : 'bg-yellow-100'
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

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlay && presentationMode && mapNodes.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % mapNodes.length);
      }, 4000); // Change slide every 4 seconds
      
      return () => clearInterval(interval);
    }
  }, [isAutoPlay, presentationMode, mapNodes.length]);

  // Keyboard navigation for presentation mode
  useEffect(() => {
    if (!presentationMode) return;
    
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          setCurrentSlide(prev => Math.min(prev + 1, mapNodes.length - 1));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setCurrentSlide(prev => Math.max(prev - 1, 0));
          break;
        case 'Escape':
          setPresentationMode(false);
          break;
        case 'p':
          setIsAutoPlay(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [presentationMode, mapNodes.length]);

  // Presentation functions
  const startPresentation = () => {
    setPresentationMode(true);
    setCurrentSlide(0);
  };

  const exitPresentation = () => {
    setPresentationMode(false);
    setIsAutoPlay(false);
  };

  const nextSlide = () => {
    setCurrentSlide(prev => Math.min(prev + 1, mapNodes.length - 1));
  };

  const prevSlide = () => {
    setCurrentSlide(prev => Math.max(prev - 1, 0));
  };

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

  // Render presentation mode
  if (presentationMode) {
    const currentNode = mapNodes[currentSlide];
    
    return (
      <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">
        {/* Presentation Header */}
        <div className="flex items-center justify-between p-4 bg-slate-800 text-white">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Company Alignment Map Presentation</h2>
            <div className="text-sm text-slate-300">
              Slide {currentSlide + 1} of {mapNodes.length}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAutoPlay(!isAutoPlay)}
              className="text-white hover:bg-slate-700"
            >
              {isAutoPlay ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={exitPresentation}
              className="text-white hover:bg-slate-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Presentation Content - Full Screen */}
        <div className="flex-1 flex items-center justify-center bg-slate-100 relative overflow-hidden">
          <div className="w-full h-full flex flex-col items-center justify-center p-8">
            {/* Tree Structure Presentation - Full Screen */}
            <div className="flex flex-col items-center justify-center space-y-12 relative w-full h-full max-w-7xl">
              {/* Title with Progress */}
              <div className="text-center mb-16">
                <h1 className="text-5xl font-bold text-slate-800 mb-6">
                  {currentNode.title}
                </h1>
                <div className="flex items-center justify-center gap-6">
                  <div className="text-3xl font-semibold text-green-700">
                    {currentNode.progress}% Overall Progress
                  </div>
                  <Progress value={currentNode.progress} className="w-80 h-4" />
                </div>
              </div>

              {/* Strategic Direction Node (Top Level) */}
              <div className="relative flex flex-col items-center">
                <div id="strategic-node" className="bg-gradient-to-br from-green-50 to-emerald-100 border-3 border-green-300 p-10 rounded-2xl shadow-2xl text-center z-10 relative">
                  <div className="w-16 h-16 rounded-full bg-green-200 mb-6 flex items-center justify-center mx-auto">
                    <span className="text-green-800 text-2xl">♦</span>
                  </div>
                  <h2 className="font-bold text-2xl text-slate-900 mb-3">{currentNode.title}</h2>
                  <div className="text-lg text-slate-600 mb-4">Strategic Direction</div>
                  <div className="flex items-center justify-center gap-4">
                    <Progress value={currentNode.progress} className="w-48 h-4" />
                    <span className="text-xl font-bold text-green-700">{currentNode.progress}%</span>
                  </div>
                </div>

                {/* Enhanced Connector System */}
                {currentNode.children && currentNode.children.length > 0 && (
                  <>
                    {/* Main vertical line from strategic direction */}
                    <div className="w-1 h-24 bg-slate-300 relative z-0"></div>
                    
                    {/* Horizontal distribution line */}
                    <div className="relative w-full flex justify-center">
                      <div 
                        className="h-1 bg-slate-300 absolute"
                        style={{ 
                          width: `${Math.min(currentNode.children.length * 320, 1200)}px`,
                          top: '-0.5px'
                        }}
                      ></div>
                    </div>
                  </>
                )}

                {/* Objectives Row with Individual Connectors */}
                {currentNode.children && currentNode.children.length > 0 && (
                  <div className="flex justify-center items-start gap-16 flex-wrap mt-8">
                    {currentNode.children.map((objective, index) => (
                      <div key={objective.id} className="flex flex-col items-center relative">
                        {/* Individual vertical connector to horizontal line */}
                        <div className="w-1 h-16 bg-slate-300 mb-8"></div>
                        
                        {/* Objective Node */}
                        <div className="bg-gradient-to-br from-blue-50 to-sky-100 border-3 border-blue-300 p-8 rounded-2xl shadow-2xl text-center max-w-sm">
                          <div className="w-14 h-14 rounded-full bg-blue-200 mb-4 flex items-center justify-center mx-auto">
                            <span className="text-blue-800 text-xl">♦</span>
                          </div>
                          
                          <h3 className="font-bold text-xl text-slate-900 mb-4 leading-tight min-h-[3rem]">
                            {objective.title}
                          </h3>
                          
                          {/* Team Tags */}
                          <div className="flex flex-wrap gap-2 justify-center mb-4">
                            {objective.teams?.map((team, teamIndex) => (
                              <span key={teamIndex} className={`${team.bgColor || 'bg-blue-100'} text-sm px-3 py-1 rounded-full font-semibold`}>
                                {team.name}
                              </span>
                            ))}
                          </div>
                          
                          {/* Users */}
                          {objective.users && objective.users.length > 0 && (
                            <div className="flex justify-center items-center gap-3 mb-4">
                              {objective.users.map((user, userIndex) => (
                                <div key={userIndex} className="flex flex-col items-center">
                                  <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center text-sm font-bold mb-2">
                                    {user.initials}
                                  </div>
                                  <span className="text-sm text-slate-700 font-medium">{user.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Progress */}
                          <div className="space-y-3 mt-6">
                            <div className="flex items-center justify-between">
                              <span className="text-base font-semibold text-slate-600">Progress</span>
                              <span className="text-xl font-bold text-slate-900">{objective.progress}%</span>
                            </div>
                            <Progress value={objective.progress} className="h-3" />
                            <div className="text-sm font-medium text-slate-600">
                              {objective.progress >= 75 ? '🎯 Excellent Progress' : 
                               objective.progress >= 50 ? '✅ On Track' : 
                               objective.progress >= 25 ? '⚠️ Needs Attention' : '🚨 At Risk'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Presentation Controls */}
        <div className="flex items-center justify-between p-4 bg-slate-800 text-white">
          <Button
            variant="ghost"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="text-white hover:bg-slate-700 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          <div className="flex gap-2">
            {mapNodes.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-blue-500' : 'bg-slate-600 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>
          
          <Button
            variant="ghost"
            onClick={nextSlide}
            disabled={currentSlide === mapNodes.length - 1}
            className="text-white hover:bg-slate-700 disabled:opacity-50"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Keyboard Instructions */}
        <div className="absolute bottom-16 right-4 text-slate-400 text-xs">
          Use ← → arrows, Space, P (auto-play), or Esc to control
        </div>
      </div>
    );
  }

  // Regular view with presentation controls
  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-slate-900">Company Alignment Map</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-slate-600 min-w-[4rem] text-center">
              {zoomLevel}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={startPresentation}
            className="flex items-center gap-2"
          >
            <Presentation className="h-4 w-4" />
            Start Presentation
          </Button>
        </div>
      </div>

      {/* Map Content */}
      <div className="p-8 bg-slate-50 rounded-lg border overflow-auto">
        <div 
          className="flex flex-col items-center min-w-[1000px]"
          style={{ transform: `scale(${zoomLevel/100})`, transformOrigin: 'top center' }}
        >
          {mapNodes.map(rootNode => (
            <div key={rootNode.id} className="flex flex-col items-center mb-12">
              {renderNode(rootNode)}
              {renderChildRows(rootNode)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CompanyAlignmentMap;