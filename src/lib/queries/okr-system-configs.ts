"use server";
import db from "@/util/db";
import { OkrSystemConfig, okrSystemConfigs } from "@/util/schema";
import { eq } from "drizzle-orm";

export async function getOkrSystemConfigs(
	tenantId: string
): Promise<OkrSystemConfig | null | { error: string }> {
	try {
		const [allConfigs] = await db
			.select()
			.from(okrSystemConfigs)
			.where(eq(okrSystemConfigs.tenant_id, tenantId));
		return allConfigs || null;
	} catch (error) {
		console.error("Error fetching OKR system configs:", error);
		return { error: "Failed to fetch OKR system configs" };
	}
}
