import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function TestLoginPage() {
  const { toast } = useToast();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [tenantsInfo, setTenantsInfo] = useState<any>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user) => {
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name || user.username}!`,
      });
      
      // Update user data in the query cache
      queryClient.setQueryData(["/api/user"], user);
      
      // Fetch session info after successful login
      checkSession();
      getUserInfo();
      getTenantsInfo();
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      
      // Clear user data
      queryClient.setQueryData(["/api/user"], null);
      setUserInfo(null);
      setTenantsInfo(null);
      setSessionInfo(null);
      
      // Check session after logout
      checkSession();
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Check session
  const checkSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/test-session', { 
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error(`Session check failed: ${res.status}`);
      }
      
      return await res.json();
    },
    onSuccess: (data) => {
      setSessionStatus(data);
    },
    onError: (error: Error) => {
      setSessionStatus({ error: error.message });
      toast({
        title: "Session check failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Get user info
  const userInfoMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/user', { 
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error(`User info failed: ${res.status}`);
      }
      
      return await res.json();
    },
    onSuccess: (data) => {
      setUserInfo(data);
    },
    onError: (error: Error) => {
      setUserInfo({ error: error.message });
    },
  });
  
  // Get tenants info
  const tenantsInfoMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/tenants', { 
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error(`Tenants info failed: ${res.status}`);
      }
      
      return await res.json();
    },
    onSuccess: (data) => {
      setTenantsInfo(data);
    },
    onError: (error: Error) => {
      setTenantsInfo({ error: error.message });
    },
  });
  
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
  
  const handleLoginClick = () => {
    loginMutation.mutate({ username, password });
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const checkSession = () => {
    checkSessionMutation.mutate();
  };
  
  const getUserInfo = () => {
    userInfoMutation.mutate();
  };
  
  const getTenantsInfo = () => {
    tenantsInfoMutation.mutate();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Authentication Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Login Test</CardTitle>
            <CardDescription>Test authentication functionality</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                placeholder="Enter username" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="Enter password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between flex-wrap gap-2">
            <Button onClick={handleLoginClick} disabled={loginMutation.isPending || loading}>
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </Button>
            <Button variant="outline" onClick={handleLogout} disabled={logoutMutation.isPending || loading}>
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </Button>
            <Button variant="secondary" onClick={handleTestLogin} disabled={loading}>
              Test Login
            </Button>
          </CardFooter>
        </Card>
        
        {/* Session Information */}
        <Card>
          <CardHeader>
            <CardTitle>Session Status</CardTitle>
            <CardDescription>Current session information</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-40">
              {sessionStatus ? JSON.stringify(sessionStatus, null, 2) : "No session information"}
            </pre>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button onClick={checkSession} disabled={checkSessionMutation.isPending}>
              {checkSessionMutation.isPending ? "Checking..." : "Check Session"}
            </Button>
            <Button onClick={checkUser} variant="secondary">
              Check User
            </Button>
          </CardFooter>
        </Card>
        
        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>Current user data</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-40">
              {userInfo ? JSON.stringify(userInfo, null, 2) : "No user information"}
            </pre>
          </CardContent>
          <CardFooter>
            <Button onClick={getUserInfo} disabled={userInfoMutation.isPending}>
              {userInfoMutation.isPending ? "Loading..." : "Get User Info"}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Tenants Information */}
        <Card>
          <CardHeader>
            <CardTitle>Tenants Information</CardTitle>
            <CardDescription>User's organizations</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-40">
              {tenantsInfo ? JSON.stringify(tenantsInfo, null, 2) : "No tenants information"}
            </pre>
          </CardContent>
          <CardFooter>
            <Button onClick={getTenantsInfo} disabled={tenantsInfoMutation.isPending}>
              {tenantsInfoMutation.isPending ? "Loading..." : "Get Tenants Info"}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Test Auth Information */}
        {sessionInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Test Auth Info</CardTitle>
              <CardDescription>Test auth session data</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-40">
                {JSON.stringify(sessionInfo, null, 2)}
              </pre>
            </CardContent>
            <CardFooter>
              <Button onClick={checkTestAuth} variant="secondary">
                Check Test Auth
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}