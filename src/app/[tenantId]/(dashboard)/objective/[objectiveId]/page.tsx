import ObjectiveDetailsDisplay from "./_components/ObjectiveDetailsDisplay";

type Props = {
	params: {
		tenantId: string;
		objectiveId: string;
	};
};

const page = ({ params }: Props) => {
	return (
		<div>
			<ObjectiveDetailsDisplay objectiveId={params.objectiveId} />
		</div>
	);
};

export default page;
