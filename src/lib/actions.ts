"use server";

import { auth } from "@/util/auth";
import { User } from "@/util/schema";
import { getTenantById } from "./queries/tenants";
import { getUserToTenant } from "./queries/user-to-tenant";
import { getUserById } from "./queries/users";

export type UserPermissions = {
	user: User | null;
	permissions: {
		isAdminOrOwner: boolean;
		isOwner: boolean;
		isTeamLeader: boolean;
		isManagerOrAbove: boolean;
		isExecutiveOrAbove: boolean;
		getUserRole: string | null;
		canCreateObjectives: boolean;
		canEditObjectives: boolean;
		canDeleteObjectives: boolean;
		canCreateTeams: boolean;
		canEditTeams: boolean;
		canDeleteTeams: boolean;
		canManageUsers: boolean;
		canViewReports: boolean;
		canAccessConfiguration: boolean;
		canManageIntegrations: boolean;
		canExportData: boolean;
		canViewFinancials: boolean;
		canAssignTeamLeaders: boolean;
		canCreateCompanyObjectives: boolean;
		canApproveObjectives: boolean;
	};
};

export async function getUserAndPermissions(tenantId: string) {
	const session = await auth();
	if (!session) return null;
	const userId = session.user.id;

	const user = await getUserById(userId);
	if (!user) return null;

	const currentTenant = await getTenantById(tenantId);
	if (!currentTenant) return false;

	const currentUserToTenant = await getUserToTenant(currentTenant.id, userId);
	if (!currentUserToTenant) return false;

	/**
	 * Get the user's role in the current tenant
	 * @returns string representing the user's role
	 */
	const getUserRole = (): string | null => {
		if (!user || !currentTenant || !currentUserToTenant) return null;
		return currentUserToTenant.role || null;
	};

	/**
	 * Check if the user is an admin or owner of the current tenant
	 * @returns boolean indicating if the user has admin/owner permissions
	 */
	const isAdminOrOwner = (): boolean => {
		if (!user || !currentTenant || !currentUserToTenant) return false;

		if (
			currentUserToTenant.role === "owner" ||
			currentUserToTenant.role === "admin"
		) {
			return true;
		}
		return false;
	};

	/**
	 * Check if the user is an owner of the current tenant
	 * @returns boolean indicating if the user has owner permissions
	 */
	const isOwner = (): boolean => {
		if (!user || !currentTenant || !currentUserToTenant) return false;

		// Check user's role in the current tenant
		if (currentUserToTenant.role === "owner") return true;

		return false;
	};

	/**
	 * Check if the user is a team leader
	 * @returns boolean indicating if the user is a team leader
	 */
	const isTeamLeader = (): boolean => {
		if (!user || !currentTenant || !currentUserToTenant) return false;

		// Check user's role in the current tenant
		if (currentUserToTenant.role === "manager") return true;

		return false;
	};

	/**
	 * Check if the user is a manager or above (manager, executive, admin, owner)
	 * @returns boolean indicating if the user has manager+ permissions
	 */

	const isManagerOrAbove = (): boolean => {
		if (!user || !currentTenant || !currentUserToTenant) return false;
		return ["owner", "admin", "manager", "executive"].includes(
			currentUserToTenant.role || ""
		);
	};

	/**
	 * Check if the user is an executive or above (executive, admin, owner)
	 * @returns boolean indicating if the user has executive+ permissions
	 */

	const isExecutiveOrAbove = (): boolean => {
		if (!user || !currentTenant || !currentUserToTenant) return false;
		return ["owner", "admin", "executive"].includes(
			currentUserToTenant.role || ""
		);
	};

	const canCreateObjectives = (): boolean => {
		if (!user || !currentTenant || !currentUserToTenant) return false;
		return isManagerOrAbove();
	};
	const canEditObjectives = (): boolean => isManagerOrAbove() || isTeamLeader();
	const canDeleteObjectives = (): boolean => isAdminOrOwner();
	const canCreateTeams = (): boolean => {
		// Manager, owner and admin can create teams
		const role = getUserRole();
		return ["manager", "admin", "owner"].includes(role || "");
	};
	const canEditTeams = (): boolean => {
		// Team leaders, executives, owners and admins can add members to teams
		const role = getUserRole();
		return isTeamLeader() || ["executive", "admin", "owner"].includes(role || "");
	};
	const canDeleteTeams = (): boolean => isAdminOrOwner();
	const canManageUsers = (): boolean => {
		// Manager, owner and admin can create users
		const role = getUserRole();
		return ["manager", "admin", "owner"].includes(role || "");
	};
	const canViewReports = (): boolean => isManagerOrAbove();
	const canAccessConfiguration = (): boolean => isAdminOrOwner();
	const canManageIntegrations = (): boolean => isAdminOrOwner();
	const canExportData = (): boolean => isExecutiveOrAbove();
	const canViewFinancials = (): boolean => isExecutiveOrAbove();
	const canAssignTeamLeaders = (): boolean => isAdminOrOwner();
	const canCreateCompanyObjectives = (): boolean => {
		// Manager, executive, admin, and owner can create company OKRs
		const role = getUserRole();
		return ["manager", "executive", "admin", "owner"].includes(role || "");
	};
	const canApproveObjectives = (): boolean => isManagerOrAbove();

	return {
		user,
		permissions: {
			isAdminOrOwner: isAdminOrOwner(),
			isOwner: isOwner(),
			isTeamLeader: isTeamLeader(),
			isManagerOrAbove: isManagerOrAbove(),
			isExecutiveOrAbove: isExecutiveOrAbove(),
			getUserRole: getUserRole(),
			canCreateObjectives: canCreateObjectives(),
			canEditObjectives: canEditObjectives(),
			canDeleteObjectives: canDeleteObjectives(),
			canCreateTeams: canCreateTeams(),
			canEditTeams: canEditTeams(),
			canDeleteTeams: canDeleteTeams(),
			canManageUsers: canManageUsers(),
			canViewReports: canViewReports(),
			canAccessConfiguration: canAccessConfiguration(),
			canManageIntegrations: canManageIntegrations(),
			canExportData: canExportData(),
			canViewFinancials: canViewFinancials(),
			canAssignTeamLeaders: canAssignTeamLeaders(),
			canCreateCompanyObjectives: canCreateCompanyObjectives(),
			canApproveObjectives: canApproveObjectives(),
		},
	};
}

export async function isValidTenant(tenantId: string): Promise<boolean> {
	const tenant = await getTenantById(tenantId);
	if (!tenant) return false;
	return true;
}
