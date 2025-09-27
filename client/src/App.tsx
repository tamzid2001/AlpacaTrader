import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import { AccessibilityTesting } from "@/lib/accessibility-testing";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Sidebar from "@/components/layout/sidebar";
import LandingPage from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import AdminDashboard from "@/pages/admin";
import AnomalyDetection from "@/pages/anomaly-detection";
import MarketDataPage from "@/pages/market-data";
import SharedResultsViewer from "@/pages/shared-results";
import MySharedResults from "@/pages/my-shared-results";
import PrivacyPage from "@/pages/privacy";
import PrivacySettings from "@/pages/privacy-settings";
import TermsPage from "@/pages/terms";
import NotFound from "@/pages/not-found";
import { CookieConsent } from "@/components/gdpr/cookie-consent";
import SupportChat from "@/components/support/support-chat";
import { ErrorBoundary } from "@/components/error-boundary/ErrorBoundary";
import { NotFoundFallback } from "@/components/error-boundary/NotFoundFallback";

// Layout wrapper for authenticated pages
function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </div>
  );
}

// Layout wrapper for public pages
function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <ErrorBoundary>
      <Switch>
        {isLoading || !isAuthenticated ? (
          <>
            <Route path="/">
              {() => <ErrorBoundary><PublicLayout><LandingPage /></PublicLayout></ErrorBoundary>}
            </Route>
            <Route path="/shared/:token">
              {() => <ErrorBoundary><PublicLayout><SharedResultsViewer /></PublicLayout></ErrorBoundary>}
            </Route>
            <Route path="/privacy">
              {() => <ErrorBoundary><PublicLayout><PrivacyPage /></PublicLayout></ErrorBoundary>}
            </Route>
            <Route path="/terms">
              {() => <ErrorBoundary><PublicLayout><TermsPage /></PublicLayout></ErrorBoundary>}
            </Route>
            <Route>
              {() => <ErrorBoundary><PublicLayout><LandingPage /></PublicLayout></ErrorBoundary>}
            </Route>
          </>
        ) : (
          <>
            <Route path="/">
              {() => <ErrorBoundary><AuthenticatedLayout><Dashboard /></AuthenticatedLayout></ErrorBoundary>}
            </Route>
            <Route path="/dashboard">
              {() => <ErrorBoundary><AuthenticatedLayout><Dashboard /></AuthenticatedLayout></ErrorBoundary>}
            </Route>
            <Route path="/admin">
              {() => <ErrorBoundary><AuthenticatedLayout><AdminDashboard /></AuthenticatedLayout></ErrorBoundary>}
            </Route>
            <Route path="/market-data">
              {() => <ErrorBoundary><AuthenticatedLayout><MarketDataPage /></AuthenticatedLayout></ErrorBoundary>}
            </Route>
            <Route path="/anomaly-detection">
              {() => <ErrorBoundary><AuthenticatedLayout><AnomalyDetection /></AuthenticatedLayout></ErrorBoundary>}
            </Route>
            <Route path="/my-shared-results">
              {() => <ErrorBoundary><AuthenticatedLayout><MySharedResults /></AuthenticatedLayout></ErrorBoundary>}
            </Route>
            <Route path="/shared/:token">
              {() => <ErrorBoundary><PublicLayout><SharedResultsViewer /></PublicLayout></ErrorBoundary>}
            </Route>
            <Route path="/privacy">
              {() => <ErrorBoundary><AuthenticatedLayout><PrivacyPage /></AuthenticatedLayout></ErrorBoundary>}
            </Route>
            <Route path="/privacy-settings">
              {() => <ErrorBoundary><AuthenticatedLayout><PrivacySettings /></AuthenticatedLayout></ErrorBoundary>}
            </Route>
            <Route path="/terms">
              {() => <ErrorBoundary><AuthenticatedLayout><TermsPage /></AuthenticatedLayout></ErrorBoundary>}
            </Route>
            <Route>
              {() => <ErrorBoundary fallback={<NotFoundFallback />}><AuthenticatedLayout><NotFound /></AuthenticatedLayout></ErrorBoundary>}
            </Route>
          </>
        )}
      </Switch>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <AuthProvider>
            <TooltipProvider>
              <ErrorBoundary>
                <AccessibilityTesting />
              </ErrorBoundary>
              <Toaster />
              <Router />
              <ErrorBoundary>
                <SupportChat />
              </ErrorBoundary>
              <ErrorBoundary>
                <CookieConsent />
              </ErrorBoundary>
            </TooltipProvider>
          </AuthProvider>
        </ErrorBoundary>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
