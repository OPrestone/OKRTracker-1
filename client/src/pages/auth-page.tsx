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
import { 
  BarChart3, 
  HelpCircle, 
  ChevronRight, 
  CheckCircle, 
  LockKeyhole, 
  Layout, 
  Target, 
  BarChart4, 
  Users, 
  ArrowRight, 
  User, 
  Mail, 
  LogIn, 
  Loader2,
  UserPlus
} from "lucide-react";
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
              Pinnacle OKR
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Align your teams, measure what matters, and achieve remarkable results
            </p>
          </div>

          <Card className="border-none shadow-xl rounded-xl overflow-hidden">
            <CardHeader className="pb-4 border-b bg-muted/30">
              <CardTitle className="text-xl flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-primary rounded-full"></div>
                  <span>Welcome to Dashkit OKR</span>
                </div>
                <HelpTooltip
                  id={authenticationHelp.id}
                  title={authenticationHelp.title}
                  description={authenticationHelp.description}
                  showFor={3}
                />
              </CardTitle>
              <CardDescription>
                Sign in to your account to track and achieve your goals
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 p-0 h-14 bg-muted/30 rounded-none">
                  <TabsTrigger value="login" className="rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-background">
                    <Users className="h-4 w-4 mr-2" />
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="register" className="rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-background">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Account
                  </TabsTrigger>
                </TabsList>
                
                <div className="p-6">
                  <TabsContent value="login" className="m-0 pt-2">
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm text-muted-foreground">
                                <User className="h-3.5 w-3.5 inline-block mr-1.5 opacity-70" />
                                Username
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    placeholder="Enter your username" 
                                    className="h-12 pl-10 border-muted-foreground/20 bg-muted/20 focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
                                    {...field} 
                                  />
                                  <User className="h-4 w-4 absolute left-3 top-4 text-muted-foreground/50" />
                                </div>
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
                                <FormLabel className="text-sm text-muted-foreground">
                                  <LockKeyhole className="h-3.5 w-3.5 inline-block mr-1.5 opacity-70" />
                                  Password
                                </FormLabel>
                                <a href="#" className="text-xs text-primary hover:underline">
                                  Forgot password?
                                </a>
                              </div>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    type="password" 
                                    placeholder="Enter your password" 
                                    className="h-12 pl-10 border-muted-foreground/20 bg-muted/20 focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
                                    {...field} 
                                  />
                                  <LockKeyhole className="h-4 w-4 absolute left-3 top-4 text-muted-foreground/50" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="pt-2">
                          <Button 
                            type="submit" 
                            className="w-full h-12 shadow-md text-base font-medium transition-all hover:scale-[1.01]" 
                            disabled={loginMutation.isPending}
                          >
                            {loginMutation.isPending ? (
                              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing in...</>
                            ) : (
                              <><LogIn className="h-4 w-4 mr-2" /> Sign In</>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </TabsContent>
                  
                  <TabsContent value="register" className="m-0 pt-2">
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm text-muted-foreground">First Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="First name" 
                                    className="h-12 border-muted-foreground/20 bg-muted/20 focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
                                    {...field} 
                                  />
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
                                <FormLabel className="text-sm text-muted-foreground">Last Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Last name" 
                                    className="h-12 border-muted-foreground/20 bg-muted/20 focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
                                    {...field} 
                                  />
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
                              <FormLabel className="text-sm text-muted-foreground">
                                <Mail className="h-3.5 w-3.5 inline-block mr-1.5 opacity-70" />
                                Email
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    type="email" 
                                    placeholder="Your email address" 
                                    className="h-12 pl-10 border-muted-foreground/20 bg-muted/20 focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
                                    {...field} 
                                  />
                                  <Mail className="h-4 w-4 absolute left-3 top-4 text-muted-foreground/50" />
                                </div>
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
                              <FormLabel className="text-sm text-muted-foreground">
                                <User className="h-3.5 w-3.5 inline-block mr-1.5 opacity-70" />
                                Username
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    placeholder="Choose a username" 
                                    className="h-12 pl-10 border-muted-foreground/20 bg-muted/20 focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
                                    {...field} 
                                  />
                                  <User className="h-4 w-4 absolute left-3 top-4 text-muted-foreground/50" />
                                </div>
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
                              <FormLabel className="text-sm text-muted-foreground">
                                <LockKeyhole className="h-3.5 w-3.5 inline-block mr-1.5 opacity-70" />
                                Password
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type="password"
                                    placeholder="Create a secure password"
                                    className="h-12 pl-10 border-muted-foreground/20 bg-muted/20 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                    {...field}
                                  />
                                  <LockKeyhole className="h-4 w-4 absolute left-3 top-4 text-muted-foreground/50" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="pt-2">
                          <Button 
                            type="submit" 
                            className="w-full h-12 shadow-md text-base font-medium transition-all hover:scale-[1.01]" 
                            disabled={registerMutation.isPending}
                          >
                            {registerMutation.isPending ? (
                              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating account...</>
                            ) : (
                              <><UserPlus className="h-4 w-4 mr-2" /> Create Account</>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </TabsContent>
                </div>
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
                  Join thousands of teams already using Pinnacle OKR
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
