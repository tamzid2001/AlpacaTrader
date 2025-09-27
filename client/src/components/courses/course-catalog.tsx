import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import CourseCard from "./course-card";
import type { Course, CourseEnrollment } from "@shared/schema";
import { Search, Filter, BookOpen, Clock, DollarSign, Star } from "lucide-react";

interface CourseCatalogProps {
  userId?: string;
  showEnrolledOnly?: boolean;
}

export default function CourseCatalog({ userId, showEnrolledOnly = false }: CourseCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Fetch all published courses
  const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses/published"],
    queryFn: async () => {
      const response = await fetch("/api/courses/published", {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch courses');
      return response.json();
    }
  });

  // Fetch user enrollments if user is provided
  const { data: enrollments } = useQuery<(CourseEnrollment & { course: Course })[]>({
    queryKey: ["/api/user/courses"],
    queryFn: async () => {
      const response = await fetch("/api/user/courses", {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch enrollments');
      return response.json();
    },
    enabled: !!userId
  });

  // Filter and sort courses
  const filteredCourses = courses?.filter(course => {
    // Search filter
    const matchesSearch = searchQuery === "" || 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor?.toLowerCase().includes(searchQuery.toLowerCase());

    // Category filter
    const matchesCategory = selectedCategory === "all" || course.category === selectedCategory;

    // Level filter
    const matchesLevel = selectedLevel === "all" || course.level === selectedLevel;

    // Enrollment filter
    if (showEnrolledOnly && userId) {
      const isEnrolled = enrollments?.some(enrollment => enrollment.courseId === course.id);
      return matchesSearch && matchesCategory && matchesLevel && isEnrolled;
    }

    return matchesSearch && matchesCategory && matchesLevel;
  }).sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "price-low":
        return (a.price || 0) - (b.price || 0);
      case "price-high":
        return (b.price || 0) - (a.price || 0);
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      case "alphabetical":
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  const getEnrollmentForCourse = (courseId: string) => {
    return enrollments?.find(enrollment => enrollment.courseId === courseId);
  };

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "finance", label: "Finance" },
    { value: "trading", label: "Trading" },
    { value: "machine-learning", label: "Machine Learning" },
    { value: "data-analysis", label: "Data Analysis" },
    { value: "risk-management", label: "Risk Management" },
    { value: "portfolio-management", label: "Portfolio Management" }
  ];

  const levels = [
    { value: "all", label: "All Levels" },
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" }
  ];

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "rating", label: "Highest Rated" },
    { value: "alphabetical", label: "Alphabetical" }
  ];

  if (coursesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="course-catalog">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="catalog-title">
          {showEnrolledOnly ? "My Courses" : "Course Catalog"}
        </h1>
        <p className="text-muted-foreground" data-testid="catalog-subtitle">
          {showEnrolledOnly 
            ? "Continue your learning journey" 
            : "Discover comprehensive finance and trading courses"
          }
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="search-input"
                />
              </div>
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger data-testid="category-filter">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Level Filter */}
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger data-testid="level-filter">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map(level => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger data-testid="sort-filter">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted-foreground" data-testid="results-count">
          {filteredCourses?.length || 0} course{filteredCourses?.length !== 1 ? 's' : ''} found
        </p>
        {!showEnrolledOnly && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>{courses?.length || 0} total courses</span>
            </div>
          </div>
        )}
      </div>

      {/* Course Grid */}
      {filteredCourses && filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="courses-grid">
          {filteredCourses.map(course => {
            const enrollment = getEnrollmentForCourse(course.id);
            return (
              <CourseCard
                key={course.id}
                course={course}
                showProgress={!!enrollment}
                progress={enrollment?.progress}
                onEnroll={(courseId) => {
                  // Handle enrollment - could open payment modal or navigate to enrollment page
                  window.location.href = `/courses/${courseId}`;
                }}
              />
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center" data-testid="no-courses">
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {showEnrolledOnly ? "No enrolled courses" : "No courses found"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {showEnrolledOnly 
              ? "You haven't enrolled in any courses yet. Browse our catalog to get started!"
              : "Try adjusting your search criteria or check back later for new courses."
            }
          </p>
          {showEnrolledOnly && (
            <Link href="/courses">
              <Button>Browse Course Catalog</Button>
            </Link>
          )}
        </Card>
      )}

      {/* Course Statistics (for non-enrolled view) */}
      {!showEnrolledOnly && courses && courses.length > 0 && (
        <Card className="mt-12">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Course Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{courses.length}</div>
                <div className="text-sm text-muted-foreground">Total Courses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {new Set(courses.map(c => c.category)).size}
                </div>
                <div className="text-sm text-muted-foreground">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {new Set(courses.map(c => c.instructor)).size}
                </div>
                <div className="text-sm text-muted-foreground">Instructors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {Math.round(courses.reduce((sum, c) => sum + (c.estimatedCompletionHours || 0), 0))}h
                </div>
                <div className="text-sm text-muted-foreground">Total Content</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}