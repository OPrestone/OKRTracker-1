"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TenantContext } from "@/contexts/TenantContext";
import { UserContext } from "@/contexts/UserContext";
import { UserPermissions } from "@/lib/actions";
import { getAllObjectivesFullDetail } from "@/lib/queries/objectives";
import { Tenant } from "@/util/schema";
import { useQuery } from "@tanstack/react-query";
import {
	Activity,
	BarChart3,
	Building,
	Circle,
	Filter,
	Loader2,
	Plus,
	Search,
	Target,
	TrendingUp,
	Trophy,
	Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";

// Strategic areas for filtering
const STRATEGIC_AREAS = [
	{
		value: "growth",
		label: "Growth & Expansion",
		icon: <TrendingUp className="h-4 w-4" />,
	},
	{
		value: "innovation",
		label: "Innovation & Technology",
		icon: <BarChart3 className="h-4 w-4" />,
	},
	{
		value: "operational",
		label: "Operational Excellence",
		icon: <Target className="h-4 w-4" />,
	},
	{
		value: "financial",
		label: "Financial Performance",
		icon: <Trophy className="h-4 w-4" />,
	},
	{
		value: "people",
		label: "People & Culture",
		icon: <Users className="h-4 w-4" />,
	},
	{
		value: "customer",
		label: "Customer Success",
		icon: <Building className="h-4 w-4" />,
	},
];

export default function CompanyOkrsDisplay() {
	const router = useRouter();
	const { user, permissions } = useContext(UserContext) as UserPermissions;
	const tenant = useContext(TenantContext) as Tenant;

	// State for filtering and searching
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedTab, setSelectedTab] = useState("all");
	const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
	const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
	const [selectedTimeframes, setSelectedTimeframes] = useState<string[]>([]);

	// Use the auth context from above
	const isAuthenticated = !!user;

	// Fetch company goals (company-level objectives)
	const {
		data: companyGoals = [],
		isLoading,
		error,
	} = useQuery({
		queryKey: ["objectives-company", tenant.id],
		queryFn: async () => {
			const objective = await getAllObjectivesFullDetail(tenant.id, "company");
			if ("error" in objective) throw new Error(objective.error);
			return objective;
		},
	});

	// Fetch aligned team OKRs for count display
	const { data: allOKRs = [] } = useQuery({
		queryKey: ["objectives-team", tenant.id],
		queryFn: async () => {
			const objective = await getAllObjectivesFullDetail(tenant.id, "team");
			if ("error" in objective) throw new Error(objective.error);
			return objective;
		},
	});

	// Filter company goals based on criteria
	const filteredCompanyGoals = companyGoals
		.filter((goal) => {
			// Search filter
			const searchLower = searchQuery.toLowerCase();
			return (
				searchQuery === "" ||
				goal.objectives.title.toLowerCase().includes(searchLower) ||
				goal.objectives.description?.toLowerCase().includes(searchLower) ||
				false
			);
		})
		.filter((goal) => {
			// Strategic area filter
			if (selectedAreas.length === 0) return true;
			return selectedAreas.includes(goal.strategic_intents?.title || "");
			//   return selectedAreas.includes(goal.strategicDirection || '');
		})
		.filter((goal) => {
			// Status filter
			if (selectedStatuses.length === 0) return true;
			return selectedStatuses.includes(goal.objectives.status);
		})
		.filter((goal) => {
			// Tab filter
			if (selectedTab === "all") return true;
			if (selectedTab === "current") {
				// Show goals in current timeframe
				return goal.timeframes?.name?.toLowerCase().includes("q");
			}
			if (selectedTab === "in-progress") {
				return goal.objectives.status === "active";
				// return goal.objectives.status === 'on_track' || goal.status === 'at_risk';
			}
			if (selectedTab === "completed") {
				return goal.objectives.status === "completed";
			}
			return true;
		});

	// Get all available statuses from company goals
	const availableStatuses = companyGoals.length
		? Array.from(
				new Set(companyGoals.map((goal) => goal.objectives.status))
		  ).sort((a, b) => {
				const order = ["not_started", "on_track", "at_risk", "behind", "completed"];
				return order.indexOf(a) - order.indexOf(b);
		  })
		: [];

	// Helper function to get status color
	const getStatusColor = (status: string) => {
		switch (status) {
			case "on_track":
				return "border-green-200 text-green-700 bg-green-50";
			case "at_risk":
				return "border-yellow-200 text-yellow-700 bg-yellow-50";
			case "behind":
				return "border-red-200 text-red-700 bg-red-50";
			case "completed":
				return "border-blue-200 text-blue-700 bg-blue-50";
			case "not_started":
				return "border-gray-200 text-gray-700 bg-gray-50";
			default:
				return "border-gray-200 text-gray-700 bg-gray-50";
		}
	};

	return (
		<>
			{/* Header Section */}
			<div className="mb-8">
				<div className="flex items-center justify-between mb-4">
					<div>
						<h1 className="text-3xl font-bold text-gray-900">Company Goals</h1>
						<p className="text-gray-600 mt-2">
							Strategic objectives that drive organizational success and alignment
						</p>
					</div>

					<div className="flex items-center gap-4">
						<Badge variant="outline" className="px-3 py-1">
							{filteredCompanyGoals.length} goal
							{filteredCompanyGoals.length !== 1 ? "s" : ""}
						</Badge>

						{filteredCompanyGoals.length > 0 && (
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<Activity className="h-4 w-4" />
								<span>
									{Math.round(
										filteredCompanyGoals.reduce(
											(sum, goal) => sum + (goal.objectives.progress || 0),
											0
										) / filteredCompanyGoals.length
									)}
									% avg progress
								</span>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Search and Filters */}
			<div className="flex flex-col md:flex-row gap-4 mb-6">
				<div className="flex-1">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
						<Input
							placeholder="Search company goals..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-10"
						/>
					</div>
				</div>

				<div className="flex gap-2">
					{/* Strategic Areas Filter */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm">
								<Filter className="h-4 w-4 mr-2" />
								Strategic Areas
								{selectedAreas.length > 0 && (
									<Badge variant="secondary" className="ml-2">
										{selectedAreas.length}
									</Badge>
								)}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56">
							<DropdownMenuLabel>Filter by Strategic Area</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{STRATEGIC_AREAS.map((area) => (
								<DropdownMenuCheckboxItem
									key={area.value}
									checked={selectedAreas.includes(area.value)}
									onCheckedChange={(checked) => {
										if (checked) {
											setSelectedAreas([...selectedAreas, area.value]);
										} else {
											setSelectedAreas(selectedAreas.filter((a) => a !== area.value));
										}
									}}
								>
									<div className="flex items-center gap-2">
										{area.icon}
										{area.label}
									</div>
								</DropdownMenuCheckboxItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>

					{/* Status Filter */}
					{availableStatuses.length > 0 && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="sm">
									<Circle className="h-4 w-4 mr-2" />
									Status
									{selectedStatuses.length > 0 && (
										<Badge variant="secondary" className="ml-2">
											{selectedStatuses.length}
										</Badge>
									)}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
								<DropdownMenuSeparator />
								{availableStatuses.map((status) => (
									<DropdownMenuCheckboxItem
										key={status}
										checked={selectedStatuses.includes(status)}
										onCheckedChange={(checked) => {
											if (checked) {
												setSelectedStatuses([...selectedStatuses, status]);
											} else {
												setSelectedStatuses(selectedStatuses.filter((s) => s !== status));
											}
										}}
									>
										<div className="flex items-center gap-2">
											<Circle
												className={`h-3 w-3 fill-current ${
													getStatusColor(status).split(" ")[1]
												}`}
											/>
											{status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
										</div>
									</DropdownMenuCheckboxItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>

				{permissions.canCreateCompanyObjectives && (
					<Button
						onClick={() => router.push(`/${tenant.id}/create-company-goal`)}
						className="flex items-center gap-2 bg-primary text-white hover:bg-primary/90"
					>
						<Plus className="h-4 w-4" />
						Create Company Goal
					</Button>
				)}
			</div>

			{isAuthenticated && (
				<Tabs
					value={selectedTab}
					onValueChange={setSelectedTab}
					className="w-full mb-6"
				>
					<TabsList>
						<TabsTrigger value="all">All Goals</TabsTrigger>
						<TabsTrigger value="current">Current Period</TabsTrigger>
						<TabsTrigger value="in-progress">In Progress</TabsTrigger>
						<TabsTrigger value="completed">Completed</TabsTrigger>
					</TabsList>

					<TabsContent value="all" className="mt-4">
						<p className="text-sm text-gray-500 mb-4">
							Showing all company-level strategic goals across all timeframes
						</p>
					</TabsContent>

					<TabsContent value="current" className="mt-4">
						<p className="text-sm text-gray-500 mb-4">
							Showing goals for the current strategic period
						</p>
					</TabsContent>

					<TabsContent value="in-progress" className="mt-4">
						<p className="text-sm text-gray-500 mb-4">
							Showing goals that are actively being pursued
						</p>
					</TabsContent>

					<TabsContent value="completed" className="mt-4">
						<p className="text-sm text-gray-500 mb-4">Showing completed objectives</p>
					</TabsContent>
				</Tabs>
			)}

			{!isAuthenticated ? (
				<Card className="border-2 border-dashed border-primary/20">
					<CardHeader>
						<CardTitle>Authentication Required</CardTitle>
						<CardDescription>
							You need to log in to view company objectives and key results.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col items-center justify-center py-6">
						<div className="mb-4 p-4 bg-primary/5 rounded-full">
							<Loader2 className="h-12 w-12 text-primary" />
						</div>
						<p className="text-center text-muted-foreground mb-6 max-w-md">
							Company OKRs provide organization-wide visibility into key objectives and
							their progress. Log in to track, monitor, and contribute to company
							goals.
						</p>
						<div className="flex gap-4">
							<Button variant="default" size="lg" onClick={() => router.push("/auth")}>
								Log in
							</Button>
							<Button variant="outline" size="lg" onClick={() => router.push("/")}>
								Back to Dashboard
							</Button>
						</div>
						<div className="mt-4 text-sm text-muted-foreground">
							<p>
								Default admin login: <span className="font-mono">admin</span> /{" "}
								<span className="font-mono">admin123</span>
							</p>
						</div>
					</CardContent>
				</Card>
			) : isLoading ? (
				<div className="flex justify-center items-center py-20">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
					<span className="ml-2">Loading objectives...</span>
				</div>
			) : error ? (
				<Card>
					<CardHeader>
						<CardTitle>Error loading objectives</CardTitle>
						<CardDescription>
							There was a problem fetching the company objectives.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-red-500">
							{error instanceof Error ? error.message : "An unknown error occurred"}
						</p>
						<Button className="mt-4" onClick={() => window.location.reload()}>
							Retry
						</Button>
					</CardContent>
				</Card>
			) : filteredCompanyGoals.length > 0 ? (
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{filteredCompanyGoals.map((goal) => {
						// Calculate aligned team OKRs for this company goal
						const alignedOKRs = allOKRs.filter(
							(okr) => okr.objectives.alignmentTargetId === goal.objectives.id
						);

						return (
							<Card
								key={goal.objectives.id}
								className="shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
								onClick={(e) => {
									// Prevent navigation if clicking on buttons inside the card
									if ((e.target as HTMLElement).closest("button")) return;
									router.push(`/${tenant.id}/company-goal/${goal.objectives.id}`);
								}}
							>
								<CardHeader className="pb-3">
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<Badge
												variant="outline"
												className={`mb-2 ${getStatusColor(goal.objectives.status)}`}
											>
												<Circle className="h-3 w-3 mr-1 fill-current" />
												{goal.objectives.status
													.replace("_", " ")
													.replace(/\b\w/g, (l) => l.toUpperCase())}
											</Badge>
											<CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
												{goal.objectives.title}
											</CardTitle>
											<CardDescription className="line-clamp-3 mt-2">
												{goal.objectives.description || "No description provided"}
											</CardDescription>
										</div>
										<div className="flex flex-col items-end gap-1 ml-4">
											<Target className="h-5 w-5 text-primary" />
											<span className="text-xs text-muted-foreground">Company Goal</span>
										</div>
									</div>
								</CardHeader>
								<CardContent className="space-y-3">
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">Timeframe:</span>
										<Badge variant="secondary">
											{goal.timeframes?.name || "No timeframe"}
										</Badge>
									</div>

									{/* {goal.strategic_intents?.title && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Strategic Area:</span>
                      <Badge variant="outline">
                        {STRATEGIC_AREAS.find(area => area.value === goal.strategicDirection)?.label || goal.strategicDirection}
                      </Badge>
                    </div>
                  )} */}

									{/* {(() => {
                    // Collect all key results from aligned team objectives
                    const allTeamKeyResults = alignedOKRs.flatMap(okr => 
                      okr.keyResults?.map(kr => ({
                        ...kr,
                        teamName: okr.teamName,
                        objectiveTitle: okr.title
                      })) || []
                    );
                    
                    return allTeamKeyResults.length > 0 ? (
                      <div className="space-y-2 text-sm">
                        <span className="text-muted-foreground font-medium">Team Key Results:</span>
                        <ul className="space-y-2">
                          {allTeamKeyResults.slice(0, 3).map((keyResult, index) => (
                            <li key={`${keyResult.id}-${index}`} className="bg-gray-50 p-2 rounded text-xs">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-gray-900 truncate">{keyResult.title}</span>
                                <div className="flex items-center gap-1 ml-2">
                                  <span className="text-xs font-medium">{keyResult.progress}%</span>
                                  <div className="w-8 h-1 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-primary transition-all" 
                                      style={{ width: `${keyResult.progress}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-gray-500">
                                <Badge variant="outline" className="text-[10px] px-1 py-0">
                                  {keyResult.teamName}
                                </Badge>
                                <span className="text-[10px] truncate">{keyResult.objectiveTitle}</span>
                              </div>
                            </li>
                          ))}
                          {allTeamKeyResults.length > 3 && (
                            <li className="text-xs text-muted-foreground text-center py-1">
                              +{allTeamKeyResults.length - 3} more key results from teams
                            </li>
                          )}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No team key results aligned to this goal</p>
                    );
                  })()} */}
								</CardContent>
								<CardFooter className="pt-2 flex justify-between">
									<div className="flex gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												router.push(`${tenant.id}/company-goal/${goal.objectives.id}`)
											}
										>
											<Target className="h-4 w-4 mr-1" />
											View Details
										</Button>
										{alignedOKRs.length > 0 && (
											<Badge variant="outline" className="text-xs">
												{alignedOKRs.length} Aligned OKR{alignedOKRs.length > 1 ? "s" : ""}
											</Badge>
										)}
									</div>
									<div className="flex items-center gap-2">
										<span className="text-sm font-medium text-muted-foreground">
											{goal.objectives.progress || 0}%
										</span>
										<Progress value={goal.objectives.progress || 0} className="w-16" />
									</div>
								</CardFooter>
							</Card>
						);
					})}
				</div>
			) : (
				<Card className="border-2 border-dashed border-gray-200">
					<CardHeader>
						<CardTitle>No Company Goals Found</CardTitle>
						<CardDescription>
							There are no company goals matching your current filters.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col items-center justify-center py-6">
						<div className="mb-4 p-4 bg-primary/5 rounded-full">
							<Building className="h-12 w-12 text-primary" />
						</div>
						<p className="text-center text-muted-foreground mb-6 max-w-md">
							Company goals help align organization-wide strategic objectives and track
							high-level initiatives. Create your first company goal to get started.
						</p>
						<div className="flex gap-4">
							{permissions.canCreateCompanyObjectives && (
								<Button
									onClick={() => router.push(`/${tenant.id}/create-company-goal`)}
									className="flex items-center gap-2"
								>
									<Plus className="h-4 w-4" />
									Create Company Goal
								</Button>
							)}
							<Button
								variant="outline"
								onClick={() => {
									setSelectedAreas([]);
									setSelectedStatuses([]);
									setSelectedTimeframes([]);
								}}
							>
								Clear Filters
							</Button>
						</div>
					</CardContent>
				</Card>
			)}
		</>
	);
}
