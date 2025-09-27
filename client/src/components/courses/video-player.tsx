import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Lesson, CourseMaterial, UserProgress } from "@shared/schema";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Settings, 
  SkipBack, 
  SkipForward,
  Download,
  FileText,
  File,
  FileCode
} from "lucide-react";

interface VideoPlayerProps {
  lesson?: Lesson;
  courseId?: string;
  userId?: string;
  onLessonComplete?: () => void;
  onProgress?: (progress: number) => void;
}

export default function VideoPlayer({ 
  lesson, 
  courseId, 
  userId, 
  onLessonComplete, 
  onProgress 
}: VideoPlayerProps) {
  // Early return if no lesson data is provided
  if (!lesson) {
    return (
      <Card className="overflow-hidden" data-testid="card-video-player">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64 bg-secondary rounded-lg">
            <div className="text-center">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No lesson selected</p>
              <p className="text-sm text-muted-foreground mt-2">Select a course to start learning</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressUpdateRef = useRef<number>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);

  // Fetch user progress for this lesson
  const { data: userProgress } = useQuery<UserProgress>({
    queryKey: ["/api/user/progress", lesson?.id],
    queryFn: async () => {
      if (!courseId || !lesson?.id) {
        throw new Error('Missing required data for progress fetch');
      }
      const response = await fetch(`/api/user/progress/${courseId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch progress');
      const allProgress = await response.json();
      return allProgress.find((p: UserProgress) => p.lessonId === lesson.id);
    },
    enabled: !!userId && !!lesson?.id && !!courseId
  });

  // Fetch lesson materials
  const { data: materials } = useQuery<CourseMaterial[]>({
    queryKey: ["/api/lessons", lesson?.id, "materials"],
    queryFn: async () => {
      if (!lesson?.id) {
        throw new Error('Missing lesson ID for materials fetch');
      }
      const response = await fetch(`/api/lessons/${lesson.id}/materials`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch materials');
      return response.json();
    },
    enabled: !!lesson?.id
  });

  // Update video progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async ({ lastWatched, progressPercentage }: { lastWatched: number; progressPercentage: number }) => {
      if (!lesson?.id) {
        throw new Error('Missing lesson ID for progress update');
      }
      await apiRequest("POST", `/api/user/progress/${lesson.id}/video`, {
        lastWatched,
        progressPercentage
      });
    },
    onError: (error) => {
      console.error('Failed to update progress:', error);
    }
  });

  // Mark lesson complete mutation
  const completeLessonMutation = useMutation({
    mutationFn: async () => {
      if (!lesson?.id) {
        throw new Error('Missing lesson ID for completion');
      }
      await apiRequest("POST", `/api/user/progress/${lesson.id}/complete`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/progress"] });
      toast({
        title: "Lesson Completed!",
        description: "Great job! You've completed this lesson.",
      });
      onLessonComplete?.();
    },
    onError: (error) => {
      console.error('Failed to mark lesson complete:', error);
    }
  });

  // Download material mutation
  const downloadMaterialMutation = useMutation({
    mutationFn: async (materialId: string) => {
      const response = await apiRequest("GET", `/api/materials/${materialId}/download`);
      return response.json();
    },
    onSuccess: (data) => {
      window.open(data.downloadUrl, '_blank');
    },
    onError: () => {
      toast({
        title: "Download Failed",
        description: "Failed to download material. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Initialize video when user progress is loaded
  useEffect(() => {
    if (videoRef.current && userProgress?.lastWatched) {
      videoRef.current.currentTime = userProgress.lastWatched;
    }
  }, [userProgress]);

  // Auto-hide controls
  useEffect(() => {
    let hideTimer: NodeJS.Timeout;
    
    const resetHideTimer = () => {
      setShowControls(true);
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setShowControls(false), 3000);
    };

    if (isPlaying) {
      resetHideTimer();
      const container = containerRef.current;
      if (container) {
        container.addEventListener('mousemove', resetHideTimer);
        return () => {
          container.removeEventListener('mousemove', resetHideTimer);
          clearTimeout(hideTimer);
        };
      }
    }

    return () => clearTimeout(hideTimer);
  }, [isPlaying]);

  // Progress tracking
  useEffect(() => {
    if (isPlaying && videoRef.current) {
      progressUpdateRef.current = window.setInterval(() => {
        const video = videoRef.current;
        if (video && duration > 0) {
          const progress = (video.currentTime / duration) * 100;
          
          // Update progress in database every 10 seconds
          if (Math.floor(video.currentTime) % 10 === 0) {
            updateProgressMutation.mutate({
              lastWatched: video.currentTime,
              progressPercentage: Math.floor(progress)
            });
          }

          // Mark as complete if watched 90% or more
          if (progress >= 90 && !userProgress?.completed) {
            completeLessonMutation.mutate();
          }

          onProgress?.(progress);
        }
      }, 1000);

      return () => {
        if (progressUpdateRef.current) {
          clearInterval(progressUpdateRef.current);
        }
      };
    }
  }, [isPlaying, duration, userProgress?.completed]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      const newTime = (value[0] / 100) * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (videoRef.current) {
      const newVolume = value[0] / 100;
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500" />;
      case 'code':
        return <FileCode className="h-4 w-4 text-green-500" />;
      default:
        return <File className="h-4 w-4 text-blue-500" />;
    }
  };

  if (!lesson?.videoUrl) {
    return (
      <Card className="overflow-hidden" data-testid="card-video-player">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64 bg-secondary rounded-lg">
            <div className="text-center">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No video available for this lesson</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden" data-testid="card-video-player">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold" data-testid="text-lesson-title">
              {lesson?.title || 'Untitled Lesson'}
            </h3>
            {lesson?.description && (
              <p className="text-muted-foreground mt-1" data-testid="text-lesson-description">
                {lesson.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {userProgress?.completed && (
              <Badge className="bg-green-100 text-green-800" data-testid="badge-completed">
                Completed
              </Badge>
            )}
            <Badge variant="outline" data-testid="badge-duration">
              {lesson?.duration ? formatTime(lesson.duration) : 'N/A'}
            </Badge>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            {/* Video Player Container */}
            <div 
              ref={containerRef}
              className={`relative bg-black rounded-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : 'aspect-video'}`}
              data-testid="video-container"
            >
              <video
                ref={videoRef}
                src={lesson?.videoUrl}
                className="w-full h-full"
                poster={lesson?.thumbnailUrl || undefined}
                onLoadedMetadata={() => {
                  if (videoRef.current) {
                    setDuration(videoRef.current.duration);
                  }
                }}
                onTimeUpdate={() => {
                  if (videoRef.current) {
                    setCurrentTime(videoRef.current.currentTime);
                  }
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onWaiting={() => setIsBuffering(true)}
                onCanPlay={() => setIsBuffering(false)}
                data-testid="video-element"
              />

              {/* Video Controls */}
              <div className={`absolute inset-0 bg-gradient-to-t from-black/50 to-transparent transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <Slider
                      value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
                      onValueChange={handleSeek}
                      max={100}
                      step={0.1}
                      className="w-full"
                      data-testid="video-progress-slider"
                    />
                  </div>

                  {/* Control Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => skip(-10)}
                        className="text-white hover:bg-white/20"
                        data-testid="button-skip-back"
                      >
                        <SkipBack className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={togglePlay}
                        className="text-white hover:bg-white/20"
                        data-testid="button-play-pause"
                      >
                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => skip(10)}
                        className="text-white hover:bg-white/20"
                        data-testid="button-skip-forward"
                      >
                        <SkipForward className="h-4 w-4" />
                      </Button>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={toggleMute}
                          className="text-white hover:bg-white/20"
                          data-testid="button-mute"
                        >
                          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </Button>
                        <Slider
                          value={[isMuted ? 0 : volume * 100]}
                          onValueChange={handleVolumeChange}
                          max={100}
                          className="w-20"
                          data-testid="volume-slider"
                        />
                      </div>

                      <span className="text-white text-sm ml-4" data-testid="time-display">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={playbackRate}
                        onChange={(e) => changePlaybackRate(parseFloat(e.target.value))}
                        className="bg-black/50 text-white border border-white/20 rounded px-2 py-1 text-sm"
                        data-testid="playback-rate-select"
                      >
                        <option value={0.5}>0.5x</option>
                        <option value={0.75}>0.75x</option>
                        <option value={1}>1x</option>
                        <option value={1.25}>1.25x</option>
                        <option value={1.5}>1.5x</option>
                        <option value={2}>2x</option>
                      </select>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleFullscreen}
                        className="text-white hover:bg-white/20"
                        data-testid="button-fullscreen"
                      >
                        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Buffering Indicator */}
              {isBuffering && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
            </div>

            {/* Lesson Progress */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Lesson Progress</span>
                <span className="text-sm text-muted-foreground">
                  {userProgress?.progressPercentage || 0}%
                </span>
              </div>
              <Progress 
                value={userProgress?.progressPercentage || 0} 
                className="w-full"
                data-testid="lesson-progress"
              />
            </div>
          </div>

          {/* Course Materials */}
          <div>
            <h5 className="font-semibold mb-4" data-testid="text-materials-title">
              Course Materials
            </h5>
            <div className="space-y-3">
              {materials?.map((material) => (
                <div 
                  key={material.id}
                  className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getMaterialIcon(material.type)}
                    <div>
                      <span className="text-sm font-medium">{material.title}</span>
                      {material.fileSize && (
                        <span className="text-xs text-muted-foreground block">
                          {(material.fileSize / 1024 / 1024).toFixed(1)} MB
                        </span>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => downloadMaterialMutation.mutate(material.id)}
                    disabled={downloadMaterialMutation.isPending}
                    className="text-primary hover:text-primary/80"
                    data-testid={`button-download-material-${material.id}`}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              )) || (
                <div className="text-center py-4 text-muted-foreground">
                  No materials available
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}