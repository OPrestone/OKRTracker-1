import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import { 
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle, 
  Circle, 
  ChevronDown, 
  FileEdit, 
  Lightbulb,
  Presentation, 
  Download,
  Target,
  Unlock,
  UserCog,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

interface MissionStatementProps {
  className?: string;
  tenantId?: string;
}

export function MissionStatement({ className, tenantId: propTenantId }: MissionStatementProps) {
  const [location] = useLocation();
  
  // Extract tenantId from URL path if not provided as prop
  // Format could be either:
  // 1. /:id([A-Z0-9]{26})/mission (new ULID format)
  // 2. /organization/:organisation/mission (legacy format)
  const pathParts = location.split('/');
  const urlTenantId = pathParts[1] === 'organization' ? pathParts[2] : pathParts[1];
  
  // Use provided tenantId or extract from URL
  const tenantId = propTenantId || urlTenantId;
  
  // Fetch mission data from API
  const { data: missionData, isLoading, error } = useQuery({
    queryKey: ['/api/organization-mission', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      
      const response = await fetch(`/api/organization-mission?tenantId=${tenantId}`, { 
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch mission data');
      }
      
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    },
    enabled: !!tenantId // Only run query when tenantId is available
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading mission data...</span>
      </div>
    );
  }
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-gray-800">Mission</h2>
          <ChevronDown className="h-5 w-5 text-gray-500" />
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Presentation className="h-4 w-4" />
            <span>Present</span>
          </Button>
          {tenantId && (
            <Button variant="outline" size="sm" className="flex items-center gap-1" asChild>
              <Link href={`/${tenantId}/mission`}>
                <FileEdit className="h-4 w-4" />
                <span>Edit</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
      
      {/* Mission statement */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100 mb-8">
        <div className="flex items-start gap-4">
          <div className="bg-blue-600 bg-opacity-10 p-3 rounded-full">
            <Target className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Our Mission</h3>
            {missionData?.mission_statement ? (
              <p className="text-gray-700 leading-relaxed">
                {missionData.mission_statement}
              </p>
            ) : (
              <p className="text-gray-500 italic">No mission statement defined yet. Click edit to add one.</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center gap-2">
                <div className="bg-primary bg-opacity-10 p-1.5 rounded-full">
                  <CheckCircle className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-base font-medium">Strategic Direction</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-3">
              <p className="text-sm text-gray-600">
                {missionData?.strategic_direction || "Define your organization's strategic direction."}
              </p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center gap-2">
                <div className="bg-primary bg-opacity-10 p-1.5 rounded-full">
                  <CheckCircle className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-base font-medium">Vision</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="px-3 py-2 bg-gray-50 rounded-md border border-gray-100">
                <p className="text-sm text-gray-700">
                  {missionData?.vision_statement || "Define your organization's vision."}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center gap-2">
                <div className="bg-primary bg-opacity-10 p-1.5 rounded-full">
                  <CheckCircle className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-base font-medium">Purpose</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="px-3 py-2 bg-gray-50 rounded-md border border-gray-100">
                <p className="text-sm text-gray-700">
                  {missionData?.purpose || "To transform how people connect through technology and digital solutions."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Middle column */}
        <div className="space-y-6">
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center gap-2">
                <div className="bg-gray-200 p-1.5 rounded-full">
                  <Circle className="h-4 w-4 text-gray-400" />
                </div>
                <CardTitle className="text-base font-medium">Boundaries</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-3">
              <p className="text-sm text-gray-600">Clear guidelines that define our operational limits and focus areas.</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-green-400">
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center gap-2">
                <Unlock className="h-4 w-4 text-green-500" />
                <CardTitle className="text-base font-medium">Freedoms</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-3 space-y-3">
              {missionData?.boundaries?.freedoms && Array.isArray(missionData.boundaries.freedoms) ? (
                missionData.boundaries.freedoms.map((freedom, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <p className="text-sm text-gray-600">{freedom}</p>
                  </div>
                ))
              ) : (
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <p className="text-sm text-gray-600">Define the freedoms your team has.</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-amber-400">
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-base font-medium">Constraints</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-3 space-y-3">
              {missionData?.boundaries?.constraints && Array.isArray(missionData.boundaries.constraints) ? (
                missionData.boundaries.constraints.map((constraint, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <p className="text-sm text-gray-600">{constraint}</p>
                  </div>
                ))
              ) : (
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                  <p className="text-sm text-gray-600">Define the constraints your team works within.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Right column */}
        <div className="space-y-6">
          <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-blue-400">
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center gap-2">
                <UserCog className="h-4 w-4 text-blue-500" />
                <CardTitle className="text-base font-medium">Behaviours</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-3 space-y-3">
              {missionData?.behaviors && Array.isArray(missionData.behaviors) ? (
                missionData.behaviors.map((behavior, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-blue-500 mt-0.5" />
                    <p className="text-sm text-gray-600">{behavior}</p>
                  </div>
                ))
              ) : (
                <div className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 text-blue-500 mt-0.5" />
                  <p className="text-sm text-gray-600">Define the behaviors that will drive success.</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-purple-400">
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-purple-500" />
                <CardTitle className="text-base font-medium">Innovation Focus</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-3">
              <p className="text-sm text-gray-600">
                {missionData?.innovation_focus || "We prioritize staying ahead of the technology curve, exploring emerging trends, and investing in solutions that position us as industry leaders."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}