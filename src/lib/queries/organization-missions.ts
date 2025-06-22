"use server";
import db from "@/util/db";
import { InsertOrganizationMission, organizationMission } from "@/util/schema";
import { eq } from "drizzle-orm";
import { getUserTenantById } from "./tenants";

export async function getOrganizationMissions(tenantId: string) {
	const [OrganizationMission] = await db
		.select()
		.from(organizationMission)
		.where(eq(organizationMission.tenantId, tenantId))
		.limit(1);
	return OrganizationMission;
}

export async function addOrganizationMission(
	organizationMissionData: InsertOrganizationMission,
	userId: string
) {
	try {
		const userTenant = await getUserTenantById(
			userId,
			organizationMissionData.tenantId
		);
		if (!userTenant) {
			return {
				error: "User does not have permission to add a mission for this tenant",
			};
		}
		const existingMission = await getOrganizationMissions(
			organizationMissionData.tenantId
		);
		if (existingMission) {
			const updatedMission = await db
				.update(organizationMission)
				.set({
					...organizationMissionData,
					updatedAt: new Date(),
				})
				.where(eq(organizationMission.id, existingMission.id))
				.returning();
			return updatedMission;
		}
		const [newMission] = await db
			.insert(organizationMission)
			.values(organizationMissionData)
			.returning();
		return newMission;
	} catch (error) {
		console.error("Error adding organization mission:", error);
		return { error: "Failed to add organization mission" };
	}
}
