import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertPremiumRequestSchema, type InsertPremiumRequest, PREMIUM_TIERS } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EnhancedIcon } from "@/components/icons/enhanced-icon";

interface PremiumRequestFormProps {
  userId: string;
}

export function PremiumRequestForm({ userId }: PremiumRequestFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertPremiumRequest>({
    resolver: zodResolver(insertPremiumRequestSchema),
    defaultValues: {
      requestedTier: "basic",
      justification: "",
    },
  });

  const requestMutation = useMutation({
    mutationFn: async (data: InsertPremiumRequest) => {
      const response = await apiRequest("POST", "/api/premium/request-access", {
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Premium Request Submitted",
        description: "Your premium access request has been submitted and is pending admin review.",
      });
      setIsOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/premium/status"] });
    },
    onError: (error: any) => {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to submit premium request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertPremiumRequest) => {
    requestMutation.mutate(data);
  };

  const getTierDescription = (tier: string) => {
    switch (tier) {
      case "basic":
        return "Essential premium features including basic analytics and priority support";
      case "advanced":
        return "Enhanced features with advanced analytics, mentorship program, and career tools";
      case "professional":
        return "Full premium experience with all features, AI coaching, and exclusive content";
      default:
        return "";
    }
  };

  const getTierFeatures = (tier: string) => {
    const features = {
      basic: ["Basic Analytics", "Priority Support", "Premium Certificates", "Ad-free Experience"],
      advanced: ["All Basic Features", "Advanced Analytics", "Mentorship Program", "Career Tools", "Skill Assessments"],
      professional: ["All Advanced Features", "AI Career Coach", "Exclusive Content", "1-on-1 Sessions", "Industry Recognition"]
    };
    return features[tier as keyof typeof features] || [];
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600" data-testid="button-request-premium-access">
          <EnhancedIcon name="Crown" size={20} className="mr-2" />
          Request Premium Access
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-premium-request">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <EnhancedIcon name="Crown" size={24} className="text-amber-500" />
            <span>Request Premium Access</span>
          </DialogTitle>
          <DialogDescription>
            Apply for premium access to unlock advanced learning features and career development tools. 
            All premium requests require admin approval.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Tier Selection */}
            <FormField
              control={form.control}
              name="requestedTier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Premium Tier</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-premium-tier">
                        <SelectValue placeholder="Select a premium tier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PREMIUM_TIERS.map((tier) => (
                        <SelectItem key={tier} value={tier}>
                          <div className="flex items-center space-x-2">
                            <span className="capitalize">{tier}</span>
                            <Badge variant="secondary" className="capitalize">
                              {tier}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {getTierDescription(field.value)}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tier Features Preview */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <h4 className="font-medium mb-3 flex items-center">
                  <EnhancedIcon name="Sparkles" size={16} className="mr-2 text-blue-600 dark:text-blue-400" />
                  {form.watch("requestedTier")} Tier Features
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {getTierFeatures(form.watch("requestedTier")).map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <EnhancedIcon name="Check" size={14} className="text-green-600 dark:text-green-400" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Justification */}
            <FormField
              control={form.control}
              name="justification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Justification</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Please explain why you would like premium access and how you plan to use the premium features. Include your learning goals and any relevant background. (50-1000 characters)"
                      className="min-h-[120px] resize-none"
                      data-testid="textarea-justification"
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a detailed explanation of your learning goals and how premium features would benefit you.
                    This helps admins evaluate your request. ({field.value?.length || 0}/1000 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Application Process Info */}
            <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <CardContent className="p-4">
                <h4 className="font-medium flex items-center mb-2">
                  <EnhancedIcon name="Info" size={16} className="mr-2 text-yellow-600 dark:text-yellow-400" />
                  Application Process
                </h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-start space-x-2">
                    <span className="w-5 h-5 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">1</span>
                    </span>
                    <span>Your application will be reviewed by our admin team</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="w-5 h-5 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">2</span>
                    </span>
                    <span>We'll review your learning history and current progress</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="w-5 h-5 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">3</span>
                    </span>
                    <span>You'll receive an email notification with the decision</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="w-5 h-5 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">4</span>
                    </span>
                    <span>If approved, premium features will be activated immediately</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                data-testid="button-cancel-request"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={requestMutation.isPending}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                data-testid="button-submit-request"
              >
                {requestMutation.isPending ? (
                  <>
                    <EnhancedIcon name="Loader2" size={16} className="mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <EnhancedIcon name="Send" size={16} className="mr-2" />
                    Submit Request
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}