import SkillsPage from '@/pages/skills';
import ProfilePage from '@/pages/profile';
import RoadmapPage from '@/pages/roadmap';
import CareerGoalPage from '@/pages/career-goal';
import SkillAssessmentPage from '@/pages/skill-assessment';
import DashboardPage from '@/pages/dashboard';
import NotFound from '@/pages/not-found';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/context/AuthContext';
import { AppShell } from '@/components/layout/app-shell';
import { Landing } from '@/components/landing';
import { AuthPage } from '@/components/auth-page';

const queryClient = new QueryClient();

function WorkspaceRoutes() {
  return (
    <AppShell>
      <Switch>
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/skills" component={SkillsPage} />
        <Route path="/career-goal" component={CareerGoalPage} />
        <Route path="/skill-assessment" component={SkillAssessmentPage} />
        <Route path="/roadmap" component={RoadmapPage} />
        <Route component={NotFound} />
      </Switch>
    </AppShell>
  );
}

function Router() {
  const [location] = useLocation();
  return (
    <ErrorBoundary resetKey={location}>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login">
          <AuthPage mode="login" />
        </Route>
        <Route path="/register">
          <AuthPage mode="register" />
        </Route>
        <Route>
          <WorkspaceRoutes />
        </Route>
      </Switch>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
