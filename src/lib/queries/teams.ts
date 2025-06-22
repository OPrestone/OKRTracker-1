"use server";

import db from "@/util/db";
import { InsertTeam, Team, teams, User, users } from "@/util/schema";
import { eq } from "drizzle-orm";
import { getUserById } from "./users";

export async function getTeamById(teamId: string): Promise<Team | undefined> {
	const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
	return team;
}

export async function addUserToTeam(
	userId: string,
	teamId: string,
	tenantId: string
): Promise<User | { error: string; code: number }> {
	try {
		// First check if user and team exist
		const user = await getUserById(userId);
		if (!user) {
			return { error: `User with id ${userId} not found`, code: 404 };
		}

		if (user.tenantId !== tenantId) {
			return {
				error: `User with id ${userId} does not belong to tenant ${tenantId}`,
				code: 403,
			};
		}

		const team = await getTeamById(teamId);
		if (!team) {
			return { error: `Team with id ${teamId} not found`, code: 404 };
		}
		if (team.tenantId !== tenantId) {
			return {
				error: `Team with id ${teamId} does not belong to tenant ${tenantId}`,
				code: 403,
			};
		}

		// Update the user's team
		const [updatedUser] = await db
			.update(users)
			.set({
				teamId: teamId,
			})
			.where(eq(users.id, userId))
			.returning();

		if (!updatedUser) {
			return { error: `Failed to update team for user ${userId}`, code: 500 };
		}

		return updatedUser;
	} catch (error) {
		console.error("Error adding user to team:", error);
		return { error: "Failed to add user to team", code: 500 };
	}
}

export async function setTeamLeader(
	teamId: string,
	userId: string,
	tenantId: string
): Promise<Team | { error: string; code: number }> {
	try {
		// First check if user and team exist
		const user = await getUserById(userId);
		if (!user) {
			return { error: `User with id ${userId} not found`, code: 404 };
		}

		if (user.tenantId !== tenantId) {
			return {
				error: `User with id ${userId} does not belong to tenant ${tenantId}`,
				code: 403,
			};
		}

		const team = await getTeamById(teamId);
		if (!team) {
			return { error: `Team with id ${teamId} not found`, code: 404 };
		}
		if (team.tenantId !== tenantId) {
			return {
				error: `Team with id ${teamId} does not belong to tenant ${tenantId}`,
				code: 403,
			};
		}

		// Update the user's team leader status
		const [updatedTeam] = await db
			.update(teams)
			.set({
				leaderId: user.id, // Set the team leader ID to the user ID
			})
			.where(eq(teams.id, teamId))
			.returning();

		if (!updatedTeam) {
			return { error: `Failed to set team leader for team ${teamId}`, code: 500 };
		}

		return updatedTeam;
	} catch (error) {
		console.error("Error setting team leader:", error);
		return { error: "Failed to set team leader", code: 500 };
	}
}

export async function createTeam(
	teamData: InsertTeam,
	tenantId: string
): Promise<Team | { error: string; code: number }> {
	try {
		// Check if a team with the same name already exists
		const existingTeam = await db
			.select()
			.from(teams)
			.where(eq(teams.tenantId, tenantId));

		const teamExists = existingTeam.some(
			(team) => team.name.toLowerCase() === teamData.name.toLowerCase()
		);

		if (teamExists) {
			return {
				error: `Team with name ${teamData.name} already exists`,
				code: 409,
			};
		}

		const [newTeam] = await db
			.insert(teams)
			.values({ ...teamData, tenantId }) // Ensure tenantId is set
			.returning();

		return newTeam;
	} catch (error) {
		console.error("Error creating team:", error);
		return { error: "Failed to create team", code: 500 };
	}
}

export async function createTeamBatch(
	// teamsData: Omit<Team, "id" | "createdAt" | "updatedAt">[],
	teamsData: InsertTeam[],
	tenantId: string
): Promise<Team[] | { error: string; code: number }> {
	if (!Array.isArray(teamsData) || teamsData.length === 0) {
		return { error: "No teams data provided", code: 400 };
	}

	const skippedTeams = [];
	const createdTeams = [];

	const existingTeams = await db
		.select()
		.from(teams)
		.where(eq(teams.tenantId, tenantId));

	const existingTeamNames = new Set(
		existingTeams.map((team) => team.name.toLowerCase())
	);

	for (const teamData of teamsData) {
		if (existingTeamNames.has(teamData.name.toLowerCase())) {
			console.log(`Team with name ${teamData.name} already exists. Skipping...`);
			skippedTeams.push(teamData.name);
			continue; // Skip this team if it already exists
		}

		try {
			const [newTeams] = await db
				.insert(teams)
				.values({ ...teamData, tenantId }) // Ensure tenantId is set
				.returning();

			createdTeams.push(newTeams);
			existingTeamNames.add(newTeams.name.toLowerCase()); // Update the set with the new team name
		} catch (error) {
			console.error("Error creating team batch:", error);
			return { error: "Failed to create team batch", code: 500 };
		}
	}
	console.log(
		`Created ${createdTeams.length} teams, skipped ${skippedTeams.length} teams`
	);
	if (skippedTeams.length > 0) {
		console.log(`Skipped teams: ${skippedTeams.join(", ")}`);
	}
	return createdTeams;
}

export async function getTeams(
	tenantId: string
): Promise<Team[] | { error: string; code: number }> {
	try {
		const teamsList = await db
			.select()
			.from(teams)
			.where(eq(teams.tenantId, tenantId));

		return teamsList;
	} catch (error) {
		console.error("Error fetching teams:", error);
		return { error: "Failed to fetch teams", code: 500 };
	}
}

export async function getTeam(
	teamId: string
): Promise<Team | { error: string; code: number }> {
	try {
		const [team] = await db.select().from(teams).where(eq(teams.id, teamId));

		if (!team) {
			return { error: `Team with id ${teamId} not found`, code: 404 };
		}

		return team;
	} catch (error) {
		console.error("Error fetching team:", error);
		return { error: "Failed to fetch team", code: 500 };
	}
}

export async function getTeamMembers(
	teamId: string
): Promise<User[] | { error: string; code: number }> {
	try {
		const members = await db.select().from(users).where(eq(users.teamId, teamId));

		return members;
	} catch (error) {
		console.error("Error fetching team members:", error);
		return { error: "Failed to fetch team members", code: 500 };
	}
}
