'use client';

import { useEffect, useId, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isAuthenticatedMediaUrl, toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { toast } from 'sonner';
import {
  MAX_VIDEO_SIZE_BYTES,
  MAX_VIDEO_SIZE_MB,
} from '../../../_components/course-creation-types';
import type { ProgramFormValues } from '../program-schema';
import type { PendingProgramMedia, ProgramMediaKey } from '../save-program-media';

const MEDIA = [
  { key: 'thumbnail', name: 'thumbnailUrl', label: 'Program thumbnail', accept: 'image/*' },
  { key: 'banner', name: 'bannerUrl', label: 'Program banner', accept: 'image/*' },
  { key: 'intro_video', name: 'videoUrl', label: 'Intro video', accept: 'video/*' },
] as const;

export function ProgramMediaUpload({
  files,
  onSelect,
}: {
  files: PendingProgramMedia;
  onSelect: (key: ProgramMediaKey, file?: File) => void;
}) {
  return (
    <section className='space-y-3' aria-label='Program media'>
      <h3 className='text-sm font-medium'>Media</h3>
      <p className='text-muted-foreground text-xs'>
        Choose or replace your program media. Selected files upload when you save and continue from
        Branding.
      </p>
      <div className='grid gap-4 md:grid-cols-3'>
        {MEDIA.map(media => (
          <MediaPicker key={media.key} media={media} file={files[media.key]} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}

function MediaPicker({
  media,
  file,
  onSelect,
}: {
  media: (typeof MEDIA)[number];
  file?: File;
  onSelect: (key: ProgramMediaKey, file?: File) => void;
}) {
  const id = useId();
  const { control } = useFormContext<ProgramFormValues>();
  const existingUrl = useWatch({ control, name: media.name });
  const [preview, setPreview] = useState<string>();
  useEffect(() => {
    if (!file) {
      setPreview(undefined);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const source = toAuthenticatedMediaUrl(preview ?? existingUrl);
  const isVideo = media.key === 'intro_video';
  return (
    <div className='min-w-0 space-y-3'>
      <Label htmlFor={id}>{media.label}</Label>
      {source && (
        <div className='border-border bg-muted relative aspect-video overflow-hidden rounded-md border'>
          {isVideo ? (
            <video
              src={source}
              controls
              preload='metadata'
              className='h-full w-full object-contain'
            >
              <track kind='captions' />
            </video>
          ) : (
            <Image
              src={source}
              alt={`${media.label} preview`}
              fill
              unoptimized={!isAuthenticatedMediaUrl(source)}
              sizes='(min-width: 768px) 33vw, 100vw'
              className='object-cover'
            />
          )}
        </div>
      )}
      <Input
        id={id}
        type='file'
        accept={media.accept}
        aria-label={
          source ? `Replace ${media.label.toLowerCase()}` : `Upload ${media.label.toLowerCase()}`
        }
        onChange={event => {
          const selected = event.target.files?.[0];
          event.target.value = '';
          if (!selected) return;
          if (!selected.type.startsWith(isVideo ? 'video/' : 'image/')) {
            toast.error(`Choose ${isVideo ? 'a video' : 'an image'} file.`);
            return;
          }
          if (isVideo && selected.size > MAX_VIDEO_SIZE_BYTES) {
            toast.error(`Video too large. Max size: ${MAX_VIDEO_SIZE_MB}MB.`);
            return;
          }
          onSelect(media.key, selected);
        }}
      />
      {file && (
        <div className='space-y-1'>
          <p className='text-muted-foreground truncate text-xs' title={file.name}>
            {file.name} — ready to upload
          </p>
          <Button type='button' variant='outline' size='sm' onClick={() => onSelect(media.key)}>
            Cancel selection
          </Button>
        </div>
      )}
      {isVideo && (
        <p className='text-muted-foreground text-xs'>Maximum video size: {MAX_VIDEO_SIZE_MB}MB.</p>
      )}
    </div>
  );
}
