import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useSubmitQuizResult } from "@/hooks/use-courses";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizTitle?: string;
  courseId?: string;
}

// Sample quiz data - in a real app this would come from the API
const sampleQuestions: QuizQuestion[] = [
  {
    id: "1",
    question: "What is the primary advantage of using LSTM networks for time series prediction in financial markets?",
    options: [
      "They can handle vanishing gradient problems better than traditional RNNs",
      "They require less computational power than other neural networks",
      "They always provide 100% accurate predictions",
      "They can only be used for stock price prediction"
    ],
    correctAnswer: 0
  },
  {
    id: "2", 
    question: "Which activation function is commonly used in the output layer for binary classification in trading signals?",
    options: [
      "ReLU",
      "Sigmoid", 
      "Tanh",
      "Linear"
    ],
    correctAnswer: 1
  },
  {
    id: "3",
    question: "What is the main purpose of dropout layers in neural networks for financial modeling?",
    options: [
      "To increase training speed",
      "To reduce model complexity",
      "To prevent overfitting",
      "To improve gradient flow"
    ],
    correctAnswer: 2
  },
  {
    id: "4",
    question: "In backtesting trading strategies, what does the Sharpe ratio measure?",
    options: [
      "Total return of the strategy",
      "Risk-adjusted return of the strategy", 
      "Maximum drawdown of the strategy",
      "Win rate of the strategy"
    ],
    correctAnswer: 1
  },
  {
    id: "5",
    question: "Which of the following is NOT a common feature engineering technique for financial time series data?",
    options: [
      "Moving averages",
      "Technical indicators (RSI, MACD)",
      "Price differencing",
      "Random noise injection"
    ],
    correctAnswer: 3
  }
];

export default function QuizModal({ isOpen, onClose, quizTitle = "Chapter 4 Quiz: Neural Networks", courseId }: QuizModalProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [showResults, setShowResults] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes
  
  const { user } = useAuth();
  const { toast } = useToast();
  const submitQuizMutation = useSubmitQuizResult();

  const currentQuestionData = sampleQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / sampleQuestions.length) * 100;

  const handleAnswerChange = (value: string) => {
    setSelectedAnswer(value);
  };

  const handleNext = () => {
    if (selectedAnswer) {
      setAnswers(prev => ({
        ...prev,
        [currentQuestionData.id]: selectedAnswer
      }));
      
      if (currentQuestion < sampleQuestions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer("");
      } else {
        // Quiz completed
        submitQuiz();
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      // Load previous answer if exists
      const prevAnswer = answers[sampleQuestions[currentQuestion - 1].id];
      setSelectedAnswer(prevAnswer || "");
    }
  };

  const submitQuiz = () => {
    // Calculate score
    let score = 0;
    sampleQuestions.forEach(question => {
      const userAnswer = answers[question.id];
      if (userAnswer && parseInt(userAnswer) === question.correctAnswer) {
        score++;
      }
    });

    // Submit to backend
    if (user && courseId) {
      submitQuizMutation.mutate({
        userId: user.id,
        quizId: `quiz-${courseId}-1`, // In real app, this would be dynamic
        score,
        totalQuestions: sampleQuestions.length,
        answers: Object.values(answers).map(a => parseInt(a))
      });
    }

    setShowResults(true);
    toast({
      title: "Quiz Completed!",
      description: `You scored ${score}/${sampleQuestions.length} (${Math.round((score/sampleQuestions.length) * 100)}%)`,
    });
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setSelectedAnswer("");
    setShowResults(false);
    setTimeRemaining(600);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (showResults) {
    const score = sampleQuestions.reduce((acc, question) => {
      const userAnswer = answers[question.id];
      return acc + (userAnswer && parseInt(userAnswer) === question.correctAnswer ? 1 : 0);
    }, 0);
    
    const percentage = Math.round((score / sampleQuestions.length) * 100);

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl" data-testid="modal-quiz-results">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold">Quiz Results</DialogTitle>
            <DialogDescription className="text-center">
              View your quiz performance and continue your learning journey.
            </DialogDescription>
          </DialogHeader>
          
          <div className="text-center py-8">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-3xl font-bold text-primary" data-testid="text-score-percentage">
                {percentage}%
              </span>
            </div>
            
            <h3 className="text-xl font-semibold mb-2" data-testid="text-results-title">
              {percentage >= 80 ? "Excellent Work!" : percentage >= 60 ? "Good Job!" : "Keep Learning!"}
            </h3>
            
            <p className="text-muted-foreground mb-6" data-testid="text-score-details">
              You scored {score} out of {sampleQuestions.length} questions correctly
            </p>
            
            <div className="flex gap-4 justify-center">
              <Button onClick={resetQuiz} variant="outline" data-testid="button-retake-quiz">
                Retake Quiz
              </Button>
              <Button onClick={onClose} data-testid="button-continue-learning">
                Continue Learning
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="modal-quiz">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold" data-testid="text-quiz-title">
              {quizTitle}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-quiz">
              <i className="fas fa-times"></i>
            </Button>
          </div>
          <DialogDescription>
            Test your knowledge with this interactive quiz. Select the best answer for each question and track your progress.
          </DialogDescription>
        </DialogHeader>

        {/* Progress Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground" data-testid="text-question-progress">
              Question {currentQuestion + 1} of {sampleQuestions.length}
            </span>
            <span className="text-sm text-muted-foreground" data-testid="text-time-remaining">
              Time: {formatTime(timeRemaining)}
            </span>
          </div>
          <Progress value={progress} className="h-2" data-testid="progress-quiz" />
        </div>

        {/* Question Content */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-6" data-testid="text-question">
              {currentQuestionData.question}
            </h3>
            
            <RadioGroup value={selectedAnswer} onValueChange={handleAnswerChange}>
              <div className="space-y-3">
                {currentQuestionData.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <RadioGroupItem 
                      value={index.toString()} 
                      id={`option-${index}`}
                      data-testid={`radio-option-${index}`}
                    />
                    <Label 
                      htmlFor={`option-${index}`} 
                      className="flex-1 p-4 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      data-testid={`label-option-${index}`}
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            data-testid="button-previous"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Previous
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!selectedAnswer}
            data-testid="button-next"
          >
            {currentQuestion === sampleQuestions.length - 1 ? (
              <>
                Submit Quiz
                <i className="fas fa-check ml-2"></i>
              </>
            ) : (
              <>
                Next Question
                <i className="fas fa-arrow-right ml-2"></i>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
