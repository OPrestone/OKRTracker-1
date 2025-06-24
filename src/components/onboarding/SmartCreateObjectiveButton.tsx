import { Button } from "@/components/ui/button";
import { TenantContext } from "@/contexts/TenantContext";
import { UserContext } from "@/contexts/UserContext";
import { UserPermissions } from "@/lib/actions";
import { Tenant } from "@/util/schema";
import { GraduationCap, Plus, Shield, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";
import { OKRLearningTour } from "./OkrLearningTour";

interface SmartCreateObjectiveButtonProps {
	variant?: "default" | "outline" | "ghost";
	size?: "default" | "sm" | "lg";
	className?: string;
	showIcon?: boolean;
	children?: React.ReactNode;
}

export function SmartCreateObjectiveButton({
	variant = "default",
	size = "default",
	className = "",
	showIcon = true,
	children,
}: SmartCreateObjectiveButtonProps) {
	const { permissions } = useContext(UserContext) as UserPermissions;
	const router = useRouter();
	const tenant = useContext(TenantContext) as Tenant;
	const [showLearningTour, setShowLearningTour] = useState(false);

	const handleCreateObjective = () => {
		// Check if user has permission to create objectives
		if (permissions?.canCreateObjectives) {
			// Route to appropriate creation page based on permissions
			if (permissions.canCreateCompanyObjectives) {
				// Users who can create company objectives (managers, executives, admins, owners)
				router.push(`/${tenant.id}/create-company-objective`);
			} else {
				// Regular users can create personal objectives
				router.push("/create-objective");
			}
		} else {
			// Regular users without creation permissions get the learning tour
			setShowLearningTour(true);
		}
	};

	const getButtonText = () => {
		if (children) return children;

		if (permissions?.canCreateObjectives) {
			if (permissions.canCreateCompanyObjectives) {
				return "Create Objective";
			} else {
				return "Create Objective";
			}
		} else {
			return "Learn About OKRs";
		}
	};

	const getButtonIcon = () => {
		if (!showIcon) return null;

		if (permissions?.canCreateObjectives) {
			return <Target className="h-4 w-4" />;
		} else {
			return <GraduationCap className="h-4 w-4" />;
		}
	};

	const getTooltipText = () => {
		if (permissions?.canCreateObjectives) {
			if (permissions.isAdminOrOwner) {
				return "Create strategic objectives for your organization";
			} else if (permissions.getUserRole === "manager") {
				return "Create objectives for your team";
			} else {
				return "Create personal or team objectives";
			}
		} else {
			return "Start your OKR journey with an interactive learning experience";
		}
	};

	return (
		<>
			<Button
				variant={variant}
				size={size}
				className={className}
				onClick={handleCreateObjective}
				title={getTooltipText()}
			>
				{getButtonIcon()}
				{getButtonIcon() && <span className="ml-2">{getButtonText()}</span>}
				{!getButtonIcon() && getButtonText()}
			</Button>

			<OKRLearningTour
				isOpen={showLearningTour}
				onClose={() => setShowLearningTour(false)}
			/>
		</>
	);
}

// Convenience components for different contexts
export function CreateFirstObjectiveCard() {
	const { permissions } = useContext(UserContext) as UserPermissions;

	return (
		<div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-8 text-center">
			<div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
				{permissions?.canCreateObjectives ? (
					<Target className="h-8 w-8 text-blue-600" />
				) : (
					<GraduationCap className="h-8 w-8 text-blue-600" />
				)}
			</div>

			<h3 className="text-xl font-semibold text-gray-900 mb-2">
				{permissions?.canCreateObjectives
					? "Ready to Set Your First Objective?"
					: "Ready to Learn About OKRs?"}
			</h3>

			<p className="text-gray-600 mb-6 max-w-md mx-auto">
				{permissions?.canCreateObjectives
					? "Start driving results by creating your first strategic objective with measurable key results."
					: "Discover how Objectives and Key Results can transform your productivity and goal achievement."}
			</p>

			<SmartCreateObjectiveButton size="lg" />

			{!permissions?.canCreateObjectives && (
				<div className="mt-4 text-sm text-gray-500">
					<div className="flex items-center justify-center gap-2">
						<Shield className="h-4 w-4" />
						<span>Contact your admin to create organizational objectives</span>
					</div>
				</div>
			)}
		</div>
	);
}

export function QuickCreateButton() {
	return (
		<SmartCreateObjectiveButton
			variant="outline"
			size="sm"
			className="flex items-center gap-2"
		>
			<Plus className="h-4 w-4" />
			<span className="hidden sm:inline">Create</span>
		</SmartCreateObjectiveButton>
	);
}
