import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Mail,
  User,
  Calendar,
  Check,
  X,
  Eye,
  Edit,
  Share2,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Inbox,
  FileText,
  BarChart3,
  Download,
  Loader2
} from 'lucide-react';

interface ShareInvite {
  id: string;
  resourceType: string;
  resourceId: string;
  inviterUserId: string;
  inviteeEmail: string;
  permissions: string[];
  token: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: string;
  createdAt: string;
}

const PERMISSION_ICONS = {
  view: Eye,
  edit: Edit,
  share: Share2,
  delete: Trash2,
};

const PERMISSION_LABELS = {
  view: 'View',
  edit: 'Edit',
  share: 'Share',
  delete: 'Delete',
};

const RESOURCE_TYPE_ICONS = {
  market_data: BarChart3,
  csv: FileText,
  course: FileText,
  report: FileText,
  user_content: FileText,
};

const RESOURCE_TYPE_LABELS = {
  market_data: 'Market Data',
  csv: 'CSV Analysis',
  course: 'Course',
  report: 'Report',
  user_content: 'Content',
};

const STATUS_VARIANTS = {
  pending: { variant: 'default' as const, icon: Clock, color: 'text-blue-600' },
  accepted: { variant: 'success' as const, icon: CheckCircle2, color: 'text-green-600' },
  declined: { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
  expired: { variant: 'secondary' as const, icon: AlertTriangle, color: 'text-gray-600' },
};

export function InvitationInbox() {
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invitations, isLoading, error } = useQuery({
    queryKey: ['/api/share/invites'],
    queryFn: () => apiRequest('/api/share/invites'),
  });

  const acceptMutation = useMutation({
    mutationFn: async (token: string) => {
      setActionInProgress(token);
      return apiRequest(`/api/share/accept/${token}`, {
        method: 'POST',
      });
    },
    onSuccess: (_, token) => {
      toast({
        title: 'Invitation accepted!',
        description: 'You now have access to the shared content.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/share/invites'] });
      queryClient.invalidateQueries({ queryKey: ['/api/share/received'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to accept invitation',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setActionInProgress(null);
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (token: string) => {
      setActionInProgress(token);
      return apiRequest(`/api/share/decline/${token}`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Invitation declined',
        description: 'The invitation has been declined.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/share/invites'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to decline invitation',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setActionInProgress(null);
    },
  });

  const handleAccept = (token: string) => {
    acceptMutation.mutate(token);
  };

  const handleDecline = (token: string) => {
    declineMutation.mutate(token);
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (error) {
    return (
      <Alert variant="destructive" data-testid="alert-invitations-error">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load invitations. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  const pendingInvitations = invitations?.filter((inv: ShareInvite) => 
    inv.status === 'pending' && !isExpired(inv.expiresAt)
  ) || [];
  
  const processedInvitations = invitations?.filter((inv: ShareInvite) => 
    inv.status !== 'pending' || isExpired(inv.expiresAt)
  ) || [];

  return (
    <div className="space-y-6" data-testid="invitation-inbox">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Inbox className="h-5 w-5" />
        <h2 className="text-lg font-semibold" data-testid="text-inbox-title">
          Share Invitations
        </h2>
        {!isLoading && invitations && (
          <Badge variant="secondary" data-testid="badge-total-invitations">
            {invitations.length} total
          </Badge>
        )}
      </div>

      {/* Pending Invitations */}
      {(isLoading || pendingInvitations.length > 0) && (
        <Card data-testid="card-pending-invitations">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-blue-600" />
              Pending Invitations
              {!isLoading && (
                <Badge variant="default" data-testid="badge-pending-count">
                  {pendingInvitations.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Invitations waiting for your response
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <>
                {Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                    {index < 1 && <Separator />}
                  </div>
                ))}
              </>
            ) : pendingInvitations.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4" data-testid="text-no-pending">
                No pending invitations
              </p>
            ) : (
              pendingInvitations.map((invitation: ShareInvite, index: number) => {
                const ResourceIcon = RESOURCE_TYPE_ICONS[invitation.resourceType as keyof typeof RESOURCE_TYPE_ICONS];
                const resourceLabel = RESOURCE_TYPE_LABELS[invitation.resourceType as keyof typeof RESOURCE_TYPE_LABELS];
                const isProcessing = actionInProgress === invitation.token;

                return (
                  <div key={invitation.id}>
                    <div className="space-y-3" data-testid={`invitation-${invitation.id}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <ResourceIcon className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm truncate" data-testid={`text-resource-${invitation.id}`}>
                                {resourceLabel} Shared
                              </h4>
                              <Badge variant="outline" className="text-xs">
                                {resourceLabel}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">
                              Resource ID: {invitation.resourceId}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                From: {invitation.inviterUserId}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Expires: {format(new Date(invitation.expiresAt), 'MMM d, yyyy')}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-xs text-gray-600">Permissions:</span>
                              {invitation.permissions.map((permission) => {
                                const Icon = PERMISSION_ICONS[permission as keyof typeof PERMISSION_ICONS];
                                const label = PERMISSION_LABELS[permission as keyof typeof PERMISSION_LABELS];
                                return (
                                  <Badge key={permission} variant="secondary" className="text-xs">
                                    <Icon className="h-3 w-3 mr-1" />
                                    {label}
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => handleAccept(invitation.token)}
                            disabled={isProcessing}
                            data-testid={`button-accept-${invitation.id}`}
                          >
                            {isProcessing && acceptMutation.isPending ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3 mr-1" />
                            )}
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDecline(invitation.token)}
                            disabled={isProcessing}
                            data-testid={`button-decline-${invitation.id}`}
                          >
                            {isProcessing && declineMutation.isPending ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <X className="h-3 w-3 mr-1" />
                            )}
                            Decline
                          </Button>
                        </div>
                      </div>
                    </div>
                    {index < pendingInvitations.length - 1 && <Separator />}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      )}

      {/* Processed Invitations */}
      {(isLoading || processedInvitations.length > 0) && (
        <Card data-testid="card-processed-invitations">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4 text-gray-600" />
              Recent Activity
              {!isLoading && (
                <Badge variant="secondary" data-testid="badge-processed-count">
                  {processedInvitations.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Previously responded to invitations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <>
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    {index < 2 && <Separator />}
                  </div>
                ))}
              </>
            ) : processedInvitations.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4" data-testid="text-no-processed">
                No recent activity
              </p>
            ) : (
              processedInvitations.slice(0, 10).map((invitation: ShareInvite, index: number) => {
                const ResourceIcon = RESOURCE_TYPE_ICONS[invitation.resourceType as keyof typeof RESOURCE_TYPE_ICONS];
                const resourceLabel = RESOURCE_TYPE_LABELS[invitation.resourceType as keyof typeof RESOURCE_TYPE_LABELS];
                const statusInfo = STATUS_VARIANTS[invitation.status];
                const StatusIcon = statusInfo.icon;
                const expired = isExpired(invitation.expiresAt);
                const actualStatus = expired && invitation.status === 'pending' ? 'expired' : invitation.status;
                const actualStatusInfo = STATUS_VARIANTS[actualStatus];

                return (
                  <div key={invitation.id}>
                    <div className="flex items-center gap-3" data-testid={`processed-invitation-${invitation.id}`}>
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <ResourceIcon className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {resourceLabel} Share
                          </h4>
                          <Badge variant={actualStatusInfo.variant} className="text-xs">
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {actualStatus.charAt(0).toUpperCase() + actualStatus.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            From: {invitation.inviterUserId}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(invitation.createdAt), 'MMM d, yyyy')}
                          </div>
                        </div>
                      </div>
                    </div>
                    {index < Math.min(processedInvitations.length, 10) - 1 && <Separator />}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && (!invitations || invitations.length === 0) && (
        <Card data-testid="card-empty-state">
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="p-4 bg-gray-50 rounded-full w-fit mx-auto">
                <Inbox className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">No invitations yet</h3>
                <p className="text-sm text-gray-500">
                  When colleagues share content with you, invitations will appear here.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default InvitationInbox;