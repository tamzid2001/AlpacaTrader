import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Check, Share2, Globe, Download, Clock, Shield, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CsvUpload } from "@shared/schema";

interface ShareDialogProps {
  csvUpload: CsvUpload | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ShareSettings {
  title: string;
  description: string;
  permissions: "view_only" | "view_download";
  expirationOption: "24h" | "7d" | "30d" | "never";
}

interface ShareResult {
  id: string;
  shareToken: string;
  shareUrl: string;
  permissions: string;
  expiresAt: string | null;
  createdAt: string;
}

export function ShareDialog({ csvUpload, isOpen, onClose }: ShareDialogProps) {
  const [step, setStep] = useState<"configure" | "success">("configure");
  const [settings, setSettings] = useState<ShareSettings>({
    title: "",
    description: "",
    permissions: "view_only",
    expirationOption: "7d",
  });
  const [shareResult, setShareResult] = useState<ShareResult | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const shareMutation = useMutation({
    mutationFn: async (shareData: any) => {
      const response = await apiRequest("POST", "/api/share/results", shareData);
      return response.json();
    },
    onSuccess: (result: ShareResult) => {
      setShareResult(result);
      setStep("success");
      toast({
        title: "Sharing link created",
        description: "Your anomaly analysis results are now ready to share!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/shared"] });
    },
    onError: (error: any) => {
      toast({
        title: "Sharing failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleShare = () => {
    if (!csvUpload) return;

    shareMutation.mutate({
      csvUploadId: csvUpload.id,
      title: settings.title || `${csvUpload.customFilename} - Anomaly Analysis`,
      description: settings.description,
      permissions: settings.permissions,
      expirationOption: settings.expirationOption,
    });
  };

  const copyToClipboard = async () => {
    if (!shareResult?.shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareResult.shareUrl);
      setCopiedUrl(true);
      toast({
        title: "Link copied!",
        description: "The sharing link has been copied to your clipboard.",
      });
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  const resetDialog = () => {
    setStep("configure");
    setShareResult(null);
    setSettings({
      title: "",
      description: "",
      permissions: "view_only",
      expirationOption: "7d",
    });
    setConsentGiven(false);
    setCopiedUrl(false);
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  const getExpirationText = (option: string) => {
    switch (option) {
      case "24h": return "24 hours";
      case "7d": return "7 days";
      case "30d": return "30 days";
      case "never": return "Never expires";
      default: return "7 days";
    }
  };

  if (!csvUpload) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl" data-testid="dialog-share-results">
        {step === "configure" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Share Anomaly Analysis Results
              </DialogTitle>
              <DialogDescription>
                Share your anomaly detection results with others. You can control who can view and download your analysis.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* File Information */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">File to Share</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div><strong>Filename:</strong> {csvUpload.customFilename}</div>
                  <div><strong>Uploaded:</strong> {new Date(csvUpload.uploadedAt).toLocaleDateString()}</div>
                  <div><strong>Size:</strong> {csvUpload.rowCount.toLocaleString()} rows, {csvUpload.columnCount} columns</div>
                </div>
              </div>

              {/* Share Configuration */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="share-title">Title (optional)</Label>
                  <Input
                    id="share-title"
                    placeholder={`${csvUpload.customFilename} - Anomaly Analysis`}
                    value={settings.title}
                    onChange={(e) => setSettings(prev => ({ ...prev, title: e.target.value }))}
                    data-testid="input-share-title"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This title will be shown to viewers of your shared results
                  </p>
                </div>

                <div>
                  <Label htmlFor="share-description">Description (optional)</Label>
                  <Textarea
                    id="share-description"
                    placeholder="Describe what this analysis shows or any important findings..."
                    value={settings.description}
                    onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                    className="min-h-[80px]"
                    data-testid="textarea-share-description"
                  />
                </div>

                {/* Permissions */}
                <div>
                  <Label className="text-base font-medium">Permissions</Label>
                  <RadioGroup
                    value={settings.permissions}
                    onValueChange={(value: "view_only" | "view_download") => 
                      setSettings(prev => ({ ...prev, permissions: value }))
                    }
                    className="mt-2"
                    data-testid="radio-group-permissions"
                  >
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="view_only" id="view-only" />
                      <div className="flex-1">
                        <Label htmlFor="view-only" className="flex items-center gap-2 font-medium">
                          <Globe className="h-4 w-4" />
                          View Only
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Recipients can view charts and analysis results but cannot download Excel files
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="view_download" id="view-download" />
                      <div className="flex-1">
                        <Label htmlFor="view-download" className="flex items-center gap-2 font-medium">
                          <Download className="h-4 w-4" />
                          View + Download
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Recipients can view results and download Excel reports for Monday.com
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Expiration */}
                <div>
                  <Label htmlFor="expiration">Link Expiration</Label>
                  <Select
                    value={settings.expirationOption}
                    onValueChange={(value: "24h" | "7d" | "30d" | "never") => 
                      setSettings(prev => ({ ...prev, expirationOption: value }))
                    }
                  >
                    <SelectTrigger className="mt-2" data-testid="select-expiration">
                      <Clock className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">24 hours</SelectItem>
                      <SelectItem value="7d">7 days</SelectItem>
                      <SelectItem value="30d">30 days</SelectItem>
                      <SelectItem value="never">Never expires</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    The link will expire after {getExpirationText(settings.expirationOption).toLowerCase()}
                  </p>
                </div>

                {/* Privacy Consent */}
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <div>
                        <strong>Privacy Notice:</strong> By sharing this analysis, you're making your data visible to anyone with the link. 
                        The shared data includes:
                      </div>
                      <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                        <li>CSV data and analysis results</li>
                        <li>Detected anomalies and their descriptions</li>
                        <li>Charts and visualizations</li>
                        <li>Your name as the person who shared it</li>
                        {settings.permissions === "view_download" && (
                          <li>Excel export files (if download permission is granted)</li>
                        )}
                      </ul>
                      <div className="flex items-center space-x-2 mt-4">
                        <Checkbox
                          id="consent"
                          checked={consentGiven}
                          onCheckedChange={(checked) => setConsentGiven(!!checked)}
                          data-testid="checkbox-consent"
                        />
                        <Label htmlFor="consent" className="text-sm">
                          I understand and consent to sharing this data publicly via the generated link
                        </Label>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} data-testid="button-cancel-share">
                Cancel
              </Button>
              <Button
                onClick={handleShare}
                disabled={!consentGiven || shareMutation.isPending}
                data-testid="button-create-share-link"
              >
                {shareMutation.isPending ? "Creating Link..." : "Create Share Link"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                Sharing Link Created Successfully!
              </DialogTitle>
              <DialogDescription>
                Your anomaly analysis results are now ready to share. Copy the link below to share with others.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Share Link */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <Label className="text-base font-medium">Share Link</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    value={shareResult?.shareUrl || ""}
                    readOnly
                    className="font-mono text-sm"
                    data-testid="input-share-url"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyToClipboard}
                    className="flex items-center gap-2"
                    data-testid="button-copy-link"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Share Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="font-medium">Permissions</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {shareResult?.permissions === "view_download" ? (
                      <>
                        <Download className="h-4 w-4" />
                        View + Download
                      </>
                    ) : (
                      <>
                        <Globe className="h-4 w-4" />
                        View Only
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="font-medium">Expires</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4" />
                    {shareResult?.expiresAt 
                      ? new Date(shareResult.expiresAt).toLocaleDateString()
                      : "Never"
                    }
                  </div>
                </div>
              </div>

              {/* Tips */}
              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  <strong>Sharing Tips:</strong>
                  <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                    <li>Recipients don't need to create an account to view your shared results</li>
                    <li>View counts and access logs are tracked for your security</li>
                    <li>You can manage or revoke this link anytime from your "My Shared Results" page</li>
                    <li>The link works on any device with internet access</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} data-testid="button-done-sharing">
                Done
              </Button>
              <Button onClick={copyToClipboard} data-testid="button-copy-link-footer">
                {copiedUrl ? "Copied!" : "Copy Link"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ShareDialog;