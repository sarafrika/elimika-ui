import { VideoPreviewModal } from '@/components/ui/video-preview-modal';

interface VideoPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title?: string;
}

/**
 * Compatibility wrapper for existing course and class detail consumers.
 * New consumers should use VideoPreviewModal directly.
 */
export function VideoPlayer({ isOpen, onClose, videoUrl, title }: VideoPlayerProps) {
  return (
    <VideoPreviewModal
      open={isOpen}
      onOpenChange={open => {
        if (!open) onClose();
      }}
      title={title}
      videoUrl={videoUrl}
    />
  );
}
