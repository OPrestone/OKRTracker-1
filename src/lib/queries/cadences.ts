"use server";

import db from "@/util/db";
import { Cadence, cadences, InsertCadence } from "@/util/schema";
import { and, eq } from "drizzle-orm";

export async function getAllCadences(tenantId: string) {
	const allCadences = await db
		.select()
		.from(cadences)
		.where(eq(cadences.tenantId, tenantId));
	return allCadences;
}

export async function addCadence(
	cadence: InsertCadence
): Promise<Cadence | { error: string; code: number }> {
	try {
		//check if cadence already exists
		const [existingCadence] = await db
			.select()
			.from(cadences)
			.where(
				and(
					eq(cadences.period, cadence.period),
					eq(cadences.tenantId, cadence.tenantId)
				)
			)
			.limit(1);

		if (existingCadence) {
			return {
				error: "Cadence with the same period already exists for this tenant.",
				code: 409, // Conflict
			};
		}

		const [newCadence] = await db.insert(cadences).values(cadence).returning();
		return newCadence;
	} catch (error) {
		console.error("Error adding cadence:", error);
		return { error: "Failed to add cadence", code: 500 }; // Internal Server Error
	}
}

export async function getCadenceByPeriod(
	tenantId: string,
	period: string
): Promise<Cadence | null | { error: string }> {
	try {
		const [cadence] = await db
			.select()
			.from(cadences)
			.where(and(eq(cadences.tenantId, tenantId), eq(cadences.period, period)))
			.limit(1);
		return cadence || null;
	} catch (error) {
		console.error("Error fetching cadence by period:", error);
		return { error: "Failed to fetch cadence by period" };
	}
}
