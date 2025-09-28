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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Share2,
  Users,
  Calendar,
  Check,
  X,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MoreHorizontal,
  FileText,
  BarChart3,
  Download,
  Loader2,
  Copy,
  Mail,
  Settings,
  Shield,
  Link as LinkIcon
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

interface ShareLink {
  id: string;
  resourceType: string;
  resourceId: string;
  createdBy: string;
  token: string;
  permissions: string[];
  accessCount: number;
  maxAccessCount?: number;
  expiresAt?: string;
  isActive: boolean;
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
  accepted: { variant: 'default' as const, icon: CheckCircle2, color: 'text-green-600' },
  declined: { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
  expired: { variant: 'secondary' as const, icon: AlertTriangle, color: 'text-gray-600' },
};

export function ShareDashboard() {
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sentInvites, isLoading: isLoadingInvites, error: invitesError } = useQuery({
    queryKey: ['/api/share/sent-invites'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/share/sent-invites');
      return response.json();
    },
  });

  const { data: shareLinks, isLoading: isLoadingLinks, error: linksError } = useQuery({
    queryKey: ['/api/share/links'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/share/links');
      return response.json();
    },
  });

  const copyLinkMutation = useMutation({
    mutationFn: async (token: string) => {
      const shareUrl = `${window.location.origin}/share/${token}`;
      await navigator.clipboard.writeText(shareUrl);
      return shareUrl;
    },
    onSuccess: (shareUrl) => {
      toast({
        title: 'Link copied!',
        description: 'Share link has been copied to your clipboard.',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy the share link. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const revokeLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      setActionInProgress(linkId);
      const response = await apiRequest('DELETE', `/api/share/link/${linkId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Share link revoked',
        description: 'The share link has been deactivated.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/share/links'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to revoke link',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setActionInProgress(null);
    },
  });

  const handleCopyLink = (token: string) => {
    copyLinkMutation.mutate(token);
  };

  const handleRevokeLink = (linkId: string) => {
    revokeLinkMutation.mutate(linkId);
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const getInviteStatusInfo = (invite: ShareInvite) => {
    const expired = isExpired(invite.expiresAt);
    const actualStatus = expired && invite.status === 'pending' ? 'expired' : invite.status;
    return STATUS_VARIANTS[actualStatus];
  };

  if (invitesError || linksError) {
    return (
      <Alert variant="destructive" data-testid="alert-dashboard-error">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load sharing data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  const isLoading = isLoadingInvites || isLoadingLinks;

  return (
    <div className="space-y-6" data-testid="share-dashboard">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Share2 className="h-5 w-5" />
        <h2 className="text-lg font-semibold" data-testid="text-dashboard-title">
          Share Management
        </h2>
      </div>

      <Tabs defaultValue="invites" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="invites" data-testid="tab-invites">
            Email Invitations
            {!isLoadingInvites && Array.isArray(sentInvites) && (
              <Badge variant="secondary" className="ml-2">
                {sentInvites.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="links" data-testid="tab-links">
            Share Links
            {!isLoadingLinks && Array.isArray(shareLinks) && (
              <Badge variant="secondary" className="ml-2">
                {shareLinks.filter((link: ShareLink) => link.isActive).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Email Invitations Tab */}
        <TabsContent value="invites" className="space-y-4">
          <Card data-testid="card-sent-invites">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="h-4 w-4" />
                Sent Invitations
              </CardTitle>
              <CardDescription>
                Email invitations you've sent to colleagues
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingInvites ? (
                <>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="space-y-3">
                      <Skeleton className="h-20 w-full" />
                      {index < 2 && <Separator />}
                    </div>
                  ))}
                </>
              ) : !Array.isArray(sentInvites) || sentInvites.length === 0 ? (
                <div className="text-center py-8" data-testid="empty-sent-invites">
                  <div className="p-4 bg-gray-50 rounded-full w-fit mx-auto mb-4">
                    <Mail className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">No invitations sent</h3>
                  <p className="text-sm text-gray-500">
                    Start sharing content by sending email invitations to colleagues.
                  </p>
                </div>
              ) : (
                (Array.isArray(sentInvites) ? sentInvites : []).map((invite: ShareInvite, index: number) => {
                  const ResourceIcon = RESOURCE_TYPE_ICONS[invite.resourceType as keyof typeof RESOURCE_TYPE_ICONS];
                  const resourceLabel = RESOURCE_TYPE_LABELS[invite.resourceType as keyof typeof RESOURCE_TYPE_LABELS];
                  const statusInfo = getInviteStatusInfo(invite);
                  const StatusIcon = statusInfo.icon;

                  return (
                    <div key={invite.id}>
                      <div className="flex items-start justify-between" data-testid={`sent-invite-${invite.id}`}>
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <ResourceIcon className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm truncate">
                                {resourceLabel} • {invite.inviteeEmail}
                              </h4>
                              <Badge variant={statusInfo.variant} className="text-xs">
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {invite.status.charAt(0).toUpperCase() + invite.status.slice(1)}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">
                              Resource ID: {invite.resourceId}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Sent: {format(new Date(invite.createdAt), 'MMM d, yyyy')}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Expires: {format(new Date(invite.expiresAt), 'MMM d, yyyy')}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-xs text-gray-600">Permissions:</span>
                              {invite.permissions.map((permission) => {
                                const Icon = PERMISSION_ICONS[permission as keyof typeof PERMISSION_ICONS];
                                const label = PERMISSION_LABELS[permission as keyof typeof PERMISSION_LABELS];
                                return (
                                  <Badge key={permission} variant="outline" className="text-xs">
                                    <Icon className="h-3 w-3 mr-1" />
                                    {label}
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" data-testid={`menu-invite-${invite.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              Resend Invitation
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Settings className="h-4 w-4 mr-2" />
                              Edit Permissions
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <X className="h-4 w-4 mr-2" />
                              Cancel Invitation
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {index < (Array.isArray(sentInvites) ? sentInvites.length : 0) - 1 && <Separator />}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Share Links Tab */}
        <TabsContent value="links" className="space-y-4">
          <Card data-testid="card-share-links">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <LinkIcon className="h-4 w-4" />
                Share Links
              </CardTitle>
              <CardDescription>
                Public links for sharing content without email invitations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingLinks ? (
                <>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="space-y-3">
                      <Skeleton className="h-20 w-full" />
                      {index < 2 && <Separator />}
                    </div>
                  ))}
                </>
              ) : !Array.isArray(shareLinks) || shareLinks.filter((link: ShareLink) => link.isActive).length === 0 ? (
                <div className="text-center py-8" data-testid="empty-share-links">
                  <div className="p-4 bg-gray-50 rounded-full w-fit mx-auto mb-4">
                    <LinkIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">No share links created</h3>
                  <p className="text-sm text-gray-500">
                    Create shareable links for easy access without email invitations.
                  </p>
                </div>
              ) : (
                (Array.isArray(shareLinks) ? shareLinks : [])
                  .filter((link: ShareLink) => link.isActive)
                  .map((link: ShareLink, index: number) => {
                    const ResourceIcon = RESOURCE_TYPE_ICONS[link.resourceType as keyof typeof RESOURCE_TYPE_ICONS];
                    const resourceLabel = RESOURCE_TYPE_LABELS[link.resourceType as keyof typeof RESOURCE_TYPE_LABELS];
                    const expired = isExpired(link.expiresAt);
                    const isProcessing = actionInProgress === link.id;

                    return (
                      <div key={link.id}>
                        <div className="flex items-start justify-between" data-testid={`share-link-${link.id}`}>
                          <div className="flex items-start gap-3 flex-1">
                            <div className="p-2 bg-purple-50 rounded-lg">
                              <ResourceIcon className="h-4 w-4 text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm truncate">
                                  {resourceLabel} Share Link
                                </h4>
                                {expired && (
                                  <Badge variant="destructive" className="text-xs">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Expired
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mb-2">
                                Resource ID: {link.resourceId}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Created: {format(new Date(link.createdAt), 'MMM d, yyyy')}
                                </div>
                                {link.expiresAt && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Expires: {format(new Date(link.expiresAt), 'MMM d, yyyy')}
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {link.accessCount} {link.accessCount === 1 ? 'access' : 'accesses'}
                                </div>
                                {link.maxAccessCount && (
                                  <div className="text-gray-400">
                                    / {link.maxAccessCount} max
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="text-xs text-gray-600">Permissions:</span>
                                {link.permissions.map((permission) => {
                                  const Icon = PERMISSION_ICONS[permission as keyof typeof PERMISSION_ICONS];
                                  const label = PERMISSION_LABELS[permission as keyof typeof PERMISSION_LABELS];
                                  return (
                                    <Badge key={permission} variant="outline" className="text-xs">
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
                              variant="outline"
                              onClick={() => handleCopyLink(link.token)}
                              disabled={expired || copyLinkMutation.isPending}
                              data-testid={`button-copy-${link.id}`}
                            >
                              {copyLinkMutation.isPending ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <Copy className="h-3 w-3 mr-1" />
                              )}
                              Copy Link
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRevokeLink(link.id)}
                              disabled={isProcessing}
                              data-testid={`button-revoke-${link.id}`}
                            >
                              {isProcessing ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <Shield className="h-3 w-3 mr-1" />
                              )}
                              Revoke
                            </Button>
                          </div>
                        </div>
                        {index < (Array.isArray(shareLinks) ? shareLinks.filter((l: ShareLink) => l.isActive).length : 0) - 1 && <Separator />}
                      </div>
                    );
                  })
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ShareDashboard;