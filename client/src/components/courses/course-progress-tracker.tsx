import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Course, Lesson, Quiz, QuizAttempt, UserProgress } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import QuizTaker from "./quiz-taker";
import QuizResults from "./quiz-results";
import { 
  BookOpen,
  Clock,
  Target,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
  Trophy,
  Lock,
  Unlock,
  Star,
  FileText,
  Award,
  BarChart3,
  TrendingUp
} from "lucide-react";

interface CourseProgressTrackerProps {
  courseId: string;
  currentLessonId?: string;
  onLessonComplete?: (lessonId: string) => void;
  onQuizComplete?: (quizId: string, result: any) => void;
}

interface LessonProgress {
  lessonId: string;
  completed: boolean;
  quizzes: QuizProgress[];
  canAccess: boolean;
  completedAt?: Date;
}

interface QuizProgress {
  quiz: Quiz;
  attempts: QuizAttempt[];
  bestAttempt?: QuizAttempt;
  isRequired: boolean;
  isCompleted: boolean;
  canAttempt: boolean;
  nextAttemptAllowed: boolean;
}

interface CourseCompletionStatus {
  totalLessons: number;
  completedLessons: number;
  totalQuizzes: number;
  completedQuizzes: number;
  requiredQuizzes: number;
  completedRequiredQuizzes: number;
  overallProgress: number;
  canComplete: boolean;
  certificateEarned: boolean;
}

export default function CourseProgressTracker({ 
  courseId, 
  currentLessonId, 
  onLessonComplete, 
  onQuizComplete 
}: CourseProgressTrackerProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [showQuizDialog, setShowQuizDialog] = useState(false);
  const [quizResults, setQuizResults] = useState<any>(null);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [showStartQuizDialog, setShowStartQuizDialog] = useState(false);

  // Fetch course data
  const { data: course } = useQuery<Course>({
    queryKey: ["/api/courses", courseId],
    enabled: !!courseId
  });

  // Fetch lessons
  const { data: lessons } = useQuery<Lesson[]>({
    queryKey: ["/api/courses", courseId, "lessons"],
    enabled: !!courseId
  });

  // Fetch course quizzes
  const { data: courseQuizzes } = useQuery<Quiz[]>({
    queryKey: ["/api/courses", courseId, "quizzes"],
    enabled: !!courseId
  });

  // Fetch user progress
  const { data: userProgress } = useQuery<UserProgress[]>({
    queryKey: ["/api/users", user?.id, "courses", courseId, "quiz-progress"],
    enabled: !!courseId && !!user?.id && isAuthenticated
  });

  // Fetch user quiz attempts
  const { data: userAttempts } = useQuery<QuizAttempt[]>({
    queryKey: ["/api/users", user?.id, "quiz-attempts"],
    enabled: !!user?.id && isAuthenticated,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${user?.id}/quiz-attempts`);
      return response.json();
    }
  });

  // Fetch enrollment data for automatic completion logic
  const { data: enrollments } = useQuery({
    queryKey: ["/api/users", user?.id, "enrollments"],
    enabled: !!user?.id && isAuthenticated,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${user?.id}/enrollments`);
      return response.json();
    }
  });

  // Get current enrollment for this course
  const enrollment = enrollments?.find((e: any) => e.courseId === courseId);

  // Mark lesson complete mutation
  const markLessonCompleteMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const response = await apiRequest("POST", `/api/lessons/${lessonId}/complete`, {
        userId: user?.id,
        courseId
      });
      return response.json();
    },
    onSuccess: (data, lessonId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "courses", courseId, "quiz-progress"] });
      onLessonComplete?.(lessonId);
      toast({
        title: "Lesson Completed",
        description: "Great job! You've completed this lesson."
      });
    }
  });

  // Complete course mutation
  const completeCourseAndGenerateCertificateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/courses/${courseId}/complete`, {});
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "certificates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "learning-stats"] });
      
      toast({
        title: "🎉 Course Completed!",
        description: "Congratulations! You've completed this course. Certificate generated!"
      });
    },
    onError: (error: any) => {
      console.error('Failed to complete course:', error);
      toast({
        title: "Course Completion Failed",
        description: "Failed to mark course as complete. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Calculate lesson progress
  const calculateLessonProgress = (): LessonProgress[] => {
    if (!lessons || !courseQuizzes || !userAttempts) return [];

    return lessons.map((lesson, index) => {
      // Get lesson quizzes
      const lessonQuizzes = courseQuizzes.filter(quiz => quiz.lessonId === lesson.id);
      
      const quizzes: QuizProgress[] = lessonQuizzes.map(quiz => {
        const attempts = userAttempts.filter(attempt => attempt.quizId === quiz.id);
        const bestAttempt = attempts
          .filter(attempt => attempt.status === 'completed')
          .sort((a, b) => (b.score || 0) - (a.score || 0))[0];
        
        const isCompleted = bestAttempt?.passed || false;
        const canAttempt = !quiz.maxAttempts || attempts.length < quiz.maxAttempts;
        
        return {
          quiz,
          attempts,
          bestAttempt,
          isRequired: quiz.isRequired || false,
          isCompleted,
          canAttempt,
          nextAttemptAllowed: canAttempt
        };
      });

      // Check if lesson requirements are met
      const requiredQuizzes = quizzes.filter(q => q.isRequired);
      const completedRequiredQuizzes = requiredQuizzes.filter(q => q.isCompleted);
      
      const lessonCompleted = 
        requiredQuizzes.length === 0 || 
        completedRequiredQuizzes.length === requiredQuizzes.length;

      // Check if lesson can be accessed (previous lesson completed)
      const canAccess = index === 0 || (index > 0 && calculateLessonProgress()[index - 1]?.completed);

      return {
        lessonId: lesson.id,
        completed: lessonCompleted,
        quizzes,
        canAccess,
        completedAt: lessonCompleted ? new Date() : undefined
      };
    });
  };

  // Calculate course completion status
  const calculateCourseCompletion = (): CourseCompletionStatus => {
    const lessonProgress = calculateLessonProgress();
    const totalLessons = lessons?.length || 0;
    const completedLessons = lessonProgress.filter(lp => lp.completed).length;
    
    const allQuizzes = lessonProgress.flatMap(lp => lp.quizzes);
    const totalQuizzes = allQuizzes.length;
    const completedQuizzes = allQuizzes.filter(q => q.isCompleted).length;
    const requiredQuizzes = allQuizzes.filter(q => q.isRequired).length;
    const completedRequiredQuizzes = allQuizzes.filter(q => q.isRequired && q.isCompleted).length;
    
    const overallProgress = totalLessons > 0 ? 
      Math.round(((completedLessons / totalLessons) * 70 + (completedQuizzes / Math.max(totalQuizzes, 1)) * 30)) : 0;
    
    const canComplete = completedLessons === totalLessons && completedRequiredQuizzes === requiredQuizzes;
    
    return {
      totalLessons,
      completedLessons,
      totalQuizzes,
      completedQuizzes,
      requiredQuizzes,
      completedRequiredQuizzes,
      overallProgress,
      canComplete,
      certificateEarned: false // This would be determined by checking for certificates
    };
  };

  // Handle quiz start
  const handleStartQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setShowStartQuizDialog(true);
  };

  const confirmStartQuiz = () => {
    setShowStartQuizDialog(false);
    setShowQuizDialog(true);
  };

  // Handle quiz completion
  const handleQuizComplete = (result: any) => {
    setShowQuizDialog(false);
    setQuizResults(result);
    setShowResultsDialog(true);
    
    // Invalidate queries to refresh progress
    queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "quiz-attempts"] });
    queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "courses", courseId, "quiz-progress"] });
    
    onQuizComplete?.(selectedQuiz?.id || "", result);
    
    if (result.passed) {
      toast({
        title: "Quiz Passed! 🎉",
        description: `Congratulations! You scored ${result.score?.toFixed(1)}%`
      });
    } else {
      toast({
        title: "Quiz Not Passed",
        description: `You scored ${result.score?.toFixed(1)}%. You can retake this quiz.`,
        variant: "destructive"
      });
    }
  };

  // Handle quiz abandon
  const handleQuizAbandon = () => {
    setShowQuizDialog(false);
    setSelectedQuiz(null);
    queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "quiz-attempts"] });
  };

  const lessonProgress = calculateLessonProgress();
  const courseCompletion = calculateCourseCompletion();

  // Automatic course completion check
  useEffect(() => {
    if (courseCompletion.canComplete && enrollment && !enrollment.completed) {
      // All requirements met and course not yet completed - trigger automatic completion
      console.log('🎯 Course completion criteria met, triggering automatic completion...');
      completeCourseAndGenerateCertificateMutation.mutate();
    }
  }, [courseCompletion.canComplete, enrollment?.completed]);

  // Check for course completion whenever progress changes
  useEffect(() => {
    if (courseCompletion.canComplete && enrollment && !enrollment.completed) {
      const allLessonsComplete = courseCompletion.completedLessons === courseCompletion.totalLessons;
      const allRequiredQuizzesComplete = courseCompletion.completedRequiredQuizzes === courseCompletion.requiredQuizzes;
      
      if (allLessonsComplete && allRequiredQuizzesComplete) {
        console.log('🚀 Auto-completing course:', {
          courseId,
          completedLessons: courseCompletion.completedLessons,
          totalLessons: courseCompletion.totalLessons,
          completedRequiredQuizzes: courseCompletion.completedRequiredQuizzes,
          requiredQuizzes: courseCompletion.requiredQuizzes
        });
        
        // Trigger course completion
        completeCourseAndGenerateCertificateMutation.mutate();
      }
    }
  }, [lessonProgress, userAttempts]);

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Sign In Required</h3>
          <p className="text-muted-foreground">Please sign in to track your progress.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Course Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Course Progress
            </CardTitle>
            <Badge variant={courseCompletion.canComplete ? "default" : "secondary"}>
              {courseCompletion.overallProgress}% Complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={courseCompletion.overallProgress} className="h-3" />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{courseCompletion.completedLessons}</div>
              <div className="text-muted-foreground">of {courseCompletion.totalLessons} lessons</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{courseCompletion.completedQuizzes}</div>
              <div className="text-muted-foreground">of {courseCompletion.totalQuizzes} quizzes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{courseCompletion.completedRequiredQuizzes}</div>
              <div className="text-muted-foreground">of {courseCompletion.requiredQuizzes} required</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center">
                {courseCompletion.canComplete ? (
                  <Trophy className="h-8 w-8 text-yellow-500" />
                ) : (
                  <Target className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="text-muted-foreground">
                {courseCompletion.canComplete ? "Ready to complete!" : "In progress"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lesson Progress */}
      <div className="space-y-4">
        {lessons?.map((lesson, lessonIndex) => {
          const progress = lessonProgress[lessonIndex];
          if (!progress) return null;

          return (
            <Card 
              key={lesson.id} 
              className={`${
                lesson.id === currentLessonId ? 'border-primary bg-primary/5' : ''
              } ${
                !progress.canAccess ? 'opacity-60' : ''
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {progress.completed ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : progress.canAccess ? (
                      <PlayCircle className="h-6 w-6 text-blue-600" />
                    ) : (
                      <Lock className="h-6 w-6 text-muted-foreground" />
                    )}
                    <div>
                      <CardTitle className="text-lg">
                        Lesson {lessonIndex + 1}: {lesson.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {lesson.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {progress.completed && (
                      <Badge variant="default">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                    {!progress.canAccess && (
                      <Badge variant="secondary">
                        <Lock className="h-3 w-3 mr-1" />
                        Locked
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Lesson Quizzes */}
              {progress.quizzes.length > 0 && (
                <CardContent className="pt-0">
                  <Separator className="mb-4" />
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Lesson Quizzes ({progress.quizzes.length})
                    </h4>
                    
                    <div className="grid gap-3">
                      {progress.quizzes.map(quizProgress => {
                        const { quiz, bestAttempt, isCompleted, canAttempt, isRequired } = quizProgress;
                        
                        return (
                          <div 
                            key={quiz.id}
                            className={`p-4 border rounded-lg ${
                              isCompleted ? 'border-green-500 bg-green-50 dark:bg-green-950/30' : 
                              isRequired ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30' : 
                              'border-muted'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h5 className="font-medium">{quiz.title}</h5>
                                  {isRequired && (
                                    <Badge variant="outline" className="text-orange-600">
                                      Required
                                    </Badge>
                                  )}
                                  {isCompleted && (
                                    <Badge variant="default" className="text-green-600">
                                      <Trophy className="h-3 w-3 mr-1" />
                                      Passed
                                    </Badge>
                                  )}
                                </div>
                                
                                <p className="text-sm text-muted-foreground mb-2">
                                  {quiz.description}
                                </p>
                                
                                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                  <div className="flex items-center space-x-1">
                                    <FileText className="h-3 w-3" />
                                    <span>{quiz.questions?.length || 0} questions</span>
                                  </div>
                                  {quiz.timeLimit && (
                                    <div className="flex items-center space-x-1">
                                      <Clock className="h-3 w-3" />
                                      <span>{quiz.timeLimit} minutes</span>
                                    </div>
                                  )}
                                  <div className="flex items-center space-x-1">
                                    <Target className="h-3 w-3" />
                                    <span>{quiz.passingScore}% to pass</span>
                                  </div>
                                  {quiz.maxAttempts && (
                                    <div className="flex items-center space-x-1">
                                      <Star className="h-3 w-3" />
                                      <span>{quizProgress.attempts.length}/{quiz.maxAttempts} attempts</span>
                                    </div>
                                  )}
                                </div>

                                {bestAttempt && (
                                  <div className="mt-2 text-sm">
                                    <span className="text-muted-foreground">Best Score: </span>
                                    <span className={`font-medium ${
                                      bestAttempt.passed ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {bestAttempt.score?.toFixed(1)}%
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex flex-col space-y-2">
                                {isCompleted ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      if (bestAttempt) {
                                        setQuizResults({ attempt: bestAttempt });
                                        setShowResultsDialog(true);
                                      }
                                    }}
                                    data-testid={`button-view-quiz-results-${quiz.id}`}
                                  >
                                    <Award className="h-3 w-3 mr-1" />
                                    View Results
                                  </Button>
                                ) : progress.canAccess && canAttempt ? (
                                  <Button
                                    size="sm"
                                    onClick={() => handleStartQuiz(quiz)}
                                    data-testid={`button-start-quiz-${quiz.id}`}
                                  >
                                    <PlayCircle className="h-3 w-3 mr-1" />
                                    {quizProgress.attempts.length > 0 ? 'Retake Quiz' : 'Start Quiz'}
                                  </Button>
                                ) : !progress.canAccess ? (
                                  <Button size="sm" disabled>
                                    <Lock className="h-3 w-3 mr-1" />
                                    Locked
                                  </Button>
                                ) : (
                                  <Button size="sm" disabled>
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Max Attempts
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              )}

              {/* Lesson Completion */}
              {progress.canAccess && !progress.completed && progress.quizzes.length === 0 && (
                <CardContent className="pt-0">
                  <Button
                    onClick={() => markLessonCompleteMutation.mutate(lesson.id)}
                    disabled={markLessonCompleteMutation.isPending}
                    className="w-full"
                    data-testid={`button-complete-lesson-${lesson.id}`}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {markLessonCompleteMutation.isPending ? 'Completing...' : 'Mark as Complete'}
                  </Button>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Course Completion */}
      {courseCompletion.canComplete && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950/30">
          <CardContent className="py-6">
            <div className="text-center space-y-4">
              <Trophy className="h-16 w-16 mx-auto text-yellow-500" />
              <h3 className="text-2xl font-bold text-green-700 dark:text-green-300">
                🎉 Course Completed!
              </h3>
              <p className="text-green-600 dark:text-green-400">
                Congratulations! You've successfully completed all lessons and required quizzes.
              </p>
              <Button
                size="lg"
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                data-testid="button-claim-certificate"
              >
                <Award className="h-5 w-5 mr-2" />
                Claim Your Certificate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Start Quiz Confirmation Dialog */}
      <AlertDialog open={showStartQuizDialog} onOpenChange={setShowStartQuizDialog}>
        <AlertDialogContent data-testid="dialog-start-quiz-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle>Start Quiz</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedQuiz && (
                <div className="space-y-3">
                  <p>You're about to start: <strong>{selectedQuiz.title}</strong></p>
                  <div className="bg-muted rounded-lg p-3 space-y-2 text-sm">
                    <div>📝 {selectedQuiz.questions?.length || 0} questions</div>
                    {selectedQuiz.timeLimit && <div>⏱️ {selectedQuiz.timeLimit} minutes time limit</div>}
                    <div>🎯 {selectedQuiz.passingScore}% required to pass</div>
                    {selectedQuiz.maxAttempts && <div>🔄 {selectedQuiz.maxAttempts} attempts allowed</div>}
                  </div>
                  <p>Make sure you have a stable internet connection and enough time to complete the quiz.</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-start-quiz">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmStartQuiz}
              data-testid="button-confirm-start-quiz"
            >
              Start Quiz
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Quiz Taking Dialog */}
      <Dialog open={showQuizDialog} onOpenChange={setShowQuizDialog}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden p-0" data-testid="dialog-quiz-taking">
          <div className="h-full">
            {selectedQuiz && (
              <QuizTaker
                quizId={selectedQuiz.id}
                onComplete={handleQuizComplete}
                onAbandon={handleQuizAbandon}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Quiz Results Dialog */}
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto" data-testid="dialog-quiz-results">
          <DialogHeader>
            <DialogTitle>Quiz Results</DialogTitle>
          </DialogHeader>
          {quizResults?.attempt && (
            <QuizResults
              attemptId={quizResults.attempt.id}
              onRetakeQuiz={() => {
                setShowResultsDialog(false);
                if (selectedQuiz) {
                  handleStartQuiz(selectedQuiz);
                }
              }}
              onViewCertificate={(certificateId) => {
                // Handle certificate viewing
                console.log('View certificate:', certificateId);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}