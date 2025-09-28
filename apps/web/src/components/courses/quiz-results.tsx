import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { QuizAttempt, Question, QuestionOption, QuestionResponse } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  Trophy,
  Clock, 
  Target, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileText,
  Award,
  Download,
  Eye,
  Edit,
  Save,
  BarChart3,
  PieChart,
  Timer,
  Star,
  Zap,
  Brain,
  BookOpen
} from "lucide-react";

interface QuizResultsProps {
  attemptId: string;
  onRetakeQuiz?: () => void;
  onViewCertificate?: (certificateId: string) => void;
  showGradingInterface?: boolean; // For admin/instructor view
}

interface GradingData {
  responseId: string;
  grade: number;
  feedback: string;
}

export default function QuizResults({ 
  attemptId, 
  onRetakeQuiz, 
  onViewCertificate, 
  showGradingInterface = false 
}: QuizResultsProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [gradingData, setGradingData] = useState<Record<string, GradingData>>({});
  const [showGradingDialog, setShowGradingDialog] = useState(false);
  const [currentGradingResponse, setCurrentGradingResponse] = useState<QuestionResponse | null>(null);

  // Fetch quiz attempt details
  const { data: attempt, isLoading: isLoadingAttempt } = useQuery({
    queryKey: ["/api/quiz-attempts", attemptId],
    enabled: !!attemptId && isAuthenticated,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/quiz-attempts/${attemptId}`);
      return response.json();
    }
  });

  // Fetch attempt responses
  const { data: responses, isLoading: isLoadingResponses } = useQuery({
    queryKey: ["/api/quiz-attempts", attemptId, "responses"],
    enabled: !!attemptId && isAuthenticated,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/quiz-attempts/${attemptId}/responses`);
      return response.json();
    }
  });

  // Fetch certificate if quiz was passed
  const { data: certificate } = useQuery({
    queryKey: ["/api/users", user?.sub, "certificates"],
    enabled: !!user?.sub && !!attempt?.passed,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${user?.sub}/certificates`);
      const certificates = await response.json();
      return certificates.find((cert: any) => cert.attemptId === attemptId);
    }
  });

  // Grade response mutation
  const gradeResponseMutation = useMutation({
    mutationFn: async ({ responseId, grade, feedback }: GradingData) => {
      const response = await apiRequest("POST", `/api/responses/${responseId}/grade`, {
        grade,
        feedback
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quiz-attempts", attemptId, "responses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quiz-attempts", attemptId] });
      toast({
        title: "Response Graded",
        description: "The response has been graded successfully."
      });
    },
    onError: () => {
      toast({
        title: "Grading Failed",
        description: "Failed to grade the response. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Bulk grade responses mutation
  const bulkGradeMutation = useMutation({
    mutationFn: async (grades: GradingData[]) => {
      const response = await apiRequest("POST", "/api/responses/bulk-grade", {
        grades
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quiz-attempts", attemptId, "responses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quiz-attempts", attemptId] });
      toast({
        title: "Bulk Grading Complete",
        description: `${data.gradedCount} responses have been graded successfully.`
      });
      setGradingData({});
    },
    onError: () => {
      toast({
        title: "Bulk Grading Failed",
        description: "Failed to grade responses. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Calculate statistics
  const getQuizStatistics = () => {
    if (!attempt || !responses) return null;

    const totalQuestions = attempt.quiz.questions?.length || 0;
    const answeredQuestions = responses.filter((r: QuestionResponse) => r.response).length;
    const correctAnswers = responses.filter((r: QuestionResponse) => r.isCorrect === true).length;
    const incorrectAnswers = responses.filter((r: QuestionResponse) => r.isCorrect === false).length;
    const pendingGrading = responses.filter((r: QuestionResponse) => r.isCorrect === null).length;
    
    const totalPoints = attempt.quiz.questions?.reduce((sum: number, q: Question) => sum + q.points, 0) || 0;
    const earnedPoints = responses.reduce((sum: number, r: QuestionResponse) => sum + (r.pointsEarned || 0), 0);
    
    const timeSpent = attempt.endTime && attempt.startTime 
      ? Math.floor((new Date(attempt.endTime).getTime() - new Date(attempt.startTime).getTime()) / 1000)
      : 0;

    // Question type breakdown
    const questionTypes: Record<string, { total: number; correct: number; incorrect: number; pending: number }> = {};
    
    attempt.quiz.questions?.forEach((question: Question) => {
      const response = responses.find((r: QuestionResponse) => r.questionId === question.id);
      const type = question.type;
      
      if (!questionTypes[type]) {
        questionTypes[type] = { total: 0, correct: 0, incorrect: 0, pending: 0 };
      }
      
      questionTypes[type].total++;
      
      if (response) {
        if (response.isCorrect === true) {
          questionTypes[type].correct++;
        } else if (response.isCorrect === false) {
          questionTypes[type].incorrect++;
        } else {
          questionTypes[type].pending++;
        }
      }
    });

    return {
      totalQuestions,
      answeredQuestions,
      correctAnswers,
      incorrectAnswers,
      pendingGrading,
      totalPoints,
      earnedPoints,
      percentage: attempt.score || 0,
      timeSpent,
      questionTypes,
      passed: attempt.passed,
      passingScore: attempt.quiz.passingScore || 70
    };
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle grading
  const handleGradeResponse = (response: QuestionResponse) => {
    setCurrentGradingResponse(response);
    setShowGradingDialog(true);
  };

  const saveGrade = () => {
    if (!currentGradingResponse) return;
    
    const grade = gradingData[currentGradingResponse.id]?.grade || 0;
    const feedback = gradingData[currentGradingResponse.id]?.feedback || "";
    
    gradeResponseMutation.mutate({
      responseId: currentGradingResponse.id,
      grade,
      feedback
    });
    
    setShowGradingDialog(false);
  };

  const saveBulkGrades = () => {
    const grades = Object.values(gradingData).filter(data => data.grade !== undefined);
    if (grades.length === 0) {
      toast({
        title: "No Grades to Save",
        description: "Please grade at least one response before saving.",
        variant: "destructive"
      });
      return;
    }
    
    bulkGradeMutation.mutate(grades);
  };

  // Render question result
  const renderQuestionResult = (question: Question & { options?: QuestionOption[] }, response: QuestionResponse | undefined, index: number) => {
    const isCorrect = response?.isCorrect === true;
    const isIncorrect = response?.isCorrect === false;
    const isPending = response?.isCorrect === null;
    const hasResponse = response && response.response;

    return (
      <Card key={question.id} className={`${isCorrect ? 'border-green-500' : isIncorrect ? 'border-red-500' : isPending ? 'border-yellow-500' : ''}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant="outline">
                  Question {index + 1}
                </Badge>
                <Badge variant="secondary">
                  {question.points} {question.points === 1 ? 'point' : 'points'}
                </Badge>
                <Badge variant="outline">
                  {question.type.replace('_', ' ')}
                </Badge>
                {isCorrect && <CheckCircle className="h-4 w-4 text-green-600" />}
                {isIncorrect && <XCircle className="h-4 w-4 text-red-600" />}
                {isPending && <AlertCircle className="h-4 w-4 text-yellow-600" />}
              </div>
              <h3 className="text-lg font-medium">{question.question}</h3>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-muted-foreground">
                Score: {response?.pointsEarned || 0} / {question.points}
              </div>
              {response?.timeSpent && (
                <div className="text-sm text-muted-foreground">
                  <Clock className="h-3 w-3 inline mr-1" />
                  {formatTime(response.timeSpent)}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Question Options/Correct Answer for Multiple Choice */}
          {question.type === 'multiple_choice' && question.options && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Answer Choices:</Label>
              {question.options.map((option) => {
                const isSelected = response?.response === option.id;
                const isCorrectOption = option.isCorrect;
                
                return (
                  <div 
                    key={option.id}
                    className={`p-3 rounded-lg border ${
                      isSelected && isCorrectOption ? 'border-green-500 bg-green-50 dark:bg-green-950/30' :
                      isSelected && !isCorrectOption ? 'border-red-500 bg-red-50 dark:bg-red-950/30' :
                      !isSelected && isCorrectOption ? 'border-green-500 bg-green-50 dark:bg-green-950/30' :
                      'border-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option.optionText}</span>
                      <div className="flex items-center space-x-2">
                        {isSelected && <Badge variant="outline">Your Answer</Badge>}
                        {isCorrectOption && <Badge variant="default">Correct</Badge>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* True/False Result */}
          {question.type === 'true_false' && question.options && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Your Answer vs Correct Answer:</Label>
              {question.options.map((option) => {
                const isSelected = response?.response === option.id;
                const isCorrectOption = option.isCorrect;
                
                return (
                  <div 
                    key={option.id}
                    className={`p-3 rounded-lg border ${
                      isSelected && isCorrectOption ? 'border-green-500 bg-green-50 dark:bg-green-950/30' :
                      isSelected && !isCorrectOption ? 'border-red-500 bg-red-50 dark:bg-red-950/30' :
                      !isSelected && isCorrectOption ? 'border-green-500 bg-green-50 dark:bg-green-950/30' :
                      'border-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option.optionText}</span>
                      <div className="flex items-center space-x-2">
                        {isSelected && <Badge variant="outline">Your Answer</Badge>}
                        {isCorrectOption && <Badge variant="default">Correct</Badge>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Student Response for Short Answer/Essay */}
          {(question.type === 'short_answer' || question.type === 'essay') && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Your Response:</Label>
              <div className="p-3 bg-muted rounded-lg">
                {hasResponse ? (
                  <p className="whitespace-pre-wrap">{response.response}</p>
                ) : (
                  <p className="text-muted-foreground italic">No response provided</p>
                )}
              </div>
              
              {/* Instructor Feedback */}
              {response?.feedback && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-l-4 border-blue-500">
                  <Label className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Instructor Feedback:
                  </Label>
                  <p className="text-sm mt-1">{response.feedback}</p>
                </div>
              )}

              {/* Grading Interface for Instructors */}
              {showGradingInterface && isPending && (
                <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Grade this response:</Label>
                    <Button
                      size="sm"
                      onClick={() => handleGradeResponse(response!)}
                      data-testid={`button-grade-response-${question.id}`}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Grade
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor={`grade-${question.id}`} className="text-xs">
                        Points (0-{question.points})
                      </Label>
                      <Input
                        id={`grade-${question.id}`}
                        type="number"
                        min="0"
                        max={question.points}
                        value={gradingData[response?.id || ""]?.grade || ""}
                        onChange={(e) => setGradingData(prev => ({
                          ...prev,
                          [response?.id || ""]: {
                            ...prev[response?.id || ""],
                            responseId: response?.id || "",
                            grade: parseFloat(e.target.value) || 0,
                            feedback: prev[response?.id || ""]?.feedback || ""
                          }
                        }))}
                        className="h-8"
                        data-testid={`input-grade-${question.id}`}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`feedback-${question.id}`} className="text-xs">
                        Feedback
                      </Label>
                      <Input
                        id={`feedback-${question.id}`}
                        value={gradingData[response?.id || ""]?.feedback || ""}
                        onChange={(e) => setGradingData(prev => ({
                          ...prev,
                          [response?.id || ""]: {
                            ...prev[response?.id || ""],
                            responseId: response?.id || "",
                            grade: prev[response?.id || ""]?.grade || 0,
                            feedback: e.target.value
                          }
                        }))}
                        className="h-8"
                        placeholder="Optional feedback"
                        data-testid={`input-feedback-${question.id}`}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Question Explanation */}
          {question.explanation && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-l-4 border-blue-500">
              <Label className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Explanation:
              </Label>
              <p className="text-sm mt-1">{question.explanation}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoadingAttempt || isLoadingResponses) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading quiz results...</p>
        </div>
      </div>
    );
  }

  if (!attempt || !responses) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Results Not Found</h3>
        <p className="text-muted-foreground">Unable to load quiz results.</p>
      </div>
    );
  }

  const stats = getQuizStatistics();
  if (!stats) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Overall Score */}
      <div className="text-center mb-8">
        <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full text-4xl font-bold mb-4 ${
          stats.passed ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-300' : 
          'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-300'
        }`}>
          {stats.percentage.toFixed(0)}%
        </div>
        
        <h1 className="text-3xl font-bold mb-2">
          {stats.passed ? (
            <span className="text-green-600">Quiz Passed! 🎉</span>
          ) : (
            <span className="text-red-600">Quiz Not Passed</span>
          )}
        </h1>
        
        <p className="text-lg text-muted-foreground mb-4">
          {attempt.quiz.title}
        </p>

        <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center">
            <Target className="h-4 w-4 mr-1" />
            Passing Score: {stats.passingScore}%
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            Time: {formatTime(stats.timeSpent)}
          </div>
          <div className="flex items-center">
            <FileText className="h-4 w-4 mr-1" />
            {stats.answeredQuestions}/{stats.totalQuestions} Answered
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-4 mt-6">
          {certificate && (
            <Button
              onClick={() => onViewCertificate?.(certificate.id)}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
              data-testid="button-view-certificate"
            >
              <Award className="h-4 w-4 mr-2" />
              View Certificate
            </Button>
          )}
          
          {onRetakeQuiz && attempt.quiz.maxAttempts && (
            <Button variant="outline" onClick={onRetakeQuiz} data-testid="button-retake-quiz">
              Retake Quiz
            </Button>
          )}

          {showGradingInterface && Object.keys(gradingData).length > 0 && (
            <Button
              onClick={saveBulkGrades}
              disabled={bulkGradeMutation.isPending}
              data-testid="button-save-bulk-grades"
            >
              <Save className="h-4 w-4 mr-2" />
              {bulkGradeMutation.isPending ? 'Saving...' : 'Save All Grades'}
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="breakdown" data-testid="tab-breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="questions" data-testid="tab-questions">Questions</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-8 w-8 text-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold">{stats.percentage.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">Final Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{stats.correctAnswers}</p>
                    <p className="text-sm text-muted-foreground">Correct</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold">{stats.incorrectAnswers}</p>
                    <p className="text-sm text-muted-foreground">Incorrect</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Timer className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{formatTime(stats.timeSpent)}</p>
                    <p className="text-sm text-muted-foreground">Time Spent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {stats.pendingGrading > 0 && (
            <Card className="border-yellow-500">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-6 w-6 text-yellow-500" />
                  <div>
                    <h3 className="font-medium">Pending Manual Grading</h3>
                    <p className="text-sm text-muted-foreground">
                      {stats.pendingGrading} response(s) require manual grading. Your final score may change.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Breakdown Tab */}
        <TabsContent value="breakdown" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="h-5 w-5 mr-2" />
                Question Type Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.questionTypes).map(([type, data]) => {
                  const accuracy = data.total > 0 ? (data.correct / data.total) * 100 : 0;
                  
                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium capitalize">
                          {type.replace('_', ' ')} Questions
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {data.correct}/{data.total} correct ({accuracy.toFixed(0)}%)
                        </span>
                      </div>
                      <Progress value={accuracy} className="h-2" />
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>✓ {data.correct} Correct</span>
                        <span>✗ {data.incorrect} Incorrect</span>
                        {data.pending > 0 && <span>⏳ {data.pending} Pending</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span>Points Earned</span>
                  <span className="font-bold">{stats.earnedPoints} / {stats.totalPoints}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span>Percentage Score</span>
                  <span className="font-bold">{stats.percentage.toFixed(2)}%</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span>Required to Pass</span>
                  <span className="font-bold">{stats.passingScore}%</span>
                </div>
                <div className={`flex items-center justify-between p-4 rounded-lg ${
                  stats.passed ? 'bg-green-100 dark:bg-green-950/30' : 'bg-red-100 dark:bg-red-950/30'
                }`}>
                  <span className="font-medium">Result</span>
                  <span className={`font-bold ${stats.passed ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                    {stats.passed ? 'PASSED' : 'NOT PASSED'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Questions Tab */}
        <TabsContent value="questions" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Detailed Question Review</h3>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Correct
              </Badge>
              <Badge variant="outline" className="text-red-600">
                <XCircle className="h-3 w-3 mr-1" />
                Incorrect
              </Badge>
              <Badge variant="outline" className="text-yellow-600">
                <AlertCircle className="h-3 w-3 mr-1" />
                Pending
              </Badge>
            </div>
          </div>

          <div className="space-y-4">
            {attempt.quiz.questions?.map((question: Question & { options?: QuestionOption[] }, index: number) => {
              const response = responses.find((r: QuestionResponse) => r.questionId === question.id);
              return renderQuestionResult(question, response, index);
            })}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Completion Rate</span>
                    <span className="font-medium">
                      {((stats.answeredQuestions / stats.totalQuestions) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={(stats.answeredQuestions / stats.totalQuestions) * 100} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Accuracy Rate</span>
                    <span className="font-medium">
                      {((stats.correctAnswers / stats.answeredQuestions) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={(stats.correctAnswers / stats.answeredQuestions) * 100} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Points Efficiency</span>
                    <span className="font-medium">
                      {((stats.earnedPoints / stats.totalPoints) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={(stats.earnedPoints / stats.totalPoints) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  Learning Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                  {stats.correctAnswers >= stats.incorrectAnswers ? (
                    <div className="flex items-start space-x-2">
                      <Star className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-600">Strong Performance</p>
                        <p className="text-muted-foreground">
                          You answered most questions correctly. Great job!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start space-x-2">
                      <BookOpen className="h-4 w-4 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-600">Room for Improvement</p>
                        <p className="text-muted-foreground">
                          Consider reviewing the material and retaking the quiz.
                        </p>
                      </div>
                    </div>
                  )}

                  {stats.timeSpent < (attempt.quiz.timeLimit || 0) * 60 * 0.5 && (
                    <div className="flex items-start space-x-2">
                      <Zap className="h-4 w-4 text-purple-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-purple-600">Speed Champion</p>
                        <p className="text-muted-foreground">
                          You completed the quiz quickly. Make sure to review your answers.
                        </p>
                      </div>
                    </div>
                  )}

                  {stats.pendingGrading > 0 && (
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-600">Manual Review Required</p>
                        <p className="text-muted-foreground">
                          Some responses need instructor review. Check back later for final results.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Manual Grading Dialog */}
      <AlertDialog open={showGradingDialog} onOpenChange={setShowGradingDialog}>
        <AlertDialogContent className="max-w-2xl" data-testid="dialog-grade-response">
          <AlertDialogHeader>
            <AlertDialogTitle>Grade Response</AlertDialogTitle>
            <AlertDialogDescription>
              Review and grade this student response.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {currentGradingResponse && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Student Response:</Label>
                <div className="p-3 bg-muted rounded-lg mt-1">
                  <p className="whitespace-pre-wrap">{currentGradingResponse.response}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="grade-input">Grade (Points)</Label>
                  <Input
                    id="grade-input"
                    type="number"
                    min="0"
                    value={gradingData[currentGradingResponse.id]?.grade || ""}
                    onChange={(e) => setGradingData(prev => ({
                      ...prev,
                      [currentGradingResponse.id]: {
                        ...prev[currentGradingResponse.id],
                        responseId: currentGradingResponse.id,
                        grade: parseFloat(e.target.value) || 0,
                        feedback: prev[currentGradingResponse.id]?.feedback || ""
                      }
                    }))}
                    data-testid="input-grade-dialog"
                  />
                </div>
                
                <div>
                  <Label htmlFor="feedback-input">Feedback</Label>
                  <Textarea
                    id="feedback-input"
                    value={gradingData[currentGradingResponse.id]?.feedback || ""}
                    onChange={(e) => setGradingData(prev => ({
                      ...prev,
                      [currentGradingResponse.id]: {
                        ...prev[currentGradingResponse.id],
                        responseId: currentGradingResponse.id,
                        grade: prev[currentGradingResponse.id]?.grade || 0,
                        feedback: e.target.value
                      }
                    }))}
                    placeholder="Provide feedback to the student..."
                    rows={3}
                    data-testid="textarea-feedback-dialog"
                  />
                </div>
              </div>
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-grade">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={saveGrade}
              disabled={gradeResponseMutation.isPending}
              data-testid="button-save-grade"
            >
              {gradeResponseMutation.isPending ? 'Saving...' : 'Save Grade'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}