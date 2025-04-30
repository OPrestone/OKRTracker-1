import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import DashboardLayout from "@/layouts/dashboard-layout";

export default function Configure() {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <DashboardLayout title="Configure" subtitle="Manage application settings">
      <div className="container mx-auto">
        <Tabs defaultValue="general" className="space-y-4" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full md:w-auto md:flex">
            <TabsTrigger value="general">General Settings</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="teams">Team Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>General Configuration</CardTitle>
                <CardDescription>
                  Configure application-wide settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>General settings content will appear here.</p>
                <Button 
                  onClick={() => toast({
                    title: "Settings saved",
                    description: "Your settings have been updated successfully."
                  })}
                >
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="integrations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Integrations</CardTitle>
                <CardDescription>
                  Connect with external services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Integrations settings content will appear here.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="teams" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Team Configuration</CardTitle>
                <CardDescription>
                  Configure team-specific settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Team settings content will appear here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}