import { Switch, Route, useLocation, useRouter } from "wouter";
import { lazy, Suspense } from "react";

// Import only critical components immediately
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";

// Lazy load all other components for faster initial load
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Home = lazy(() => import("@/pages/home"));
const CompanyStrategy = lazy(() => import("@/pages/company-strategy"));
const Teams = lazy(() => import("@/pages/teams"));
const TeamsRedesigned = lazy(() => import("@/pages/teams-redesigned"));
const TeamDetail = lazy(() => import("@/pages/team-detail"));
const UserDetail = lazy(() => import("@/pages/single-profile"));
const ProjectDiagnostics = lazy(() => import("@/pages/project-diagnostics"));
const UsersPage = lazy(() => import("@/pages/users"));
const AllUsers = lazy(() => import("@/pages/all-users"));
const Checkins = lazy(() => import("@/pages/checkins"));
const General = lazy(() => import("@/pages/configuration/general"));
const TeamsConfig = lazy(() => import("@/pages/configuration/teams-config"));
const UsersPermissions = lazy(() => import("@/pages/configuration/users-permissions"));
const Integrations = lazy(() => import("@/pages/configuration/integrations"));
const Cadences = lazy(() => import("@/pages/configuration/cadences"));
const Timeframes = lazy(() => import("@/pages/configuration/timeframes"));
const Cycles = lazy(() => import("@/pages/configuration/cycles"));
const StatusSettings = lazy(() => import("@/pages/configuration/status-settings"));
const AccessGroups = lazy(() => import("@/pages/configuration/access-groups"));
const SystemSettings = lazy(() => import("@/pages/configuration/system-settings"));
const AdminLogin = lazy(() => import("@/pages/admin-login"));
const MyOKRs = lazy(() => import("@/pages/my-okrs"));
const DraftOKRs = lazy(() => import("@/pages/draft-okrs"));
const ApprovedOKRs = lazy(() => import("@/pages/approved-okrs"));
const ApprovedTenantOKRsPage = lazy(() => import("@/pages/approved-tenant-okrs"));
const CompanyOKRs = lazy(() => import("@/pages/company-okrs"));
const Reports = lazy(() => import("@/pages/reports"));
const OKRReports = lazy(() => import("@/pages/okr-reports"));
const ExportReports = lazy(() => import("@/pages/export-reports"));
const TeamPerformance = lazy(() => import("@/pages/team-performance"));
const AIRecommendations = lazy(() => import("@/pages/ai-recommendations"));
const QuickStartGuide = lazy(() => import("@/pages/quick-start-guide"));
const MissionPage = lazy(() => import("@/pages/mission"));
const MissionCompanyPage = lazy(() => import("@/pages/mission-company"));
const CompanyMission = lazy(() => import("@/pages/company-mission"));
const MissionOverview = lazy(() => import("@/pages/mission-overview"));
const OneOnOneMeetings = lazy(() => import("@/pages/one-on-one-meetings"));
const TeamLeaderDashboard = lazy(() => import("@/pages/team-leader-dashboard"));
const CEODashboard = lazy(() => import("@/pages/ceo-dashboard"));
const ManagementDashboard = lazy(() => import("@/pages/management-dashboard"));
const TestTeamLeader = lazy(() => import("@/pages/test-team-leader"));
const UserProfile = lazy(() => import("@/pages/user-profile"));
const ObjectiveDetail = lazy(() => import("@/pages/objective-detail"));
const ChatPage = lazy(() => import("@/pages/chat"));
const StrategyMap = lazy(() => import("@/pages/strategy-map"));
const CreateObjective = lazy(() => import("@/pages/create-objective"));
const CreateKeyResult = lazy(() => import("@/pages/create-key-result"));
const CreateCompanyObjective = lazy(() => import("@/pages/create-company-objective"));
const FinancePage = lazy(() => import("@/pages/import-financial"));
const ProjectKanban = lazy(() => import("@/pages/project-kanban"));
const FeedbackWall = lazy(() => import("@/pages/feedback-wall"));
const WellnessPulse = lazy(() => import("@/pages/wellness-pulse"));
const ProgressDashboard = lazy(() => import("@/pages/progress-dashboard"));
const Configure = lazy(() => import("@/pages/configure"));
const TestLoginPage = lazy(() => import("@/pages/test-login-page"));
const LoginTest = lazy(() => import("@/pages/login-test"));
const OKRSystemSetupPage = lazy(() => import("@/pages/okr-system-setup-page"));

// Lazy load tenant-related pages
const TenantsPage = lazy(() => import("@/pages/tenants-page"));
const TenantPage = lazy(() => import("@/pages/tenant-page"));
const OrganizationPage = lazy(() => import("@/pages/organization-page"));
const TenantOnboardingPage = lazy(() => import("@/pages/tenant-onboarding-page"));
const TenantOnboardingDemoPage = lazy(() => import("@/pages/tenant-onboarding-demo-page"));
const TenantDashboardRedirect = lazy(() => import("@/components/tenant/tenant-dashboard-redirect"));

// Import new drag-and-drop pages
import ObjectivesOrganizer from "@/pages/objectives-organizer";
import TimelineEditor from "@/pages/timeline-editor";
import CustomDashboard from "@/pages/custom-dashboard";
import { AuthProvider } from "@/hooks/use-auth";
import { HelpProvider } from "@/hooks/use-help-context";
import { ThemeProvider } from "@/hooks/use-theme";
import { TenantProvider } from "@/hooks/use-tenant-context";
import { TeamProvider } from "@/contexts/team-context";
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
import { NotificationProvider } from "@/components/notifications/notification-provider";
import { NotificationToastContainer } from "@/components/notifications/notification-toast";
import { ErrorBoundary } from "@/components/error-boundary";
import { RealTimeSyncProvider } from "@/hooks/use-real-time-sync";

// Location tracker component to monitor navigation for proper redirects
function LocationTracker() {
  const [location] = useLocation();
  const { user } = useAuth();

  // When navigation occurs and user is not logged in, save the path for post-login redirect
  useEffect(() => {
    if (!user && !location.startsWith("/auth")) {
      saveRedirectPath(location);
    }
  }, [location, user]);

  return null;
}

function AppRoutes() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading page...</span>
      </div>
    }>
      <Switch>
        <AuthGuard path="/auth" component={AuthPage} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/test-login" component={TestLoginPage} />
      <Route path="/login-test" component={LoginTest} />
      <Route path="/tenant-onboarding" component={TenantOnboardingPage} />
      <Route
        path="/tenant-onboarding-demo"
        component={TenantOnboardingDemoPage}
      />
      <Route path="/okr-system-setup" component={OKRSystemSetupPage} />
      <ProtectedRoute
        path="/:tenantId/okr-system-setup"
        component={OKRSystemSetupPage}
      />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/home" component={Home} />
      <ProtectedRoute path="/quick-start-guide" component={QuickStartGuide} />
      <ProtectedRoute path="/mission" component={MissionPage} />
      <ProtectedRoute path="/mission-company" component={MissionCompanyPage} />
      <ProtectedRoute path="/company-mission" component={CompanyMission} />
      <ProtectedRoute path="/mission-overview" component={MissionOverview} />
      <ProtectedRoute path="/company-strategy" component={CompanyStrategy} />

      {/* Manage OKRs Section */}
      <ProtectedRoute path="/my-okrs" component={MyOKRs} />
      <ProtectedRoute path="/draft-okrs" component={DraftOKRs} />
      <ProtectedRoute path="/approved-okrs" component={ApprovedOKRs} />
      <ProtectedRoute path="/company-okrs" component={CompanyOKRs} />
      <ProtectedRoute path="/objective/:id" component={ObjectiveDetail} />
      <ProtectedRoute path="/objectives/:id" component={ObjectiveDetail} />
      <ProtectedRoute
        path="/:tenantId/approved-okrs"
        component={ApprovedTenantOKRsPage}
      />
      <ProtectedRoute path="/strategy-map" component={StrategyMap} />
      <ProtectedRoute path="/create-objective" component={CreateObjective} />
      <ProtectedRoute path="/create-key-result" component={CreateKeyResult} />
      <ProtectedRoute
        path="/create-company-objective"
        component={CreateCompanyObjective}
      />

      {/* User Management Section */}
      <ProtectedRoute path="/teams" component={TeamsRedesigned} />
      <ProtectedRoute path="/teams/:id" component={TeamDetail} />
      <ProtectedRoute path="/users/:id" component={UserDetail} />
      <ProtectedRoute path="/users" component={UsersPage} />
      <ProtectedRoute path="/all-users" component={AllUsers} />
      <ProtectedRoute path="/user-profile" component={UserProfile} />

      {/* Dashboards */}
      <ProtectedRoute
        path="/team-leader-dashboard"
        component={TeamLeaderDashboard}
      />
      <ProtectedRoute
        path="/ceo-dashboard"
        component={CEODashboard}
      />
      <ProtectedRoute
        path="/management-dashboard"
        component={ManagementDashboard}
      />
      <ProtectedRoute path="/test-team-leader" component={TestTeamLeader} />
      <ProtectedRoute path="/checkins" component={Checkins} />
      <ProtectedRoute
        path="/one-on-one-meetings"
        component={OneOnOneMeetings}
      />

      {/* Reports Section */}
      <ProtectedRoute path="/reports" component={Reports} />
      <ProtectedRoute path="/okr-reports" component={OKRReports} />
      <ProtectedRoute path="/export-reports" component={ExportReports} />
      <ProtectedRoute path="/team-performance" component={TeamPerformance} />
      <ProtectedRoute
        path="/team-performance/:teamId"
        component={TeamPerformance}
      />
      <ProtectedRoute
        path="/ai-recommendations"
        component={AIRecommendations}
      />
      <ProtectedRoute
        path="/progress-dashboard"
        component={ProgressDashboard}
      />

      {/* Communication */}
      <ProtectedRoute path="/chat" component={ChatPage} />
      <ProtectedRoute path="/feedback-wall" component={FeedbackWall} />

      {/* Wellness */}
      <ProtectedRoute path="/wellness-pulse" component={WellnessPulse} />

      {/* Organizations/Tenants */}
      <ProtectedRoute path="/tenants" component={TenantsPage} />

      {/* ULID-based routes for organizations (new format using ULIDs directly) */}
      {/* <ProtectedRoute path="/:id([A-Z0-9]{26})" component={TenantDashboardRedirect} />
      <ProtectedRoute path="/:id([A-Z0-9]{26})/home" component={OrganizationPage} /> */}
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/subscription"
        component={OrganizationPage}
      />
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/quick-start-guide"
        component={QuickStartGuide}
      />
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/mission"
        component={MissionPage}
      />
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/strategy-map"
        component={StrategyMap}
      />
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/team-leader-dashboard"
        component={TeamLeaderDashboard}
      />

      {/* Main organization section routes with ULID */}
      <ProtectedRoute path="/:id([A-Z0-9]{26})" component={Dashboard} />
      <ProtectedRoute path="/:id([A-Z0-9]{26})/home" component={Home} />
      <ProtectedRoute path="/:id([A-Z0-9]{26})/my-okrs" component={MyOKRs} />
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/draft-okrs"
        component={DraftOKRs}
      />
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/approved-okrs"
        component={ApprovedOKRs}
      />
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/company-okrs"
        component={CompanyOKRs}
      />
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/company-strategy"
        component={CompanyStrategy}
      />
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/objectives/:objectiveId"
        component={ObjectiveDetail}
      />
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/create-objective"
        component={CreateObjective}
      />
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/create-key-result"
        component={CreateKeyResult}
      />
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/create-company-objective"
        component={CreateCompanyObjective}
      />
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/teams"
        component={TeamsRedesigned}
      />
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/teams/:teamId"
        component={TeamDetail}
      />
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/team/:teamSlug"
        component={TeamDetail}
      />
      <ProtectedRoute path="/:id([A-Z0-9]{26})/users" component={UsersPage} />
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/all-users"
        component={AllUsers}
      />
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/user-profile"
        component={UserProfile}
      />
      <ProtectedRoute path="/:id([A-Z0-9]{26})/reports" component={Reports} />
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/team-performance"
        component={TeamPerformance}
      />
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/team-performance/:teamId"
        component={TeamPerformance}
      />
      <ProtectedRoute path="/:id([A-Z0-9]{26})/chat" component={ChatPage} />
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/feedback-wall"
        component={FeedbackWall}
      />
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/wellness-pulse"
        component={WellnessPulse}
      />
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/configure"
        component={Configure}
      />
      <ProtectedRoute path="/:id([A-Z0-9]{26})/checkins" component={Checkins} />
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/one-on-one-meetings"
        component={OneOnOneMeetings}
      />
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/objectives-organizer"
        component={ObjectivesOrganizer}
      />
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/timeline-editor"
        component={TimelineEditor}
      />
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/custom-dashboard"
        component={CustomDashboard}
      />
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/project-kanban"
        component={ProjectKanban}
      />
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/import-financial"
        component={FinancePage}
      />

      {/* Configuration routes for organizations with ULID */}
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/configuration/general"
        component={General}
      />
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/configuration/teams"
        component={TeamsConfig}
      />
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/configuration/users-permissions"
        component={UsersPermissions}
      />
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/configuration/integrations"
        component={Integrations}
      />
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/configuration/status-settings"
        component={StatusSettings}
      />
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/configuration/cadences"
        component={Cadences}
      />
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/configuration/timeframes"
        component={Timeframes}
      />
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/configuration/cycles"
        component={Cycles}
      />
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/configuration/access-groups"
        component={AccessGroups}
      />
      <ProtectedRoute
        path="/:id([A-Z0-9]{26})/configuration/system-settings"
        component={SystemSettings}
      />

      {/* Legacy routes - keep for backward compatibility */}
      {/* ID-based routes - these need to be later to avoid catching slug-based routes */}
      <ProtectedRoute path="/tenants/:id(\d+)" component={TenantPage} />
      <ProtectedRoute
        path="/tenants/:id(\d+)/subscription"
        component={TenantPage}
      />

      {/* Legacy slug-based routes for organizations */}
      <ProtectedRoute
        path="/organization/:organisation"
        component={OrganizationPage}
      />
      <ProtectedRoute
        path="/organization/:organisation/home"
        component={OrganizationPage}
      />
      <ProtectedRoute
        path="/organization/:organisation/subscription"
        component={OrganizationPage}
      />
      <ProtectedRoute
        path="/organization/:organisation/quick-start-guide"
        component={QuickStartGuide}
      />
      <ProtectedRoute
        path="/organization/:organisation/mission"
        component={CompanyStrategy}
      />
      <ProtectedRoute
        path="/organization/:organisation/strategy-map"
        component={StrategyMap}
      />
      <ProtectedRoute
        path="/organization/:organisation/team-leader-dashboard"
        component={TeamLeaderDashboard}
      />

      {/* Legacy main organization section routes */}
      <ProtectedRoute
        path="/organization/:organisation/my-okrs"
        component={MyOKRs}
      />
      <ProtectedRoute
        path="/organization/:organisation/draft-okrs"
        component={DraftOKRs}
      />
      <ProtectedRoute
        path="/organization/:organisation/approved-okrs"
        component={ApprovedOKRs}
      />
      <ProtectedRoute
        path="/organization/:organisation/company-okrs"
        component={CompanyOKRs}
      />
      <ProtectedRoute
        path="/organization/:organisation/company-strategy"
        component={CompanyStrategy}
      />
      <ProtectedRoute
        path="/organization/:organisation/teams"
        component={TeamsRedesigned}
      />
      <ProtectedRoute
        path="/organization/:organisation/objective/:id"
        component={ObjectiveDetail}
      />
      <ProtectedRoute
        path="/organization/:organisation/teams/:id"
        component={TeamDetail}
      />
      <ProtectedRoute
        path="/organization/:organisation/users"
        component={UsersPage}
      />
      <ProtectedRoute
        path="/organization/:organisation/all-users"
        component={AllUsers}
      />
      <ProtectedRoute
        path="/organization/:organisation/user-profile"
        component={UserProfile}
      />
      <ProtectedRoute
        path="/organization/:organisation/reports"
        component={Reports}
      />
      <ProtectedRoute
        path="/organization/:organisation/chat"
        component={ChatPage}
      />
      <ProtectedRoute
        path="/organization/:organisation/feedback-wall"
        component={FeedbackWall}
      />
      <ProtectedRoute
        path="/organization/:organisation/wellness-pulse"
        component={WellnessPulse}
      />
      <ProtectedRoute
        path="/organization/:organisation/configure"
        component={Configure}
      />

      {/* Legacy configuration routes for organizations */}
      <ProtectedRoute
        path="/organization/:organisation/configuration/general"
        component={General}
      />
      <ProtectedRoute
        path="/organization/:organisation/configuration/teams"
        component={TeamsConfig}
      />
      <ProtectedRoute
        path="/organization/:organisation/configuration/users-permissions"
        component={UsersPermissions}
      />
      <ProtectedRoute
        path="/organization/:organisation/configuration/integrations"
        component={Integrations}
      />
      <ProtectedRoute
        path="/organization/:organisation/configuration/status-settings"
        component={StatusSettings}
      />
      <ProtectedRoute
        path="/organization/:organisation/configuration/cadences"
        component={Cadences}
      />
      <ProtectedRoute
        path="/organization/:organisation/configuration/timeframes"
        component={Timeframes}
      />
      <ProtectedRoute
        path="/organization/:organisation/configuration/cycles"
        component={Cycles}
      />
      <ProtectedRoute
        path="/organization/:organisation/configuration/access-groups"
        component={AccessGroups}
      />
      <ProtectedRoute
        path="/organization/:organisation/configuration/system-settings"
        component={SystemSettings}
      />
      {/* Onboarding */}
      <ProtectedRoute
        path="/tenant-onboarding"
        component={TenantOnboardingPage}
      />
      <Route
        path="/tenant-onboarding-demo"
        component={TenantOnboardingDemoPage}
      />

      {/* Drag and Drop Interfaces */}
      <ProtectedRoute
        path="/objectives-organizer"
        component={ObjectivesOrganizer}
      />
      <ProtectedRoute path="/timeline-editor" component={TimelineEditor} />
      <ProtectedRoute path="/custom-dashboard" component={CustomDashboard} />
      <ProtectedRoute path="/project-kanban" component={ProjectKanban} />
      <Route path="/project-diagnostics" component={ProjectDiagnostics} />

      <ProtectedRoute path="/import-financial" component={FinancePage} />

      <ProtectedRoute path="/configure" component={Configure} />
      <ProtectedRoute path="/configuration/general" component={General} />
      <ProtectedRoute path="/configuration/teams" component={TeamsConfig} />
      <ProtectedRoute
        path="/configuration/users-permissions"
        component={UsersPermissions}
      />
      <ProtectedRoute
        path="/configuration/integrations"
        component={Integrations}
      />
      <ProtectedRoute
        path="/configuration/status-settings"
        component={StatusSettings}
      />
      <ProtectedRoute path="/configuration/cadences" component={Cadences} />
      <ProtectedRoute path="/configuration/timeframes" component={Timeframes} />
      <ProtectedRoute path="/configuration/cycles" component={Cycles} />
      <ProtectedRoute
        path="/configuration/access-groups"
        component={AccessGroups}
      />
      <ProtectedRoute
        path="/configuration/system-settings"
        component={SystemSettings}
      />
      
      {/* Root route handler */}
      <ProtectedRoute path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
    </Suspense>
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
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system" storageKey="okr-app-theme">
        <TenantProvider>
          <AuthProvider>
            <TeamProvider>
              <RealTimeSyncProvider>
                <HelpProvider>
                  <NotificationProvider>
                    <OnboardingProvider>
                      <Suspense fallback={
                        <div className="flex items-center justify-center min-h-screen">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <span className="ml-3 text-muted-foreground">Loading...</span>
                        </div>
                      }>
                        <LocationTracker />
                        <FeatureTour />
                        <OnboardingController />
                        <AppRoutes />
                        <NotificationToastContainer />
                      </Suspense>
                    </OnboardingProvider>
                  </NotificationProvider>
                </HelpProvider>
              </RealTimeSyncProvider>
            </TeamProvider>
          </AuthProvider>
        </TenantProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
