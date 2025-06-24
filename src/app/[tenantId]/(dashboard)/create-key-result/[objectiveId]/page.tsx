import CreateKeyResultDisplay from "../_components/CreateKeyResultDisplay";

type Props = {
	params: {
		tenantId: string;
		objectiveId: string;
	};
};

const page = ({ params }: Props) => {
	return (
		<div>
			<CreateKeyResultDisplay objectiveIdParam={params.objectiveId} />
		</div>
	);
};

export default page;
