"use server";

import db from "@/util/db";
import { InsertObjective, Objective, objectives } from "@/util/schema";
import { and, eq } from "drizzle-orm";

export async function getAllObjectives(
	tenantId: string
): Promise<Objective[] | { error: string; code: number }> {
	try {
		const allObjectives = await db
			.select()
			.from(objectives)
			.where(eq(objectives.tenantId, tenantId));

		return allObjectives;
	} catch (error) {
		console.error("Error getting all objectives:", error);
		return { error: "Failed to get all objectives", code: 500 };
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
