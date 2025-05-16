import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "Missing credentials",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("Attempting login for user:", username);
      
      const response = await apiRequest("POST", "/api/login", {
        username,
        password
      });
      
      console.log("Login API response status:", response.status);
      
      if (response.ok) {
        console.log("Login successful");
        toast({
          title: "Login successful",
          description: "Redirecting to dashboard...",
        });
        
        // Store the login success in sessionStorage
        sessionStorage.setItem("isLoggedIn", "true");
        
        // Get user information including their tenants
        const userData = await response.json();
        
        if (userData.defaultTenant) {
          // Store the default tenant ID
          localStorage.setItem("defaultTenantId", userData.defaultTenant);
          sessionStorage.setItem("selectedTenantId", userData.defaultTenant);
        } else if (userData.tenants && userData.tenants.length > 0) {
          // If no default tenant, use the first one
          localStorage.setItem("defaultTenantId", userData.tenants[0].id);
          sessionStorage.setItem("selectedTenantId", userData.tenants[0].id);
        }
        
        // Navigate to the dashboard
        setLocation("/");
      } else {
        const errorData = await response.json();
        toast({
          title: "Login failed",
          description: errorData.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login error",
        description: "An error occurred while attempting to log in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the OKR Management Platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Log in"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            The default admin login is typically "admin" with password "admin123"
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}