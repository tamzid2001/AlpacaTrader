import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Share2, 
  Copy, 
  Check, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Eye, 
  Globe, 
  Download, 
  Clock, 
  Calendar, 
  MoreVertical,
  FileText,
  Users,
  Settings,
  RefreshCw,
  Plus,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface SharedResult {
  id: string;
  shareToken: string;
  title: string | null;
  description: string | null;
  permissions: "view_only" | "view_download";
  expiresAt: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  upload: {
    id: string;
    filename: string;
    customFilename: string;
    uploadedAt: string;
  };
  shareUrl: string;
}

interface UpdateData {
  title?: string;
  description?: string;
  permissions?: "view_only" | "view_download";
  expirationOption?: "24h" | "7d" | "30d" | "never";
}

export default function MySharedResults() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedResult, setSelectedResult] = useState<SharedResult | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  
  const [editData, setEditData] = useState<UpdateData>({});
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check authentication
  if (!isLoading && !isAuthenticated) {
    setLocation("/");
    return null;
  }
  
  if (user && !user.isApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="text-center">Approval Pending</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Your account is currently pending approval from our admin team.
            </p>
            <Button onClick={() => setLocation("/")} variant="outline">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch user's shared results
  const { data: sharedResults = [], isLoading: isLoadingResults, refetch } = useQuery<SharedResult[]>({
    queryKey: ["/api/user/shared", user?.id],
    enabled: !!user?.id,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateData }) => {
      const response = await apiRequest("PATCH", `/api/share/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sharing settings updated",
        description: "Your sharing permissions and settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/shared"] });
      setEditDialogOpen(false);
      setSelectedResult(null);
      setEditData({});
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/share/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Sharing revoked",
        description: "The sharing link has been revoked and is no longer accessible.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/shared"] });
    },
    onError: (error: any) => {
      toast({
        title: "Revoke failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = async (url: string, shareId: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(shareId);
      toast({
        title: "Link copied!",
        description: "The sharing link has been copied to your clipboard.",
      });
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (result: SharedResult) => {
    setSelectedResult(result);
    setEditData({
      title: result.title || "",
      description: result.description || "",
      permissions: result.permissions,
      expirationOption: result.expiresAt ? getExpirationOption(result.expiresAt) : "never",
    });
    setEditDialogOpen(true);
  };

  const getExpirationOption = (expiresAt: string): "24h" | "7d" | "30d" | "never" => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffHours = Math.round((expires.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffHours <= 24) return "24h";
    if (diffHours <= 7 * 24) return "7d";
    if (diffHours <= 30 * 24) return "30d";
    return "never";
  };

  const handleUpdate = () => {
    if (!selectedResult) return;
    updateMutation.mutate({ id: selectedResult.id, data: editData });
  };

  const getExpirationText = (expiresAt: string | null) => {
    if (!expiresAt) return "Never expires";
    const expires = new Date(expiresAt);
    const now = new Date();
    if (expires < now) return "Expired";
    return `Expires ${formatDistanceToNow(expires, { addSuffix: true })}`;
  };

  const getExpirationBadgeVariant = (expiresAt: string | null) => {
    if (!expiresAt) return "outline";
    const expires = new Date(expiresAt);
    const now = new Date();
    if (expires < now) return "destructive";
    
    const diffHours = (expires.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (diffHours <= 24) return "destructive";
    if (diffHours <= 7 * 24) return "default";
    return "outline";
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <div className="flex-1 ml-64 p-8" data-testid="my-shared-results-main">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3" data-testid="text-page-title">
                <Share2 className="h-8 w-8" />
                My Shared Results
              </h1>
              <p className="text-muted-foreground" data-testid="text-page-subtitle">
                Manage and monitor your shared anomaly detection results
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1" data-testid="badge-shared-count">
                <Users className="h-3 w-3" />
                {sharedResults.length} shared
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()}
                disabled={isLoadingResults}
                data-testid="button-refresh"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingResults ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Share2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{sharedResults.length}</div>
                    <div className="text-sm text-muted-foreground">Total Shared</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <Eye className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {sharedResults.reduce((sum, result) => sum + result.viewCount, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Views</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                    <Globe className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {sharedResults.filter(r => r.permissions === "view_only").length}
                    </div>
                    <div className="text-sm text-muted-foreground">View Only</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <Download className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {sharedResults.filter(r => r.permissions === "view_download").length}
                    </div>
                    <div className="text-sm text-muted-foreground">View + Download</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Shared Results Table */}
          <Card data-testid="card-shared-results">
            <CardHeader>
              <CardTitle>Shared Results</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingResults ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading your shared results...</p>
                </div>
              ) : sharedResults.length === 0 ? (
                <div className="text-center py-8" data-testid="container-no-shared-results">
                  <Share2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">No Shared Results</p>
                  <p className="text-muted-foreground mb-4">
                    You haven't shared any anomaly detection results yet.
                  </p>
                  <Button onClick={() => setLocation("/anomaly-detection")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Go to Anomaly Detection
                  </Button>
                </div>
              ) : (
                <Table data-testid="table-shared-results">
                  <TableHeader>
                    <TableRow>
                      <TableHead>File & Title</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Expiration</TableHead>
                      <TableHead>Shared</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sharedResults.map((result) => (
                      <TableRow key={result.id} data-testid={`row-shared-result-${result.id}`}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium" data-testid={`text-title-${result.id}`}>
                              {result.title || `${result.upload.customFilename} - Anomaly Analysis`}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {result.upload.customFilename}
                            </div>
                            {result.description && (
                              <div className="text-xs text-muted-foreground line-clamp-2">
                                {result.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={result.permissions === "view_download" ? "default" : "outline"}>
                            {result.permissions === "view_download" ? (
                              <>
                                <Download className="h-3 w-3 mr-1" />
                                View + Download
                              </>
                            ) : (
                              <>
                                <Globe className="h-3 w-3 mr-1" />
                                View Only
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            <span data-testid={`text-view-count-${result.id}`}>{result.viewCount}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getExpirationBadgeVariant(result.expiresAt)}>
                            <Clock className="h-3 w-3 mr-1" />
                            {getExpirationText(result.expiresAt)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(result.createdAt), { addSuffix: true })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" data-testid={`button-actions-${result.id}`}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => copyToClipboard(result.shareUrl, result.id)}>
                                {copiedUrl === result.id ? (
                                  <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy Link
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => window.open(result.shareUrl, '_blank')}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open Shared View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditDialog(result)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Settings
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive"
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Revoke Access
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Revoke Sharing Access</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to revoke access to this shared result? 
                                      The sharing link will become invalid and recipients will no longer be able to view it.
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteMutation.mutate(result.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      data-testid={`button-confirm-revoke-${result.id}`}
                                    >
                                      Revoke Access
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl" data-testid="dialog-edit-shared-result">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Edit Sharing Settings
              </DialogTitle>
              <DialogDescription>
                Update the permissions, expiration, and details for this shared result.
              </DialogDescription>
            </DialogHeader>

            {selectedResult && (
              <div className="space-y-6">
                {/* File Info */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Shared File</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div><strong>Filename:</strong> {selectedResult.upload.customFilename}</div>
                    <div><strong>Current Views:</strong> {selectedResult.viewCount}</div>
                    <div><strong>Share URL:</strong> {selectedResult.shareUrl}</div>
                  </div>
                </div>

                {/* Edit Form */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-title">Title</Label>
                    <Input
                      id="edit-title"
                      value={editData.title || ""}
                      onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder={`${selectedResult.upload.customFilename} - Anomaly Analysis`}
                      data-testid="input-edit-title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={editData.description || ""}
                      onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe what this analysis shows..."
                      className="min-h-[80px]"
                      data-testid="textarea-edit-description"
                    />
                  </div>

                  {/* Permissions */}
                  <div>
                    <Label className="text-base font-medium">Permissions</Label>
                    <RadioGroup
                      value={editData.permissions || "view_only"}
                      onValueChange={(value: "view_only" | "view_download") => 
                        setEditData(prev => ({ ...prev, permissions: value }))
                      }
                      className="mt-2"
                      data-testid="radio-group-edit-permissions"
                    >
                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value="view_only" id="edit-view-only" />
                        <div className="flex-1">
                          <Label htmlFor="edit-view-only" className="flex items-center gap-2 font-medium">
                            <Globe className="h-4 w-4" />
                            View Only
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Recipients can view charts and analysis results but cannot download Excel files
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value="view_download" id="edit-view-download" />
                        <div className="flex-1">
                          <Label htmlFor="edit-view-download" className="flex items-center gap-2 font-medium">
                            <Download className="h-4 w-4" />
                            View + Download
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Recipients can view results and download Excel reports
                          </p>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Expiration */}
                  <div>
                    <Label htmlFor="edit-expiration">Link Expiration</Label>
                    <Select
                      value={editData.expirationOption || "never"}
                      onValueChange={(value: "24h" | "7d" | "30d" | "never") => 
                        setEditData(prev => ({ ...prev, expirationOption: value }))
                      }
                    >
                      <SelectTrigger className="mt-2" data-testid="select-edit-expiration">
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
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setEditDialogOpen(false)}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={updateMutation.isPending}
                data-testid="button-save-changes"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}