"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User } from "@/util/schema";

const TeamMember = ({ user }: { user: User }) => {
	const initials =
		user.firstName && user.lastName
			? `${user.firstName[0]}${user.lastName[0]}`
			: user.username
			? user.username[0]
			: "?";

	return (
		<div className="flex items-center p-3 hover:bg-gray-50 rounded-md">
			<Avatar className="h-10 w-10 mr-3">
				<AvatarFallback>{initials}</AvatarFallback>
			</Avatar>
			<div>
				<h3 className="font-medium">
					{user.firstName} {user.lastName}
				</h3>
				<p className="text-sm text-gray-500">{user.role}</p>
			</div>
			<div className="ml-auto text-sm text-gray-500">
				<Badge
					variant="outline"
					className="bg-green-100 text-green-800 hover:bg-green-100"
				>
					Active
				</Badge>
			</div>
		</div>
	);
};

export default TeamMember;
