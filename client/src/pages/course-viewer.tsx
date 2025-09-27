import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VideoPlayer from "@/components/courses/video-player";
import type { Course, Lesson, CourseEnrollment, UserProgress } from "@shared/schema";
import { 
  BookOpen, 
  Clock, 
  User, 
  DollarSign, 
  CheckCircle,
  PlayCircle,
  Lock,
  ArrowLeft,
  ArrowRight,
  Star,
  Target,
  Users,
  FileText,
  Award,
  Globe,
  Heart,
  Download
} from "lucide-react";

export default function CourseViewer() {
  const { user } = useAuth();
  const [, params] = useRoute("/courses/:courseId");
  const [, setLocation] = useLocation();
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  
  const courseId = params?.courseId;

  // Fetch course details
  const { data: course, isLoading: courseLoading } = useQuery<Course>({
    queryKey: ["/api/courses", courseId],
    enabled: !!courseId
  });

  // Fetch related courses
  const { data: relatedCourses } = useQuery<Course[]>({
    queryKey: ["/api/courses/category", course?.category],
    enabled: !!course?.category
  });

  // Fetch course lessons
  const { data: lessons, isLoading: lessonsLoading } = useQuery<Lesson[]>({
    queryKey: ["/api/courses", courseId, "lessons"],
    enabled: !!courseId
  });

  // Fetch user enrollment
  const { data: enrollment } = useQuery<CourseEnrollment>({
    queryKey: ["/api/user/courses", courseId, "enrollment"],
    enabled: !!courseId && !!user
  });

  // Fetch user progress
  const { data: userProgress } = useQuery<UserProgress[]>({
    queryKey: ["/api/user/progress", courseId],
    enabled: !!courseId && !!user && !!enrollment
  });

  const currentLesson = lessons?.[currentLessonIndex];
  const isEnrolled = !!enrollment;
  const sortedLessons = lessons?.sort((a, b) => a.order - b.order) || [];

  // Auto-advance to first incomplete lesson
  useEffect(() => {
    if (lessons && userProgress && currentLessonIndex === 0) {
      const firstIncompleteIndex = lessons.findIndex(lesson => {
        const progress = userProgress.find(p => p.lessonId === lesson.id);
        return !progress?.completed;
      });
      if (firstIncompleteIndex > 0) {
        setCurrentLessonIndex(firstIncompleteIndex);
      }
    }
  }, [lessons, userProgress, currentLessonIndex]);

  const getLessonProgress = (lessonId: string) => {
    return userProgress?.find(p => p.lessonId === lessonId);
  };

  const getOverallProgress = () => {
    if (!lessons || !userProgress) return 0;
    const completedLessons = lessons.filter(lesson => {
      const progress = getLessonProgress(lesson.id);
      return progress?.completed;
    });
    return Math.round((completedLessons.length / lessons.length) * 100);
  };

  const canAccessLesson = (lessonIndex: number) => {
    if (!isEnrolled) return false;
    if (lessonIndex === 0) return true; // First lesson always accessible
    
    // Check if previous lesson is completed
    const previousLesson = sortedLessons[lessonIndex - 1];
    if (previousLesson) {
      const progress = getLessonProgress(previousLesson.id);
      return !!progress?.completed;
    }
    return false;
  };

  const formatPrice = (priceInCents: number) => {
    return (priceInCents / 100).toFixed(2);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  if (courseLoading || lessonsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Course Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The course you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => setLocation("/courses")}>
              Browse Courses
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="course-viewer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" data-testid="breadcrumb-home">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/courses" data-testid="breadcrumb-courses">Courses</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage data-testid="breadcrumb-current">{course?.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Course Header */}
        <div className="mb-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h1 className="text-3xl font-bold mb-4" data-testid="course-title">
                {course.title}
              </h1>
              <p className="text-muted-foreground text-lg mb-6" data-testid="course-description">
                {course.description}
              </p>
              
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span data-testid="course-instructor">{course.instructor}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span data-testid="course-duration">
                    {course.estimatedCompletionHours}h estimated
                  </span>
                </div>
                
                <Badge 
                  variant={course.level === 'beginner' ? 'default' : course.level === 'intermediate' ? 'secondary' : 'destructive'}
                  data-testid="course-level"
                >
                  {course.level}
                </Badge>
                
                <Badge variant="outline" data-testid="course-category">
                  {course.category}
                </Badge>
              </div>

              {isEnrolled && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Course Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {getOverallProgress()}%
                    </span>
                  </div>
                  <Progress 
                    value={getOverallProgress()} 
                    className="w-full"
                    data-testid="course-progress"
                  />
                </div>
              )}
              
              {/* Course Stats */}
              <div className="flex flex-wrap items-center gap-6 mb-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>{(course.rating || 0) / 10} rating</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{course.totalLessons || 0} lessons</span>
                </div>
                <div className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  <span>Online</span>
                </div>
                <div className="flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  <span>Certificate</span>
                </div>
              </div>
            </div>

            <div>
              <Card>
                <CardContent className="p-6">
                  {!isEnrolled ? (
                    <>
                      <div className="text-center mb-6">
                        <div className="text-3xl font-bold mb-2" data-testid="course-price">
                          ${formatPrice(course.price)}
                        </div>
                        <p className="text-sm text-muted-foreground">One-time payment</p>
                      </div>
                      
                      <Button 
                        className="w-full mb-4" 
                        size="lg"
                        data-testid="enroll-button"
                        onClick={() => {
                          // TODO: Integrate with Stripe payment
                          console.log('Enroll in course:', courseId);
                        }}
                      >
                        Enroll Now
                      </Button>
                      
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Heart className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <FileText className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                      </div>
                      
                      <div className="text-xs text-muted-foreground text-center">
                        30-day money-back guarantee
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">You're Enrolled!</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Continue your learning journey
                      </p>
                      {enrollment.completed && (
                        <Badge className="bg-green-100 text-green-800">
                          Course Completed
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Course Details Tabs */}
        <div className="mb-8">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
              <TabsTrigger value="instructor">Instructor</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Learning Objectives
                    </h3>
                    {course.learningObjectives && course.learningObjectives.length > 0 ? (
                      <ul className="space-y-2">
                        {course.learningObjectives.map((objective, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{objective}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground text-sm">No learning objectives specified.</p>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Prerequisites
                    </h3>
                    {course.prerequisites && course.prerequisites.length > 0 ? (
                      <ul className="space-y-2">
                        {course.prerequisites.map((prereq, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                            <span className="text-sm">{prereq}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground text-sm">No prerequisites required.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="curriculum" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Course Curriculum</h3>
                  <div className="text-muted-foreground">
                    Curriculum content will be displayed here based on lessons data.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="instructor" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarFallback>{course.instructor?.[0] || 'I'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{course.instructor}</h3>
                      <p className="text-muted-foreground mb-4">Expert Instructor</p>
                      <p className="text-sm">
                        Experienced professional with extensive knowledge in {course.category}.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Student Reviews</h3>
                  <div className="text-muted-foreground">
                    Student reviews and ratings will be displayed here.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Video Player / Content Area */}
          <div className="lg:col-span-3">
            {isEnrolled && currentLesson ? (
              <VideoPlayer
                lesson={currentLesson}
                courseId={courseId!}
                userId={user?.id!}
                onLessonComplete={() => {
                  // Auto-advance to next lesson
                  if (currentLessonIndex < sortedLessons.length - 1) {
                    setCurrentLessonIndex(currentLessonIndex + 1);
                  }
                }}
                onProgress={(progress) => {
                  // Handle progress updates if needed
                }}
              />
            ) : !isEnrolled ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Course Locked</h3>
                  <p className="text-muted-foreground mb-6">
                    Enroll in this course to access all lessons and materials.
                  </p>
                  <Button size="lg" data-testid="enroll-to-watch">
                    Enroll to Watch
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Lessons Available</h3>
                  <p className="text-muted-foreground">
                    This course doesn't have any lessons yet. Check back later!
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Lesson Navigation */}
            {isEnrolled && sortedLessons.length > 1 && (
              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  disabled={currentLessonIndex === 0}
                  onClick={() => setCurrentLessonIndex(Math.max(0, currentLessonIndex - 1))}
                  data-testid="prev-lesson"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous Lesson
                </Button>
                
                <Button
                  variant="outline"
                  disabled={currentLessonIndex === sortedLessons.length - 1}
                  onClick={() => setCurrentLessonIndex(Math.min(sortedLessons.length - 1, currentLessonIndex + 1))}
                  data-testid="next-lesson"
                >
                  Next Lesson
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </div>

          {/* Lesson Sidebar */}
          <div>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4" data-testid="curriculum-title">
                  Course Curriculum
                </h3>
                
                <div className="space-y-2">
                  {sortedLessons.map((lesson, index) => {
                    const progress = getLessonProgress(lesson.id);
                    const canAccess = canAccessLesson(index);
                    const isCurrent = index === currentLessonIndex;
                    
                    return (
                      <div
                        key={lesson.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          isCurrent 
                            ? 'border-primary bg-primary/5' 
                            : canAccess 
                              ? 'border-border hover:bg-secondary/50' 
                              : 'border-border bg-secondary/20'
                        }`}
                        onClick={() => canAccess && setCurrentLessonIndex(index)}
                        data-testid={`lesson-item-${lesson.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {progress?.completed ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : canAccess ? (
                              <PlayCircle className="h-4 w-4 text-primary" />
                            ) : (
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium mb-1" data-testid={`lesson-title-${lesson.id}`}>
                              {lesson.title}
                            </div>
                            
                            {lesson.duration && (
                              <div className="text-xs text-muted-foreground mb-2">
                                {formatDuration(lesson.duration)}
                              </div>
                            )}
                            
                            {progress && progress.progressPercentage > 0 && (
                              <Progress 
                                value={progress.progressPercentage} 
                                className="h-1"
                                data-testid={`lesson-progress-${lesson.id}`}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {sortedLessons.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No lessons available yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Related Courses */}
        {relatedCourses && relatedCourses.length > 1 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Related Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedCourses
                .filter(relatedCourse => relatedCourse.id !== courseId)
                .slice(0, 3)
                .map(relatedCourse => (
                  <Card key={relatedCourse.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => setLocation(`/courses/${relatedCourse.id}`)}>
                    <img 
                      src={relatedCourse.thumbnailUrl || relatedCourse.imageUrl || ""} 
                      alt={relatedCourse.title}
                      className="w-full h-32 object-cover"
                    />
                    <CardContent className="p-4">
                      <Badge className="mb-2" variant="outline">{relatedCourse.level}</Badge>
                      <h3 className="font-semibold mb-2 line-clamp-2">{relatedCourse.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {relatedCourse.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">${formatPrice(relatedCourse.price)}</span>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Star className="h-3 w-3 text-yellow-500" />
                          {(relatedCourse.rating || 0) / 10}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}