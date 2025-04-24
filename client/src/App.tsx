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
import { ProtectedRoute } from "@/lib/protected-route";
import { AuthGuard } from "@/lib/auth-guard";

function AppRoutes() {
  return (
    <Switch>
      <AuthGuard path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/home" component={Home} />
      <ProtectedRoute path="/quick-start-guide" component={QuickStartGuide} />
      <ProtectedRoute path="/mission" component={MissionPage} />
      <ProtectedRoute path="/company-strategy" component={CompanyStrategy} />
      
      {/* Manage OKRs Section */}
      <ProtectedRoute path="/my-okrs" component={MyOKRs} />
      <ProtectedRoute path="/draft-okrs" component={DraftOKRs} />
      <ProtectedRoute path="/approved-okrs" component={ApprovedOKRs} />
      <ProtectedRoute path="/company-okrs" component={CompanyOKRs} />
      <ProtectedRoute path="/objective-detail/:id" component={ObjectiveDetail} />
      
      {/* User Management Section */}
      <ProtectedRoute path="/teams" component={Teams} />
      <ProtectedRoute path="/teams/:id" component={TeamDetail} />
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
      
      {/* Drag and Drop Interfaces */}
      <ProtectedRoute path="/objectives-organizer" component={ObjectivesOrganizer} />
      <ProtectedRoute path="/timeline-editor" component={TimelineEditor} />
      <ProtectedRoute path="/custom-dashboard" component={CustomDashboard} />
      
      <ProtectedRoute path="/configuration/general" component={General} />
      <ProtectedRoute path="/configuration/teams" component={TeamsConfig} />
      <ProtectedRoute path="/configuration/users-permissions" component={UsersPermissions} />
      <ProtectedRoute path="/configuration/integrations" component={Integrations} />
      <ProtectedRoute path="/configuration/status-settings" component={StatusSettings} />
      <ProtectedRoute path="/configuration/cadences" component={Cadences} />
      <ProtectedRoute path="/configuration/timeframes" component={Timeframes} />
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
            <FeatureTour />
            <OnboardingController />
            <AppRoutes />
          </OnboardingProvider>
        </HelpProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
