import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Course } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Plus, Edit, Trash2, Search, Star, DollarSign, Users } from "lucide-react";

export default function AdminCoursesPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");

  // Fetch all courses
  const { data: courses, isLoading: isLoadingCourses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
    enabled: user?.role === "admin",
    retry: false,
  });

  // Delete course mutation
  const deleteCourse = useMutation({
    mutationFn: async (courseId: string) => {
      const response = await apiRequest("DELETE", `/api/courses/${courseId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Course Deleted",
        description: "Course has been deleted successfully.",
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
        title: "Error",
        description: "Failed to delete course.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user || user.role !== "admin")) {
      toast({
        title: "Access Denied",
        description: "Admin role required to access this page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/admin";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Filter courses based on search and filters
  const filteredCourses = courses?.filter(course => {
    const matchesSearch = searchTerm === "" || 
      course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = levelFilter === "all" || course.level === levelFilter;
    
    return matchesSearch && matchesLevel;
  }) || [];

  const getLevelColor = (level: string) => {
    switch (level) {
      case "beginner": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "intermediate": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "advanced": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const totalRevenue = courses?.reduce((sum, course) => sum + (course.price || 0), 0) || 0;
  const averagePrice = courses?.length ? totalRevenue / courses.length : 0;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold" data-testid="text-courses-title">
              Course Management
            </h1>
          </div>
          <Button className="flex items-center gap-2" data-testid="button-add-course">
            <Plus className="h-4 w-4" />
            Add Course
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card data-testid="card-total-courses">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Courses</p>
                  <p className="text-2xl font-bold" data-testid="text-total-courses-count">
                    {courses?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-total-revenue">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold" data-testid="text-total-revenue">
                    ${(totalRevenue / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-average-price">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                  <Star className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Average Price</p>
                  <p className="text-2xl font-bold" data-testid="text-average-price">
                    ${(averagePrice / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-beginner-courses">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Beginner Courses</p>
                  <p className="text-2xl font-bold" data-testid="text-beginner-courses-count">
                    {courses?.filter(c => c.level === "beginner").length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search courses by title or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-courses"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="w-40" data-testid="select-level-filter">
                    <SelectValue placeholder="Filter by level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoadingCourses ? (
            <div className="col-span-full p-8 text-center" data-testid="loading-courses">
              <p className="text-muted-foreground">Loading courses...</p>
            </div>
          ) : filteredCourses.length > 0 ? (
            filteredCourses.map((course) => (
              <Card key={course.id} className="overflow-hidden" data-testid={`card-course-${course.id}`}>
                {course.imageUrl && (
                  <div className="aspect-video bg-muted">
                    <img 
                      src={course.imageUrl} 
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg line-clamp-2" data-testid={`text-course-title-${course.id}`}>
                      {course.title}
                    </h3>
                    <Badge className={getLevelColor(course.level)} data-testid={`badge-course-level-${course.id}`}>
                      {course.level}
                    </Badge>
                  </div>
                  
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3" data-testid={`text-course-description-${course.id}`}>
                    {course.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium" data-testid={`text-course-rating-${course.id}`}>
                        {course.rating || 0}/5
                      </span>
                    </div>
                    <div className="text-lg font-semibold" data-testid={`text-course-price-${course.id}`}>
                      ${((course.price || 0) / 100).toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      data-testid={`button-edit-course-${course.id}`}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => deleteCourse.mutate(course.id)}
                      disabled={deleteCourse.isPending}
                      data-testid={`button-delete-course-${course.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full p-8 text-center" data-testid="text-no-courses">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No courses found</h3>
              <p className="text-muted-foreground mb-4">No courses match your current filters</p>
              <Button data-testid="button-create-first-course">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Course
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}