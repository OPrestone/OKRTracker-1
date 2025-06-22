"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table/data-table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TenantContext } from "@/contexts/TenantContext";
import { createTeam, getTeams } from "@/lib/queries/teams";
import { getAllTenantUserNumber } from "@/lib/queries/user-to-tenant";
// import { useToast } from "@/hooks/use-toast";
// import DashboardLayout from "@/layouts/dashboard-layout";
// import { apiRequest, queryClient } from "@/lib/queryClient";
import { getAllObjectives } from "@/lib/queries/objectives";
import { InsertTeam, Objective, Team } from "@/util/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import {
	AlertCircle,
	Building,
	Edit,
	Eye,
	MoreHorizontal,
	PlusCircle,
	Search,
	Target,
	Trash2,
	UserPlus,
	Users,
} from "lucide-react";
import { useContext, useState } from "react";
import { toast } from "sonner";
import TeamCard from "./TeamCard";
// import { useLocation } from "wouter";

// Define TeamObjective interface
export interface TeamObjective {
	id: string;
	title: string; // Primary title field
	description?: string;
	level?: string;
	ownerId?: string;
	teamId?: string;
	timeframeId?: string;
	status?: "on_track" | "at_risk" | "behind" | "completed";
	progress: number;
	parentId?: string | null;
	createdAt?: string;
	name?: string; // For backwards compatibility with older code
	tenantId?: string;
}

const TeamsDisplay = ({ tenantId }: { tenantId: string }) => {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [newTeamName, setNewTeamName] = useState("");
	const [newTeamColor, setNewTeamColor] = useState("#3B82F6");
	const [newTeamIcon, setNewTeamIcon] = useState("building");
	const [newTeamDescription, setNewTeamDescription] = useState("");
	const [newTeamParent, setNewTeamParent] = useState("");

	// View state (table or cards)
	const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

	// Pagination state
	const [currentMembersPage, setCurrentMembersPage] = useState(1);
	const [currentObjectivesPage, setCurrentObjectivesPage] = useState(1);
	const itemsPerPage = 5;

	const tenant = useContext(TenantContext);
	const queryClient = useQueryClient();
	// Fetch all teams - using an array format for consistent approach with other queries
	const {
		data: teams,
		isLoading: teamsLoading,
		error: teamsError,
	} = useQuery<Team[]>({
		queryKey: ["teams", tenantId], // Use array format with single element for consistent handling
		queryFn: async () => {
			const teams = await getTeams(tenantId);
			if ("error" in teams) throw new Error(teams.error);
			return teams;
		},
		staleTime: 0, // Don't cache for this test
	});

	const createTeamMutation = useMutation({
		mutationKey: ["create_team"],
		mutationFn: async (newTeam: InsertTeam) => {
			const response = await createTeam(newTeam, tenantId);
			if ("error" in response) throw new Error(response.error);
			return response;
		},
		onSuccess: () => {
			// Invalidate and refetch teams after creating a new team
			queryClient.invalidateQueries({ queryKey: ["teams", tenantId] });
			toast("Team created successfully", {
				description: "The new team has been added to your organization.",
			});
		},
	});

	// Calculate stats by fetching member counts for all teams
	// const teamStatsQueries =
	// 	teams?.map((team) =>
	// 		useQuery<User[]>({
	// 			queryKey: ["/api/teams", team.id, "users"],
	// 			enabled: !!team.id,
	// 		})
	// 	) || [];

	// Fetch team members when a team is selected
	// const { data: teamMembers, isLoading: membersLoading } = useQuery<User[]>({
	// 	queryKey: ["/api/teams", selectedTeam?.id, "users"],
	// 	enabled: !!selectedTeam,
	// });

	// Fetch team objectives when a team is selected
	// const { data: teamObjectives, isLoading: objectivesLoading } = useQuery<
	// 	TeamObjective[]
	// >({
	// 	queryKey: ["/api/teams", selectedTeam?.id, "objectives"],
	// 	enabled: !!selectedTeam,
	// });

	// Filter teams by search query
	const filteredTeams = teams?.filter((team) =>
		team.name.toLowerCase().includes(searchQuery.toLowerCase())
	);

	// Fetch all users to calculate total members (requires authentication)
	const { data: allUsers, isError: usersError } = useQuery<number>({
		queryKey: ["users_number"],
		queryFn: async () => {
			const response = await getAllTenantUserNumber(tenantId);
			if (typeof response === "object" && "error" in response)
				throw new Error(response.error);
			return response;
		},
		enabled: !!teams,
		retry: false,
	});

	// Fetch all objectives to calculate active objectives and average progress (requires authentication)
	const { data: allObjectives, isError: objectivesError } = useQuery<
		Objective[]
	>({
		queryKey: ["all_objectives"],
		queryFn: async () => {
			const response = await getAllObjectives(tenantId);
			if (typeof response === "object" && "error" in response)
				throw new Error(response.error);
			return response;
		},
		retry: false,
	});

	// Calculate stats from authentic database data
	const totalTeams = teams?.length || 0;
	const totalMembers = allUsers || 0;

	// Filter active objectives (not completed)
	const activeObjectives =
		allObjectives?.filter((obj) => obj.status !== "completed").length || 0;

	// Calculate average progress from all objectives
	const averageProgress =
		allObjectives && allObjectives.length > 0
			? Math.round(
					allObjectives.reduce((sum, obj) => sum + (obj.progress || 0), 0) /
						allObjectives.length
			  )
			: 0;

	// Check if user needs to log in for full analytics
	const needsAuth = usersError || objectivesError;

	// const [, setLocation] = useLocation();

	const handleTeamClick = (team: Team) => {
		// Navigate to team detail page instead of opening dialog
		// setLocation(`/teams/${team.id}`);
	};

	// This function is no longer needed but we'll keep it as a no-op to avoid errors
	const handleCloseDetails = () => {
		setSelectedTeam(null);
	};

	// Pagination logic
	const getPaginatedData = <T extends object>(
		data: T[] | undefined,
		page: number
	): T[] => {
		if (!data) return [];
		const startIndex = (page - 1) * itemsPerPage;
		return data.slice(startIndex, startIndex + itemsPerPage);
	};

	// Calculate number of pages for pagination
	const getTotalPages = (totalItems: number): number => {
		return Math.ceil(totalItems / itemsPerPage);
	};

	// DataTable column definitions
	const columns: ColumnDef<Team>[] = [
		{
			accessorKey: "icon",
			header: "",
			cell: ({ row }) => {
				const team = row.original;
				const teamColor = team.color || "#3B82F6";
				return (
					<div
						className="w-9 h-9 rounded-full flex items-center justify-center"
						style={{ backgroundColor: `${teamColor}20` }}
					>
						<Building size={18} style={{ color: teamColor }} />
					</div>
				);
			},
		},
		{
			accessorKey: "name",
			header: "Team Name",
			cell: ({ row }) => {
				const team = row.original;
				return <div className="font-medium">{team.name}</div>;
			},
		},
		{
			accessorKey: "description",
			header: "Description",
			cell: ({ row }) => {
				const description = row.getValue("description") as string;
				return (
					<div className="max-w-[300px] truncate">
						{description || "No description provided"}
					</div>
				);
			},
		},
		{
			accessorKey: "ownerId",
			header: "Owner",
			cell: ({ row }) => {
				const ownerId = row.getValue("ownerId") as number;
				return (
					<div className="flex items-center">
						<Avatar className="h-8 w-8 mr-2">
							<AvatarFallback className="bg-primary/10 text-primary">
								{ownerId ? `U${ownerId}` : "?"}
							</AvatarFallback>
						</Avatar>
						<span>{ownerId || "Unassigned"}</span>
					</div>
				);
			},
		},
		// {
		// 	id: "members",
		// 	header: "Members",
		// 	cell: ({ row }) => {
		// 		const team = row.original;
		// 		// Fetch real member count for this team
		// 		const { data: members } = useQuery<User[]>({
		// 			queryKey: ["/api/teams", team.id, "users"],
		// 			enabled: !!team.id,
		// 		});

		// 		return (
		// 			<Badge variant="outline" className="flex items-center gap-1">
		// 				<Users size={14} />
		// 				<span>{members?.length || 0} members</span>
		// 			</Badge>
		// 		);
		// 	},
		// },
		{
			id: "actions",
			cell: ({ row }) => {
				const team = row.original;

				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="h-8 w-8 p-0">
								<span className="sr-only">Open menu</span>
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								className="cursor-pointer"
								onClick={() => handleTeamClick(team)}
							>
								<Eye className="mr-2 h-4 w-4" />
								View details
							</DropdownMenuItem>
							<DropdownMenuItem
								className="cursor-pointer"
								onClick={() => {
									// Open edit dialog
									console.log("Edit team:", team.id);
								}}
							>
								<Edit className="mr-2 h-4 w-4" />
								Edit team
							</DropdownMenuItem>
							<DropdownMenuItem
								className="cursor-pointer"
								onClick={() => {
									// Open add members dialog
									console.log("Add members to team:", team.id);
								}}
							>
								<UserPlus className="mr-2 h-4 w-4" />
								Add members
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								className="cursor-pointer text-destructive"
								onClick={() => {
									// Open delete confirmation
									console.log("Delete team:", team.id);
								}}
							>
								<Trash2 className="mr-2 h-4 w-4" />
								Delete team
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		},
	];

	const handleCreateTeam = async () => {
		try {
			const newTeam = {
				name: newTeamName,
				description: newTeamDescription,
				color: newTeamColor,
				icon: newTeamIcon,
				parentId: newTeamParent || null,
				ownerId: null, // Will be set to current user on the server
			};

			await createTeamMutation.mutateAsync(newTeam);

			// Invalidate and refetch teams
			queryClient.invalidateQueries({ queryKey: ["teams", tenantId] });

			// Reset form and close dialog
			setNewTeamName("");
			setNewTeamDescription("");
			setNewTeamColor("#3B82F6");
			setNewTeamIcon("building");
			setNewTeamParent("");
			setIsCreateDialogOpen(false);

			toast("Team created", {
				description: "New team has been created successfully.",
			});
		} catch (error) {
			toast.error("Error creating team", {
				description:
					error instanceof Error ? error.message : "An unknown error occurred",
			});
		}
	};

	return (
		<>
			<div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Teams</h1>
					<p className="text-gray-600">
						Manage and view all teams in your organization
					</p>
				</div>

				<div className="flex gap-3">
					<div className="flex border rounded-md overflow-hidden">
						<Button
							variant={viewMode === "table" ? "default" : "ghost"}
							className="rounded-none px-3"
							onClick={() => setViewMode("table")}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="mr-1"
							>
								<line x1="3" y1="6" x2="21" y2="6"></line>
								<line x1="3" y1="12" x2="21" y2="12"></line>
								<line x1="3" y1="18" x2="21" y2="18"></line>
							</svg>
							Table
						</Button>
						<Button
							variant={viewMode === "cards" ? "default" : "ghost"}
							className="rounded-none px-3"
							onClick={() => setViewMode("cards")}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="mr-1"
							>
								<rect x="3" y="3" width="7" height="7"></rect>
								<rect x="14" y="3" width="7" height="7"></rect>
								<rect x="3" y="14" width="7" height="7"></rect>
								<rect x="14" y="14" width="7" height="7"></rect>
							</svg>
							Cards
						</Button>
					</div>

					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
						<Input
							className="pl-9"
							placeholder="Search teams..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>

					<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
						<DialogTrigger asChild>
							<Button>
								<PlusCircle className="h-4 w-4 mr-2" />
								New Team
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Create New Team</DialogTitle>
								<DialogDescription>
									Add a new team to your organization structure.
								</DialogDescription>
							</DialogHeader>

							<div className="grid gap-4 py-4">
								<div className="grid gap-2">
									<label htmlFor="name" className="text-sm font-medium text-gray-700">
										Team Name
									</label>
									<Input
										id="name"
										value={newTeamName}
										onChange={(e) => setNewTeamName(e.target.value)}
										placeholder="e.g., Marketing Team"
									/>
								</div>

								<div className="grid gap-2">
									<label
										htmlFor="description"
										className="text-sm font-medium text-gray-700"
									>
										Description
									</label>
									<Input
										id="description"
										value={newTeamDescription}
										onChange={(e) => setNewTeamDescription(e.target.value)}
										placeholder="Team responsible for marketing activities"
									/>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div className="grid gap-2">
										<label htmlFor="color" className="text-sm font-medium text-gray-700">
											Team Color
										</label>
										<div className="flex gap-2">
											<input
												type="color"
												id="color"
												value={newTeamColor}
												onChange={(e) => setNewTeamColor(e.target.value)}
												className="h-10 w-10 p-0 border-0"
											/>
											<Input
												value={newTeamColor}
												onChange={(e) => setNewTeamColor(e.target.value)}
												className="w-full"
											/>
										</div>
									</div>

									<div className="grid gap-2">
										<label htmlFor="icon" className="text-sm font-medium text-gray-700">
											Team Icon
										</label>
										<Select value={newTeamIcon} onValueChange={setNewTeamIcon}>
											<SelectTrigger id="icon">
												<SelectValue placeholder="Select icon" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="building">Building</SelectItem>
												<SelectItem value="code-box">Code Box</SelectItem>
												<SelectItem value="line-chart">Line Chart</SelectItem>
												<SelectItem value="users">Users</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>

								<div className="grid gap-2">
									<label htmlFor="parent" className="text-sm font-medium text-gray-700">
										Parent Team (Optional)
									</label>
									<Select value={newTeamParent} onValueChange={setNewTeamParent}>
										<SelectTrigger id="parent">
											<SelectValue placeholder="Select parent team" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="none">None</SelectItem>
											{teams?.map((team) => (
												<SelectItem key={team.id} value={team.id.toString()}>
													{team.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>

							<DialogFooter>
								<Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
									Cancel
								</Button>
								<Button onClick={handleCreateTeam}>Create Team</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{/* Quick Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center">
							<div className="p-2 bg-blue-100 rounded-md">
								<Users className="h-6 w-6 text-blue-600" />
							</div>
							<div className="ml-4">
								<p className="text-sm text-gray-600">Total Teams</p>
								<p className="text-2xl font-bold text-gray-900">
									{teamsLoading ? <Skeleton className="h-8 w-12" /> : totalTeams}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center">
							<div className="p-2 bg-green-100 rounded-md">
								<Building className="h-6 w-6 text-green-600" />
							</div>
							<div className="ml-4">
								<p className="text-sm text-gray-600">Total Members</p>
								<p className="text-2xl font-bold text-gray-900">
									{teamsLoading ? (
										<Skeleton className="h-8 w-12" />
									) : needsAuth ? (
										<span className="text-sm text-gray-500">Login required</span>
									) : (
										totalMembers
									)}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center">
							<div className="p-2 bg-orange-100 rounded-md">
								<Target className="h-6 w-6 text-orange-600" />
							</div>
							<div className="ml-4">
								<p className="text-sm text-gray-600">Active Objectives</p>
								<p className="text-2xl font-bold text-gray-900">
									{teamsLoading ? (
										<Skeleton className="h-8 w-12" />
									) : needsAuth ? (
										<span className="text-sm text-gray-500">Login required</span>
									) : (
										activeObjectives
									)}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center">
							<div className="p-2 bg-purple-100 rounded-md">
								<div className="h-6 w-6 text-purple-600 flex items-center justify-center font-bold">
									%
								</div>
							</div>
							<div className="ml-4">
								<p className="text-sm text-gray-600">Avg Progress</p>
								<p className="text-2xl font-bold text-gray-900">
									{teamsLoading ? (
										<Skeleton className="h-8 w-12" />
									) : needsAuth ? (
										<span className="text-sm text-gray-500">Login required</span>
									) : (
										`${averageProgress}%`
									)}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Main content - Cards or Table view */}
			{teamsLoading ? (
				<div className="space-y-4">
					<Skeleton className="h-48 w-full" />
					<Skeleton className="h-48 w-full" />
				</div>
			) : (
				<>
					{viewMode === "table" ? (
						<DataTable
							columns={columns}
							data={filteredTeams || []}
							searchColumn="name"
							searchPlaceholder="Search teams..."
							tableTitle="All Teams"
						/>
					) : viewMode === "cards" ? (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
							{filteredTeams?.map((team) => (
								<TeamCard key={team.id} team={team} onClick={handleTeamClick} />
							))}
							{filteredTeams?.length === 0 && (
								<div className="col-span-full text-center p-8">
									<h3 className="text-lg font-medium">No teams found</h3>
									<p className="text-muted-foreground mt-1">
										Try adjusting your search criteria.
									</p>
								</div>
							)}
						</div>
					) : null}
				</>
			)}

			{/* Team details dialog removed - now using dedicated team detail page at /teams/:id */}

			{/* Teams grid */}
			{teamsLoading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{[1, 2, 3, 4, 5, 6].map((i) => (
						<Card key={i} className="animate-pulse">
							<CardContent className="p-0">
								<div className="p-5 border-b border-gray-200">
									<div className="flex items-center mb-4">
										<div className="rounded-full bg-slate-200 h-10 w-10 mr-3"></div>
										<div className="space-y-2">
											<div className="h-4 bg-slate-200 rounded w-24"></div>
											<div className="h-3 bg-slate-200 rounded w-16"></div>
										</div>
									</div>

									<div className="flex items-center justify-between mb-2">
										<div className="h-3 bg-slate-200 rounded w-16"></div>
										<div className="h-3 bg-slate-200 rounded w-8"></div>
									</div>
									<div className="h-2 bg-slate-200 rounded"></div>
								</div>

								<div className="p-5">
									<div className="flex items-center justify-between mb-3">
										<div className="h-3 bg-slate-200 rounded w-20"></div>
										<div className="h-3 bg-slate-200 rounded w-12"></div>
									</div>

									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<div className="h-3 bg-slate-200 rounded w-40"></div>
											<div className="h-5 bg-slate-200 rounded w-12"></div>
										</div>
										<div className="flex items-center justify-between">
											<div className="h-3 bg-slate-200 rounded w-36"></div>
											<div className="h-5 bg-slate-200 rounded w-12"></div>
										</div>
									</div>

									<div className="h-9 bg-slate-200 rounded mt-4"></div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			) : filteredTeams && filteredTeams.length === 0 ? (
				<Alert>
					<AlertCircle className="h-4 w-4" />
					<AlertTitle>No teams found</AlertTitle>
					<AlertDescription>
						{searchQuery
							? `No teams matching "${searchQuery}" were found. Try a different search.`
							: "No teams have been created yet. Create a new team to get started."}
					</AlertDescription>
				</Alert>
			) : null}
		</>
	);
};

export default TeamsDisplay;
