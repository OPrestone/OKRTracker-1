"use server";

import db from "@/util/db";
import {
	InsertKeyResult,
	KeyResult,
	keyResults,
	User,
	users,
} from "@/util/schema";
import { and, eq } from "drizzle-orm";

export async function getAllKeyResults(
	tenantId: string
): Promise<KeyResult[] | { error: string; code: number }> {
	try {
		const allKeyResults = await db
			.select()
			.from(keyResults)
			.where(eq(keyResults.tenantId, tenantId));

		console.log("Fetched all KeyResults:", allKeyResults);
		return allKeyResults;
	} catch (error) {
		console.error("Error getting all KeyResults:", error);
		return { error: "Failed to get all KeyResults", code: 500 };
	}
}

export async function getKeyResultsByObjective(
	objectiveId: string,
	tenantId: string
): Promise<KeyResult[] | { error: string; code: number }> {
	try {
		const keyResultsByObjective = await db
			.select()
			.from(keyResults)
			.where(
				and(
					eq(keyResults.objectiveId, objectiveId),
					eq(keyResults.tenantId, tenantId)
				)
			);

		console.log("Fetched KeyResults for Objective:", keyResultsByObjective);
		return keyResultsByObjective;
	} catch (error) {
		console.error("Error getting KeyResults by Objective:", error);
		return { error: "Failed to get KeyResults by Objective", code: 500 };
	}
}

export async function getKeyResultByObjectiveFull(
	keyResultId: string,
	tenantId: string
): Promise<
	| { key_results: KeyResult; users: User | null }[]
	| { error: string; code: number }
> {
	try {
		const keyResult = await db
			.select()
			.from(keyResults)
			.where(
				and(eq(keyResults.id, keyResultId), eq(keyResults.tenantId, tenantId))
			)
			.leftJoin(users, eq(keyResults.assignedToId, users.id));

		if (!keyResult) {
			return { error: "Key Result not found", code: 404 };
		}

		console.log("Fetched Key Result by ID:", keyResult);
		return keyResult;
	} catch (error) {
		console.error("Error getting Key Result by ID:", error);
		return { error: "Failed to get Key Result by ID", code: 500 };
	}
}

export async function createKeyResult(
	keyResult: InsertKeyResult
): Promise<KeyResult | { error: string; code: number }> {
	try {
		const newKeyResult = await db
			.insert(keyResults)
			.values(keyResult)
			.returning();

		console.log("Created new KeyResult:", newKeyResult);
		return newKeyResult[0];
	} catch (error) {
		console.error("Error creating KeyResult:", error);
		return { error: "Failed to create KeyResult", code: 500 };
	}
}

export async function updateKeyResult(
	keyResultId: string,
	tenantId: string,
	updates: Partial<InsertKeyResult>
): Promise<KeyResult | { error: string; code: number }> {
	try {
		const updatedKeyResult = await db
			.update(keyResults)
			.set(updates)
			.where(
				and(eq(keyResults.id, keyResultId), eq(keyResults.tenantId, tenantId))
			)
			.returning();

		if (updatedKeyResult.length === 0) {
			return { error: "Key Result not found", code: 404 };
		}

		console.log("Updated KeyResult:", updatedKeyResult);
		return updatedKeyResult[0];
	} catch (error) {
		console.error("Error updating Key Result:", error);
		return { error: "Failed to update Key Result", code: 500 };
	}
}

export async function deleteKeyResult(
	keyResultId: string,
	tenantId: string
): Promise<
	{ success: boolean; code: number } | { error: string; code: number }
> {
	try {
		const deletedKeyResult = await db
			.delete(keyResults)
			.where(
				and(eq(keyResults.id, keyResultId), eq(keyResults.tenantId, tenantId))
			)
			.returning();
		if (deletedKeyResult.length === 0) {
			return { error: "Key Result not found", code: 404 };
		}
		console.log("Deleted Key Result:", keyResultId);
		return { success: true, code: 200 };
	} catch (error) {
		console.error("Error deleting Key Result:", error);
		return { error: "Failed to delete Key Result", code: 500 };
	}
}
