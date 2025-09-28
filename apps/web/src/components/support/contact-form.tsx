import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSubmitSupportMessage } from "@/hooks/use-courses";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Info } from "lucide-react";

interface ContactFormProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
}

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  marketingConsent: boolean;
  dataProcessingConsent: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  dataProcessingConsent?: string;
}

export default function ContactForm({ isOpen, onClose, userEmail = "", userName = "" }: ContactFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: userName || "",
    email: userEmail || "",
    subject: "",
    message: "",
    marketingConsent: false,
    dataProcessingConsent: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const submitMessageMutation = useSubmitSupportMessage();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Validate subject
    if (!formData.subject) {
      newErrors.subject = "Please select a subject";
    }

    // Validate message
    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters long";
    }

    // Validate required consent
    if (!formData.dataProcessingConsent) {
      newErrors.dataProcessingConsent = "You must consent to data processing to send a support message";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // CRITICAL: Store consent BEFORE processing personal data (GDPR compliance)
      if (formData.dataProcessingConsent) {
        console.log('📋 Storing required data processing consent before handling support message...');
        
        const consentResponse = await fetch('/api/gdpr/anonymous-consent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            consentType: 'data_processing',
            consentGiven: true,
            purpose: 'Process support request and contact information',
            legalBasis: 'consent',
            processingActivity: 'contact_form'
          })
        });

        if (!consentResponse.ok) {
          const errorData = await consentResponse.json().catch(() => ({ error: 'Unknown error' }));
          console.error('❌ Failed to store consent:', errorData);
          throw new Error(`Consent storage failed: ${errorData.error || 'Unknown error'}`);
        }
        
        const consentResult = await consentResponse.json();
        console.log('✅ Data processing consent recorded:', consentResult.consentId);
      } else {
        // This should never happen due to form validation, but safety check
        throw new Error('Data processing consent is required but not provided');
      }

      // Store optional marketing consent if provided
      if (formData.marketingConsent) {
        try {
          console.log('📋 Storing optional marketing consent...');
          const marketingConsentResponse = await fetch('/api/gdpr/anonymous-consent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: formData.email,
              consentType: 'marketing',
              consentGiven: true,
              purpose: 'Receive marketing communications and updates',
              legalBasis: 'consent',
              processingActivity: 'contact_form'
            })
          });
          
          if (marketingConsentResponse.ok) {
            const marketingResult = await marketingConsentResponse.json();
            console.log('✅ Marketing consent recorded:', marketingResult.consentId);
          } else {
            console.warn('⚠️ Marketing consent storage failed, but continuing with support request');
          }
        } catch (error) {
          console.warn('⚠️ Failed to log marketing consent (non-critical):', error);
        }
      }

      // Only NOW process the personal data after consent is confirmed
      console.log('📤 Processing support message after consent confirmation...');
      await submitMessageMutation.mutateAsync({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        userId: user?.id,
      });

      toast({
        title: "Message Sent!",
        description: "Thank you for your message! Our support team will respond within 1-2 business days.",
      });

      // Reset form
      setFormData({
        name: userName || "",
        email: userEmail || "",
        subject: "",
        message: "",
        marketingConsent: false,
        dataProcessingConsent: false,
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error("❌ Submit error:", error);
      
      // Show specific error message if consent storage failed
      const errorMessage = error instanceof Error && error.message.includes('Consent storage failed')
        ? 'Failed to record consent. Please try again.'
        : 'Failed to send your message. Please try again.';
      
      toast({
        variant: "destructive",
        title: "Send Failed",
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-contact-form">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold" data-testid="text-contact-title">
            Contact Support
          </DialogTitle>
          <p className="text-center text-muted-foreground" data-testid="text-contact-subtitle">
            Our team will respond within 1-2 business days
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <Label htmlFor="contact-name" className="text-sm font-medium">
              Name *
            </Label>
            <Input
              id="contact-name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Your full name"
              className={errors.name ? "border-destructive" : ""}
              data-testid="input-contact-name"
            />
            {errors.name && (
              <span className="text-xs text-destructive" data-testid="error-name">
                {errors.name}
              </span>
            )}
          </div>

          {/* Email Field */}
          <div>
            <Label htmlFor="contact-email" className="text-sm font-medium">
              Email *
            </Label>
            <Input
              id="contact-email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="your@email.com"
              className={errors.email ? "border-destructive" : ""}
              data-testid="input-contact-email"
            />
            {errors.email && (
              <span className="text-xs text-destructive" data-testid="error-email">
                {errors.email}
              </span>
            )}
          </div>

          {/* Subject Field */}
          <div>
            <Label htmlFor="contact-subject" className="text-sm font-medium">
              Subject *
            </Label>
            <Select value={formData.subject} onValueChange={(value) => handleInputChange('subject', value)}>
              <SelectTrigger className={errors.subject ? "border-destructive" : ""} data-testid="select-contact-subject">
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technical" data-testid="option-technical">Technical Support</SelectItem>
                <SelectItem value="billing" data-testid="option-billing">Billing Question</SelectItem>
                <SelectItem value="course" data-testid="option-course">Course Content</SelectItem>
                <SelectItem value="other" data-testid="option-other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.subject && (
              <span className="text-xs text-destructive" data-testid="error-subject">
                {errors.subject}
              </span>
            )}
          </div>

          {/* Message Field */}
          <div>
            <Label htmlFor="contact-message" className="text-sm font-medium">
              Message *
            </Label>
            <Textarea
              id="contact-message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Describe your issue or question..."
              rows={4}
              className={errors.message ? "border-destructive" : ""}
              data-testid="textarea-contact-message"
            />
            {errors.message && (
              <span className="text-xs text-destructive" data-testid="error-message">
                {errors.message}
              </span>
            )}
          </div>

          {/* GDPR Consent Section */}
          <div className="space-y-4">
            <Separator />
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium">Data Processing Consent</h4>
                  <p className="text-xs text-muted-foreground">
                    We need your consent to process your support request and contact information.
                  </p>
                </div>
              </div>

              {/* Required Data Processing Consent */}
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="data-processing-consent"
                  checked={formData.dataProcessingConsent}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, dataProcessingConsent: !!checked }))
                  }
                  className={errors.dataProcessingConsent ? "border-destructive" : ""}
                  data-testid="checkbox-data-processing"
                />
                <div className="grid gap-1.5 leading-none">
                  <Label 
                    htmlFor="data-processing-consent"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I consent to processing my data to handle this support request *
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Required to process your support message and provide assistance. Consent is recorded before processing any personal data.
                  </p>
                </div>
              </div>
              {errors.dataProcessingConsent && (
                <span className="text-xs text-destructive" data-testid="error-data-processing">
                  {errors.dataProcessingConsent}
                </span>
              )}

              {/* Optional Marketing Consent */}
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="marketing-consent"
                  checked={formData.marketingConsent}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, marketingConsent: !!checked }))
                  }
                  data-testid="checkbox-marketing"
                />
                <div className="grid gap-1.5 leading-none">
                  <Label 
                    htmlFor="marketing-consent"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I consent to receive marketing communications (optional)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Receive updates about new features, courses, and special offers.
                  </p>
                </div>
              </div>

              <Alert>
                <AlertDescription className="text-xs">
                  You can withdraw your consent at any time by visiting your{" "}
                  <a href="/privacy-settings" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                    Privacy Settings
                  </a>
                  {" "}or contacting us. For more information, see our{" "}
                  <a href="/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                    Privacy Policy
                  </a>
                  .
                </AlertDescription>
              </Alert>
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
            data-testid="button-send-message"
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Sending...
              </>
            ) : (
              "Send Message"
            )}
          </Button>
        </form>

        {/* Close Button */}
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          data-testid="button-close-contact"
        >
          <i className="fas fa-times"></i>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
