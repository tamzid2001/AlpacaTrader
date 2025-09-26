import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  FolderOpen, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Download, 
  Trash2, 
  Play, 
  FileText,
  Calendar,
  HardDrive,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { deleteCsvFile, downloadCsvFile } from "@/lib/firebase-storage";
import { formatDistanceToNow } from "date-fns";
import type { CsvUpload } from "@shared/schema";

interface CsvFileLibraryProps {
  onAnalyzeFile: (upload: CsvUpload) => void;
  onRefresh?: () => void;
}

type SortField = 'customFilename' | 'uploadedAt' | 'fileSize' | 'status';
type SortDirection = 'asc' | 'desc';

interface FileFilters {
  status: string;
  dateRange: string;
  search: string;
}

export function CsvFileLibrary({ onAnalyzeFile, onRefresh }: CsvFileLibraryProps) {
  const [filters, setFilters] = useState<FileFilters>({
    status: 'all',
    dateRange: 'all',
    search: '',
  });
  const [sortField, setSortField] = useState<SortField>('uploadedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedFile, setSelectedFile] = useState<CsvUpload | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newFilename, setNewFilename] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch user's CSV uploads
  const { data: uploads = [], isLoading, refetch } = useQuery<CsvUpload[]>({
    queryKey: ["/api/csv/uploads", user?.id],
    enabled: !!user?.id,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (upload: CsvUpload) => {
      // Delete from Firebase Storage
      await deleteCsvFile(upload.firebaseStoragePath);
      // Delete from database
      await apiRequest("DELETE", `/api/csv/uploads/${upload.id}`);
    },
    onSuccess: () => {
      toast({
        title: "File deleted",
        description: "The CSV file has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/csv/uploads"] });
      onRefresh?.();
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Rename mutation
  const renameMutation = useMutation({
    mutationFn: async ({ id, newName }: { id: string; newName: string }) => {
      const response = await apiRequest("PATCH", `/api/csv/uploads/${id}`, {
        customFilename: newName,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "File renamed",
        description: "The file has been successfully renamed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/csv/uploads"] });
      setRenameDialogOpen(false);
      setSelectedFile(null);
      setNewFilename("");
    },
    onError: (error: any) => {
      toast({
        title: "Rename failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter and sort uploads
  const filteredAndSortedUploads = uploads
    .filter((upload: CsvUpload) => {
      // Status filter
      if (filters.status !== 'all' && upload.status !== filters.status) {
        return false;
      }

      // Search filter
      if (filters.search && !upload.customFilename.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const uploadDate = new Date(upload.uploadedAt);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (filters.dateRange) {
          case 'today':
            if (daysDiff > 0) return false;
            break;
          case 'week':
            if (daysDiff > 7) return false;
            break;
          case 'month':
            if (daysDiff > 30) return false;
            break;
        }
      }

      return true;
    })
    .sort((a: CsvUpload, b: CsvUpload) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'uploadedAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleDownload = async (upload: CsvUpload) => {
    try {
      const downloadUrl = await downloadCsvFile(upload.firebaseStoragePath);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${upload.customFilename}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download started",
        description: `Downloading ${upload.customFilename}.csv`,
      });
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openRenameDialog = (upload: CsvUpload) => {
    setSelectedFile(upload);
    setNewFilename(upload.customFilename);
    setRenameDialogOpen(true);
  };

  const handleRename = () => {
    if (!selectedFile || !newFilename.trim()) return;
    
    // Remove invalid filename characters
    const cleanedName = newFilename.trim().replace(/[<>:"/\\|?*]/g, '').slice(0, 50);
    
    renameMutation.mutate({
      id: selectedFile.id,
      newName: cleanedName,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploaded':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      uploaded: "secondary",
      processing: "default",
      completed: "default",
      error: "destructive",
    };

    return (
      <Badge variant={variants[status] || "outline"} className="capitalize">
        {status}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!user) {
    return (
      <Card data-testid="card-auth-required-library">
        <CardContent className="py-6">
          <div className="text-center text-muted-foreground">
            Please log in to view your CSV files.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="container-csv-file-library">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            My CSV Files
            <Badge variant="outline" className="ml-auto" data-testid="badge-file-count">
              {filteredAndSortedUploads.length} files
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="max-w-sm"
                data-testid="input-search-files"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger className="w-32" data-testid="select-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="uploaded">Uploaded</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.dateRange}
                onValueChange={(value) => setFilters({ ...filters, dateRange: value })}
              >
                <SelectTrigger className="w-32" data-testid="select-date-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()}
                disabled={isLoading}
                data-testid="button-refresh-files"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Files Table */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your files...</p>
            </div>
          ) : filteredAndSortedUploads.length === 0 ? (
            <div className="text-center py-8" data-testid="container-no-files">
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">No CSV files found</p>
              <p className="text-muted-foreground">
                {filters.search || filters.status !== 'all' || filters.dateRange !== 'all'
                  ? 'Try adjusting your filters or upload a new file.'
                  : 'Upload your first CSV file to get started with anomaly detection.'}
              </p>
            </div>
          ) : (
            <Table data-testid="table-csv-files">
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('customFilename')}>
                    <div className="flex items-center gap-1">
                      Filename
                      {sortField === 'customFilename' && (
                        <span className="text-xs">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('fileSize')}>
                    <div className="flex items-center gap-1">
                      <HardDrive className="h-4 w-4" />
                      Size
                      {sortField === 'fileSize' && (
                        <span className="text-xs">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('uploadedAt')}>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Uploaded
                      {sortField === 'uploadedAt' && (
                        <span className="text-xs">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedUploads.map((upload: CsvUpload) => (
                  <TableRow key={upload.id} data-testid={`row-file-${upload.id}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium" data-testid={`text-filename-${upload.id}`}>
                            {upload.customFilename}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {upload.rowCount.toLocaleString()} rows, {upload.columnCount} columns
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(upload.status)}
                        {getStatusBadge(upload.status)}
                      </div>
                    </TableCell>
                    <TableCell data-testid={`text-filesize-${upload.id}`}>
                      {formatFileSize(upload.fileSize)}
                    </TableCell>
                    <TableCell data-testid={`text-upload-date-${upload.id}`}>
                      {formatDistanceToNow(new Date(upload.uploadedAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" data-testid={`button-actions-${upload.id}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onAnalyzeFile(upload)}>
                            <Play className="h-4 w-4 mr-2" />
                            Analyze
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(upload)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openRenameDialog(upload)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete File</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{upload.customFilename}"? 
                                  This action cannot be undone and will remove the file from 
                                  cloud storage and all associated analysis data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(upload)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  data-testid={`button-confirm-delete-${upload.id}`}
                                >
                                  Delete
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

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent data-testid="dialog-rename-file">
          <DialogHeader>
            <DialogTitle>Rename File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-filename">New Filename</Label>
              <Input
                id="new-filename"
                value={newFilename}
                onChange={(e) => setNewFilename(e.target.value.replace(/[<>:"/\\|?*]/g, '').slice(0, 50))}
                placeholder="Enter new filename"
                maxLength={50}
                data-testid="input-new-filename"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {newFilename.length}/50 characters. Special characters will be removed.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setRenameDialogOpen(false)}
                data-testid="button-cancel-rename"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleRename}
                disabled={!newFilename.trim() || renameMutation.isPending}
                data-testid="button-confirm-rename"
              >
                {renameMutation.isPending ? "Renaming..." : "Rename"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CsvFileLibrary;