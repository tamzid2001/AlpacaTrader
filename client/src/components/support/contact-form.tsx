import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSubmitSupportMessage } from "@/hooks/use-courses";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

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
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

export default function ContactForm({ isOpen, onClose, userEmail = "", userName = "" }: ContactFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: userName || "",
    email: userEmail || "",
    subject: "",
    message: "",
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
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        variant: "destructive",
        title: "Send Failed",
        description: "Failed to send your message. Please try again.",
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
