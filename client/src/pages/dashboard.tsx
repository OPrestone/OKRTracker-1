import { useQuery } from "@tanstack/react-query";
import MyOKRs from "@/components/dashboard/my-okrs";
import { TeamsOKRPerformance } from "@/components/dashboard/teams-okr-performance";
import { IndividualProgress } from "@/components/dashboard/individual-progress";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export default function Dashboards() {
  // Fetch dashboard summary data
  const { data: dashboardData = { objectives: {} } } = useQuery({
    queryKey: ['/api/dashboard'],
  }) as { data: any };

  // Extract stats from dashboard data
  const stats = {
    totalObjectives: dashboardData?.objectives?.total || 35,
    completedObjectives: dashboardData?.objectives?.completed || 21,
    atRiskObjectives: dashboardData?.objectives?.atRisk || 4,
    teamProgress: dashboardData?.teamProgress || 78,
    upcomingCheckins: dashboardData?.upcomingCheckins || 8,
  };

  return (
    <div className="container py-6">
      <DashboardLayout overviewStats={stats} />
    </div>
  );
}
