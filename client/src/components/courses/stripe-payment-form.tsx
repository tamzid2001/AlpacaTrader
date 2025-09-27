import { useState } from "react";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Course } from "@shared/schema";
import { 
  CreditCard, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Lock 
} from "lucide-react";

// Initialize Stripe with the public key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface StripePaymentFormProps {
  course: Course;
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

interface PaymentFormProps {
  course: Course;
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

// Stripe card element styling to match shadcn/ui theme
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: 'hsl(var(--foreground))',
      backgroundColor: 'hsl(var(--background))',
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
      fontSmoothing: 'antialiased',
      '::placeholder': {
        color: 'hsl(var(--muted-foreground))',
      },
      iconColor: 'hsl(var(--muted-foreground))',
    },
    invalid: {
      color: 'hsl(var(--destructive))',
      iconColor: 'hsl(var(--destructive))',
    },
    complete: {
      color: 'hsl(var(--primary))',
      iconColor: 'hsl(var(--primary))',
    },
  },
  hidePostalCode: true, // Simplify the form
};

function PaymentForm({ course, onPaymentSuccess, onCancel }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  // Create payment intent mutation
  const createPaymentIntentMutation = useMutation({
    mutationFn: async (data: { productId: string; productType: string }) => {
      const response = await apiRequest("POST", "/api/create-payment-intent", data);
      return await response.json();
    },
  });

  const formatPrice = (priceInCents: number) => {
    return (priceInCents / 100).toFixed(2);
  };

  const handleCardChange = (event: any) => {
    setCardError(event.error ? event.error.message : null);
    setCardComplete(event.complete);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !user) {
      setError("Payment system not initialized. Please refresh the page.");
      return;
    }

    if (!cardComplete) {
      setError("Please complete your card information.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create payment intent
      const paymentIntentResponse = await createPaymentIntentMutation.mutateAsync({
        productId: course.id,
        productType: "course",
      });

      if (!paymentIntentResponse.clientSecret) {
        throw new Error("Failed to create payment intent");
      }

      // Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Card element not found");
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        paymentIntentResponse.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
              email: user.email,
            },
          },
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message || "Payment confirmation failed");
      }

      if (paymentIntent?.status === "succeeded") {
        // Payment successful
        toast({
          title: "Payment Successful!",
          description: `You've successfully enrolled in "${course.title}". Welcome aboard!`,
        });

        // Invalidate relevant queries to refresh enrollment status
        queryClient.invalidateQueries({ queryKey: ["/api/user/courses"] });
        queryClient.invalidateQueries({ queryKey: ["/api/user/courses", course.id, "enrollment"] });
        
        onPaymentSuccess();
      } else {
        throw new Error("Payment was not completed successfully");
      }

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      toast({
        title: "Payment Failed",
        description: err.message || "Please try again or contact support if the problem persists.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <CreditCard className="h-5 w-5" />
            Complete Your Purchase
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Course Summary */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <img 
                src={course.imageUrl || "/api/placeholder/80/60"} 
                alt={course.title}
                className="w-20 h-15 object-cover rounded-md"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm leading-tight" data-testid="payment-course-title">
                  {course.title}
                </h3>
                <p className="text-muted-foreground text-xs mt-1">
                  {course.instructor}
                </p>
                <Badge variant="secondary" className="mt-1 text-xs">
                  {course.level}
                </Badge>
              </div>
            </div>
            
            <Separator />
            
            {/* Pricing Details */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Course Price</span>
                <span data-testid="payment-course-price">${formatPrice(course.price || 0)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span data-testid="payment-total-price">${formatPrice(course.price || 0)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="card-element" className="text-sm font-medium">
                Card Information
              </label>
              <div className="p-3 border rounded-md bg-background">
                <CardElement
                  id="card-element"
                  options={cardElementOptions}
                  onChange={handleCardChange}
                  data-testid="stripe-card-element"
                />
              </div>
              {cardError && (
                <p className="text-sm text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {cardError}
                </p>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Security Notice */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Your payment information is secure and encrypted</span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isProcessing}
                className="flex-1"
                data-testid="button-cancel-payment"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!stripe || !cardComplete || isProcessing}
                className="flex-1 min-h-[44px]"
                data-testid="button-complete-payment"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Pay ${formatPrice(course.price || 0)}
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Features Included */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-2">What's included:</p>
            <div className="flex flex-wrap justify-center gap-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Lifetime Access
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CheckCircle className="h-3 w-3 text-green-500" />
                All Course Materials
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Certificate of Completion
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function StripePaymentForm({ course, onPaymentSuccess, onCancel }: StripePaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm
        course={course}
        onPaymentSuccess={onPaymentSuccess}
        onCancel={onCancel}
      />
    </Elements>
  );
}