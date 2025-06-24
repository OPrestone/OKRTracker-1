"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TenantContext } from "@/contexts/TenantContext";
import { createObjective, getAllObjectives } from "@/lib/queries/objectives";
import { getStrategicIntentsCompany } from "@/lib/queries/strategic-intents";
import { getTeams } from "@/lib/queries/teams";
import { getAllTimeframes } from "@/lib/queries/timeframes";
import { getTenantUsers } from "@/lib/queries/users";
import {
	InsertObjective,
	StrategicDirection,
	Team,
	Tenant,
	User,
} from "@/util/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	Building,
	Calendar,
	Check,
	Edit,
	Loader2,
	Tag,
	Target,
	Users,
	X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";
import { toast } from "sonner";

export default function CreateObjectiveDisplay() {
	const router = useRouter();
	const tenant = useContext(TenantContext) as Tenant;
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Check if this is part of the company goal workflow
	const urlParams = new URLSearchParams(window.location.search);
	const isAlignToCompanyGoal = urlParams.get("alignToCompanyGoal") === "true";
	const parentGoalId = localStorage.getItem("parentGoalId");
	const parentGoalTitle = localStorage.getItem("parentGoalTitle");

	// Set of tags based on request
	const availableTags = [
		"Innovation",
		"Customer Experience",
		"Growth",
		"Operational Excellence",
		"Sustainability",
	];

	// Fetch teams from API
	const { data: teams = [], isLoading: teamsLoading } = useQuery<Team[]>({
		queryKey: ["teams", tenant.id],
		queryFn: async () => {
			const teams = await getTeams(tenant.id);
			if ("error" in teams) throw new Error(teams.error);
			return teams;
		},
	});

	// Fetch users from API
	const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
		queryKey: ["users", tenant.id],
		queryFn: async () => {
			const users = await getTenantUsers(tenant.id);
			if ("error" in users) throw new Error(users.error);
			return users;
		},
	});

	// Fetch timeframes from API
	const { data: timeframes = [], isLoading: timeframesLoading } = useQuery({
		queryKey: ["timeframes", tenant.id],
		queryFn: async () => {
			const timeframes = await getAllTimeframes(tenant.id);
			if ("error" in timeframes) throw new Error(timeframes.error);
			return timeframes;
		},
	});

	// Fetch objectives for alignment options
	const { data: objectives = [] } = useQuery({
		queryKey: ["objectives", tenant.id],
		queryFn: async () => {
			const objectives = await getAllObjectives(tenant.id);
			if ("error" in objectives) throw new Error(objectives.error);
			return objectives;
		},
	});

	// Fetch company goals specifically for alignment selection
	//   const { data: companyGoals = [] } = useQuery({
	//     queryKey: ['/api/company-goals'],
	//     queryFn: getQueryFn({ on401: "throw" }),
	//   });

	// Fetch strategic directions
	const { data: strategicDirection, isLoading: strategicDirectionsLoading } =
		useQuery<StrategicDirection>({
			queryKey: ["intents", tenant.id],
			queryFn: async () => {
				const intents = await getStrategicIntentsCompany(tenant.id);
				if ("error" in intents) throw new Error(intents.error);
				return intents;
			},
		});

	// States to track form data
	const [objectiveData, setObjectiveData] = useState({
		name: "",
		description: "",
		alignmentType: isAlignToCompanyGoal
			? "company-objective"
			: "strategic-pillar",
		alignmentTarget: isAlignToCompanyGoal ? parentGoalId || "" : "",
		teamId: "",
		ownerId: "",
		timeframeId: "",
		updateFrequency: "weekly",
		progressDriver: "key-results",
		tags: [] as string[],
		contributors: [] as string[],
		visibility: "all",
	});

	// Form validation
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [formSuccess, setFormSuccess] = useState<string | null>(null);

	// Filter team members based on the selected team
	const teamMembers =
		users?.filter(
			(user: User) =>
				objectiveData.teamId && user.teamId && user.teamId === objectiveData.teamId
		) || [];

	const handleCancel = () => {
		router.push("/");
	};

	// Function to validate the form
	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (!objectiveData.name.trim()) {
			newErrors.name = "Objective name is required";
		}

		if (!objectiveData.teamId) {
			newErrors.teamId = "Team selection is required";
		}

		if (!objectiveData.ownerId) {
			newErrors.ownerId = "Lead selection is required";
		}

		if (!objectiveData.timeframeId) {
			newErrors.timeframeId = "Timeframe is required";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	// Update form data when fields change
	const handleChange = (field: string, value: any) => {
		// If changing team, also reset selected contributors and auto-select team leader
		if (field === "teamId") {
			const selectedTeam = teams?.find((team) => team.id === value);
			const teamLeaderId = selectedTeam?.leaderId || "";

			setObjectiveData((prev) => ({
				...prev,
				[field]: value,
				ownerId: teamLeaderId, // Auto-select team leader
				contributors: [], // Reset contributors when team changes
			}));
		} else {
			setObjectiveData((prev) => ({
				...prev,
				[field]: value,
			}));
		}

		// Clear any errors for this field
		if (errors[field]) {
			setErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors[field];
				return newErrors;
			});
		}
	};

	const handleTagToggle = (tag: string) => {
		setObjectiveData((prev) => {
			const tags = prev.tags.includes(tag)
				? prev.tags.filter((t) => t !== tag)
				: [...prev.tags, tag];

			return {
				...prev,
				tags,
			};
		});
	};

	const handleContributorToggle = (userId: string) => {
		setObjectiveData((prev) => {
			const contributors = prev.contributors.includes(userId)
				? prev.contributors.filter((id) => id !== userId)
				: [...prev.contributors, userId];

			return {
				...prev,
				contributors,
			};
		});
	};
	const createObjectiveMutation = useMutation({
		mutationFn: async (payload: InsertObjective) => {
			console.log("Creating company goal:", payload);

			const response = await createObjective(payload);
			if ("error" in response) {
				console.log("Error creating company goal:", response.error);
				throw new Error(response.error);
			}
			return await response;
		},
		onError: (error: Error) => {
			toast.error("Failed to create objective", {
				description: error.message,
			});
		},
	});

	const handleSave = async () => {
		setIsSubmitting(true);
		setFormSuccess(null);

		// Validate form
		const isValid = validateForm();
		if (!isValid) {
			setIsSubmitting(false);
			return;
		}

		try {
			// Prepare data for API
			const apiData: InsertObjective = {
				title: objectiveData.name,
				description: objectiveData.description,
				teamId: objectiveData.teamId,
				ownerId: objectiveData.ownerId,
				timeframeId: objectiveData.timeframeId,
				// updateFrequency: objectiveData.updateFrequency,
				// progressType: objectiveData.progressDriver,
				// tags: objectiveData.tags,
				// contributors: objectiveData.contributors,
				// visibility: objectiveData.visibility,
				// alignmentType: objectiveData.alignmentType,
				strategyId:
					objectiveData.alignmentType === "strategic-pillar"
						? objectiveData.alignmentTarget
						: null,
				alignmentTargetId:
					objectiveData.alignmentType === "company-objective"
						? objectiveData.alignmentTarget
						: null,
				// Set parent_id when aligning to company objective
				parentId:
					objectiveData.alignmentType === "company-objective"
						? objectiveData.alignmentTarget
						: null,
				status: "active",
				level: "team", // Required field in the schema
				tenantId: tenant.id,
			};

			console.log("Objective data to submit:", apiData);

			// Submit to API using the configured apiRequest function
			const response = await createObjectiveMutation.mutateAsync(apiData);

			console.log("Objective creation response:", response);

			if (isAlignToCompanyGoal) {
				setFormSuccess(
					"Team OKR created successfully! Now let's add key results to track progress."
				);
				// Clear the workflow data from localStorage
				localStorage.removeItem("parentGoalId");
				localStorage.removeItem("parentGoalTitle");
			} else {
				setFormSuccess("Objective created successfully!");
			}

			// Redirect to create key result page with the objective ID
			// Check for both possible ID field names in the response
			if (response.id) {
				setTimeout(() => {
					router.push(`/${tenant.id}/create-key-result?objectiveId=${response.id}`);
				}, 1500);
			} else {
				console.error("No objective ID found in response:", response);
				setErrors({
					submit:
						"Objective created but unable to proceed to key results. Please check the objectives list.",
				});
			}
		} catch (error) {
			console.error("Error creating objective:", error);
			// Show error in UI
			setErrors({
				submit: "Failed to create objective. Please try again.",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			<div className="container mx-auto p-6 max-w-4xl">
				{/* Workflow indicator */}
				{isAlignToCompanyGoal && parentGoalTitle && (
					<div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
						<div className="flex items-center gap-2">
							<Check className="h-5 w-5 text-green-600" />
							<div>
								<p className="text-sm font-medium text-green-800">
									Creating Team OKR for:{" "}
									<span className="font-bold">{parentGoalTitle}</span>
								</p>
								<p className="text-xs text-green-600 mt-1">
									This objective will automatically align with your company goal
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Header with shadow border */}
				<div className="flex items-center justify-between mb-8 pb-4 border-b">
					<div className="flex items-center gap-3">
						<div className="rounded-full bg-primary/10 p-2">
							<Target className="h-7 w-7 text-primary" />
						</div>
						<div>
							<h1 className="text-2xl font-bold">Create New Objective</h1>
							<p className="text-sm text-gray-500 mt-1">
								Set measurable targets that align with your organization&apos;s strategy
							</p>
						</div>
					</div>
					<button
						onClick={handleCancel}
						className="text-gray-500 hover:text-gray-700 transition-colors"
					>
						<X className="h-6 w-6" />
					</button>
				</div>

				{/* Success message */}
				{formSuccess && (
					<div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
						<Check className="h-5 w-5" />
						<span>{formSuccess}</span>
					</div>
				)}

				{/* Form error message */}
				{errors.submit && (
					<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
						{errors.submit}
					</div>
				)}

				<div className="space-y-8">
					{/* Objective Details Section */}
					<div className="bg-white p-6 rounded-lg shadow-sm border">
						<div className="flex items-center gap-2 mb-4">
							<Target className="h-5 w-5 text-primary" />
							<h2 className="text-lg font-semibold">Objective Details</h2>
						</div>

						<div className="space-y-4">
							<div>
								<Label htmlFor="name" className="text-base font-medium">
									Objective Name
								</Label>
								<div className="mt-2 relative">
									<Input
										id="name"
										placeholder="Our onboarding process is smooth and fast"
										className={`pl-3 pr-10 py-3 text-base ${
											errors.name ? "border-red-500 focus-visible:ring-red-500" : ""
										}`}
										value={objectiveData.name}
										onChange={(e) => handleChange("name", e.target.value)}
									/>
									<Edit className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
								</div>
								{errors.name && (
									<p className="text-sm text-red-500 mt-1">{errors.name}</p>
								)}
							</div>

							<div>
								<Label htmlFor="description" className="text-base font-medium">
									Description
								</Label>
								<div className="mt-2">
									<Textarea
										id="description"
										placeholder="Describe your objective in more detail..."
										className="min-h-[80px]"
										value={objectiveData.description}
										onChange={(e) => handleChange("description", e.target.value)}
									/>
								</div>
							</div>
						</div>
					</div>

					{/* Alignment Section */}
					<div className="bg-white p-6 rounded-lg shadow-sm border">
						<div className="flex items-center gap-2 mb-4">
							<Building className="h-5 w-5 text-primary" />
							<h2 className="text-lg font-semibold">Strategic Alignment</h2>
						</div>

						<div className="space-y-4">
							<div>
								<Label className="text-base font-medium">Alignment Type</Label>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
									<Select
										value={objectiveData.alignmentType}
										onValueChange={(value) => handleChange("alignmentType", value)}
									>
										<SelectTrigger className="w-full">
											<div className="flex items-center">
												{objectiveData.alignmentType === "strategic-pillar" && (
													<>
														<Building className="h-5 w-5 mr-2 text-green-600" />
														<span>Support a Strategic Pillar</span>
													</>
												)}
												{objectiveData.alignmentType === "team-objective" && (
													<>
														<Users className="h-5 w-5 mr-2 text-blue-600" />
														<span>Support a Team Objective</span>
													</>
												)}
											</div>
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="strategic-pillar">
												<div className="flex items-center">
													<Building className="h-5 w-5 mr-2 text-green-600" />
													Support a Strategic Pillar
												</div>
											</SelectItem>
											<SelectItem value="team-objective">
												<div className="flex items-center">
													<Users className="h-5 w-5 mr-2 text-blue-600" />
													Support a Team Objective
												</div>
											</SelectItem>
											{/* <SelectItem value="company-objective">
												<div className="flex items-center">
													<Target className="h-5 w-5 mr-2 text-red-600" />
													Support a Company Objective
												</div>
											</SelectItem> */}
										</SelectContent>
									</Select>

									<Select
										value={objectiveData.alignmentTarget}
										onValueChange={(value) => handleChange("alignmentTarget", value)}
									>
										<SelectTrigger className="w-full">
											<SelectValue
												placeholder={
													objectiveData.alignmentType === "strategic-pillar"
														? "Select Strategic Pillar..."
														: "Select Team Objective..."
												}
											/>
										</SelectTrigger>
										<SelectContent>
											{objectiveData.alignmentType === "strategic-pillar" &&
												(strategicDirection ? (
													<SelectItem
														key={strategicDirection.id}
														value={strategicDirection.id}
													>
														{strategicDirection.title}
													</SelectItem>
												) : (
													<SelectItem value="no-directions" disabled>
														No strategic directions available
													</SelectItem>
												))}
											{objectiveData.alignmentType === "team-objective" &&
												(objectives && objectives.length > 0 ? (
													objectives
														.filter(
															(obj: any) => obj.level === "team" && obj.status !== "completed"
														)
														.map((obj: any) => (
															<SelectItem key={obj.id} value={obj.id}>
																{obj.title}
															</SelectItem>
														))
												) : (
													<SelectItem value="no-team-objectives" disabled>
														No team objectives available
													</SelectItem>
												))}
											{/* {objectiveData.alignmentType === 'company-objective' && (
                        companyGoals && companyGoals.length > 0 ? (
                          companyGoals.map((obj: any) => (
                            <SelectItem key={obj.id} value={obj.id}>
                              {obj.title}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-company-objectives" disabled>No company objectives available</SelectItem>
                        )
                      )} */}
										</SelectContent>
									</Select>
								</div>
							</div>

							<div>
								<Label className="text-base font-medium">Tags</Label>
								<div className="flex flex-wrap gap-2 mt-2">
									{availableTags.map((tag) => (
										<Badge
											key={tag}
											variant={objectiveData.tags.includes(tag) ? "default" : "outline"}
											className={`
                        cursor-pointer px-3 py-1.5 text-sm
                        ${
																									objectiveData.tags.includes(tag)
																										? "bg-primary/10 text-primary hover:bg-primary/20"
																										: "hover:bg-gray-100"
																								}
                      `}
											onClick={() => handleTagToggle(tag)}
										>
											<Tag className="h-3.5 w-3.5 mr-1.5" />
											{tag}
										</Badge>
									))}
								</div>
							</div>
						</div>
					</div>

					{/* Team Section */}
					<div className="bg-white p-6 rounded-lg shadow-sm border">
						<div className="flex items-center gap-2 mb-4">
							<Users className="h-5 w-5 text-primary" />
							<h2 className="text-lg font-semibold">Team & Ownership</h2>
						</div>

						<div className="space-y-6">
							{/* Team Selection */}
							<div>
								<Label htmlFor="team" className="text-base font-medium">
									Team
								</Label>
								<div className="mt-2">
									<Select
										onValueChange={(value) => handleChange("teamId", value)}
										value={objectiveData.teamId}
									>
										<SelectTrigger
											className={`w-full ${
												errors.teamId ? "border-red-500 focus-visible:ring-red-500" : ""
											}`}
										>
											{objectiveData.teamId ? (
												<div className="flex items-center">
													<div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm mr-2">
														{teams
															?.find((team) => team.id === objectiveData.teamId)
															?.name?.substring(0, 2)
															.toUpperCase() || "TM"}
													</div>
													<span>
														{teams?.find((team) => team.id === objectiveData.teamId)?.name ||
															"Team"}
													</span>
												</div>
											) : (
												<SelectValue placeholder="Select Team..." />
											)}
										</SelectTrigger>
										<SelectContent>
											{teamsLoading ? (
												<div className="flex items-center justify-center p-2">
													<Loader2 className="h-5 w-5 animate-spin text-gray-400" />
												</div>
											) : teams?.length > 0 ? (
												teams.map((team: Team) => (
													<SelectItem key={team.id} value={team.id}>
														<div className="flex items-center">
															<div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm mr-2">
																{team.name.substring(0, 2).toUpperCase()}
															</div>
															<span>{team.name}</span>
														</div>
													</SelectItem>
												))
											) : (
												<div className="p-2 text-center text-sm text-gray-500">
													No teams available
												</div>
											)}
										</SelectContent>
									</Select>
									{errors.teamId && (
										<p className="text-sm text-red-500 mt-1">{errors.teamId}</p>
									)}
								</div>
							</div>

							{/* Team Lead Selection */}
							<div>
								<Label htmlFor="owner" className="text-base font-medium">
									Team Lead/Owner
								</Label>
								<div className="mt-2">
									<Select
										onValueChange={(value) => handleChange("ownerId", value)}
										value={objectiveData.ownerId}
										disabled={!objectiveData.teamId}
									>
										<SelectTrigger
											className={`w-full ${
												errors.ownerId ? "border-red-500 focus-visible:ring-red-500" : ""
											}`}
										>
											{objectiveData.ownerId ? (
												<div className="flex items-center">
													<Avatar className="h-7 w-7 mr-2">
														<AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
															{(() => {
																const user = users?.find(
																	(user) => user.id === objectiveData.ownerId
																);
																const fullName = user
																	? `${user.firstName || ""} ${user.lastName || ""}`.trim()
																	: "";
																return fullName
																	? fullName
																			.split(" ")
																			.map((name) => name[0])
																			.join("")
																			.toUpperCase()
																	: user?.username?.substring(0, 2).toUpperCase() || "U";
															})()}
														</AvatarFallback>
													</Avatar>
													<span>
														{(() => {
															const user = users?.find(
																(user) => user.id === objectiveData.ownerId
															);
															return user
																? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
																		user.username
																: "User";
														})()}
													</span>
												</div>
											) : (
												<SelectValue placeholder="Select Lead..." />
											)}
										</SelectTrigger>
										<SelectContent>
											{usersLoading ? (
												<div className="flex items-center justify-center p-2">
													<Loader2 className="h-5 w-5 animate-spin text-gray-400" />
												</div>
											) : teamMembers.length > 0 ? (
												teamMembers.map((user) => (
													<SelectItem key={user.id} value={user.id}>
														<div className="flex items-center">
															<Avatar className="h-7 w-7 mr-2">
																<AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
																	{(() => {
																		const fullName = `${user.firstName || ""} ${
																			user.lastName || ""
																		}`.trim();
																		return fullName
																			? fullName
																					.split(" ")
																					.map((name) => name[0])
																					.join("")
																					.toUpperCase()
																			: user.username?.substring(0, 2).toUpperCase() || "U";
																	})()}
																</AvatarFallback>
															</Avatar>
															<span>
																{`${user.firstName || ""} ${user.lastName || ""}`.trim() ||
																	user.username}
															</span>
														</div>
													</SelectItem>
												))
											) : (
												<div className="p-2 text-center text-sm text-gray-500">
													{objectiveData.teamId
														? "No team members available"
														: "Please select a team first"}
												</div>
											)}
										</SelectContent>
									</Select>
									{errors.ownerId && (
										<p className="text-sm text-red-500 mt-1">{errors.ownerId}</p>
									)}
								</div>
							</div>

							{/* Contributors */}
							<div>
								<Label className="text-base font-medium">Contributors</Label>
								<div className="mt-2">
									{objectiveData.teamId ? (
										<div className="space-y-3">
											<div className="flex flex-wrap gap-2 min-h-[60px] p-3 border border-dashed border-gray-300 rounded-md">
												{objectiveData.contributors.length > 0 ? (
													objectiveData.contributors.map((userId) => {
														const user = users.find((u) => u.id === userId);
														if (!user) return null;
														const fullName = `${user.firstName || ""} ${
															user.lastName || ""
														}`.trim();
														const displayName = fullName || user.username;
														const initials = fullName
															? fullName
																	.split(" ")
																	.map((name) => name[0])
																	.join("")
																	.toUpperCase()
															: user.username?.substring(0, 2).toUpperCase() || "U";

														return (
															<Badge
																key={user.id}
																variant="outline"
																className="flex items-center gap-1 px-3 py-1.5 bg-blue-50"
															>
																<Avatar className="h-6 w-6">
																	<AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
																		{initials}
																	</AvatarFallback>
																</Avatar>
																<span>{displayName}</span>
																<button
																	className="ml-1 text-gray-500 hover:text-gray-900"
																	onClick={() => handleContributorToggle(user.id)}
																>
																	<X className="h-3 w-3" />
																</button>
															</Badge>
														);
													})
												) : (
													<p className="text-sm text-gray-500 italic p-2">
														Select team members to add as contributors...
													</p>
												)}
											</div>
											<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
												{teamMembers.map((user) => (
													<div
														key={user.id}
														onClick={() => handleContributorToggle(user.id)}
														className={`flex items-center p-2 rounded-md cursor-pointer border transition-colors ${
															objectiveData.contributors.includes(user.id)
																? "bg-blue-50 border-blue-200"
																: "border-gray-200 hover:bg-gray-50"
														}`}
													>
														<Avatar className="h-8 w-8 mr-2">
															<AvatarFallback
																className={
																	objectiveData.contributors.includes(user.id)
																		? "bg-primary/20 text-primary"
																		: "bg-gray-100 text-gray-700"
																}
															>
																{(() => {
																	const fullName = `${user.firstName || ""} ${
																		user.lastName || ""
																	}`.trim();
																	return fullName
																		? fullName
																				.split(" ")
																				.map((n) => n[0])
																				.join("")
																				.toUpperCase()
																		: user.username?.substring(0, 2).toUpperCase() || "U";
																})()}
															</AvatarFallback>
														</Avatar>
														<div>
															<p className="text-sm font-medium leading-none">
																{`${user.firstName || ""} ${user.lastName || ""}`.trim() ||
																	user.username}
															</p>
															<p className="text-xs text-gray-500">{user.username}</p>
														</div>
														{objectiveData.contributors.includes(user.id) && (
															<div className="ml-auto">
																<Check className="h-4 w-4 text-primary" />
															</div>
														)}
													</div>
												))}
											</div>
										</div>
									) : (
										<p className="text-sm text-gray-500 mt-2 p-3 border border-dashed border-gray-300 rounded-md">
											Please select a team first to add contributors.
										</p>
									)}
								</div>
							</div>
						</div>
					</div>

					{/* Timeframe Section */}
					<div className="bg-white p-6 rounded-lg shadow-sm border">
						<div className="flex items-center gap-2 mb-4">
							<Calendar className="h-5 w-5 text-primary" />
							<h2 className="text-lg font-semibold">Timeframe & Progress Tracking</h2>
						</div>

						<div className="space-y-6">
							{/* Timeframe Selection */}
							<div>
								<Label htmlFor="timeframe" className="text-base font-medium">
									Timeframe
								</Label>
								<div className="mt-2">
									<Select
										onValueChange={(value) => handleChange("timeframeId", value)}
										value={objectiveData.timeframeId}
									>
										<SelectTrigger
											className={`w-full ${
												errors.timeframeId
													? "border-red-500 focus-visible:ring-red-500"
													: ""
											}`}
										>
											<SelectValue placeholder="Select Timeframe..." />
										</SelectTrigger>
										<SelectContent>
											{timeframesLoading ? (
												<div className="flex items-center justify-center p-2">
													<Loader2 className="h-5 w-5 animate-spin text-gray-400" />
												</div>
											) : timeframes?.length > 0 ? (
												timeframes.map((timeframe) => (
													<SelectItem key={timeframe.id} value={timeframe.id}>
														<div className="flex items-center">
															<Calendar className="h-4 w-4 mr-2 text-gray-500" />
															<span>{timeframe.name}</span>
															{timeframe.startDate && timeframe.endDate && (
																<span className="ml-2 text-xs text-gray-500">
																	({new Date(timeframe.startDate).toLocaleDateString()} -{" "}
																	{new Date(timeframe.endDate).toLocaleDateString()})
																</span>
															)}
														</div>
													</SelectItem>
												))
											) : (
												<div className="p-2 text-center text-sm text-gray-500">
													No timeframes available
												</div>
											)}
										</SelectContent>
									</Select>
									{errors.timeframeId && (
										<p className="text-sm text-red-500 mt-1">{errors.timeframeId}</p>
									)}
								</div>
							</div>

							{/* Update Frequency */}
							<div>
								<Label htmlFor="updateFrequency" className="text-base font-medium">
									Update Frequency
								</Label>
								<div className="mt-2">
									<Select
										onValueChange={(value) => handleChange("updateFrequency", value)}
										value={objectiveData.updateFrequency}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select Update Frequency..." />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="daily">Daily</SelectItem>
											<SelectItem value="weekly">Weekly</SelectItem>
											<SelectItem value="biweekly">Bi-Weekly</SelectItem>
											<SelectItem value="monthly">Monthly</SelectItem>
											<SelectItem value="quarterly">Quarterly</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							{/* Progress Driver */}
							<div>
								<Label htmlFor="progressDriver" className="text-base font-medium">
									Progress Driver
								</Label>
								<div className="mt-2">
									<Select
										onValueChange={(value) => handleChange("progressDriver", value)}
										value={objectiveData.progressDriver}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select Progress Driver..." />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="key-results">
												Key Results (Auto-calculated)
											</SelectItem>
											<SelectItem value="manual">Manual Updates</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							{/* Visibility */}
							<div>
								<Label htmlFor="visibility" className="text-base font-medium">
									Visibility
								</Label>
								<div className="mt-2">
									<Select
										onValueChange={(value) => handleChange("visibility", value)}
										value={objectiveData.visibility}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select Visibility..." />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All Organization Members</SelectItem>
											<SelectItem value="team">Team Only</SelectItem>
											<SelectItem value="contributors">Contributors Only</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex justify-end gap-3 pt-4">
						<Button variant="outline" onClick={handleCancel}>
							Cancel
						</Button>
						<Button
							onClick={handleSave}
							disabled={isSubmitting}
							className="min-w-[120px]"
						>
							{isSubmitting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Saving...
								</>
							) : (
								"Create Objective"
							)}
						</Button>
					</div>
				</div>
			</div>
		</>
	);
}
