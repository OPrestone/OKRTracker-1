"use server";

import db from "@/util/db";
import { usersToTenants, UserToTenant } from "@/util/schema";
import { and, count, eq } from "drizzle-orm";

export async function getUserToTenant(
	tenantId: string,
	userId: string
): Promise<UserToTenant | null> {
	const [userToTenants] = await db
		.select()
		.from(usersToTenants)
		.where(
			and(eq(usersToTenants.tenantId, tenantId), eq(usersToTenants.userId, userId))
		)
		.limit(1);
	return userToTenants || null;
}

export async function getAllTenantUserNumber(
	tenantId: string
): Promise<number | { error: string; code: number }> {
	try {
		const [allUsers] = await db
			.select({ count: count() })
			.from(usersToTenants)
			// .innerJoin(usersToTenants.user, (user) => user.id)
			.where(eq(usersToTenants.tenantId, tenantId));

		return allUsers.count;
	} catch (error) {
		console.error("Error getting all tenant user number:", error);
		return { error: "Failed to get all tenant user number", code: 500 };
	}
}
