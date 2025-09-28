import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Quiz, Question, QuestionOption, Course } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  Eye, 
  GripVertical, 
  Clock, 
  Users, 
  Target,
  FileQuestion,
  CheckCircle,
  XCircle,
  ChevronUp,
  ChevronDown,
  Settings
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

interface QuizForm {
  id?: string;
  courseId: string;
  lessonId?: string;
  title: string;
  description: string;
  instructions: string;
  timeLimit?: number;
  passingScore: number;
  maxAttempts?: number;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  showResults: boolean;
  showCorrectAnswers: boolean;
  allowBackNavigation: boolean;
  requireAllQuestions: boolean;
  isActive: boolean;
  availableFrom?: Date;
  availableUntil?: Date;
}

interface QuestionForm {
  id?: string;
  quizId: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  question: string;
  explanation: string;
  order: number;
  points: number;
  required: boolean;
  options: QuestionOptionForm[];
}

interface QuestionOptionForm {
  id?: string;
  questionId?: string;
  optionText: string;
  isCorrect: boolean;
  order: number;
  explanation: string;
}

export default function QuizBuilder() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management
  const [activeTab, setActiveTab] = useState("basic");
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);
  
  // Form state
  const [quizForm, setQuizForm] = useState<QuizForm>({
    courseId: "",
    title: "",
    description: "",
    instructions: "",
    timeLimit: 60,
    passingScore: 70,
    maxAttempts: 3,
    shuffleQuestions: false,
    shuffleAnswers: false,
    showResults: true,
    showCorrectAnswers: true,
    allowBackNavigation: true,
    requireAllQuestions: true,
    isActive: false
  });
  
  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionForm>({
    quizId: "",
    type: "multiple_choice",
    question: "",
    explanation: "",
    order: 0,
    points: 1,
    required: true,
    options: []
  });

  // Fetch courses for dropdown
  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
    enabled: user?.role === "admin"
  });

  // Fetch quizzes
  const { data: quizzes, isLoading: isLoadingQuizzes } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes"],
    enabled: user?.role === "admin"
  });

  // Fetch quiz with questions when editing
  const { data: quizWithQuestions } = useQuery({
    queryKey: ["/api/quizzes", selectedQuiz?.id, "questions"],
    enabled: !!selectedQuiz?.id,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/quizzes/${selectedQuiz?.id}/questions`);
      return response.json();
    }
  });

  // Load quiz data when editing
  useEffect(() => {
    if (quizWithQuestions && selectedQuiz) {
      setQuizForm({
        id: selectedQuiz.id,
        courseId: selectedQuiz.courseId,
        lessonId: selectedQuiz.lessonId || "",
        title: selectedQuiz.title,
        description: selectedQuiz.description || "",
        instructions: selectedQuiz.instructions || "",
        timeLimit: selectedQuiz.timeLimit || undefined,
        passingScore: selectedQuiz.passingScore,
        maxAttempts: selectedQuiz.maxAttempts || undefined,
        shuffleQuestions: selectedQuiz.shuffleQuestions,
        shuffleAnswers: selectedQuiz.shuffleAnswers,
        showResults: selectedQuiz.showResults,
        showCorrectAnswers: selectedQuiz.showCorrectAnswers,
        allowBackNavigation: selectedQuiz.allowBackNavigation,
        requireAllQuestions: selectedQuiz.requireAllQuestions,
        isActive: selectedQuiz.isActive,
        availableFrom: selectedQuiz.availableFrom ? new Date(selectedQuiz.availableFrom) : undefined,
        availableUntil: selectedQuiz.availableUntil ? new Date(selectedQuiz.availableUntil) : undefined
      });
      
      setQuestions(quizWithQuestions.questions?.map((q: Question & { options: QuestionOption[] }) => ({
        id: q.id,
        quizId: q.quizId,
        type: q.type as QuestionForm['type'],
        question: q.question,
        explanation: q.explanation || "",
        order: q.order,
        points: q.points,
        required: q.required,
        options: q.options?.map((opt, index) => ({
          id: opt.id,
          questionId: opt.questionId,
          optionText: opt.optionText,
          isCorrect: opt.isCorrect,
          order: opt.order,
          explanation: opt.explanation || ""
        })) || []
      })) || []);
    }
  }, [quizWithQuestions, selectedQuiz]);

  // Save quiz mutation
  const saveQuizMutation = useMutation({
    mutationFn: async (data: QuizForm) => {
      const method = data.id ? "PUT" : "POST";
      const url = data.id ? `/api/quizzes/${data.id}` : "/api/quizzes";
      const response = await apiRequest(method, url, data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      setSelectedQuiz(data);
      setQuizForm(prev => ({ ...prev, id: data.id }));
      toast({
        title: "Quiz Saved",
        description: "Quiz has been saved successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save quiz.",
        variant: "destructive"
      });
    }
  });

  // Save question mutation
  const saveQuestionMutation = useMutation({
    mutationFn: async (questionData: QuestionForm) => {
      const method = questionData.id ? "PUT" : "POST";
      const url = questionData.id ? `/api/questions/${questionData.id}` : "/api/questions";
      
      // Save question first
      const questionResponse = await apiRequest(method, url, {
        quizId: questionData.quizId,
        type: questionData.type,
        question: questionData.question,
        explanation: questionData.explanation,
        order: questionData.order,
        points: questionData.points,
        required: questionData.required
      });
      
      const savedQuestion = await questionResponse.json();
      
      // Save options for multiple choice questions
      if (questionData.type === 'multiple_choice' && questionData.options.length > 0) {
        for (const option of questionData.options) {
          const optionMethod = option.id ? "PUT" : "POST";
          const optionUrl = option.id ? `/api/question-options/${option.id}` : "/api/question-options";
          
          await apiRequest(optionMethod, optionUrl, {
            questionId: savedQuestion.id,
            optionText: option.optionText,
            isCorrect: option.isCorrect,
            order: option.order,
            explanation: option.explanation
          });
        }
      }
      
      return savedQuestion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes", selectedQuiz?.id, "questions"] });
      toast({
        title: "Question Saved",
        description: "Question has been saved successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save question.",
        variant: "destructive"
      });
    }
  });

  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      const response = await apiRequest("DELETE", `/api/questions/${questionId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes", selectedQuiz?.id, "questions"] });
      toast({
        title: "Question Deleted",
        description: "Question has been deleted successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete question.",
        variant: "destructive"
      });
    }
  });

  // Handle drag and drop for question reordering
  const handleDragEnd = useCallback((result: any) => {
    if (!result.destination) return;

    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order values
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index + 1
    }));

    setQuestions(updatedItems);
  }, [questions]);

  // Add new question
  const addNewQuestion = () => {
    const newQuestion: QuestionForm = {
      quizId: quizForm.id || "",
      type: "multiple_choice",
      question: "",
      explanation: "",
      order: questions.length + 1,
      points: 1,
      required: true,
      options: [
        { optionText: "", isCorrect: true, order: 1, explanation: "" },
        { optionText: "", isCorrect: false, order: 2, explanation: "" }
      ]
    };
    setCurrentQuestion(newQuestion);
    setSelectedQuestionIndex(null);
    setActiveTab("questions");
  };

  // Edit existing question
  const editQuestion = (index: number) => {
    setCurrentQuestion(questions[index]);
    setSelectedQuestionIndex(index);
    setActiveTab("questions");
  };

  // Save current question
  const saveCurrentQuestion = () => {
    if (!quizForm.id) {
      toast({
        title: "Save Quiz First",
        description: "Please save the quiz before adding questions.",
        variant: "destructive"
      });
      return;
    }

    const questionToSave = {
      ...currentQuestion,
      quizId: quizForm.id
    };

    if (selectedQuestionIndex !== null) {
      // Update existing question
      const updatedQuestions = [...questions];
      updatedQuestions[selectedQuestionIndex] = questionToSave;
      setQuestions(updatedQuestions);
    } else {
      // Add new question
      setQuestions([...questions, questionToSave]);
    }

    saveQuestionMutation.mutate(questionToSave);
    
    // Reset form
    setCurrentQuestion({
      quizId: quizForm.id,
      type: "multiple_choice",
      question: "",
      explanation: "",
      order: questions.length + 2,
      points: 1,
      required: true,
      options: []
    });
    setSelectedQuestionIndex(null);
  };

  // Add option to current question
  const addOption = () => {
    setCurrentQuestion({
      ...currentQuestion,
      options: [
        ...currentQuestion.options,
        {
          optionText: "",
          isCorrect: false,
          order: currentQuestion.options.length + 1,
          explanation: ""
        }
      ]
    });
  };

  // Remove option from current question
  const removeOption = (index: number) => {
    const updatedOptions = currentQuestion.options.filter((_, i) => i !== index);
    setCurrentQuestion({
      ...currentQuestion,
      options: updatedOptions.map((opt, i) => ({ ...opt, order: i + 1 }))
    });
  };

  // Update option
  const updateOption = (index: number, field: keyof QuestionOptionForm, value: any) => {
    const updatedOptions = [...currentQuestion.options];
    updatedOptions[index] = { ...updatedOptions[index], [field]: value };
    
    // If setting this option as correct for multiple choice, make others incorrect
    if (field === 'isCorrect' && value && currentQuestion.type === 'multiple_choice') {
      updatedOptions.forEach((opt, i) => {
        if (i !== index) opt.isCorrect = false;
      });
    }
    
    setCurrentQuestion({
      ...currentQuestion,
      options: updatedOptions
    });
  };

  // Create new quiz
  const createNewQuiz = () => {
    setSelectedQuiz(null);
    setIsCreating(true);
    setQuizForm({
      courseId: "",
      title: "",
      description: "",
      instructions: "",
      timeLimit: 60,
      passingScore: 70,
      maxAttempts: 3,
      shuffleQuestions: false,
      shuffleAnswers: false,
      showResults: true,
      showCorrectAnswers: true,
      allowBackNavigation: true,
      requireAllQuestions: true,
      isActive: false
    });
    setQuestions([]);
    setActiveTab("basic");
  };

  // Preview quiz
  const previewQuiz = () => {
    if (!quizForm.id) {
      toast({
        title: "Save Quiz First",
        description: "Please save the quiz before previewing.",
        variant: "destructive"
      });
      return;
    }
    setIsPreviewMode(true);
  };

  // Render question type selector
  const renderQuestionTypeSelector = () => (
    <Select
      value={currentQuestion.type}
      onValueChange={(value: QuestionForm['type']) => 
        setCurrentQuestion({ 
          ...currentQuestion, 
          type: value,
          options: value === 'multiple_choice' ? [
            { optionText: "", isCorrect: true, order: 1, explanation: "" },
            { optionText: "", isCorrect: false, order: 2, explanation: "" }
          ] : value === 'true_false' ? [
            { optionText: "True", isCorrect: true, order: 1, explanation: "" },
            { optionText: "False", isCorrect: false, order: 2, explanation: "" }
          ] : []
        })
      }
    >
      <SelectTrigger data-testid="select-question-type">
        <SelectValue placeholder="Select question type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
        <SelectItem value="true_false">True/False</SelectItem>
        <SelectItem value="short_answer">Short Answer</SelectItem>
        <SelectItem value="essay">Essay</SelectItem>
      </SelectContent>
    </Select>
  );

  // Render question options editor
  const renderQuestionOptionsEditor = () => {
    if (currentQuestion.type === 'short_answer' || currentQuestion.type === 'essay') {
      return null;
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Answer Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentQuestion.options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg">
              <div className="flex items-center space-x-2">
                <input
                  type={currentQuestion.type === 'multiple_choice' ? 'radio' : 'checkbox'}
                  checked={option.isCorrect}
                  onChange={(e) => updateOption(index, 'isCorrect', e.target.checked)}
                  data-testid={`option-correct-${index}`}
                />
                <span className="text-sm text-muted-foreground">
                  {option.isCorrect ? 'Correct' : 'Incorrect'}
                </span>
              </div>
              <Input
                value={option.optionText}
                onChange={(e) => updateOption(index, 'optionText', e.target.value)}
                placeholder={`Option ${index + 1}`}
                className="flex-1"
                data-testid={`input-option-text-${index}`}
              />
              {currentQuestion.type === 'multiple_choice' && currentQuestion.options.length > 2 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeOption(index)}
                  data-testid={`button-remove-option-${index}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          
          {currentQuestion.type === 'multiple_choice' && currentQuestion.options.length < 6 && (
            <Button
              variant="outline"
              onClick={addOption}
              className="w-full"
              data-testid="button-add-option"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Option
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  // Check authorization
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user || user.role !== "admin")) {
      toast({
        title: "Access Denied",
        description: "Admin role required to access this page.",
        variant: "destructive"
      });
      setTimeout(() => {
        window.location.href = "/admin";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  if (isLoading || !user || user.role !== "admin") {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Quiz Builder</h1>
          <p className="text-muted-foreground">Create and manage interactive quizzes</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={createNewQuiz}
            data-testid="button-create-quiz"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Quiz
          </Button>
          {quizForm.id && (
            <Button
              variant="outline"
              onClick={previewQuiz}
              data-testid="button-preview-quiz"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Quiz List Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileQuestion className="h-5 w-5 mr-2" />
                Existing Quizzes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {isLoadingQuizzes ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : quizzes?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No quizzes yet</p>
                ) : (
                  quizzes?.map((quiz) => (
                    <Button
                      key={quiz.id}
                      variant={selectedQuiz?.id === quiz.id ? "default" : "ghost"}
                      className="w-full justify-start text-left"
                      onClick={() => {
                        setSelectedQuiz(quiz);
                        setIsCreating(false);
                      }}
                      data-testid={`button-select-quiz-${quiz.id}`}
                    >
                      <div className="truncate">
                        <div className="font-medium truncate">{quiz.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {quiz.isActive ? (
                            <Badge variant="default" className="text-xs">Active</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Draft</Badge>
                          )}
                        </div>
                      </div>
                    </Button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {(selectedQuiz || isCreating) ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic" data-testid="tab-basic">Basic Info</TabsTrigger>
                <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
                <TabsTrigger value="questions" data-testid="tab-questions">Questions</TabsTrigger>
                <TabsTrigger value="preview" data-testid="tab-preview">Preview</TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="course">Course</Label>
                        <Select
                          value={quizForm.courseId}
                          onValueChange={(value) => setQuizForm({ ...quizForm, courseId: value })}
                        >
                          <SelectTrigger data-testid="select-course">
                            <SelectValue placeholder="Select a course" />
                          </SelectTrigger>
                          <SelectContent>
                            {courses?.map((course) => (
                              <SelectItem key={course.id} value={course.id}>
                                {course.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="title">Quiz Title</Label>
                        <Input
                          id="title"
                          value={quizForm.title}
                          onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                          placeholder="Enter quiz title"
                          data-testid="input-quiz-title"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={quizForm.description}
                        onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                        placeholder="Enter quiz description"
                        rows={3}
                        data-testid="textarea-quiz-description"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instructions">Instructions</Label>
                      <Textarea
                        id="instructions"
                        value={quizForm.instructions}
                        onChange={(e) => setQuizForm({ ...quizForm, instructions: e.target.value })}
                        placeholder="Enter quiz instructions for students"
                        rows={3}
                        data-testid="textarea-quiz-instructions"
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={() => saveQuizMutation.mutate(quizForm)}
                        disabled={!quizForm.title || !quizForm.courseId || saveQuizMutation.isPending}
                        data-testid="button-save-quiz"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saveQuizMutation.isPending ? "Saving..." : "Save Quiz"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Settings className="h-5 w-5 mr-2" />
                      Quiz Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                        <Input
                          id="timeLimit"
                          type="number"
                          value={quizForm.timeLimit || ""}
                          onChange={(e) => setQuizForm({ 
                            ...quizForm, 
                            timeLimit: e.target.value ? parseInt(e.target.value) : undefined 
                          })}
                          placeholder="No limit"
                          data-testid="input-time-limit"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="passingScore">Passing Score (%)</Label>
                        <Input
                          id="passingScore"
                          type="number"
                          min="0"
                          max="100"
                          value={quizForm.passingScore}
                          onChange={(e) => setQuizForm({ 
                            ...quizForm, 
                            passingScore: parseInt(e.target.value) || 70 
                          })}
                          data-testid="input-passing-score"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="maxAttempts">Max Attempts</Label>
                        <Input
                          id="maxAttempts"
                          type="number"
                          value={quizForm.maxAttempts || ""}
                          onChange={(e) => setQuizForm({ 
                            ...quizForm, 
                            maxAttempts: e.target.value ? parseInt(e.target.value) : undefined 
                          })}
                          placeholder="Unlimited"
                          data-testid="input-max-attempts"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-medium">Question Settings</h4>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="shuffleQuestions">Shuffle Questions</Label>
                          <Switch
                            id="shuffleQuestions"
                            checked={quizForm.shuffleQuestions}
                            onCheckedChange={(checked) => setQuizForm({ 
                              ...quizForm, 
                              shuffleQuestions: checked 
                            })}
                            data-testid="switch-shuffle-questions"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="shuffleAnswers">Shuffle Answers</Label>
                          <Switch
                            id="shuffleAnswers"
                            checked={quizForm.shuffleAnswers}
                            onCheckedChange={(checked) => setQuizForm({ 
                              ...quizForm, 
                              shuffleAnswers: checked 
                            })}
                            data-testid="switch-shuffle-answers"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="allowBackNavigation">Allow Back Navigation</Label>
                          <Switch
                            id="allowBackNavigation"
                            checked={quizForm.allowBackNavigation}
                            onCheckedChange={(checked) => setQuizForm({ 
                              ...quizForm, 
                              allowBackNavigation: checked 
                            })}
                            data-testid="switch-back-navigation"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="requireAllQuestions">Require All Questions</Label>
                          <Switch
                            id="requireAllQuestions"
                            checked={quizForm.requireAllQuestions}
                            onCheckedChange={(checked) => setQuizForm({ 
                              ...quizForm, 
                              requireAllQuestions: checked 
                            })}
                            data-testid="switch-require-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">Results Settings</h4>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="showResults">Show Results</Label>
                          <Switch
                            id="showResults"
                            checked={quizForm.showResults}
                            onCheckedChange={(checked) => setQuizForm({ 
                              ...quizForm, 
                              showResults: checked 
                            })}
                            data-testid="switch-show-results"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="showCorrectAnswers">Show Correct Answers</Label>
                          <Switch
                            id="showCorrectAnswers"
                            checked={quizForm.showCorrectAnswers}
                            onCheckedChange={(checked) => setQuizForm({ 
                              ...quizForm, 
                              showCorrectAnswers: checked 
                            })}
                            data-testid="switch-show-correct"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="isActive">Quiz Active</Label>
                          <Switch
                            id="isActive"
                            checked={quizForm.isActive}
                            onCheckedChange={(checked) => setQuizForm({ 
                              ...quizForm, 
                              isActive: checked 
                            })}
                            data-testid="switch-is-active"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={() => saveQuizMutation.mutate(quizForm)}
                        disabled={saveQuizMutation.isPending}
                        data-testid="button-save-settings"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saveQuizMutation.isPending ? "Saving..." : "Save Settings"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Questions Tab */}
              <TabsContent value="questions" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Question List */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Questions ({questions.length})</CardTitle>
                        <Button
                          size="sm"
                          onClick={addNewQuestion}
                          disabled={!quizForm.id}
                          data-testid="button-add-question"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {questions.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No questions yet. Add your first question to get started.
                        </p>
                      ) : (
                        <DragDropContext onDragEnd={handleDragEnd}>
                          <Droppable droppableId="questions">
                            {(provided) => (
                              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                {questions.map((question, index) => (
                                  <Draggable key={question.id || index} draggableId={question.id || index.toString()} index={index}>
                                    {(provided) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                          selectedQuestionIndex === index ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                                        }`}
                                        onClick={() => editQuestion(index)}
                                        data-testid={`question-item-${index}`}
                                      >
                                        <div className="flex items-center space-x-2">
                                          <div {...provided.dragHandleProps}>
                                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2">
                                              <Badge variant="outline" className="text-xs">
                                                {question.type.replace('_', ' ')}
                                              </Badge>
                                              <span className="text-xs text-muted-foreground">
                                                {question.points} {question.points === 1 ? 'point' : 'points'}
                                              </span>
                                            </div>
                                            <p className="text-sm font-medium truncate mt-1">
                                              {question.question || 'Untitled Question'}
                                            </p>
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (question.id) {
                                                deleteQuestionMutation.mutate(question.id);
                                              }
                                              setQuestions(questions.filter((_, i) => i !== index));
                                            }}
                                            data-testid={`button-delete-question-${index}`}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </DragDropContext>
                      )}
                    </CardContent>
                  </Card>

                  {/* Question Editor */}
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>
                          {selectedQuestionIndex !== null ? 'Edit Question' : 'Add New Question'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Question Type</Label>
                            {renderQuestionTypeSelector()}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="points">Points</Label>
                            <Input
                              id="points"
                              type="number"
                              min="1"
                              value={currentQuestion.points}
                              onChange={(e) => setCurrentQuestion({
                                ...currentQuestion,
                                points: parseInt(e.target.value) || 1
                              })}
                              data-testid="input-question-points"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="question">Question</Label>
                          <Textarea
                            id="question"
                            value={currentQuestion.question}
                            onChange={(e) => setCurrentQuestion({
                              ...currentQuestion,
                              question: e.target.value
                            })}
                            placeholder="Enter your question"
                            rows={3}
                            data-testid="textarea-question-text"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="explanation">Explanation (Optional)</Label>
                          <Textarea
                            id="explanation"
                            value={currentQuestion.explanation}
                            onChange={(e) => setCurrentQuestion({
                              ...currentQuestion,
                              explanation: e.target.value
                            })}
                            placeholder="Explain the correct answer"
                            rows={2}
                            data-testid="textarea-question-explanation"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="required"
                            checked={currentQuestion.required}
                            onCheckedChange={(checked) => setCurrentQuestion({
                              ...currentQuestion,
                              required: checked
                            })}
                            data-testid="switch-question-required"
                          />
                          <Label htmlFor="required">Required Question</Label>
                        </div>

                        <div className="flex justify-between">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setCurrentQuestion({
                                quizId: quizForm.id || "",
                                type: "multiple_choice",
                                question: "",
                                explanation: "",
                                order: questions.length + 1,
                                points: 1,
                                required: true,
                                options: []
                              });
                              setSelectedQuestionIndex(null);
                            }}
                            data-testid="button-cancel-question"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={saveCurrentQuestion}
                            disabled={!currentQuestion.question || saveQuestionMutation.isPending}
                            data-testid="button-save-question"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            {saveQuestionMutation.isPending ? "Saving..." : "Save Question"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Question Options Editor */}
                    {renderQuestionOptionsEditor()}
                  </div>
                </div>
              </TabsContent>

              {/* Preview Tab */}
              <TabsContent value="preview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Eye className="h-5 w-5 mr-2" />
                      Quiz Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!quizForm.id ? (
                      <p className="text-center text-muted-foreground py-8">
                        Save the quiz first to see a preview.
                      </p>
                    ) : questions.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Add some questions to see a preview.
                      </p>
                    ) : (
                      <div className="space-y-6">
                        {/* Quiz Header */}
                        <div className="p-6 bg-muted/20 rounded-lg">
                          <h2 className="text-2xl font-bold mb-2">{quizForm.title}</h2>
                          {quizForm.description && (
                            <p className="text-muted-foreground mb-4">{quizForm.description}</p>
                          )}
                          {quizForm.instructions && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-l-4 border-blue-500">
                              <p className="text-sm">{quizForm.instructions}</p>
                            </div>
                          )}
                          <div className="flex items-center space-x-4 mt-4 text-sm text-muted-foreground">
                            {quizForm.timeLimit && (
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {quizForm.timeLimit} minutes
                              </div>
                            )}
                            <div className="flex items-center">
                              <FileQuestion className="h-4 w-4 mr-1" />
                              {questions.length} questions
                            </div>
                            <div className="flex items-center">
                              <Target className="h-4 w-4 mr-1" />
                              {quizForm.passingScore}% to pass
                            </div>
                          </div>
                        </div>

                        {/* Questions Preview */}
                        <div className="space-y-4">
                          {questions.map((question, index) => (
                            <Card key={index}>
                              <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                  <h3 className="text-lg font-medium">
                                    Question {index + 1}
                                  </h3>
                                  <Badge variant="outline">
                                    {question.points} {question.points === 1 ? 'point' : 'points'}
                                  </Badge>
                                </div>
                                
                                <p className="mb-4">{question.question}</p>
                                
                                {question.type === 'multiple_choice' && (
                                  <div className="space-y-2">
                                    {question.options.map((option, optIndex) => (
                                      <div 
                                        key={optIndex} 
                                        className={`p-3 border rounded-lg ${
                                          option.isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-950/30' : ''
                                        }`}
                                      >
                                        <div className="flex items-center space-x-2">
                                          <div className="w-4 h-4 border rounded-full flex items-center justify-center">
                                            {option.isCorrect && (
                                              <CheckCircle className="h-3 w-3 text-green-600" />
                                            )}
                                          </div>
                                          <span>{option.optionText}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {question.type === 'true_false' && (
                                  <div className="space-y-2">
                                    {question.options.map((option, optIndex) => (
                                      <div 
                                        key={optIndex}
                                        className={`p-3 border rounded-lg ${
                                          option.isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-950/30' : ''
                                        }`}
                                      >
                                        <div className="flex items-center space-x-2">
                                          <div className="w-4 h-4 border rounded-full flex items-center justify-center">
                                            {option.isCorrect && (
                                              <CheckCircle className="h-3 w-3 text-green-600" />
                                            )}
                                          </div>
                                          <span>{option.optionText}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {question.type === 'short_answer' && (
                                  <Input placeholder="Student would type their answer here..." disabled />
                                )}
                                
                                {question.type === 'essay' && (
                                  <Textarea 
                                    placeholder="Student would write their essay response here..." 
                                    rows={4} 
                                    disabled 
                                  />
                                )}
                                
                                {question.explanation && (
                                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-l-4 border-blue-500">
                                    <p className="text-sm"><strong>Explanation:</strong> {question.explanation}</p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Quiz Selected</h3>
                <p className="text-muted-foreground mb-4">
                  Select an existing quiz from the sidebar or create a new one to get started.
                </p>
                <Button onClick={createNewQuiz} data-testid="button-create-first-quiz">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Quiz
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}