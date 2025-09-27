import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Course } from "@shared/schema";
import { Upload, X, Plus } from "lucide-react";

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
});

type CourseFormData = z.infer<typeof courseFormSchema>;

interface AdminCourseFormProps {
  course?: Course;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AdminCourseForm({ course, onSuccess, onCancel }: AdminCourseFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [previewVideoFile, setPreviewVideoFile] = useState<File | null>(null);
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

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('courseId', course?.id || 'new-course');
      
      const response = await apiRequest("POST", "/api/materials", formData);
      return response.json();
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload image.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (data: CourseFormData) => {
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

            {/* Media Upload */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <FormLabel>Course Thumbnail</FormLabel>
                <div className="mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="thumbnail-upload"
                  />
                  <label
                    htmlFor="thumbnail-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                    data-testid="thumbnail-upload-area"
                  >
                    <Upload className="h-8 w-8 text-gray-400" />
                    <p className="text-sm text-gray-500">
                      {thumbnailFile ? thumbnailFile.name : "Click to upload thumbnail"}
                    </p>
                  </label>
                </div>
              </div>

              <div>
                <FormLabel>Preview Video (Optional)</FormLabel>
                <div className="mt-2">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setPreviewVideoFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="preview-video-upload"
                  />
                  <label
                    htmlFor="preview-video-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                    data-testid="preview-video-upload-area"
                  >
                    <Upload className="h-8 w-8 text-gray-400" />
                    <p className="text-sm text-gray-500">
                      {previewVideoFile ? previewVideoFile.name : "Click to upload preview video"}
                    </p>
                  </label>
                </div>
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