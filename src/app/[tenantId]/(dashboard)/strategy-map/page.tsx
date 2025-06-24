import OrganizationalChart from "./_components/OrganizationalChart";

type Props = {
	params: {
		tenantId: string;
	};
};

const StrategyMap = ({ params }: Props) => {
	return (
		<div>
			<OrganizationalChart />
		</div>
	);
};

export default StrategyMap;
