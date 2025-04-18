import { Switch, Route, useLocation, useRouter } from "wouter";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Home from "@/pages/home";
import CompanyStrategy from "@/pages/company-strategy";
import Teams from "@/pages/teams";
import TeamDetail from "@/pages/team-detail";
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
import TeamLeaderDashboard from "@/pages/team-leader-dashboard";
import UserProfile from "@/pages/user-profile";
import ObjectiveDetail from "@/pages/objective-detail";
import ChatPage from "@/pages/chat";
// Import new drag-and-drop pages
import ObjectivesOrganizer from "@/pages/objectives-organizer";
import TimelineEditor from "@/pages/timeline-editor";
import CustomDashboard from "@/pages/custom-dashboard";
import { AuthProvider } from "@/hooks/use-auth";
import { HelpProvider } from "@/hooks/use-help-context";
import { ThemeProvider } from "@/hooks/use-theme";
import { FeatureTour } from "@/components/help/feature-tour";
import { Loader2 } from "lucide-react";
// Import onboarding components
import { OnboardingProvider, useOnboarding } from "@/hooks/use-onboarding";
import { GetStartedMenu } from "@/components/onboarding/get-started-menu";
import { IntroVideoDialog } from "@/components/onboarding/intro-video-dialog";
import { WalkthroughGuides } from "@/components/onboarding/walkthrough-guides";
import { useEffect } from "react";
// Import confetti and milestone components
import { MilestoneProvider } from "@/contexts/milestone-context";
import { MilestoneToast } from "@/components/milestone-toast";
import { ConfettiDemo } from "@/components/confetti-demo";

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
      <PublicRoute path="/objective-detail/:id" component={ObjectiveDetail} />
      
      {/* User Management Section */}
      <PublicRoute path="/teams" component={Teams} />
      <PublicRoute path="/teams/:id" component={TeamDetail} />
      <PublicRoute path="/users" component={UsersPage} />
      <PublicRoute path="/all-users" component={AllUsers} />
      <PublicRoute path="/user-profile" component={UserProfile} />
      
      {/* Dashboards */}
      <PublicRoute path="/team-leader-dashboard" component={TeamLeaderDashboard} />
      <PublicRoute path="/checkins" component={Checkins} />
      <PublicRoute path="/one-on-one-meetings" component={OneOnOneMeetings} />
      
      {/* Reports Section */}
      <PublicRoute path="/reports" component={Reports} />
      <PublicRoute path="/okr-reports" component={OKRReports} />
      <PublicRoute path="/export-reports" component={ExportReports} />
      <PublicRoute path="/team-performance" component={TeamPerformance} />
      <PublicRoute path="/ai-recommendations" component={AIRecommendations} />
      
      {/* Communication */}
      <PublicRoute path="/chat" component={ChatPage} />
      
      {/* Drag and Drop Interfaces */}
      <PublicRoute path="/objectives-organizer" component={ObjectivesOrganizer} />
      <PublicRoute path="/timeline-editor" component={TimelineEditor} />
      <PublicRoute path="/custom-dashboard" component={CustomDashboard} />
      
      {/* Confetti Demo */}
      <PublicRoute path="/confetti-demo" component={ConfettiDemo} />
      
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
        <HelpProvider>
          <OnboardingProvider>
            <MilestoneProvider>
              <FeatureTour />
              <OnboardingController />
              <MilestoneToast />
              <AppRoutes />
            </MilestoneProvider>
          </OnboardingProvider>
        </HelpProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
