import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User, AdminApproval } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Crown, 
  User as UserIcon, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Award,
  TrendingUp,
  BookOpen,
  Star,
  Zap
} from "lucide-react";

interface PremiumAnalytics {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  tierDistribution: Record<string, number>;
  recentActivity: AdminApproval[];
}

interface PremiumApprovalDetails extends AdminApproval {
  requesterDetails?: {
    user: User;
    courseCount: number;
    certificateCount: number;
    avgQuizScore: number;
    totalHours: number;
    joinedDate: string;
  };
}

const PREMIUM_TIERS = [
  { value: 'basic', label: 'Basic Premium', description: 'Standard premium features' },
  { value: 'advanced', label: 'Advanced Premium', description: 'Enhanced analytics and tools' },
  { value: 'professional', label: 'Professional Premium', description: 'Full premium experience' }
];

const TIER_COLORS = {
  basic: 'bg-blue-500',
  advanced: 'bg-purple-500', 
  professional: 'bg-gold-500'
};

export default function AdminPremiumApprovalsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<PremiumApprovalDetails | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [approvalTier, setApprovalTier] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  // Fetch pending premium approvals
  const { data: pendingRequests, isLoading: isLoadingRequests, refetch: refetchRequests } = useQuery<PremiumApprovalDetails[]>({
    queryKey: ["/api/admin/premium/pending"],
    enabled: user?.role === "admin",
    retry: false,
  });

  // Fetch premium analytics
  const { data: analytics, isLoading: isLoadingAnalytics } = useQuery<PremiumAnalytics>({
    queryKey: ["/api/admin/premium/analytics"],
    enabled: user?.role === "admin",
    retry: false,
  });

  // Approve premium request mutation
  const approvePremiumMutation = useMutation({
    mutationFn: async ({ approvalId, tier, notes }: { approvalId: string; tier: string; notes?: string }) => {
      const response = await apiRequest("POST", `/api/admin/premium/${approvalId}/approve`, {
        body: JSON.stringify({ tier, notes })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/premium/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/premium/analytics"] });
      setIsDialogOpen(false);
      setSelectedRequest(null);
      setApprovalTier('');
      toast({
        title: "Premium Access Approved",
        description: "User has been granted premium access successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Approval Failed",
        description: "Failed to approve premium access. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setProcessingAction(null);
    }
  });

  // Reject premium request mutation
  const rejectPremiumMutation = useMutation({
    mutationFn: async ({ approvalId, reason }: { approvalId: string; reason: string }) => {
      const response = await apiRequest("POST", `/api/admin/premium/${approvalId}/reject`, {
        body: JSON.stringify({ reason })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/premium/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/premium/analytics"] });
      setIsDialogOpen(false);
      setSelectedRequest(null);
      setRejectionReason('');
      toast({
        title: "Premium Request Rejected",
        description: "User has been notified of the rejection.",
        variant: "default",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Rejection Failed",
        description: "Failed to reject premium request. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setProcessingAction(null);
    }
  });

  const handleApprove = async (request: PremiumApprovalDetails, tier: string) => {
    if (!tier) {
      toast({
        title: "Tier Required",
        description: "Please select a premium tier before approving.",
        variant: "destructive",
      });
      return;
    }
    
    setProcessingAction('approve');
    await approvePremiumMutation.mutateAsync({ 
      approvalId: request.id, 
      tier, 
      notes: `Approved for ${tier} tier by admin` 
    });
  };

  const handleReject = async (request: PremiumApprovalDetails, reason: string) => {
    if (!reason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }
    
    setProcessingAction('reject');
    await rejectPremiumMutation.mutateAsync({ 
      approvalId: request.id, 
      reason 
    });
  };

  const openRequestDetails = (request: PremiumApprovalDetails) => {
    setSelectedRequest(request);
    setApprovalTier((request.requestDetails as any)?.requestedTier || '');
    setIsDialogOpen(true);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'basic': return 'bg-blue-500';
      case 'advanced': return 'bg-purple-500';
      case 'professional': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="p-8 text-center">
            <Crown className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">You need admin privileges to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="page-title">
            Premium Approvals
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage premium access requests and user tier assignments
          </p>
        </div>
        <Button onClick={() => refetchRequests()} data-testid="button-refresh">
          <TrendingUp className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="pending" className="space-y-6" data-testid="premium-tabs">
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending Requests
            {pendingRequests && pendingRequests.length > 0 && (
              <Badge className="ml-2" variant="secondary">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4" data-testid="tab-content-pending">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card data-testid="card-total-requests">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Crown className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                    <p className="text-2xl font-bold">{analytics?.totalRequests || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-pending-requests">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold">{analytics?.pendingRequests || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-approved-requests">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Approved</p>
                    <p className="text-2xl font-bold">{analytics?.approvedRequests || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-rejected-requests">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                    <p className="text-2xl font-bold">{analytics?.rejectedRequests || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Requests Table */}
          <Card data-testid="card-pending-table">
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserIcon className="w-5 h-5 mr-2" />
                Pending Premium Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingRequests ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-muted rounded-md"></div>
                    </div>
                  ))}
                </div>
              ) : !pendingRequests || pendingRequests.length === 0 ? (
                <div className="text-center py-8" data-testid="no-pending-requests">
                  <Crown className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
                  <p className="text-muted-foreground">All premium requests have been processed.</p>
                </div>
              ) : (
                <Table data-testid="pending-requests-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Requested Tier</TableHead>
                      <TableHead>Request Date</TableHead>
                      <TableHead>Justification</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRequests.map((request) => (
                      <TableRow key={request.id} data-testid={`request-row-${request.id}`}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <UserIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {request.requesterDetails?.user?.firstName && request.requesterDetails?.user?.lastName 
                                  ? `${request.requesterDetails.user.firstName} ${request.requesterDetails.user.lastName}` 
                                  : request.requesterDetails?.user?.email || 'Unknown User'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {request.requesterDetails?.user?.email || 'No email'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTierBadgeColor((request.requestDetails as any)?.requestedTier || 'basic')}>
                            <Crown className="w-3 h-3 mr-1" />
                            {(request.requestDetails as any)?.requestedTier || 'Basic'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(request.createdAt || new Date())}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="max-w-xs truncate" title={(request.requestDetails as any)?.justification}>
                            {(request.requestDetails as any)?.justification || 'No justification provided'}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Button 
                            onClick={() => openRequestDetails(request)}
                            variant="outline" 
                            size="sm"
                            data-testid={`button-review-${request.id}`}
                          >
                            <Award className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4" data-testid="tab-content-analytics">
          {/* Tier Distribution */}
          <Card data-testid="card-tier-distribution">
            <CardHeader>
              <CardTitle>Premium Tier Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics?.tierDistribution && Object.keys(analytics.tierDistribution).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(analytics.tierDistribution).map(([tier, count]) => (
                    <div key={tier} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full ${getTierBadgeColor(tier)}`}></div>
                        <span className="font-medium capitalize">{tier}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Progress 
                          value={(count / (analytics?.totalRequests || 1)) * 100} 
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground w-8">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No tier distribution data available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card data-testid="card-recent-activity">
            <CardHeader>
              <CardTitle>Recent Premium Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {analytics.recentActivity.slice(0, 10).map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.status === 'approved' ? 'bg-green-500' : 
                          activity.status === 'rejected' ? 'bg-red-500' : 
                          'bg-yellow-500'
                        }`}></div>
                        <div>
                          <p className="font-medium">
                            Premium {activity.status} for {(activity.requestDetails as any)?.requestedTier || 'unknown'} tier
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(activity.createdAt || new Date())}
                          </p>
                        </div>
                      </div>
                      <Badge variant={
                        activity.status === 'approved' ? 'default' : 
                        activity.status === 'rejected' ? 'destructive' : 
                        'secondary'
                      }>
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No recent activity to display
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Request Review Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-review-request">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Crown className="w-5 h-5 mr-2" />
              Review Premium Request
            </DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* User Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">User</Label>
                  <div className="mt-1">
                    <p className="font-medium">
                      {selectedRequest.requesterDetails?.user?.firstName && selectedRequest.requesterDetails?.user?.lastName 
                        ? `${selectedRequest.requesterDetails.user.firstName} ${selectedRequest.requesterDetails.user.lastName}` 
                        : selectedRequest.requesterDetails?.user?.email || 'Unknown'}
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedRequest.requesterDetails?.user?.email}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Requested Tier</Label>
                  <div className="mt-1">
                    <Badge className={getTierBadgeColor((selectedRequest.requestDetails as any)?.requestedTier || 'basic')}>
                      {(selectedRequest.requestDetails as any)?.requestedTier || 'Basic'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* User Stats */}
              {selectedRequest.requesterDetails && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <BookOpen className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <p className="text-lg font-bold">{selectedRequest.requesterDetails.courseCount || 0}</p>
                    <p className="text-xs text-muted-foreground">Courses</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <Award className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <p className="text-lg font-bold">{selectedRequest.requesterDetails.certificateCount || 0}</p>
                    <p className="text-xs text-muted-foreground">Certificates</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <Star className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <p className="text-lg font-bold">{selectedRequest.requesterDetails.avgQuizScore || 0}%</p>
                    <p className="text-xs text-muted-foreground">Avg Score</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <p className="text-lg font-bold">{selectedRequest.requesterDetails.totalHours || 0}h</p>
                    <p className="text-xs text-muted-foreground">Study Time</p>
                  </div>
                </div>
              )}

              {/* Justification */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Justification</Label>
                <div className="mt-1 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">
                    {(selectedRequest.requestDetails as any)?.justification || 'No justification provided'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-4">
                <div className="flex-1 space-y-2">
                  <Label>Approve with Tier</Label>
                  <Select value={approvalTier} onValueChange={setApprovalTier}>
                    <SelectTrigger data-testid="select-approval-tier">
                      <SelectValue placeholder="Select premium tier" />
                    </SelectTrigger>
                    <SelectContent>
                      {PREMIUM_TIERS.map((tier) => (
                        <SelectItem key={tier.value} value={tier.value}>
                          <div className="flex items-center space-x-2">
                            <Crown className="w-4 h-4" />
                            <div>
                              <p className="font-medium">{tier.label}</p>
                              <p className="text-xs text-muted-foreground">{tier.description}</p>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={() => handleApprove(selectedRequest, approvalTier)}
                    disabled={!approvalTier || processingAction === 'approve'}
                    className="w-full"
                    data-testid="button-approve-request"
                  >
                    {processingAction === 'approve' ? (
                      <>
                        <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve Request
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex-1 space-y-2">
                  <Label>Rejection Reason</Label>
                  <Textarea 
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejection..."
                    className="min-h-[80px]"
                    data-testid="textarea-rejection-reason"
                  />
                  <Button 
                    onClick={() => handleReject(selectedRequest, rejectionReason)}
                    disabled={!rejectionReason.trim() || processingAction === 'reject'}
                    variant="destructive"
                    className="w-full"
                    data-testid="button-reject-request"
                  >
                    {processingAction === 'reject' ? (
                      <>
                        <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject Request
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}