import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import type { Lesson, CourseMaterial } from "@shared/schema";
import { 
  Plus, 
  Upload, 
  Play, 
  Edit, 
  Trash2, 
  GripVertical, 
  Video, 
  FileText,
  Download,
  Eye
} from "lucide-react";

interface LessonManagerProps {
  courseId: string;
}

export default function LessonManager({ courseId }: LessonManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [newLesson, setNewLesson] = useState({
    title: "",
    description: "",
    order: 1
  });

  // Fetch lessons for this course
  const { data: lessons, isLoading } = useQuery<Lesson[]>({
    queryKey: ["/api/courses", courseId, "lessons"],
    queryFn: async () => {
      const response = await fetch(`/api/courses/${courseId}/lessons`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch lessons');
      return response.json();
    },
    enabled: !!courseId
  });

  // Create lesson mutation
  const createLessonMutation = useMutation({
    mutationFn: async (lessonData: any) => {
      const response = await apiRequest("POST", `/api/courses/${courseId}/lessons`, lessonData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "lessons"] });
      setShowAddLesson(false);
      setNewLesson({ title: "", description: "", order: 1 });
      toast({
        title: "Lesson Created",
        description: "New lesson has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create lesson.",
        variant: "destructive",
      });
    },
  });

  // Update lesson mutation
  const updateLessonMutation = useMutation({
    mutationFn: async (lessonData: any) => {
      const response = await apiRequest("PUT", `/api/lessons/${lessonData.id}`, lessonData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "lessons"] });
      setEditingLesson(null);
      toast({
        title: "Lesson Updated",
        description: "Lesson has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update lesson.",
        variant: "destructive",
      });
    },
  });

  // Delete lesson mutation
  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const response = await apiRequest("DELETE", `/api/lessons/${lessonId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "lessons"] });
      toast({
        title: "Lesson Deleted",
        description: "Lesson has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete lesson.",
        variant: "destructive",
      });
    },
  });

  // Video upload mutation
  const uploadVideoMutation = useMutation({
    mutationFn: async ({ lessonId, file }: { lessonId: string; file: File }) => {
      const formData = new FormData();
      formData.append('video', file);
      
      const response = await apiRequest("POST", `/api/lessons/${lessonId}/video`, formData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "lessons"] });
      toast({
        title: "Video Uploaded",
        description: "Video has been uploaded successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload video.",
        variant: "destructive",
      });
    },
  });

  const handleCreateLesson = () => {
    createLessonMutation.mutate({
      ...newLesson,
      courseId,
      order: lessons ? lessons.length + 1 : 1
    });
  };

  const handleUpdateLesson = () => {
    if (editingLesson) {
      updateLessonMutation.mutate(editingLesson);
    }
  };

  const handleVideoUpload = (lessonId: string, file: File) => {
    uploadVideoMutation.mutate({ lessonId, file });
  };

  const getUploadStatus = (lesson: Lesson) => {
    switch (lesson.uploadStatus) {
      case 'completed':
        return { color: 'bg-green-100 text-green-800', text: 'Ready' };
      case 'processing':
        return { color: 'bg-yellow-100 text-yellow-800', text: 'Processing' };
      case 'failed':
        return { color: 'bg-red-100 text-red-800', text: 'Failed' };
      default:
        return { color: 'bg-gray-100 text-gray-800', text: 'No Video' };
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="lesson-manager">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Lesson Management</h2>
        <Button 
          onClick={() => setShowAddLesson(true)}
          data-testid="button-add-lesson"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Lesson
        </Button>
      </div>

      {/* Add New Lesson Form */}
      {showAddLesson && (
        <Card data-testid="add-lesson-form">
          <CardHeader>
            <CardTitle>Add New Lesson</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                placeholder="Lesson title"
                value={newLesson.title}
                onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                data-testid="input-new-lesson-title"
              />
              <Textarea
                placeholder="Lesson description"
                value={newLesson.description}
                onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })}
                data-testid="textarea-new-lesson-description"
              />
              <div className="flex gap-2">
                <Button 
                  onClick={handleCreateLesson}
                  disabled={!newLesson.title || createLessonMutation.isPending}
                  data-testid="button-create-lesson"
                >
                  {createLessonMutation.isPending ? "Creating..." : "Create Lesson"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddLesson(false)}
                  data-testid="button-cancel-add-lesson"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lessons List */}
      <div className="space-y-4">
        {lessons?.map((lesson, index) => (
          <Card key={lesson.id} data-testid={`lesson-card-${lesson.id}`}>
            <CardContent className="p-6">
              {editingLesson?.id === lesson.id ? (
                // Edit Mode
                <div className="space-y-4">
                  <Input
                    value={editingLesson.title}
                    onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                    data-testid={`input-edit-title-${lesson.id}`}
                  />
                  <Textarea
                    value={editingLesson.description || ""}
                    onChange={(e) => setEditingLesson({ ...editingLesson, description: e.target.value })}
                    data-testid={`textarea-edit-description-${lesson.id}`}
                  />
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleUpdateLesson}
                      disabled={updateLessonMutation.isPending}
                      data-testid={`button-save-lesson-${lesson.id}`}
                    >
                      {updateLessonMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setEditingLesson(null)}
                      data-testid={`button-cancel-edit-${lesson.id}`}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" data-testid={`lesson-order-${lesson.id}`}>
                          Lesson {lesson.order}
                        </Badge>
                        {lesson.videoUrl && (
                          <Video className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      <h3 className="font-semibold text-lg" data-testid={`lesson-title-${lesson.id}`}>
                        {lesson.title}
                      </h3>
                      <Badge 
                        className={getUploadStatus(lesson).color}
                        data-testid={`upload-status-${lesson.id}`}
                      >
                        {getUploadStatus(lesson).text}
                      </Badge>
                    </div>
                    
                    {lesson.description && (
                      <p className="text-muted-foreground mb-3" data-testid={`lesson-description-${lesson.id}`}>
                        {lesson.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {lesson.duration && (
                        <span data-testid={`lesson-duration-${lesson.id}`}>
                          Duration: {formatDuration(lesson.duration)}
                        </span>
                      )}
                      {lesson.videoMetadata && (
                        <span data-testid={`video-metadata-${lesson.id}`}>
                          Size: {((lesson.videoMetadata as any)?.fileSize / 1024 / 1024).toFixed(1)} MB
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {lesson.videoUrl && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(lesson.videoUrl, '_blank')}
                        data-testid={`button-preview-video-${lesson.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <div className="relative">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleVideoUpload(lesson.id, file);
                          }
                        }}
                        className="hidden"
                        id={`video-upload-${lesson.id}`}
                      />
                      <label htmlFor={`video-upload-${lesson.id}`}>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          asChild
                          data-testid={`button-upload-video-${lesson.id}`}
                        >
                          <span className="cursor-pointer">
                            <Upload className="h-4 w-4" />
                          </span>
                        </Button>
                      </label>
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditingLesson(lesson)}
                      data-testid={`button-edit-lesson-${lesson.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this lesson?')) {
                          deleteLessonMutation.mutate(lesson.id);
                        }
                      }}
                      disabled={deleteLessonMutation.isPending}
                      data-testid={`button-delete-lesson-${lesson.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )) || (
          <Card>
            <CardContent className="p-8 text-center">
              <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No lessons yet</h3>
              <p className="text-muted-foreground mb-4">
                Start building your course by adding your first lesson.
              </p>
              <Button onClick={() => setShowAddLesson(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Lesson
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upload Progress */}
      {uploadVideoMutation.isPending && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span>Uploading video...</span>
            </div>
            <Progress value={50} className="mt-2" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}