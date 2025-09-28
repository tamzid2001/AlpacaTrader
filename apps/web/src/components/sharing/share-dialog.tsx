import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Share2, 
  Mail, 
  Users, 
  Eye, 
  Edit, 
  Download, 
  Trash2, 
  Calendar, 
  MessageSquare,
  Loader2,
  Check,
  AlertCircle
} from 'lucide-react';

const shareFormSchema = z.object({
  inviteeEmail: z.string().email('Please enter a valid email address'),
  permissions: z.array(z.enum(['view', 'edit', 'share', 'delete'])).min(1, 'Please select at least one permission'),
  expiresIn: z.number().min(1).max(365).optional(),
  message: z.string().max(500).optional(),
});

type ShareFormData = z.infer<typeof shareFormSchema>;

interface ShareDialogProps {
  resourceType: 'market_data' | 'csv' | 'course' | 'report' | 'user_content';
  resourceId: string;
  resourceName: string;
  children: React.ReactNode;
  onShareSuccess?: () => void;
}

const PERMISSION_OPTIONS = [
  { 
    value: 'view', 
    label: 'View', 
    description: 'Can view and access the content',
    icon: Eye,
    color: 'bg-blue-100 text-blue-800'
  },
  { 
    value: 'edit', 
    label: 'Edit', 
    description: 'Can view and modify the content',
    icon: Edit,
    color: 'bg-green-100 text-green-800'
  },
  { 
    value: 'share', 
    label: 'Share', 
    description: 'Can share the content with others',
    icon: Share2,
    color: 'bg-purple-100 text-purple-800'
  },
  { 
    value: 'delete', 
    label: 'Delete', 
    description: 'Can delete the content (use with caution)',
    icon: Trash2,
    color: 'bg-red-100 text-red-800'
  }
];

const EXPIRY_OPTIONS = [
  { value: 1, label: '1 day' },
  { value: 7, label: '1 week' },
  { value: 30, label: '1 month' },
  { value: 90, label: '3 months' },
  { value: 365, label: '1 year' },
];

export function ShareDialog({ resourceType, resourceId, resourceName, children, onShareSuccess }: ShareDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ShareFormData>({
    resolver: zodResolver(shareFormSchema),
    defaultValues: {
      inviteeEmail: '',
      permissions: ['view'],
      expiresIn: 7,
      message: '',
    },
  });

  const shareMutation = useMutation({
    mutationFn: async (data: ShareFormData) => {
      return apiRequest('/api/share/invite', {
        method: 'POST',
        body: JSON.stringify({
          resourceType,
          resourceId,
          inviteeEmail: data.inviteeEmail,
          permissions: data.permissions,
          expiresIn: data.expiresIn,
          message: data.message,
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Invitation sent!',
        description: `Successfully sent sharing invitation to ${form.getValues('inviteeEmail')}`,
      });
      form.reset();
      setIsOpen(false);
      onShareSuccess?.();
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/share/sent-invites'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to send invitation',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (data: ShareFormData) => {
    shareMutation.mutate(data);
  };

  const selectedPermissions = form.watch('permissions');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild data-testid="button-share-trigger">
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" data-testid="dialog-share">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" data-testid="text-share-title">
            <Share2 className="h-5 w-5" />
            Share Content
          </DialogTitle>
          <DialogDescription data-testid="text-share-description">
            Share "{resourceName}" with colleagues via email invitation. They'll receive a secure link to access the content.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Email Input */}
            <FormField
              control={form.control}
              name="inviteeEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="colleague@company.com" 
                      {...field} 
                      data-testid="input-invitee-email"
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the email address of the person you want to share with
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Permissions */}
            <FormField
              control={form.control}
              name="permissions"
              render={() => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Permissions
                  </FormLabel>
                  <FormDescription>
                    Select what the recipient can do with this content
                  </FormDescription>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="permissions-grid">
                    {PERMISSION_OPTIONS.map((permission) => (
                      <FormField
                        key={permission.value}
                        control={form.control}
                        name="permissions"
                        render={({ field }) => {
                          const Icon = permission.icon;
                          const isChecked = field.value?.includes(permission.value as any);
                          
                          return (
                            <FormItem>
                              <div 
                                className={`flex items-start space-x-3 p-3 rounded-lg border-2 transition-all cursor-pointer hover:bg-gray-50 ${
                                  isChecked ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                                }`}
                                onClick={() => {
                                  const currentValue = field.value || [];
                                  const newValue = isChecked
                                    ? currentValue.filter(v => v !== permission.value)
                                    : [...currentValue, permission.value as any];
                                  field.onChange(newValue);
                                }}
                                data-testid={`permission-${permission.value}`}
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={() => {}} // Handled by onClick above
                                  />
                                </FormControl>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    <span className="font-medium">{permission.label}</span>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {permission.description}
                                  </p>
                                </div>
                              </div>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                  
                  {/* Selected Permissions Summary */}
                  {selectedPermissions && selectedPermissions.length > 0 && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-2">Selected permissions:</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedPermissions.map((permission) => {
                          const option = PERMISSION_OPTIONS.find(opt => opt.value === permission);
                          const Icon = option?.icon || Eye;
                          return (
                            <Badge key={permission} variant="secondary" className="text-xs">
                              <Icon className="h-3 w-3 mr-1" />
                              {option?.label || permission}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </FormItem>
              )}
            />

            <Separator />

            {/* Expiration */}
            <FormField
              control={form.control}
              name="expiresIn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Invitation Expires
                  </FormLabel>
                  <Select 
                    value={field.value?.toString()} 
                    onValueChange={(value) => field.onChange(parseInt(value))}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-expiry">
                        <SelectValue placeholder="Select expiration time" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EXPIRY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The invitation link will expire after this period for security
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Personal Message */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Personal Message (Optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add a personal message to include with the invitation..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      data-testid="textarea-message"
                    />
                  </FormControl>
                  <FormDescription>
                    Add context or instructions for the recipient
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={shareMutation.isPending}
                data-testid="button-send-invitation"
              >
                {shareMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>

        {/* Security Notice */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Security Notice</p>
              <p className="mt-1">
                The recipient will receive a secure invitation email with a unique link. 
                All sharing activity is logged for security purposes.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ShareDialog;