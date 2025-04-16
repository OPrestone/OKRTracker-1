import { Switch, Route, useLocation, useRouter } from "wouter";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Home from "@/pages/home";
import CompanyStrategy from "@/pages/company-strategy";
import Teams from "@/pages/teams";
import UsersPage from "@/pages/users";
import Checkins from "@/pages/checkins";
import General from "@/pages/configuration/general";
import TeamsConfig from "@/pages/configuration/teams-config";
import UsersPermissions from "@/pages/configuration/users-permissions";
import Integrations from "@/pages/configuration/integrations";
import Cadences from "@/pages/configuration/cadences";
import Timeframes from "@/pages/configuration/timeframes";
import AuthPage from "@/pages/auth-page";
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
      <PublicRoute path="/company-strategy" component={CompanyStrategy} />
      <PublicRoute path="/teams" component={Teams} />
      <PublicRoute path="/users" component={UsersPage} />
      <PublicRoute path="/checkins" component={Checkins} />
      <PublicRoute path="/configuration/general" component={General} />
      <PublicRoute path="/configuration/teams" component={TeamsConfig} />
      <PublicRoute path="/configuration/users-permissions" component={UsersPermissions} />
      <PublicRoute path="/configuration/integrations" component={Integrations} />
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
