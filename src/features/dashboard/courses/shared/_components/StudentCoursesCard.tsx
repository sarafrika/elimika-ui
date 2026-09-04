'use client';

import { ImageWithFallback } from '@/components/data/image-with-fallback';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CoursesCatalogCardData } from '@/src/features/dashboard/courses/shared/_components/courses-data';
import { isAuthenticatedMediaUrl, toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import {
  CalendarDays,
  Clock,
  GraduationCap,
  Layers,
  PiggyBank,
  Play,
  Search,
  Star,
  UserCheck,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Badge } from '../../../../../../components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader
} from '../../../../../../components/ui/card';
import { CourseDetailsSheet } from './CourseDetailsSheet';
import { CourseVideoPreviewModal } from './CourseVideoPreviewModal';

type StudentCoursesCardProps = {
  card: CoursesCatalogCardData;
  type: string;
  onOpenDetails: (card: CoursesCatalogCardData) => void;
  onPrimaryAction?: (card: CoursesCatalogCardData) => void;
};

const imageToneClasses = {
  primary: 'bg-gradient-to-br from-primary/20 via-primary/10 to-background',
  success: 'bg-gradient-to-br from-success/20 via-success/10 to-background',
  warning: 'bg-gradient-to-br from-warning/20 via-warning/10 to-background',
} as const;

const ctaToneClasses: Record<NonNullable<CoursesCatalogCardData['ctaTone']>, string> = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  pending:
    'border border-[color:var(--warning)] bg-[color:var(--warning)] text-[color:var(--warning-foreground)] hover:brightness-95 disabled:opacity-100',
  approved:
    'border border-[color:var(--success)] bg-[color:var(--success)] text-[color:var(--success-foreground)] hover:brightness-95 disabled:opacity-100',
  revoked:
    'border border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-100',
};

const levelStyles: Record<string, string> = {
  prep: 'bg-success/5 text-success border-success/20 border',
  beginner: 'bg-success/5 text-success border-success/20 border',
  intermediate: 'bg-warning/5 text-warning border-warning/20 border',
  advanced: 'bg-primary/5 text-primary border-primary/20 border',
};

export function StudentCoursesCard({
  card,
  type,
  onOpenDetails,
  onPrimaryAction,
}: StudentCoursesCardProps) {
  const imageUrl = toAuthenticatedMediaUrl(card.imageUrl);
  const resolvedVideoUrl = toAuthenticatedMediaUrl(card.videoUrl);
  const isLoading = !card.provider;

  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [videoPreviewOpen, setVideoPreviewOpen] = useState(false);
  const hasVideoPreview = Boolean(resolvedVideoUrl);

  return (
    <div className="h-full">
      <Card
        onClick={() => {
          if (open) {
            return;
          }

          setSelectedId(card.id);
          setOpen(true);
          onOpenDetails(card);
        }}
        className="flex h-full min-h-[520px] cursor-pointer flex-col overflow-hidden pt-0 transition hover:border-primary/40 hover:shadow-md gap-0"
      >
        {/* Cover */}
        <div className="relative h-40 w-full shrink-0 overflow-hidden">
          <ImageWithFallback
            src={imageUrl}
            alt={card.title || 'Course'}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            unoptimized={isAuthenticatedMediaUrl(imageUrl)}
            fallback={
              <div
                className={cn(
                  'flex h-full w-full items-center justify-center',
                  imageToneClasses[card.imageTone]
                )}
              >
                <card.icon className="text-muted-foreground h-10 w-10" />
              </div>
            }
          />
          {hasVideoPreview ? (
            <Button
              type="button"
              size="icon"
              variant="secondary"
              aria-label={`Preview ${card.title || 'course'}`}
              className='border-border bg-background/90 text-foreground hover:bg-background absolute right-3 bottom-3 z-10 h-10 w-10 rounded-full border shadow-md backdrop-blur-md'
              onClick={e => {
                e.stopPropagation();
                setVideoPreviewOpen(true);
              }}
            >
              <Play className='size-4' />
            </Button>
          ) : null}
        </div>

        {/* Header */}
        <CardHeader className='flex min-h-[168px] flex-col gap-0 pt-4'>
          {/* Badges */}
          <div className='min-h-[28px]'>
            <div className='flex max-h-[52px] flex-wrap content-start gap-1 overflow-hidden'>
              {card?.categoryNames?.length! > 0 &&
                card?.categoryNames?.map(category => (
                  <Badge key={category} variant='secondary'>
                    {category}
                  </Badge>
                ))}

              <Badge
                variant='outline'
                className={cn(
                  levelStyles[card.secondaryMeta?.toLowerCase()] ??
                  'bg-muted text-muted-foreground'
                )}
              >
                {card.secondaryMeta ?? ''}
              </Badge>

              {card.skillsFundEligible && (
                <Badge className='bg-success/90 hover:bg-success/70'>
                  <PiggyBank className='mr-1 h-3 w-3' />
                  Skills Fund
                </Badge>
              )}
            </div>
          </div>

          {/* Title */}
          <div className='mt-3 min-h-[56px]'>
            <div className='line-clamp-2 text-lg font-semibold leading-7 tracking-tight text-foreground'>
              {card.title || 'Untitled Course'}
            </div>
          </div>

          {/* Description */}
          <div className='mt-1 min-h-[40px]'>
            <div className='line-clamp-2 text-sm leading-5 text-muted-foreground'>
              {card.description || 'No description available.'}
            </div>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="mt-auto flex flex-1 flex-col pb-3">
          {/* Metadata */}
          <div className="grid min-h-[60px] grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
            <div className="flex min-w-0 items-center gap-1">
              <Star className="h-3.5 w-3.5 shrink-0 fill-[var(--warning)] text-[var(--warning)]" />
              <span className="truncate">
                {(card.rating ?? 0).toFixed(1)}
              </span>
            </div>

            <div className="flex min-w-0 items-center gap-1">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {card.duration || '0h'}
              </span>
            </div>

            <div className="flex min-w-0 items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {card.minAge || 'Not available'}+
              </span>
            </div>

            <div className="flex min-w-0 items-center gap-1">
              <Layers className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {card.units ?? 0} units
              </span>
            </div>

            <div className="flex min-w-0 items-center gap-1">
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {card.enrollmentCount ?? 0} learners
              </span>
            </div>

            <div className="flex min-w-0 items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {card.activeClasses ?? 0} classes
              </span>
            </div>

            <div className="flex min-w-0 items-center gap-1">
              <UserCheck className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {card.instructorCount ?? 0} instructors
              </span>
            </div>
          </div>

          {/* Actions */}
          <div
            className="mt-auto grid shrink-0 grid-cols-2 gap-2"
            onClick={e => e.stopPropagation()}
          >
            <Button asChild size="sm">
              <Link href={card.enrollHref}>
                <Users className="mr-1 h-3 w-3" />
                Join Class
              </Link>
            </Button>

            <Button asChild size="sm" variant="outline">
              <Link href={card.instructorHref}>
                <Search className="h-3 w-3" />
                Search Instructor
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <CourseDetailsSheet
        key={selectedId}
        itemId={selectedId}
        type={card.contentKind}
        open={open}
        onOpenChange={value => {
          setOpen(value);

          if (!value) {
            setTimeout(() => setSelectedId(null), 200);
          }
        }}
      />

      <CourseVideoPreviewModal
        open={videoPreviewOpen}
        onOpenChange={setVideoPreviewOpen}
        title={card.title}
        videoUrl={resolvedVideoUrl}
      />
    </div>
  );
}
