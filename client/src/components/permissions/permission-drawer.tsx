import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Share, Link as LinkIcon, Mail, Copy, Trash2, UserPlus, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Collaborator {
  id: string;
  email: string;
  permissions: string[];
  grantedAt: string;
  grantedBy: string;
}

interface ShareLink {
  id: string;
  token: string;
  permissions: string[];
  accessCount: number;
  maxAccessCount?: number;
  expiresAt?: string;
  createdAt: string;
}

interface ShareInvite {
  id: string;
  inviteeEmail: string;
  permissions: string[];
  status: string;
  expiresAt: string;
  createdAt: string;
}

interface PermissionDrawerProps {
  resourceType: string;
  resourceId: string;
  isOwner: boolean;
  onPermissionsChange?: () => void;
}

export const PermissionDrawer = ({ resourceType, resourceId, isOwner, onPermissionsChange }: PermissionDrawerProps) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [sentInvites, setSentInvites] = useState<ShareInvite[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermissions, setInvitePermissions] = useState<string[]>(['view']);
  const [linkPermissions, setLinkPermissions] = useState<string[]>(['view']);
  const [linkExpiresIn, setLinkExpiresIn] = useState<number>(7);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const allPermissions = ['view', 'edit', 'share', 'delete'];

  useEffect(() => {
    if (isOwner) {
      loadCollaborators();
      loadShareLinks();
      loadSentInvites();
    }
  }, [resourceType, resourceId, isOwner]);

  const loadCollaborators = async () => {
    try {
      const response = await fetch(`/api/resources/${resourceType}/${resourceId}/collaborators`);
      if (response.ok) {
        const data = await response.json();
        setCollaborators(data);
      }
    } catch (error) {
      console.error('Failed to load collaborators:', error);
    }
  };

  const loadShareLinks = async () => {
    try {
      const response = await fetch(`/api/share/links/${resourceType}/${resourceId}`);
      if (response.ok) {
        const data = await response.json();
        setShareLinks(data);
      }
    } catch (error) {
      console.error('Failed to load share links:', error);
    }
  };

  const loadSentInvites = async () => {
    try {
      const response = await fetch('/api/share/sent-invites');
      if (response.ok) {
        const data = await response.json();
        const filtered = data.filter((invite: any) => 
          invite.resourceType === resourceType && invite.resourceId === resourceId
        );
        setSentInvites(filtered);
      }
    } catch (error) {
      console.error('Failed to load sent invites:', error);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail || invitePermissions.length === 0) {
      toast({
        title: 'Error',
        description: 'Please enter an email and select permissions',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/share/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resourceType,
          resourceId,
          inviteeEmail: inviteEmail,
          permissions: invitePermissions,
          expiresIn: 7
        }),
      });

      if (response.ok) {
        toast({
          title: 'Invitation Sent',
          description: `Invitation sent to ${inviteEmail}`,
        });
        setInviteEmail('');
        setInvitePermissions(['view']);
        loadSentInvites();
        onPermissionsChange?.();
      } else {
        const data = await response.json();
        throw new Error(data?.error || 'Failed to send invitation');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send invitation',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createShareLink = async () => {
    if (linkPermissions.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select permissions for the share link',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/share/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resourceType,
          resourceId,
          permissions: linkPermissions,
          expiresIn: linkExpiresIn
        }),
      });

      if (response.ok) {
        toast({
          title: 'Share Link Created',
          description: 'Share link created successfully',
        });
        setLinkPermissions(['view']);
        setLinkExpiresIn(7);
        loadShareLinks();
        onPermissionsChange?.();
      } else {
        const data = await response.json();
        throw new Error(data?.error || 'Failed to create share link');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create share link',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = async (token: string) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?shareToken=${token}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: 'Link Copied',
        description: 'Share link copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link to clipboard',
        variant: 'destructive',
      });
    }
  };

  const revokeAccess = async (grantId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/permissions/${grantId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Access Revoked',
          description: 'User access has been revoked',
        });
        loadCollaborators();
        onPermissionsChange?.();
      } else {
        const data = await response.json();
        throw new Error(data?.error || 'Failed to revoke access');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to revoke access',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteShareLink = async (linkId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/share/links/${linkId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Share Link Deleted',
          description: 'Share link has been deleted',
        });
        loadShareLinks();
        onPermissionsChange?.();
      } else {
        const data = await response.json();
        throw new Error(data?.error || 'Failed to delete share link');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete share link',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const PermissionBadge = ({ permission }: { permission: string }) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      view: 'outline',
      edit: 'secondary',
      share: 'default',
      delete: 'destructive'
    };
    
    return (
      <Badge variant={variants[permission] || 'outline'} className="text-xs">
        {permission}
      </Badge>
    );
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-share-permissions">
          <Users className="h-4 w-4 mr-2" />
          Share & Permissions
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-[500px] max-w-[90vw]">
        <SheetHeader>
          <SheetTitle>Manage Access</SheetTitle>
        </SheetHeader>
        
        <Tabs defaultValue="collaborators" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="collaborators">Collaborators</TabsTrigger>
            <TabsTrigger value="invites">Invitations</TabsTrigger>
            <TabsTrigger value="links">Share Links</TabsTrigger>
          </TabsList>
          
          <TabsContent value="collaborators" className="space-y-4">
            {/* Current Collaborators */}
            <div>
              <h3 className="font-medium mb-3">Current Collaborators</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {collaborators.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No collaborators yet</p>
                ) : (
                  collaborators.map((collaborator) => (
                    <div key={collaborator.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`collaborator-${collaborator.id}`}>
                      <div className="flex-1">
                        <p className="text-sm font-medium" data-testid={`text-email-${collaborator.email}`}>{collaborator.email}</p>
                        <div className="flex gap-1 mt-1">
                          {collaborator.permissions.map((perm) => (
                            <PermissionBadge key={perm} permission={perm} />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Added {new Date(collaborator.grantedAt).toLocaleDateString()}
                        </p>
                      </div>
                      {isOwner && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => revokeAccess(collaborator.id)}
                          disabled={isLoading}
                          data-testid={`button-remove-${collaborator.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="invites" className="space-y-4">
            {/* Invite New Collaborator */}
            {isOwner && (
              <div>
                <h3 className="font-medium mb-3">Invite Collaborator</h3>
                <div className="space-y-3">
                  <Input
                    placeholder="Enter email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    data-testid="input-invite-email"
                  />
                  
                  <div>
                    <label className="text-sm font-medium">Permissions</label>
                    <div className="flex gap-2 mt-2">
                      {allPermissions.map((perm) => (
                        <Button
                          key={perm}
                          variant={invitePermissions.includes(perm) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            if (invitePermissions.includes(perm)) {
                              setInvitePermissions(invitePermissions.filter(p => p !== perm));
                            } else {
                              setInvitePermissions([...invitePermissions, perm]);
                            }
                          }}
                          data-testid={`button-permission-${perm}`}
                        >
                          {perm}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleInvite} 
                    disabled={isLoading || !inviteEmail}
                    className="w-full"
                    data-testid="button-send-invite"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invitation
                  </Button>
                </div>
              </div>
            )}
            
            {/* Sent Invitations */}
            <div>
              <h3 className="font-medium mb-3">Sent Invitations</h3>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {sentInvites.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No invitations sent</p>
                ) : (
                  sentInvites.map((invite) => (
                    <div key={invite.id} className="p-3 border rounded-lg" data-testid={`invite-${invite.id}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium" data-testid={`text-invite-email-${invite.inviteeEmail}`}>{invite.inviteeEmail}</p>
                          <div className="flex gap-1 mt-1">
                            {invite.permissions.map((perm) => (
                              <PermissionBadge key={perm} permission={perm} />
                            ))}
                          </div>
                        </div>
                        <Badge variant={invite.status === 'pending' ? 'secondary' : invite.status === 'accepted' ? 'default' : 'destructive'}>
                          {invite.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Sent {new Date(invite.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="links" className="space-y-4">
            {/* Create Share Link */}
            {isOwner && (
              <div>
                <h3 className="font-medium mb-3">Create Share Link</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Permissions</label>
                    <div className="flex gap-2 mt-2">
                      {allPermissions.map((perm) => (
                        <Button
                          key={perm}
                          variant={linkPermissions.includes(perm) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            if (linkPermissions.includes(perm)) {
                              setLinkPermissions(linkPermissions.filter(p => p !== perm));
                            } else {
                              setLinkPermissions([...linkPermissions, perm]);
                            }
                          }}
                          data-testid={`button-link-permission-${perm}`}
                        >
                          {perm}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Expires in (days)</label>
                    <Select value={linkExpiresIn.toString()} onValueChange={(value) => setLinkExpiresIn(parseInt(value))}>
                      <SelectTrigger className="mt-2" data-testid="select-expires-in">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 day</SelectItem>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="365">1 year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    onClick={createShareLink} 
                    disabled={isLoading || linkPermissions.length === 0}
                    className="w-full"
                    data-testid="button-create-share-link"
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Create Share Link
                  </Button>
                </div>
              </div>
            )}
            
            {/* Existing Share Links */}
            <div>
              <h3 className="font-medium mb-3">Active Share Links</h3>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {shareLinks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No share links created</p>
                ) : (
                  shareLinks.map((link) => (
                    <div key={link.id} className="p-3 border rounded-lg" data-testid={`share-link-${link.id}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex gap-1 mb-2">
                            {link.permissions.map((perm) => (
                              <PermissionBadge key={perm} permission={perm} />
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Accessed {link.accessCount} times
                          </p>
                          {link.expiresAt && (
                            <p className="text-xs text-muted-foreground">
                              Expires {new Date(link.expiresAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => copyLink(link.token)}
                            data-testid={`button-copy-link-${link.id}`}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          {isOwner && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => deleteShareLink(link.id)}
                              disabled={isLoading}
                              data-testid={`button-delete-link-${link.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};