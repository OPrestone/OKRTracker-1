import { Switch, Route, useLocation, useRouter } from "wouter";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Home from "@/pages/home";
import CompanyStrategy from "@/pages/company-strategy";
import Teams from "@/pages/teams";
import UsersPage from "@/pages/users";
import AllUsers from "@/pages/all-users";
import Checkins from "@/pages/checkins";
import General from "@/pages/configuration/general";
import TeamsConfig from "@/pages/configuration/teams-config";
import UsersPermissions from "@/pages/configuration/users-permissions";
import Integrations from "@/pages/configuration/integrations";
import Cadences from "@/pages/configuration/cadences";
import Timeframes from "@/pages/configuration/timeframes";
import StatusSettings from "@/pages/configuration/status-settings";
import AuthPage from "@/pages/auth-page";
import MyOKRs from "@/pages/my-okrs";
import DraftOKRs from "@/pages/draft-okrs";
import ApprovedOKRs from "@/pages/approved-okrs";
import CompanyOKRs from "@/pages/company-okrs";
import Reports from "@/pages/reports";
import OKRReports from "@/pages/okr-reports";
import ExportReports from "@/pages/export-reports";
import TeamPerformance from "@/pages/team-performance";
import AIRecommendations from "@/pages/ai-recommendations";
import QuickStartGuide from "@/pages/quick-start-guide";
import MissionPage from "@/pages/mission";
import OneOnOneMeetings from "@/pages/one-on-one-meetings";
import { AuthProvider } from "@/hooks/use-auth";
import { HelpProvider } from "@/hooks/use-help-context";
import { FeatureTour } from "@/components/help/feature-tour";
import { Loader2 } from "lucide-react";

// Simple Public Route Component to replace ProtectedRoute temporarily
interface PublicRouteProps {
  path: string;
  component: React.ComponentType;
}

const PublicRoute = ({ path, component: Component }: PublicRouteProps) => (
  <Route path={path}>
    <Component />
  </Route>
);

function AppRoutes() {
  return (
    <Switch>
      <PublicRoute path="/auth" component={AuthPage} />
      <PublicRoute path="/" component={Dashboard} />
      <PublicRoute path="/home" component={Home} />
      <PublicRoute path="/quick-start-guide" component={QuickStartGuide} />
      <PublicRoute path="/mission" component={MissionPage} />
      <PublicRoute path="/company-strategy" component={CompanyStrategy} />
      
      {/* Manage OKRs Section */}
      <PublicRoute path="/my-okrs" component={MyOKRs} />
      <PublicRoute path="/draft-okrs" component={DraftOKRs} />
      <PublicRoute path="/approved-okrs" component={ApprovedOKRs} />
      <PublicRoute path="/company-okrs" component={CompanyOKRs} />
      
      {/* User Management Section */}
      <PublicRoute path="/teams" component={Teams} />
      <PublicRoute path="/users" component={UsersPage} />
      <PublicRoute path="/all-users" component={AllUsers} />
      
      <PublicRoute path="/checkins" component={Checkins} />
      <PublicRoute path="/one-on-one-meetings" component={OneOnOneMeetings} />
      
      {/* Reports Section */}
      <PublicRoute path="/reports" component={Reports} />
      <PublicRoute path="/okr-reports" component={OKRReports} />
      <PublicRoute path="/export-reports" component={ExportReports} />
      <PublicRoute path="/team-performance" component={TeamPerformance} />
      <PublicRoute path="/ai-recommendations" component={AIRecommendations} />
      
      <PublicRoute path="/configuration/general" component={General} />
      <PublicRoute path="/configuration/teams" component={TeamsConfig} />
      <PublicRoute path="/configuration/users-permissions" component={UsersPermissions} />
      <PublicRoute path="/configuration/integrations" component={Integrations} />
      <PublicRoute path="/configuration/status-settings" component={StatusSettings} />
      <PublicRoute path="/configuration/cadences" component={Cadences} />
      <PublicRoute path="/configuration/timeframes" component={Timeframes} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <HelpProvider>
        <FeatureTour />
        <AppRoutes />
      </HelpProvider>
    </AuthProvider>
  );
}

export default App;
