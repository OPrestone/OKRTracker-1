import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import { 
  CheckCircle, 
  Circle, 
  ChevronDown, 
  FileEdit, 
  Presentation, 
  Download 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MissionStatementProps {
  className?: string;
}

export function MissionStatement({ className }: MissionStatementProps) {
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
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <FileEdit className="h-4 w-4" />
            <span>Edit</span>
          </Button>
        </div>
      </div>
      
      {/* Mission statement */}
      <p className="text-gray-700 mb-6">
        To provide cutting edge technological and digital solutions that ensures RAL is able to generate 1.5B in revenue and a cumulative audience of 37M
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left column */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Strategic Direction</CardTitle>
              </div>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">One Level Up</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-gray-600">
                To become the biggest reach, most influential and trusted company in the communication 
                business in order to deliver sustainable profits for shareholders and staff - by providing
                cutting-edge, innovative products and services that delight our customers, clients, and
                listeners.
              </p>
              <div className="mt-3 space-y-1">
                <p className="text-xs text-gray-500">Enter Vision</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Purpose</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-gray-500">Enter Purpose</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Values</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-gray-500">Enter Values</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Middle column */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Circle className="h-5 w-5 text-gray-300" />
                <CardTitle className="text-base">Boundaries</CardTitle>
              </div>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Freedoms</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <p className="text-sm text-gray-600">Supportive GCEO, GCOO and management team</p>
              <p className="text-sm text-gray-600">Motivated and professional team</p>
              <p className="text-sm text-gray-600">Flexibility to experiment and implement ICT solutions</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Constraints</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <p className="text-sm text-gray-600">Financial resources, affecting their ability to invest in new technologies or upgrades</p>
              <p className="text-sm text-gray-600">Consultants Delivery Timelines</p>
              <p className="text-sm text-gray-600">Resistance to Change challenges</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Right column */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Behaviours</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <p className="text-sm text-gray-600">I will mentor my team more effectively by acknowledging their achievements and challenges</p>
              <p className="text-sm text-gray-600">I will delegate more task and responsibilities to my team</p>
              <p className="text-sm text-gray-600">I will strive to deliver effective and cost-efficient ICT solutions</p>
              <p className="text-sm text-gray-600">I will keep abreast with emerging technologies and encourage innovation within the team</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}