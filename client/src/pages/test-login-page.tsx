import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function TestLoginPage() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const { toast } = useToast();

  // Test the regular login
  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/login", { username, password });
      const userData = await response.json();
      
      toast({
        title: "Login Successful",
        description: `Logged in as ${userData.username || userData.id}`,
      });
      
      setSessionInfo({
        type: "Regular Login",
        user: userData,
        timestamp: new Date().toISOString()
      });
      
      // Fetch session info
      checkSession();
    } catch (error: any) {
      console.error("Login failed:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Test the test login endpoint
  const handleTestLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/test-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "test", password: "test123" }),
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error(`Test login failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      toast({
        title: "Test Login Successful",
        description: `Test login completed with session ID: ${data.sessionId}`,
      });
      
      setSessionInfo({
        type: "Test Login",
        data,
        timestamp: new Date().toISOString()
      });
      
      // Check if test auth session works
      checkTestAuth();
    } catch (error: any) {
      console.error("Test login failed:", error);
      toast({
        title: "Test Login Failed",
        description: error.message || "Test authentication failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Check session status
  const checkSession = async () => {
    try {
      const response = await fetch("/api/test-session", {
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error(`Session check failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setSessionInfo(prev => ({
        ...prev,
        session: data,
        timestamp: new Date().toISOString()
      }));
      
      toast({
        title: "Session Check",
        description: `Session ID: ${data.sessionId}, Counter: ${data.counter}`,
      });
    } catch (error: any) {
      console.error("Session check failed:", error);
      toast({
        title: "Session Check Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  // Check if test auth session persists
  const checkTestAuth = async () => {
    try {
      const response = await fetch("/api/test-auth-check", {
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error(`Test auth check failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setSessionInfo(prev => ({
        ...prev,
        testAuth: data,
        timestamp: new Date().toISOString()
      }));
      
      toast({
        title: "Test Auth Check",
        description: `Authenticated: ${data.authenticated}, User: ${data.user?.username}`,
      });
    } catch (error: any) {
      console.error("Test auth check failed:", error);
      toast({
        title: "Test Auth Check Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  // Check user status directly
  const checkUser = async () => {
    try {
      const response = await fetch("/api/user", {
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error(`User check failed: ${response.status} ${response.statusText}`);
      }
      
      const userData = await response.json();
      
      setSessionInfo(prev => ({
        ...prev,
        userCheck: userData,
        timestamp: new Date().toISOString()
      }));
      
      toast({
        title: "User Check Successful",
        description: `User ID: ${userData.id}`,
      });
    } catch (error: any) {
      console.error("User check failed:", error);
      toast({
        title: "User Check Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Authentication Test</CardTitle>
          <CardDescription>Test the authentication system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
          </div>
          
          <div className="pt-4 flex space-x-2">
            <Button 
              onClick={handleLogin} 
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Logging in..." : "Regular Login"}
            </Button>
            
            <Button 
              onClick={handleTestLogin} 
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              Test Login
            </Button>
          </div>
          
          <div className="flex space-x-2 pt-2">
            <Button 
              onClick={checkSession}
              variant="secondary"
              className="flex-1"
            >
              Check Session
            </Button>
            
            <Button 
              onClick={checkUser}
              variant="secondary"
              className="flex-1"
            >
              Check User
            </Button>
          </div>
        </CardContent>
        
        {sessionInfo && (
          <CardFooter className="flex flex-col items-start">
            <div className="w-full">
              <h3 className="text-sm font-semibold">Session Information:</h3>
              <pre className="text-xs mt-2 p-2 bg-slate-100 rounded overflow-auto max-h-40 w-full">
                {JSON.stringify(sessionInfo, null, 2)}
              </pre>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}