import { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsCard, MiniStatsCard } from "@/components/dashboard/stats-card";
import { MiniChart, MiniSparkline, GaugeChart } from "@/components/dashboard/mini-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Target, Users, CheckCircle, AlertCircle, FileBarChart, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";

interface DashboardLayoutProps {
  children?: ReactNode;
  overviewStats?: {
    totalObjectives: number;
    completedObjectives: number;
    atRiskObjectives: number;
    teamProgress: number;
    upcomingCheckins: number;
  };
}

const dummyChartData = [
  { name: 'Jan', value: 12 },
  { name: 'Feb', value: 19 },
  { name: 'Mar', value: 15 },
  { name: 'Apr', value: 27 },
  { name: 'May', value: 22 },
  { name: 'Jun', value: 30 },
  { name: 'Jul', value: 25 },
];

export function DashboardLayout({ children, overviewStats }: DashboardLayoutProps) {
  const stats = overviewStats || {
    totalObjectives: 35,
    completedObjectives: 21,
    atRiskObjectives: 4,
    teamProgress: 78,
    upcomingCheckins: 8
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="relative w-64">
          <Input
            placeholder="Search..."
            className="pr-8 h-9 border-slate-200"
          />
          <div className="absolute right-2.5 top-2.5 text-slate-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
          </div>
        </div>
      </div>
 
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatsCard
              title="Total Objectives"
              value={stats.totalObjectives}
              trend={3.5}
              icon={<Target className="h-5 w-5 text-indigo-500" />}
              chart={
                <MiniSparkline 
                  data={dummyChartData}
                  dataKey="value"
                  color="#6366f1"
                  height={40}
                />
              }
            />
            
            <StatsCard
              title="Team Progress"
              value={`${stats.teamProgress}%`}
              subtitle="of 50 GB"
              progressBar
              progressValue={stats.teamProgress}
              trendLabel={`${stats.teamProgress}% complete`}
              icon={<FileBarChart className="h-5 w-5 text-indigo-500" />}
            />
            
            <StatsCard
              title="Completed Objectives"
              value={stats.completedObjectives}
              trend={6.8}
              icon={<CheckCircle className="h-5 w-5 text-emerald-500" />}
              chart={
                <MiniSparkline 
                  data={dummyChartData}
                  dataKey="value"
                  color="#10b981"
                  height={40}
                />
              }
            />
            
            <StatsCard
              title="At Risk Objectives"
              value={stats.atRiskObjectives}
              trend={-2.3}
              icon={<AlertCircle className="h-5 w-5 text-rose-500" />}
              chart={
                <MiniSparkline 
                  data={dummyChartData.slice().reverse()}
                  dataKey="value"
                  color="#ef4444"
                  height={40}
                />
              }
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Objectives Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <MiniChart
                    data={dummyChartData}
                    dataKey="value"
                    type="bar"
                    color="#6366f1"
                    height={320}
                    showGrid
                    showAxis
                  />
                </div>
              </CardContent>
            </Card>
            
            <div className="space-y-5">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Upcoming Check-ins</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-indigo-100 p-2 rounded-md">
                        <Calendar className="h-5 w-5 text-indigo-500" />
                      </div>
                      <div>
                        <h3 className="font-medium">{stats.upcomingCheckins} Check-ins</h3>
                        <p className="text-sm text-slate-500">Next: Tomorrow, 10:00 AM</p>
                      </div>
                    </div>
                    <div className="bg-slate-100 px-2 py-1 rounded text-xs text-slate-600">
                      This Week
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Team Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <GaugeChart value={78} color="#6366f1" />
                  <div className="flex justify-between mt-2 text-sm">
                    <div className="text-slate-500">Last month: 65%</div>
                    <div className="font-medium text-emerald-600">+13%</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            <MiniStatsCard
              title="Marketing Team"
              value="92%"
              trend={2.5}
              icon={<Users className="h-4 w-4 text-indigo-500" />}
            />
            <MiniStatsCard
              title="Engineering Team"
              value="87%"
              trend={1.8}
              icon={<Users className="h-4 w-4 text-indigo-500" />}
            />
            <MiniStatsCard
              title="Product Team"
              value="79%"
              trend={5.2}
              icon={<Users className="h-4 w-4 text-indigo-500" />}
            />
            <MiniStatsCard
              title="Design Team"
              value="81%"
              trend={-1.4}
              icon={<Users className="h-4 w-4 text-indigo-500" />}
            />
            <MiniStatsCard
              title="Sales Team"
              value="94%"
              trend={3.7}
              icon={<Users className="h-4 w-4 text-indigo-500" />}
            />
          </div> 
      
      {children}
    </div>
  );
}