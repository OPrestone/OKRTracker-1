import { redirect } from "next/navigation";

type Props = {
	params: {
		tenantId: string;
	};
};

const page = ({ params }: Props) => {
	redirect(`/${params.tenantId}/create-company-goal`);

	return <div>page</div>;
};

export default page;
