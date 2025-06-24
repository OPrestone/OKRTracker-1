"use server";

import db from "@/util/db";
import {
	InsertStrategicDirection,
	StrategicDirection,
	strategicIntents,
} from "@/util/schema";
import { and, eq } from "drizzle-orm";

export async function getStrategicIntents(
	tenantId: string
): Promise<StrategicDirection[] | { error: string; code: number }> {
	try {
		const allStrategicIntents = await db
			.select()
			.from(strategicIntents)
			.where(eq(strategicIntents.tenantId, tenantId));
		return allStrategicIntents;
	} catch (error) {
		console.error("Error fetching strategic intents:", error);
		return { error: "Failed to fetch strategic intents", code: 500 };
	}
}

export async function getStrategicIntentsCompany(
	tenantId: string
): Promise<StrategicDirection | { error: string; code: number }> {
	try {
		const [strategicIntent] = await db
			.select()
			.from(strategicIntents)
			.where(
				and(
					eq(strategicIntents.tenantId, tenantId),
					eq(strategicIntents.type, "company")
				)
			);
		return strategicIntent;
	} catch (error) {
		console.error("Error fetching company strategic intent:", error);
		return { error: "Failed to fetch company strategic intent", code: 500 };
	}
}

export async function addStrategicIntent(
	intent: InsertStrategicDirection
): Promise<InsertStrategicDirection | { error: string }> {
	try {
		const [newIntent] = await db
			.insert(strategicIntents)
			.values(intent)
			.returning();
		return newIntent;
	} catch (error) {
		console.error("Error adding strategic intent:", error);
		return { error: "Failed to add strategic intent" };
	}
}

export async function updateStrategicIntent(
	intentId: string,
	updates: Partial<InsertStrategicDirection>
): Promise<InsertStrategicDirection | { error: string }> {
	try {
		const [updatedIntent] = await db
			.update(strategicIntents)
			.set(updates)
			.where(eq(strategicIntents.id, intentId))
			.returning();
		return updatedIntent;
	} catch (error) {
		console.error("Error updating strategic intent:", error);
		return { error: "Failed to update strategic intent" };
	}
}

export async function deleteStrategicIntent(
	intentId: string
): Promise<{ success: true } | { success: false; error: string }> {
	try {
		await db.delete(strategicIntents).where(eq(strategicIntents.id, intentId));
		return { success: true };
	} catch (error) {
		console.error("Error deleting strategic intent:", error);
		return { success: false, error: "Failed to delete strategic intent" };
	}
}
