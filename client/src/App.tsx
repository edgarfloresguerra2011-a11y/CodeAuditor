import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import NewProject from "@/pages/new-project";
import ProjectView from "@/pages/project-view";
import AutopilotPage from "@/pages/autopilot";
import MagazineView from "@/pages/magazine-view";
import SettingsPage from "@/pages/settings";
import AuthPage from "@/pages/auth-page";
import ManualCreate from "@/pages/manual-create";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, loading } = useAuth();
  const [_, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    setTimeout(() => setLocation("/auth"), 0);
    return null;
  }

  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/new-project">
        {() => <ProtectedRoute component={NewProject} />}
      </Route>
      <Route path="/project/:id">
        {(params) => <ProtectedRoute component={ProjectView} params={params} />}
      </Route>
      <Route path="/projects/:id">
        {(params) => <ProtectedRoute component={ProjectView} params={params} />}
      </Route>
      <Route path="/autopilot">
        {() => <ProtectedRoute component={AutopilotPage} />}
      </Route>
      <Route path="/manual-create">
        {() => <ProtectedRoute component={ManualCreate} />}
      </Route>
      <Route path="/magazine/:id">
        {(params) => <ProtectedRoute component={MagazineView} params={params} />}
      </Route>
      <Route path="/settings">
        {() => <ProtectedRoute component={SettingsPage} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
