import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import Sidebar from "@/components/layout/sidebar";
import IconGenerator from "@/components/icons/icon-generator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function IconGeneratorPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/");
      return;
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (!user.isApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="text-center">Approval Pending</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Your account is currently pending approval from our admin team. 
              You'll receive access to the platform once approved.
            </p>
            <a href="/">
              <button className="px-4 py-2 border rounded-md hover:bg-muted transition-colors">
                Return to Home
              </button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <main className="flex-1 ml-64" data-testid="icon-generator-page" role="main">
        {/* Header Information */}
        <div className="border-b bg-card">
          <div className="container mx-auto py-6 px-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
                  Icon Generator & Manager
                </h1>
                <p className="text-muted-foreground" data-testid="text-page-description">
                  Browse, customize, and manage icons from multiple libraries
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">React Icons 5.4.0</Badge>
                <Badge variant="secondary">Lucide React</Badge>
                <Badge variant="outline">Font Awesome 6</Badge>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">8000+</p>
                    <p className="text-sm text-muted-foreground">Total Icons</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">10</p>
                    <p className="text-sm text-muted-foreground">Libraries</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">25+</p>
                    <p className="text-sm text-muted-foreground">Categories</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">SVG</p>
                    <p className="text-sm text-muted-foreground">Export Format</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Icon Generator Component */}
        <div className="p-0">
          <IconGenerator />
        </div>

        {/* Footer Information */}
        <div className="border-t bg-card mt-8">
          <div className="container mx-auto py-6 px-4">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Supported Libraries</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Lucide React (1000+ icons)</li>
                  <li>• Font Awesome 6 (1200+ icons)</li>
                  <li>• Material Design (900+ icons)</li>
                  <li>• Heroicons 2 (300+ icons)</li>
                  <li>• Bootstrap Icons (1300+ icons)</li>
                  <li>• And 5+ more libraries</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Features</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Real-time search & filtering</li>
                  <li>• Icon customization</li>
                  <li>• Favorites & recent icons</li>
                  <li>• Export as SVG/PNG/React</li>
                  <li>• Accessibility compliant</li>
                  <li>• Performance optimized</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Export Formats</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• SVG (vector format)</li>
                  <li>• PNG (raster format)</li>
                  <li>• React Component (JSX)</li>
                  <li>• Custom sizing</li>
                  <li>• Color customization</li>
                  <li>• Batch processing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}