"use server";

import db from "@/util/db";
import {
	InsertUser,
	User,
	userRoleEnum,
	users,
	usersToTenants,
} from "@/util/schema";
import { hash } from "bcrypt";
import { eq } from "drizzle-orm";

export async function createUser(
	insertUser: InsertUser,
	tenantId?: string,
	role?: typeof userRoleEnum
): Promise<User | { error: string; code: number }> {
	try {
		// if (!tenantId) {
		// 	// Find or create a default tenant
		// 	try {
		// 		// Create a default tenant if none exists
		// 		console.log("No tenants found, creating a default tenant");
		// 		const [defaultTenant] = await db
		// 			.insert(tenants)
		// 			.values({
		// 				name: `${insertUser.firstName} Company`,
		// 				slug: `${insertUser.firstName}-org`,
		// 				plan: "free",
		// 				settings: {},
		// 				enabledFeatures: ["objectives", "key_results", "chat"],
		// 			})
		// 			.returning();
		// 		tenantId = defaultTenant.id;
		// 		console.log("Created default tenant:", tenantId);
		// 	} catch (err) {
		// 		console.error("Error creating default tenant:", err);
		// 		return { error: "Failed to create default tenant", code: 500 };
		// 	}
		// }

		const existingUser = await getUserByEmail(insertUser.email);
		if (existingUser) {
			console.log("User with this email already exists:", insertUser.email);
			return { error: "User with this email already exists", code: 409 };
		}

		// Since we've updated the schema to match the database, we don't need to transform field names anymore
		// We're just making sure data is well-formed before insertion
		const name =
			`${insertUser.firstName || ""} ${insertUser.lastName || ""}`.trim() ||
			insertUser.username;

		const hashedPassword = await hash(insertUser.password, 10);

		// Makes sure we have required fields properly set
		const userData = {
			...insertUser,
			// Ensure these fields have sensible defaults if they don't exist
			firstName: insertUser.firstName || "",
			lastName: insertUser.lastName || "",
			password: hashedPassword,
			name: name,
			tenantId: insertUser.tenantId
				? insertUser.tenantId
				: tenantId
				? tenantId
				: undefined, // Only set if tenantId is provided
			language: insertUser.language || "en",
			role: insertUser.role || "user",
			firstLogin:
				insertUser.firstLogin !== undefined ? insertUser.firstLogin : true,
			introVideoWatched:
				insertUser.introVideoWatched !== undefined
					? insertUser.introVideoWatched
					: false,
			walkthroughCompleted:
				insertUser.walkthroughCompleted !== undefined
					? insertUser.walkthroughCompleted
					: false,
			onboardingProgress:
				insertUser.onboardingProgress !== undefined
					? insertUser.onboardingProgress
					: 0,
		};

		// For debugging
		console.log("Final user data for insertion:", {
			...userData,
			password: "***",
		});

		// Insert the user
		const [user] = await db.insert(users).values(userData).returning();

		if (tenantId) {
			// Create user-tenant relationship if not already created
			try {
				await db
					.insert(usersToTenants)
					.values({
						userId: user.id,
						tenantId: tenantId,
						role: typeof role === "string" ? role : "admin", // Ensure role is a string
						isDefault: true, // Make this the default tenant
						createdAt: new Date(),
					})
					.onConflictDoNothing();
				console.log("User-tenant relationship created");
			} catch (err) {
				console.error("Error creating user-tenant relationship:", err);
				return { error: "Failed to create user-tenant relationship", code: 500 };
				// Non-critical error, continue with registration
			}
		}

		// Return the user
		return user;
	} catch (error) {
		console.error("Error creating user:", error);
		return { error: "Failed to create user", code: 500 };
	}
}

export async function getUserByUsername(
	username: string
): Promise<User | undefined> {
	// Select specific columns to avoid issues with missing columns
	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.username, username));

	return user;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
	const [user] = await db.select().from(users).where(eq(users.email, email));
	return user;
}

export async function getUserById(userId: string): Promise<User | undefined> {
	const [user] = await db.select().from(users).where(eq(users.id, userId));
	return user;
}

export async function getTenantUsers(
	tenantId: string
): Promise<Array<User> | { error: string; code: number }> {
	try {
		const allUsers = await db
			.select()
			.from(users)
			.where(eq(users.tenantId, tenantId));

		return allUsers;
	} catch (error) {
		console.error("Error fetching tenant users:", error);
		return { error: "Failed to fetch tenant users", code: 500 };
	}
}
