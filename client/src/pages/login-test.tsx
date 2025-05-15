import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginTest() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [sessionInfo, setSessionInfo] = useState<{
    sessionId: string;
    counter: number;
    timestamp: string;
  } | null>(null);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (values: z.infer<typeof loginSchema>) => {
      const response = await apiRequest("POST", "/api/login", values);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Login Successful",
        description: "You have successfully logged in",
      });
      
      // Redirect to dashboard or home page
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(values);
  };

  // Check session info
  const checkSession = async () => {
    try {
      const response = await fetch('/api/test-session', {
        credentials: 'include' // Important for cookies/session
      });
      const data = await response.json();
      setSessionInfo(data);
      
      toast({
        title: "Session Checked",
        description: `Session ID: ${data.sessionId.substring(0, 8)}...`,
      });
    } catch (error) {
      toast({
        title: "Session Check Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <Card className="w-[450px] shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Login Test Page</CardTitle>
          <CardDescription className="text-center">
            This is a diagnostic login page for debugging
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Logging in..." : "Login"}
              </Button>
            </form>
          </Form>
          
          <div className="mt-6">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={checkSession}
            >
              Check Session
            </Button>
          </div>
          
          {sessionInfo && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm">
              <div><strong>Session ID:</strong> {sessionInfo.sessionId}</div>
              <div><strong>Counter:</strong> {sessionInfo.counter}</div>
              <div><strong>Timestamp:</strong> {sessionInfo.timestamp}</div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="ghost" asChild>
            <Link href="/auth">Regular Login</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/project-diagnostics">Project Diagnostics</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}