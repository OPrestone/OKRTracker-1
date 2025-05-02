import React from 'react';
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
  UserCog
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
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100 mb-8">
        <div className="flex items-start gap-4">
          <div className="bg-blue-600 bg-opacity-10 p-3 rounded-full">
            <Target className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Our Mission</h3>
            <p className="text-gray-700 leading-relaxed">
              To provide cutting edge technological and digital solutions that ensures RAL is able to generate 1.5B in revenue and a cumulative audience of 37M
            </p>
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
              <p className="text-sm text-gray-600">Align our technical capabilities with business objectives to drive growth.</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center gap-2">
                <div className="bg-primary bg-opacity-10 p-1.5 rounded-full">
                  <CheckCircle className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-base font-medium">One Level Up</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-3">
              <p className="text-sm text-gray-600">
                To become the biggest reach, most influential and trusted company in the communication 
                business in order to deliver sustainable profits for shareholders and staff - by providing
                cutting-edge, innovative products and services that delight our customers, clients, and
                listeners.
              </p>
              <div className="mt-4 px-3 py-2 bg-gray-50 rounded-md border border-gray-100">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-2">Vision</h4>
                <p className="text-sm text-gray-700">Creating a digital ecosystem that empowers businesses and engages audiences.</p>
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
                <p className="text-sm text-gray-700">To transform how people connect through technology and digital solutions.</p>
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
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <p className="text-sm text-gray-600">Supportive GCEO, GCOO and management team</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <p className="text-sm text-gray-600">Motivated and professional team</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <p className="text-sm text-gray-600">Flexibility to experiment and implement ICT solutions</p>
              </div>
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
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                <p className="text-sm text-gray-600">Financial resources, affecting their ability to invest in new technologies or upgrades</p>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                <p className="text-sm text-gray-600">Consultants Delivery Timelines</p>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                <p className="text-sm text-gray-600">Resistance to Change challenges</p>
              </div>
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
              <div className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 text-blue-500 mt-0.5" />
                <p className="text-sm text-gray-600">I will mentor my team more effectively by acknowledging their achievements and challenges</p>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 text-blue-500 mt-0.5" />
                <p className="text-sm text-gray-600">I will delegate more task and responsibilities to my team</p>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 text-blue-500 mt-0.5" />
                <p className="text-sm text-gray-600">I will strive to deliver effective and cost-efficient ICT solutions</p>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 text-blue-500 mt-0.5" />
                <p className="text-sm text-gray-600">I will keep abreast with emerging technologies and encourage innovation within the team</p>
              </div>
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
                We prioritize staying ahead of the technology curve, exploring emerging trends, and investing in 
                solutions that position us as industry leaders.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}