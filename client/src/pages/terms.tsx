import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header removed - now handled by App layout */}
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16" role="main" id="main-content">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4" data-testid="text-terms-title">
            Terms of Service
          </h1>
          <p className="text-muted-foreground text-lg" data-testid="text-terms-subtitle">
            Last updated: January 15, 2025
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                By accessing and using PropFarming Pro, you accept and agree to be bound by 
                the terms and provision of this agreement. These Terms of Service constitute 
                a legally binding agreement between you and PropFarming Pro.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Use of Service</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>You agree to use our service only for lawful purposes and in accordance with these terms. You agree not to:</p>
              <ul>
                <li>Use the service in any way that violates applicable laws or regulations</li>
                <li>Share your account credentials with others</li>
                <li>Attempt to gain unauthorized access to the service</li>
                <li>Interfere with or disrupt the service or servers</li>
                <li>Use the service for any commercial purpose without our consent</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Registration</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                To access certain features of the service, you must register for an account. 
                You are responsible for maintaining the confidentiality of your account credentials 
                and for all activities that occur under your account.
              </p>
              <p>
                Account approval is subject to review by our administrative team. We reserve 
                the right to approve or reject any registration at our discretion.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Course Content and Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                All course materials, including videos, documents, and other content, are 
                the intellectual property of PropFarming Pro and are protected by copyright 
                and other laws. You may access and use the content for personal, non-commercial 
                educational purposes only.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment and Refunds</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                Course fees are charged at the time of enrollment. We offer a 30-day refund 
                policy for course fees, provided you have completed less than 25% of the course 
                material. Refund requests must be submitted in writing.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Disclaimer of Warranties</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                The service is provided "as is" without warranty of any kind. We disclaim 
                all warranties, express or implied, including but not limited to the implied 
                warranties of merchantability and fitness for a particular purpose.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                If you have any questions about these Terms of Service, please contact us at{" "}
                <a href="mailto:legal@propfarmingpro.com" className="text-primary hover:underline">
                  legal@propfarmingpro.com
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* Footer removed - now handled by App layout */}
    </div>
  );
}
