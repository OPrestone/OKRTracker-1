"use client";

import { Tenant } from "@/util/schema";
import React, { createContext } from "react";

export const TenantContext = createContext<Tenant | null>(null);

const TenantContextProvider = ({
	tenant,
	children,
}: {
	tenant: Tenant;
	children: React.ReactNode;
}) => {
	return (
		<TenantContext.Provider value={tenant}>{children}</TenantContext.Provider>
	);
};

export default TenantContextProvider;
