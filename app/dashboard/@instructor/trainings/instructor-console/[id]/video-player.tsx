import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Maximize, Pause, Play, Settings, Volume2, VolumeX, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface VideoPlayerProps {
  src: string;
  onClose: () => void;
}

export function VideoPlayer({ src, onClose }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const enterFullscreen = () => {
    containerRef.current?.requestFullscreen();
  };

  const formatTime = (time: number) => {
    if (!time) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60)
      .toString()
      .padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  return (
    <Card className='border-border overflow-hidden'>
      <div ref={containerRef} className='relative bg-black'>
        {/* Close */}
        <button
          onClick={onClose}
          className='absolute top-3 right-3 z-50 rounded-full bg-black/60 p-2 text-white hover:bg-black/80'
        >
          <X className='h-5 w-5' />
        </button>

        {/* Video */}
        <video ref={videoRef} src={src} className='aspect-video w-full' onClick={togglePlay} />

        {/* Play overlay */}
        {!isPlaying && (
          <div className='absolute inset-0 flex items-center justify-center'>
            <button onClick={togglePlay} className='rounded-full bg-black/60 p-6'>
              <Play className='h-20 w-20 text-white opacity-80' />
            </button>
          </div>
        )}

        {/* Controls */}
        <div className='absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-4'>
          <div className='flex items-center gap-4'>
            <Button
              size='sm'
              variant='ghost'
              onClick={togglePlay}
              className='text-white hover:bg-white/20'
            >
              {isPlaying ? <Pause className='h-5 w-5' /> : <Play className='h-5 w-5' />}
            </Button>

            <span className='text-xs text-white/80'>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <Button
              size='sm'
              variant='ghost'
              onClick={toggleMute}
              className='text-white hover:bg-white/20'
            >
              {isMuted ? <VolumeX className='h-5 w-5' /> : <Volume2 className='h-5 w-5' />}
            </Button>

            <div className='flex-1' />

            <Button size='sm' variant='ghost' className='text-white hover:bg-white/20'>
              <Settings className='h-5 w-5' />
            </Button>

            <Button
              size='sm'
              variant='ghost'
              onClick={enterFullscreen}
              className='text-white hover:bg-white/20'
            >
              <Maximize className='h-5 w-5' />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
