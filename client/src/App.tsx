import { Switch, Route, useLocation, useRouter } from "wouter";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Home from "@/pages/home";
import CompanyStrategy from "@/pages/company-strategy";
import Teams from "@/pages/teams";
import TeamDetail from "@/pages/team-detail";
import UserDetail from "@/pages/single-profile";

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
import AccessGroups from "@/pages/configuration/access-groups";
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
import MissionCompanyPage from "@/pages/mission-company";
import CompanyMission from "@/pages/company-mission";
import OneOnOneMeetings from "@/pages/one-on-one-meetings";
import TeamLeaderDashboard from "@/pages/team-leader-dashboard";
import UserProfile from "@/pages/user-profile";
import ObjectiveDetail from "@/pages/objective-detail";
import ChatPage from "@/pages/chat";
import StrategyMap from "@/pages/strategy-map";
import CreateObjective from "@/pages/create-objective";
import FinancePage from "@/pages/import-financial";
import ProjectKanban from "@/pages/project-kanban";
import FeedbackWall from "@/pages/feedback-wall";
import WellnessPulse from "@/pages/wellness-pulse";
import Configure from "@/pages/configure";

// Import tenant-related pages
import TenantsPage from "@/pages/tenants-page";
import TenantPage from "@/pages/tenant-page";
import OrganizationPage from "@/pages/organization-page";
import TenantOnboardingPage from "@/pages/tenant-onboarding-page";

// Import new drag-and-drop pages
import ObjectivesOrganizer from "@/pages/objectives-organizer";
import TimelineEditor from "@/pages/timeline-editor";
import CustomDashboard from "@/pages/custom-dashboard";
import { AuthProvider } from "@/hooks/use-auth";
import { HelpProvider } from "@/hooks/use-help-context";
import { ThemeProvider } from "@/hooks/use-theme";
import { TenantProvider } from "@/hooks/use-tenant-context";
import { FeatureTour } from "@/components/help/feature-tour";
import { Loader2 } from "lucide-react";
// Import onboarding components
import { OnboardingProvider, useOnboarding } from "@/hooks/use-onboarding";
import { GetStartedMenu } from "@/components/onboarding/get-started-menu";
import { IntroVideoDialog } from "@/components/onboarding/intro-video-dialog";
import { WalkthroughGuides } from "@/components/onboarding/walkthrough-guides";
import { useEffect } from "react";
import { ProtectedRoute } from "@/lib/protected-route";
import { AuthGuard } from "@/lib/auth-guard";
import { saveRedirectPath } from "@/lib/redirect-service";
import { useAuth } from "@/hooks/use-auth";

// Location tracker component to monitor navigation for proper redirects
function LocationTracker() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  // When navigation occurs and user is not logged in, save the path for post-login redirect
  useEffect(() => {
    if (!user && !location.startsWith('/auth')) {
      saveRedirectPath(location);
    }
  }, [location, user]);
  
  return null;
}

function AppRoutes() {
  return (
    <Switch>
      <AuthGuard path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/home" component={Home} />
      <ProtectedRoute path="/quick-start-guide" component={QuickStartGuide} />
      <ProtectedRoute path="/mission" component={MissionPage} />
      <ProtectedRoute path="/mission-company" component={MissionCompanyPage} />
      <ProtectedRoute path="/company-mission" component={CompanyMission} />
      <ProtectedRoute path="/company-strategy" component={CompanyStrategy} />
      
      {/* Manage OKRs Section */}
      <ProtectedRoute path="/my-okrs" component={MyOKRs} />
      <ProtectedRoute path="/draft-okrs" component={DraftOKRs} />
      <ProtectedRoute path="/approved-okrs" component={ApprovedOKRs} />
      <ProtectedRoute path="/company-okrs" component={CompanyOKRs} />
      <ProtectedRoute path="/objective-detail/:id" component={ObjectiveDetail} />
      <Route path="/strategy-map" component={StrategyMap} />
                                        <Route path="/create-objective" component={CreateObjective} />
                                        
      {/* User Management Section */}
      <ProtectedRoute path="/teams" component={Teams} />
      <ProtectedRoute path="/teams/:id" component={TeamDetail} />
      <ProtectedRoute path="/users/:id" component={UserDetail} />
      <ProtectedRoute path="/users" component={UsersPage} />
      <ProtectedRoute path="/all-users" component={AllUsers} />
      <ProtectedRoute path="/user-profile" component={UserProfile} />
      
      {/* Dashboards */}
      <ProtectedRoute path="/team-leader-dashboard" component={TeamLeaderDashboard} />
      <ProtectedRoute path="/checkins" component={Checkins} />
      <ProtectedRoute path="/one-on-one-meetings" component={OneOnOneMeetings} />
      
      {/* Reports Section */}
      <ProtectedRoute path="/reports" component={Reports} />
      <ProtectedRoute path="/okr-reports" component={OKRReports} />
      <ProtectedRoute path="/export-reports" component={ExportReports} />
      <ProtectedRoute path="/team-performance" component={TeamPerformance} />
      <ProtectedRoute path="/ai-recommendations" component={AIRecommendations} />
      
      {/* Communication */}
      <ProtectedRoute path="/chat" component={ChatPage} />
      <ProtectedRoute path="/feedback-wall" component={FeedbackWall} />
      
      {/* Wellness */}
      <ProtectedRoute path="/wellness-pulse" component={WellnessPulse} />
      
      {/* Organizations/Tenants */}
      <ProtectedRoute path="/tenants" component={TenantsPage} />
      {/* ID-based routes - these need to be later to avoid catching slug-based routes */}
      <ProtectedRoute path="/tenants/:id(\d+)" component={TenantPage} />
      <ProtectedRoute path="/tenants/:id(\d+)/subscription" component={TenantPage} />
      {/* Slug-based routes for organizations */}
      <ProtectedRoute path="/organization/:organisation" component={OrganizationPage} />
      <ProtectedRoute path="/organization/:organisation/subscription" component={OrganizationPage} />
      <ProtectedRoute path="/organization/:organisation/quick-start-guide" component={QuickStartGuide} />
      {/* Onboarding */}
      <ProtectedRoute path="/tenant-onboarding" component={TenantOnboardingPage} />
      
      {/* Drag and Drop Interfaces */}
      <ProtectedRoute path="/objectives-organizer" component={ObjectivesOrganizer} />
      <ProtectedRoute path="/timeline-editor" component={TimelineEditor} />
      <ProtectedRoute path="/custom-dashboard" component={CustomDashboard} />
      <ProtectedRoute path="/project-kanban" component={ProjectKanban} />


      <ProtectedRoute path="/import-financial" component={FinancePage} />
      
      <ProtectedRoute path="/configure" component={Configure} />
      <ProtectedRoute path="/configuration/general" component={General} />
      <ProtectedRoute path="/configuration/teams" component={TeamsConfig} />
      <ProtectedRoute path="/configuration/users-permissions" component={UsersPermissions} />
      <ProtectedRoute path="/configuration/integrations" component={Integrations} />
      <ProtectedRoute path="/configuration/status-settings" component={StatusSettings} />
      <ProtectedRoute path="/configuration/cadences" component={Cadences} />
      <ProtectedRoute path="/configuration/timeframes" component={Timeframes} />
      <ProtectedRoute path="/configuration/access-groups" component={AccessGroups} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Onboarding controller component
function OnboardingController() {
  // Get Started menu should only show when manually triggered by clicking the help icon
  // or other UI elements, not automatically on first login
  return (
    <>
      <GetStartedMenu />
      <IntroVideoDialog />
      <WalkthroughGuides />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider defaultTheme="system" storageKey="okr-app-theme">
        <TenantProvider>
          <HelpProvider>
            <OnboardingProvider>
              <LocationTracker />
              <FeatureTour />
              <OnboardingController />
              <AppRoutes />
            </OnboardingProvider>
          </HelpProvider>
        </TenantProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
