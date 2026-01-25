import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Pause, Play, Settings, Volume2, X } from 'lucide-react';
import { useState } from 'react';

interface VideoPlayerProps {
    isOpen: boolean;
    onClose: () => void;
    videoUrl: string;
    title?: string;
    currentTime?: number;
    duration?: number;
}

export function VideoPlayer({
    isOpen,
    onClose,
    videoUrl,
    title,
    currentTime = 195, // 3:15 in seconds
    duration = 540, // 9:00 in seconds
}: VideoPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(true);
    const [volume, setVolume] = useState(100);
    const [showControls, setShowControls] = useState(true);

    if (!isOpen) return null;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progressPercentage = (currentTime / duration) * 100;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
            <div className="w-full h-full max-w-7xl">
                <div className="relative w-full h-full flex flex-col">
                    {/* Video Container */}
                    <div
                        className="flex-1 bg-black flex items-center justify-center relative"
                        onMouseEnter={() => setShowControls(true)}
                        onMouseMove={() => setShowControls(true)}
                        onMouseLeave={() => setShowControls(false)}
                    >
                        {/* Actual video iframe or video element */}
                        <iframe
                            src={videoUrl}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={title || 'Video player'}
                        />

                        {/* Play/Pause Overlay (center) */}
                        {!isPlaying && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="bg-black/50 rounded-full p-6">
                                    <Play className="h-16 w-16 sm:h-20 sm:w-20 text-white" />
                                </div>
                            </div>
                        )}

                        {/* Title Overlay (top) */}
                        {title && showControls && (
                            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 sm:p-6">
                                <h3 className="text-white text-sm sm:text-lg font-medium truncate">
                                    {title}
                                </h3>
                            </div>
                        )}
                    </div>

                    {/* Control Bar (bottom) */}
                    <div
                        className={`bg-black/90 p-3 sm:p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'
                            }`}
                    >
                        <div className="flex items-center gap-2 sm:gap-4">
                            {/* Play/Pause Button */}
                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10 p-0"
                                onClick={() => setIsPlaying(!isPlaying)}
                            >
                                {isPlaying ? (
                                    <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
                                ) : (
                                    <Play className="h-4 w-4 sm:h-5 sm:w-5" />
                                )}
                            </Button>

                            {/* Progress Bar */}
                            <div className="flex-1 flex items-center gap-2 sm:gap-3">
                                <Progress
                                    value={progressPercentage}
                                    className="h-1 sm:h-1.5 flex-1 cursor-pointer hover:h-2 transition-all"
                                />
                            </div>

                            {/* Time Display */}
                            <span className="text-xs sm:text-sm text-white whitespace-nowrap font-mono">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </span>

                            {/* Volume Button (hidden on mobile) */}
                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-white hover:bg-white/20 hidden sm:flex h-10 w-10 p-0"
                            >
                                <Volume2 className="h-5 w-5" />
                            </Button>

                            {/* Settings Button (hidden on mobile) */}
                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-white hover:bg-white/20 hidden md:flex h-10 w-10 p-0"
                            >
                                <Settings className="h-5 w-5" />
                            </Button>

                            {/* Close Button */}
                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10 p-0"
                                onClick={onClose}
                            >
                                <X className="h-4 w-4 sm:h-5 sm:w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}