import { Switch, Route } from "wouter";
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
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/home" component={Home} />
      <ProtectedRoute path="/company-strategy" component={CompanyStrategy} />
      <ProtectedRoute path="/teams" component={Teams} />
      <ProtectedRoute path="/users" component={Users} />
      <ProtectedRoute path="/checkins" component={Checkins} />
      <ProtectedRoute path="/configuration/general" component={General} />
      <ProtectedRoute path="/configuration/teams" component={TeamsConfig} />
      <ProtectedRoute path="/configuration/users-permissions" component={UsersPermissions} />
      <ProtectedRoute path="/configuration/integrations" component={Integrations} />
      <ProtectedRoute path="/configuration/cadences" component={Cadences} />
      <ProtectedRoute path="/configuration/timeframes" component={Timeframes} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return <Router />;
}

export default App;
