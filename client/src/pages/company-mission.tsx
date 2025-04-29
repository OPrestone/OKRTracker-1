import React from "react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Building,
  FileText,
  Star,
  Flag,
  AlignLeft,
  Users,
  GitBranch,
  Download,
  Edit,
  Share2,
  Info
} from "lucide-react";

export default function CompanyMission() {
  return (
    <DashboardLayout title="Company Mission and Strategy">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Company Mission</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-9">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" size="sm" className="h-9">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button size="sm" className="h-9">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <FileText className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="alignment" className="gap-2">
            <GitBranch className="h-4 w-4" />
            <span>Team Alignment</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <AlignLeft className="h-4 w-4" />
            <span>History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  Company Mission
                </CardTitle>
                <CardDescription>
                  Our core purpose and reason for existing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="text-lg font-medium text-primary">
                    To become the biggest reach, most influential and trusted company in the communications
                    landscape in order to deliver sustainable profits for shareholders and staff - by providing
                    indispensable information and entertainment that enhance the lives of 16-35 year old
                    Kenyans.
                  </p>
                  <div className="flex items-center mt-4 text-sm text-muted-foreground">
                    <Info className="h-4 w-4 mr-1" />
                    Last updated: April 10, 2023
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" />
                  Core Values
                </CardTitle>
                <CardDescription>
                  Principles that guide our decisions and actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Badge className="mt-1">Integrity</Badge>
                    <span className="text-sm">We act with honesty and adhere to the highest ethical standards.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge className="mt-1">Innovation</Badge>
                    <span className="text-sm">We constantly seek new and better ways to serve our audience.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge className="mt-1">Excellence</Badge>
                    <span className="text-sm">We strive for outstanding quality in everything we do.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge className="mt-1">Collaboration</Badge>
                    <span className="text-sm">We work together across teams to achieve common goals.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge className="mt-1">Customer Focus</Badge>
                    <span className="text-sm">We put our audience's needs at the center of our decisions.</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Flag className="h-5 w-5 text-green-500" />
                  Vision
                </CardTitle>
                <CardDescription>
                  Where we aim to be in the future
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  To be the leading media and communications company in East Africa, recognized for creating content that
                  inspires, educates, and entertains our audience while delivering exceptional value for all stakeholders.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Strategic Pillars
                </CardTitle>
                <CardDescription>
                  Key focus areas for our growth
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="text-sm flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <span>Digital Transformation</span>
                  </li>
                  <li className="text-sm flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <span>Content Excellence</span>
                  </li>
                  <li className="text-sm flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <span>Audience Growth</span>
                  </li>
                  <li className="text-sm flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <span>Revenue Diversification</span>
                  </li>
                  <li className="text-sm flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <span>Operational Excellence</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <AlignLeft className="h-5 w-5 text-primary" />
                Strategic Goals (2023-2025)
              </CardTitle>
              <CardDescription>
                Our measurable objectives for the next three years
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">1. Audience Growth</h3>
                  <p className="text-sm text-muted-foreground">
                    Increase our audience reach to 37 million active users across all platforms by the end of 2025,
                    with a focus on digital engagement.
                  </p>
                </div>
                <Separator />
                <div>
                  <h3 className="font-medium mb-2">2. Revenue Growth</h3>
                  <p className="text-sm text-muted-foreground">
                    Achieve annual revenue of 1.5 billion through diversified income streams, including
                    advertising, subscriptions, and new business ventures.
                  </p>
                </div>
                <Separator />
                <div>
                  <h3 className="font-medium mb-2">3. Digital Transformation</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete our digital transformation initiative with 80% of our content delivery and operational
                    processes being digital-first by end of 2024.
                  </p>
                </div>
                <Separator />
                <div>
                  <h3 className="font-medium mb-2">4. Content Innovation</h3>
                  <p className="text-sm text-muted-foreground">
                    Launch at least 15 new innovative content formats that resonate with our target demographic,
                    achieving high engagement metrics across platforms.
                  </p>
                </div>
                <Separator />
                <div>
                  <h3 className="font-medium mb-2">5. Talent Development</h3>
                  <p className="text-sm text-muted-foreground">
                    Implement comprehensive talent development programs to ensure 90% of leadership positions
                    are filled through internal promotions by 2025.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alignment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Mission Alignment</CardTitle>
              <CardDescription>
                How department and team missions align with our company mission
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-muted/40 p-4 rounded-lg border border-border">
                  <h3 className="text-primary font-medium mb-2">Company Mission</h3>
                  <p className="text-sm">
                    To become the biggest reach, most influential and trusted company in the communications
                    landscape in order to deliver sustainable profits for shareholders and staff - by providing
                    indispensable information and entertainment that enhance the lives of 16-35 year old
                    Kenyans.
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-border p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Building className="h-4 w-4 text-primary" />
                        <h3 className="font-medium">Marketing Department</h3>
                      </div>
                      <p className="text-sm">
                        To create compelling marketing strategies that build brand awareness and trust among our target audience, supporting the growth in reach and influence while ensuring customer retention and acquisition.
                      </p>
                    </div>

                    <div className="border border-border p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Building className="h-4 w-4 text-primary" />
                        <h3 className="font-medium">Product Development</h3>
                      </div>
                      <p className="text-sm">
                        To develop innovative digital products that deliver indispensable content and services to our audience, enhancing their daily lives while creating new revenue streams and market opportunities.
                      </p>
                    </div>

                    <div className="border border-border p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Building className="h-4 w-4 text-primary" />
                        <h3 className="font-medium">Content Creation</h3>
                      </div>
                      <p className="text-sm">
                        To produce high-quality, relevant, and engaging content across all platforms that resonates with our 16-35 year old audience, establishing our position as the most trusted source of information and entertainment.
                      </p>
                    </div>

                    <div className="border border-border p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Building className="h-4 w-4 text-primary" />
                        <h3 className="font-medium">Technology & Infrastructure</h3>
                      </div>
                      <p className="text-sm">
                        To provide cutting edge technological and digital solutions that ensures we are able to generate 1.5B in revenue and a cumulative audience of 37M through reliable, scalable, and innovative technology platforms.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Mission Statement History</CardTitle>
              <CardDescription>
                Evolution of our company mission over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="relative border-l border-primary/30 pl-6 pb-6">
                  <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-primary"></div>
                  <time className="mb-1 text-sm font-normal leading-none text-muted-foreground">April 2023 - Present</time>
                  <h3 className="text-lg font-semibold text-primary mt-2">Current Mission</h3>
                  <p className="mb-4 text-base font-normal">
                    To become the biggest reach, most influential and trusted company in the communications landscape in order to deliver sustainable profits for shareholders and staff - by providing indispensable information and entertainment that enhance the lives of 16-35 year old Kenyans.
                  </p>
                </div>

                <div className="relative border-l border-primary/30 pl-6 pb-6">
                  <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-muted"></div>
                  <time className="mb-1 text-sm font-normal leading-none text-muted-foreground">January 2020 - March 2023</time>
                  <h3 className="text-lg font-semibold mt-2">Previous Mission</h3>
                  <p className="mb-4 text-base font-normal text-muted-foreground">
                    To be Kenya's leading media company, providing quality information and entertainment to our audiences while creating value for our shareholders and positive impact for our community.
                  </p>
                </div>

                <div className="relative border-l border-primary/30 pl-6">
                  <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-muted"></div>
                  <time className="mb-1 text-sm font-normal leading-none text-muted-foreground">January 2015 - December 2019</time>
                  <h3 className="text-lg font-semibold mt-2">Original Mission</h3>
                  <p className="mb-4 text-base font-normal text-muted-foreground">
                    To inform, educate, and entertain our audience through innovative media content while maintaining the highest standards of journalism and business ethics.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}