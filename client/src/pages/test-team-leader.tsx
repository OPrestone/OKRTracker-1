import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/layouts/dashboard-layout";
import { apiRequest } from "@/lib/queryClient";

export default function TestTeamLeaderPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    user?: {
      id: string;
      email: string;
      username: string;
    };
    team?: {
      id: string;
      name: string;
    };
    login?: {
      username: string;
      password: string;
    };
  } | null>(null);

  const createTestTeamLeader = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/create-test-team-leader');
      const data = await response.json();
      setResult(data);
      toast({
        title: data.success ? "Success" : "Error",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create test team leader account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Create Test Team Leader Account</CardTitle>
            <CardDescription>
              Generate a team leader account with test data for dashboard testing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button 
              onClick={createTestTeamLeader} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Creating..." : "Create Test Team Leader"}
            </Button>

            {result && (
              <div className="mt-4 p-4 rounded-md border">
                <h3 className="text-lg font-semibold mb-2">
                  {result.success ? "Account Created Successfully" : "Error"}
                </h3>
                <p className="text-sm mb-4">{result.message}</p>
                
                {result.success && result.user && result.login && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium">Login Credentials:</p>
                      <div className="bg-slate-100 p-3 rounded-md mt-1">
                        <p><span className="font-semibold">Username:</span> {result.login.username}</p>
                        <p><span className="font-semibold">Password:</span> {result.login.password}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium">User Details:</p>
                      <div className="bg-slate-100 p-3 rounded-md mt-1">
                        <p><span className="font-semibold">ID:</span> {result.user.id}</p>
                        <p><span className="font-semibold">Email:</span> {result.user.email}</p>
                      </div>
                    </div>
                    
                    {result.team && (
                      <div>
                        <p className="text-sm font-medium">Team Details:</p>
                        <div className="bg-slate-100 p-3 rounded-md mt-1">
                          <p><span className="font-semibold">ID:</span> {result.team.id}</p>
                          <p><span className="font-semibold">Name:</span> {result.team.name}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground">
                        Use these credentials to log in and test the Team Leader Dashboard
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}