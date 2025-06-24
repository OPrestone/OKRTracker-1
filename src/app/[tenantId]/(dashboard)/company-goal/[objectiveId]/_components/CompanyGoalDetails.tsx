"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TenantContext } from "@/contexts/TenantContext";
import { UserContext } from "@/contexts/UserContext";
import { UserPermissions } from "@/lib/actions";
import {
	getAllObjectivesFullDetail,
	getObjectiveByIdFullDetail,
} from "@/lib/queries/objectives";
import { getTeams } from "@/lib/queries/teams";
import { Tenant } from "@/util/schema";
import { useQuery } from "@tanstack/react-query";
import {
	AlertCircle,
	ArrowLeft,
	Building,
	Calendar,
	Edit,
	Loader2,
	Plus,
	Target,
	TrendingUp,
	Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";

export default function CompanyGoalDetails({
	objectiveId,
}: {
	objectiveId?: string;
}) {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState("overview");
	const [editingKeyResult, setEditingKeyResult] = useState<string | null>(null);
	const [editValues, setEditValues] = useState<{
		currentValue: string;
		progress: string;
	}>({ currentValue: "", progress: "" });

	const tenant = useContext(TenantContext) as Tenant;
	const { user } = useContext(UserContext) as UserPermissions;

	// Fetch company goal details
	const {
		data: companyGoal,
		isLoading: goalLoading,
		error: goalError,
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
	});

	// Fetch aligned team OKRs
	const { data: alignedOKRs = [], isLoading: okrsLoading } = useQuery({
		queryKey: ["objectives-team", tenant.id],
		queryFn: async () => {
			const objective = await getAllObjectivesFullDetail(tenant.id, "team");
			if ("error" in objective) throw new Error(objective.error);
			return objective;
		},
	});

	// Fetch teams data for context
	const { data: teams = [] } = useQuery({
		queryKey: ["teams", tenant.id],
		queryFn: async () => {
			const teams = await getTeams(tenant.id);
			if ("error" in teams) throw new Error(teams.error);
			return teams;
		},
	});

	// Mutation for updating key result progress
	// const updateProgressMutation = useMutation({
	// 	mutationFn: async ({
	// 		keyResultId,
	// 		currentValue,
	// 		progress,
	// 	}: {
	// 		keyResultId: string;
	// 		currentValue: number;
	// 		progress: number;
	// 	}) => {
	// 		return apiRequest(`/api/key-results/${keyResultId}/progress`, {
	// 			method: "PUT",
	// 			body: JSON.stringify({ currentValue, progress }),
	// 		});
	// 	},
	// 	onSuccess: () => {
	// 		queryClient.invalidateQueries({
	// 			queryKey: ["/api/objectives", "aligned-to", goalId],
	// 		});
	// 		queryClient.invalidateQueries({
	// 			queryKey: ["/api/company-goals", goalId, "activity"],
	// 		});
	// 		setEditingKeyResult(null);
	// 		toast({
	// 			title: "Progress Updated",
	// 			description: "Key result progress has been updated successfully.",
	// 		});
	// 	},
	// 	onError: (error: any) => {
	// 		toast({
	// 			title: "Update Failed",
	// 			description: error.message || "Failed to update key result progress.",
	// 			variant: "destructive",
	// 		});
	// 	},
	// });

	// Calculate overall progress from aligned OKRs
	const overallProgress =
		alignedOKRs.length > 0
			? Math.round(
					alignedOKRs.reduce((sum, okr) => sum + (okr.objectives.progress || 0), 0) /
						alignedOKRs.length
			  )
			: companyGoal?.objectives.progress || 0;

	// Collect all key results from aligned team OKRs
	// const allKeyResults = alignedOKRs.flatMap(
	// 	(okr) =>
	// 		okr.keyResults?.map((kr) => ({
	// 			...kr,
	// 			teamName:
	// 				teams.find((team) => team.id === okr.teamId)?.name || "Unknown Team",
	// 			objectiveTitle: okr.title,
	// 		})) || []
	// );

	// Get status color
	const getStatusColor = (status: string) => {
		switch (status) {
			case "on_track":
				return "bg-green-100 text-green-800";
			case "at_risk":
				return "bg-yellow-100 text-yellow-800";
			case "behind":
				return "bg-red-100 text-red-800";
			case "completed":
				return "bg-blue-100 text-blue-800";
			case "not_started":
				return "bg-gray-100 text-gray-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	// Helper functions for editing key results
	// const startEditing = (keyResult: any) => {
	// 	setEditingKeyResult(keyResult.id);
	// 	setEditValues({
	// 		currentValue: keyResult.currentValue?.toString() || "0",
	// 		progress: keyResult.progress?.toString() || "0",
	// 	});
	// };

	// const cancelEditing = () => {
	// 	setEditingKeyResult(null);
	// 	setEditValues({ currentValue: "", progress: "" });
	// };

	// const saveProgress = (keyResult: any) => {
	// 	const currentValue = parseFloat(editValues.currentValue) || 0;
	// 	const progress = Math.min(
	// 		100,
	// 		Math.max(0, parseFloat(editValues.progress) || 0)
	// 	);

	// 	updateProgressMutation.mutate({
	// 		keyResultId: keyResult.id,
	// 		currentValue,
	// 		progress,
	// 	});
	// };

	// Get status text
	const getStatusText = (status: string) => {
		switch (status) {
			case "on_track":
				return "On Track";
			case "at_risk":
				return "At Risk";
			case "behind":
				return "Behind";
			case "completed":
				return "Completed";
			case "not_started":
				return "Not Started";
			default:
				return "Unknown";
		}
	};

	if (goalLoading) {
		return (
			<div className="container mx-auto p-6 max-w-6xl">
				<div className="flex items-center justify-center py-12">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
					<span className="ml-2">Loading company goal...</span>
				</div>
			</div>
		);
	}

	if (goalError || !companyGoal) {
		return (
			<div className="container mx-auto p-6 max-w-4xl">
				<div className="text-center py-12">
					<AlertCircle className="h-12 w-12 text-red-300 mx-auto mb-4" />
					<h2 className="text-xl font-semibold text-gray-600 mb-2">
						Error Loading Company Goal
					</h2>
					<p className="text-gray-500 mb-4">
						{goalError instanceof Error
							? goalError.message
							: "Failed to load company goal details"}
					</p>
					<div className="flex gap-4 justify-center">
						<Button onClick={() => window.location.reload()}>Try Again</Button>
						<Button
							variant="outline"
							onClick={() => router.push(`${tenant.id}/company-okrs`)}
						>
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Company Goals
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="container mx-auto p-6 max-w-6xl">
				{/* Header */}
				<div className="flex items-center justify-between mb-8 pb-4 border-b">
					<div className="flex items-center gap-3">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => router.push(`/${tenant.id}/company-okrs`)}
							className="mr-2"
						>
							<ArrowLeft className="h-4 w-4" />
						</Button>
						<div className="rounded-full bg-primary/10 p-2">
							<Building className="h-7 w-7 text-primary" />
						</div>
						<div>
							<h1 className="text-2xl font-bold">{companyGoal.objectives.title}</h1>
							<div className="flex items-center gap-2 mt-1">
								<Badge className="bg-blue-100 text-blue-800">Company Goal</Badge>
								<Badge className={getStatusColor(companyGoal.objectives.status)}>
									{getStatusText(companyGoal.objectives.status)}
								</Badge>
								{companyGoal.timeframes?.name && (
									<Badge variant="outline" className="text-xs">
										<Calendar className="h-3 w-3 mr-1" />
										{companyGoal.timeframes?.name}
									</Badge>
								)}
							</div>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Button variant="outline" size="sm">
							<Edit className="h-4 w-4 mr-2" />
							Edit Goal
						</Button>
						<Button
							size="sm"
							onClick={() => {
								router.push(`/${tenant.id}/create-objective?alignToCompanyGoal=true`);
							}}
						>
							<Plus className="h-4 w-4 mr-2" />
							Create Team OKR
						</Button>
					</div>
				</div>

				{/* Overview Cards */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-gray-600">Overall Progress</p>
									<p className="text-2xl font-bold">{overallProgress}%</p>
								</div>
								<TrendingUp className="h-8 w-8 text-primary" />
							</div>
							<Progress value={overallProgress} className="mt-2" />
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-gray-600">Aligned Team OKRs</p>
									<p className="text-2xl font-bold">{alignedOKRs.length}</p>
								</div>
								<Target className="h-8 w-8 text-blue-500" />
							</div>
						</CardContent>
					</Card>

					{/* <Card>
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-gray-600">Key Results</p>
									<p className="text-2xl font-bold">
										{companyGoal.keyResults?.length || 0}
									</p>
								</div>
								<BarChart3 className="h-8 w-8 text-green-500" />
							</div>
						</CardContent>
					</Card> */}

					<Card>
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-gray-600">Contributing Teams</p>
									<p className="text-2xl font-bold">
										{new Set(alignedOKRs.map((okr) => okr.teams?.id)).size}
									</p>
								</div>
								<Users className="h-8 w-8 text-purple-500" />
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Description */}
				{companyGoal.objectives.description && (
					<Card className="mb-8">
						<CardHeader>
							<CardTitle>Description</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-gray-700 leading-relaxed">
								{companyGoal.objectives.description}
							</p>
						</CardContent>
					</Card>
				)}

				{/* Tabs */}
				<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="overview">Key Results</TabsTrigger>
						<TabsTrigger value="aligned-okrs">Aligned Team OKRs</TabsTrigger>
						<TabsTrigger value="activity">Activity</TabsTrigger>
					</TabsList>

					{/* Key Results Tab */}
					{/* <TabsContent value="overview" className="mt-6">
						{allKeyResults.length > 0 ? (
							<div className="grid gap-4">
								{allKeyResults.map((keyResult) => (
									<Card key={keyResult.id} className="group">
										<CardContent className="p-4">
											<div className="flex items-start justify-between">
												<div className="flex-1">
													<div className="flex items-center gap-2 mb-2">
														<h4 className="font-medium">{keyResult.title}</h4>
														<span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
															{keyResult.teamName}
														</span>
													</div>
													{keyResult.description && (
														<p className="text-sm text-gray-600 mt-1">
															{keyResult.description}
														</p>
													)}
													<p className="text-xs text-gray-500 mt-1">
														From: {keyResult.objectiveTitle}
													</p>
													<div className="flex items-center gap-4 mt-3">
														<div className="text-sm">
															<span className="text-gray-500">Current:</span>
															<span className="font-medium ml-1">
																{keyResult.currentValue}
															</span>
														</div>
														<div className="text-sm">
															<span className="text-gray-500">Target:</span>
															<span className="font-medium ml-1">{keyResult.targetValue}</span>
														</div>
														{keyResult.assignedToName && (
															<div className="text-sm">
																<span className="text-gray-500">Owner:</span>
																<span className="font-medium ml-1">
																	{keyResult.assignedToName}
																</span>
															</div>
														)}
													</div>
												</div>
												<div className="flex items-center gap-2 ml-4">
													{editingKeyResult === keyResult.id ? (
														<div className="flex items-center gap-2">
															<div className="flex items-center gap-1 text-sm">
																<Input
																	type="number"
																	value={editValues.currentValue}
																	onChange={(e) =>
																		setEditValues((prev) => ({
																			...prev,
																			currentValue: e.target.value,
																		}))
																	}
																	className="w-16 h-8 text-xs"
																	placeholder="Current"
																/>
																<span>/</span>
																<span>{keyResult.targetValue}</span>
															</div>
															<Input
																type="number"
																value={editValues.progress}
																onChange={(e) =>
																	setEditValues((prev) => ({
																		...prev,
																		progress: e.target.value,
																	}))
																}
																className="w-16 h-8 text-xs"
																placeholder="Progress"
																min="0"
																max="100"
															/>
															<span className="text-xs">%</span>
															<Button
																size="sm"
																variant="ghost"
																onClick={() => saveProgress(keyResult)}
																disabled={updateProgressMutation.isPending}
																className="h-6 w-6 p-0"
															>
																{updateProgressMutation.isPending ? (
																	<Loader2 className="h-3 w-3 animate-spin" />
																) : (
																	<Check className="h-3 w-3 text-green-600" />
																)}
															</Button>
															<Button
																size="sm"
																variant="ghost"
																onClick={cancelEditing}
																className="h-6 w-6 p-0"
															>
																<X className="h-3 w-3 text-gray-600" />
															</Button>
														</div>
													) : (
														<div className="flex items-center gap-2">
															<span className="text-sm font-medium">
																{keyResult.progress}%
															</span>
															<Progress value={keyResult.progress} className="w-20" />
															{isTeamLeader && (
																<Button
																	size="sm"
																	variant="ghost"
																	onClick={() => startEditing(keyResult)}
																	className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
																>
																	<Edit className="h-3 w-3 text-gray-600" />
																</Button>
															)}
														</div>
													)}
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						) : (
							<Card className="border-dashed">
								<CardContent className="p-8 text-center">
									<BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
									<h3 className="text-lg font-medium text-gray-600 mb-2">
										No Key Results
									</h3>
									<p className="text-gray-500 mb-4">
										No teams have created key results for OKRs aligned to this company
										goal yet.
									</p>
									<Button
										variant="outline"
										onClick={() => {
											localStorage.setItem("parentGoalId", companyGoal.id);
											localStorage.setItem("parentGoalTitle", companyGoal.title);
											router.push("/create-objective?alignToCompanyGoal=true");
										}}
									>
										<Plus className="h-4 w-4 mr-2" />
										Create Aligned Team OKR
									</Button>
								</CardContent>
							</Card>
						)}
					</TabsContent> */}

					{/* Aligned Team OKRs Tab */}
					<TabsContent value="aligned-okrs" className="mt-6">
						{alignedOKRs.length > 0 ? (
							<div className="grid gap-4">
								{alignedOKRs.map((okr) => (
									<Card
										key={okr.objectives.id}
										className="hover:shadow-md transition-shadow cursor-pointer"
										onClick={() =>
											router.push(`/${tenant.id}/objective/${okr.objectives.id}`)
										}
									>
										<CardContent className="p-4">
											<div className="flex items-start justify-between">
												<div className="flex-1">
													<div className="flex items-center gap-2 mb-2">
														<h4 className="font-medium">{okr.objectives.title}</h4>
														<Badge variant="outline" className="text-xs">
															{okr.teams?.name || "Unknown Team"}
														</Badge>
													</div>
													{okr.objectives.description && (
														<p className="text-sm text-gray-600 mb-3">
															{okr.objectives.description}
														</p>
													)}
													<div className="flex items-center gap-4 text-sm text-gray-500">
														{okr.users && <span>Owner: {okr.users.name}</span>}
														{okr.timeframes && (
															<span>
																<Calendar className="h-3 w-3 inline mr-1" />
																{okr.timeframes.name}
															</span>
														)}
														{/* {okr.keyResults && (
															<span>{okr.keyResults.length} Key Results</span>
														)} */}
													</div>
												</div>
												<div className="flex items-center gap-2 ml-4">
													<Badge className={getStatusColor(okr.objectives.status)}>
														{getStatusText(okr.objectives.status)}
													</Badge>
													<span className="text-sm font-medium">
														{okr.objectives.progress}%
													</span>
													<Progress value={okr.objectives.progress} className="w-20" />
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						) : (
							<Card className="border-dashed">
								<CardContent className="p-8 text-center">
									<Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
									<h3 className="text-lg font-medium text-gray-600 mb-2">
										No Aligned Team OKRs
									</h3>
									<p className="text-gray-500 mb-4">
										No teams have created OKRs aligned to this company goal yet.
									</p>
									<Button
										onClick={() => {
											// localStorage.setItem("parentGoalId", companyGoal.id);
											// localStorage.setItem("parentGoalTitle", companyGoal.title);
											router.push(
												`/${tenant.id}/create-objective?alignToCompanyGoal=true`
											);
										}}
									>
										<Plus className="h-4 w-4 mr-2" />
										Create Aligned Team OKR
									</Button>
								</CardContent>
							</Card>
						)}
					</TabsContent>
				</Tabs>
			</div>
		</>
	);
}
