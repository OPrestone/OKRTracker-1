import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, ChevronDown, Plus, MoreHorizontal, Filter, ArrowDownUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

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
  // Categories of OKRs with mock data based on the image
  const [categories, setCategories] = useState<TeamOKRCategory[]>([
    {
      id: 'market-expansion',
      name: 'Market Expansion & Growth Goals',
      isExpanded: true,
      objectives: [
        {
          id: 'market-expansion-goal',
          title: 'Market Expansion & Growth',
          status: 'on-track',
          progress: 39,
          isExpanded: true,
          keyResults: [
            {
              id: 'enhance-website',
              title: 'Enhance technical website performance to improve conversion rates',
              status: 'on-track',
              progress: 39
            },
            {
              id: 'drive-customer-acquisition',
              title: 'Drive new customer acquisition and revenue growth from inbound channels',
              status: 'on-track',
              progress: 37
            },
            {
              id: 'build-outbound-engine',
              title: 'Build a powerful Outbound engine that drives significant revenue',
              status: 'on-track',
              progress: 69
            },
            {
              id: 'fill-pipeline',
              title: 'Fill the sales pipeline with tons of qualified organic leads',
              status: 'on-track',
              progress: 36
            }
          ]
        }
      ]
    },
    {
      id: 'customer-centricity',
      name: 'Customer Centricity Goals',
      isExpanded: true,
      objectives: [
        {
          id: 'customer-centricity-goal',
          title: 'Customer Centricity',
          status: 'on-track',
          progress: 70,
          isExpanded: true,
          keyResults: [
            {
              id: 'turn-customers-ambassadors',
              title: 'Turn our customers into ambassadors',
              status: 'on-track',
              progress: 70
            },
            {
              id: 'improve-reliability',
              title: 'Improve our product reliability and performance',
              status: 'on-track',
              progress: 47
            },
            {
              id: 'improve-loyalty',
              title: 'Improve customer loyalty and retention',
              status: 'on-track',
              progress: 61
            },
            {
              id: 'deliver-value',
              title: 'Deliver value faster to our customers by speeding up our release cycles',
              status: 'on-track',
              progress: 28
            }
          ]
        }
      ]
    },
    {
      id: 'operational-excellence',
      name: 'Operational Excellence Goals',
      isExpanded: true,
      objectives: [
        {
          id: 'operational-excellence-goal',
          title: 'Operational Excellence',
          status: 'on-track',
          progress: 64,
          isExpanded: true,
          keyResults: [
            {
              id: 'streamline-talent',
              title: 'Streamline talent acquisition for a quicker and more effective hiring process',
              status: 'on-track',
              progress: 64
            },
            {
              id: 'ensure-compliance',
              title: 'Ensure compliance with industry standards and regulations',
              status: 'on-track',
              progress: 65
            },
            {
              id: 'get-billing',
              title: 'Get billing and revenue management to a new level',
              status: 'on-track',
              progress: 47
            }
          ]
        }
      ]
    },
    {
      id: 'high-performance',
      name: 'High-Performance Culture Goals',
      isExpanded: true,
      objectives: [
        {
          id: 'high-performance-culture',
          title: 'High-Performance Culture',
          status: 'on-track',
          progress: 31,
          isExpanded: true,
          keyResults: [
            {
              id: 'create-great-place',
              title: 'Create a great and motivating place to work',
              status: 'on-track',
              progress: 31
            }
          ]
        }
      ]
    }
  ]);

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
                <React.Fragment key={objective.id}>
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
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TeamsOKRView;