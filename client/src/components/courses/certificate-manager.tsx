import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Certificate, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import CertificateGenerator from "./certificate-generator";
import { 
  Award,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  RefreshCw,
  Calendar,
  TrendingUp,
  Users,
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from "lucide-react";

interface CertificateManagerProps {
  userId?: string; // If provided, show certificates for specific user
  showAdminControls?: boolean;
}

interface CertificateStats {
  totalCertificates: number;
  recentCertificates: number;
  topCourse: string;
  averageScore: number;
  downloadCount: number;
}

export default function CertificateManager({ 
  userId, 
  showAdminControls = false 
}: CertificateManagerProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "revoked">("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [certificateToRevoke, setCertificateToRevoke] = useState<Certificate | null>(null);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);

  // Determine target user
  const targetUserId = userId || user?.sub;
  const isAdminView = showAdminControls && user?.role === "admin";

  // Fetch certificates
  const { data: certificates, isLoading: isLoadingCertificates } = useQuery({
    queryKey: isAdminView ? ["/api/certificates"] : ["/api/users", targetUserId, "certificates"],
    enabled: isAuthenticated && !!targetUserId,
    queryFn: async () => {
      const url = isAdminView ? "/api/certificates" : `/api/users/${targetUserId}/certificates`;
      const response = await apiRequest("GET", url);
      return response.json();
    }
  });

  // Fetch certificate statistics
  const { data: stats } = useQuery({
    queryKey: ["/api/certificates/stats", targetUserId],
    enabled: isAuthenticated && !!targetUserId,
    queryFn: async (): Promise<CertificateStats> => {
      // Calculate stats from certificates data
      if (!certificates) return {
        totalCertificates: 0,
        recentCertificates: 0,
        topCourse: "N/A",
        averageScore: 0,
        downloadCount: 0
      };

      const totalCertificates = certificates.length;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentCertificates = certificates.filter((cert: Certificate) => 
        new Date(cert.issuedAt) > thirtyDaysAgo
      ).length;

      const courseCount: Record<string, number> = {};
      let totalScore = 0;
      let totalDownloads = 0;

      certificates.forEach((cert: Certificate) => {
        courseCount[cert.courseName] = (courseCount[cert.courseName] || 0) + 1;
        totalScore += cert.score;
        totalDownloads += cert.downloadCount || 0;
      });

      const topCourse = Object.entries(courseCount).reduce((a, b) => 
        a[1] > b[1] ? a : b, ["N/A", 0]
      )[0];

      return {
        totalCertificates,
        recentCertificates,
        topCourse,
        averageScore: totalCertificates > 0 ? totalScore / totalCertificates : 0,
        downloadCount: totalDownloads
      };
    }
  });

  // Revoke certificate mutation (admin only)
  const revokeCertificateMutation = useMutation({
    mutationFn: async (certificateId: string) => {
      const response = await apiRequest("POST", `/api/certificates/${certificateId}/revoke`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", targetUserId, "certificates"] });
      toast({
        title: "Certificate Revoked",
        description: "The certificate has been revoked successfully."
      });
      setShowRevokeDialog(false);
      setCertificateToRevoke(null);
    },
    onError: () => {
      toast({
        title: "Revocation Failed",
        description: "Failed to revoke certificate. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Filter certificates
  const filteredCertificates = certificates?.filter((cert: Certificate) => {
    const matchesSearch = !searchTerm || 
      cert.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.quizName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && !cert.revokedAt) ||
      (statusFilter === "revoked" && cert.revokedAt);

    const matchesCourse = courseFilter === "all" || cert.courseName === courseFilter;

    return matchesSearch && matchesStatus && matchesCourse;
  }) || [];

  // Get unique courses for filter
  const uniqueCourses = Array.from(new Set(certificates?.map((cert: Certificate) => cert.courseName) || []));

  // Handle certificate view
  const handleViewCertificate = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setShowViewDialog(true);
  };

  // Handle certificate revocation
  const handleRevokeCertificate = (certificate: Certificate) => {
    setCertificateToRevoke(certificate);
    setShowRevokeDialog(true);
  };

  const confirmRevoke = () => {
    if (certificateToRevoke) {
      revokeCertificateMutation.mutate(certificateToRevoke.id);
    }
  };

  // Format date
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Authentication Required</h3>
        <p className="text-muted-foreground">Please sign in to view certificates.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Award className="h-8 w-8 mr-3 text-yellow-500" />
              {isAdminView ? "Certificate Management" : "My Certificates"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isAdminView 
                ? "Manage and monitor all certificates in the system" 
                : "View and download your earned certificates"
              }
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/certificates"] })}
              data-testid="button-refresh-certificates"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Award className="h-8 w-8 text-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold">{stats.totalCertificates}</p>
                    <p className="text-sm text-muted-foreground">Total Certificates</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{stats.recentCertificates}</p>
                    <p className="text-sm text-muted-foreground">Recent (30 days)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{stats.averageScore.toFixed(0)}%</p>
                    <p className="text-sm text-muted-foreground">Average Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Download className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">{stats.downloadCount}</p>
                    <p className="text-sm text-muted-foreground">Downloads</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <FileText className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-lg font-bold truncate" title={stats.topCourse}>
                      {stats.topCourse}
                    </p>
                    <p className="text-sm text-muted-foreground">Top Course</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filter Certificates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search certificates..."
                    className="pl-10"
                    data-testid="input-search-certificates"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={statusFilter} onValueChange={(value: "all" | "active" | "revoked") => setStatusFilter(value)}>
                  <SelectTrigger data-testid="select-status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="revoked">Revoked</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="course">Course</Label>
                <Select value={courseFilter} onValueChange={setCourseFilter}>
                  <SelectTrigger data-testid="select-course-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {uniqueCourses.map((course) => (
                      <SelectItem key={course} value={course}>
                        {course}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Results</Label>
                <div className="text-sm text-muted-foreground pt-2">
                  {filteredCertificates.length} of {certificates?.length || 0} certificates
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Certificates Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Certificates ({filteredCertificates.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingCertificates ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Loading certificates...</p>
              </div>
            ) : filteredCertificates.length === 0 ? (
              <div className="text-center py-12">
                <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Certificates Found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== "all" || courseFilter !== "all"
                    ? "No certificates match your current filters."
                    : "No certificates have been earned yet."
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {isAdminView && <TableHead>Student</TableHead>}
                      <TableHead>Course</TableHead>
                      <TableHead>Quiz</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Downloads</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCertificates.map((certificate: Certificate) => (
                      <TableRow key={certificate.id}>
                        {isAdminView && (
                          <TableCell>
                            <div className="font-medium">{certificate.studentName}</div>
                            <div className="text-sm text-muted-foreground font-mono">
                              {certificate.certificateNumber}
                            </div>
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="font-medium">{certificate.courseName}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{certificate.quizName}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-green-600">
                            {certificate.score.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{formatDate(certificate.completionDate)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {certificate.revokedAt ? (
                            <Badge variant="destructive">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Revoked
                            </Badge>
                          ) : (
                            <Badge variant="default">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Download className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{certificate.downloadCount || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewCertificate(certificate)}
                              data-testid={`button-view-certificate-${certificate.id}`}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            
                            {isAdminView && !certificate.revokedAt && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRevokeCertificate(certificate)}
                                className="text-red-600 hover:text-red-700"
                                data-testid={`button-revoke-certificate-${certificate.id}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Certificate Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto" data-testid="dialog-view-certificate">
          <DialogHeader>
            <DialogTitle>Certificate Details</DialogTitle>
          </DialogHeader>
          {selectedCertificate && (
            <CertificateGenerator
              certificate={selectedCertificate}
              showVerificationInfo={true}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Revoke Certificate Dialog */}
      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent data-testid="dialog-revoke-certificate">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
              Revoke Certificate
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this certificate? This action cannot be undone.
              The certificate will no longer be valid and verification will fail.
              {certificateToRevoke && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="font-medium">Certificate Details:</div>
                  <div className="text-sm space-y-1 mt-2">
                    <div>Student: {certificateToRevoke.studentName}</div>
                    <div>Course: {certificateToRevoke.courseName}</div>
                    <div>ID: {certificateToRevoke.certificateNumber}</div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-revoke">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRevoke}
              className="bg-red-600 hover:bg-red-700"
              disabled={revokeCertificateMutation.isPending}
              data-testid="button-confirm-revoke"
            >
              {revokeCertificateMutation.isPending ? 'Revoking...' : 'Revoke Certificate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}