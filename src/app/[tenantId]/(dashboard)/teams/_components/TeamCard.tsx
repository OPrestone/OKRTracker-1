"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getObjectivesByTeam } from "@/lib/queries/objectives";
import { getTeamMembers } from "@/lib/queries/teams";
import { Objective, Team, User } from "@/util/schema";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";

const TeamCard = ({
	team,
	onClick,
}: {
	team: Team;
	onClick: (team: Team) => void;
}) => {
	// Get team members - include the tenant ID in the query
	const { data: members } = useQuery<User[]>({
		queryKey: [team.id, "users"],
		queryFn: async () => {
			const teamMembers = await getTeamMembers(team.id);
			if ("error" in teamMembers) {
				console.error("Error fetching team members:", teamMembers.error);
				throw new Error(teamMembers.error);
			}
			return teamMembers || [];
		},
	});

	// Use the TeamObjective interface defined above

	// Get objectives for the team with better error handling and fallback logic
	const { data: objectives, isError: objectivesError } = useQuery<Objective[]>({
		queryKey: [team.id, "objectives"],
		queryFn: async () => {
			if (!team.tenantId)
				throw new Error("Team tenantId is required to fetch objectives");
			const teamObjectives = await getObjectivesByTeam(team.id, team.tenantId);
			if ("error" in teamObjectives) {
				console.error("Error fetching team members:", teamObjectives.error);
				throw new Error(teamObjectives.error);
			}
			return teamObjectives || [];
		},
	});

	// Calculate progress as average of objectives or default to 0
	// Use an empty array fallback for objectives to prevent errors
	const objectivesArray = objectives || [];
	const progress =
		objectivesArray.length > 0
			? objectivesArray.reduce(
					(sum: number, obj: Objective) =>
						sum + (typeof obj.progress === "number" ? obj.progress : 0),
					0
			  ) / objectivesArray.length
			: 0;

	// Get team color or default
	const teamColor = team.color || "#3B82F6";

	// Icon based on the team's icon property or default
	const getTeamIcon = () => {
		switch (team.icon?.toLowerCase()) {
			case "building":
				return <Users className="text-lg" style={{ color: teamColor }} />;
			default:
				return <Users className="text-lg" style={{ color: teamColor }} />;
		}
	};

	return (
		<Card>
			<CardContent className="p-0">
				<div className="p-5 border-b border-gray-200">
					<div className="flex items-center mb-4">
						<div
							className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
							style={{ backgroundColor: `${teamColor}20` }} // Use color with transparency
						>
							{getTeamIcon()}
						</div>
						<div>
							<h3 className="font-semibold">{team.name}</h3>
							<p className="text-sm text-gray-500">{members?.length || 0} members</p>
						</div>
					</div>

					<div className="flex items-center justify-between mb-2">
						<span className="text-sm font-medium">Progress</span>
						<span className="text-sm font-medium">{Math.round(progress)}%</span>
					</div>
					<Progress value={progress} className="h-2" />
				</div>

				<div className="p-5">
					<div className="flex items-center justify-between mb-3">
						<span className="text-sm font-medium">Objectives</span>
						<span className="text-xs font-medium text-gray-500">
							{objectives?.length || 0} total
						</span>
					</div>

					{objectives && objectives.length > 0 ? (
						<div className="text-sm">
							{objectivesArray
								.slice(0, 3)
								.map((objective: Objective, index: number) => (
									<div
										key={objective.id}
										className={`flex items-center justify-between mb-2 pb-2 ${
											index < objectivesArray.length - 1 ? "border-b border-gray-100" : ""
										}`}
									>
										<span>{objective.title || "Untitled Objective"}</span>
										<Badge
											variant="outline"
											className={
												objective.progress >= 75
													? "bg-green-100 text-green-800 hover:bg-green-100"
													: objective.progress >= 50
													? "bg-blue-100 text-blue-800 hover:bg-blue-100"
													: objective.progress >= 25
													? "bg-amber-100 text-amber-800 hover:bg-amber-100"
													: "bg-red-100 text-red-800 hover:bg-red-100"
											}
										>
											{objective.progress || 0}%
										</Badge>
									</div>
								))}

							{objectives.length > 3 && (
								<div className="text-center mt-2 text-primary text-xs">
									+ {objectives.length - 3} more objectives
								</div>
							)}
						</div>
					) : (
						<div className="text-center py-3 text-gray-500 text-sm">
							No objectives found for this team
						</div>
					)}

					<Button
						variant="outline"
						className="mt-4 w-full"
						onClick={() => onClick(team)}
					>
						View Team Details
					</Button>

					{/* Debug section */}
					<div className="mt-4 p-2 bg-gray-100 rounded-md text-xs">
						<details>
							<summary className="font-bold cursor-pointer">
								Debug: Team Objectives
							</summary>
							<pre className="overflow-auto max-h-60 p-2 mt-2 bg-gray-200 rounded">
								{JSON.stringify(objectives, null, 2)}
							</pre>
						</details>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

export default TeamCard;
