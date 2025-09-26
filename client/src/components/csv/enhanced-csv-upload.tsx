import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Check, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  parseCsvFile,
  validateCsvForSageMaker,
  type CsvValidationResult
} from "@/lib/firebase-storage";
import CsvPreview from "./csv-preview";
import type { CsvUpload } from "@shared/schema";

interface EnhancedCsvUploadProps {
  onUploadSuccess: (upload: CsvUpload) => void;
}

interface UploadState {
  step: 'select' | 'preview' | 'upload' | 'complete';
  progress: number;
}

export function EnhancedCsvUpload({ onUploadSuccess }: EnhancedCsvUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [customFilename, setCustomFilename] = useState("");
  const [customFilenameInteracted, setCustomFilenameInteracted] = useState(false);
  const [csvData, setCsvData] = useState<any[] | null>(null);
  const [validationResult, setValidationResult] = useState<CsvValidationResult | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({ step: 'select', progress: 0 });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const uploadMutation = useMutation({
    mutationFn: async (data: {
      file: File;
      customFilename: string;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      setUploadState({ step: 'upload', progress: 0 });

      // Create FormData for secure server-side upload
      const formData = new FormData();
      formData.append('csvFile', data.file);
      formData.append('customFilename', data.customFilename);

      setUploadState({ step: 'upload', progress: 50 });

      // Upload directly to server (server handles Firebase Storage and parsing)
      const response = await fetch('/api/csv/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include', // Include auth cookies
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const upload = await response.json();

      // Complete (100% progress)
      setUploadState({ step: 'upload', progress: 100 });
      return upload;
    },
    onSuccess: (upload) => {
      setUploadState({ step: 'complete', progress: 100 });
      toast({
        title: "CSV uploaded successfully",
        description: `File "${upload.customFilename}" has been uploaded and is ready for analysis.`,
      });
      onUploadSuccess(upload);
      queryClient.invalidateQueries({ queryKey: ["/api/csv/uploads"] });
      
      // Reset form after a delay
      setTimeout(() => {
        resetForm();
      }, 2000);
    },
    onError: (error: any) => {
      setUploadState({ step: 'preview', progress: 0 });
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFile(null);
    setCustomFilename("");
    setCustomFilenameInteracted(false);
    setCsvData(null);
    setValidationResult(null);
    setUploadState({ step: 'select', progress: 0 });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files[0]) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = async (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file.",
        variant: "destructive",
      });
      return;
    }

    if (selectedFile.size > 100 * 1024 * 1024) { // 100MB limit
      toast({
        title: "File too large",
        description: "Please select a file smaller than 100MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      setFile(selectedFile);
      
      // Generate default custom filename (remove .csv extension)
      const defaultName = selectedFile.name.replace(/\.csv$/i, '');
      setCustomFilename(defaultName);

      // Parse CSV data
      const data = await parseCsvFile(selectedFile);
      setCsvData(data);

      // Move to preview step
      setUploadState({ step: 'preview', progress: 0 });
    } catch (error: any) {
      toast({
        title: "CSV parsing error",
        description: error.message,
        variant: "destructive",
      });
      setFile(null);
    }
  };

  const handleValidation = (isValid: boolean, result: CsvValidationResult) => {
    setValidationResult(result);
  };

  const handleUpload = () => {
    if (!file || !customFilename.trim()) {
      toast({
        title: "Missing information",
        description: "Please ensure file is selected and custom filename is provided.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({
      file,
      customFilename: customFilename.trim(),
    });
  };

  const handleCustomFilenameChange = (value: string) => {
    // Remove invalid filename characters
    const cleaned = value.replace(/[<>:"/\\|?*]/g, '').slice(0, 50);
    setCustomFilename(cleaned);
    setCustomFilenameInteracted(true);
  };

  const handleCustomFilenameBlur = () => {
    setCustomFilenameInteracted(true);
  };

  const getStepIndicator = () => {
    const steps = [
      { id: 'select', label: 'Select File', completed: !!file },
      { id: 'preview', label: 'Preview & Validate', completed: uploadState.step === 'complete' || uploadState.step === 'upload' },
      { id: 'upload', label: 'Upload', completed: uploadState.step === 'complete' },
    ];

    return (
      <div className="flex items-center justify-between mb-6">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
              step.completed 
                ? 'bg-primary border-primary text-primary-foreground' 
                : uploadState.step === step.id
                  ? 'border-primary text-primary'
                  : 'border-muted-foreground text-muted-foreground'
            }`}>
              {step.completed ? (
                <Check className="h-4 w-4" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            <span className={`ml-2 text-sm font-medium ${
              step.completed || uploadState.step === step.id
                ? 'text-foreground'
                : 'text-muted-foreground'
            }`}>
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div className={`mx-4 h-0.5 w-12 ${
                step.completed ? 'bg-primary' : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  if (!user) {
    return (
      <Card data-testid="card-auth-required">
        <CardContent className="py-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please log in to upload CSV files.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="container-enhanced-csv-upload">
      {getStepIndicator()}

      {uploadState.step === 'select' && (
        <Card data-testid="card-file-selection">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Select CSV File
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              data-testid="dropzone-enhanced-csv"
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">
                Drop your CSV file here or click to browse
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Supports CSV files with percentile data for anomaly detection (max 50MB)
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => e.target.files?.[0] && handleFileSelection(e.target.files[0])}
                className="hidden"
                id="enhanced-csv-file-input"
                data-testid="input-enhanced-csv-file"
                aria-label="Choose CSV file to upload for anomaly detection"
              />
              <label htmlFor="enhanced-csv-file-input">
                <span className="sr-only">Choose CSV file to upload</span>
                <Button variant="outline" asChild data-testid="button-browse-enhanced-files">
                  <span style={{ cursor: 'pointer' }}>Browse Files</span>
                </Button>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {uploadState.step === 'preview' && file && (
        <div className="space-y-6">
          {/* Custom Filename Input */}
          <Card data-testid="card-filename-input">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                File Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="original-filename">Original Filename</Label>
                  <Input
                    id="original-filename"
                    value={file.name}
                    disabled
                    className="bg-muted"
                    data-testid="input-original-filename"
                    aria-describedby="original-filename-desc"
                  />
                  <span id="original-filename-desc" className="sr-only">
                    The original name of your uploaded file
                  </span>
                </div>
                <div>
                  <Label htmlFor="custom-filename">
                    Custom Filename <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="custom-filename"
                    value={customFilename}
                    onChange={(e) => handleCustomFilenameChange(e.target.value)}
                    onBlur={handleCustomFilenameBlur}
                    placeholder="Enter a descriptive name for your file"
                    maxLength={50}
                    data-testid="input-custom-filename"
                    required
                    aria-required="true"
                    aria-describedby="custom-filename-desc custom-filename-error"
                    aria-invalid={!customFilename.trim() && customFilenameInteracted}
                  />
                  <span id="custom-filename-desc" className="text-xs text-muted-foreground mt-1">
                    {customFilename.length}/50 characters. Special characters will be removed.
                  </span>
                  {!customFilename.trim() && customFilenameInteracted && (
                    <span id="custom-filename-error" className="text-xs text-destructive" role="alert">
                      Custom filename is required
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Size: {(file.size / 1024).toFixed(1)} KB</span>
                <Separator orientation="vertical" className="h-4" />
                <span>Type: CSV</span>
                <Separator orientation="vertical" className="h-4" />
                <span>Modified: {new Date(file.lastModified).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* CSV Preview Component */}
          <CsvPreview 
            file={file} 
            onValidation={handleValidation}
          />

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={resetForm}
              data-testid="button-cancel-upload"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!customFilename.trim()}
              data-testid="button-confirm-upload"
            >
              Upload & Analyze
            </Button>
          </div>
        </div>
      )}

      {uploadState.step === 'upload' && (
        <Card data-testid="card-upload-progress">
          <CardContent className="py-8">
            <div className="text-center space-y-4" role="status" aria-live="polite">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" aria-hidden="true"></div>
              <div>
                <p className="text-lg font-medium">Uploading your file...</p>
                <p className="text-sm text-muted-foreground">
                  Please don't close this page while the upload is in progress.
                </p>
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <Progress 
                value={uploadState.progress} 
                className="w-full" 
                data-testid="progress-upload"
                aria-label="Upload progress"
                role="progressbar"
                aria-valuenow={uploadState.progress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
                <p className="text-xs text-muted-foreground">
                  {uploadState.progress < 30 ? 'Preparing file...' :
                   uploadState.progress < 70 ? 'Uploading to cloud storage...' :
                   uploadState.progress < 100 ? 'Saving to database...' :
                   'Finalizing...'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {uploadState.step === 'complete' && (
        <Card data-testid="card-upload-complete">
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-lg font-medium">Upload Complete!</p>
                <p className="text-sm text-muted-foreground">
                  Your file "{customFilename}" has been successfully uploaded and is ready for anomaly detection.
                </p>
              </div>
              <Badge variant="default" className="mt-2">
                File Ready for Analysis
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default EnhancedCsvUpload;