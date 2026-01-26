import { Button } from '@/components/ui/button';
import { AlertCircle, Maximize, Minimize, Pause, Play, Volume2, VolumeX, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface VideoPlayerProps {
    isOpen: boolean;
    onClose: () => void;
    videoUrl: string;
    title?: string;
}

type VideoSource = 'youtube' | 'vimeo' | 'direct' | 'unsupported';

export function VideoPlayer({
    isOpen,
    onClose,
    videoUrl,
    title,
}: VideoPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(100);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [videoSource, setVideoSource] = useState<VideoSource>('unsupported');
    const [embedUrl, setEmbedUrl] = useState('');
    const [error, setError] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!videoUrl) {
            setVideoSource('unsupported');
            setError('No video URL provided');
            return;
        }

        setError(null);

        try {
            const url = new URL(videoUrl);

            // YouTube detection (regular, shorts, embed)
            if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
                let videoId = '';

                if (url.hostname.includes('youtu.be')) {
                    videoId = url.pathname.slice(1);
                } else if (url.pathname.includes('/shorts/')) {
                    videoId = url.pathname.split('/shorts/')[1]?.split('/')[0];
                } else if (url.pathname.includes('/embed/')) {
                    videoId = url.pathname.split('/embed/')[1]?.split('/')[0];
                } else {
                    videoId = url.searchParams.get('v') || '';
                }

                if (videoId) {
                    setEmbedUrl(`https://www.youtube.com/embed/${videoId}?autoplay=0&enablejsapi=1`);
                    setVideoSource('youtube');
                    return;
                }
            }

            // Vimeo detection
            if (url.hostname.includes('vimeo.com')) {
                const videoId = url.pathname.split('/').filter(Boolean)[0];
                if (videoId) {
                    setEmbedUrl(`https://player.vimeo.com/video/${videoId}?autoplay=0`);
                    setVideoSource('vimeo');
                    return;
                }
            }

            // Direct video file (mp4, webm, ogg, etc.)
            if (videoUrl.match(/\.(mp4|webm|ogg|mov)$/i) || url.hostname.includes('cloudflare') || url.hostname.includes('s3')) {
                setEmbedUrl(videoUrl);
                setVideoSource('direct');
                return;
            }

            // If we can't detect the source, try to play as direct
            setEmbedUrl(videoUrl);
            setVideoSource('direct');
        } catch (err) {
            setError('Invalid video URL');
            setVideoSource('unsupported');
        }
    }, [videoUrl]);

    // Video element controls
    useEffect(() => {
        const video = videoRef.current;
        if (!video || videoSource !== 'direct') return;

        const handleTimeUpdate = () => setCurrentTime(video.currentTime);
        const handleDurationChange = () => setDuration(video.duration);
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleError = () => {
            setError('Failed to load video. The format may not be supported.');
            setVideoSource('unsupported');
        };

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('durationchange', handleDurationChange);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('error', handleError);

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('durationchange', handleDurationChange);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('error', handleError);
        };
    }, [videoSource]);

    // Volume control
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = volume / 100;
            videoRef.current.muted = isMuted;
        }
    }, [volume, isMuted]);

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const togglePlayPause = () => {
        if (videoSource === 'direct' && videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
        }
        setIsPlaying(!isPlaying);
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (videoSource !== 'direct' || !videoRef.current) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        const newTime = percentage * duration;

        videoRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const toggleFullscreen = async () => {
        if (!containerRef.current) return;

        try {
            if (!isFullscreen) {
                await containerRef.current.requestFullscreen();
                setIsFullscreen(true);
            } else {
                await document.exitFullscreen();
                setIsFullscreen(false);
            }
        } catch (err) {
            console.error('Fullscreen error:', err);
        }
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    if (!isOpen) return null;

    // Empty state - no video URL
    if (!videoUrl) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
                <div className="text-center space-y-4 max-w-md p-8">
                    <div className="mx-auto w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center">
                        <Play className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">No Video Selected</h3>
                    <p className="text-muted-foreground">
                        Select a video to start playing
                    </p>
                    <Button onClick={onClose} variant="outline">
                        Close Player
                    </Button>
                </div>
            </div>
        );
    }

    // Error state - unsupported video
    if (error || videoSource === 'unsupported') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
                <div className="text-center space-y-4 max-w-md p-8">
                    <div className="mx-auto w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center">
                        <AlertCircle className="h-10 w-10 text-destructive" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Cannot Play Video</h3>
                    <p className="text-muted-foreground">
                        {error || 'This video format or source is not supported. Please try a different video.'}
                    </p>
                    <div className="text-xs text-muted-foreground/70 bg-muted/10 p-3 rounded-md break-all">
                        {videoUrl}
                    </div>
                    <Button onClick={onClose} variant="outline">
                        Close Player
                    </Button>
                </div>
            </div>
        );
    }

    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
            <div ref={containerRef} className="w-full h-full">
                <div className="relative w-full h-full flex flex-col">
                    {/* Video Container */}
                    <div
                        className="flex-1 bg-black flex items-center justify-center relative"
                        onMouseEnter={() => setShowControls(true)}
                        onMouseMove={() => setShowControls(true)}
                        onMouseLeave={() => setShowControls(false)}
                    >
                        {/* YouTube/Vimeo iframe */}
                        {(videoSource === 'youtube' || videoSource === 'vimeo') && (
                            <iframe
                                src={embedUrl}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title={title || 'Video player'}
                            />
                        )}

                        {/* Direct video element */}
                        {videoSource === 'direct' && (
                            <>
                                <video
                                    ref={videoRef}
                                    src={embedUrl}
                                    className="w-full h-full object-contain"
                                    onClick={togglePlayPause}
                                />

                                {/* Play/Pause Overlay (center) */}
                                {!isPlaying && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="bg-black/50 rounded-full p-6 backdrop-blur-sm">
                                            <Play className="h-16 w-16 sm:h-20 sm:w-20 text-white" />
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Title Overlay (top) */}
                        {title && showControls && (
                            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 sm:p-6">
                                <h3 className="text-white text-sm sm:text-lg font-medium truncate">
                                    {title}
                                </h3>
                            </div>
                        )}

                        {/* Close button (always visible) */}
                        <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-4 right-4 text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10 p-0 z-10"
                            onClick={onClose}
                        >
                            <X className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                    </div>

                    {/* Control Bar (bottom) - Only for direct videos */}
                    {videoSource === 'direct' && (
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
                                    onClick={togglePlayPause}
                                >
                                    {isPlaying ? (
                                        <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
                                    ) : (
                                        <Play className="h-4 w-4 sm:h-5 sm:w-5" />
                                    )}
                                </Button>

                                {/* Progress Bar */}
                                <div className="flex-1 flex items-center gap-2 sm:gap-3">
                                    <div
                                        className="flex-1 h-1 sm:h-1.5 bg-white/20 rounded-full cursor-pointer hover:h-2 transition-all relative"
                                        onClick={handleProgressClick}
                                    >
                                        <div
                                            className="h-full bg-primary rounded-full"
                                            style={{ width: `${progressPercentage}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Time Display */}
                                <span className="text-xs sm:text-sm text-white whitespace-nowrap font-mono">
                                    {formatTime(currentTime)} / {formatTime(duration)}
                                </span>

                                {/* Volume Button */}
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10 p-0"
                                    onClick={toggleMute}
                                >
                                    {isMuted || volume === 0 ? (
                                        <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" />
                                    ) : (
                                        <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                    )}
                                </Button>

                                {/* Fullscreen Button */}
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10 p-0"
                                    onClick={toggleFullscreen}
                                >
                                    {isFullscreen ? (
                                        <Minimize className="h-4 w-4 sm:h-5 sm:w-5" />
                                    ) : (
                                        <Maximize className="h-4 w-4 sm:h-5 sm:w-5" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Info for iframe videos */}
                    {(videoSource === 'youtube' || videoSource === 'vimeo') && showControls && (
                        <div className="bg-black/90 p-3 text-center">
                            <p className="text-xs text-muted-foreground">
                                Use the video player controls to play, pause, and adjust settings
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}