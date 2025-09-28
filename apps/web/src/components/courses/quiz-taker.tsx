import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Quiz, Question, QuestionOption, QuizAttempt } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Flag,
  Eye,
  Send,
  Save,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Timer,
  SkipForward
} from "lucide-react";

interface QuestionResponse {
  questionId: string;
  response: string;
  flagged?: boolean;
  timeSpent?: number;
}

interface QuizTakerProps {
  quizId: string;
  onComplete?: (result: any) => void;
  onAbandon?: () => void;
}

export default function QuizTaker({ quizId, onComplete, onAbandon }: QuizTakerProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, QuestionResponse>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showAbandonDialog, setShowAbandonDialog] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [currentAttempt, setCurrentAttempt] = useState<QuizAttempt | null>(null);
  
  // Refs
  const timerRef = useRef<NodeJS.Timeout>();
  const autoSaveRef = useRef<NodeJS.Timeout>();
  const questionTimesRef = useRef<Record<string, number>>({});

  // Fetch quiz with questions
  const { data: quiz, isLoading: isLoadingQuiz } = useQuery({
    queryKey: ["/api/quizzes", quizId, "questions"],
    enabled: !!quizId,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/quizzes/${quizId}/questions`);
      return response.json();
    }
  });

  // Start quiz attempt mutation
  const startAttemptMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/quizzes/${quizId}/start`);
      return response.json();
    },
    onSuccess: (attempt) => {
      setCurrentAttempt(attempt);
      if (quiz?.timeLimit) {
        setTimeRemaining(quiz.timeLimit * 60); // Convert minutes to seconds
      }
      toast({
        title: "Quiz Started",
        description: "Good luck! Your progress will be auto-saved."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Cannot Start Quiz",
        description: error.message || "Failed to start quiz attempt.",
        variant: "destructive"
      });
    }
  });

  // Auto-save progress mutation
  const autoSaveMutation = useMutation({
    mutationFn: async (responseData: QuestionResponse[]) => {
      if (!currentAttempt?.id) return;
      
      const response = await apiRequest("POST", `/api/quiz-attempts/${currentAttempt.id}/auto-save`, {
        responses: responseData
      });
      return response.json();
    },
    onSuccess: () => {
      setAutoSaveStatus('saved');
    },
    onError: () => {
      setAutoSaveStatus('error');
    }
  });

  // Submit quiz mutation
  const submitQuizMutation = useMutation({
    mutationFn: async () => {
      if (!currentAttempt?.id) throw new Error("No active attempt");
      
      const responseData = Object.values(responses).map(resp => ({
        questionId: resp.questionId,
        response: resp.response,
        timeSpent: questionTimesRef.current[resp.questionId] || 0,
        isCorrect: null, // Will be calculated server-side
        pointsEarned: 0 // Will be calculated server-side
      }));

      const response = await apiRequest("POST", `/api/quiz-attempts/${currentAttempt.id}/submit`, {
        responses: responseData,
        timeSpent: timeSpent
      });
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Quiz Submitted",
        description: `Your quiz has been submitted successfully. Score: ${result.score?.toFixed(1)}%`
      });
      onComplete?.(result);
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Failed to submit quiz. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Abandon quiz mutation
  const abandonQuizMutation = useMutation({
    mutationFn: async () => {
      if (!currentAttempt?.id) return;
      const response = await apiRequest("POST", `/api/quiz-attempts/${currentAttempt.id}/abandon`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Quiz Abandoned",
        description: "Your quiz attempt has been abandoned."
      });
      onAbandon?.();
    }
  });

  // Timer effect
  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0 && currentAttempt) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            // Auto-submit when time runs out
            setShowSubmitDialog(true);
            return 0;
          }
          return prev - 1;
        });
        setTimeSpent(prev => prev + 1);
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [timeRemaining, currentAttempt]);

  // Auto-save effect
  useEffect(() => {
    if (Object.keys(responses).length > 0 && currentAttempt) {
      setAutoSaveStatus('saving');
      
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
      
      autoSaveRef.current = setTimeout(() => {
        const responseData = Object.values(responses);
        autoSaveMutation.mutate(responseData);
      }, 2000); // Auto-save after 2 seconds of inactivity
    }

    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, [responses, currentAttempt, autoSaveMutation]);

  // Question timing effect
  useEffect(() => {
    setQuestionStartTime(Date.now());
    
    return () => {
      if (quiz?.questions?.[currentQuestionIndex]) {
        const questionId = quiz.questions[currentQuestionIndex].id;
        const timeSpentOnQuestion = (Date.now() - questionStartTime) / 1000;
        questionTimesRef.current[questionId] = (questionTimesRef.current[questionId] || 0) + timeSpentOnQuestion;
      }
    };
  }, [currentQuestionIndex, quiz?.questions, questionStartTime]);

  // Initialize quiz attempt
  useEffect(() => {
    if (quiz && !currentAttempt && isAuthenticated && user) {
      startAttemptMutation.mutate();
    }
  }, [quiz, currentAttempt, isAuthenticated, user]);

  // Handle response change
  const handleResponseChange = useCallback((questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        questionId,
        response: value,
        flagged: prev[questionId]?.flagged || false
      }
    }));
  }, []);

  // Toggle question flag
  const toggleQuestionFlag = useCallback((index: number) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });

    const questionId = quiz?.questions?.[index]?.id;
    if (questionId) {
      setResponses(prev => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          questionId,
          response: prev[questionId]?.response || "",
          flagged: !flaggedQuestions.has(index)
        }
      }));
    }
  }, [quiz?.questions, flaggedQuestions]);

  // Navigation functions
  const goToQuestion = useCallback((index: number) => {
    if (index >= 0 && index < (quiz?.questions?.length || 0)) {
      setCurrentQuestionIndex(index);
    }
  }, [quiz?.questions?.length]);

  const goToPrevious = useCallback(() => {
    goToQuestion(currentQuestionIndex - 1);
  }, [currentQuestionIndex, goToQuestion]);

  const goToNext = useCallback(() => {
    goToQuestion(currentQuestionIndex + 1);
  }, [currentQuestionIndex, goToQuestion]);

  // Submit handlers
  const handleSubmitQuiz = useCallback(() => {
    if (!quiz?.requireAllQuestions) {
      setShowSubmitDialog(true);
      return;
    }

    // Check if all required questions are answered
    const unansweredRequired = quiz.questions?.filter((q, index) => 
      q.required && !responses[q.id]?.response
    ).length || 0;

    if (unansweredRequired > 0) {
      toast({
        title: "Please Answer All Questions",
        description: `You have ${unansweredRequired} required question(s) that need to be answered.`,
        variant: "destructive"
      });
      return;
    }

    setShowSubmitDialog(true);
  }, [quiz, responses, toast]);

  const confirmSubmit = useCallback(() => {
    setShowSubmitDialog(false);
    submitQuizMutation.mutate();
  }, [submitQuizMutation]);

  const handleAbandonQuiz = useCallback(() => {
    setShowAbandonDialog(true);
  }, []);

  const confirmAbandon = useCallback(() => {
    setShowAbandonDialog(false);
    abandonQuizMutation.mutate();
  }, [abandonQuizMutation]);

  // Get timer color based on remaining time
  const getTimerColor = useCallback(() => {
    if (!timeRemaining || !quiz?.timeLimit) return "text-foreground";
    
    const percentage = (timeRemaining / (quiz.timeLimit * 60)) * 100;
    if (percentage <= 5) return "text-red-600";
    if (percentage <= 10) return "text-orange-600";
    if (percentage <= 25) return "text-yellow-600";
    return "text-foreground";
  }, [timeRemaining, quiz?.timeLimit]);

  // Format time display
  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Render question content
  const renderQuestion = useCallback((question: Question & { options?: QuestionOption[] }, index: number) => {
    const questionId = question.id;
    const currentResponse = responses[questionId]?.response || "";

    switch (question.type) {
      case 'multiple_choice':
        return (
          <div className="space-y-3">
            <RadioGroup
              value={currentResponse}
              onValueChange={(value) => handleResponseChange(questionId, value)}
              className="space-y-2"
            >
              {question.options?.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={option.id} 
                    id={`option-${option.id}`}
                    data-testid={`radio-option-${option.id}`}
                  />
                  <Label 
                    htmlFor={`option-${option.id}`} 
                    className="flex-1 cursor-pointer p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    {option.optionText}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 'true_false':
        return (
          <div className="space-y-3">
            <RadioGroup
              value={currentResponse}
              onValueChange={(value) => handleResponseChange(questionId, value)}
              className="space-y-2"
            >
              {question.options?.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={option.id} 
                    id={`option-${option.id}`}
                    data-testid={`radio-tf-${option.id}`}
                  />
                  <Label 
                    htmlFor={`option-${option.id}`} 
                    className="flex-1 cursor-pointer p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    {option.optionText}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 'short_answer':
        return (
          <Input
            value={currentResponse}
            onChange={(e) => handleResponseChange(questionId, e.target.value)}
            placeholder="Enter your answer..."
            className="w-full"
            data-testid={`input-short-answer-${questionId}`}
          />
        );

      case 'essay':
        return (
          <Textarea
            value={currentResponse}
            onChange={(e) => handleResponseChange(questionId, e.target.value)}
            placeholder="Write your essay response here..."
            rows={8}
            className="w-full resize-none"
            data-testid={`textarea-essay-${questionId}`}
          />
        );

      default:
        return <div>Unsupported question type</div>;
    }
  }, [responses, handleResponseChange]);

  // Get progress percentage
  const getProgress = useCallback(() => {
    if (!quiz?.questions?.length) return 0;
    return ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  }, [currentQuestionIndex, quiz?.questions?.length]);

  // Get answered questions count
  const getAnsweredCount = useCallback(() => {
    return Object.keys(responses).filter(key => responses[key].response).length;
  }, [responses]);

  if (isLoadingQuiz || !quiz) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!currentAttempt) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Starting quiz...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions?.[currentQuestionIndex];
  const totalQuestions = quiz.questions?.length || 0;
  const answeredCount = getAnsweredCount();
  const progress = getProgress();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold">{quiz.title}</h1>
              <Badge variant="outline">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Auto-save status */}
              <div className="flex items-center space-x-1 text-sm">
                {autoSaveStatus === 'saving' && (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                    <span className="text-muted-foreground">Saving...</span>
                  </>
                )}
                {autoSaveStatus === 'saved' && (
                  <>
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span className="text-green-600">Saved</span>
                  </>
                )}
                {autoSaveStatus === 'error' && (
                  <>
                    <XCircle className="h-3 w-3 text-red-600" />
                    <span className="text-red-600">Error</span>
                  </>
                )}
              </div>

              {/* Timer */}
              {timeRemaining !== null && (
                <div className={`flex items-center space-x-2 ${getTimerColor()}`}>
                  <Timer className="h-4 w-4" />
                  <span className="font-mono text-lg font-bold">
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsReviewMode(!isReviewMode)}
                  data-testid="button-review-mode"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {isReviewMode ? 'Exit Review' : 'Review'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAbandonQuiz}
                  data-testid="button-abandon-quiz"
                >
                  Abandon
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmitQuiz}
                  disabled={submitQuizMutation.isPending}
                  data-testid="button-submit-quiz"
                >
                  <Send className="h-4 w-4 mr-1" />
                  {submitQuizMutation.isPending ? 'Submitting...' : 'Submit Quiz'}
                </Button>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground mt-1">
              <span>{answeredCount} of {totalQuestions} answered</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {isReviewMode ? (
          /* Review Mode */
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="h-5 w-5 mr-2" />
                  Review Your Answers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-2 mb-6">
                  {quiz.questions?.map((_, index) => {
                    const questionId = quiz.questions[index].id;
                    const hasAnswer = responses[questionId]?.response;
                    const isFlagged = flaggedQuestions.has(index);
                    const isCurrent = index === currentQuestionIndex;

                    return (
                      <Button
                        key={index}
                        variant={isCurrent ? "default" : hasAnswer ? "secondary" : "outline"}
                        size="sm"
                        className={`relative ${isFlagged ? 'border-orange-500' : ''}`}
                        onClick={() => goToQuestion(index)}
                        data-testid={`review-question-${index + 1}`}
                      >
                        {index + 1}
                        {isFlagged && (
                          <Flag className="h-3 w-3 absolute -top-1 -right-1 text-orange-500" />
                        )}
                      </Button>
                    );
                  })}
                </div>

                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-primary rounded"></div>
                    <span>Current</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-secondary rounded"></div>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 border border-border rounded"></div>
                    <span>Not answered</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Flag className="h-3 w-3 text-orange-500" />
                    <span>Flagged</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Main Question Display */}
        {currentQuestion && (
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant="outline">
                        {currentQuestion.type.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Badge variant="secondary">
                        {currentQuestion.points} {currentQuestion.points === 1 ? 'point' : 'points'}
                      </Badge>
                      {currentQuestion.required && (
                        <Badge variant="destructive">Required</Badge>
                      )}
                    </div>
                    <h2 className="text-xl font-semibold leading-relaxed">
                      {currentQuestion.question}
                    </h2>
                  </div>
                  
                  <Button
                    variant={flaggedQuestions.has(currentQuestionIndex) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleQuestionFlag(currentQuestionIndex)}
                    className={flaggedQuestions.has(currentQuestionIndex) ? "bg-orange-500 hover:bg-orange-600" : ""}
                    data-testid="button-flag-question"
                  >
                    <Flag className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {renderQuestion(currentQuestion, currentQuestionIndex)}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              <Button
                variant="outline"
                onClick={goToPrevious}
                disabled={currentQuestionIndex === 0 || !quiz.allowBackNavigation}
                data-testid="button-previous-question"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              <div className="flex space-x-2">
                {currentQuestionIndex < totalQuestions - 1 ? (
                  <Button
                    onClick={goToNext}
                    data-testid="button-next-question"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmitQuiz}
                    disabled={submitQuizMutation.isPending}
                    data-testid="button-finish-quiz"
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Finish Quiz
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent data-testid="dialog-submit-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <Send className="h-5 w-5 mr-2" />
              Submit Quiz
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit your quiz? This action cannot be undone.
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Questions Answered:</strong> {answeredCount} of {totalQuestions}
                  </div>
                  <div>
                    <strong>Time Spent:</strong> {formatTime(timeSpent)}
                  </div>
                  {flaggedQuestions.size > 0 && (
                    <div className="col-span-2">
                      <strong>Flagged Questions:</strong> {flaggedQuestions.size}
                    </div>
                  )}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-submit">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmSubmit}
              data-testid="button-confirm-submit"
            >
              Submit Quiz
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Abandon Confirmation Dialog */}
      <AlertDialog open={showAbandonDialog} onOpenChange={setShowAbandonDialog}>
        <AlertDialogContent data-testid="dialog-abandon-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Abandon Quiz
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to abandon this quiz? All your progress will be lost and this will count as an attempt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-abandon">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmAbandon}
              variant="destructive"
              data-testid="button-confirm-abandon"
            >
              Abandon Quiz
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}