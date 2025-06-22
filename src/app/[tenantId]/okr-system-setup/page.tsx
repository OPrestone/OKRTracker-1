import { auth } from "@/util/auth";
import { redirect } from "next/navigation";
import OKRSystemSetupWizard from "./_components/OkrSystemSetupWizard";

type Props = {
	params: {
		tenantId: string;
	};
};

const page = async ({ params }: Props) => {
	const session = await auth();
	console.log("Session:", session);

	if (!session) {
		redirect("/");
	}

	return (
		<div>
			<OKRSystemSetupWizard tenantId={params.tenantId} userId={session.user.id} />
		</div>
	);
};

export default page;
