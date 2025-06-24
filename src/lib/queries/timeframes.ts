"use server";

import db from "@/util/db";
import { InsertTimeframe, Timeframe, timeframes } from "@/util/schema";
import { and, eq } from "drizzle-orm";

export async function getTimeframes(tenantId: string) {
	const alltimeframes = await db
		.select()
		.from(timeframes)
		.where(eq(timeframes.tenantId, tenantId));
	return alltimeframes;
}

export async function addTimeframe(
	timeframe: InsertTimeframe
): Promise<Timeframe | { error: string }> {
	try {
		const [newTimeframe] = await db
			.insert(timeframes)
			.values(timeframe)
			.returning();
		return newTimeframe;
	} catch (error) {
		console.error("Error adding timeframe:", error);
		return { error: "Failed to add timeframe" };
	}
}

export async function getAllTimeframes(
	tenantId: string
): Promise<Timeframe[] | { error: string; code: number }> {
	try {
		const allTimeframes = await db
			.select()
			.from(timeframes)
			.where(eq(timeframes.tenantId, tenantId));
		return allTimeframes;
	} catch (error) {
		console.error("Error fetching all timeframes:", error);
		return { error: "Failed to fetch all timeframes", code: 500 };
	}
}

export async function getTimeframeById(
	timeframeId: string,
	tenantId: string
): Promise<Timeframe | { error: string; code: number }> {
	try {
		const [timeframe] = await db
			.select()
			.from(timeframes)
			.where(
				and(eq(timeframes.id, timeframeId), eq(timeframes.tenantId, tenantId))
			);
		if (!timeframe) {
			return { error: "Timeframe not found", code: 404 };
		}
		return timeframe;
	} catch (error) {
		console.error("Error fetching timeframe by ID:", error);
		return { error: "Failed to fetch timeframe by ID", code: 500 };
	}
}
