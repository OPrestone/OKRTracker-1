import { getQueryClient } from "@/lib/query-client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import TeamsDisplay from "./_components/TeamsDisplay";

type Props = {
	params: {
		tenantId: string;
	};
};

const Teams = ({ params }: Props) => {
	const queryClient = getQueryClient();
	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<TeamsDisplay tenantId={params.tenantId} />
		</HydrationBoundary>
	);
};

export default Teams;
