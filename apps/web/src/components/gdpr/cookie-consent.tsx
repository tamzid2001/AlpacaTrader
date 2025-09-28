import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, Settings, Cookie, Info, CheckCircle } from "lucide-react";

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

interface CookieConsentProps {
  onAcceptAll?: () => void;
  onRejectAll?: () => void;
  onSavePreferences?: (preferences: CookiePreferences) => void;
}

const STORAGE_KEY = "gdpr-cookie-consent";
const PREFERENCES_KEY = "gdpr-cookie-preferences";

export function CookieConsent({ onAcceptAll, onRejectAll, onSavePreferences }: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Always required
    analytics: false,
    marketing: false,
    preferences: false,
  });

  useEffect(() => {
    // Check if user has already made a consent decision
    const consentStatus = localStorage.getItem(STORAGE_KEY);
    const savedPreferences = localStorage.getItem(PREFERENCES_KEY);
    
    if (!consentStatus) {
      // Show banner if no consent decision made
      setIsVisible(true);
    } else if (savedPreferences) {
      // Load saved preferences
      try {
        setPreferences(JSON.parse(savedPreferences));
      } catch (error) {
        console.error("Error loading cookie preferences:", error);
      }
    }
  }, []);

  const saveConsentDecision = (decision: 'accepted' | 'rejected' | 'custom', prefs?: CookiePreferences) => {
    const timestamp = new Date().toISOString();
    const consentData = {
      decision,
      timestamp,
      preferences: prefs || preferences,
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consentData));
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs || preferences));
    setIsVisible(false);
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      essential: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    setPreferences(allAccepted);
    saveConsentDecision('accepted', allAccepted);
    onAcceptAll?.();
  };

  const handleRejectAll = () => {
    const minimalPrefs = {
      essential: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };
    setPreferences(minimalPrefs);
    saveConsentDecision('rejected', minimalPrefs);
    onRejectAll?.();
  };

  const handleSavePreferences = () => {
    saveConsentDecision('custom', preferences);
    onSavePreferences?.(preferences);
    setShowDetails(false);
  };

  const updatePreference = (key: keyof CookiePreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: key === 'essential' ? true : value, // Essential cookies cannot be disabled
    }));
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t shadow-lg" data-testid="banner-cookie-consent">
      <div className="max-w-6xl mx-auto">
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              {/* Icon and main content */}
              <div className="flex items-start gap-3 flex-1">
                <div className="flex-shrink-0 mt-1">
                  <Cookie className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold mb-2 text-foreground" data-testid="text-cookie-title">
                    Cookie Settings
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-cookie-description">
                    We use cookies to enhance your browsing experience, provide personalized content, and analyze our traffic. 
                    You can choose which categories of cookies to allow. Essential cookies are required for basic functionality and cannot be disabled.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Dialog open={showDetails} onOpenChange={setShowDetails}>
                      <DialogTrigger asChild>
                        <Button variant="link" className="h-auto p-0 text-sm text-primary" data-testid="button-customize-cookies">
                          <Settings className="h-4 w-4 mr-1" />
                          Customize Settings
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                    <Button variant="link" className="h-auto p-0 text-sm text-muted-foreground" asChild data-testid="link-privacy-policy">
                      <a href="/privacy" target="_blank" rel="noopener noreferrer">
                        <Shield className="h-4 w-4 mr-1" />
                        Privacy Policy
                      </a>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto min-w-fit">
                <Button 
                  variant="outline" 
                  onClick={handleRejectAll}
                  className="w-full sm:w-auto"
                  data-testid="button-reject-cookies"
                >
                  Reject Non-Essential
                </Button>
                <Button 
                  onClick={handleAcceptAll}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                  data-testid="button-accept-cookies"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cookie Preferences Modal */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-2xl max-h-[80vh]" data-testid="modal-cookie-preferences">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2" data-testid="text-preferences-title">
                <Cookie className="h-5 w-5" />
                Cookie Preferences
              </DialogTitle>
              <p className="text-sm text-muted-foreground" data-testid="text-preferences-description">
                Manage your cookie preferences below. You can enable or disable different types of cookies based on your preferences.
              </p>
            </DialogHeader>

            <ScrollArea className="max-h-[50vh] pr-4">
              <div className="space-y-6">
                {/* Essential Cookies */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="essential-cookies" className="text-base font-medium">
                        Essential Cookies
                      </Label>
                      <Badge variant="secondary" className="text-xs">
                        Required
                      </Badge>
                    </div>
                    <Switch
                      id="essential-cookies"
                      checked={preferences.essential}
                      onCheckedChange={(checked) => updatePreference('essential', checked)}
                      disabled={true}
                      data-testid="switch-essential-cookies"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground" data-testid="text-essential-description">
                    These cookies are necessary for the website to function and cannot be disabled. They are usually set in response to actions made by you which amount to a request for services, such as setting your privacy preferences, logging in, or filling in forms.
                  </p>
                </div>

                <Separator />

                {/* Analytics Cookies */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="analytics-cookies" className="text-base font-medium">
                      Analytics Cookies
                    </Label>
                    <Switch
                      id="analytics-cookies"
                      checked={preferences.analytics}
                      onCheckedChange={(checked) => updatePreference('analytics', checked)}
                      data-testid="switch-analytics-cookies"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground" data-testid="text-analytics-description">
                    These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our site's performance and user experience.
                  </p>
                  <div className="text-xs text-muted-foreground">
                    <strong>Examples:</strong> Google Analytics, usage statistics, performance monitoring
                  </div>
                </div>

                <Separator />

                {/* Marketing Cookies */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="marketing-cookies" className="text-base font-medium">
                      Marketing Cookies
                    </Label>
                    <Switch
                      id="marketing-cookies"
                      checked={preferences.marketing}
                      onCheckedChange={(checked) => updatePreference('marketing', checked)}
                      data-testid="switch-marketing-cookies"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground" data-testid="text-marketing-description">
                    These cookies track your online activity to help advertisers deliver more relevant advertising or to limit how many times you see an ad. They may be used to build a profile of your interests and show you relevant ads on other sites.
                  </p>
                  <div className="text-xs text-muted-foreground">
                    <strong>Examples:</strong> Social media pixels, advertising networks, retargeting
                  </div>
                </div>

                <Separator />

                {/* Preference Cookies */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="preferences-cookies" className="text-base font-medium">
                      Preference Cookies
                    </Label>
                    <Switch
                      id="preferences-cookies"
                      checked={preferences.preferences}
                      onCheckedChange={(checked) => updatePreference('preferences', checked)}
                      data-testid="switch-preference-cookies"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground" data-testid="text-preferences-cookie-description">
                    These cookies enable the website to remember information that changes the way the website behaves or looks, such as your preferred language, region, or theme settings.
                  </p>
                  <div className="text-xs text-muted-foreground">
                    <strong>Examples:</strong> Language settings, theme preferences, region settings
                  </div>
                </div>
              </div>
            </ScrollArea>

            <Separator />

            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDetails(false)}
                data-testid="button-cancel-preferences"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSavePreferences}
                data-testid="button-save-preferences"
              >
                Save Preferences
              </Button>
            </div>

            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Your Privacy Rights</p>
                  <p>
                    You can withdraw your consent at any time by revisiting your cookie preferences. 
                    For more information about how we process your data, please see our{" "}
                    <a href="/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                      Privacy Policy
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Hook to check current cookie consent status
export function useCookieConsent() {
  const [consent, setConsent] = useState<CookiePreferences | null>(null);
  const [hasConsented, setHasConsented] = useState(false);

  useEffect(() => {
    const consentStatus = localStorage.getItem(STORAGE_KEY);
    const savedPreferences = localStorage.getItem(PREFERENCES_KEY);
    
    if (consentStatus && savedPreferences) {
      try {
        setConsent(JSON.parse(savedPreferences));
        setHasConsented(true);
      } catch (error) {
        console.error("Error loading cookie consent:", error);
        setHasConsented(false);
      }
    } else {
      setHasConsented(false);
    }
  }, []);

  const updateConsent = (preferences: CookiePreferences) => {
    const timestamp = new Date().toISOString();
    const consentData = {
      decision: 'custom',
      timestamp,
      preferences,
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consentData));
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    setConsent(preferences);
    setHasConsented(true);
  };

  const withdrawConsent = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PREFERENCES_KEY);
    setConsent(null);
    setHasConsented(false);
  };

  return {
    consent,
    hasConsented,
    updateConsent,
    withdrawConsent,
  };
}