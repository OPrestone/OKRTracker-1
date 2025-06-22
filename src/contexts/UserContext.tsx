"use client";

import { UserPermissions } from "@/lib/actions";
import React, { createContext } from "react";

export const UserContext = createContext<UserPermissions | null>(null);

const UserContextProvider = ({
	user,
	children,
}: {
	user: UserPermissions;
	children: React.ReactNode;
}) => {
	return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
};

export default UserContextProvider;
