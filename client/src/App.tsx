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
import IconGeneratorPage from "@/pages/icon-generator";
import { CookieConsent } from "@/components/gdpr/cookie-consent";
import SupportChat from "@/components/support/support-chat";

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
      {children}
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/">
            {() => <PublicLayout><LandingPage /></PublicLayout>}
          </Route>
          <Route path="/shared/:token">
            {(params) => <PublicLayout><SharedResultsViewer {...params} /></PublicLayout>}
          </Route>
          <Route path="/privacy">
            {() => <PublicLayout><PrivacyPage /></PublicLayout>}
          </Route>
          <Route path="/terms">
            {() => <PublicLayout><TermsPage /></PublicLayout>}
          </Route>
          <Route>
            {() => <PublicLayout><LandingPage /></PublicLayout>}
          </Route>
        </>
      ) : (
        <>
          <Route path="/">
            {() => <AuthenticatedLayout><Dashboard /></AuthenticatedLayout>}
          </Route>
          <Route path="/dashboard">
            {() => <AuthenticatedLayout><Dashboard /></AuthenticatedLayout>}
          </Route>
          <Route path="/admin">
            {() => <AuthenticatedLayout><AdminDashboard /></AuthenticatedLayout>}
          </Route>
          <Route path="/icon-generator">
            {() => <AuthenticatedLayout><IconGeneratorPage /></AuthenticatedLayout>}
          </Route>
          <Route path="/market-data">
            {() => <AuthenticatedLayout><MarketDataPage /></AuthenticatedLayout>}
          </Route>
          <Route path="/anomaly-detection">
            {() => <AuthenticatedLayout><AnomalyDetection /></AuthenticatedLayout>}
          </Route>
          <Route path="/my-shared-results">
            {() => <AuthenticatedLayout><MySharedResults /></AuthenticatedLayout>}
          </Route>
          <Route path="/shared/:token">
            {(params) => <PublicLayout><SharedResultsViewer {...params} /></PublicLayout>}
          </Route>
          <Route path="/privacy">
            {() => <AuthenticatedLayout><PrivacyPage /></AuthenticatedLayout>}
          </Route>
          <Route path="/privacy-settings">
            {() => <AuthenticatedLayout><PrivacySettings /></AuthenticatedLayout>}
          </Route>
          <Route path="/terms">
            {() => <AuthenticatedLayout><TermsPage /></AuthenticatedLayout>}
          </Route>
          <Route>
            {() => <AuthenticatedLayout><NotFound /></AuthenticatedLayout>}
          </Route>
        </>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <AccessibilityTesting />
          <Toaster />
          <Router />
          <SupportChat />
          <CookieConsent />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
