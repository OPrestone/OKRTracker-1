export default async function PNTemplate({
	children,
}: {
	children: React.ReactNode;
}) {
	return <div className="animate-appear">{children}</div>;
}
