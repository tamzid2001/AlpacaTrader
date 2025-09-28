import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Course, CourseEnrollment } from "@shared/schema";
import { CheckCircle, Crown, CreditCard, PlayCircle } from "lucide-react";

interface CourseCardProps {
  course: Course;
  onEnroll?: (courseId: string) => void;
  onPurchase?: (courseId: string) => void;
  showProgress?: boolean;
  progress?: number;
  enrollment?: CourseEnrollment;
  isAdmin?: boolean;
  userEmail?: string;
}

export default function CourseCard({ course, onEnroll, onPurchase, showProgress, progress, enrollment, isAdmin, userEmail }: CourseCardProps) {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'default';
      case 'intermediate': return 'secondary';
      case 'advanced': return 'destructive';
      default: return 'default';
    }
  };

  const formatPrice = (priceInCents: number) => {
    return (priceInCents / 100).toFixed(2);
  };

  const isEnrolled = !!enrollment;
  const isUserAdmin = isAdmin || userEmail === 'tamzid257@gmail.com';
  const hasAccess = isEnrolled || isUserAdmin;

  return (
    <Card className="course-card overflow-hidden hover:shadow-lg" data-testid={`card-course-${course.id}`}>
      <img 
        src={course.imageUrl || ""} 
        alt={course.title}
        className="w-full h-48 object-cover"
        data-testid={`img-course-${course.id}`}
      />
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <Badge 
            variant={getLevelColor(course.level)}
            data-testid={`badge-level-${course.id}`}
          >
            {course.level}
          </Badge>
          <span 
            className="text-muted-foreground text-sm"
            data-testid={`text-rating-${course.id}`}
          >
            {(course.rating || 0) / 10} ★
          </span>
        </div>
        <h3 
          className="text-xl font-semibold mb-2"
          data-testid={`text-course-title-${course.id}`}
        >
          {course.title}
        </h3>
        <p 
          className="text-muted-foreground mb-4"
          data-testid={`text-course-description-${course.id}`}
        >
          {course.description}
        </p>
        
        {showProgress && progress !== undefined && hasAccess && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Progress</span>
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
            <Progress 
              value={progress} 
              className="h-2"
              data-testid={`progress-course-${course.id}`}
            />
          </div>
        )}
        
        {/* Enrollment Status Indicator */}
        {hasAccess && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              {isUserAdmin && !isEnrolled ? (
                <>
                  <Crown className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                    Admin Access
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    Enrolled
                  </span>
                </>
              )}
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <span 
            className="text-foreground font-semibold"
            data-testid={`text-price-${course.id}`}
          >
            ${formatPrice(course.price || 0)}
          </span>
          
          {hasAccess ? (
            <Button 
              onClick={() => onEnroll?.(course.id)}
              className="hover:bg-primary/90 min-h-[44px]"
              data-testid={`button-continue-${course.id}`}
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              {showProgress ? "Continue" : "Start Course"}
            </Button>
          ) : (
            <Button 
              onClick={() => onPurchase?.(course.id)}
              className="hover:bg-primary/90 min-h-[44px]"
              data-testid={`button-purchase-${course.id}`}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Purchase
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
