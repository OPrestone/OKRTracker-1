import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, ChevronDown, Plus, MoreHorizontal, Filter, ArrowDownUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useTenantContext } from '@/hooks/use-tenant-context';

interface TeamOKRCategory {
  id: string;
  name: string;
  objectives: TeamObjective[];
  isExpanded: boolean;
}

interface TeamObjective {
  id: string;
  title: string;
  status: 'on-track' | 'at-risk' | 'behind';
  progress: number;
  isExpanded: boolean;
  keyResults?: TeamKeyResult[];
}

interface TeamKeyResult {
  id: string;
  title: string;
  status: 'on-track' | 'at-risk' | 'behind';
  progress: number;
}

export const TeamsOKRView: React.FC = () => {
  const params = useParams<{ organisation: string }>();
  const { currentTenant } = useTenantContext();
  
  // Build tenant-specific endpoint for API calls
  const organizationId = params?.organisation || currentTenant?.id;
  
  // Fetch team data from API
  const { data: teamData = [] } = useQuery({
    queryKey: ['/api/teams', organizationId],
    enabled: !!organizationId,
  }) as { data: any[] };
  
  // Fetch objectives data from API
  const { data: objectivesData = [] } = useQuery({
    queryKey: ['/api/objectives', organizationId],
    enabled: !!organizationId,
  }) as { data: any[] };

  // Fetch key results data from API
  const { data: keyResultsData = [] } = useQuery({
    queryKey: ['/api/key-results', organizationId],
    enabled: !!organizationId,
  }) as { data: any[] };

  // Fetch strategic directions data from API
  const { data: strategicDirections = [] } = useQuery({
    queryKey: ['/api/strategic-directions', organizationId],
    enabled: !!organizationId,
  }) as { data: any[] };
  
  // Helper function to determine status based on progress
  const getStatusFromProgress = (progress: number): 'on-track' | 'at-risk' | 'behind' => {
    if (progress >= 70) return 'on-track';
    if (progress >= 40) return 'at-risk';
    return 'behind';
  };

  // Helper function to calculate objective progress from key results
  const calculateObjectiveProgress = (objectiveId: string): number => {
    const relatedKeyResults = keyResultsData.filter(kr => kr.objective_id === objectiveId);
    if (relatedKeyResults.length === 0) return 0;
    
    const totalProgress = relatedKeyResults.reduce((sum, kr) => sum + (kr.progress || 0), 0);
    return Math.round(totalProgress / relatedKeyResults.length);
  };

  // Create categories based on real API data
  const [categories, setCategories] = useState<TeamOKRCategory[]>([]);

  // Update categories when data changes
  useEffect(() => {
    if (strategicDirections.length === 0 && objectivesData.length === 0) {
      setCategories([]);
      return;
    }

    const realCategories: TeamOKRCategory[] = [];

    // Group objectives by strategic direction if available
    if (strategicDirections.length > 0) {
      strategicDirections.forEach(direction => {
        const relatedObjectives = objectivesData.filter(obj => 
          obj.strategic_direction_id === direction.id
        );

        if (relatedObjectives.length > 0) {
          const categoryObjectives: TeamObjective[] = relatedObjectives.map(objective => {
            const progress = calculateObjectiveProgress(objective.id);
            const objectiveKeyResults = keyResultsData
              .filter(kr => kr.objective_id === objective.id)
              .map(kr => ({
                id: kr.id,
                title: kr.title || 'Untitled Key Result',
                status: getStatusFromProgress(kr.progress || 0),
                progress: kr.progress || 0
              }));

            return {
              id: objective.id,
              title: objective.title || 'Untitled Objective',
              status: getStatusFromProgress(progress),
              progress: progress,
              isExpanded: false,
              keyResults: objectiveKeyResults
            };
          });

          realCategories.push({
            id: direction.id,
            name: `${direction.title} Goals`,
            isExpanded: true,
            objectives: categoryObjectives
          });
        }
      });
    }

    // Add objectives without strategic direction alignment to a general category
    const unalignedObjectives = objectivesData.filter(obj => 
      !obj.strategic_direction_id || !strategicDirections.find(sd => sd.id === obj.strategic_direction_id)
    );

    if (unalignedObjectives.length > 0) {
      const generalObjectives: TeamObjective[] = unalignedObjectives.map(objective => {
        const progress = calculateObjectiveProgress(objective.id);
        const objectiveKeyResults = keyResultsData
          .filter(kr => kr.objective_id === objective.id)
          .map(kr => ({
            id: kr.id,
            title: kr.title || 'Untitled Key Result',
            status: getStatusFromProgress(kr.progress || 0),
            progress: kr.progress || 0
          }));

        return {
          id: objective.id,
          title: objective.title || 'Untitled Objective',
          status: getStatusFromProgress(progress),
          progress: progress,
          isExpanded: false,
          keyResults: objectiveKeyResults
        };
      });

      realCategories.push({
        id: 'general-objectives',
        name: 'Company Objectives',
        isExpanded: true,
        objectives: generalObjectives
      });
    }

    setCategories(realCategories);
  }, [objectivesData, keyResultsData, strategicDirections]);

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setCategories(categories.map(category => 
      category.id === categoryId 
        ? { ...category, isExpanded: !category.isExpanded } 
        : category
    ));
  };

  // Toggle objective expansion
  const toggleObjective = (categoryId: string, objectiveId: string) => {
    setCategories(categories.map(category => 
      category.id === categoryId 
        ? { 
            ...category, 
            objectives: category.objectives.map(objective => 
              objective.id === objectiveId 
                ? { ...objective, isExpanded: !objective.isExpanded } 
                : objective
            ) 
          } 
        : category
    ));
  };

  // Render status badge
  const renderStatusBadge = (status: 'on-track' | 'at-risk' | 'behind') => {
    const statusConfig = {
      'on-track': { text: 'On track', class: 'bg-green-100 text-green-800 hover:bg-green-200' },
      'at-risk': { text: 'At risk', class: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' },
      'behind': { text: 'Behind', class: 'bg-red-100 text-red-800 hover:bg-red-200' }
    };
    
    return (
      <Badge className={statusConfig[status].class}>
        {statusConfig[status].text}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls for all sections */}
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          New
        </Button>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            All Cycles
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-1" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <ArrowDownUp className="h-4 w-4 mr-1" />
            Sort
          </Button>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {categories.length === 0 && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3">
              <Plus className="h-6 w-6 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-1">No Objectives Found</h3>
            <p className="text-sm text-neutral-600 mb-4 max-w-md mx-auto">
              Create your first objective to see teams' OKR progress and alignment with strategic directions.
            </p>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Create Objective
            </Button>
          </div>
        </div>
      )}

      {/* Categories */}
      {categories.map(category => (
        <div key={category.id} className="bg-white rounded-md border shadow-sm overflow-hidden">
          {/* Category Header */}
          <div className="flex justify-between items-center p-4 bg-gray-50 border-b">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-0 h-auto mr-2" 
                onClick={() => toggleCategory(category.id)}
              >
                {category.isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </Button>
              <h3 className="font-medium text-sm">{category.name}</h3>
            </div>
            <div className="flex items-center space-x-1">
              <Button variant="outline" size="sm" className="h-7 px-2">
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-7 px-2">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Category Table */}
          {category.isExpanded && (
            <div>
              {/* Table Headers */}
              <div className="grid grid-cols-12 px-4 py-2 border-b text-xs font-medium text-gray-500">
                <div className="col-span-7">Name</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Progress</div>
                <div className="col-span-1"></div>
              </div>

              {/* Objectives and Key Results */}
              {category.objectives.map(objective => (
                <div key={objective.id}>
                  {/* Objective Row */}
                  <div className="grid grid-cols-12 px-4 py-3 border-b items-center hover:bg-gray-50">
                    <div className="col-span-7 flex items-center">
                      <Checkbox className="mr-2" />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-0 h-auto mr-2" 
                        onClick={() => toggleObjective(category.id, objective.id)}
                      >
                        {objective.isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                      <span className="font-medium">{objective.title}</span>
                    </div>
                    <div className="col-span-2">
                      {renderStatusBadge(objective.status)}
                    </div>
                    <div className="col-span-2 flex items-center">
                      <Progress className="h-2 flex-grow mr-2" value={objective.progress} />
                      <span className="text-xs font-medium">{objective.progress}%</span>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Key Results */}
                  {objective.isExpanded && objective.keyResults?.map(kr => (
                    <div 
                      key={kr.id}
                      className="grid grid-cols-12 px-4 py-3 border-b items-center bg-gray-50 pl-12"
                    >
                      <div className="col-span-7 flex items-center">
                        <Checkbox className="mr-2" />
                        <span className="text-sm">{kr.title}</span>
                      </div>
                      <div className="col-span-2">
                        {renderStatusBadge(kr.status)}
                      </div>
                      <div className="col-span-2 flex items-center">
                        <Progress className="h-2 flex-grow mr-2" value={kr.progress} />
                        <span className="text-xs font-medium">{kr.progress}%</span>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* New Key Result Button */}
                  {objective.isExpanded && (
                    <div className="px-4 py-2 border-b bg-gray-50 pl-12">
                      <Button variant="ghost" size="sm" className="text-blue-600">
                        <Plus className="h-4 w-4 mr-1" />
                        New
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TeamsOKRView;