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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [sessionStatus, setSessionStatus] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [tenantsInfo, setTenantsInfo] = useState<any>(null);
  
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
  
  const handleLogin = () => {
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
          <CardFooter className="flex justify-between">
            <Button onClick={handleLogin} disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </Button>
            <Button variant="outline" onClick={handleLogout} disabled={logoutMutation.isPending}>
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
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
          <CardFooter>
            <Button onClick={checkSession} disabled={checkSessionMutation.isPending}>
              {checkSessionMutation.isPending ? "Checking..." : "Check Session"}
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
      </div>
    </div>
  );
}