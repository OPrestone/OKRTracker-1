import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/layouts/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import TeamMoodVisualization from "@/components/wellness/team-mood-visualization";
import MoodEntryForm from "@/components/wellness/mood-entry-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, RefreshCw } from "lucide-react";
import { Team } from "@/types";

const WellnessPulse = () => {
  const { user } = useAuth();
  const [showMoodForm, setShowMoodForm] = useState(false);
  const [activeTab, setActiveTab] = useState("team");
  
  // Fetch user's team info
  const { data: teams } = useQuery({
    queryKey: ["/api/teams"],
    queryFn: async () => {
      const res = await fetch("/api/teams");
      if (!res.ok) throw new Error("Failed to fetch teams");
      return res.json() as Promise<Team[]>;
    }
  });
  
  // Get user's team
  const userTeam = teams?.find(team => team.id === user?.teamId);
  
  // Handle form submission success
  const handleMoodSubmitted = () => {
    setShowMoodForm(false);
    // Wait a moment before refreshing data to ensure backend has processed the entry
    setTimeout(() => {
      // This will trigger a refetch of the mood data queries
      window.location.reload();
    }, 500);
  };
  
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Wellness Pulse</h1>
            <p className="text-muted-foreground">
              Track team mood and wellbeing over time
            </p>
          </div>
          
          <Button 
            onClick={() => setShowMoodForm(prev => !prev)} 
            className="flex items-center gap-2"
          >
            {showMoodForm ? <RefreshCw className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showMoodForm ? "Cancel" : "New Mood Entry"}
          </Button>
        </div>
        
        {/* Mood Entry Form */}
        {showMoodForm && (
          <div className="my-6">
            <MoodEntryForm onSubmitSuccess={handleMoodSubmitted} />
          </div>
        )}
        
        {/* Tabs for Team and Individual Views */}
        <Tabs defaultValue="team" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="team">Team Mood</TabsTrigger>
            <TabsTrigger value="personal">My Mood</TabsTrigger>
          </TabsList>
          
          <TabsContent value="team" className="space-y-6 mt-6">
            {/* Team Information Card */}
            {userTeam && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium">
                    {userTeam.name} Wellness Insights
                  </CardTitle>
                  <CardDescription>
                    Mood tracking and wellness metrics for your team
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
            
            {/* Team Mood Visualization */}
            <TeamMoodVisualization teamId={user?.teamId || undefined} showIndividualMoods={true} />
          </TabsContent>
          
          <TabsContent value="personal" className="space-y-6 mt-6">
            {/* Personal Mood History */}
            <Card>
              <CardHeader>
                <CardTitle>My Mood History</CardTitle>
                <CardDescription>Track your mood and wellness over time</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Personal mood visualization (simplified version of team visualization) */}
                {user && (
                  <div className="h-[300px]">
                    <TeamMoodVisualization 
                      showIndividualMoods={false} 
                      days={30}
                      height={300}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Recent Team Mood Entries (shown on team tab) */}
        {activeTab === "team" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>Recent Team Mood Check-ins</span>
              </CardTitle>
              <CardDescription>
                Latest mood submissions from team members
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Would fetch and display recent team mood entries here */}
              <p className="text-sm text-muted-foreground">
                Team members can submit daily mood check-ins to track overall team wellness.
                Start by adding your mood entry for today.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default WellnessPulse;