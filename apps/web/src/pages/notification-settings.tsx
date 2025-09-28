import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { EnhancedIcon } from "@/components/icons/enhanced-icon";
import { Skeleton } from "@/components/ui/skeleton";

interface NotificationPreferences {
  id: string;
  userId: string;
  emailNotifications: boolean;
  emailMarketDataAlerts: boolean;
  emailProductivityReminders: boolean;
  emailCourseUpdates: boolean;
  emailShareInvitations: boolean;
  emailAdminNotifications: boolean;
  pushNotifications: boolean;
  pushMarketDataAlerts: boolean;
  pushProductivityReminders: boolean;
  pushCourseUpdates: boolean;
  inAppNotifications: boolean;
  inAppMarketDataAlerts: boolean;
  inAppProductivityReminders: boolean;
  inAppCourseUpdates: boolean;
  inAppShareInvitations: boolean;
  inAppAdminNotifications: boolean;
  emailFrequency: "instant" | "daily" | "weekly" | "off";
  digestEmailTime: string;
  weeklyDigestDay: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
  soundEnabled: boolean;
  desktopNotifications: boolean;
  allowNotificationAnalytics: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface NotificationPreferencesResponse {
  preferences: NotificationPreferences;
}

const notificationTypes = [
  {
    key: "MarketDataAlerts",
    icon: "TrendingUp",
    title: "Market Data Alerts",
    description: "Price alerts, market updates, and trading opportunities",
    emailKey: "emailMarketDataAlerts" as keyof NotificationPreferences,
    pushKey: "pushMarketDataAlerts" as keyof NotificationPreferences,
    inAppKey: "inAppMarketDataAlerts" as keyof NotificationPreferences,
  },
  {
    key: "ProductivityReminders",
    icon: "CheckSquare",
    title: "Productivity Reminders",
    description: "Task deadlines, board updates, and workflow notifications",
    emailKey: "emailProductivityReminders" as keyof NotificationPreferences,
    pushKey: "pushProductivityReminders" as keyof NotificationPreferences,
    inAppKey: "inAppProductivityReminders" as keyof NotificationPreferences,
  },
  {
    key: "CourseUpdates",
    icon: "BookOpen",
    title: "Course Updates",
    description: "New content, course progress, and educational materials",
    emailKey: "emailCourseUpdates" as keyof NotificationPreferences,
    pushKey: "pushCourseUpdates" as keyof NotificationPreferences,
    inAppKey: "inAppCourseUpdates" as keyof NotificationPreferences,
  },
  {
    key: "ShareInvitations",
    icon: "Share2",
    title: "Share Invitations",
    description: "Data sharing requests and collaboration invites",
    emailKey: "emailShareInvitations" as keyof NotificationPreferences,
    pushKey: null, // No push for share invitations
    inAppKey: "inAppShareInvitations" as keyof NotificationPreferences,
  },
  {
    key: "AdminNotifications",
    icon: "Shield",
    title: "Admin Notifications",
    description: "System updates, policy changes, and important announcements",
    emailKey: "emailAdminNotifications" as keyof NotificationPreferences,
    pushKey: null, // No push for admin notifications
    inAppKey: "inAppAdminNotifications" as keyof NotificationPreferences,
  },
];

export default function NotificationSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);
  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences | null>(null);

  // Fetch notification preferences
  const { data: preferences, isLoading, error } = useQuery<NotificationPreferencesResponse>({
    queryKey: ["/api/notifications/preferences"],
    enabled: !!user,
  });

  // Set local preferences when data loads
  useEffect(() => {
    if (preferences?.preferences) {
      setLocalPreferences(preferences.preferences);
    }
  }, [preferences]);

  // Update notification preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      const response = await apiRequest("PUT", "/api/notifications/preferences", updates);
      return response.json();
    },
    onSuccess: (data) => {
      setLocalPreferences(data.preferences);
      setHasChanges(false);
      toast({
        title: "✅ Settings Saved",
        description: "Your notification preferences have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/preferences"] });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Update Failed",
        description: error.message || "Failed to update notification preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: any) => {
    if (!localPreferences) return;
    
    const updatedPreferences = { ...localPreferences, [key]: value };
    setLocalPreferences(updatedPreferences);
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!localPreferences || !hasChanges) return;
    updatePreferencesMutation.mutate(localPreferences);
  };

  const handleReset = () => {
    if (preferences?.preferences) {
      setLocalPreferences(preferences.preferences);
      setHasChanges(false);
    }
  };

  const testNotification = async () => {
    try {
      await apiRequest("POST", "/api/notifications/create-test", {
        type: "system_update",
        title: "Test Notification",
        message: "This is a test notification to verify your settings are working correctly.",
      });

      toast({
        title: "🧪 Test Notification Sent",
        description: "Check your notifications to see if the test was successful.",
      });
    } catch (error) {
      toast({
        title: "❌ Test Failed",
        description: "Failed to send test notification. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !localPreferences) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="text-center py-8">
            <EnhancedIcon name="AlertTriangle" size={48} className="mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load Settings</h3>
            <p className="text-muted-foreground mb-4">
              There was an error loading your notification preferences.
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              data-testid="button-retry-preferences"
            >
              <EnhancedIcon name="RotateCcw" size={16} className="mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="page-notification-settings">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
            Notification Settings
          </h1>
          <p className="text-muted-foreground mt-2" data-testid="text-page-description">
            Manage how and when you receive notifications from PropFarming Pro
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={testNotification}
            data-testid="button-test-notification"
          >
            <EnhancedIcon name="TestTube" size={16} className="mr-2" />
            Test
          </Button>
          
          {hasChanges && (
            <Button
              variant="outline"
              onClick={handleReset}
              data-testid="button-reset-preferences"
            >
              <EnhancedIcon name="RotateCcw" size={16} className="mr-2" />
              Reset
            </Button>
          )}
          
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updatePreferencesMutation.isPending}
            data-testid="button-save-preferences"
          >
            {updatePreferencesMutation.isPending ? (
              <>
                <EnhancedIcon name="Loader2" size={16} className="mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <EnhancedIcon name="Save" size={16} className="mr-2" />
                Save Changes
                {hasChanges && <Badge variant="secondary" className="ml-2">•</Badge>}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Global Settings */}
      <Card data-testid="card-global-settings">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <EnhancedIcon name="Settings" size={20} />
            Global Notification Settings
          </CardTitle>
          <CardDescription>
            Control your overall notification preferences and delivery methods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Frequency */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="email-frequency" className="text-sm font-medium">
                Email Frequency
              </Label>
              <p className="text-sm text-muted-foreground">
                How often you receive email notifications
              </p>
            </div>
            <Select
              value={localPreferences.emailFrequency}
              onValueChange={(value) => handlePreferenceChange("emailFrequency", value)}
              data-testid="select-email-frequency"
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">📧 Instant</SelectItem>
                <SelectItem value="daily">📅 Daily Digest</SelectItem>
                <SelectItem value="weekly">📆 Weekly Digest</SelectItem>
                <SelectItem value="off">🚫 Never</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Digest Time */}
          {(localPreferences.emailFrequency === 'daily' || localPreferences.emailFrequency === 'weekly') && (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="digest-time" className="text-sm font-medium">
                    Digest Delivery Time
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    When to send your digest emails
                  </p>
                </div>
                <Select
                  value={localPreferences.digestEmailTime}
                  onValueChange={(value) => handlePreferenceChange("digestEmailTime", value)}
                  data-testid="select-digest-time"
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="06:00">🌅 6:00 AM</SelectItem>
                    <SelectItem value="09:00">☀️ 9:00 AM</SelectItem>
                    <SelectItem value="12:00">🕛 12:00 PM</SelectItem>
                    <SelectItem value="18:00">🌆 6:00 PM</SelectItem>
                    <SelectItem value="21:00">🌙 9:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {localPreferences.emailFrequency === 'weekly' && (
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="weekly-day" className="text-sm font-medium">
                      Weekly Digest Day
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Which day to send your weekly digest
                    </p>
                  </div>
                  <Select
                    value={localPreferences.weeklyDigestDay}
                    onValueChange={(value) => handlePreferenceChange("weeklyDigestDay", value)}
                    data-testid="select-weekly-day"
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monday">Monday</SelectItem>
                      <SelectItem value="tuesday">Tuesday</SelectItem>
                      <SelectItem value="wednesday">Wednesday</SelectItem>
                      <SelectItem value="thursday">Thursday</SelectItem>
                      <SelectItem value="friday">Friday</SelectItem>
                      <SelectItem value="saturday">Saturday</SelectItem>
                      <SelectItem value="sunday">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          <Separator />

          {/* Global Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="in-app-notifications" className="text-sm font-medium">
                  In-App Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Show notifications within the app
                </p>
              </div>
              <Switch
                id="in-app-notifications"
                checked={localPreferences.inAppNotifications}
                onCheckedChange={(value) => handlePreferenceChange("inAppNotifications", value)}
                data-testid="switch-in-app-notifications"
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="sound-enabled" className="text-sm font-medium">
                  Sound Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Play sound for new notifications
                </p>
              </div>
              <Switch
                id="sound-enabled"
                checked={localPreferences.soundEnabled}
                onCheckedChange={(value) => handlePreferenceChange("soundEnabled", value)}
                data-testid="switch-sound-enabled"
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="desktop-notifications" className="text-sm font-medium">
                  Browser Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Show desktop push notifications
                </p>
              </div>
              <Switch
                id="desktop-notifications"
                checked={localPreferences.desktopNotifications}
                onCheckedChange={(value) => handlePreferenceChange("desktopNotifications", value)}
                data-testid="switch-desktop-notifications"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      {notificationTypes.map((type, index) => (
        <Card key={type.key} data-testid={`card-notification-type-${type.key.toLowerCase()}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <EnhancedIcon name={type.icon} size={20} className="text-primary" />
              </div>
              {type.title}
            </CardTitle>
            <CardDescription>{type.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Email */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <EnhancedIcon name="Mail" size={16} className="text-muted-foreground" />
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-xs text-muted-foreground">Email notifications</p>
                  </div>
                </div>
                <Switch
                  checked={localPreferences[type.emailKey] as boolean}
                  onCheckedChange={(value) => handlePreferenceChange(type.emailKey, value)}
                  disabled={localPreferences.emailFrequency === 'off'}
                  data-testid={`switch-${type.key.toLowerCase()}-email`}
                />
              </div>

              {/* In-App */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <EnhancedIcon name="Bell" size={16} className="text-muted-foreground" />
                  <div>
                    <Label className="text-sm font-medium">In-App</Label>
                    <p className="text-xs text-muted-foreground">Show in notification center</p>
                  </div>
                </div>
                <Switch
                  checked={localPreferences[type.inAppKey] as boolean}
                  onCheckedChange={(value) => handlePreferenceChange(type.inAppKey, value)}
                  disabled={!localPreferences.inAppNotifications}
                  data-testid={`switch-${type.key.toLowerCase()}-in-app`}
                />
              </div>

              {/* Push (if available) */}
              {type.pushKey && (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <EnhancedIcon name="Smartphone" size={16} className="text-muted-foreground" />
                    <div>
                      <Label className="text-sm font-medium">Push</Label>
                      <p className="text-xs text-muted-foreground">Browser push notifications</p>
                    </div>
                  </div>
                  <Switch
                    checked={localPreferences[type.pushKey] as boolean}
                    onCheckedChange={(value) => handlePreferenceChange(type.pushKey!, value)}
                    disabled={!localPreferences.desktopNotifications}
                    data-testid={`switch-${type.key.toLowerCase()}-push`}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Privacy Settings */}
      <Card data-testid="card-privacy-settings">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <EnhancedIcon name="Shield" size={20} />
            Privacy & Analytics
          </CardTitle>
          <CardDescription>
            Control how your notification data is used for improving the service
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="analytics" className="text-sm font-medium">
                Allow Notification Analytics
              </Label>
              <p className="text-sm text-muted-foreground">
                Help us improve notification delivery and relevance (anonymous data only)
              </p>
            </div>
            <Switch
              id="analytics"
              checked={localPreferences.allowNotificationAnalytics}
              onCheckedChange={(value) => handlePreferenceChange("allowNotificationAnalytics", value)}
              data-testid="switch-notification-analytics"
            />
          </div>
        </CardContent>
      </Card>

      {/* Help & Support */}
      <Card data-testid="card-help-support">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <EnhancedIcon name="HelpCircle" size={32} className="mx-auto text-muted-foreground" />
            <div>
              <h3 className="font-medium">Need Help?</h3>
              <p className="text-sm text-muted-foreground">
                If you're not receiving notifications or have questions about your settings
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" data-testid="link-help-center">
                <EnhancedIcon name="Book" size={16} className="mr-2" />
                Help Center
              </Button>
              <Button variant="outline" size="sm" data-testid="link-contact-support">
                <EnhancedIcon name="MessageSquare" size={16} className="mr-2" />
                Contact Support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}