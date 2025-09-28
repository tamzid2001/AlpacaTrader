import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Quiz, QuizAttempt, Question, QuestionResponse, Course, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Target,
  Award,
  AlertCircle,
  FileText,
  Download,
  Filter,
  Search,
  Calendar,
  PieChart,
  LineChart,
  Activity,
  Star,
  ThumbsUp,
  ThumbsDown,
  Brain,
  Zap
} from "lucide-react";

interface QuizAnalyticsProps {
  courseId?: string; // If provided, show analytics for specific course
}

interface AnalyticsData {
  totalQuizzes: number;
  totalAttempts: number;
  totalStudents: number;
  averageScore: number;
  passRate: number;
  averageTimeSpent: number;
  mostDifficultQuiz: string;
  easiestQuiz: string;
  topPerformer: string;
  recentActivity: number;
}

interface QuizPerformance {
  quiz: Quiz;
  attemptCount: number;
  passRate: number;
  averageScore: number;
  averageTime: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  lastAttempt: Date;
}

interface StudentPerformance {
  student: User;
  totalAttempts: number;
  quizzesPassed: number;
  averageScore: number;
  totalTimeSpent: number;
  lastActivity: Date;
  improvement: number;
}

interface QuestionAnalytics {
  question: Question;
  totalResponses: number;
  correctResponses: number;
  incorrectResponses: number;
  accuracy: number;
  averageTimeSpent: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export default function QuizAnalytics({ courseId }: QuizAnalyticsProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [dateRange, setDateRange] = useState("30"); // days
  const [selectedQuizId, setSelectedQuizId] = useState<string>("all");
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courseId || "all");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch analytics data
  const { data: analyticsData, isLoading: isLoadingAnalytics } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics/quizzes", selectedCourseId, dateRange],
    enabled: isAuthenticated && user?.role === "admin",
    queryFn: async () => {
      const params = new URLSearchParams({
        days: dateRange,
        ...(selectedCourseId !== "all" && { courseId: selectedCourseId })
      });
      const response = await apiRequest("GET", `/api/analytics/quizzes?${params}`);
      return response.json();
    }
  });

  // Fetch quiz performance data
  const { data: quizPerformance, isLoading: isLoadingQuizPerformance } = useQuery<QuizPerformance[]>({
    queryKey: ["/api/analytics/quiz-performance", selectedCourseId, dateRange],
    enabled: isAuthenticated && user?.role === "admin",
    queryFn: async () => {
      const params = new URLSearchParams({
        days: dateRange,
        ...(selectedCourseId !== "all" && { courseId: selectedCourseId })
      });
      const response = await apiRequest("GET", `/api/analytics/quiz-performance?${params}`);
      return response.json();
    }
  });

  // Fetch student performance data
  const { data: studentPerformance, isLoading: isLoadingStudentPerformance } = useQuery<StudentPerformance[]>({
    queryKey: ["/api/analytics/student-performance", selectedCourseId, dateRange],
    enabled: isAuthenticated && user?.role === "admin",
    queryFn: async () => {
      const params = new URLSearchParams({
        days: dateRange,
        ...(selectedCourseId !== "all" && { courseId: selectedCourseId })
      });
      const response = await apiRequest("GET", `/api/analytics/student-performance?${params}`);
      return response.json();
    }
  });

  // Fetch question analytics
  const { data: questionAnalytics, isLoading: isLoadingQuestionAnalytics } = useQuery<QuestionAnalytics[]>({
    queryKey: ["/api/analytics/questions", selectedQuizId, dateRange],
    enabled: isAuthenticated && user?.role === "admin" && selectedQuizId !== "all",
    queryFn: async () => {
      const params = new URLSearchParams({
        days: dateRange,
        quizId: selectedQuizId
      });
      const response = await apiRequest("GET", `/api/analytics/questions?${params}`);
      return response.json();
    }
  });

  // Fetch courses for filter
  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
    enabled: isAuthenticated && user?.role === "admin"
  });

  // Fetch quizzes for filter
  const { data: quizzes } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes"],
    enabled: isAuthenticated && user?.role === "admin"
  });

  // Filter data based on search
  const filteredQuizPerformance = useMemo(() => {
    if (!quizPerformance) return [];
    return quizPerformance.filter(qp => 
      qp.quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      qp.quiz.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [quizPerformance, searchTerm]);

  const filteredStudentPerformance = useMemo(() => {
    if (!studentPerformance) return [];
    return studentPerformance.filter(sp => 
      (sp.student.firstName + ' ' + sp.student.lastName)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sp.student.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [studentPerformance, searchTerm]);

  // Format time display
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
  };

  // Format date
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      case 'Hard': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  // Export data function
  const exportData = () => {
    // Implementation for exporting analytics data
    toast({
      title: "Export Started",
      description: "Analytics data is being prepared for download."
    });
  };

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Access Denied</h3>
        <p className="text-muted-foreground">You need admin privileges to view analytics.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <BarChart3 className="h-8 w-8 mr-3 text-blue-600" />
              Quiz Analytics Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive insights into quiz performance and student engagement
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={exportData} data-testid="button-export-analytics">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Analytics Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date-range">Date Range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger data-testid="select-date-range">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 3 months</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="course">Course</Label>
                <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                  <SelectTrigger data-testid="select-course-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {courses?.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quiz">Quiz (for question analytics)</Label>
                <Select value={selectedQuizId} onValueChange={setSelectedQuizId}>
                  <SelectTrigger data-testid="select-quiz-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Quizzes</SelectItem>
                    {quizzes?.filter(quiz => 
                      selectedCourseId === "all" || quiz.courseId === selectedCourseId
                    ).map(quiz => (
                      <SelectItem key={quiz.id} value={quiz.id}>
                        {quiz.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    className="pl-10"
                    data-testid="input-search-analytics"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overview Statistics */}
        {analyticsData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{analyticsData.totalQuizzes}</p>
                    <p className="text-sm text-muted-foreground">Total Quizzes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{analyticsData.totalStudents}</p>
                    <p className="text-sm text-muted-foreground">Active Students</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Target className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">{analyticsData.averageScore.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">Average Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Award className="h-8 w-8 text-yellow-600" />
                  <div>
                    <p className="text-2xl font-bold">{analyticsData.passRate.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">Pass Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="quizzes" data-testid="tab-quiz-performance">Quiz Performance</TabsTrigger>
            <TabsTrigger value="students" data-testid="tab-student-performance">Student Performance</TabsTrigger>
            <TabsTrigger value="questions" data-testid="tab-question-analytics">Question Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Performance Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Performance Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analyticsData && (
                    <>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span>Average Time per Quiz</span>
                          <span className="font-medium">{formatTime(analyticsData.averageTimeSpent)}</span>
                        </div>
                        <Progress value={(analyticsData.averageTimeSpent / 60) * 100} className="h-2" />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span>Completion Rate</span>
                          <span className="font-medium">{analyticsData.passRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={analyticsData.passRate} className="h-2" />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span>Student Engagement</span>
                          <span className="font-medium">{((analyticsData.totalAttempts / analyticsData.totalStudents) || 0).toFixed(1)} attempts/student</span>
                        </div>
                        <Progress value={Math.min((analyticsData.totalAttempts / analyticsData.totalStudents / 3) * 100, 100)} className="h-2" />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Key Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="h-5 w-5 mr-2" />
                    Key Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analyticsData && (
                    <>
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <Star className="h-4 w-4 text-blue-600 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-blue-700 dark:text-blue-300">Top Performer</p>
                            <p className="text-blue-600 dark:text-blue-400">{analyticsData.topPerformer}</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-red-700 dark:text-red-300">Most Challenging</p>
                            <p className="text-red-600 dark:text-red-400">{analyticsData.mostDifficultQuiz}</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <ThumbsUp className="h-4 w-4 text-green-600 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-green-700 dark:text-green-300">Easiest Quiz</p>
                            <p className="text-green-600 dark:text-green-400">{analyticsData.easiestQuiz}</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <Activity className="h-4 w-4 text-purple-600 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-purple-700 dark:text-purple-300">Recent Activity</p>
                            <p className="text-purple-600 dark:text-purple-400">{analyticsData.recentActivity} attempts today</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Quiz Performance Tab */}
          <TabsContent value="quizzes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Quiz Performance Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingQuizPerformance ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Loading quiz performance data...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Quiz</TableHead>
                          <TableHead>Attempts</TableHead>
                          <TableHead>Pass Rate</TableHead>
                          <TableHead>Avg Score</TableHead>
                          <TableHead>Avg Time</TableHead>
                          <TableHead>Difficulty</TableHead>
                          <TableHead>Last Attempt</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredQuizPerformance?.map((performance) => (
                          <TableRow key={performance.quiz.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{performance.quiz.title}</div>
                                <div className="text-sm text-muted-foreground">
                                  Questions available
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{performance.attemptCount}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <span className={`font-medium ${
                                  performance.passRate >= 70 ? 'text-green-600' : 
                                  performance.passRate >= 50 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {performance.passRate.toFixed(1)}%
                                </span>
                                {performance.passRate >= 70 ? (
                                  <ThumbsUp className="h-3 w-3 text-green-600" />
                                ) : (
                                  <ThumbsDown className="h-3 w-3 text-red-600" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">{performance.averageScore.toFixed(1)}%</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span>{formatTime(performance.averageTime)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getDifficultyColor(performance.difficulty)}>
                                {performance.difficulty}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">{formatDate(performance.lastAttempt)}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Student Performance Tab */}
          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Student Performance Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingStudentPerformance ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Loading student performance data...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Attempts</TableHead>
                          <TableHead>Passed</TableHead>
                          <TableHead>Avg Score</TableHead>
                          <TableHead>Time Spent</TableHead>
                          <TableHead>Improvement</TableHead>
                          <TableHead>Last Activity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudentPerformance?.map((performance) => (
                          <TableRow key={performance.student.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{performance.student.firstName} {performance.student.lastName}</div>
                                <div className="text-sm text-muted-foreground">{performance.student.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{performance.totalAttempts}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{performance.quizzesPassed}</span>
                                <span className="text-sm text-muted-foreground">
                                  ({((performance.quizzesPassed / performance.totalAttempts) * 100).toFixed(0)}%)
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className={`font-medium ${
                                performance.averageScore >= 80 ? 'text-green-600' : 
                                performance.averageScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {performance.averageScore.toFixed(1)}%
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span>{formatTime(performance.totalTimeSpent)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                {performance.improvement > 0 ? (
                                  <>
                                    <TrendingUp className="h-3 w-3 text-green-600" />
                                    <span className="text-green-600">+{performance.improvement.toFixed(1)}%</span>
                                  </>
                                ) : performance.improvement < 0 ? (
                                  <>
                                    <TrendingDown className="h-3 w-3 text-red-600" />
                                    <span className="text-red-600">{performance.improvement.toFixed(1)}%</span>
                                  </>
                                ) : (
                                  <span className="text-muted-foreground">No change</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">{formatDate(performance.lastActivity)}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Question Analytics Tab */}
          <TabsContent value="questions" className="space-y-6">
            {selectedQuizId === "all" ? (
              <Card>
                <CardContent className="text-center py-12">
                  <PieChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select a Quiz</h3>
                  <p className="text-muted-foreground">
                    Choose a specific quiz from the filter above to view question-level analytics.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="h-5 w-5 mr-2" />
                    Question-Level Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingQuestionAnalytics ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p>Loading question analytics...</p>
                    </div>
                  ) : questionAnalytics && questionAnalytics.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Question</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Responses</TableHead>
                            <TableHead>Accuracy</TableHead>
                            <TableHead>Avg Time</TableHead>
                            <TableHead>Difficulty</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {questionAnalytics.map((analytics) => (
                            <TableRow key={analytics.question.id}>
                              <TableCell>
                                <div className="max-w-md">
                                  <div className="font-medium truncate" title={analytics.question.question}>
                                    {analytics.question.question}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {analytics.question.points} points
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {analytics.question.type.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-center">
                                  <div className="font-medium">{analytics.totalResponses}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {analytics.correctResponses}✓ {analytics.incorrectResponses}✗
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <span className={`font-medium ${
                                    analytics.accuracy >= 80 ? 'text-green-600' : 
                                    analytics.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    {analytics.accuracy.toFixed(1)}%
                                  </span>
                                  <Progress value={analytics.accuracy} className="h-1 w-16" />
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-1">
                                  <Zap className="h-3 w-3 text-muted-foreground" />
                                  <span>{Math.round(analytics.averageTimeSpent)}s</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={getDifficultyColor(analytics.difficulty)}>
                                  {analytics.difficulty}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Data Available</h3>
                      <p className="text-muted-foreground">
                        No question analytics data found for the selected quiz and time period.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}