'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileVideo, Image, X } from 'lucide-react';
import { useRef, useState } from 'react';

export interface MediaFile {
  type: 'thumbnail' | 'video';
  file: File;
  preview?: string;
}

interface ClassMediaUploadProps {
  onMediaSelect: (media: MediaFile) => void;
  selectedThumbnail?: File | null;
  selectedVideo?: File | null;
  onRemoveThumbnail?: () => void;
  onRemoveVideo?: () => void;
}

export function ClassMediaUpload({
  onMediaSelect,
  selectedThumbnail,
  selectedVideo,
  onRemoveThumbnail,
  onRemoveVideo,
}: ClassMediaUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const preview = event.target?.result as string;
        setThumbnailPreview(preview);
      };
      reader.readAsDataURL(file);
      onMediaSelect({ type: 'thumbnail', file });
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const preview = event.target?.result as string;
        setVideoPreview(preview);
      };
      reader.readAsDataURL(file);
      onMediaSelect({ type: 'video', file });
    }
  };

  const handleRemoveThumbnail = () => {
    setThumbnailPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onRemoveThumbnail?.();
  };

  const handleRemoveVideo = () => {
    setVideoPreview(null);
    if (videoInputRef.current) videoInputRef.current.value = '';
    onRemoveVideo?.();
  };

  return (
    <Card className='overflow-hidden border pt-0 shadow-sm rounded-md'>
      <div className='flex items-center justify-between gap-3 px-2 pt-4 sm:px-4'>
        <h3 className='text-foreground text-lg font-semibold'>Class Media</h3>
        <p className='text-muted-foreground text-xs sm:text-sm'>Optional - Upload before publishing</p>
      </div>

      <div className='space-y-4 px-2 pb-4 sm:px-4 sm:pb-6'>
        <p className='text-muted-foreground text-xs'>
          Add a class thumbnail and promotional video. You can upload these before or after creating the class.
        </p>

        <div className='grid gap-4 md:grid-cols-2'>
          {/* Thumbnail Upload */}
          <div className='space-y-3'>
            <label className='text-foreground text-sm font-semibold'>Class Thumbnail</label>
            {thumbnailPreview || selectedThumbnail ? (
              <div className='relative overflow-hidden rounded-lg border border-border bg-muted'>
                {thumbnailPreview ? (
                  <img
                    src={thumbnailPreview}
                    alt='Thumbnail preview'
                    className='aspect-video w-full object-cover'
                  />
                ) : (
                  <div className='bg-muted/50 flex aspect-video items-center justify-center'>
                    <Image className='text-muted-foreground h-8 w-8' />
                  </div>
                )}
                <button
                  type='button'
                  onClick={handleRemoveThumbnail}
                  className='absolute right-2 top-2 rounded-full bg-destructive/90 p-1.5 text-white hover:bg-destructive'
                >
                  <X className='h-4 w-4' />
                </button>
                <p className='text-muted-foreground absolute bottom-2 left-2 text-xs'>
                  {selectedThumbnail?.name || 'Image selected'}
                </p>
              </div>
            ) : (
              <button
                type='button'
                onClick={() => fileInputRef.current?.click()}
                className='flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/60 py-6 transition hover:border-primary/50 hover:bg-accent/30'
              >
                <Image className='text-muted-foreground mb-2 h-8 w-8' />
                <p className='text-muted-foreground text-xs font-medium'>
                  Click to upload image
                </p>
                <p className='text-muted-foreground text-[10px]'>PNG, JPG up to 10MB</p>
              </button>
            )}
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              onChange={handleThumbnailSelect}
              className='hidden'
            />
          </div>

          {/* Video Upload */}
          <div className='space-y-3'>
            <label className='text-foreground text-sm font-semibold'>Promotional Video</label>
            {videoPreview || selectedVideo ? (
              <div className='relative overflow-hidden rounded-lg border border-border bg-muted'>
                {videoPreview ? (
                  <video
                    src={videoPreview}
                    className='aspect-video w-full object-cover'
                    controls
                  />
                ) : (
                  <div className='bg-muted/50 flex aspect-video items-center justify-center'>
                    <FileVideo className='text-muted-foreground h-8 w-8' />
                  </div>
                )}
                <button
                  type='button'
                  onClick={handleRemoveVideo}
                  className='absolute right-2 top-2 rounded-full bg-destructive/90 p-1.5 text-white hover:bg-destructive'
                >
                  <X className='h-4 w-4' />
                </button>
                <p className='text-muted-foreground absolute bottom-2 left-2 text-xs'>
                  {selectedVideo?.name || 'Video selected'}
                </p>
              </div>
            ) : (
              <button
                type='button'
                onClick={() => videoInputRef.current?.click()}
                className='flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/60 py-6 transition hover:border-primary/50 hover:bg-accent/30'
              >
                <FileVideo className='text-muted-foreground mb-2 h-8 w-8' />
                <p className='text-muted-foreground text-xs font-medium'>
                  Click to upload video
                </p>
                <p className='text-muted-foreground text-[10px]'>MP4, WebM up to 100MB</p>
              </button>
            )}
            <input
              ref={videoInputRef}
              type='file'
              accept='video/*'
              onChange={handleVideoSelect}
              className='hidden'
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
