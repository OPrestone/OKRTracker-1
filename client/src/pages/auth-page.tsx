import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, HelpCircle, ChevronRight, CheckCircle, LockKeyhole, Layout, Target, BarChart4, Users, ArrowRight } from "lucide-react";
import { HelpTooltip } from "@/components/help/tooltip";
import { authenticationHelp } from "@/components/help/help-content";
// Using a placeholder gradient color instead of an image

// Login form schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Registration form schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email"),
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { loginMutation, registerMutation } = useAuth();

  // Login form
  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  // Login submission
  function onLoginSubmit(data: LoginValues) {
    loginMutation.mutate(data);
  }

  // Registration submission
  function onRegisterSubmit(data: RegisterValues) {
    registerMutation.mutate({
      ...data,
      language: "en",
      role: "user",
    });
  }

  const features = [
    {
      icon: Target,
      title: "Set & track OKRs",
      description: "Define clear objectives and key results at every level"
    },
    {
      icon: Users,
      title: "Team alignment",
      description: "Keep everyone aligned around top company priorities"
    },
    {
      icon: BarChart4,
      title: "Visual progress",
      description: "Track performance with intuitive visual dashboards"
    },
    {
      icon: Layout,
      title: "Central dashboard",
      description: "One place to see the status of all your key initiatives"
    }
  ];

  return (
    <div className="flex min-h-screen">
      {/* Left side - Auth forms */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 xl:px-20 py-12 w-full lg:w-1/2 relative">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center">
              <BarChart3 className="h-10 w-10 text-primary" />
            </div>
            <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
              Dashkit OKR
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Align your teams, measure what matters, and achieve remarkable results
            </p>
          </div>

          <Card className="border-none shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex justify-between items-center">
                <span>Welcome back</span>
                <HelpTooltip
                  id={authenticationHelp.id}
                  title={authenticationHelp.title}
                  description={authenticationHelp.description}
                  showFor={3}
                />
              </CardTitle>
              <CardDescription>
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-6">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="register">Create Account</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your username" className="h-11" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex justify-between items-center">
                              <FormLabel>Password</FormLabel>
                              <a href="#" className="text-xs text-primary hover:text-primary/80">
                                Forgot password?
                              </a>
                            </div>
                            <FormControl>
                              <Input type="password" placeholder="Enter your password" className="h-11" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full h-11 mt-2" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
                
                <TabsContent value="register">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={registerForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input placeholder="First name" className="h-11" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Last name" className="h-11" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Your email" className="h-11" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Choose a username" className="h-11" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Create a password"
                                className="h-11"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full h-11 mt-2" 
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? "Creating account..." : "Create Account"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-500">
              Default Admin Login: <span className="font-medium">admin / admin123</span>
            </p>
          </div>
        </div>
      </div>
      
      {/* Right side - Cover design */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-800">
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLW9wYWNpdHk9IjAuMiI+PHBhdGggZD0iTTAgMCBMNjAgNjBNNjAgMCBMMCANjBNMzAgMCBMMzAgNjBNMCAzMCBMNjAgMzAiLz48L2c+PC9zdmc+')]"></div>
        
        <div className="relative z-10 flex flex-col justify-center h-full px-12 py-16">
          <div className="max-w-xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tight text-white mb-6">
              Achieve remarkable results with OKR methodology
            </h1>
            <p className="text-lg text-white/90 mb-12">
              Align your team, focus on what matters, and drive measurable outcomes.
              Our powerful OKR platform helps you set, track, and achieve your most ambitious goals.
            </p>
            
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="bg-white/10 p-2 rounded-lg">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-white/70">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-14">
              <div className="flex items-center space-x-4">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center text-white text-xs">JD</div>
                  <div className="w-8 h-8 rounded-full bg-sky-600 border-2 border-white flex items-center justify-center text-white text-xs">MR</div>
                  <div className="w-8 h-8 rounded-full bg-pink-600 border-2 border-white flex items-center justify-center text-white text-xs">SL</div>
                </div>
                <div className="text-sm text-white">
                  Join thousands of teams already using Dashkit OKR
                </div>
              </div>
            </div>
          </div>
          
          {/* Visual elements for OKR visualization */}
          <div className="absolute top-1/4 right-12 w-20 h-20 bg-white/10 rounded-full"></div>
          <div className="absolute bottom-1/3 right-1/4 w-32 h-32 bg-white/5 rounded-full"></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white/5 rounded-full"></div>
          
          {/* Bar chart visualization */}
          <div className="absolute bottom-20 left-20 flex items-end space-x-2">
            <div className="w-6 h-16 bg-white/20 rounded-t-md"></div>
            <div className="w-6 h-24 bg-white/30 rounded-t-md"></div>
            <div className="w-6 h-12 bg-white/20 rounded-t-md"></div>
            <div className="w-6 h-32 bg-white/40 rounded-t-md"></div>
            <div className="w-6 h-20 bg-white/25 rounded-t-md"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
