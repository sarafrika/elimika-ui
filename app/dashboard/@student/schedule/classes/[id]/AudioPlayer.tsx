import { Button } from '@/components/ui/button';
import {
    AlertCircle,
    Maximize,
    Minimize,
    Pause,
    Play,
    Volume2,
    VolumeX,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface AudioPlayerProps {
    isOpen: boolean;
    onClose: () => void;
    audioUrl: string;
    title?: string;
    description?: string;
}

type AudioSource = 'direct' | 'youtube' | 'unsupported';

export function AudioPlayer({ isOpen, onClose, audioUrl, title, description }: AudioPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(100);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [audioSource, setAudioSource] = useState<AudioSource>('unsupported');
    const [embedUrl, setEmbedUrl] = useState('');
    const [error, setError] = useState<string | null>(null);

    const audioRef = useRef<HTMLAudioElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!audioUrl) {
            setAudioSource('unsupported');
            setError('No audio URL provided');
            return;
        }

        setError(null);

        try {
            const url = new URL(audioUrl);

            // YouTube audio detection
            if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
                let videoId = '';

                if (url.hostname.includes('youtu.be')) {
                    videoId = url.pathname.slice(1);
                } else if (url.pathname.includes('/embed/')) {
                    videoId = url.pathname.split('/embed/')[1]?.split('/')[0];
                } else {
                    videoId = url.searchParams.get('v') || '';
                }

                if (videoId) {
                    setEmbedUrl(`https://www.youtube.com/embed/${videoId}?autoplay=0&enablejsapi=1`);
                    setAudioSource('youtube');
                    return;
                }
            }

            // Direct audio file (mp3, wav, ogg, m4a, flac, etc.)
            if (
                audioUrl.match(/\.(mp3|wav|ogg|m4a|flac|aac)$/i) ||
                url.hostname.includes('cloudflare') ||
                url.hostname.includes('s3') ||
                url.hostname.includes('storage')
            ) {
                setEmbedUrl(audioUrl);
                setAudioSource('direct');
                return;
            }

            // If we can't detect the source, try to play as direct
            setEmbedUrl(audioUrl);
            setAudioSource('direct');
        } catch (err) {
            setError('Invalid audio URL');
            setAudioSource('unsupported');
        }
    }, [audioUrl]);

    // Audio element controls
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || audioSource !== 'direct') return;

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleDurationChange = () => setDuration(audio.duration);
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleError = () => {
            setError('Failed to load audio. The format may not be supported.');
            setAudioSource('unsupported');
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('durationchange', handleDurationChange);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('error', handleError);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('durationchange', handleDurationChange);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('error', handleError);
        };
    }, [audioSource]);

    // Volume control
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume / 100;
            audioRef.current.muted = isMuted;
        }
    }, [volume, isMuted]);

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const togglePlayPause = () => {
        if (audioSource === 'direct' && audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
        }
        setIsPlaying(!isPlaying);
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (audioSource !== 'direct' || !audioRef.current) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        const newTime = percentage * duration;

        audioRef.current.currentTime = newTime;
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
            // Handle fullscreen request errors silently
        }
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    if (!isOpen) return null;

    // Empty state - no audio URL
    if (!audioUrl) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
                <div className="max-w-md space-y-4 p-8 text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted/20">
                        <Play className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">No Audio Selected</h3>
                    <p className="text-muted-foreground">Select an audio to start playing</p>
                    <Button onClick={onClose} variant="outline">
                        Close Player
                    </Button>
                </div>
            </div>
        );
    }

    // Error state - unsupported audio
    if (error || audioSource === 'unsupported') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
                <div className="max-w-md space-y-4 p-8 text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/20">
                        <AlertCircle className="h-10 w-10 text-destructive" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Cannot Play Audio</h3>
                    <p className="text-muted-foreground">
                        {error ||
                            'This audio format or source is not supported. Please try a different audio file.'}
                    </p>
                    <div className="break-all rounded-md bg-muted/10 p-3 text-xs text-muted-foreground/70">
                        {audioUrl}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
            <div
                ref={containerRef}
                className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-xl sm:p-8"
            >
                <div className="space-y-6">
                    {/* Header with close button */}
                    <div className="flex items-start justify-between">
                        <div className="flex-1 pr-4">
                            {title && (
                                <h3 className="truncate text-lg font-semibold text-foreground sm:text-xl">
                                    {title}
                                </h3>
                            )}
                            {description && (
                                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                    {description}
                                </p>
                            )}
                        </div>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 flex-shrink-0 text-muted-foreground hover:text-foreground"
                            onClick={onClose}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Audio Element (hidden) */}
                    {audioSource === 'direct' && <audio ref={audioRef} src={embedUrl} />}

                    {/* YouTube embed */}
                    {audioSource === 'youtube' && (
                        <div className="aspect-video overflow-hidden rounded-lg">
                            <iframe
                                src={embedUrl}
                                className="h-full w-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title={title || 'Audio player'}
                            />
                        </div>
                    )}

                    {/* Player visualization */}
                    {audioSource === 'direct' && (
                        <div className="flex items-center justify-center">
                            <div
                                className="rounded-full bg-gradient-to-br from-primary/20 to-primary/10 p-8 sm:p-12"
                                onMouseEnter={() => setShowControls(true)}
                                onMouseMove={() => setShowControls(true)}
                                onMouseLeave={() => setShowControls(false)}
                            >
                                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 sm:h-32 sm:w-32">
                                    {isPlaying ? (
                                        <Pause className="h-10 w-10 text-primary sm:h-14 sm:w-14" />
                                    ) : (
                                        <Play className="h-10 w-10 text-primary sm:h-14 sm:w-14" />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Playback Controls - Only for direct audio */}
                    {audioSource === 'direct' && (
                        <div className="space-y-4">
                            {/* Progress Bar */}
                            <div className="flex items-center gap-2 sm:gap-3">
                                <span className="font-mono text-xs whitespace-nowrap text-muted-foreground sm:text-sm">
                                    {formatTime(currentTime)}
                                </span>
                                <div
                                    className="relative h-2 flex-1 cursor-pointer rounded-full bg-muted transition-all hover:h-3 sm:h-2"
                                    onClick={handleProgressClick}
                                >
                                    <div
                                        className="h-full rounded-full bg-primary transition-all"
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                                <span className="font-mono text-xs whitespace-nowrap text-muted-foreground sm:text-sm">
                                    {formatTime(duration)}
                                </span>
                            </div>

                            {/* Control Buttons */}
                            <div className="flex items-center justify-center gap-2 sm:gap-4">
                                {/* Play/Pause Button */}
                                <Button
                                    size="lg"
                                    className="h-12 w-12 rounded-full p-0 sm:h-14 sm:w-14"
                                    onClick={togglePlayPause}
                                >
                                    {isPlaying ? (
                                        <Pause className="h-5 w-5 sm:h-6 sm:w-6" />
                                    ) : (
                                        <Play className="h-5 w-5 sm:h-6 sm:w-6" />
                                    )}
                                </Button>

                                {/* Volume Control */}
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground sm:h-10 sm:w-10"
                                        onClick={toggleMute}
                                    >
                                        {isMuted || volume === 0 ? (
                                            <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" />
                                        ) : (
                                            <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                        )}
                                    </Button>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={isMuted ? 0 : volume}
                                        onChange={(e) => {
                                            setVolume(Number(e.target.value));
                                            if (Number(e.target.value) > 0) setIsMuted(false);
                                        }}
                                        className="h-1 w-20 cursor-pointer accent-primary sm:w-24"
                                    />
                                </div>

                                {/* Fullscreen Button */}
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground sm:h-10 sm:w-10"
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

                    {/* Info for YouTube audio */}
                    {audioSource === 'youtube' && (
                        <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                            <p className="text-xs text-muted-foreground sm:text-sm">
                                Use the video player controls to play, pause, and adjust settings
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}