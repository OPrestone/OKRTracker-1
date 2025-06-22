import { auth } from "@/util/auth";
import { redirect } from "next/navigation";
import TenantOnboardingWizard from "./_components/TenantOnboardingWizard";

const TenantOnboarding = async () => {
	const session = await auth();

	if (!session) {
		redirect("/");
	}

	// if (session.user.tenantId) {
	// 	redirect(`/${session.user.tenantId}/teams`);
	// }

	return (
		<>
			<TenantOnboardingWizard userId={session.user.id} />
		</>
	);
};

export default TenantOnboarding;
