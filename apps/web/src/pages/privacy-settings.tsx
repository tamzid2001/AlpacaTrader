import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  User, 
  Edit3, 
  Eye, 
  Database,
  FileText,
  AlertTriangle,
  Info,
  ArrowLeft,
  CheckCircle,
  Clock
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { PrivacyDashboard } from "@/components/gdpr/privacy-dashboard";

// Schema for profile rectification
const profileUpdateSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
});

type ProfileUpdateForm = z.infer<typeof profileUpdateSchema>;

interface PersonalDataView {
  profile: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    createdAt: string;
    updatedAt: string;
  };
  courses: any[];
  quizResults: any[];
  csvUploads: any[];
  sharedResults: any[];
  supportMessages: any[];
  consentRecords: any[];
}

export default function PrivacySettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State for data access (Article 15)
  const [personalData, setPersonalData] = useState<PersonalDataView | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [showDataView, setShowDataView] = useState(false);
  
  // State for profile rectification (Article 16)
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  // State for objection requests (Article 21)
  const [objectionReason, setObjectionReason] = useState("");
  const [showObjectionForm, setShowObjectionForm] = useState(false);
  const [isSubmittingObjection, setIsSubmittingObjection] = useState(false);

  const profileForm = useForm<ProfileUpdateForm>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
    },
  });

  useEffect(() => {
    // Set document title for accessibility
    document.title = "Privacy Settings | MarketDifferentials";
  }, []);

  useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
      });
    }
  }, [user, profileForm]);

  // Article 15: Right to Access - Load all personal data
  const loadPersonalData = async () => {
    setIsLoadingData(true);
    try {
      const response = await fetch('/api/gdpr/personal-data', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setPersonalData(data);
        setShowDataView(true);
      } else {
        throw new Error('Failed to load personal data');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Access Failed",
        description: "Failed to retrieve your personal data. Please try again.",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  // Article 16: Right to Rectification - Update profile information
  const handleProfileUpdate = async (data: ProfileUpdateForm) => {
    setIsUpdatingProfile(true);
    try {
      const response = await fetch('/api/gdpr/rectification', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: "Profile Updated",
          description: "Your profile information has been successfully updated.",
        });
        setShowProfileEdit(false);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update your profile. Please try again.",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Article 21: Right to Object - Submit objection to data processing
  const handleObjectionSubmit = async () => {
    if (!objectionReason.trim()) {
      toast({
        variant: "destructive",
        title: "Reason Required",
        description: "Please provide a reason for your objection.",
      });
      return;
    }

    setIsSubmittingObjection(true);
    try {
      const response = await fetch('/api/gdpr/objection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          reason: objectionReason,
          processingTypes: ['marketing', 'analytics', 'profiling'], // Common objection types
        }),
      });

      if (response.ok) {
        toast({
          title: "Objection Submitted",
          description: "Your objection to data processing has been recorded and will be reviewed.",
        });
        setShowObjectionForm(false);
        setObjectionReason("");
      } else {
        throw new Error('Failed to submit objection');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Failed to submit your objection. Please try again.",
      });
    } finally {
      setIsSubmittingObjection(false);
    }
  };

  const formatJsonData = (data: any) => {
    return JSON.stringify(data, null, 2);
  };

  const getDataSummary = (data: PersonalDataView) => {
    return {
      profileFields: Object.keys(data.profile || {}).length,
      courseEnrollments: data.courses?.length || 0,
      quizResults: data.quizResults?.length || 0,
      csvUploads: data.csvUploads?.length || 0,
      sharedResults: data.sharedResults?.length || 0,
      supportMessages: data.supportMessages?.length || 0,
      consentRecords: data.consentRecords?.length || 0,
    };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" data-testid="button-back-dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold" data-testid="text-privacy-settings-title">
                  Privacy Settings
                </h1>
                <p className="text-muted-foreground" data-testid="text-privacy-settings-subtitle">
                  Exercise your data protection rights and manage your privacy preferences
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" data-testid="tab-privacy-dashboard">
              Privacy Dashboard
            </TabsTrigger>
            <TabsTrigger value="data-access" data-testid="tab-data-access">
              <Eye className="h-4 w-4 mr-2" />
              Data Access
            </TabsTrigger>
            <TabsTrigger value="rectification" data-testid="tab-rectification">
              <Edit3 className="h-4 w-4 mr-2" />
              Update Profile
            </TabsTrigger>
            <TabsTrigger value="objection" data-testid="tab-objection">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Object to Processing
            </TabsTrigger>
          </TabsList>

          {/* Privacy Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <PrivacyDashboard />
          </TabsContent>

          {/* Article 15: Right to Access */}
          <TabsContent value="data-access" className="space-y-6">
            <Card data-testid="card-data-access">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Right to Access (Article 15)
                </CardTitle>
                <CardDescription>
                  View all personal data we hold about you in a clear and comprehensive format
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    This will compile all your personal data from across our platform, including profile information, 
                    course progress, uploaded files, and interaction history.
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={loadPersonalData}
                  disabled={isLoadingData}
                  className="w-full"
                  data-testid="button-view-personal-data"
                >
                  {isLoadingData ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Loading Your Data...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      View All My Personal Data
                    </>
                  )}
                </Button>

                {/* Data View Modal */}
                <Dialog open={showDataView} onOpenChange={setShowDataView}>
                  <DialogContent className="max-w-4xl max-h-[80vh]" data-testid="modal-personal-data">
                    <DialogHeader>
                      <DialogTitle>Your Personal Data</DialogTitle>
                      <DialogDescription>
                        Complete overview of all personal data we process about you
                      </DialogDescription>
                    </DialogHeader>

                    {personalData && (
                      <div className="space-y-6">
                        {/* Data Summary */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {Object.entries(getDataSummary(personalData)).map(([key, value]) => (
                            <div key={key} className="text-center p-3 border rounded-lg">
                              <div className="text-2xl font-bold text-primary">{value}</div>
                              <div className="text-xs text-muted-foreground capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </div>
                            </div>
                          ))}
                        </div>

                        <Separator />

                        {/* Detailed Data View */}
                        <ScrollArea className="h-96">
                          <Tabs defaultValue="profile-data" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                              <TabsTrigger value="profile-data">Profile</TabsTrigger>
                              <TabsTrigger value="activity-data">Activity</TabsTrigger>
                              <TabsTrigger value="raw-data">Raw Data</TabsTrigger>
                            </TabsList>

                            <TabsContent value="profile-data" className="space-y-4">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg">Profile Information</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">User ID</Label>
                                      <p className="text-sm text-muted-foreground">{personalData.profile?.id}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Email</Label>
                                      <p className="text-sm text-muted-foreground">{personalData.profile?.email}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">First Name</Label>
                                      <p className="text-sm text-muted-foreground">{personalData.profile?.firstName}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Last Name</Label>
                                      <p className="text-sm text-muted-foreground">{personalData.profile?.lastName}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Account Created</Label>
                                      <p className="text-sm text-muted-foreground">
                                        {new Date(personalData.profile?.createdAt).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Role</Label>
                                      <Badge variant="outline">{personalData.profile?.role}</Badge>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </TabsContent>

                            <TabsContent value="activity-data" className="space-y-4">
                              <div className="grid gap-4">
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">Course Activity</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                      {personalData.courses?.length || 0} course enrollments recorded
                                    </p>
                                  </CardContent>
                                </Card>

                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">Data Processing</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                      {personalData.csvUploads?.length || 0} CSV files uploaded and processed
                                    </p>
                                  </CardContent>
                                </Card>

                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">Sharing Activity</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                      {personalData.sharedResults?.length || 0} results shared with others
                                    </p>
                                  </CardContent>
                                </Card>
                              </div>
                            </TabsContent>

                            <TabsContent value="raw-data" className="space-y-4">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg">Complete Data Export</CardTitle>
                                  <CardDescription>
                                    Machine-readable format of all your personal data
                                  </CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-64">
                                    {formatJsonData(personalData)}
                                  </pre>
                                </CardContent>
                              </Card>
                            </TabsContent>
                          </Tabs>
                        </ScrollArea>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Article 16: Right to Rectification */}
          <TabsContent value="rectification" className="space-y-6">
            <Card data-testid="card-rectification">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit3 className="h-5 w-5" />
                  Right to Rectification (Article 16)
                </CardTitle>
                <CardDescription>
                  Update and correct your personal information to ensure it remains accurate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={profileForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter your first name"
                                data-testid="input-first-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter your last name"
                                data-testid="input-last-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="Enter your email address"
                              data-testid="input-email"
                            />
                          </FormControl>
                          <FormDescription>
                            Changes to your email address may require verification
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        We are required to verify the accuracy of updated information. 
                        Some changes may require additional verification steps.
                      </AlertDescription>
                    </Alert>

                    <Button
                      type="submit"
                      disabled={isUpdatingProfile}
                      className="w-full"
                      data-testid="button-update-profile"
                    >
                      {isUpdatingProfile ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Updating Profile...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Update My Information
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Article 21: Right to Object */}
          <TabsContent value="objection" className="space-y-6">
            <Card data-testid="card-objection">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Right to Object (Article 21)
                </CardTitle>
                <CardDescription>
                  Object to certain types of data processing, particularly for marketing and profiling purposes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    You have the right to object to processing of your personal data for marketing purposes, 
                    profiling, or other purposes based on legitimate interests. We will stop such processing 
                    unless we can demonstrate compelling legitimate grounds.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <Label htmlFor="objection-reason" className="text-base font-medium">
                    Reason for Objection
                  </Label>
                  <Textarea
                    id="objection-reason"
                    value={objectionReason}
                    onChange={(e) => setObjectionReason(e.target.value)}
                    placeholder="Please explain why you object to the processing of your personal data. Include specific types of processing you wish to object to (e.g., marketing emails, profiling for recommendations, etc.)"
                    rows={6}
                    data-testid="textarea-objection-reason"
                  />
                  <p className="text-sm text-muted-foreground">
                    Common objections include: marketing communications, automated decision-making, 
                    profiling for personalization, data sharing with third parties, or processing 
                    based on legitimate interests.
                  </p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">What happens next?</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• We will review your objection within 30 days</li>
                    <li>• Processing will be suspended pending review</li>
                    <li>• You will receive a response explaining our decision</li>
                    <li>• If upheld, processing will be permanently stopped</li>
                  </ul>
                </div>

                <Button
                  onClick={handleObjectionSubmit}
                  disabled={isSubmittingObjection || !objectionReason.trim()}
                  className="w-full"
                  data-testid="button-submit-objection"
                >
                  {isSubmittingObjection ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Submitting Objection...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Submit Objection
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}