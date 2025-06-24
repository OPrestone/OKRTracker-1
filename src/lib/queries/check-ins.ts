"use server";

import db from "@/util/db";
import { CheckIn, checkIns, InsertCheckIn } from "@/util/schema";
import { and, eq } from "drizzle-orm";

export async function getAllCheckIns(
	objectiveId: string,
	tenantId: string
): Promise<CheckIn[] | { error: string; code: number }> {
	try {
		const allCheckIns = await db
			.select()
			.from(checkIns)
			.where(
				and(eq(checkIns.objectiveId, objectiveId), eq(checkIns.tenantId, tenantId))
			);

		console.log("Fetched all Check-Ins:", allCheckIns);
		return allCheckIns;
	} catch (error) {
		console.error("Error getting all Check-Ins:", error);
		return { error: "Failed to get all Check-Ins", code: 500 };
	}
}

export async function createCheckIn(
	checkIn: InsertCheckIn
): Promise<CheckIn | { error: string; code: number }> {
	try {
		const newCheckIn = await db.insert(checkIns).values(checkIn).returning();

		console.log("Created new Check-In:", newCheckIn);
		return newCheckIn[0];
	} catch (error) {
		console.error("Error creating Check-In:", error);
		return { error: "Failed to create Check-In", code: 500 };
	}
}
