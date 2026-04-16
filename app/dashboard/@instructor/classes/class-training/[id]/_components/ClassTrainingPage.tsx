'use client';

import { LessonContentPreview } from '@/components/lesson-content/LessonContentPreview';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger
} from '@/components/ui/select';
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
import { useUserProfile } from '@/context/profile-context';
import { useClassDetails, type ClassDetailsScheduleItem } from '@/hooks/use-class-details';
import { useClassRoster, type RosterEntry } from '@/hooks/use-class-roster';
import {
  useCourseLessonsWithContent,
  type CourseLessonContent,
  type CourseLessonWithContent,
} from '@/hooks/use-courselessonwithcontent';
import {
  getEnrollmentsForClassQueryKey,
  markAttendanceMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  ClipboardCheck,
  ListChecks,
  MessageSquareText,
  PanelLeft,
  PanelRight,
  Search,
  Send,
  ShieldCheck,
  SquarePen,
} from 'lucide-react';
import moment from 'moment';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

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

function getContentTitle(content: LessonContentItem, index: number) {
  return content.title?.trim() || `Lesson content ${index + 1}`;
}

function looksLikeHtml(str: string) {
  return /<\/?[a-z][\s\S]*>/i.test(str);
}

function decodeHtmlEntities(value: string) {
  if (typeof document === 'undefined') return value;

  const textarea = document.createElement('textarea');
  textarea.innerHTML = value;
  return textarea.value;
}

function normalizeLessonTextContent(value?: string | null) {
  const rawContent = value?.trim() ?? '';
  if (!rawContent) {
    return { renderedContent: '', isHtml: false };
  }

  if (looksLikeHtml(rawContent)) {
    return { renderedContent: rawContent, isHtml: true };
  }

  const decodedContent = decodeHtmlEntities(rawContent).trim();
  if (decodedContent && looksLikeHtml(decodedContent)) {
    return { renderedContent: decodedContent, isHtml: true };
  }

  return { renderedContent: rawContent, isHtml: false };
}

function getStudentAttendanceState(entry: RosterEntry | null | undefined) {
  if (entry?.enrollment?.is_attendance_marked) {
    return entry.enrollment?.did_attend ? 'present' : 'absent';
  }

  return 'pending';
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

export const RichTextPreview = ({ html }: { html: string }) => {
  return (
    <div
      className='
          text-foreground mx-auto w-full text-[15px] leading-7
          [&_*]:max-w-full
          [&_h1]:mt-12 [&_h1]:mb-5 [&_h1]:text-[1.7rem] [&_h1]:font-bold [&_h1]:leading-tight
          [&_h1:first-child]:mt-0
          [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-[1.35rem] [&_h2]:font-bold [&_h2]:leading-snug
          [&_h2:first-child]:mt-0
          [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-[1.15rem] [&_h3]:font-semibold
          [&_h4]:mt-8 [&_h4]:mb-3 [&_h4]:text-base [&_h4]:font-semibold
          [&_p]:text-foreground/80 [&_p]:leading-7
          [&_p:not(:first-child)]:mt-5
          [&_ol]:my-6 [&_ol]:list-decimal [&_ol]:pl-6
          [&_ul]:my-6 [&_ul]:list-disc [&_ul]:pl-6
          [&_li]:text-foreground/80 [&_li]:leading-7
          [&_li:not(:first-child)]:mt-1.5
          [&_li_p]:mt-0
          [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
          [&_blockquote]:my-6
          [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4
          [&_hr]:bg-border [&_hr]:my-10 [&_hr]:h-px [&_hr]:border-0
          [&_pre]:bg-muted/60 [&_pre]:border-border/70 [&_pre]:my-8 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:border [&_pre]:p-5
          [&_pre]:text-[0.95rem] [&_pre]:leading-7
          [&_pre_code]:bg-transparent [&_pre_code]:border-0 [&_pre_code]:p-0
          [&_code]:bg-muted [&_code]:rounded-md [&_code]:border [&_code]:border-border/60 [&_code]:px-1.5 [&_code]:py-0.5
          [&_code]:font-mono [&_code]:text-[0.9em]
          [&_img]:my-8 [&_img]:rounded-2xl [&_img]:border [&_img]:border-border/60
          [&_img]:shadow-sm
          [&_figure]:my-8
          [&_table]:my-8 [&_table]:w-full [&_table]:border-collapse [&_table]:overflow-hidden
          [&_th]:bg-muted [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold
          [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2
        '
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

function renderLessonContentPreview(
  content: LessonContentItem | null,
  contentTypeDetailsMap: Record<
    string,
    { name: string; mime_types: string[]; upload_category?: string; is_media_type?: boolean }
  >
) {
  return <LessonContentPreview content={content} contentTypeDetailsMap={contentTypeDetailsMap} />;
}

function ConsoleSkeleton() {
  return (
    <div className='fixed inset-0 z-50 p-3'>
      <Skeleton className='mb-3 h-14 w-full rounded-lg' />
      <div className='grid h-[calc(100vh-5rem)] gap-3 xl:grid-cols-[260px_minmax(0,1fr)_330px]'>
        <Skeleton className='hidden h-full rounded-lg xl:block' />
        <Skeleton className='h-full rounded-lg' />
        <Skeleton className='hidden h-full rounded-lg xl:block' />
      </div>
    </div>
  );
}

function RosterPanel({
  activeInstanceStudentsCount,
  filteredRoster,
  activeInstanceStudents,
  activeSchedule,
  studentSearch,
  setStudentSearch,
  selectedStudentId,
  onSelectStudent,
  onMarkAllPresent,
  isMarkingAllAttendance,
}: {
  activeInstanceStudentsCount: number;
  filteredRoster: RosterEntry[];
  activeInstanceStudents: RosterEntry[];
  activeSchedule: TrainingSchedule | null;
  studentSearch: string;
  setStudentSearch: (value: string) => void;
  selectedStudentId: string;
  onSelectStudent: (entry: RosterEntry) => void;
  onMarkAllPresent: () => void;
  isMarkingAllAttendance: boolean;
}) {
  const presentCount = activeInstanceStudents.filter(
    entry => getStudentAttendanceState(entry) === 'present'
  ).length;
  const absentCount = activeInstanceStudents.filter(
    entry => getStudentAttendanceState(entry) === 'absent'
  ).length;
  const pendingCount = activeInstanceStudents.filter(
    entry => getStudentAttendanceState(entry) === 'pending'
  ).length;

  return (
    <div className='flex h-full min-h-0 flex-col'>
      <div className='border-border/70 bg-card/90 space-y-3 border-b p-3'>
        <div className='flex items-center justify-between gap-3'>
          <div className='min-w-0'>
            <p className='text-foreground text-sm font-semibold'>All Students</p>
            <p className='text-muted-foreground text-xs'>Attendance rubric tracker</p>
          </div>
          <Badge variant='outline' className='bg-primary/5 text-primary'>
            {activeInstanceStudentsCount}
          </Badge>
        </div>
        <Button
          size='sm'
          variant='outline'
          className='w-full'
          disabled={isMarkingAllAttendance || pendingCount === 0}
          onClick={onMarkAllPresent}
        >
          Mark All Present
        </Button>
        <div className='relative'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
          <Input
            value={studentSearch}
            onChange={event => setStudentSearch(event.target.value)}
            placeholder='Search students'
            className='bg-background/80 h-9 rounded-md pl-9 text-sm'
          />
        </div>
      </div>
      <ScrollArea className='min-h-0 flex-1'>
        <div className='space-y-1.5 p-2'>
          {filteredRoster.map((entry: RosterEntry) => {
            const attendanceState = getStudentAttendanceState(entry);
            const isSelected = selectedStudentId === (entry.enrollment?.uuid ?? '');

            return (
              <button
                type='button'
                key={entry.enrollment?.uuid ?? entry.user?.uuid ?? entry.student?.uuid}
                onClick={() => onSelectStudent(entry)}
                className={`w-full rounded-md border p-2.5 text-left transition-colors ${isSelected ? 'border-primary/30 bg-primary/8' : 'hover:bg-primary/5 border-transparent'
                  }`}
              >
                <div className='flex items-start gap-2.5'>
                  <Avatar className='border-border/60 size-8 border'>
                    <AvatarImage
                      src={entry.user?.profile_image_url ?? undefined}
                      alt={entry.user?.full_name || 'Student'}
                    />
                    <AvatarFallback>{getInitials(entry.user?.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-semibold'>
                      {entry.user?.full_name || 'Unknown student'}
                    </p>
                    <div className='text-muted-foreground mt-1 flex items-center justify-between gap-2 text-xs'>
                      <span className='truncate'>
                        {entry.enrollment?.is_attendance_marked ? 'Attended' : 'Attendance pending'}
                      </span>
                      <span className='capitalize'>{attendanceState}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}

          {filteredRoster.length === 0 && (
            <div className='text-muted-foreground rounded-2xl border border-dashed p-6 text-center text-sm'>
              {activeSchedule
                ? 'No learners are attached to this class instance yet.'
                : 'No class instance was selected.'}
            </div>
          )}
        </div>
      </ScrollArea>
      <div className='border-border/70 bg-card/90 border-t p-3'>
        <div className='grid grid-cols-3 gap-2 text-xs'>
          <div>
            <p className='text-muted-foreground'>Present</p>
            <p className='font-semibold'>{presentCount}</p>
          </div>
          <div>
            <p className='text-muted-foreground'>Pending</p>
            <p className='font-semibold'>{pendingCount}</p>
          </div>
          <div>
            <p className='text-muted-foreground'>Absent</p>
            <p className='font-semibold'>{absentCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubmissionPanel({
  submissionQueue,
  activeSchedule,
  activeInstanceStudentsCount,
  selectedContentType,
  selectedStudent,
  onMarkAttendance,
  isMarkingAttendance,
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
  selectedStudent: RosterEntry | null;
  onMarkAttendance: (entry: RosterEntry, attended: boolean) => void;
  isMarkingAttendance: boolean;
}) {
  const [activePanel, setActivePanel] = useState<'submissions' | 'rubric' | 'tasks' | 'notes'>(
    'submissions'
  );
  const selectedStudentAttendanceState = getStudentAttendanceState(selectedStudent);
  const attendanceActionDisabled = isMarkingAttendance || !selectedStudent?.enrollment?.uuid;
  const panelTabs = [
    { value: 'submissions' as const, label: 'Submissions', icon: ClipboardCheck },
    { value: 'rubric' as const, label: 'Rubric', icon: ShieldCheck },
    { value: 'tasks' as const, label: 'Tasks', icon: ListChecks },
    { value: 'notes' as const, label: 'Notes', icon: MessageSquareText },
  ];

  return (
    <aside className='bg-card/95 flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden'>
      <div className='border-border/70 border-b p-3'>
        <div className='mb-3 flex min-w-0 items-center justify-between gap-3'>
          <div className='min-w-0'>
            <p className='text-sm font-semibold'>Class Work</p>
            <p className='text-muted-foreground truncate text-xs'>
              {activeInstanceStudentsCount} students · {selectedContentType}
            </p>
          </div>
          <Button variant='ghost' size='sm' className='h-8 shrink-0 text-xs'>
            View Rubric
          </Button>
        </div>
        <div className='bg-muted grid grid-cols-2 gap-1 rounded-md p-1'>
          {panelTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activePanel === tab.value;

            return (
              <button
                key={tab.value}
                type='button'
                onClick={() => setActivePanel(tab.value)}
                className={`flex h-8 min-w-0 items-center justify-center gap-1.5 overflow-hidden rounded px-1 text-[11px] font-medium transition-colors ${isActive
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <Icon className='h-3.5 w-3.5 shrink-0' />
                <span className='truncate'>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <ScrollArea className='min-h-0 flex-1'>
        <div className='max-w-full space-y-3 p-3'>
          <div className='border-border/70 bg-background/90 rounded-md border p-3'>
            <div className='flex items-start justify-between gap-3'>
              <div className='min-w-0'>
                <p className='text-muted-foreground text-[11px] tracking-[0.16em] uppercase'>
                  Attendance
                </p>
                <p className='mt-1 truncate text-sm font-semibold'>
                  {selectedStudent?.user?.full_name || 'Select a student from the roster'}
                </p>
                <p className='text-muted-foreground mt-1 text-xs'>
                  {selectedStudent
                    ? selectedStudent.user?.email || formatEnum(selectedStudent.enrollment?.status)
                    : activeSchedule
                      ? 'Choose a learner to mark this class instance.'
                      : 'Select a class instance to begin attendance.'}
                </p>
              </div>
              {selectedStudent ? (
                <Badge
                  variant={
                    selectedStudentAttendanceState === 'present'
                      ? 'success'
                      : selectedStudentAttendanceState === 'absent'
                        ? 'destructive'
                        : 'secondary'
                  }
                  className='shrink-0 capitalize'
                >
                  {selectedStudentAttendanceState}
                </Badge>
              ) : null}
            </div>

            <div className='mt-3 flex gap-2'>
              <Button
                size='sm'
                className='flex-1'
                disabled={attendanceActionDisabled}
                onClick={() => selectedStudent && onMarkAttendance(selectedStudent, true)}
              >
                Mark Present
              </Button>
              <Button
                size='sm'
                variant='outline'
                className='flex-1'
                disabled={attendanceActionDisabled}
                onClick={() => selectedStudent && onMarkAttendance(selectedStudent, false)}
              >
                Mark Absent
              </Button>
            </div>

            {selectedStudent?.enrollment?.attendance_marked_at ? (
              <p className='text-muted-foreground mt-3 text-xs'>
                Marked {formatDateTime(selectedStudent.enrollment.attendance_marked_at)}
              </p>
            ) : null}

            {!selectedStudent && activeInstanceStudentsCount > 0 ? (
              <p className='text-muted-foreground mt-3 text-xs'>
                Select a student on the left to mark attendance for this session.
              </p>
            ) : null}

            {!selectedStudent && !activeInstanceStudentsCount ? (
              <p className='text-muted-foreground mt-3 text-xs'>
                No students are attached to this class instance yet.
              </p>
            ) : null}
          </div>

          {activePanel === 'submissions' ? (
            <>
              <div className='border-border/70 bg-background/80 min-w-0 rounded-md border p-3'>
                <div className='mb-3 flex items-center justify-between text-xs'>
                  <span className='text-muted-foreground'>Due date</span>
                  <span className='truncate pl-2 text-right font-semibold'>
                    {formatDateTime(activeSchedule?.end_time)}
                  </span>
                </div>
                <div className='grid gap-2'>
                  <label className='text-muted-foreground text-xs'>Attempt Date</label>
                  <Input value='Since' readOnly className='bg-card h-9 rounded-md text-sm' />
                  <label className='text-muted-foreground text-xs'>Grade out of 100</label>
                  <Input value='80' readOnly className='bg-card h-9 rounded-md text-sm' />
                </div>
              </div>

              {submissionQueue.length > 0 ? (
                submissionQueue.map(item => (
                  <div
                    key={item.id}
                    className='border-border/70 bg-background/80 min-w-0 overflow-hidden rounded-md border p-3'
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="flex-1 min-w-0 truncate text-sm font-semibold">
                          {item.name}
                        </p>
                        <Badge
                          variant={
                            item.status === 'submitted'
                              ? 'success'
                              : item.status === 'review'
                                ? 'warning'
                                : 'destructive'
                          }
                          className="shrink-0 max-w-[80px] truncate"
                        >
                          {item.status === 'review' ? 'review' : item.status}
                        </Badge>
                      </div>

                      <p className="text-muted-foreground truncate text-xs">
                        {item.lessonTitle}
                      </p>
                    </div>
                    <p className='text-muted-foreground mt-2 text-xs'>
                      {item.score !== null
                        ? `${item.score}/100 score snapshot`
                        : 'Missing submission'}
                    </p>
                  </div>
                ))
              ) : (
                <div className='text-muted-foreground rounded-md border border-dashed p-5 text-sm'>
                  Submission tracking will appear once students are attached to the instance.
                </div>
              )}
            </>
          ) : null}

          {activePanel === 'rubric' ? (
            <div className='space-y-3'>
              {['Attendance and readiness', 'Practical participation', 'Submission quality'].map(
                (label, index) => (
                  <div
                    key={label}
                    className='border-border/70 bg-background/80 rounded-md border p-3'
                  >
                    <div className='mb-2 flex items-center justify-between gap-3'>
                      <p className='text-sm font-semibold'>{label}</p>
                      <span className='text-primary text-sm font-semibold'>
                        {[20, 40, 40][index]}%
                      </span>
                    </div>
                    <div className='bg-muted h-2 rounded-full'>
                      <div
                        className='bg-success h-full rounded-full'
                        style={{ width: `${[72, 84, 62][index]}%` }}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          ) : null}

          {activePanel === 'tasks' ? (
            <div className='space-y-3'>
              <div className='border-border/70 bg-background/80 min-w-0 rounded-md border p-3'>
                <p className='text-sm font-semibold'>Issue Assignment</p>
                <p className='text-muted-foreground mt-1 text-xs'>
                  Create follow-up practice for the selected lesson.
                </p>
                <div className='mt-3 grid grid-cols-1 gap-1 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3'>
                  {['Quiz', 'Homework', 'Discussion'].map(item => (
                    <Button key={item} variant='outline' size='sm' className='h-8 min-w-0 text-xs'>
                      {item}
                    </Button>
                  ))}
                </div>
              </div>
              <Button className='bg-primary h-10 w-full rounded-md'>
                <SquarePen className='mr-2 h-4 w-4' />
                Assign Tasks
              </Button>
            </div>
          ) : null}

          {activePanel === 'notes' ? (
            <div className='space-y-3'>
              {[
                'Remind students to consider mobile marketing strategy.',
                'Discuss recent trends in social media marketing.',
                'Prepare next session on digital ads.',
              ].map(note => (
                <div key={note} className='border-border/70 bg-background/80 rounded-md border p-3'>
                  <p className='text-sm'>{note}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </ScrollArea>

      <div className='border-border/70 border-t p-3'>
        <Button className='bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 w-full rounded-md'>
          End Class
        </Button>
      </div>
    </aside>
  );
}

export default function ClassTrainingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const classId = params?.id as string;
  const requestedScheduleId = searchParams.get('schedule') ?? '';
  const requestedLessonId = searchParams.get('lesson') ?? '';
  const requestedContentId = searchParams.get('content') ?? '';
  const { replaceBreadcrumbs } = useBreadcrumb();
  const userProfile = useUserProfile();
  const { data, isLoading, isError } = useClassDetails(classId);
  const { rosterAllEnrollments, isLoading: rosterLoading } = useClassRoster(classId);
  const [studentSearch, setStudentSearch] = useState('');
  const [pageSearch, setPageSearch] = useState('');
  const [selectedContentId, setSelectedContentId] = useState('');
  const [activeScheduleId, setActiveScheduleId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const appliedRouteContentSelectionRef = useRef('');

  useEffect(() => {
    if (!classId) return;

    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      { id: 'classes', title: 'Classes', url: '/dashboard/classes' },
      {
        id: 'class-training',
        title: 'Class Training',
        url: `/dashboard/classes/class-training/${classId}`,
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
    contentTypeDetailsMap,
  } = useCourseLessonsWithContent({ courseUuid: course?.uuid as string });

  const sortedSchedules = useMemo<TrainingSchedule[]>(
    () =>
      [...schedules].sort((left, right) => moment(left.start_time).diff(moment(right.start_time))),
    [schedules]
  );

  useEffect(() => {
    if (sortedSchedules.length === 0) return;

    const requestedSchedule = sortedSchedules.find(
      schedule => schedule.uuid === requestedScheduleId
    );
    const liveSchedule = sortedSchedules.find(schedule => getScheduleState(schedule) === 'live');
    const todaySchedule = sortedSchedules.find(schedule =>
      moment(schedule.start_time).isSame(moment(), 'day')
    );
    const upcomingSchedule = sortedSchedules.find(
      schedule => getScheduleState(schedule) === 'upcoming'
    );
    const defaultSchedule =
      requestedSchedule ?? liveSchedule ?? todaySchedule ?? upcomingSchedule ?? sortedSchedules[0];

    if (defaultSchedule?.uuid && activeScheduleId !== defaultSchedule.uuid) {
      setActiveScheduleId(defaultSchedule.uuid);
    }
  }, [activeScheduleId, requestedScheduleId, sortedSchedules]);

  const activeSchedule =
    sortedSchedules.find(schedule => schedule.uuid === activeScheduleId) ?? null;

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
  }, [lessonModules, requestedContentId, requestedLessonId]);

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
    activeLessonContents.find(content => content.uuid === selectedContentId) ?? null;

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

  useEffect(() => {
    if (activeInstanceStudents.length === 0) {
      setSelectedStudentId('');
      return;
    }

    const currentStudentExists = activeInstanceStudents.some(
      entry => entry.enrollment?.uuid === selectedStudentId
    );

    if (!currentStudentExists) {
      setSelectedStudentId(activeInstanceStudents[0]?.enrollment?.uuid ?? '');
    }
  }, [activeInstanceStudents, selectedStudentId]);

  const selectedStudent =
    activeInstanceStudents.find(entry => entry.enrollment?.uuid === selectedStudentId) ?? null;

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
  const instructorName =
    userProfile?.instructor?.full_name || userProfile?.full_name || 'Instructor';
  const instructorProfileImage = userProfile?.profile_image_url ?? undefined;
  const markAttendanceMut = useMutation(markAttendanceMutation());

  const handleMarkAttendance = (entry: RosterEntry, attended: boolean) => {
    if (!entry.enrollment?.uuid) return;

    markAttendanceMut.mutate(
      {
        path: { enrollmentUuid: entry.enrollment.uuid },
        query: { attended },
      },
      {
        onSuccess: () => {
          toast.success(
            `Marked ${entry.user?.full_name || 'student'} as ${attended ? 'present' : 'absent'}.`
          );
          queryClient.invalidateQueries({
            queryKey: getEnrollmentsForClassQueryKey({ path: { uuid: classId } }),
          });
        },
        onError: error => {
          toast.error(error instanceof Error ? error.message : 'Failed to mark attendance.');
        },
      }
    );
  };

  const handleMarkAllPresent = async () => {
    const pendingStudents = activeInstanceStudents.filter(
      entry => getStudentAttendanceState(entry) === 'pending' && entry.enrollment?.uuid
    );

    if (pendingStudents.length === 0) {
      toast.error('There are no pending attendance records to mark.');
      return;
    }

    try {
      await Promise.all(
        pendingStudents.map(entry =>
          markAttendanceMut.mutateAsync({
            path: { enrollmentUuid: entry.enrollment.uuid },
            query: { attended: true },
          })
        )
      );

      toast.success(`Marked ${pendingStudents.length} student(s) present.`);
      queryClient.invalidateQueries({
        queryKey: getEnrollmentsForClassQueryKey({ path: { uuid: classId } }),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to mark all students present.');
    }
  };

  const handlePageSearch = () => {
    if (!pageSearch.trim()) return;

    if (typeof window !== 'undefined' && typeof window.find === 'function') {
      const found = window.find(pageSearch.trim(), false, false, true, false, false, false);
      if (!found) {
        toast.error(`No match found for "${pageSearch.trim()}".`);
      }
      return;
    }

    toast.error('Page search is not supported in this browser.');
  };

  if (isLoading || rosterLoading || lessonsLoading) {
    return <ConsoleSkeleton />;
  }

  if (isError) {
    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_oklch,var(--el-brand-50)_80%,var(--background))] p-6'>
        <div className='border-destructive/30 bg-card flex min-h-[280px] w-full max-w-xl flex-col items-center justify-center gap-4 rounded-lg border p-8 text-center shadow-sm'>
          <AlertCircle className='text-destructive h-10 w-10' />
          <div className='space-y-1'>
            <h2 className='text-lg font-semibold'>Unable to load this class training room</h2>
            <p className='text-muted-foreground text-sm'>
              The class details could not be fetched right now. Please try again shortly.
            </p>
          </div>
          <Button asChild variant='outline'>
            <Link href='/dashboard/classes'>Back to classes</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className='text-foreground fixed inset-0 z-50 flex flex-col overflow-hidden bg-[color-mix(in_oklch,var(--el-brand-50)_80%,var(--background))]'>
      <header className='border-border/70 bg-primary text-primary-foreground flex h-16 shrink-0 items-center justify-between gap-3 border-b px-3 shadow-sm sm:px-4'>
        <div className='flex min-w-0 items-center gap-3'>
          <Button
            asChild
            variant='ghost'
            size='icon'
            className='text-primary-foreground hover:bg-white/10'
          >
            <Link href='/dashboard/classes' aria-label='Back to classes'>
              <ArrowLeft className='h-5 w-5' />
            </Link>
          </Button>
          <div className='flex min-w-0 items-center gap-2'>
            <span className='flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15'>
              <BookOpen className='h-4 w-4' />
            </span>
            <div className='min-w-0'>
              <h1 className='truncate text-sm font-semibold sm:text-base'>
                {course?.name || classData?.title || 'Class Training'}
              </h1>
              <p className='text-primary-foreground/75 truncate text-xs'>
                {activeSchedule
                  ? formatRange(activeSchedule.start_time, activeSchedule.end_time)
                  : 'Training session'}
              </p>
            </div>
          </div>
        </div>

        <div className='hidden min-w-0 flex-1 justify-center md:flex'>
          <div className='flex max-w-xl flex-1 items-center gap-2 rounded-full bg-white/12 px-3 py-2'>
            <Search className='text-primary-foreground/70 h-4 w-4 shrink-0' />
            <Input
              value={pageSearch}
              onChange={event => setPageSearch(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  handlePageSearch();
                }
              }}
              placeholder='Search this page...'
              className='border-0 bg-transparent px-0 text-xs text-white placeholder:text-white/70 focus-visible:ring-0'
            />
            <Button
              size='sm'
              variant='ghost'
              className='h-7 shrink-0 text-primary-foreground hover:bg-white/10'
              onClick={handlePageSearch}
            >
              Find
            </Button>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                className='text-primary-foreground gap-2 hover:bg-white/10 xl:hidden'
              >
                <PanelLeft className='h-4 w-4' />
                Roster
              </Button>
            </SheetTrigger>
            <SheetContent side='left' className='w-[88vw] max-w-sm p-0'>
              <SheetHeader className='sr-only'>
                <SheetTitle>Class roster</SheetTitle>
                <SheetDescription>
                  Students assigned to this selected class instance.
                </SheetDescription>
              </SheetHeader>
              <RosterPanel
                activeInstanceStudentsCount={activeInstanceStudents.length}
                activeInstanceStudents={activeInstanceStudents}
                filteredRoster={filteredRoster}
                activeSchedule={activeSchedule}
                studentSearch={studentSearch}
                setStudentSearch={setStudentSearch}
                selectedStudentId={selectedStudentId}
                onSelectStudent={entry => setSelectedStudentId(entry.enrollment?.uuid ?? '')}
                onMarkAllPresent={handleMarkAllPresent}
                isMarkingAllAttendance={markAttendanceMut.isPending}
              />
            </SheetContent>
          </Sheet>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                className='text-primary-foreground gap-2 hover:bg-white/10 xl:hidden'
              >
                <PanelRight className='h-4 w-4' />
                Work
              </Button>
            </SheetTrigger>
            <SheetContent side='right' className='w-[92vw] max-w-sm p-0'>
              <SheetHeader className='sr-only'>
                <SheetTitle>Class work</SheetTitle>
                <SheetDescription>Submissions, rubric, notes, and assignments.</SheetDescription>
              </SheetHeader>
              <SubmissionPanel
                submissionQueue={submissionQueue}
                activeSchedule={activeSchedule}
                activeInstanceStudentsCount={activeInstanceStudents.length}
                selectedContentType={selectedContentType}
                selectedStudent={selectedStudent}
                onMarkAttendance={handleMarkAttendance}
                isMarkingAttendance={markAttendanceMut.isPending}
              />
            </SheetContent>
          </Sheet>

          <div className='flex min-w-0 items-center gap-2 pl-1'>
            <Avatar className='border-primary-foreground/30 size-8 shrink-0 border'>
              <AvatarImage src={instructorProfileImage} alt={instructorName} />
              <AvatarFallback>{getInitials(instructorName)}</AvatarFallback>
            </Avatar>
            <div className='hidden min-w-0 max-w-36 text-left sm:block lg:max-w-48'>
              <p className='text-primary-foreground/70 text-[11px] leading-tight'>Instructor</p>
              <p className='truncate text-xs font-semibold leading-tight'>{instructorName}</p>
            </div>

          </div>
        </div>
      </header>

      <section className='grid min-h-0 flex-1 gap-0 overflow-hidden xl:grid-cols-[260px_minmax(0,1fr)_340px]'>
        <aside className='border-border/70 hidden min-h-0 border-r xl:block'>
          <RosterPanel
            activeInstanceStudentsCount={activeInstanceStudents.length}
            activeInstanceStudents={activeInstanceStudents}
            filteredRoster={filteredRoster}
            activeSchedule={activeSchedule}
            studentSearch={studentSearch}
            setStudentSearch={setStudentSearch}
            selectedStudentId={selectedStudentId}
            onSelectStudent={entry => setSelectedStudentId(entry.enrollment?.uuid ?? '')}
            onMarkAllPresent={handleMarkAllPresent}
            isMarkingAllAttendance={markAttendanceMut.isPending}
          />
        </aside>

        <section className='min-h-0 overflow-hidden bg-[color-mix(in_oklch,var(--el-brand-50)_35%,var(--background))]'>
          <div className='border-border/70 bg-card/95 border-b px-4 py-3'>
            <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
              <div className='min-w-0'>
                <h2 className='truncate text-lg font-semibold'>
                  {selectedContent?.title || activeLesson?.title || 'No lesson selected'}
                </h2>
                <div className='text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-xs'>
                  <Badge variant='outline' className='capitalize'>
                    {selectedContentType}
                  </Badge>
                  <span>Beginner</span>
                  <span>{activeInstanceStudents.length} students</span>
                  <span>{selectedContent?.duration || 'Open during class'}</span>
                </div>
              </div>

              <div className="flex flex-row items-center gap-4 w-40">
                <p className='text-sm' >
                  Lessons
                </p>
                <Select
                  value={selectedContentId}
                  onValueChange={setSelectedContentId}
                  disabled={activeLessonContents.length === 0}
                >
                  <SelectTrigger className="h-8 px-2 text-sm">

                  </SelectTrigger>

                  <SelectContent>
                    {activeLessonContents.map((content, index) => (
                      <SelectItem
                        key={content.uuid ?? `content-${index}`}
                        value={content.uuid ?? `content-${index}`}
                      >
                        {getContentTitle(content, index)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <ScrollArea className='h-[calc(100vh-8.5rem)]'>
            <div className='mx-auto space-y-4 p-4 md:p-5'>
              <article className='border-border/70 bg-card overflow-hidden rounded-lg border shadow-sm'>
                <div className='border-border/70 border-b p-4'>
                  <p className='text-muted-foreground text-xs'>{course?.name}</p>
                  <h3 className='mt-1 text-xl font-semibold'>
                    {activeLesson?.title}
                  </h3>
                </div>
                <div className='p-4'>
                  {selectedContent?.title ? (
                    <div className='border-border/60 bg-background mb-4 rounded-md border p-4'>
                      <p className='text-muted-foreground text-sm leading-7'>
                        {selectedContent.title}
                      </p>
                    </div>
                  ) : null}
                  {renderLessonContentPreview(selectedContent, contentTypeDetailsMap)}
                </div>
              </article>

              <section className='border-border/70 bg-card rounded-lg border p-4 shadow-sm'>
                <div className='mb-3 flex items-center justify-between gap-3'>
                  <h3 className='font-semibold'>Class discussion</h3>
                  <Button variant='outline' size='sm'>
                    View comments
                  </Button>
                </div>
                <div className='space-y-3'>
                  {submissionQueue.slice(0, 3).map(item => (
                    <div key={item.id} className='flex gap-3'>
                      <Avatar className='size-8'>
                        <AvatarFallback>{getInitials(item.name)}</AvatarFallback>
                      </Avatar>
                      <div className='bg-muted min-w-0 flex-1 rounded-md p-3'>
                        <p className='text-sm font-semibold'>{item.name}</p>
                        <p className='text-muted-foreground mt-1 text-sm'>
                          Reminder to review your notes before the next class and complete the quiz.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className='mt-4 flex gap-2'>
                  <Input placeholder='Add a comment...' className='h-10 rounded-md' />
                  <Button size='icon' className='h-10 w-10 rounded-md'>
                    <Send className='h-4 w-4' />
                  </Button>
                </div>
              </section>
            </div>
          </ScrollArea>
        </section>

        <aside className='border-border/70 hidden min-h-0 border-l xl:block'>
          <SubmissionPanel
            submissionQueue={submissionQueue}
            activeSchedule={activeSchedule}
            activeInstanceStudentsCount={activeInstanceStudents.length}
            selectedContentType={selectedContentType}
            selectedStudent={selectedStudent}
            onMarkAttendance={handleMarkAttendance}
            isMarkingAttendance={markAttendanceMut.isPending}
          />
        </aside>
      </section>
    </main>
  );
}
