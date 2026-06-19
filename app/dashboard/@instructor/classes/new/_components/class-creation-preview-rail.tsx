'use client';

import {
  Banknote,
  CalendarDays,
  Clock3,
  Copy,
  Facebook,
  Globe,
  ImagePlus,
  Linkedin,
  Loader2,
  LucideIcon,
  Mail,
  MapPin,
  MessageCircleMore,
  MoreHorizontal,
  PenTool,
  TimerReset,
  Users,
  VideoIcon,
} from 'lucide-react';
import { useRef, useState, type ComponentType } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type PreviewSummaryItem = {
  icon: LucideIcon;
  label: string;
  value: string;
};

export type ClassCreationPreviewData = {
  classTitle: string;
  classTypeLabel: string;
  instructorName: string;
  lectureTypeLabel: string;
  locationName: string;
  scheduleLabel: string;
  timeLabel: string;
  totalHoursLabel: string;
  pricePerHourLabel: string;
  totalSessionsLabel: string;
  totalAmountLabel: string;
  meetingLink: string;
  inviteLink: string;
  classroom: string;
  thumbnailUrl: string;
  summaryItems?: PreviewSummaryItem[];
};

const shareButtons = [
  { icon: MessageCircleMore, label: 'WhatsApp', tone: 'text-success' },
  { icon: Facebook, label: 'Facebook', tone: 'text-primary' },
  { icon: Globe, label: 'X', tone: 'text-sky-500' },
  { icon: Linkedin, label: 'LinkedIn', tone: 'text-primary' },
  { icon: Mail, label: 'Email', tone: 'text-muted-foreground' },
  { icon: MoreHorizontal, label: 'More', tone: 'text-foreground' },
];

const CopyButton = ({ value }: { value: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Button
      type='button'
      variant='outline'
      size='icon'
      className='h-10 w-10 shrink-0 rounded-md'
      onClick={handleCopy}
      disabled={!value}
      aria-label='Copy link'
    >
      <Copy className='h-4 w-4' />
    </Button>
  );
};


export function ClassCreationPreviewRail({
  data,
  classUuid,
  onTitleChange,
  onUploadThumbnail,
  onUploadIntroVideo,
  isUploadingThumbnail,
  isUploadingIntroVideo,
}: {
  data: ClassCreationPreviewData;
  /** Present only after the class has actually been created/saved. */
  classUuid?: string | null;
  onTitleChange?: (value: string) => void;
  onUploadThumbnail?: (file: File) => void;
  onUploadIntroVideo?: (file: File) => void;
  isUploadingThumbnail?: boolean;
  isUploadingIntroVideo?: boolean;
}) {
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const classCreated = Boolean(classUuid);

  const handleThumbnailPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUploadThumbnail?.(file);
    e.target.value = '';
  };

  const handleVideoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUploadIntroVideo?.(file);
    e.target.value = '';
  };

  return (
    <aside className='space-y-4'>
      <Card className='border border-border pt-0 shadow-sm rounded-md'>
        <div className='bg-background flex flex-col gap-2 px-4 pt-4 sm:flex-row sm:items-center sm:justify-between'>
          <h3 className='text-foreground text-sm font-semibold sm:text-base'>Class Preview</h3>

          <div className='flex flex-wrap items-center gap-2'>
            <input
              ref={thumbnailInputRef}
              type='file'
              accept='image/*'
              className='hidden'
              onChange={handleThumbnailPick}
            />
            <input
              ref={videoInputRef}
              type='file'
              accept='video/*'
              className='hidden'
              onChange={handleVideoPick}
            />

            <Button
              type='button'
              variant='outline'
              size='sm'
              className='h-8 rounded-md text-xs'
              disabled={!classCreated || isUploadingThumbnail}
              onClick={() => thumbnailInputRef.current?.click()}
            >
              {isUploadingThumbnail ? (
                <Loader2 className='mr-1.5 h-3.5 w-3.5 animate-spin' />
              ) : (
                <ImagePlus className='mr-1.5 h-3.5 w-3.5' />
              )}
              Add Class Thumbnail
            </Button>

            <Button
              type='button'
              variant='outline'
              size='sm'
              className='h-8 rounded-md text-xs'
              disabled={!classCreated || isUploadingIntroVideo}
              onClick={() => videoInputRef.current?.click()}
            >
              {isUploadingIntroVideo ? (
                <Loader2 className='mr-1.5 h-3.5 w-3.5 animate-spin' />
              ) : (
                <VideoIcon className='mr-1.5 h-3.5 w-3.5' />
              )}
              Add Class Intro Video
            </Button>
          </div>
        </div>

        {!classCreated && (
          <p className='text-muted-foreground px-4 pt-2 text-[11px]'>
            Save or publish the class first to enable thumbnail and video uploads.
          </p>
        )}

        <div className='overflow-hidden rounded-md border border-primary/20 bg-background mt-3'>
          {/* HERO IMAGE */}
          <div className='relative h-[220px] w-full overflow-hidden'>
            {data?.thumbnailUrl ? (
              <img
                src={data.thumbnailUrl}
                alt={data.classTitle || 'Class thumbnail'}
                className='h-full w-full object-cover'
              />
            ) : (
              <div className='relative h-full w-full bg-gradient-to-br from-muted to-background'>
                <div className='absolute inset-0 flex items-center justify-center'>
                  <PenTool className='h-10 w-10 text-muted-foreground/40' />
                </div>
              </div>
            )}

            {/* OVERLAY */}
            <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10' />

            {/* TEXT CONTENT */}
            <div className='absolute inset-x-0 bottom-0 px-4 py-4 text-white'>
              <div className='mb-3 flex h-11 w-11 items-center justify-center rounded-md border border-white/20 bg-white/10 backdrop-blur-sm'>
                <PenTool className='h-5 w-5' />
              </div>

              {/* Inline editable title, click to type directly in the preview */}
              <input
                value={data.classTitle}
                onChange={e => onTitleChange?.(e.target.value)}
                placeholder='Class title'
                aria-label='Class title'
                className='w-full bg-transparent text-xl font-semibold leading-tight text-white placeholder:text-white/60 drop-shadow-sm outline-none focus:outline-none'
              />

              <div className='mt-2 flex flex-wrap items-center gap-2 text-sm text-white/90'>
                <span className='rounded-full bg-white/10 px-2 py-0.5 backdrop-blur-sm'>
                  {data.classTypeLabel}
                </span>

                <span className='rounded-full bg-white/10 px-2 py-0.5 backdrop-blur-sm'>
                  {data.lectureTypeLabel}
                </span>
              </div>
            </div>
          </div>

          <div className='divide-y bg-card'>
            <PreviewRow icon={Users} label='Instructor' value={data.instructorName || 'John Doe'} />
            <PreviewRow icon={Globe} label='Lecture Type' value={data.lectureTypeLabel} />
            <PreviewRow icon={MapPin} label='Location' value={data.locationName || 'Nairobi, Kenya'} />
            <PreviewRow icon={MapPin} label='Classroom' value={data.classroom || 'N/A'} />
            <PreviewRow icon={Clock3} label='Total Hours' value={data.totalHoursLabel} />
            <PreviewRow icon={TimerReset} label='Price per Hour' value={data.pricePerHourLabel} />
            <PreviewRow icon={CalendarDays} label='Total Classes' value={data.totalSessionsLabel} />
            <PreviewRow icon={Banknote} label='Total Amount' value={data.totalAmountLabel} />
          </div>

          {data.summaryItems?.length ? (
            <div className='divide-y bg-card'>
              {data.summaryItems.map(item => (
                <PreviewRow key={item.label} icon={item.icon} label={item.label} value={item.value} />
              ))}
            </div>
          ) : null}
        </div>
      </Card>

      <Card className='overflow-hidden border pt-0 shadow-sm rounded-md'>
        <div className='px-4 py-4'>
          <h3 className='text-foreground text-sm font-semibold sm:text-base'>Class Meeting Link</h3>
          <p className='text-muted-foreground mt-1 text-sm'>
            This link will be used by you and your students to join the class.
          </p>
          <div className='mt-4 flex gap-2'>
            <Input value={data.meetingLink} readOnly />
            <CopyButton value={data.meetingLink} />
          </div>
        </div>
      </Card>

      <Card className='overflow-hidden border pt-0 shadow-sm rounded-md'>
        <div className='px-4 py-4'>
          <div className='space-y-3'>
            <div>
              <h3 className='text-foreground text-sm font-semibold sm:text-base'>Class Invite Link</h3>
              <p className='text-muted-foreground mt-1 text-sm'>
                Available after the class is created. Share this link with students to invite them to join.
              </p>
            </div>

            <div className='flex gap-2'>
              <Input value={data.inviteLink} placeholder='Invite link will appear here' readOnly />
              <CopyButton value={data.inviteLink} />
            </div>
          </div>

          <div className='mt-4 space-y-3'>
            <p className='text-foreground text-sm font-semibold'>Share via</p>
            <div className='grid grid-cols-3 gap-2 sm:grid-cols-6'>
              {shareButtons.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type='button'
                    className='border-border hover:border-primary/50 hover:bg-primary/5 flex h-11 items-center justify-center rounded-md border bg-card transition'
                    aria-label={item.label}
                  >
                    <Icon className={cn('h-5 w-5', item.tone)} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
    </aside>
  );
}

export const PreviewRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) => (
  <div className='grid gap-2 px-4 py-2.5 sm:px-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center'>
    <div className='flex items-center gap-3'>
      <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
        <Icon className="h-4 w-4" />
      </div>
      <span className='text-muted-foreground text-sm font-medium'>{label}</span>
    </div>
    <div className='min-w-0 whitespace-pre-line break-all text-sm font-medium text-foreground md:text-right'>
      {value}
    </div>
  </div>
);
