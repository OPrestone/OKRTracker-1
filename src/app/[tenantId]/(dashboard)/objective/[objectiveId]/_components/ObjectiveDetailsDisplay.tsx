"use client";

// import SimpleAddKeyResultForm from "@/components/okrs/simple-add-key-result-form";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { TenantContext } from "@/contexts/TenantContext";
import { UserContext } from "@/contexts/UserContext";
import { UserPermissions } from "@/lib/actions";
import { createCheckIn, getAllCheckIns } from "@/lib/queries/check-ins";
import {
	deleteKeyResult,
	getKeyResultsByObjective,
	updateKeyResult,
} from "@/lib/queries/key-results";
import {
	getObjectiveByIdFullDetail,
	updateObjective,
} from "@/lib/queries/objectives";
import { getTenantUsers } from "@/lib/queries/users";
import { InsertCheckIn, KeyResult, Tenant } from "@/util/schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	AlertCircle,
	BarChart3,
	Building,
	Calendar,
	CheckCircle,
	CheckSquare,
	ChevronLeft,
	Edit,
	Loader2,
	MessageSquare,
	PlusCircle,
	Target,
	Trash2,
	User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { toast } from "sonner";

export default function ObjectiveDetailsDisplay({
	objectiveId,
}: {
	objectiveId: string;
}) {
	// Get the route parameters and extract the objective ID from different possible routes
	//   const [matchesSimpleRoute, simpleParams] = useRoute("/objective/:id");
	//   const [matchesPluralRoute, pluralParams] = useRoute("/objectives/:id");
	//   const [matchesTenantRoute, tenantParams] = useRoute("/:tenantId/objective/:objectiveId");
	//   const [matchesOrgRoute, orgParams] = useRoute("/organization/:organisation/objective/:id");

	// Use the first matching route's parameters
	const [progressValue, setProgressValue] = useState<string>("0");
	const [progressDialogOpen, setProgressDialogOpen] = useState(false);
	const [isAddKeyResultModalOpen, setIsAddKeyResultModalOpen] = useState(false);
	const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
	const [newCheckInNotes, setNewCheckInNotes] = useState("");

	// Key result progress update states
	const [keyResultProgressDialogOpen, setKeyResultProgressDialogOpen] =
		useState(false);
	const [selectedKeyResult, setSelectedKeyResult] = useState<KeyResult | null>(
		null
	);
	const [keyResultProgressValue, setKeyResultProgressValue] =
		useState<string>("0");
	const [keyResultNotes, setKeyResultNotes] = useState("");

	// Edit objective states
	const [editObjectiveDialogOpen, setEditObjectiveDialogOpen] = useState(false);
	const [editObjectiveTitle, setEditObjectiveTitle] = useState("");
	const [editObjectiveDescription, setEditObjectiveDescription] = useState("");

	// Edit key result states
	const [editKeyResultDialogOpen, setEditKeyResultDialogOpen] = useState(false);
	const [editingKeyResult, setEditingKeyResult] = useState<KeyResult | null>(
		null
	);
	const [editKeyResultTitle, setEditKeyResultTitle] = useState("");
	const [editKeyResultDescription, setEditKeyResultDescription] = useState("");
	const [editKeyResultCurrentValue, setEditKeyResultCurrentValue] = useState("");
	const [editKeyResultTargetValue, setEditKeyResultTargetValue] = useState("");
	const [editKeyResultStartValue, setEditKeyResultStartValue] = useState("");

	const router = useRouter();
	const tenant = useContext(TenantContext) as Tenant;
	const { user: person } = useContext(UserContext) as UserPermissions;
	const queryClient = useQueryClient();

	// For debugging
	//   console.log("Route params:", { simpleParams, tenantParams, orgParams });
	console.log("Objective ID from URL:", objectiveId);

	// Fetch the objective data from API with tenant context
	const {
		data: objective,
		isLoading: objectiveLoading,
		isError: objectiveError,
	} = useQuery({
		queryKey: ["objectives", tenant.id, objectiveId],
		queryFn: async () => {
			const objective = await getObjectiveByIdFullDetail(objectiveId!, tenant.id);
			if ("error" in objective) {
				console.error("Error fetching objective:", objective.error);
				throw new Error(objective.error);
			}
			return objective;
		},
		enabled: !!objectiveId,
	});

	// Fetch key results related to this objective
	const {
		data: keyResults,
		isLoading: keyResultsLoading,
		...otherKey
	} = useQuery({
		queryKey: ["key-results", tenant.id, objectiveId],
		queryFn: async () => {
			const keyResults = await getKeyResultsByObjective(objectiveId, tenant.id);
			if ("error" in keyResults) {
				console.error("Error fetching keyResults:", keyResults.error);
				throw new Error(keyResults.error);
			}
			return keyResults;
		},
	});

	// Fetch users
	const { data: users, isLoading: usersLoading } = useQuery({
		queryKey: ["users", tenant.id],
		queryFn: async () => {
			const users = await getTenantUsers(tenant.id);
			if ("error" in users) throw new Error(users.error);
			return users;
		},
	});

	// Fetch check-ins
	const { data: checkIns, isLoading: checkInsLoading } = useQuery({
		queryKey: ["check-ins", objectiveId, tenant.id],
		queryFn: async () => {
			const users = await getAllCheckIns(objectiveId, tenant.id);
			if ("error" in users) throw new Error(users.error);
			return users;
		},
	});

	// Calculate aggregate progress from key results
	const calculateAggregateProgress = (keyResults: KeyResult[]) => {
		if (!keyResults || keyResults.length === 0) {
			return 0;
		}

		const totalProgress = keyResults.reduce((sum, kr) => {
			return sum + (kr.progress || 0);
		}, 0);

		return Math.round(totalProgress / keyResults.length);
	};

	// Get calculated progress from key results, fallback to stored progress
	const displayProgress =
		keyResults && keyResults.length > 0
			? calculateAggregateProgress(keyResults)
			: (objective && objective.objectives && objective.objectives.progress) || 0;

	// Update progress value when objective data or key results change
	useEffect(() => {
		// Use the calculated display progress (aggregate from key results) instead of stored progress
		setProgressValue(displayProgress.toString());
	}, [displayProgress]);

	// Update edit form when objective data changes
	useEffect(() => {
		if (objective && objective.objectives) {
			setEditObjectiveTitle(objective.objectives.title || "");
			setEditObjectiveDescription(objective.objectives.description || "");
		}
	}, [objective]);

	// Update edit key result form when editing key result changes
	useEffect(() => {
		if (editingKeyResult) {
			setEditKeyResultTitle(editingKeyResult.title || "");
			setEditKeyResultDescription(editingKeyResult.description || "");
			setEditKeyResultCurrentValue(editingKeyResult.currentValue || "");
			setEditKeyResultTargetValue(editingKeyResult.targetValue || "");
			setEditKeyResultStartValue(editingKeyResult.startValue || "");
		}
	}, [editingKeyResult]);

	// Helper function to determine progress color class based on value
	const getProgressColorClass = (progress: number): string => {
		if (progress >= 76) return "text-green-600";
		if (progress >= 51) return "text-yellow-600";
		if (progress >= 26) return "text-orange-600";
		return "text-red-600";
	};

	// Helper function to get status color
	const getStatusColor = (status: string): string => {
		switch (status) {
			case "on_track":
				return "bg-green-100 text-green-800";
			case "at_risk":
				return "bg-amber-100 text-amber-800";
			case "behind":
				return "bg-red-100 text-red-800";
			case "completed":
				return "bg-blue-100 text-blue-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	// Helper function to get status text
	const getStatusText = (status: string): string => {
		switch (status) {
			case "on_track":
				return "On Track";
			case "at_risk":
				return "At Risk";
			case "behind":
				return "Behind";
			case "completed":
				return "Completed";
			default:
				return "Unknown";
		}
	};

	// Helper function to get initiative status color
	const getInitiativeStatusColor = (status: string): string => {
		switch (status) {
			case "completed":
				return "bg-green-100 text-green-800";
			case "in_progress":
				return "bg-blue-100 text-blue-800";
			case "not_started":
				return "bg-gray-100 text-gray-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	// Helper function to get initiative status text
	const getInitiativeStatusText = (status: string): string => {
		switch (status) {
			case "completed":
				return "Completed";
			case "in_progress":
				return "In Progress";
			case "not_started":
				return "Not Started";
			default:
				return "Unknown";
		}
	};

	// Handle progress update with real API
	const handleProgressUpdate = async () => {
		const newProgress = parseInt(progressValue, 10);
		if (isNaN(newProgress) || newProgress < 0 || newProgress > 100) {
			toast.error("Invalid Progress Value", {
				description: "Progress must be a number between 0 and 100.",
			});
			return;
		}

		if (!objective) {
			toast.error("Cannot Update Progress", {
				description: "Missing objective data or tenant information.",
			});
			return;
		}

		try {
			// Prepare the update data
			const updateData = {
				progress: newProgress,
				tenantId: tenant.id,
			};

			// Make API request to update objective
			const response = await updateObjective(objectiveId, tenant.id, updateData);

			if ("error" in response) {
				throw new Error(`Error updating progress: ${response.error}`);
			}

			// Invalidate queries to refetch data
			queryClient.invalidateQueries({
				queryKey: ["objectives", tenant.id, objectiveId],
			});

			setProgressDialogOpen(false);

			toast("Progress Updated", {
				description: `Progress has been updated to ${newProgress}%.`,
			});
		} catch (error) {
			console.error("Error updating progress:", error);
			toast.error("Error Updating Progress", {
				description:
					error instanceof Error ? error.message : "An unknown error occurred",
			});
		}
	};

	// Handle check-in submission with real API
	const handleCheckInSubmit = async () => {
		if (!newCheckInNotes.trim()) {
			toast.error("Check-in Notes Required", {
				description: "Please provide notes for your check-in.",
			});
			return;
		}

		if (!objective) {
			toast.error("Cannot Add Check-in", {
				description: "Missing objective data or tenant information.",
			});
			return;
		}

		try {
			// Create the check-in data model
			const checkInData: InsertCheckIn = {
				userId: person!.id, // Currently logged in user
				objectiveId: objective.objectives.id,
				progress: objective.objectives.progress,
				notes: newCheckInNotes,
				tenantId: tenant.id,
			};

			// Make API request to create check-in
			const response = await createCheckIn(checkInData);

			if ("error" in response) {
				throw new Error(`Error creating check-in: ${response.error}`);
			}

			// Invalidate queries to refetch data
			queryClient.invalidateQueries({
				queryKey: ["check-ins", objectiveId, tenant.id],
			});
			queryClient.invalidateQueries({
				queryKey: ["objectives", tenant.id, objectiveId],
			});

			// Clear form and close dialog
			setNewCheckInNotes("");
			setCheckInDialogOpen(false);

			toast.success("Check-in Added", {
				description: "Your check-in has been recorded successfully.",
			});
		} catch (error) {
			console.error("Error adding check-in:", error);
			toast.error("Error Adding Check-in", {
				description:
					error instanceof Error ? error.message : "An unknown error occurred",
			});
		}
	};

	// Handle opening key result progress dialog
	const handleOpenKeyResultProgress = (keyResult: KeyResult) => {
		setSelectedKeyResult(keyResult);
		setKeyResultProgressValue(
			(keyResult.currentValue || keyResult.startValue || "0").toString()
		);
		setKeyResultNotes("");
		setKeyResultProgressDialogOpen(true);
	};

	// Handle key result progress update
	const handleKeyResultProgressUpdate = async () => {
		const newCurrentValue = parseFloat(keyResultProgressValue);
		if (isNaN(newCurrentValue)) {
			toast.error("Invalid Current Value", {
				description: "Current value must be a valid number.",
			});
			return;
		}

		if (!selectedKeyResult) {
			toast.error("Cannot Update Progress", {
				description: "Missing key result data or tenant information.",
			});
			return;
		}

		try {
			// Prepare the update data with current value
			const updateData = {
				currentValue: newCurrentValue.toString(),
				tenantId: tenant.id,
			};

			// Make API request to update key result
			const response = await updateKeyResult(
				selectedKeyResult.id,
				tenant.id,
				updateData
			);

			if ("error" in response) {
				throw new Error(`Error updating key result: ${response.error}`);
			}

			// Calculate the new progress for display
			const start = parseFloat(selectedKeyResult.startValue || "0");
			const target = parseFloat(selectedKeyResult.targetValue || "100");
			let newProgress = 0;

			if (target === start) {
				newProgress = newCurrentValue === target ? 100 : 0;
			} else if (target > start) {
				newProgress = Math.max(
					0,
					Math.min(100, ((newCurrentValue - start) / (target - start)) * 100)
				);
			} else {
				newProgress = Math.max(
					0,
					Math.min(100, ((start - newCurrentValue) / (start - target)) * 100)
				);
			}

			// Invalidate queries to refetch data with comprehensive cache refresh
			await queryClient.invalidateQueries({
				queryKey: ["key-results", tenant.id, objectiveId],
			});
			await queryClient.invalidateQueries({
				queryKey: ["objectives", tenant.id, objectiveId],
			});

			// Force refetch the objective data immediately
			await queryClient.refetchQueries({
				queryKey: ["objectives", tenant.id, objectiveId],
			});

			// Close dialog and reset states
			setKeyResultProgressDialogOpen(false);
			setSelectedKeyResult(null);
			setKeyResultProgressValue("0");
			setKeyResultNotes("");

			toast.success("Progress Updated", {
				description: `Key result current value updated to ${newCurrentValue}. Progress is now ${newProgress.toFixed(
					1
				)}%.`,
			});
		} catch (error) {
			console.error("Error updating key result progress:", error);
			toast.error("Error Updating Progress", {
				description:
					error instanceof Error ? error.message : "An unknown error occurred",
			});
		}
	};

	// Go back to previous page
	const handleGoBack = () => {
		router.push("/team-okrs");
	};

	// Handle edit objective submission
	const handleEditObjectiveSubmit = async () => {
		if (!objective) return;

		try {
			await updateObjective(objectiveId, tenant.id, {
				title: editObjectiveTitle,
				description: editObjectiveDescription,
				tenantId: tenant.id,
			});

			toast("Objective Updated", {
				description: "Objective has been updated successfully.",
			});

			// Reset state
			setEditObjectiveDialogOpen(false);

			// Trigger data refresh through real-time sync
			queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
		} catch (error) {
			console.error("Error updating objective:", error);
			toast.error("Error", {
				description: "Failed to update objective. Please try again.",
			});
		}
	};

	// Handle edit key result functionality
	const handleEditKeyResult = (keyResult: KeyResult) => {
		setEditingKeyResult(keyResult);
		setEditKeyResultDialogOpen(true);
	};

	// Handle edit key result submission
	const handleEditKeyResultSubmit = async () => {
		if (!editingKeyResult) return;

		try {
			await updateKeyResult(editingKeyResult.id, tenant.id, {
				title: editKeyResultTitle,
				description: editKeyResultDescription,
				currentValue: editKeyResultCurrentValue,
				targetValue: editKeyResultTargetValue,
				startValue: editKeyResultStartValue,
			});

			toast("Key Result Updated", {
				description: "Key result has been updated successfully.",
			});

			// Reset state
			setEditKeyResultDialogOpen(false);
			setEditingKeyResult(null);

			// Trigger data refresh for both key results and objective
			queryClient.invalidateQueries({
				queryKey: ["key-results", tenant.id, objectiveId],
			});
			queryClient.invalidateQueries({
				queryKey: ["objectives", tenant.id, objectiveId],
			});
		} catch (error) {
			console.error("Error updating key result:", error);
			toast.error("Error", {
				description: "Failed to update key result. Please try again.",
			});
		}
	};

	// Handle delete key result
	const handleDeleteKeyResult = async (keyResult: KeyResult) => {
		try {
			await deleteKeyResult(keyResult.id, tenant.id);

			toast("Key Result Deleted", {
				description: "Key result has been deleted successfully.",
			});

			// Close any open dialogs
			setEditKeyResultDialogOpen(false);

			// Refresh the data
			queryClient.invalidateQueries({
				queryKey: ["key-results", tenant.id, objectiveId],
			});
			queryClient.invalidateQueries({
				queryKey: ["objectives", tenant.id, objectiveId],
			});
		} catch (error) {
			console.error("Error deleting key result:", error);
			toast.error("Error", {
				description: "Failed to delete key result. Please try again.",
			});
		}
	};

	// Combine all loading states
	const isLoading =
		objectiveLoading || keyResultsLoading || usersLoading || checkInsLoading;

	// Show loading state
	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="flex flex-col items-center gap-2">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
					<p className="text-muted-foreground">Loading objective data...</p>
				</div>
			</div>
		);
	}

	// Show error state
	if (objectiveError || !objective || !objective.objectives) {
		console.log("Objective Error:", objectiveError);
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
				<AlertCircle className="h-12 w-12 text-destructive" />
				<h2 className="text-xl font-semibold">Objective Not Found</h2>
				<p className="text-muted-foreground">
					The objective you are looking for does not exist or you do not have access
					to it.
				</p>
				<Button onClick={handleGoBack}>Go Back</Button>
			</div>
		);
	}

	return (
		<>
			<div className="mb-6">
				<Button variant="ghost" onClick={handleGoBack} className="mb-4">
					<ChevronLeft className="h-4 w-4 mr-1" />
					Back
				</Button>

				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
					<div>
						<div className="flex items-center gap-2 mb-2">
							<Badge className={getStatusColor(objective.objectives.status)}>
								{getStatusText(objective.objectives.status)}
							</Badge>
							<Badge variant="outline">{objective.timeframes.name}</Badge>
						</div>
						<h1 className="text-2xl font-bold tracking-tight">
							{objective.objectives.title}
						</h1>
					</div>

					<div className="flex items-center gap-3">
						<Button
							variant="outline"
							onClick={() => setEditObjectiveDialogOpen(true)}
						>
							<Edit className="h-4 w-4 mr-2" />
							Edit Objective
						</Button>
						<Button variant="outline" onClick={() => setCheckInDialogOpen(true)}>
							<MessageSquare className="h-4 w-4 mr-2" />
							New Check-in
						</Button>
						<Button onClick={() => setProgressDialogOpen(true)}>
							<BarChart3 className="h-4 w-4 mr-2" />
							Update Progress
						</Button>
					</div>
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-3">
				{/* Main content area - 2/3 width */}
				<div className="md:col-span-2 space-y-6">
					{/* Overview Card */}
					<Card>
						<CardHeader>
							<CardTitle>Overview</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
									<div className="flex-1">
										<div className="flex items-center justify-between mb-1">
											<h3 className="text-sm font-medium">Progress</h3>
											<span
												className={`text-lg font-bold ${getProgressColorClass(
													displayProgress
												)}`}
											>
												{displayProgress}%
											</span>
										</div>
										<Progress value={displayProgress} className="h-2 mb-1" />
										<p className="text-xs text-gray-500">
											Last updated: {objective.objectives.updatedAt?.toLocaleDateString()}
										</p>
									</div>

									<div className="flex items-start space-x-8 text-sm">
										<div>
											<p className="text-gray-500 mb-1">Start Date</p>
											<p className="font-medium flex items-center">
												<Calendar className="h-4 w-4 mr-1 text-gray-400" />
												{objective.timeframes.startDate
													? new Date(objective.timeframes.startDate).toLocaleDateString()
													: "No start date"}
											</p>
										</div>
										<div>
											<p className="text-gray-500 mb-1">End Date</p>
											<p className="font-medium flex items-center">
												<Calendar className="h-4 w-4 mr-1 text-gray-400" />
												{objective.timeframes.endDate
													? new Date(objective.timeframes.endDate).toLocaleDateString()
													: "No end date"}
											</p>
										</div>
									</div>
								</div>

								<Separator />

								<div>
									<h3 className="text-sm font-medium mb-2">Description</h3>
									<p className="text-sm text-gray-700">
										{objective.objectives.description}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Tabbed Content */}
					<Tabs defaultValue="key-results" className="space-y-4">
						<TabsList>
							<TabsTrigger value="key-results">
								<Target className="h-4 w-4 mr-2" />
								Key Results
							</TabsTrigger>
							<TabsTrigger value="initiatives">
								<CheckSquare className="h-4 w-4 mr-2" />
								Initiatives
							</TabsTrigger>
							<TabsTrigger value="check-ins">
								<MessageSquare className="h-4 w-4 mr-2" />
								Check-ins
							</TabsTrigger>
							<TabsTrigger value="todos">
								<CheckCircle className="h-4 w-4 mr-2" />
								To-Dos
							</TabsTrigger>
						</TabsList>

						{/* Key Results Tab */}
						<TabsContent value="key-results" className="space-y-4">
							<Card>
								<CardHeader className="pb-3">
									<div className="flex items-center justify-between">
										<CardTitle>Key Results</CardTitle>
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												router.push(`/${tenant.id}/create-key-result/${objectiveId}`)
											}
										>
											<PlusCircle className="h-4 w-4 mr-2" />
											Add Key Result
										</Button>
									</div>
									<CardDescription>
										Measurable outcomes that define success for this objective
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6">
									{keyResults && keyResults.length > 0 ? (
										keyResults.map((keyResult) => (
											<div key={keyResult.id} className="border rounded-md p-4">
												<div className="flex justify-between mb-2">
													<div>
														<div className="flex items-center gap-2 mb-1">
															<h3 className="font-medium">
																{keyResult.title || "Untitled Key Result"}
															</h3>
															<Badge
																className={getStatusColor(keyResult.status || "not_started")}
															>
																{getStatusText(keyResult.status || "not_started")}
															</Badge>
														</div>
														<p className="text-sm text-gray-600 mb-3">
															{keyResult.description || "No description provided"}
														</p>
													</div>
													<div
														className={`text-xl font-bold ${getProgressColorClass(
															keyResult.progress || 0
														)}`}
													>
														{keyResult.progress || 0}%
													</div>
												</div>

												<Progress value={keyResult.progress || 0} className="h-2 mb-3" />

												<div className="flex flex-col md:flex-row md:items-center md:justify-between text-sm text-gray-500 gap-2">
													<div className="flex items-center gap-2">
														<div className="flex items-center">
															<User className="h-4 w-4 mr-1" />
															{keyResult.assignedTo?.name || "Unassigned"}
														</div>
													</div>

													<div className="flex items-center gap-2">
														<Button
															variant="ghost"
															size="sm"
															onClick={() => handleOpenKeyResultProgress(keyResult)}
														>
															<BarChart3 className="h-4 w-4 mr-1" />
															Update Progress
														</Button>
														<Button
															variant="ghost"
															size="sm"
															onClick={() => handleEditKeyResult(keyResult)}
														>
															<Edit className="h-4 w-4 mr-1" />
															Edit
														</Button>
														<AlertDialog>
															<AlertDialogTrigger asChild>
																<Button
																	variant="ghost"
																	size="sm"
																	className="text-red-600 hover:text-red-700 hover:bg-red-50"
																>
																	<Trash2 className="h-4 w-4 mr-1" />
																	Delete
																</Button>
															</AlertDialogTrigger>
															<AlertDialogContent>
																<AlertDialogHeader>
																	<AlertDialogTitle>Delete Key Result</AlertDialogTitle>
																	<AlertDialogDescription>
																		Are you sure you want to delete "{keyResult.title}"? This
																		action cannot be undone.
																	</AlertDialogDescription>
																</AlertDialogHeader>
																<AlertDialogFooter>
																	<AlertDialogCancel>Cancel</AlertDialogCancel>
																	<AlertDialogAction
																		onClick={() => handleDeleteKeyResult(keyResult)}
																		className="bg-red-600 hover:bg-red-700"
																	>
																		Delete
																	</AlertDialogAction>
																</AlertDialogFooter>
															</AlertDialogContent>
														</AlertDialog>
													</div>
												</div>
											</div>
										))
									) : (
										<div className="text-center py-6 text-gray-500">
											No key results found for this objective
										</div>
									)}
								</CardContent>
							</Card>
						</TabsContent>

						{/* Initiatives Tab */}
						<TabsContent value="initiatives" className="space-y-4">
							<Card>
								<CardHeader className="pb-3">
									<div className="flex items-center justify-between">
										<CardTitle>Initiatives</CardTitle>
										<Button variant="outline" size="sm">
											<PlusCircle className="h-4 w-4 mr-2" />
											Add Initiative
										</Button>
									</div>
									<CardDescription>
										Projects and activities that contribute to achieving the key results
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									{objective?.initiatives?.length > 0 ? (
										objective.initiatives.map((initiative) => (
											<div key={initiative.id} className="border rounded-md p-4">
												<div className="flex justify-between mb-2">
													<div>
														<div className="flex items-center gap-2 mb-1">
															<h3 className="font-medium">
																{initiative.title || "Untitled Initiative"}
															</h3>
															<Badge
																className={getInitiativeStatusColor(
																	initiative.status || "not_started"
																)}
															>
																{getInitiativeStatusText(initiative.status || "not_started")}
															</Badge>
														</div>
														<p className="text-sm text-gray-600 mb-2">
															{initiative.description || "No description provided"}
														</p>
													</div>
												</div>

												<div className="flex flex-col md:flex-row md:items-center md:justify-between text-sm text-gray-500 gap-2">
													<div className="flex items-center gap-2">
														<div className="flex items-center">
															<User className="h-4 w-4 mr-1" />
															{initiative.owner?.name || "Unassigned"}
														</div>
													</div>

													<div className="flex items-center gap-2">
														<Button variant="ghost" size="sm">
															<Edit className="h-4 w-4 mr-1" />
															Edit
														</Button>
														<Button variant="ghost" size="sm" className="text-red-500">
															<Trash2 className="h-4 w-4 mr-1" />
															Delete
														</Button>
													</div>
												</div>
											</div>
										))
									) : (
										<div className="text-center py-6 text-gray-500">
											No initiatives found for this objective
										</div>
									)}
								</CardContent>
							</Card>
						</TabsContent>

						{/* Check-ins Tab */}
						<TabsContent value="check-ins" className="space-y-4">
							<Card>
								<CardHeader className="pb-3">
									<div className="flex items-center justify-between">
										<CardTitle>Check-ins</CardTitle>
										<Button
											variant="outline"
											size="sm"
											onClick={() => setCheckInDialogOpen(true)}
										>
											<PlusCircle className="h-4 w-4 mr-2" />
											New Check-in
										</Button>
									</div>
									<CardDescription>
										Regular updates on progress and status
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6">
									{checkInsLoading ? (
										<div className="flex justify-center py-8">
											<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
										</div>
									) : checkIns && checkIns.length > 0 ? (
										checkIns.map((checkIn) => {
											// Find the user who created this check-in
											const checkInUser = users?.find(
												(user) => user.id === checkIn.userId
											);

											return (
												<div key={checkIn.id} className="border rounded-md p-4">
													<div className="flex items-start gap-3 mb-3">
														<Avatar className="h-10 w-10">
															<AvatarFallback>
																{checkInUser?.name?.charAt(0) || "U"}
															</AvatarFallback>
														</Avatar>
														<div className="flex-1">
															<div className="flex justify-between mb-1">
																<h3 className="font-medium">
																	{checkInUser?.name || "Unknown User"}
																</h3>
																<span className="text-sm text-gray-500">
																	{checkIn.createdAt
																		? new Date(checkIn.createdAt).toLocaleDateString()
																		: "Unknown date"}
																</span>
															</div>
															<div className="flex items-center gap-2 mb-2">
																<div
																	className={`text-sm ${getProgressColorClass(
																		checkIn.progress || 0
																	)}`}
																>
																	Progress: {checkIn.progress || 0}%
																</div>
																{/* We don't have previous progress data in the DB schema yet */}
															</div>
														</div>
													</div>

													<div className="bg-gray-50 p-3 rounded-md text-sm">
														<p>{checkIn.notes || "No notes provided"}</p>
													</div>
												</div>
											);
										})
									) : (
										<div className="text-center py-8 text-gray-500">
											No check-ins recorded yet. Create your first check-in by clicking the
											&quot;New Check-in&quot; button.
										</div>
									)}
								</CardContent>
							</Card>
						</TabsContent>

						{/* To-Dos Tab */}
						<TabsContent value="todos" className="space-y-4">
							<Card>
								<CardHeader className="pb-3">
									<div className="flex items-center justify-between">
										<CardTitle>To-Dos</CardTitle>
										<Button variant="outline" size="sm" disabled>
											<PlusCircle className="h-4 w-4 mr-2" />
											Add To-Do
										</Button>
									</div>
									<CardDescription>
										Tasks that need to be completed to achieve the objective
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-2">
										{keyResults && keyResults.length > 0 ? (
											keyResults.map((keyResult) => (
												<div
													key={keyResult.id}
													className="flex items-center justify-between p-3 border rounded-md"
												>
													<div className="flex items-center gap-3">
														<div className="w-5 h-5 rounded-full border flex items-center justify-center cursor-pointer border-gray-300">
															{/* Will implement toggling when todos are supported */}
														</div>
														<div>
															<p className="text-sm font-medium">
																Complete Key Result: {keyResult.title}
															</p>
															<p className="text-xs text-gray-500">
																Progress: {keyResult.progress || 0}%
															</p>
														</div>
													</div>

													{keyResult.assignedTo && (
														<div className="flex items-center gap-2">
															<Avatar className="h-6 w-6">
																<AvatarFallback className="text-xs">
																	{keyResult.assignedTo.name?.charAt(0) || "U"}
																</AvatarFallback>
															</Avatar>
															<span className="text-xs text-gray-500">
																{keyResult.assignedTo.name}
															</span>
														</div>
													)}
												</div>
											))
										) : (
											<div className="text-center p-4 text-gray-500">
												No tasks defined for this objective yet
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</div>

				{/* Sidebar - 1/3 width */}
				<div className="space-y-6">
					{/* Owner Card */}
					<Card>
						<CardHeader>
							<CardTitle className="text-sm">Owner & Team</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{objective.users ? (
									<div className="flex items-start gap-3">
										<Avatar className="h-10 w-10">
											<AvatarFallback>
												{objective.users.name?.charAt(0) || "U"}
											</AvatarFallback>
										</Avatar>
										<div>
											<p className="font-medium">
												{objective.users.name || "Unknown Owner"}
											</p>
											<p className="text-sm text-gray-500">
												{objective.users.role || "Team Member"}
											</p>
										</div>
									</div>
								) : (
									<div className="text-center text-gray-500">No owner assigned</div>
								)}

								<Separator />

								<div>
									<p className="text-sm text-gray-500 mb-2">Team</p>
									{objective.teams ? (
										<div className="flex items-center gap-2">
											<Building className="h-4 w-4 text-gray-400" />
											<span className="font-medium">{objective.teams.name}</span>
										</div>
									) : (
										<div className="text-gray-500">No team assigned</div>
									)}
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Summary Stats Card */}
					<Card>
						<CardHeader>
							<CardTitle className="text-sm">Summary</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 gap-4">
								<div className="bg-gray-50 p-3 rounded-md text-center">
									<p className="text-2xl font-bold">{keyResults?.length || 0}</p>
									<p className="text-xs text-gray-500">Key Results</p>
								</div>
								<div className="bg-gray-50 p-3 rounded-md text-center">
									<p className="text-2xl font-bold">{checkIns?.length || 0}</p>
									<p className="text-xs text-gray-500">Check-ins</p>
								</div>
								<div className="bg-gray-50 p-3 rounded-md text-center">
									<p className="text-2xl font-bold">
										{keyResults?.filter((kr) => kr.status === "completed").length || 0}
									</p>
									<p className="text-xs text-gray-500">Completed KRs</p>
								</div>
								<div className="bg-gray-50 p-3 rounded-md text-center">
									<p className="text-2xl font-bold">
										{objective.objectives.createdAt
											? Math.ceil(
													(new Date().getTime() -
														new Date(objective.objectives.createdAt).getTime()) /
														(1000 * 60 * 60 * 24)
											  )
											: 0}
									</p>
									<p className="text-xs text-gray-500">Days Active</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Recent Activity Card */}
					<Card>
						<CardHeader>
							<CardTitle className="text-sm">Recent Activity</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{/* Display real check-ins if available */}
								{checkIns && checkIns.length > 0 ? (
									checkIns.slice(0, 3).map((checkIn) => {
										const checkInUser = users?.find((user) => user.id === checkIn.userId);
										return (
											<div key={checkIn.id} className="flex gap-3 items-start">
												<div className="bg-blue-100 p-2 rounded-full">
													<MessageSquare className="h-3 w-3 text-blue-600" />
												</div>
												<div>
													<p className="text-sm">
														{checkInUser?.firstName} {checkInUser?.lastName} added a check-in
													</p>
													<p className="text-xs text-gray-500">
														{checkIn.createdAt
															? new Date(checkIn.createdAt).toLocaleDateString()
															: "No date available"}
													</p>
												</div>
											</div>
										);
									})
								) : (
									/* Show creation activity */
									<div className="flex gap-3 items-start">
										<div className="bg-green-100 p-2 rounded-full">
											<CheckCircle className="h-3 w-3 text-green-600" />
										</div>
										<div>
											<p className="text-sm">Objective created</p>
											<p className="text-xs text-gray-500">
												{objective.objectives.createdAt
													? new Date(objective.objectives.createdAt).toLocaleDateString()
													: "Recently"}
											</p>
										</div>
									</div>
								)}

								{/* Show when objective was last updated */}
								{objective.objectives.updatedAt &&
									objective.objectives.updatedAt !== objective.objectives.createdAt && (
										<div className="flex gap-3 items-start">
											<div className="bg-purple-100 p-2 rounded-full">
												<Edit className="h-3 w-3 text-purple-600" />
											</div>
											<div>
												<p className="text-sm">Objective updated</p>
												<p className="text-xs text-gray-500">
													{new Date(objective.objectives.updatedAt).toLocaleDateString()}
												</p>
											</div>
										</div>
									)}

								{checkIns && checkIns.length > 3 && (
									<Button variant="ghost" size="sm" className="w-full text-xs">
										View all activity ({checkIns.length} total)
									</Button>
								)}

								{!checkIns?.length && (
									<div className="text-center py-4 text-gray-500 text-sm">
										No activity yet. Add a check-in to get started.
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Progress Update Dialog */}
			<Dialog open={progressDialogOpen} onOpenChange={setProgressDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Update Progress</DialogTitle>
						<DialogDescription>
							Update the overall progress for this objective.
						</DialogDescription>
					</DialogHeader>

					<div className="py-6 space-y-4">
						<div className="space-y-2">
							<label htmlFor="progress" className="text-sm font-medium">
								Progress Percentage
							</label>
							<div className="flex gap-2 items-center">
								<Input
									id="progress"
									type="number"
									min="0"
									max="100"
									value={progressValue}
									onChange={(e) => setProgressValue(e.target.value)}
									className="flex-1"
								/>
								<span>%</span>
							</div>
							<p className="text-sm text-muted-foreground">
								Enter a value between 0 and 100.
							</p>
						</div>

						<div>
							<Progress value={parseInt(progressValue) || 0} className="h-2" />
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => setProgressDialogOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleProgressUpdate}>Update Progress</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Check-in Dialog */}
			<Dialog open={checkInDialogOpen} onOpenChange={setCheckInDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>New Check-in</DialogTitle>
						<DialogDescription>
							Provide an update on this objective&apos;s progress.
						</DialogDescription>
					</DialogHeader>

					<div className="py-6 space-y-4">
						<div className="flex justify-between mb-1">
							<span className="text-sm font-medium">Current Progress</span>
							<span
								className={`text-sm font-medium ${getProgressColorClass(
									objective.objectives.progress
								)}`}
							>
								{objective.objectives.progress}%
							</span>
						</div>
						<Progress value={objective.objectives.progress} className="h-2 mb-4" />

						<div className="space-y-2">
							<label htmlFor="checkInNotes" className="text-sm font-medium">
								Check-in Notes
							</label>
							<Textarea
								id="checkInNotes"
								placeholder="Provide details about current progress, challenges, and next steps..."
								value={newCheckInNotes}
								onChange={(e) => setNewCheckInNotes(e.target.value)}
								className="h-32"
							/>
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => setCheckInDialogOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleCheckInSubmit}>Submit Check-in</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Key Result Progress Update Dialog */}
			<Dialog
				open={keyResultProgressDialogOpen}
				onOpenChange={setKeyResultProgressDialogOpen}
			>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>Update Key Result Progress</DialogTitle>
						<DialogDescription>
							Update the current value for &quot;{selectedKeyResult?.title}&quot;.
						</DialogDescription>
					</DialogHeader>

					<div className="py-6 space-y-6">
						{selectedKeyResult && (
							<>
								{/* Key Result Details */}
								<div className="bg-muted/50 p-4 rounded-lg space-y-3">
									<div className="flex justify-between">
										<span className="text-sm font-medium">Start Value:</span>
										<span className="text-sm">{selectedKeyResult.startValue || 0}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-sm font-medium">Current Value:</span>
										<span className="text-sm">{selectedKeyResult.currentValue || 0}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-sm font-medium">Target Value:</span>
										<span className="text-sm">
											{selectedKeyResult.targetValue || 100}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-sm font-medium">Current Progress:</span>
										<span className="text-sm font-semibold">
											{selectedKeyResult.progress || 0}%
										</span>
									</div>
								</div>

								{/* Current Value Update */}
								<div className="space-y-2">
									<label htmlFor="keyResultCurrentValue" className="text-sm font-medium">
										New Current Value
									</label>
									<Input
										id="keyResultCurrentValue"
										type="number"
										value={keyResultProgressValue}
										onChange={(e) => setKeyResultProgressValue(e.target.value)}
										placeholder={`Enter current value (between ${
											selectedKeyResult.startValue || 0
										} and ${selectedKeyResult.targetValue || 100})`}
									/>
									<p className="text-xs text-muted-foreground">
										Progress will be automatically calculated based on start, current, and
										target values.
									</p>
								</div>

								{/* Progress Preview */}
								<div className="space-y-2">
									<label className="text-sm font-medium">Progress Preview</label>
									<div className="flex items-center gap-2">
										<Progress
											value={(() => {
												// Get current input value or fallback to existing current value
												const inputValue = keyResultProgressValue.trim();
												const current = inputValue
													? parseFloat(inputValue)
													: parseFloat(selectedKeyResult.currentValue || "0");
												const start = parseFloat(selectedKeyResult.startValue || "0");
												const target = parseFloat(selectedKeyResult.targetValue || "100");

												// Handle invalid numbers
												if (isNaN(current) || isNaN(start) || isNaN(target)) return 0;

												// Maintain type: target equals start
												if (target === start) {
													return current === target ? 100 : 0;
												}

												// Increase type: target > start
												if (target > start) {
													const progress = ((current - start) / (target - start)) * 100;
													return Math.max(0, Math.min(100, progress));
												}

												// Decrease type: target < start
												// If current is at or below target, progress is 100%
												if (current <= target) return 100;
												// If current is at or above start, progress is 0%
												if (current >= start) return 0;
												// Otherwise calculate progress between start and target
												const progress = ((start - current) / (start - target)) * 100;
												return Math.max(0, Math.min(100, progress));
											})()}
											className="flex-1"
										/>
										<span className="text-sm font-medium">
											{(() => {
												// Get current input value or fallback to existing current value
												const inputValue = keyResultProgressValue.trim();
												const current = inputValue
													? parseFloat(inputValue)
													: parseFloat(selectedKeyResult.currentValue || "0");
												const start = parseFloat(selectedKeyResult.startValue || "0");
												const target = parseFloat(selectedKeyResult.targetValue || "100");

												// Handle invalid numbers
												if (isNaN(current) || isNaN(start) || isNaN(target)) return "0.0";

												// Maintain type: target equals start
												if (target === start) {
													return current === target ? "100.0" : "0.0";
												}

												// Increase type: target > start
												if (target > start) {
													const progress = ((current - start) / (target - start)) * 100;
													return Math.max(0, Math.min(100, progress)).toFixed(1);
												}

												// Decrease type: target < start
												// If current is at or below target, progress is 100%
												if (current <= target) return "100.0";
												// If current is at or above start, progress is 0%
												if (current >= start) return "0.0";
												// Otherwise calculate progress between start and target
												const progress = ((start - current) / (start - target)) * 100;
												return Math.max(0, Math.min(100, progress)).toFixed(1);
											})()}
											%
										</span>
									</div>
									<div className="text-xs text-muted-foreground">
										Target Type:{" "}
										{(() => {
											const start = parseFloat(selectedKeyResult.startValue || "0");
											const target = parseFloat(selectedKeyResult.targetValue || "100");
											if (target === start) return "Maintain";
											return target > start ? "Increase" : "Decrease";
										})()}
									</div>
								</div>

								{/* Notes */}
								<div className="space-y-2">
									<label htmlFor="keyResultNotes" className="text-sm font-medium">
										Notes (Optional)
									</label>
									<Textarea
										id="keyResultNotes"
										value={keyResultNotes}
										onChange={(e) => setKeyResultNotes(e.target.value)}
										placeholder="Add any notes about this progress update..."
										rows={3}
									/>
								</div>
							</>
						)}
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setKeyResultProgressDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button onClick={handleKeyResultProgressUpdate}>Update Progress</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Add Key Result Dialog */}
			{/* {objectiveId && (
				<SimpleAddKeyResultForm
					objectiveId={objectiveId}
					open={isAddKeyResultModalOpen}
					onOpenChange={setIsAddKeyResultModalOpen}
				/>
			)} */}

			{/* Edit Objective Dialog */}
			<Dialog
				open={editObjectiveDialogOpen}
				onOpenChange={setEditObjectiveDialogOpen}
			>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>Edit Objective</DialogTitle>
						<DialogDescription>
							Update the title and description of this objective.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor="edit-title">Title</Label>
							<Input
								id="edit-title"
								value={editObjectiveTitle}
								onChange={(e) => setEditObjectiveTitle(e.target.value)}
								placeholder="Enter objective title"
							/>
						</div>
						<div>
							<Label htmlFor="edit-description">Description</Label>
							<Textarea
								id="edit-description"
								value={editObjectiveDescription}
								onChange={(e) => setEditObjectiveDescription(e.target.value)}
								placeholder="Enter objective description"
								rows={4}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setEditObjectiveDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button onClick={handleEditObjectiveSubmit}>Update Objective</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Edit Key Result Dialog */}
			<Dialog
				open={editKeyResultDialogOpen}
				onOpenChange={setEditKeyResultDialogOpen}
			>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>Edit Key Result</DialogTitle>
						<DialogDescription>
							Update the details of this key result.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor="edit-kr-title">Title</Label>
							<Input
								id="edit-kr-title"
								value={editKeyResultTitle}
								onChange={(e) => setEditKeyResultTitle(e.target.value)}
								placeholder="Enter key result title"
							/>
						</div>
						<div>
							<Label htmlFor="edit-kr-description">Description</Label>
							<Textarea
								id="edit-kr-description"
								value={editKeyResultDescription}
								onChange={(e) => setEditKeyResultDescription(e.target.value)}
								placeholder="Enter key result description"
								rows={3}
							/>
						</div>
						<div className="grid grid-cols-3 gap-4">
							<div>
								<Label htmlFor="edit-kr-start">Start Value</Label>
								<Input
									id="edit-kr-start"
									value={editKeyResultStartValue}
									onChange={(e) => setEditKeyResultStartValue(e.target.value)}
									placeholder="0"
								/>
							</div>
							<div>
								<Label htmlFor="edit-kr-current">Current Value</Label>
								<Input
									id="edit-kr-current"
									value={editKeyResultCurrentValue}
									onChange={(e) => setEditKeyResultCurrentValue(e.target.value)}
									placeholder="0"
								/>
							</div>
							<div>
								<Label htmlFor="edit-kr-target">Target Value</Label>
								<Input
									id="edit-kr-target"
									value={editKeyResultTargetValue}
									onChange={(e) => setEditKeyResultTargetValue(e.target.value)}
									placeholder="100"
								/>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setEditKeyResultDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button onClick={handleEditKeyResultSubmit}>Update Key Result</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
