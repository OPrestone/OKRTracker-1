import DashboardLayout from "@/components/layouts/DashboardLayout";
import TenantContextProvider from "@/contexts/TenantContext";
import UserContextProvider from "@/contexts/UserContext";
import { getUserAndPermissions } from "@/lib/actions";
import { getTenantById } from "@/lib/queries/tenants";
import { isValidULID } from "@/lib/utils";
import { QueryProvider } from "@/providers/QCProvider";
import { auth } from "@/util/auth";
import { notFound, redirect } from "next/navigation";

type Props = {
	params: {
		tenantId: string;
	};
};

export default async function PNLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: { tenantId: string };
}) {
	const session = await auth();

	if (!session) {
		redirect("/");
	}
	if (!isValidULID(params.tenantId)) notFound();

	const tenant = await getTenantById(params.tenantId);

	if (!tenant) notFound();

	const userNPermissions = await getUserAndPermissions(params.tenantId);

	if (!userNPermissions) notFound();

	return (
		// <div className="flex flex-col h-screen">
		// 	<Header />
		// 	{JSON.stringify(params)}
		// 	<main className="flex-1 p-4 overflow-y-auto">{children}</main>
		// 	<footer className="bg-gray-800 text-white p-4 text-center">
		// 		Dashboard Footer
		// 	</footer>
		// </div>
		<TenantContextProvider tenant={tenant}>
			<UserContextProvider user={userNPermissions}>
				<QueryProvider>
					<DashboardLayout userNPermissions={userNPermissions}>
						{children}
					</DashboardLayout>
				</QueryProvider>
			</UserContextProvider>
		</TenantContextProvider>
	);
}
