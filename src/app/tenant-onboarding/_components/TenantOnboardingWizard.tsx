"use client";

import IndustryOptions from "@/data/industry-options.json";
import PriceTiers from "@/data/price-tiers.json";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
	ArrowLeft,
	ArrowRight,
	Building2,
	Check,
	CheckCircle,
	ChevronsUpDown,
	CreditCard,
	Loader2,
	Rocket,
} from "lucide-react";

import { cn } from "@/lib/utils";

import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { createTenant } from "@/lib/queries/tenants";
import { InsertTenant } from "@/util/schema";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import useSWRMutation from "swr/mutation";

// Form validation schema using Zod
const formSchema = z.object({
	setup: z
		.object({
			createInitialOKRs: z.boolean(),
			template: z.string().optional(),
			importedOKRs: z.array(z.record(z.string(), z.any())).optional(),
		})
		.refine(
			(data) => {
				// If createInitialOKRs is true, either a template or importedOKRs must be provided
				if (data.createInitialOKRs) {
					return (
						!!data.template || (data.importedOKRs && data.importedOKRs.length > 0)
					);
				}
				return true;
			},
			{
				message:
					"Please select a template or import OKRs when 'Create initial OKRs' is checked",
				path: ["template"],
			}
		),
	plan: z.object({
		plan: z.enum(["free", "starter", "professional", "enterprise"]),
		agreeToTerms: z.boolean(),
	}),
	orgDetails: z.object({
		name: z.string().min(2, "Name must be at least 2 characters"),
		displayName: z.string().min(2, "Display name must be at least 2 characters"),
		description: z.string().min(10, "Description must be at least 10 characters"),
		industry: z.string().refine((value: string) => value !== "", {
			message: "Please select an industry",
		}),
	}),
});

export default function TenantOnboardingWizard({ userId }: { userId: string }) {
	const [activePage, setActivePage] = useState<string>("organization");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [tenantCreated, setTenantCreated] = useState(false);
	const [animateProgress, setAnimateProgress] = useState(0);

	const router = useRouter();

	// Steps configuration - team step and setup step removed
	const steps = [
		{ id: "organization", label: "Organization", icon: Building2 },
		{ id: "plan", label: "Subscription", icon: CreditCard },
	];

	// Find active step index
	const activeIndex = steps.findIndex((step) => step.id === activePage);

	// Calculate progress percentage
	useEffect(() => {
		const timer = setTimeout(() => {
			setAnimateProgress(((activeIndex + 1) / steps.length) * 100);
		}, 100);
		return () => clearTimeout(timer);
	}, [activeIndex]);

	// Form setup with default values
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			orgDetails: {
				name: "",
				displayName: "",
				description: "",
				industry: "",
			},
			plan: {
				plan: "free",
				agreeToTerms: false,
			},
			setup: {
				createInitialOKRs: false,
				template: "",
				importedOKRs: [],
			},
		},
	});

	// Watch for values changes for conditional rendering
	//   const createInitialOKRs = form.watch("setup.createInitialOKRs");
	//   const selectedTemplate = form.watch("setup.template");
	//   const selectedPlan = form.watch("plan.plan");
	const agreeToTerms = form.watch("plan.agreeToTerms");

	// Mutation for creating a new tenant
	//   const createTenantMutation = useMutation({
	//     mutationFn: async (values: z.infer<typeof formSchema>) => {
	//       console.log("Creating organization with form values:", values);
	//       setIsSubmitting(true);

	//       try {
	//         // Prepare the request data
	//         const requestData = {
	//           name: values.orgDetails.name,
	//           displayName: values.orgDetails.displayName,
	//           description: values.orgDetails.description,
	//           industry: values.orgDetails.industry,
	//           planType: values.plan.plan,
	//           setup: values.setup,
	//           role: "owner" // Set creator's role to owner
	//         };

	//         console.log("Submitting organization data:", requestData);

	//         // Attempt API call first
	//         try {
	//           const response = await fetch('/api/tenants', {
	//             method: 'POST',
	//             headers: { 'Content-Type': 'application/json' },
	//             body: JSON.stringify(requestData),
	//             credentials: 'include'
	//           });

	//           if (response.ok) {
	//             const orgData = await response.json();
	//             console.log("Organization created successfully via API:", orgData);

	//             // Create time cadences for the organization
	//             const tenantId = orgData.tenant.id;

	//             // Create initial OKRs from template if requested
	//             if (values.setup.createInitialOKRs && values.setup.template) {
	//               console.log("Creating initial OKRs from template:", values.setup.template);

	//               const okrResponse = await fetch(`/api/tenants/${tenantId}/okr-templates/${values.setup.template}`, {
	//                 method: 'POST',
	//                 headers: { 'Content-Type': 'application/json' },
	//                 credentials: 'include'
	//               });

	//               if (okrResponse.ok) {
	//                 console.log("Initial OKRs created successfully from template");
	//               } else {
	//                 console.error("Failed to create initial OKRs:", await okrResponse.text());
	//               }
	//             }

	//             // Process imported OKRs if provided
	//             if (values.setup.createInitialOKRs && values.setup.importedOKRs && values.setup.importedOKRs.length > 0) {
	//               console.log("Processing imported OKRs:", values.setup.importedOKRs);

	//               const importResponse = await fetch(`/api/tenants/${tenantId}/import-okrs`, {
	//                 method: 'POST',
	//                 headers: { 'Content-Type': 'application/json' },
	//                 body: JSON.stringify({ okrs: values.setup.importedOKRs }),
	//                 credentials: 'include'
	//               });

	//               if (importResponse.ok) {
	//                 console.log("Imported OKRs processed successfully");
	//               } else {
	//                 console.error("Failed to import OKRs:", await importResponse.text());
	//               }
	//             }

	//             // Success state
	//             setTenantCreated(true);
	//             return orgData;

	//           } else {
	//             const errorText = await response.text();
	//             console.error("API request failed:", errorText);
	//             throw new Error(errorText || "Failed to create organization. Please try again.");
	//           }
	//         } catch (error) {
	//           console.error("Error creating organization:", error);
	//           throw error;
	//         }
	//       } catch (error) {
	//         console.error("Mutation error:", error);
	//         throw error;
	//       } finally {
	//         setIsSubmitting(false);
	//       }
	//     },

	//     // onSuccess: (data) => {
	//     //   // Invalidate cached data
	//     //   queryClient.invalidateQueries({ queryKey: ['/api/tenants'] });
	//     //   queryClient.invalidateQueries({ queryKey: ['/api/user'] });

	//     //   // Show success message
	//     //   toast({
	//     //     title: "Organization created!",
	//     //     description: `${data.tenant.display_name} has been set up successfully.`,
	//     //   });

	//     //   // Add a slight delay to ensure cache is invalidated and UI update is perceived
	//     //   setTimeout(() => {
	//     //     // Redirect to the OKR system setup page
	//     //     navigate(`/${data.tenant.id}/okr-system-setup`);
	//     //     window.location.reload();
	//     //   }, 1000);
	//     // },

	//     // onError: (error: any) => {
	//     //   toast({
	//     //     title: "Failed to create organization",
	//     //     description: error?.message || "An unexpected error occurred. Please try again.",
	//     //     variant: "destructive",
	//     //   });
	//     // }
	//   });

	const { trigger, isMutating } = useSWRMutation(
		"create_tenant",
		async (_, { arg }: { arg: InsertTenant }) => createTenant(arg, userId)
	);

	// Function to check if current step is valid
	const isCurrentStepValid = () => {
		const { errors } = form.formState;

		if (activePage === "organization") {
			return !errors.orgDetails;
		} else if (activePage === "plan") {
			return !errors.plan && agreeToTerms;
		}

		return true;
	};

	// Navigation functions
	//   const goToPreviousStep = () => {
	//     const currentIndex = steps.findIndex(step => step.id === activePage);
	//     if (currentIndex > 0) {
	//       setActivePage(steps[currentIndex - 1].id);
	//     }
	//   };

	const goToStep = (stepId: string) => {
		setActivePage(stepId);
	};

	const handleContinueToPlan = async () => {
		const valid = await form.trigger([
			"orgDetails.name",
			"orgDetails.displayName",
			"orgDetails.description",
			"orgDetails.industry",
		]);
		if (valid) {
			setActivePage("plan");
		} else {
			console.error("Form validation failed, cannot continue to plan step.");
		}
	};

	// Form submission handler
	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		console.log("The onsubmit has been called now");
		const requestData: InsertTenant = {
			name: values.orgDetails.name,
			displayName: values.orgDetails.displayName,
			description: values.orgDetails.description,
			industry: values.orgDetails.industry,
			plan: values.plan.plan,
			slug: values.orgDetails.name.toLowerCase().replace(/\s+/g, "-"),
		};
		console.log("Submitting organization data:", requestData);
		try {
			const response = await trigger(requestData);
			console.log("Response from createTenant:", response);
			toast("Organisation Successfully created", {
				description: `Your organization ${response.tenant.displayName} has been set up successfully.`,
			});
			router.push(`/${response.tenant.id}/okr-system-setup`);
		} catch (error) {
			console.error("Error creating tenant:", error);
		}
		// try {
		//   await createTenantMutation.mutateAsync(values);
		// } catch (error) {
		//   console.error("Form submission error:", error);
		// }
	};

	// Process CSV import for OKRs
	//   const handleImportOKRs = (data: any[]) => {
	//     // Update form with imported data
	//     form.setValue("setup.importedOKRs", data);

	//     toast({
	//       title: "OKRs Imported",
	//       description: `${data.length} OKRs imported successfully.`,
	//     });
	//   };

	// Tenant created success screen
	if (tenantCreated) {
		return (
			<div className="container max-w-5xl mx-auto py-12">
				<Card className="border-green-100 bg-green-50/50">
					<CardContent className="pt-6 pb-8">
						<div className="flex flex-col items-center text-center">
							<div className="bg-green-100 text-green-700 p-4 rounded-full mb-4">
								<CheckCircle className="h-12 w-12" />
							</div>
							<h2 className="text-2xl font-bold text-gray-900 mb-2">
								Organization Created Successfully!
							</h2>
							<p className="text-gray-600 mb-6 max-w-md">
								Your organization has been set up and you will be redirected to your
								dashboard shortly.
							</p>
							<div className="animate-pulse">
								<Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container max-w-5xl mx-auto py-12">
			<Button type="button" className="mt-4 ml-auto" onClick={() => signOut()}>
				Log out
			</Button>
			<div className="mb-8">
				{/* Progress indicator */}
				<div className="flex justify-between mb-2">
					{steps.map((step, index) => (
						<div
							key={step.id}
							className={cn("flex-1 flex flex-col items-center", {
								"text-primary": activeIndex >= index,
								"text-gray-400": activeIndex < index,
							})}
							onClick={() => {
								// Allow clicking on completed steps or current step
								if (index <= activeIndex) {
									goToStep(step.id);
								}
							}}
						>
							<div
								className={cn(
									"w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors",
									{
										"bg-primary text-white": activeIndex >= index,
										"bg-gray-100 text-gray-400": activeIndex < index,
										"cursor-pointer hover:bg-primary/90 hover:text-white":
											index <= activeIndex,
									}
								)}
							>
								{activeIndex > index ? (
									<Check className="h-5 w-5" />
								) : (
									<step.icon className="h-5 w-5" />
								)}
							</div>
							<span className="text-sm font-medium">{step.label}</span>
						</div>
					))}
				</div>

				<Progress value={animateProgress} className="h-2" />
			</div>

			<div className="bg-white border rounded-xl shadow-sm overflow-hidden">
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<Tabs value={activePage} onValueChange={setActivePage} className="w-full">
							<TabsList className="hidden">
								{steps.map((step) => (
									<TabsTrigger key={step.id} value={step.id}>
										{step.label}
									</TabsTrigger>
								))}
							</TabsList>

							{/* Organization Details */}
							<TabsContent value="organization" className="mt-0 space-y-6">
								<Card>
									<CardHeader className="pb-4 border-b">
										<CardTitle>Organization Details</CardTitle>
										<CardDescription>Tell us about your organization</CardDescription>
									</CardHeader>
									<CardContent className="pt-6">
										<div className="space-y-4">
											<FormField
												control={form.control}
												name="orgDetails.name"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Organization Name</FormLabel>
														<FormControl>
															<Input
																placeholder="Organization Name"
																{...field}
																className="bg-gray-50"
																onChange={(e) => {
																	form.clearErrors("orgDetails.name");
																	if (
																		form.getValues("orgDetails.displayName") === field.value ||
																		!form.getValues("orgDetails.displayName")
																	) {
																		const displayName = e.target.value;
																		form.setValue("orgDetails.displayName", displayName);
																	}
																	field.onChange(e.target.value);
																}}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="orgDetails.displayName"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Display Name *</FormLabel>
														<FormControl>
															<Input
																placeholder="ACME Corporation"
																{...field}
																className="bg-gray-50"
																onChange={(e) => {
																	form.clearErrors("orgDetails.displayName");
																	field.onChange(e.target.value);
																}}
															/>
														</FormControl>
														<FormDescription>
															This is how your organization will appear to users
														</FormDescription>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="orgDetails.description"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Description</FormLabel>
														<FormControl>
															<Textarea
																placeholder="Tell us about your organization"
																{...field}
																className="bg-gray-50"
																rows={4}
																onChange={(e) => {
																	form.clearErrors("orgDetails.description");
																	field.onChange(e.target.value);
																}}
															/>
														</FormControl>
														<FormDescription>
															A brief description of your organization and its mission
														</FormDescription>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="orgDetails.industry"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="block">Industry</FormLabel>
														<Popover
															onOpenChange={() => form.clearErrors("orgDetails.industry")}
														>
															<PopoverTrigger asChild>
																<FormControl>
																	<Button
																		variant="outline"
																		role="combobox"
																		className={cn(
																			"justify-between w-[300px]",
																			!field.value && "text-muted-foreground"
																		)}
																	>
																		{field.value
																			? IndustryOptions.find(
																					(industry) => industry.value === field.value
																			  )?.value
																			: "Select Industry"}
																		<ChevronsUpDown className="opacity-50" />
																	</Button>
																</FormControl>
															</PopoverTrigger>
															<PopoverContent className="p-0 w-72">
																<Command>
																	<CommandInput
																		placeholder="Search framework..."
																		className="h-9"
																	/>
																	<CommandList>
																		<CommandEmpty>No framework found.</CommandEmpty>
																		<CommandGroup>
																			{IndustryOptions.map((industry) => (
																				<CommandItem
																					value={industry.value}
																					key={industry.label}
																					onSelect={() => {
																						form.setValue("orgDetails.industry", industry.value);
																					}}
																				>
																					{industry.value}
																					<Check
																						className={cn(
																							"ml-auto",
																							industry.value === field.value
																								? "opacity-100"
																								: "opacity-0"
																						)}
																					/>
																				</CommandItem>
																			))}
																		</CommandGroup>
																	</CommandList>
																</Command>
															</PopoverContent>
														</Popover>
														{/* <Select onValueChange={field.onChange} defaultValue={field.value}>
															<FormControl>
																<SelectTrigger className="bg-gray-50">
																	<SelectValue placeholder="Select an industry" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																<div className="sticky top-0 p-2 z-20">
																	<Input
																		placeholder="Search industries..."
																		className="border-gray-200"
																		onChange={(e) => {
																			const query = e.target.value.toLowerCase();
																			let visibleCount = 0;
																			document
																				.querySelectorAll(".industry-item")
																				.forEach((item) => {
																					if (
																						(item.textContent || "").toLowerCase().includes(query)
																					) {
																						(item as HTMLElement).style.display = "flex";
																						visibleCount++;
																					} else {
																						(item as HTMLElement).style.display = "none";
																					}
																				});
																		}}
																	/>
																</div>
																{IndustryOptions.map((industry: string) => (
																	<SelectItem
																		key={industry}
																		value={industry.toLowerCase()}
																		className="industry-item"
																	>
																		{industry}
																	</SelectItem>
																))}
															</SelectContent>
														</Select> */}
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
									</CardContent>
									<CardFooter className="flex justify-end pt-4">
										<Button
											type="button"
											onClick={handleContinueToPlan}
											// disabled={!isCurrentStepValid()}
											className="w-full md:w-auto"
										>
											Continue to Subscription
											<ArrowRight className="ml-2 h-4 w-4" />
										</Button>
									</CardFooter>
								</Card>
							</TabsContent>

							{/* Subscription Plan */}
							<TabsContent value="plan" className="mt-0 space-y-6">
								<div className="m-6">
									<h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
									<p className="text-gray-500">
										Select the subscription plan that fits your needs
									</p>
								</div>

								<Card>
									<CardContent className="pt-6">
										<FormField
											control={form.control}
											name="plan.plan"
											render={({ field }) => (
												<FormItem className="space-y-6">
													<div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
														{PriceTiers.map((tier) => (
															<FormItem key={tier.id} className="flex">
																<FormControl>
																	<RadioGroup
																		onValueChange={field.onChange}
																		defaultValue={field.value}
																		className="flex"
																	>
																		<div
																			className={cn(
																				"relative h-full rounded-xl border-2 p-0 overflow-hidden transition-all flex-1 cursor-pointer",
																				field.value === tier.id
																					? "border-primary shadow-md"
																					: "border-gray-200 hover:border-gray-300",
																				tier.popular && "md:scale-105 md:-translate-y-1"
																			)}
																			onClick={() => field.onChange(tier.id)}
																		>
																			{tier.popular && (
																				<div className="absolute top-0 right-0 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-bl-xl">
																					Popular
																				</div>
																			)}

																			<div className="bg-gradient-to-b from-gray-50 to-white px-4 py-5 text-center">
																				<h3 className="text-lg font-semibold">{tier.name}</h3>
																				<p className="text-sm text-gray-500 h-10 flex items-center justify-center">
																					{tier.description}
																				</p>
																				<div className="mt-2">
																					<span className="text-3xl font-bold">
																						{tier.price === 0 ? "Free" : `$${tier.price}`}
																					</span>
																					{tier.price > 0 && (
																						<span className="text-gray-500">/month</span>
																					)}
																				</div>
																			</div>

																			<div className="px-4 py-5">
																				<ul className="space-y-3 text-sm">
																					{tier.features.map((feature, idx) => (
																						<li key={idx} className="flex items-start">
																							<Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
																							<span>{feature}</span>
																						</li>
																					))}
																				</ul>
																			</div>

																			<div className="border-t p-4 mt-auto">
																				<div
																					className={cn(
																						"p-2 rounded-md text-center text-sm",
																						field.value === tier.id
																							? "bg-primary/10 text-primary"
																							: "bg-gray-50 text-gray-500"
																					)}
																				>
																					{field.value === tier.id ? (
																						<span className="flex items-center justify-center">
																							<Check className="h-4 w-4 mr-1" />
																							Selected
																						</span>
																					) : (
																						tier.buttonText
																					)}
																				</div>
																			</div>

																			<FormItem className="absolute top-2 left-2">
																				<FormControl>
																					<RadioGroupItem value={tier.id} className="sr-only" />
																				</FormControl>
																			</FormItem>
																		</div>
																	</RadioGroup>
																</FormControl>
															</FormItem>
														))}
													</div>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="plan.agreeToTerms"
											render={({ field }) => (
												<FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-6">
													<FormControl>
														<Checkbox
															checked={field.value}
															onCheckedChange={field.onChange}
														/>
													</FormControl>
													<div className="space-y-1 leading-none">
														<FormLabel>
															I agree to the{" "}
															<a href="#" className="text-primary underline">
																Terms of Service
															</a>{" "}
															and{" "}
															<a href="#" className="text-primary underline">
																Privacy Policy
															</a>
														</FormLabel>
													</div>
												</FormItem>
											)}
										/>
									</CardContent>
									<CardFooter className="flex justify-between pt-4">
										<Button
											type="button"
											variant="outline"
											onClick={() => setActivePage("organization")}
										>
											<ArrowLeft className="mr-2 h-4 w-4" />
											Back
										</Button>

										<Button
											type="submit"
											disabled={isMutating || !isCurrentStepValid()}
											className="bg-primary hover:bg-primary/90 shadow-sm"
										>
											{isSubmitting ? (
												<>
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
													Creating Organization...
												</>
											) : (
												<>
													Create Organization
													<Rocket className="ml-2 h-4 w-4" />
												</>
											)}
										</Button>
									</CardFooter>
								</Card>
							</TabsContent>
						</Tabs>
					</form>
				</Form>
			</div>
		</div>
	);
}
