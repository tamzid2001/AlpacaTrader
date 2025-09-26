import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Download, 
  Trash2, 
  History, 
  Eye, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  FileText,
  Database,
  UserCheck
} from "lucide-react";
import { useCookieConsent } from "./cookie-consent";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface ConsentRecord {
  id: string;
  consentType: string;
  consentGiven: boolean;
  consentDate: string;
  withdrawnAt?: string;
  purpose: string;
  legalBasis: string;
}

interface DataProcessingRecord {
  id: string;
  action: string;
  dataType: string;
  timestamp: string;
  processingPurpose: string;
  legalBasis: string;
}

export function PrivacyDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { consent, hasConsented, updateConsent, withdrawConsent } = useCookieConsent();
  
  // State for GDPR operations
  const [consentHistory, setConsentHistory] = useState<ConsentRecord[]>([]);
  const [processingHistory, setProcessingHistory] = useState<DataProcessingRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Local consent preferences (separate from cookie consent)
  const [gdprConsent, setGdprConsent] = useState({
    marketing: false,
    analytics: false,
    dataRetention: false,
    profileSharing: false,
  });

  useEffect(() => {
    if (user) {
      loadConsentHistory();
      loadProcessingHistory();
      loadGdprPreferences();
    }
  }, [user]);

  const loadConsentHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch('/api/gdpr/consent-history', {
        credentials: 'include'
      });
      if (response.ok) {
        const history = await response.json();
        setConsentHistory(history);
      }
    } catch (error) {
      console.error('Error loading consent history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadProcessingHistory = async () => {
    try {
      const response = await fetch('/api/gdpr/processing-history', {
        credentials: 'include'
      });
      if (response.ok) {
        const history = await response.json();
        setProcessingHistory(history);
      }
    } catch (error) {
      console.error('Error loading processing history:', error);
    }
  };

  const loadGdprPreferences = async () => {
    try {
      const response = await fetch('/api/gdpr/preferences', {
        credentials: 'include'
      });
      if (response.ok) {
        const preferences = await response.json();
        setGdprConsent(preferences);
      }
    } catch (error) {
      console.error('Error loading GDPR preferences:', error);
    }
  };

  const updateGdprConsent = async (type: keyof typeof gdprConsent, value: boolean) => {
    try {
      const response = await fetch('/api/gdpr/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          consentType: type,
          consentGiven: value,
          purpose: getConsentPurpose(type),
          legalBasis: 'consent'
        })
      });

      if (response.ok) {
        setGdprConsent(prev => ({ ...prev, [type]: value }));
        toast({
          title: "Preferences Updated",
          description: `Your ${type} preference has been ${value ? 'enabled' : 'disabled'}.`,
        });
        await loadConsentHistory(); // Refresh history
      } else {
        throw new Error('Failed to update consent');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update your preferences. Please try again.",
      });
    }
  };

  const getConsentPurpose = (type: string): string => {
    const purposes: Record<string, string> = {
      marketing: "Receive marketing communications and personalized offers",
      analytics: "Help improve our services through usage analytics",
      dataRetention: "Extended data retention for improved service",
      profileSharing: "Allow sharing of anonymized profile data for research"
    };
    return purposes[type] || "General data processing";
  };

  const handleDataExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/gdpr/export', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `personal-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Data Export Complete",
          description: "Your personal data has been exported and downloaded.",
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export your data. Please try again.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleAccountDeletion = async () => {
    setIsDeletingAccount(true);
    try {
      const response = await fetch('/api/gdpr/delete', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: "Account Deletion Requested",
          description: "Your account deletion request has been submitted. You will receive an email confirmation.",
        });
        setShowDeleteConfirm(false);
      } else {
        throw new Error('Deletion request failed');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Request Failed",
        description: "Failed to submit deletion request. Please try again.",
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getConsentStatusBadge = (given: boolean, withdrawn?: string) => {
    if (withdrawn) {
      return <Badge variant="secondary" className="text-xs">Withdrawn</Badge>;
    }
    return given ? 
      <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">Active</Badge> :
      <Badge variant="destructive" className="text-xs">Denied</Badge>;
  };

  return (
    <div className="space-y-6" data-testid="dashboard-privacy">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-privacy-title">Privacy Dashboard</h1>
          <p className="text-muted-foreground" data-testid="text-privacy-subtitle">
            Manage your data privacy preferences and exercise your rights
          </p>
        </div>
      </div>

      <Tabs defaultValue="preferences" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="preferences" data-testid="tab-preferences">
            <Settings className="h-4 w-4 mr-2" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="data-rights" data-testid="tab-data-rights">
            <UserCheck className="h-4 w-4 mr-2" />
            Data Rights
          </TabsTrigger>
          <TabsTrigger value="consent-history" data-testid="tab-consent-history">
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="processing-log" data-testid="tab-processing-log">
            <Database className="h-4 w-4 mr-2" />
            Activity Log
          </TabsTrigger>
        </TabsList>

        {/* Consent Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          {/* Cookie Consent Status */}
          <Card data-testid="card-cookie-status">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Cookie Preferences
              </CardTitle>
              <CardDescription>
                Your current cookie consent preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hasConsented && consent ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex flex-col items-center p-3 border rounded-lg">
                      <div className={`text-sm font-medium ${consent.essential ? 'text-green-600' : 'text-gray-500'}`}>
                        Essential
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {consent.essential ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                    <div className="flex flex-col items-center p-3 border rounded-lg">
                      <div className={`text-sm font-medium ${consent.analytics ? 'text-green-600' : 'text-gray-500'}`}>
                        Analytics
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {consent.analytics ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                    <div className="flex flex-col items-center p-3 border rounded-lg">
                      <div className={`text-sm font-medium ${consent.marketing ? 'text-green-600' : 'text-gray-500'}`}>
                        Marketing
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {consent.marketing ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                    <div className="flex flex-col items-center p-3 border rounded-lg">
                      <div className={`text-sm font-medium ${consent.preferences ? 'text-green-600' : 'text-gray-500'}`}>
                        Preferences
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {consent.preferences ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={withdrawConsent}
                    className="w-full"
                    data-testid="button-manage-cookies"
                  >
                    Manage Cookie Preferences
                  </Button>
                </div>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No cookie preferences have been set. Please accept or customize your cookie settings.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* GDPR Consent Preferences */}
          <Card data-testid="card-gdpr-preferences">
            <CardHeader>
              <CardTitle>Data Processing Preferences</CardTitle>
              <CardDescription>
                Control how we process your personal data beyond essential functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Marketing Communications */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="marketing-consent" className="text-base font-medium">
                    Marketing Communications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email updates about new courses, features, and promotional offers
                  </p>
                </div>
                <Switch
                  id="marketing-consent"
                  checked={gdprConsent.marketing}
                  onCheckedChange={(checked) => updateGdprConsent('marketing', checked)}
                  data-testid="switch-marketing-consent"
                />
              </div>

              <Separator />

              {/* Analytics */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="analytics-consent" className="text-base font-medium">
                    Usage Analytics
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Help us improve our platform by sharing anonymous usage data
                  </p>
                </div>
                <Switch
                  id="analytics-consent"
                  checked={gdprConsent.analytics}
                  onCheckedChange={(checked) => updateGdprConsent('analytics', checked)}
                  data-testid="switch-analytics-consent"
                />
              </div>

              <Separator />

              {/* Data Retention */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="retention-consent" className="text-base font-medium">
                    Extended Data Retention
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Keep your data longer to provide personalized recommendations
                  </p>
                </div>
                <Switch
                  id="retention-consent"
                  checked={gdprConsent.dataRetention}
                  onCheckedChange={(checked) => updateGdprConsent('dataRetention', checked)}
                  data-testid="switch-retention-consent"
                />
              </div>

              <Separator />

              {/* Profile Sharing */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="sharing-consent" className="text-base font-medium">
                    Research Participation
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Allow anonymized data to be used for educational research
                  </p>
                </div>
                <Switch
                  id="sharing-consent"
                  checked={gdprConsent.profileSharing}
                  onCheckedChange={(checked) => updateGdprConsent('profileSharing', checked)}
                  data-testid="switch-sharing-consent"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Rights Tab */}
        <TabsContent value="data-rights" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Data Export */}
            <Card data-testid="card-data-export">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Your Data
                </CardTitle>
                <CardDescription>
                  Download all your personal data in a machine-readable format (Article 20 - Right to Data Portability)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Your export will include:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Profile information</li>
                      <li>Course progress and quiz results</li>
                      <li>CSV uploads and analysis results</li>
                      <li>Sharing data and collaboration history</li>
                      <li>Consent and preference history</li>
                    </ul>
                  </div>
                  <Button
                    onClick={handleDataExport}
                    disabled={isExporting}
                    className="w-full"
                    data-testid="button-export-data"
                  >
                    {isExporting ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Preparing Export...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download My Data
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Account Deletion */}
            <Card data-testid="card-account-deletion">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-destructive" />
                  Delete Account
                </CardTitle>
                <CardDescription>
                  Permanently delete your account and all associated data (Article 17 - Right to Erasure)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This action cannot be undone. All your data will be permanently deleted after a 30-day grace period.
                  </AlertDescription>
                </Alert>

                <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="w-full" data-testid="button-delete-account">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Request Account Deletion
                    </Button>
                  </DialogTrigger>
                  <DialogContent data-testid="modal-delete-confirmation">
                    <DialogHeader>
                      <DialogTitle>Confirm Account Deletion</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete your account? This will:
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <ul className="text-sm space-y-2">
                        <li>• Delete all your personal data</li>
                        <li>• Remove your course progress and quiz results</li>
                        <li>• Delete all uploaded CSV files and analysis results</li>
                        <li>• Cancel any shared data links</li>
                        <li>• This action cannot be undone</li>
                      </ul>
                      <div className="flex gap-3 justify-end">
                        <Button
                          variant="outline"
                          onClick={() => setShowDeleteConfirm(false)}
                          data-testid="button-cancel-deletion"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleAccountDeletion}
                          disabled={isDeletingAccount}
                          data-testid="button-confirm-deletion"
                        >
                          {isDeletingAccount ? "Processing..." : "Delete My Account"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Consent History Tab */}
        <TabsContent value="consent-history" className="space-y-6">
          <Card data-testid="card-consent-history">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Consent History
              </CardTitle>
              <CardDescription>
                Track all changes to your consent preferences over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center h-32">
                    <Clock className="h-6 w-6 animate-spin" />
                  </div>
                ) : consentHistory.length > 0 ? (
                  <div className="space-y-4">
                    {consentHistory.map((record) => (
                      <div key={record.id} className="border rounded-lg p-4" data-testid={`consent-record-${record.id}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{record.consentType}</span>
                            {getConsentStatusBadge(record.consentGiven, record.withdrawnAt)}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(record.consentDate)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{record.purpose}</p>
                        <div className="text-xs text-muted-foreground mt-1">
                          Legal basis: {record.legalBasis}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground" data-testid="text-no-consent-history">
                    No consent history available
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Processing Log Tab */}
        <TabsContent value="processing-log" className="space-y-6">
          <Card data-testid="card-processing-log">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Processing Activity
              </CardTitle>
              <CardDescription>
                View all data processing activities on your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {processingHistory.length > 0 ? (
                  <div className="space-y-3">
                    {processingHistory.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`processing-record-${record.id}`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {record.action}
                            </Badge>
                            <span className="text-sm font-medium">{record.dataType}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {record.processingPurpose} • {record.legalBasis}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(record.timestamp)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground" data-testid="text-no-processing-history">
                    No processing activity recorded
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}