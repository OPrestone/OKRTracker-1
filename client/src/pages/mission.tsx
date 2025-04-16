import React from "react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Alert,
  AlertDescription,
  AlertTitle
} from "@/components/ui/alert";
import { 
  Compass, 
  Target, 
  Heart, 
  Lightbulb, 
  Users, 
  Award,
  AlertCircle
} from "lucide-react";

export default function MissionPage() {
  return (
    <DashboardLayout title="Company Mission">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mission & Values</h1>
            <p className="text-gray-600 mt-2">
              Our company mission and core values that guide everything we do
            </p>
          </div>
        </div>
        
        <Alert className="bg-blue-50 border-blue-200 mb-8">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Alignment Reminder</AlertTitle>
          <AlertDescription className="text-blue-700">
            All OKRs should ultimately support our mission and align with our core values.
          </AlertDescription>
        </Alert>
      </div>

      <div className="grid gap-8 mb-10">
        <Card className="overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-primary to-secondary"></div>
          <CardHeader className="pb-2">
            <div className="flex items-center mb-1">
              <Compass className="h-5 w-5 text-primary mr-2" />
              <CardTitle>Our Mission</CardTitle>
            </div>
            <CardDescription>What drives our organization forward</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 p-6 rounded-lg border border-border text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                We empower organizations to achieve ambitious goals through transparent alignment and measurable outcomes.
              </h2>
              <p className="text-gray-600 italic">
                "Our mission is to transform how teams work by providing clarity, focus, and accountability. We believe that 
                when everyone understands how their work contributes to the bigger picture, remarkable things happen."
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center mb-1">
              <Target className="h-5 w-5 text-primary mr-2" />
              <CardTitle>Our Vision</CardTitle>
            </div>
            <CardDescription>Where we're headed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 p-6 rounded-lg border border-border">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                To be the catalyst for a world where every organization operates with clarity, purpose, and measurable impact.
              </h3>
              <p className="text-gray-600">
                We envision a future where teams at all levels are inspired by shared goals, empowered by clear priorities, 
                and united by transparent progress tracking. Our OKR system is designed to make this vision a reality for 
                organizations worldwide.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <Award className="h-6 w-6 text-primary mr-2" />
        Our Core Values
      </h2>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <div className="rounded-full bg-red-100 p-2 mr-3">
                <Heart className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <CardTitle>Passion</CardTitle>
                <CardDescription>We love what we do</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              We are deeply committed to our mission and approach our work with enthusiasm. We believe in the power 
              of OKRs to transform organizations and are passionate about helping our customers succeed.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <div className="rounded-full bg-amber-100 p-2 mr-3">
                <Lightbulb className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <CardTitle>Innovation</CardTitle>
                <CardDescription>We embrace new ideas</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              We continuously explore new ways to improve our platform and approach challenges with creativity. 
              We're not afraid to experiment and learn from both successes and failures.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <div className="rounded-full bg-green-100 p-2 mr-3">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle>Collaboration</CardTitle>
                <CardDescription>We achieve more together</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              We believe great things happen when people work together. We foster an environment where diverse 
              perspectives are valued, and everyone's contribution matters to our collective success.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <div className="rounded-full bg-blue-100 p-2 mr-3">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>Accountability</CardTitle>
                <CardDescription>We take ownership</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              We set ambitious goals and hold ourselves accountable for results. We embrace transparency in our 
              successes and challenges, learning and improving with each cycle.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-50 border-slate-200 mb-8">
        <CardHeader>
          <CardTitle className="text-slate-800">How Our Mission Guides OKRs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700 mb-4">
            Our mission and values are not just words on a page - they actively shape how we define success and 
            set objectives. Here's how they translate into our OKR approach:
          </p>
          
          <div className="space-y-4">
            <div className="flex">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                <span className="font-medium text-primary">1</span>
              </div>
              <div>
                <h4 className="font-medium text-slate-800">Alignment with Mission</h4>
                <p className="text-slate-600 text-sm">
                  Every objective should ultimately contribute to our core mission of empowering organizations 
                  with transparent alignment and measurable outcomes.
                </p>
              </div>
            </div>
            
            <div className="flex">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                <span className="font-medium text-primary">2</span>
              </div>
              <div>
                <h4 className="font-medium text-slate-800">Value-Driven Key Results</h4>
                <p className="text-slate-600 text-sm">
                  Key results should reflect our values: be passionate about quality, innovative in approach, 
                  collaborative in execution, and accountable in measurement.
                </p>
              </div>
            </div>
            
            <div className="flex">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                <span className="font-medium text-primary">3</span>
              </div>
              <div>
                <h4 className="font-medium text-slate-800">Aspirational Objectives</h4>
                <p className="text-slate-600 text-sm">
                  Our objectives should be ambitious and forward-looking, aligned with our vision of being 
                  a catalyst for organizational clarity and purpose.
                </p>
              </div>
            </div>
            
            <div className="flex">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                <span className="font-medium text-primary">4</span>
              </div>
              <div>
                <h4 className="font-medium text-slate-800">Meaningful Measurement</h4>
                <p className="text-slate-600 text-sm">
                  We measure what matters - not just what's easy to track. Our key results reflect real impact 
                  aligned with our mission of empowering organizations.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-8 text-center border border-border/50">
        <h3 className="text-xl font-bold mb-4 text-gray-900">Ready to align your objectives with our mission?</h3>
        <p className="text-gray-600 mb-0">
          Keep our mission and values in mind as you develop your OKRs to ensure we're all working toward the same vision.
        </p>
      </div>
    </DashboardLayout>
  );
}