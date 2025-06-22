"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createUser } from "@/lib/queries/users";
// import { createUser } from "@/lib/queries/users";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import {
	Loader2,
	LockKeyhole,
	LogIn,
	Mail,
	User,
	UserPlus,
	Users,
} from "lucide-react";
import { signIn } from "next-auth/react"; // Adjust the import path as needed
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import useSWRMutation from "swr/mutation";
import z from "zod";

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

const Access = () => {
	const [activeTab, setActiveTab] = useState("login");
	const router = useRouter();

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

	const {
		data: loginData,
		trigger: loginTrigger,
		isMutating: isLoginMutating,
	} = useSWRMutation(
		"login",
		async (_, { arg }: { arg: LoginValues }) =>
			signIn("credentials", {
				...arg,
				redirect: false, // Prevent automatic redirect
				callbackUrl: "/dashboard", // Redirect to dashboard on success
			})
		// console.log("Login triggered with data:", arg)
	);

	const onLoginSubmit = async (data: z.infer<typeof loginSchema>) => {
		try {
			// setError(null);
			const user = await loginTrigger(data);
			if (!user) throw new Error("No user data returned from login");
			if (user.error) {
				toast.error("Login failed: " + user.error);
				return;
			}
			console.log("Login successful:", user);
			toast.success("Login successful! Redirecting...");
			router.refresh(); // Refresh the page to update the session
			window.location.reload(); // Reload the page to ensure session is updated
		} catch (e: any) {
			loginForm.setError("root.serverError", { type: "400", message: e.message });
			// setError(e.message);
			toast.error("Login failed: " + e.message);
			console.error("Login failed:", e);
		}
	};

	const {
		data: registerData,
		trigger: registerTrigger,
		isMutating: isRegisterMutating,
	} = useSWRMutation("register", async (_, { arg }: { arg: any }) =>
		createUser(arg)
	);

	const onRegisterSubmit = async (data: z.infer<typeof registerSchema>) => {
		try {
			// setError(null);
			router.push("/");
			const user = await registerTrigger(data);
			if ("error" in user) {
				toast.error("Registration failed: " + user.error);
				return;
			}
			toast.success("Registration successful! You can now log in.");
			window.location.reload();
		} catch (e: any) {
			loginForm.setError("root.serverError", { type: "400", message: e.message });
			// setError(e.message);
			toast.error("registration failed:", e.message);
		}
	};
	return (
		<Card className="border-none shadow-xl rounded-xl overflow-hidden bg-background">
			<CardHeader className="pb-4 border-b bg-muted/30">
				<CardTitle className="text-xl flex justify-between items-center">
					<div className="flex items-center gap-2">
						<div className="w-1 h-6 bg-primary rounded-full"></div>
						<span>Welcome to Pinnacle OKR</span>
					</div>
					{/* <HelpTooltip
                  id={authenticationHelp.id}
                  title={authenticationHelp.title}
                  description={authenticationHelp.description}
                  showFor={3}
                /> */}
				</CardTitle>
				<CardDescription>
					Sign in to your account to track and achieve your goals
				</CardDescription>
			</CardHeader>
			<CardContent className="p-0">
				<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
					<TabsList className="grid w-full grid-cols-2 p-0 h-14 bg-muted/30 rounded-none">
						<TabsTrigger
							value="login"
							className="rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-background"
						>
							<Users className="h-4 w-4 mr-2" />
							Sign In
						</TabsTrigger>
						<TabsTrigger
							value="register"
							className="rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-background"
						>
							<UserPlus className="h-4 w-4 mr-2" />
							Create Account
						</TabsTrigger>
					</TabsList>

					<div className="p-6">
						<TabsContent value="login" className="m-0 pt-2">
							<Form {...loginForm}>
								<form
									onSubmit={loginForm.handleSubmit(onLoginSubmit)}
									className="space-y-5"
								>
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
											disabled={isLoginMutating}
										>
											{isLoginMutating ? (
												<>
													<Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing in...
												</>
											) : (
												<>
													<LogIn className="h-4 w-4 mr-2" /> Sign In
												</>
											)}
										</Button>
									</div>

									<div className="text-center pt-4">
										<p className="text-sm text-muted-foreground">
											Need an account?{" "}
											<Button
												variant="link"
												className="p-0 h-auto text-primary font-medium"
												onClick={() => setActiveTab("register")}
												type="button"
											>
												Create one now
											</Button>
										</p>
									</div>
								</form>
							</Form>
						</TabsContent>

						<TabsContent value="register" className="m-0 pt-2">
							<Form {...registerForm}>
								<form
									onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
									className="space-y-5"
								>
									<div className="grid grid-cols-2 gap-4">
										<FormField
											control={registerForm.control}
											name="firstName"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-sm text-muted-foreground">
														<User className="h-3.5 w-3.5 inline-block mr-1.5 opacity-70" />
														First Name
													</FormLabel>
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
													<FormLabel className="text-sm text-muted-foreground">
														<User className="h-3.5 w-3.5 inline-block mr-1.5 opacity-70" />
														Last Name
													</FormLabel>
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
											disabled={isRegisterMutating}
										>
											{isRegisterMutating ? (
												<>
													<Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating
													account...
												</>
											) : (
												<>
													<UserPlus className="h-4 w-4 mr-2" /> Create Account
												</>
											)}
										</Button>
									</div>

									<div className="text-center pt-4">
										<p className="text-sm text-muted-foreground">
											Already have an account?{" "}
											<Button
												variant="link"
												className="p-0 h-auto text-primary font-medium"
												onClick={() => setActiveTab("login")}
												type="button"
											>
												Sign in
											</Button>
										</p>
									</div>
								</form>
							</Form>
						</TabsContent>
					</div>
				</Tabs>
			</CardContent>
		</Card>
	);
};

export default Access;
