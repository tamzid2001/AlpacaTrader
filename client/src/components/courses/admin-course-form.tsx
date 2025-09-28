import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Course } from "@shared/schema";
import { 
  Upload, 
  X, 
  Plus, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive, 
  Code, 
  BookOpen,
  Presentation,
  Sheet,
  Trash2,
  Eye,
  Download,
  AlertCircle
} from "lucide-react";

// Enhanced content validation schema requiring at least one content item
const courseFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  price: z.number().min(0, "Price must be non-negative"),
  instructor: z.string().min(1, "Instructor is required"),
  category: z.string().min(1, "Category is required"),
  estimatedCompletionHours: z.number().min(1, "Estimated completion hours is required"),
  prerequisites: z.array(z.string()).optional(),
  learningObjectives: z.array(z.string()).min(1, "At least one learning objective is required"),
  tags: z.array(z.string()).optional(),
  status: z.enum(["draft", "published", "archived"]),
}).refine((data) => {
  // Custom validation will be handled separately for content files
  return true;
}, {
  message: "At least one content file is required (video is optional)",
});

type CourseFormData = z.infer<typeof courseFormSchema>;

// Interface for uploaded content files
interface UploadedFile {
  id: string;
  file: File;
  type: 'document' | 'presentation' | 'spreadsheet' | 'image' | 'audio' | 'video' | 'archive' | 'code' | 'ebook' | 'design';
  category: 'learning_material' | 'assignment' | 'reference' | 'template' | 'example';
  title: string;
  description: string;
  isRequired: boolean;
  uploadProgress: number;
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'error';
  uploadError?: string;
  preview?: string; // For image previews
}

// Supported file type configurations
const FILE_TYPE_CONFIG = {
  document: { 
    extensions: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'md'], 
    icon: FileText, 
    color: 'text-blue-600',
    maxSize: 100 * 1024 * 1024 // 100MB
  },
  presentation: { 
    extensions: ['ppt', 'pptx', 'odp'], 
    icon: Presentation, 
    color: 'text-orange-600',
    maxSize: 100 * 1024 * 1024 // 100MB
  },
  spreadsheet: { 
    extensions: ['xls', 'xlsx', 'csv', 'ods'], 
    icon: Sheet, 
    color: 'text-green-600',
    maxSize: 50 * 1024 * 1024 // 50MB
  },
  image: { 
    extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'], 
    icon: Image, 
    color: 'text-purple-600',
    maxSize: 25 * 1024 * 1024 // 25MB
  },
  audio: { 
    extensions: ['mp3', 'wav', 'aac', 'ogg'], 
    icon: Music, 
    color: 'text-pink-600',
    maxSize: 100 * 1024 * 1024 // 100MB
  },
  video: { 
    extensions: ['mp4', 'mov', 'avi', 'webm', 'mkv'], 
    icon: Video, 
    color: 'text-red-600',
    maxSize: 500 * 1024 * 1024 // 500MB
  },
  archive: { 
    extensions: ['zip', 'rar', '7z'], 
    icon: Archive, 
    color: 'text-yellow-600',
    maxSize: 200 * 1024 * 1024 // 200MB
  },
  code: { 
    extensions: ['js', 'ts', 'html', 'css', 'json', 'xml'], 
    icon: Code, 
    color: 'text-gray-600',
    maxSize: 10 * 1024 * 1024 // 10MB
  },
  ebook: { 
    extensions: ['epub'], 
    icon: BookOpen, 
    color: 'text-indigo-600',
    maxSize: 50 * 1024 * 1024 // 50MB
  },
  design: { 
    extensions: ['psd', 'ai'], 
    icon: Image, 
    color: 'text-cyan-600',
    maxSize: 100 * 1024 * 1024 // 100MB
  }
};

interface AdminCourseFormProps {
  course?: Course;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AdminCourseForm({ course, onSuccess, onCancel }: AdminCourseFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Enhanced state management for content files
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [contentValidationError, setContentValidationError] = useState<string>('');
  const [learningObjectives, setLearningObjectives] = useState<string[]>(
    course?.learningObjectives || [""]
  );
  const [prerequisites, setPrerequisites] = useState<string[]>(
    course?.prerequisites || []
  );
  const [tags, setTags] = useState<string[]>(course?.tags || []);

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: course?.title || "",
      description: course?.description || "",
      level: course?.level as "beginner" | "intermediate" | "advanced" || "beginner",
      price: course?.price ? course.price / 100 : 0, // Convert from cents
      instructor: course?.instructor || "",
      category: course?.category || "",
      estimatedCompletionHours: course?.estimatedCompletionHours || 1,
      prerequisites: course?.prerequisites || [],
      learningObjectives: course?.learningObjectives || [""],
      tags: course?.tags || [],
      status: course?.status as "draft" | "published" | "archived" || "draft",
    },
  });

  const createCourseMutation = useMutation({
    mutationFn: async (data: CourseFormData) => {
      const courseData = {
        ...data,
        price: data.price * 100, // Convert to cents
        prerequisites,
        learningObjectives: learningObjectives.filter(obj => obj.trim() !== ""),
        tags,
      };

      let response;
      if (course) {
        response = await apiRequest("PUT", `/api/courses/${course.id}`, courseData);
      } else {
        response = await apiRequest("POST", "/api/courses", courseData);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: course ? "Course Updated" : "Course Created",
        description: course ? "Course has been updated successfully." : "Course has been created successfully.",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${course ? "update" : "create"} course.`,
        variant: "destructive",
      });
    },
  });

  // Enhanced file upload mutation supporting multiple files
  const uploadContentMutation = useMutation({
    mutationFn: async (files: UploadedFile[]) => {
      const formData = new FormData();
      
      // Add files to FormData
      files.forEach((uploadFile, index) => {
        formData.append('files', uploadFile.file);
        formData.append(`material_${index}`, JSON.stringify({
          title: uploadFile.title,
          description: uploadFile.description,
          category: uploadFile.category,
          isRequired: uploadFile.isRequired,
          order: index
        }));
      });
      
      // Add course/lesson ID
      formData.append('courseId', course?.id || 'new-course');
      
      const response = await apiRequest("POST", "/api/materials", formData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: `${data.success || 0} files uploaded successfully.`,
      });
      // Clear uploaded files after successful upload
      setUploadedFiles([]);
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload content files.",
        variant: "destructive",
      });
    },
  });

  // File handling utilities
  const getFileType = (file: File): UploadedFile['type'] => {
    const extension = file.name.toLowerCase().split('.').pop() || '';
    
    for (const [type, config] of Object.entries(FILE_TYPE_CONFIG)) {
      if (config.extensions.includes(extension)) {
        return type as UploadedFile['type'];
      }
    }
    return 'document'; // Default fallback
  };

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    const fileType = getFileType(file);
    const config = FILE_TYPE_CONFIG[fileType];
    
    // Check file size
    if (file.size > config.maxSize) {
      const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
      return {
        isValid: false,
        error: `File size exceeds ${maxSizeMB}MB limit for ${fileType} files`
      };
    }
    
    // Check file extension
    const extension = file.name.toLowerCase().split('.').pop() || '';
    if (!config.extensions.includes(extension)) {
      return {
        isValid: false,
        error: `File type .${extension} is not supported for ${fileType} files`
      };
    }
    
    return { isValid: true };
  };

  const createImagePreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  };

  // File upload handlers
  const handleFileSelect = useCallback(async (files: FileList) => {
    const newFiles: UploadedFile[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = validateFile(file);
      
      if (!validation.isValid) {
        toast({
          title: "Invalid File",
          description: `${file.name}: ${validation.error}`,
          variant: "destructive",
        });
        continue;
      }
      
      const fileType = getFileType(file);
      const uploadFile: UploadedFile = {
        id: `${Date.now()}-${i}`,
        file,
        type: fileType,
        category: 'learning_material',
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        description: '',
        isRequired: false,
        uploadProgress: 0,
        uploadStatus: 'pending'
      };
      
      // Generate preview for images
      if (fileType === 'image') {
        try {
          uploadFile.preview = await createImagePreview(file);
        } catch (error) {
          console.warn('Failed to create image preview:', error);
        }
      }
      
      newFiles.push(uploadFile);
    }
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    setContentValidationError(''); // Clear validation error when files are added
  }, [toast]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  // File management functions
  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const updateFileMetadata = (fileId: string, updates: Partial<UploadedFile>) => {
    setUploadedFiles(prev => 
      prev.map(f => f.id === fileId ? { ...f, ...updates } : f)
    );
  };

  const reorderFiles = (startIndex: number, endIndex: number) => {
    setUploadedFiles(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  };

  const handleSubmit = async (data: CourseFormData) => {
    // Validate that at least one content file is uploaded (video is optional)
    if (uploadedFiles.length === 0) {
      setContentValidationError("At least one content file is required. Video content is optional, but you must provide some learning materials.");
      toast({
        title: "Content Required",
        description: "Please upload at least one content file before creating the course.",
        variant: "destructive",
      });
      return;
    }

    // Clear validation error
    setContentValidationError('');
    
    // Create course first
    createCourseMutation.mutate(data);
  };

  const addLearningObjective = () => {
    setLearningObjectives([...learningObjectives, ""]);
  };

  const updateLearningObjective = (index: number, value: string) => {
    const updated = [...learningObjectives];
    updated[index] = value;
    setLearningObjectives(updated);
  };

  const removeLearningObjective = (index: number) => {
    setLearningObjectives(learningObjectives.filter((_, i) => i !== index));
  };

  const addPrerequisite = () => {
    setPrerequisites([...prerequisites, ""]);
  };

  const updatePrerequisite = (index: number, value: string) => {
    const updated = [...prerequisites];
    updated[index] = value;
    setPrerequisites(updated);
  };

  const removePrerequisite = (index: number) => {
    setPrerequisites(prerequisites.filter((_, i) => i !== index));
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      setTags([...tags, tag.trim()]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <Card className="max-w-4xl mx-auto" data-testid="admin-course-form">
      <CardHeader>
        <CardTitle>
          {course ? "Edit Course" : "Create New Course"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter course title" 
                        {...field} 
                        data-testid="input-course-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instructor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructor</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter instructor name" 
                        {...field} 
                        data-testid="input-instructor"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="trading">Trading</SelectItem>
                        <SelectItem value="machine-learning">Machine Learning</SelectItem>
                        <SelectItem value="data-analysis">Data Analysis</SelectItem>
                        <SelectItem value="risk-management">Risk Management</SelectItem>
                        <SelectItem value="portfolio-management">Portfolio Management</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-level">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        data-testid="input-price"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimatedCompletionHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Completion (Hours)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="1" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        data-testid="input-completion-hours"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter course description" 
                      className="min-h-[100px]"
                      {...field} 
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Learning Objectives */}
            <div>
              <FormLabel>Learning Objectives</FormLabel>
              <div className="space-y-2 mt-2">
                {learningObjectives.map((objective, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={objective}
                      onChange={(e) => updateLearningObjective(index, e.target.value)}
                      placeholder="What will students learn?"
                      data-testid={`input-objective-${index}`}
                    />
                    {learningObjectives.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeLearningObjective(index)}
                        data-testid={`button-remove-objective-${index}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLearningObjective}
                  data-testid="button-add-objective"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Learning Objective
                </Button>
              </div>
            </div>

            {/* Prerequisites */}
            <div>
              <FormLabel>Prerequisites (Optional)</FormLabel>
              <div className="space-y-2 mt-2">
                {prerequisites.map((prerequisite, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={prerequisite}
                      onChange={(e) => updatePrerequisite(index, e.target.value)}
                      placeholder="Required knowledge or skills"
                      data-testid={`input-prerequisite-${index}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removePrerequisite(index)}
                      data-testid={`button-remove-prerequisite-${index}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPrerequisite}
                  data-testid="button-add-prerequisite"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Prerequisite
                </Button>
              </div>
            </div>

            {/* Tags */}
            <div>
              <FormLabel>Tags</FormLabel>
              <div className="space-y-2 mt-2">
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="secondary" 
                      className="cursor-pointer"
                      onClick={() => removeTag(tag)}
                      data-testid={`tag-${tag}`}
                    >
                      {tag} <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="Add tags (press Enter)"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag(e.currentTarget.value);
                      e.currentTarget.value = "";
                    }
                  }}
                  data-testid="input-tags"
                />
              </div>
            </div>

            {/* Enhanced Content Upload */}
            <div className="space-y-6">
              <div>
                <FormLabel className="text-lg font-semibold">Course Content</FormLabel>
                <p className="text-sm text-gray-600 mt-1">
                  Upload learning materials, assignments, and resources. At least one content file is required. Video content is optional.
                </p>
                
                {/* Content Validation Error */}
                {contentValidationError && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-600">{contentValidationError}</p>
                  </div>
                )}

                {/* Drag and Drop Upload Area */}
                <div
                  className={`mt-4 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragging 
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  data-testid="content-upload-area"
                >
                  <input
                    type="file"
                    multiple
                    onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                    className="hidden"
                    id="content-upload"
                    accept=".pdf,.doc,.docx,.txt,.rtf,.md,.ppt,.pptx,.odp,.xls,.xlsx,.csv,.ods,.png,.jpg,.jpeg,.gif,.svg,.webp,.mp3,.wav,.aac,.ogg,.mp4,.mov,.avi,.webm,.mkv,.zip,.rar,.7z,.js,.ts,.html,.css,.json,.xml,.epub,.psd,.ai"
                  />
                  <label htmlFor="content-upload" className="cursor-pointer">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Drop files here or click to upload
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Support for documents, presentations, images, audio, video, and more
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-gray-500 max-w-2xl mx-auto">
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        Documents
                      </div>
                      <div className="flex items-center gap-1">
                        <Presentation className="h-3 w-3" />
                        Presentations
                      </div>
                      <div className="flex items-center gap-1">
                        <Image className="h-3 w-3" />
                        Images
                      </div>
                      <div className="flex items-center gap-1">
                        <Video className="h-3 w-3" />
                        Videos
                      </div>
                      <div className="flex items-center gap-1">
                        <Archive className="h-3 w-3" />
                        Archives
                      </div>
                    </div>
                  </label>
                </div>

                {/* File Type Information */}
                <details className="mt-4">
                  <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                    View supported file types and size limits
                  </summary>
                  <div className="mt-2 p-4 bg-gray-50 rounded-md">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {Object.entries(FILE_TYPE_CONFIG).map(([type, config]) => {
                        const IconComponent = config.icon;
                        return (
                          <div key={type} className="flex items-center gap-2">
                            <IconComponent className={`h-4 w-4 ${config.color}`} />
                            <div>
                              <span className="font-medium capitalize">{type}:</span>
                              <span className="text-gray-600 ml-1">
                                {config.extensions.join(', ')} 
                                (max {Math.round(config.maxSize / (1024 * 1024))}MB)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </details>

                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-4">
                      Uploaded Files ({uploadedFiles.length})
                    </h4>
                    <div className="space-y-3">
                      {uploadedFiles.map((uploadFile, index) => {
                        const config = FILE_TYPE_CONFIG[uploadFile.type];
                        const IconComponent = config.icon;
                        
                        return (
                          <div
                            key={uploadFile.id}
                            className="border border-gray-200 rounded-lg p-4 bg-white"
                            data-testid={`uploaded-file-${index}`}
                          >
                            <div className="flex items-start gap-4">
                              {/* File Icon/Preview */}
                              <div className="flex-shrink-0">
                                {uploadFile.preview ? (
                                  <img
                                    src={uploadFile.preview}
                                    alt={uploadFile.title}
                                    className="h-12 w-12 object-cover rounded border"
                                  />
                                ) : (
                                  <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center">
                                    <IconComponent className={`h-6 w-6 ${config.color}`} />
                                  </div>
                                )}
                              </div>

                              {/* File Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <Input
                                    value={uploadFile.title}
                                    onChange={(e) => updateFileMetadata(uploadFile.id, { title: e.target.value })}
                                    className="text-sm font-medium"
                                    placeholder="File title"
                                  />
                                  <Badge variant="outline" className="text-xs">
                                    {uploadFile.type}
                                  </Badge>
                                </div>
                                
                                <Textarea
                                  value={uploadFile.description}
                                  onChange={(e) => updateFileMetadata(uploadFile.id, { description: e.target.value })}
                                  placeholder="File description (optional)"
                                  className="text-sm mb-2"
                                  rows={2}
                                />

                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span>{(uploadFile.file.size / 1024 / 1024).toFixed(1)} MB</span>
                                  <Select 
                                    value={uploadFile.category} 
                                    onValueChange={(value) => updateFileMetadata(uploadFile.id, { 
                                      category: value as UploadedFile['category'] 
                                    })}
                                  >
                                    <SelectTrigger className="h-7 w-32 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="learning_material">Learning Material</SelectItem>
                                      <SelectItem value="assignment">Assignment</SelectItem>
                                      <SelectItem value="reference">Reference</SelectItem>
                                      <SelectItem value="template">Template</SelectItem>
                                      <SelectItem value="example">Example</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <label className="flex items-center gap-1">
                                    <input
                                      type="checkbox"
                                      checked={uploadFile.isRequired}
                                      onChange={(e) => updateFileMetadata(uploadFile.id, { isRequired: e.target.checked })}
                                      className="h-3 w-3"
                                    />
                                    Required
                                  </label>
                                </div>

                                {/* Upload Progress */}
                                {uploadFile.uploadStatus === 'uploading' && (
                                  <Progress value={uploadFile.uploadProgress} className="mt-2" />
                                )}
                                
                                {uploadFile.uploadError && (
                                  <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {uploadFile.uploadError}
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex-shrink-0 flex gap-2">
                                {uploadFile.preview && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(uploadFile.preview, '_blank')}
                                    data-testid={`button-preview-${index}`}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFile(uploadFile.id)}
                                  data-testid={`button-remove-${index}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Bulk Upload Button */}
                    {uploadedFiles.length > 0 && (
                      <div className="mt-4 flex justify-end">
                        <Button
                          type="button"
                          onClick={() => uploadContentMutation.mutate(uploadedFiles)}
                          disabled={uploadContentMutation.isPending}
                          data-testid="button-upload-content"
                        >
                          {uploadContentMutation.isPending ? "Uploading..." : `Upload ${uploadedFiles.length} File${uploadedFiles.length > 1 ? 's' : ''}`}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createCourseMutation.isPending}
                data-testid="button-save"
              >
                {createCourseMutation.isPending 
                  ? "Saving..." 
                  : course 
                    ? "Update Course" 
                    : "Create Course"
                }
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}