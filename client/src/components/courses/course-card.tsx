import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Course } from "@shared/schema";

interface CourseCardProps {
  course: Course;
  onEnroll?: (courseId: string) => void;
  showProgress?: boolean;
  progress?: number;
}

export default function CourseCard({ course, onEnroll, showProgress, progress }: CourseCardProps) {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'default';
      case 'intermediate': return 'secondary';
      case 'advanced': return 'destructive';
      default: return 'default';
    }
  };

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
        
        {showProgress && progress !== undefined && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Progress</span>
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <span 
            className="text-foreground font-semibold"
            data-testid={`text-price-${course.id}`}
          >
            ${course.price}
          </span>
          <Button 
            onClick={() => onEnroll?.(course.id)}
            className="hover:bg-primary/90"
            data-testid={`button-enroll-${course.id}`}
          >
            {showProgress ? "Continue" : "Enroll Now"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
