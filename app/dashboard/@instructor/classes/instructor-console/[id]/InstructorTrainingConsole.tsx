'use client';

import RichTextRenderer from '@/components/editors/richTextRenders';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useClassDetails, type ClassDetailsScheduleItem } from '@/hooks/use-class-details';
import { useClassRoster, type RosterEntry } from '@/hooks/use-class-roster';
import {
  useCourseLessonsWithContent,
  type CourseLessonContent,
  type CourseLessonWithContent,
} from '@/hooks/use-courselessonwithcontent';
import {
  cx,
  elimikaDesignSystem,
  getCardClasses
} from '@/lib/design-system';
import { resolveLessonContentSource } from '@/lib/lesson-content-preview';
import {
  AlertCircle,
  ArrowLeft,
  PanelLeft,
  PanelRight,
  Search,
} from 'lucide-react';
import moment from 'moment';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

type TrainingSchedule = ClassDetailsScheduleItem & { meeting_url?: string | null };
type LessonContentItem = CourseLessonContent;
type LessonModule = CourseLessonWithContent;

function formatDateTime(value?: string | Date | null) {
  if (!value) return 'Not scheduled';
  return moment(value).format('ddd, MMM D · h:mm A');
}

function formatRange(start?: string | Date | null, end?: string | Date | null) {
  if (!start || !end) return 'Time not available';
  return `${moment(start).format('ddd, MMM D')} · ${moment(start).format('h:mm A')} - ${moment(
    end
  ).format('h:mm A')}`;
}

function formatEnum(value?: string | null) {
  if (!value) return 'Not set';
  return value
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getInitials(value?: string | null) {
  return (
    value
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('') ?? 'ST'
  );
}

function looksLikeHtml(value?: string | null) {
  return Boolean(value && /<\/?[a-z][\s\S]*>/i.test(value));
}

function getScheduleState(schedule?: { start_time?: string | Date; end_time?: string | Date }) {
  if (!schedule?.start_time || !schedule?.end_time) return 'upcoming' as const;

  if (
    moment(schedule.start_time).isBefore(moment()) &&
    moment(schedule.end_time).isAfter(moment())
  ) {
    return 'live' as const;
  }

  if (moment(schedule.end_time).isBefore(moment())) {
    return 'completed' as const;
  }

  return 'upcoming' as const;
}

function getContentTypeName(
  content: LessonContentItem | null | undefined,
  contentTypeDetailsMap: Record<
    string,
    { name: string; mime_types: string[]; upload_category?: string; is_media_type?: boolean }
  >
) {
  const itemMimeType = content?.mime_type?.toLowerCase() ?? '';
  const itemCategory = content?.content_category?.toLowerCase() ?? '';

  if (itemMimeType === 'application/pdf') return 'pdf';
  if (itemMimeType.includes('video/')) return 'video';
  if (itemMimeType.includes('audio/')) return 'audio';
  if (itemMimeType.includes('image/')) return 'image';
  if (itemMimeType.includes('text/')) return 'text';

  if (itemCategory.includes('video')) return 'video';
  if (itemCategory.includes('audio')) return 'audio';
  if (itemCategory.includes('image')) return 'image';
  if (itemCategory.includes('pdf')) return 'pdf';
  if (itemCategory.includes('text')) return 'text';

  const contentType = content?.content_type_uuid
    ? contentTypeDetailsMap[content.content_type_uuid]
    : undefined;

  const normalizedName = contentType?.name?.trim().toUpperCase() ?? '';
  const mimeTypes = contentType?.mime_types ?? [];
  const mimeList = mimeTypes.join(' ').toLowerCase();

  if (normalizedName === 'TEXT') return 'text';
  if (normalizedName === 'PDF') return 'pdf';
  if (normalizedName === 'LINK') return 'link';
  if (normalizedName === 'YOUTUBE') return 'video';

  if (mimeTypes.some(type => type === 'application/pdf')) return 'pdf';
  if (mimeList.includes('video/')) return 'video';
  if (mimeList.includes('audio/')) return 'audio';
  if (mimeList.includes('image/')) return 'image';
  if (mimeList.includes('text/')) return 'text';

  if (normalizedName.includes('VIDEO')) return 'video';
  if (normalizedName.includes('AUDIO')) return 'audio';
  if (normalizedName.includes('IMAGE')) return 'image';

  return normalizedName ? normalizedName.toLowerCase() : 'file';
}

function getYouTubeEmbedUrl(source: string) {
  try {
    const url = new URL(source);

    if (url.hostname.includes('youtu.be')) {
      return `https://www.youtube.com/embed/${url.pathname.slice(1)}`;
    }

    if (url.hostname.includes('youtube.com')) {
      if (url.pathname.includes('/embed/')) return source;
      if (url.pathname.includes('/shorts/')) {
        const videoId = url.pathname.split('/shorts/')[1]?.split('/')[0];
        return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
      }
      const videoId = url.searchParams.get('v');
      return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
    }
  } catch { }

  return '';
}

function getVimeoEmbedUrl(source: string) {
  try {
    const url = new URL(source);
    if (!url.hostname.includes('vimeo.com')) return '';
    const videoId = url.pathname.split('/').filter(Boolean)[0];
    return videoId ? `https://player.vimeo.com/video/${videoId}` : '';
  } catch {
    return '';
  }
}

function renderLessonContentPreview(
  content: LessonContentItem | null,
  contentTypeDetailsMap: Record<
    string,
    { name: string; mime_types: string[]; upload_category?: string; is_media_type?: boolean }
  >
) {
  if (!content) {
    return (
      <div className='text-muted-foreground flex min-h-[360px] items-center justify-center rounded-[28px] border border-dashed p-8 text-center text-sm'>
        No lesson content was selected from the previous page.
      </div>
    );
  }

  const contentTypeName = getContentTypeName(content, contentTypeDetailsMap);
  const resolvedSource = resolveLessonContentSource(content, contentTypeName);

  if (contentTypeName === 'text') {
    return (
      <div className='border-border/60 bg-background rounded-[28px] border p-6'>
        {content.content_text ? (
          looksLikeHtml(content.content_text) ? (
            <RichTextRenderer htmlString={content.content_text} />
          ) : (
            <div className='text-muted-foreground text-sm leading-7 whitespace-pre-wrap'>
              {content.content_text}
            </div>
          )
        ) : (
          <p className='text-muted-foreground text-sm'>No text content was provided for this item.</p>
        )}
      </div>
    );
  }

  if (contentTypeName === 'pdf') {
    return resolvedSource ? (
      <div className='border-border/60 bg-background overflow-hidden rounded-[28px] border'>
        <iframe
          src={resolvedSource}
          title={content.title || 'Lesson PDF'}
          className='h-[680px] w-full'
        />
      </div>
    ) : (
      <div className='text-muted-foreground flex min-h-[360px] items-center justify-center rounded-[28px] border border-dashed p-8 text-center text-sm'>
        This PDF is not available yet.
      </div>
    );
  }

  if (contentTypeName === 'video') {
    const youtubeUrl = getYouTubeEmbedUrl(resolvedSource);
    const vimeoUrl = getVimeoEmbedUrl(resolvedSource);
    const embedUrl = youtubeUrl || vimeoUrl;

    if (embedUrl) {
      return (
        <div className='border-border/60 bg-background overflow-hidden rounded-[28px] border'>
          <iframe
            src={embedUrl}
            title={content.title || 'Lesson video'}
            className='aspect-video w-full'
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
            allowFullScreen
          />
        </div>
      );
    }

    return resolvedSource ? (
      <div className='border-border/60 bg-background overflow-hidden rounded-[28px] border p-4'>
        <video controls className='aspect-video w-full rounded-2xl' src={resolvedSource} />
      </div>
    ) : (
      <div className='text-muted-foreground flex min-h-[360px] items-center justify-center rounded-[28px] border border-dashed p-8 text-center text-sm'>
        This video source is not available yet.
      </div>
    );
  }

  if (contentTypeName === 'audio') {
    return resolvedSource ? (
      <div className='border-border/60 bg-background rounded-[28px] border p-6'>
        <audio controls className='w-full' src={resolvedSource} />
      </div>
    ) : (
      <div className='text-muted-foreground flex min-h-[220px] items-center justify-center rounded-[28px] border border-dashed p-8 text-center text-sm'>
        This audio source is not available yet.
      </div>
    );
  }

  if (contentTypeName === 'image') {
    return resolvedSource ? (
      <div className='border-border/60 bg-background overflow-hidden rounded-[28px] border p-4'>
        <img
          src={resolvedSource}
          alt={content.title || 'Lesson image'}
          className='max-h-[680px] w-full rounded-2xl object-contain'
        />
      </div>
    ) : (
      <div className='text-muted-foreground flex min-h-[360px] items-center justify-center rounded-[28px] border border-dashed p-8 text-center text-sm'>
        This image source is not available yet.
      </div>
    );
  }

  return (
    <div className='border-border/60 bg-background rounded-[28px] border p-6'>
      <div className='space-y-3'>
        <p className='text-sm font-semibold'>File content</p>
        <p className='text-muted-foreground text-sm'>
          This material opens best in a new tab for teaching or sharing.
        </p>
        {resolvedSource ? (
          <Button asChild>
            <a href={resolvedSource} target='_blank' rel='noreferrer'>
              Open lesson file
            </a>
          </Button>
        ) : (
          <p className='text-muted-foreground text-sm'>No file source is available yet.</p>
        )}
      </div>
    </div>
  );
}

function ConsoleSkeleton() {
  return (
    <div className='space-y-6'>
      <Skeleton className='h-44 w-full rounded-[36px]' />
      <div className='grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_340px]'>
        <Skeleton className='h-[760px] w-full rounded-[28px]' />
        <Skeleton className='h-[760px] w-full rounded-[28px]' />
        <Skeleton className='h-[760px] w-full rounded-[28px]' />
      </div>
    </div>
  );
}

function RosterPanel({
  activeInstanceStudentsCount,
  filteredRoster,
  activeSchedule,
  studentSearch,
  setStudentSearch,
}: {
  activeInstanceStudentsCount: number;
  filteredRoster: RosterEntry[];
  activeSchedule: TrainingSchedule | null;
  studentSearch: string;
  setStudentSearch: (value: string) => void;
}) {
  return (
    <>
      <CardHeader className='space-y-4 border-b pb-4'>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <CardTitle>Class roster</CardTitle>
            <CardDescription>Students assigned to this selected class instance.</CardDescription>
          </div>
          <Badge variant='outline'>{activeInstanceStudentsCount}</Badge>
        </div>
        <div className='relative'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
          <Input
            value={studentSearch}
            onChange={event => setStudentSearch(event.target.value)}
            placeholder='Search students'
            className='pl-9'
          />
        </div>
      </CardHeader>
      <ScrollArea className='xl:h-[calc(100vh-17rem)]'>
        <div className='space-y-2 p-3'>
          {filteredRoster.map((entry: RosterEntry) => (
            <div
              key={entry.enrollment?.uuid ?? entry.user?.uuid ?? entry.student?.uuid}
              className='border-border/60 bg-background rounded-2xl border p-3'
            >
              <div className='flex items-start gap-3'>
                <Avatar className='border-border/60 size-10 border'>
                  <AvatarImage
                    src={entry.user?.profile_image_url ?? undefined}
                    alt={entry.user?.full_name || 'Student'}
                  />
                  <AvatarFallback>{getInitials(entry.user?.full_name)}</AvatarFallback>
                </Avatar>
                <div className='min-w-0 flex-1 space-y-1'>
                  <p className='truncate text-sm font-semibold'>
                    {entry.user?.full_name || 'Unknown student'}
                  </p>
                  <p className='text-muted-foreground truncate text-xs'>
                    {entry.user?.email || formatEnum(entry.enrollment?.status)}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {filteredRoster.length === 0 && (
            <div className='text-muted-foreground rounded-2xl border border-dashed p-6 text-center text-sm'>
              {activeSchedule
                ? 'No learners are attached to this class instance yet.'
                : 'No class instance was selected.'}
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  );
}

function SubmissionPanel({
  submissionQueue,
  activeSchedule,
  activeInstanceStudentsCount,
  selectedContentType,
}: {
  submissionQueue: Array<{
    id: string;
    name: string;
    lessonTitle: string;
    status: 'submitted' | 'review' | 'missing';
    score: number | null;
  }>;
  activeSchedule: TrainingSchedule | null;
  activeInstanceStudentsCount: number;
  selectedContentType: string;
}) {
  return (
    <div className='space-y-6'>
      <Card className='border-border/60 shadow-sm'>
        <CardHeader>
          <CardTitle>Submission details</CardTitle>
          <CardDescription>
            Quick follow-up for learners in this selected class instance.
          </CardDescription>
        </CardHeader>
        <ScrollArea className='xl:h-[calc(100vh-29rem)]'>
          <CardContent className='space-y-3'>
            {submissionQueue.length > 0 ? (
              submissionQueue.map(item => (
                <div key={item.id} className='border-border/60 bg-background rounded-2xl border p-4'>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='space-y-1'>
                      <p className='text-sm font-semibold'>{item.name}</p>
                      <p className='text-muted-foreground text-xs'>{item.lessonTitle}</p>
                    </div>
                    <Badge
                      variant={
                        item.status === 'submitted'
                          ? 'success'
                          : item.status === 'review'
                            ? 'warning'
                            : 'destructive'
                      }
                    >
                      {item.status === 'review' ? 'needs review' : item.status}
                    </Badge>
                  </div>
                  <p className='text-muted-foreground mt-3 text-sm'>
                    {item.score !== null
                      ? `Current score snapshot: ${item.score}/100`
                      : 'No submission captured yet for this learner.'}
                  </p>
                </div>
              ))
            ) : (
              <div className='text-muted-foreground rounded-2xl border border-dashed p-5 text-sm'>
                Submission tracking will become more useful once students are attached to the
                instance.
              </div>
            )}
          </CardContent>
        </ScrollArea>
      </Card>

      <Card className='border-border/60 shadow-sm'>
        <CardHeader>
          <CardTitle>Instance snapshot</CardTitle>
          <CardDescription>The selected class instance currently on screen.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-3 text-sm'>
          <div className='flex items-center justify-between gap-3'>
            <span className='text-muted-foreground'>Date</span>
            <span className='font-medium'>{formatDateTime(activeSchedule?.start_time)}</span>
          </div>
          <div className='flex items-center justify-between gap-3'>
            <span className='text-muted-foreground'>Status</span>
            <span className='font-medium'>{formatEnum(getScheduleState(activeSchedule))}</span>
          </div>
          <div className='flex items-center justify-between gap-3'>
            <span className='text-muted-foreground'>Students</span>
            <span className='font-medium'>{activeInstanceStudentsCount}</span>
          </div>
          <div className='flex items-center justify-between gap-3'>
            <span className='text-muted-foreground'>Content type</span>
            <span className='font-medium capitalize'>{selectedContentType}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function InstructorTrainingConsole() {
  const params = useParams();
  const searchParams = useSearchParams();
  const classId = params?.id as string;
  const requestedScheduleId = searchParams.get('schedule') ?? '';
  const requestedLessonId = searchParams.get('lesson') ?? '';
  const requestedContentId = searchParams.get('content') ?? '';
  const { replaceBreadcrumbs } = useBreadcrumb();
  const { data, isLoading, isError } = useClassDetails(classId);
  const { rosterAllEnrollments, isLoading: rosterLoading } = useClassRoster(classId);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedContentId, setSelectedContentId] = useState('');
  const [activeScheduleId, setActiveScheduleId] = useState('');
  const appliedRouteContentSelectionRef = useRef('');

  useEffect(() => {
    if (!classId) return;

    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      { id: 'classes', title: 'Classes', url: '/dashboard/classes' },
      {
        id: 'instructor-console',
        title: 'Instructor Console',
        url: `/dashboard/classes/instructor-console/${classId}`,
        isLast: true,
      },
    ]);
  }, [classId, replaceBreadcrumbs]);

  const classData = data.class;
  const course = data.course;
  const schedules = data.schedule ?? [];

  const {
    isLoading: lessonsLoading,
    lessons: lessonsWithContent,
    contentTypeMap,
    contentTypeDetailsMap,
  } = useCourseLessonsWithContent({ courseUuid: course?.uuid as string });

  const sortedSchedules = useMemo<TrainingSchedule[]>(
    () =>
      [...schedules].sort((left, right) => moment(left.start_time).diff(moment(right.start_time))),
    [schedules]
  );

  useEffect(() => {
    if (sortedSchedules.length === 0) return;

    const requestedSchedule = sortedSchedules.find(schedule => schedule.uuid === requestedScheduleId);
    const liveSchedule = sortedSchedules.find(schedule => getScheduleState(schedule) === 'live');
    const todaySchedule = sortedSchedules.find(schedule =>
      moment(schedule.start_time).isSame(moment(), 'day')
    );
    const upcomingSchedule = sortedSchedules.find(
      schedule => getScheduleState(schedule) === 'upcoming'
    );
    const defaultSchedule = requestedSchedule ?? liveSchedule ?? todaySchedule ?? upcomingSchedule ?? sortedSchedules[0];

    if (defaultSchedule?.uuid && activeScheduleId !== defaultSchedule.uuid) {
      setActiveScheduleId(defaultSchedule.uuid);
    }
  }, [activeScheduleId, requestedScheduleId, sortedSchedules]);

  const activeSchedule = sortedSchedules.find(schedule => schedule.uuid === activeScheduleId) ?? null;

  const lessonModules = useMemo(() => {
    const modules = (lessonsWithContent as LessonModule[]) ?? [];
    return [...modules].sort(
      (left, right) =>
        (left.lesson.lesson_sequence ?? left.lesson.lesson_number ?? 0) -
        (right.lesson.lesson_sequence ?? right.lesson.lesson_number ?? 0)
    );
  }, [lessonsWithContent]);

  const requestedLessonModule = useMemo(() => {
    const byLessonId = lessonModules.find(module => module.lesson.uuid === requestedLessonId);
    if (byLessonId) return byLessonId;

    if (!requestedContentId) return null;

    return (
      lessonModules.find(module =>
        module.content?.data?.some(content => content.uuid === requestedContentId)
      ) ?? null
    );
  }, [lessonModules, requestedContentId, requestedLessonId]
  );

  const activeLessonModule = requestedLessonModule ?? lessonModules[0] ?? null;
  const activeLesson = activeLessonModule?.lesson ?? null;
  const activeLessonContents = activeLessonModule?.content?.data ?? [];

  useEffect(() => {
    if (activeLessonContents.length === 0) {
      setSelectedContentId('');
      return;
    }

    const contentSelectionKey = `${activeLesson?.uuid ?? ''}:${requestedContentId}`;

    if (appliedRouteContentSelectionRef.current !== contentSelectionKey) {
      const requestedContentExists = activeLessonContents.some(
        content => content.uuid === requestedContentId
      );

      if (requestedContentExists) {
        setSelectedContentId(requestedContentId);
        appliedRouteContentSelectionRef.current = contentSelectionKey;
        return;
      }

      appliedRouteContentSelectionRef.current = contentSelectionKey;
    }

    if (activeLessonContents.some(content => content.uuid === selectedContentId)) {
      return;
    }

    setSelectedContentId(activeLessonContents[0]?.uuid ?? '');
  }, [activeLesson?.uuid, activeLessonContents, requestedContentId, selectedContentId]);

  const selectedContent =
    activeLessonContents.find(content => content.uuid === requestedContentId) ??
    null;
  const selectedContentSource = selectedContent
    ? resolveLessonContentSource(
      selectedContent,
      getContentTypeName(selectedContent, contentTypeDetailsMap)
    )
    : '';

  const activeInstanceStudents = useMemo(
    () =>
      rosterAllEnrollments.filter(
        (entry: RosterEntry) => entry.enrollment?.scheduled_instance_uuid === activeSchedule?.uuid
      ),
    [activeSchedule?.uuid, rosterAllEnrollments]
  );

  const filteredRoster = useMemo(
    () =>
      activeInstanceStudents.filter((entry: RosterEntry) =>
        (entry.user?.full_name ?? '').toLowerCase().includes(studentSearch.toLowerCase())
      ),
    [activeInstanceStudents, studentSearch]
  );

  const submissionQueue = useMemo(() => {
    const statuses: Array<'submitted' | 'review' | 'missing'> = ['submitted', 'review', 'missing'];

    return activeInstanceStudents.slice(0, 5).map((entry: RosterEntry, index: number) => ({
      id: entry.user?.uuid ?? `student-${index}`,
      name: entry.user?.full_name ?? `Student ${index + 1}`,
      lessonTitle: activeLesson?.title ?? `Lesson ${index + 1}`,
      status: statuses[index % statuses.length],
      score: statuses[index % statuses.length] === 'missing' ? null : 72 + index * 5,
    }));
  }, [activeInstanceStudents, activeLesson?.title]);
  const selectedContentType = getContentTypeName(selectedContent, contentTypeDetailsMap);

  if (isLoading || rosterLoading || lessonsLoading) {
    return <ConsoleSkeleton />;
  }

  if (isError) {
    return (
      <Card className={cx(getCardClasses(), 'border-destructive/30')}>
        <CardContent className='flex min-h-[280px] flex-col items-center justify-center gap-4 text-center'>
          <AlertCircle className='text-destructive h-10 w-10' />
          <div className='space-y-1'>
            <h2 className='text-lg font-semibold'>Unable to load this training console</h2>
            <p className='text-muted-foreground text-sm'>
              The class details could not be fetched right now. Please try again shortly.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <main className={elimikaDesignSystem.components.pageContainer}>
      <div className='-mt-6 sm:-mt-10'>
        <Button asChild variant='outline' className='gap-2'>
          <Link href='/dashboard/classes'>
            <ArrowLeft className='h-4 w-4' />
            Back
          </Link>
        </Button>
      </div>

      <section className='grid gap-6 xl:max-h-[calc(100vh-12rem)] xl:grid-cols-[280px_minmax(0,1fr)_340px]'>
        <Card className='border-border/60 order-2 hidden overflow-hidden shadow-sm xl:order-1 xl:block'>
          <RosterPanel
            activeInstanceStudentsCount={activeInstanceStudents.length}
            filteredRoster={filteredRoster}
            activeSchedule={activeSchedule}
            studentSearch={studentSearch}
            setStudentSearch={setStudentSearch}
          />
        </Card>

        <Card className='border-border/60 order-1 min-w-0 overflow-hidden shadow-sm xl:order-2'>
          <CardHeader className='space-y-4 border-b pb-4'>
            <div className='flex items-center justify-between gap-3 xl:hidden'>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant='outline' size='sm' className='gap-2'>
                    <PanelLeft className='h-4 w-4' />
                    Roster
                  </Button>
                </SheetTrigger>
                <SheetContent side='left' className='w-[88vw] max-w-sm p-0'>
                  <SheetHeader className='border-b px-6 py-4 text-left'>
                    <SheetTitle>Class roster</SheetTitle>
                    <SheetDescription>
                      Students assigned to this selected class instance.
                    </SheetDescription>
                  </SheetHeader>
                  <RosterPanel
                    activeInstanceStudentsCount={activeInstanceStudents.length}
                    filteredRoster={filteredRoster}
                    activeSchedule={activeSchedule}
                    studentSearch={studentSearch}
                    setStudentSearch={setStudentSearch}
                  />
                </SheetContent>
              </Sheet>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant='outline' size='sm' className='gap-2'>
                    <PanelRight className='h-4 w-4' />
                    Submissions
                  </Button>
                </SheetTrigger>
                <SheetContent side='right' className='w-[88vw] max-w-sm p-0'>
                  <SheetHeader className='border-b px-6 py-4 text-left'>
                    <SheetTitle>Submission details</SheetTitle>
                    <SheetDescription>
                      Quick follow-up for learners in this selected class instance.
                    </SheetDescription>
                  </SheetHeader>
                  <div className='p-6'>
                    <SubmissionPanel
                      submissionQueue={submissionQueue}
                      activeSchedule={activeSchedule}
                      activeInstanceStudentsCount={activeInstanceStudents.length}
                      selectedContentType={selectedContentType}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <div className='flex flex-col gap-2'>
              <Badge variant='outline' className='bg-primary/5 text-primary w-fit'>
                Selected lesson content
              </Badge>
              <CardTitle className='text-2xl'>
                {selectedContent?.title || activeLesson?.title || 'No lesson selected'}
              </CardTitle>
              <CardDescription>
                {activeSchedule
                  ? `Teaching date: ${formatRange(activeSchedule.start_time, activeSchedule.end_time)}`
                  : 'The date for the teaching instance is not available.'}
              </CardDescription>
            </div>

            <div className='grid gap-3 sm:grid-cols-3'>
              <div className='border-border/60 bg-background rounded-2xl border p-4'>
                <p className='text-muted-foreground text-xs tracking-[0.18em] uppercase'>Class</p>
                <p className='mt-2 text-sm font-semibold'>{classData?.title || 'Untitled class'}</p>
              </div>
              <div className='border-border/60 bg-background rounded-2xl border p-4'>
                <p className='text-muted-foreground text-xs tracking-[0.18em] uppercase'>Location</p>
                <p className='mt-2 text-sm font-semibold'>
                  {classData?.location_name || classData?.location_type || 'Not assigned'}
                </p>
              </div>
              <div className='border-border/60 bg-background rounded-2xl border p-4'>
                <p className='text-muted-foreground text-xs tracking-[0.18em] uppercase'>Format</p>
                <p className='mt-2 text-sm font-semibold'>{formatEnum(classData?.session_format)}</p>
              </div>
            </div>
          </CardHeader>

          <ScrollArea className='xl:h-[calc(100vh-17rem)]'>
            <CardContent className='space-y-4 p-6'>
              <div className='flex flex-wrap items-center gap-2'>
                <Badge variant='outline' className='capitalize'>
                  {selectedContentType}
                </Badge>
                <Badge variant='outline'>{selectedContent?.duration || 'Open during class'}</Badge>
              </div>

              {selectedContent?.description ? (
                <div className='border-border/60 bg-background rounded-[28px] border p-5'>
                  <p className='text-muted-foreground text-sm leading-7'>
                    {selectedContent.description}
                  </p>
                </div>
              ) : null}

              {renderLessonContentPreview(selectedContent, contentTypeDetailsMap)}
            </CardContent>
          </ScrollArea>
        </Card>

        <div className='order-3 hidden space-y-6 xl:block xl:max-h-[calc(100vh-12rem)] xl:overflow-hidden'>
          <SubmissionPanel
            submissionQueue={submissionQueue}
            activeSchedule={activeSchedule}
            activeInstanceStudentsCount={activeInstanceStudents.length}
            selectedContentType={selectedContentType}
          />
        </div>
      </section>
    </main>
  );
}
