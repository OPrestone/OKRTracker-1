"use server";

import { slugify } from "@/lib/utils";
import db from "@/util/db";
import {
	InsertTenant,
	InsertUserToTenant,
	Tenant,
	tenants,
	users,
	usersToTenants,
	UserToTenant,
} from "@/util/schema";
import { and, eq, inArray } from "drizzle-orm";

export async function createTenant(
	tenantData: InsertTenant, // Use any to avoid type issues
	userId: string, // Use any to avoid type issues
	userRole: "owner" | "admin" = "owner"
): Promise<{ tenant: Tenant; userToTenant: UserToTenant }> {
	try {
		console.log("Creating tenant with data:", tenantData, "for user:", userId);
		// Check if user has any tenant connections already
		const userTenants = await getUserTenants(userId);

		const user = await db
			.select()
			.from(users)
			.where(eq(users.id, userId))
			.then((rows) => rows[0]);

		if (!user) {
			throw new Error("User not found");
		}

		if (user.tenantId) throw new Error("User already belongs to a tenant");

		// If using tenant onboarding, allow creating organization even if user has existing ones
		// Check if this request came from tenant-onboarding (indicated by role = "owner")
		// if (
		// 	userTenants.length > 0 &&
		// 	!user.isAdmin &&
		// 	!user.role?.includes("admin") &&
		// 	userRole !== "owner"
		// ) {
		// 	throw new Error("Only administrators can create additional organizations");
		// }

		// Generate a slug from the name
		const slug: string = slugify(tenantData.name); // Replace spaces with hyphens

		// Ensure slug is unique by adding a random suffix if needed
		let finalSlug = slug;

		// Use raw SQL for compatibility
		//   const { rows: existingTenants } = await db.execute(
		//     sql`SELECT id FROM tenants WHERE slug = ${slug} LIMIT 1`
		//   );

		const eTenants = await db
			.select()
			.from(tenants)
			.where(eq(tenants.slug, slug));

		if (eTenants.length > 0) {
			// Add random suffix
			finalSlug = `${slug}-${Math.floor(Math.random() * 1000)}`;
		}

		const [insertedTenant] = await db
			.insert(tenants)
			.values({
				...tenantData,
				slug: finalSlug,
			})
			.returning();

		// Create the tenant - use the direct SQL query to avoid type issues
		//   const { rows: [tenant] } = await db.execute(
		//     sql`INSERT INTO tenants (id, name, display_name, description, industry, slug, plan, status, max_users, domain, logo_url, settings, enabled_features)
		//         VALUES (
		//           ${tenantId},
		//           ${tenantData.name},
		//           ${tenantData.displayName || tenantData.name},
		//           ${tenantData.description || null},
		//           ${tenantData.industry || null},
		//           ${finalSlug},
		//           ${tenantData.plan || 'free'},
		//           ${tenantData.status || 'active'},
		//           ${tenantData.maxUsers || 5},
		//           ${tenantData.domain || null},
		//           ${tenantData.logoUrl || null},
		//           ${tenantData.settings ? JSON.stringify(tenantData.settings) : JSON.stringify({})},
		//           ${tenantData.enabledFeatures ? JSON.stringify(tenantData.enabledFeatures) : JSON.stringify([])}
		//         )
		//         RETURNING *`
		//   );

		// Link the user to the tenant with a unique ID
		// const userToTenantId = ulid();
		//   const { rows: [userToTenant] } = await db.execute(
		//     sql`INSERT INTO users_to_tenants (id, user_id, tenant_id, role, is_default)
		//         VALUES (${userToTenantId}, ${user.id}, ${tenant.id}, ${userRole}, TRUE)
		//         RETURNING *`
		//   );

		const validatedData: InsertUserToTenant = {
			userId: user.id,
			tenantId: insertedTenant.id, // Use the newly created tenant ID
			role: userRole,
			isDefault: true, // Set this as the default tenant for the user
		};

		const [insertedUserToTenant] = await db
			.insert(usersToTenants)
			.values(validatedData)
			.returning();

		await db
			.update(users)
			.set({ tenantId: insertedTenant.id }) // Update user's tenantId to the new tenant
			.where(eq(users.id, user.id));

		return { tenant: insertedTenant, userToTenant: insertedUserToTenant };
	} catch (error) {
		console.error("Error creating tenant:", error);
		throw error;
	}
}

export async function getUserTenants(
	userId: string
): Promise<Array<Tenant & { userRole?: string; isDefault?: boolean }>> {
	try {
		console.log("Getting tenants for user:", userId);

		// First, check if we have any user-tenant relationships
		const userTenantConnections = await db
			.select()
			.from(usersToTenants)
			.where(eq(usersToTenants.userId, userId));

		if (!userTenantConnections || userTenantConnections.length === 0) {
			console.log(
				`No tenant connections found for user ${userId}, returning empty array`
			);
			return [];
		}

		// Get all tenants the user has access to along with their role
		const tenantIds = userTenantConnections.map((utc) => utc.tenantId);

		// Fetch the actual tenant records
		const tenantRecords = await db
			.select()
			.from(tenants)
			.where(inArray(tenants.id, tenantIds));

		// Map the records with role information
		const enhancedTenants = tenantRecords.map((tenant) => {
			const connection = userTenantConnections.find(
				(utc) => utc.tenantId === tenant.id
			);
			return {
				...tenant,
				userRole: connection?.role || "member",
				isDefault: connection?.isDefault || false,
			};
		});

		console.log(`Found ${enhancedTenants.length} tenants for user ${userId}`);
		return enhancedTenants;
	} catch (error) {
		console.error("Error getting user tenants:", error);
		return [];
	}
}

export async function getTenantById(tenantId: string): Promise<Tenant | null> {
	try {
		console.log("Getting tenant by ID:", tenantId);

		const [tenant] = await db
			.select()
			.from(tenants)
			.where(eq(tenants.id, tenantId));

		if (!tenant) {
			console.log(`Tenant with ID ${tenantId} not found`);
			return null;
		}

		return tenant;
	} catch (error) {
		console.error("Error getting tenant by ID:", error);
		return null;
	}
}

export async function getUserTenantById(
	userId: string,
	tenantId: string
): Promise<UserToTenant | null> {
	try {
		console.log(
			"Getting user-tenant connection for user:",
			userId,
			"and tenant:",
			tenantId
		);

		const [userTenantConnection] = await db
			.select()
			.from(usersToTenants)
			.where(
				and(
					eq(usersToTenants.userId, userId),
					eq(usersToTenants.tenantId, tenantId)
				)
			);

		if (!userTenantConnection) {
			console.log(
				`No user-tenant connection found for user ${userId} and tenant ${tenantId}`
			);
			return null;
		}

		return userTenantConnection;
	} catch (error) {
		console.error("Error getting user-tenant connection:", error);
		return null;
	}
}
