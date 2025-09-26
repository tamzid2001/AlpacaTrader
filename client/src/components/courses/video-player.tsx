import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function VideoPlayer() {
  const downloadFile = (type: string) => {
    // In a real app, this would trigger actual file downloads
    const link = document.createElement('a');
    link.href = `/api/courses/1/${type}`;
    link.download = `course-material-${type}`;
    link.click();
  };

  return (
    <Card className="overflow-hidden" data-testid="card-video-player">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold" data-testid="text-video-title">
            Machine Learning for Finance - Chapter 4
          </h3>
          <Badge className="bg-primary/10 text-primary" data-testid="badge-new">
            New
          </Badge>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="bg-secondary rounded-lg p-4 mb-4 flex items-center justify-center h-64" data-testid="video-placeholder">
              <div className="text-center">
                <i className="fas fa-play-circle text-6xl text-primary mb-4"></i>
                <p className="text-muted-foreground">Click to play video</p>
              </div>
            </div>
            <h4 className="font-semibold mb-2" data-testid="text-video-description-title">
              Introduction to Neural Networks in Trading
            </h4>
            <p className="text-muted-foreground" data-testid="text-video-description">
              Learn how to implement neural networks for market prediction and automated trading strategies.
            </p>
          </div>
          <div>
            <h5 className="font-semibold mb-4" data-testid="text-materials-title">Course Materials</h5>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <i className="fas fa-file-video text-primary"></i>
                  <span className="text-sm">Video (1080p)</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => downloadFile('video')}
                  className="text-primary hover:text-primary/80"
                  data-testid="button-download-video"
                >
                  <i className="fas fa-download"></i>
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <i className="fas fa-file-pdf text-red-500"></i>
                  <span className="text-sm">Slides (PDF)</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => downloadFile('slides')}
                  className="text-primary hover:text-primary/80"
                  data-testid="button-download-slides"
                >
                  <i className="fas fa-download"></i>
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <i className="fas fa-file-code text-green-500"></i>
                  <span className="text-sm">Code Examples</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => downloadFile('code')}
                  className="text-primary hover:text-primary/80"
                  data-testid="button-download-code"
                >
                  <i className="fas fa-download"></i>
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <i className="fas fa-file-alt text-blue-500"></i>
                  <span className="text-sm">Reading List</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => downloadFile('documents')}
                  className="text-primary hover:text-primary/80"
                  data-testid="button-download-docs"
                >
                  <i className="fas fa-download"></i>
                </Button>
              </div>
            </div>
            <Button 
              className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-white"
              data-testid="button-take-quiz"
            >
              Take Quiz
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
