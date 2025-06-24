import CompanyGoalDetails from "./_components/CompanyGoalDetails";

type Props = {
	params: {
		tenantId: string;
		objectiveId: string;
	};
};

const page = ({ params }: Props) => {
	return (
		<div>
			<CompanyGoalDetails objectiveId={params.objectiveId} />
		</div>
	);
};

export default page;
