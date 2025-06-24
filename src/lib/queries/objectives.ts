"use server";

import db from "@/util/db";
import {
	InsertObjective,
	Objective,
	objectives,
	StrategicDirection,
	strategicDirections,
	Team,
	teams,
	Timeframe,
	timeframes,
	User,
	users,
} from "@/util/schema";
import { and, eq } from "drizzle-orm";

export async function getAllObjectives(
	tenantId: string,
	level?: "company" | "team"
): Promise<Objective[] | { error: string; code: number }> {
	try {
		const whereClause = level
			? and(eq(objectives.tenantId, tenantId), eq(objectives.level, level))
			: eq(objectives.tenantId, tenantId);

		const allObjectives = await db.select().from(objectives).where(whereClause);

		return allObjectives;
	} catch (error) {
		console.error("Error getting all objectives:", error);
		return { error: "Failed to get all objectives", code: 500 };
	}
}

export async function getAllObjectivesFullDetail(
	tenantId: string,
	level?: "company" | "team"
): Promise<
	| {
			objectives: Objective;
			users: User | null;
			timeframes: Timeframe | null;
			teams: Team | null;
			strategic_intents: StrategicDirection | null;
	  }[]
	| { error: string; code: number }
> {
	try {
		const whereClause = level
			? and(eq(objectives.tenantId, tenantId), eq(objectives.level, level))
			: and(eq(objectives.tenantId, tenantId));
		const allObjectives = await db
			.select()
			.from(objectives)
			.where(whereClause)
			.leftJoin(timeframes, eq(objectives.timeframeId, timeframes.id))
			.leftJoin(teams, eq(objectives.teamId, teams.id))
			.leftJoin(users, eq(teams.ownerId, users.id))
			.leftJoin(
				strategicDirections,
				eq(objectives.strategyId, strategicDirections.id)
			);
		return allObjectives;
	} catch (error) {
		console.error("Error getting objective by ID:", error);
		return { error: "Failed to get objective by ID", code: 500 };
	}
}

export async function getAllObjectivesTeam(
	tenantId: string
): Promise<Objective[] | { error: string; code: number }> {
	try {
		const allObjectives = await db
			.select()
			.from(objectives)
			.where(and(eq(objectives.tenantId, tenantId), eq(objectives.level, "team")));

		return allObjectives;
	} catch (error) {
		console.error("Error getting all company objectives:", error);
		return { error: "Failed to get all company objectives", code: 500 };
	}
}

export async function getObjectiveById(
	objectiveId: string,
	tenantId: string
): Promise<Objective | { error: string; code: number }> {
	try {
		console.log("Fetching objective by ID:", objectiveId, tenantId);
		const [objective] = await db
			.select()
			.from(objectives)
			.where(
				and(eq(objectives.id, objectiveId), eq(objectives.tenantId, tenantId))
			);
		if (!objective) {
			return { error: "Objective not found", code: 404 };
		}
		return objective;
	} catch (error) {
		console.error("Error getting objective by ID:", error);
		return { error: "Failed to get objective by ID", code: 500 };
	}
}

export async function getObjectiveByIdFullDetail(
	objectiveId: string,
	tenantId: string,
	level?: "company" | "team"
): Promise<
	| {
			objectives: Objective;
			users: User | null;
			timeframes: Timeframe | null;
			teams: Team | null;
	  }
	| { error: string; code: number }
> {
	try {
		const whereClause = level
			? and(
					eq(objectives.id, objectiveId),
					eq(objectives.tenantId, tenantId),
					eq(objectives.level, level)
			  )
			: and(eq(objectives.id, objectiveId), eq(objectives.tenantId, tenantId));

		console.log("Fetching objective by ID:", objectiveId, tenantId);
		const [objective] = await db
			.select()
			.from(objectives)
			.where(whereClause)
			.leftJoin(timeframes, eq(objectives.timeframeId, timeframes.id))
			.leftJoin(teams, eq(objectives.teamId, teams.id))
			.leftJoin(users, eq(teams.ownerId, users.id));
		if (!objective) {
			return { error: "Objective not found", code: 404 };
		}
		return objective;
	} catch (error) {
		console.error("Error getting objective by ID:", error);
		return { error: "Failed to get objective by ID", code: 500 };
	}
}

export async function getObjectivesByTeam(
	teamId: string,
	tenantId: string
): Promise<Objective[] | { error: string; code: number }> {
	try {
		const teamObjectives = await db
			.select()
			.from(objectives)
			.where(
				and(eq(objectives.teamId, teamId), eq(objectives.tenantId, tenantId))
			);

		return teamObjectives;
	} catch (error) {
		console.error("Error getting objectives by team:", error);
		return { error: "Failed to get objectives by team", code: 500 };
	}
}

export async function createObjective(
	objective: InsertObjective
): Promise<Objective | { error: string; code: number }> {
	try {
		const [newObjective] = await db
			.insert(objectives)
			.values(objective)
			.returning();

		return newObjective;
	} catch (error) {
		console.error("Error creating objective:", error);
		return { error: "Failed to create objective", code: 500 };
	}
}

export async function updateObjective(
	objectiveId: string,
	tenantId: string,
	updates: Partial<InsertObjective>
): Promise<Objective | { error: string; code: number }> {
	try {
		console.log("Updating objective:", objectiveId, tenantId, updates);
		const [updatedObjective] = await db
			.update(objectives)
			.set(updates)
			.where(
				and(eq(objectives.id, objectiveId), eq(objectives.tenantId, tenantId))
			)
			.returning();

		if (!updatedObjective) {
			return { error: "Objective not found", code: 404 };
		}
		return updatedObjective;
	} catch (error) {
		console.error("Error updating objective:", error);
		return { error: "Failed to update objective", code: 500 };
	}
}
