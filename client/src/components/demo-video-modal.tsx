import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Play, Pause, Volume2, Maximize } from 'lucide-react';

interface DemoVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoVideoModal = ({ isOpen, onClose }: DemoVideoModalProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 bg-black">
        <DialogHeader className="absolute top-4 right-4 z-10">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
            data-testid="button-close-demo"
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>
        
        <div className="relative w-full aspect-video bg-gradient-to-br from-primary/20 to-secondary/20">
          {/* Professional Demo Video Player */}
          <div className="absolute inset-0 flex items-center justify-center">
            {!isPlaying ? (
              <div className="text-center">
                <Button
                  size="lg"
                  onClick={() => setIsPlaying(true)}
                  className="bg-white/20 hover:bg-white/30 text-white border-2 border-white/50 rounded-full p-6 mb-4"
                  data-testid="button-play-demo"
                >
                  <Play className="w-8 h-8" />
                </Button>
                <h3 className="text-xl font-semibold text-white mb-2">
                  MarketDifferentials Platform Demo
                </h3>
                <p className="text-white/80">
                  See how to download market data, analyze CSV files, and build ML models
                </p>
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                {/* Simulated video content - replace with actual video */}
                <div className="text-center text-white">
                  <div className="animate-pulse mb-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full mx-auto flex items-center justify-center mb-4">
                      <Pause className="w-8 h-8" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Demo Video Playing</h3>
                  <p className="text-lg">Interactive platform walkthrough...</p>
                  <div className="mt-6 flex items-center justify-center gap-4">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-white hover:bg-white/20"
                      onClick={() => setIsPlaying(false)}
                      data-testid="button-pause-demo"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-white hover:bg-white/20"
                      data-testid="button-volume-demo"
                    >
                      <Volume2 className="w-4 h-4 mr-2" />
                      Volume
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-white hover:bg-white/20"
                      data-testid="button-fullscreen-demo"
                    >
                      <Maximize className="w-4 h-4 mr-2" />
                      Fullscreen
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};