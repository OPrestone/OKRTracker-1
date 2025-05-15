import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";

export default function LoginTest() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (data) => {
      console.log("Login successful:", data);
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.username || "user"}!`,
      });
      
      // Clear any existing queries to ensure fresh data after login
      queryClient.invalidateQueries();
      
      // Redirect to dashboard
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ username, password });
  };

  // Test auth check
  const checkAuth = async () => {
    try {
      const res = await fetch('/api/test-session', {
        credentials: 'include'
      });
      const data = await res.json();
      console.log('Session data:', data);
      toast({
        title: "Session Check",
        description: `Session ID: ${data.sessionId}, Counter: ${data.counter}`,
      });
    } catch (error) {
      console.error('Session check error:', error);
      toast({
        title: "Session Check Failed",
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  // Test login
  const testLogin = async () => {
    try {
      const res = await fetch('/api/test-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: 'test', password: 'test123' }),
        credentials: 'include'
      });
      const data = await res.json();
      console.log('Test login result:', data);
      
      if (data.success) {
        toast({
          title: "Test Login Successful",
          description: `Session ID: ${data.sessionId}`,
        });
      } else {
        toast({
          title: "Test Login Failed",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Test login error:', error);
      toast({
        title: "Test Login Failed",
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  // Check test auth
  const checkTestAuth = async () => {
    try {
      const res = await fetch('/api/test-auth-check', {
        credentials: 'include'
      });
      const data = await res.json();
      console.log('Test auth check result:', data);
      
      toast({
        title: data.authenticated ? "Test Authenticated" : "Not Authenticated",
        description: data.authenticated ? `User: ${data.user.username}` : data.message,
        variant: data.authenticated ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Test auth check error:', error);
      toast({
        title: "Test Auth Check Failed",
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </Button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium mb-4">Session Testing Tools</h3>
            <div className="flex flex-col space-y-2">
              <Button 
                variant="outline" 
                onClick={checkAuth}
                className="w-full"
              >
                Check Session
              </Button>
              
              <Button 
                variant="outline" 
                onClick={testLogin}
                className="w-full"
              >
                Test Login (test/test123)
              </Button>
              
              <Button 
                variant="outline" 
                onClick={checkTestAuth}
                className="w-full"
              >
                Check Test Auth
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}