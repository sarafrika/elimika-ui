// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
'use client';

import { CourseTrainingRequirements } from '@/app/dashboard/_components/course-training-requirements';
import {
  ClassScheduleCalendar,
  type ClassScheduleItem as CalendarScheduleItem,
} from '@/app/dashboard/student/schedule/classes/[id]/SudentClassSchedule';
import { LessonContentViewerDialog } from '@/components/content-preview/LessonContentPreview';
import {
  type EntityFact,
  EntityHeaderCard,
  type SectionTab,
  SectionTabPanel,
  SectionTabs,
  surfaceTheme,
  useSectionTab,
} from '@/components/data-display';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { LinkShareCard } from '@/components/shared/link-share-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { type ClassDetailsScheduleItem, useClassDetails } from '@/hooks/use-class-details';
import { useClassRoster } from '@/hooks/use-class-roster';
import { useCourseLessonsWithContent } from '@/hooks/use-courselessonwithcontent';
import { useInstructorInfo } from '@/hooks/use-instructor-info';
import { useProgramLessonsWithContent } from '@/hooks/use-programlessonwithcontent';
import { useScheduleStats } from '@/hooks/use-schedule-stats';
import { STALE_TIMES } from '@/lib/query-client';
import { getResourceIcon } from '@/lib/resources-icon';
import { buildSocialShareUrl, openShareWindow, type SharePlatform } from '@/lib/share';
import { cn } from '@/lib/utils';
import {
  getCourseAssessmentsOptions,
  getCourseSkillsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { toPlainSummary } from '@/src/features/catalogue/course-page';
import { useQueries, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  Facebook,
  FileQuestion,
  FileText,
  Globe,
  LayoutGrid,
  Linkedin,
  MapPin,
  MessageCircle,
  Share2,
  Sparkles,
  Twitter,
  Users,
  Wallet,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  CLASS_OVERVIEW_TABS,
  CLASS_OVERVIEW_TAB_LABELS,
  type ClassOverviewTab,
  mergeCourseSkills,
} from './class-overview';

export interface ContentItem {
  uuid: string;
  title: string;
  content_type_uuid: string;
  content_text?: string;
  file_url?: string | null;
  value?: string | null;
  description?: string;
}

export const socialShareActions: Array<{
  icon: typeof Facebook;
  label: string;
  platform: SharePlatform;
}> = [
  { icon: Facebook, label: 'Facebook', platform: 'facebook' },
  { icon: Twitter, label: 'Twitter', platform: 'twitter' },
  { icon: Linkedin, label: 'LinkedIn', platform: 'linkedin' },
  { icon: MessageCircle, label: 'WhatsApp', platform: 'whatsapp' },
  { icon: Share2, label: 'Email', platform: 'email' },
];

/** Where the overview sits: the section it belongs to and how a class is edited from it. */
export interface InstructorClassOverviewRoute {
  /** Breadcrumb id, title and url of the list the class belongs to. */
  section: { id: string; title: string; url: string };
  /** The overview's own url, without the class id. */
  overviewBase: string;
  /** The edit form for a class. */
  editHref: (classUuid: string) => string;
  /** Show the invite and registration link cards on the overview. */
  showShareLinks: boolean;
  /** Page container: the classes route has no layout padding; trainings has its own. */
  containerClassName: string;
}

const TAB_ICONS = {
  overview: LayoutGrid,
  schedule: CalendarDays,
  curriculum: BookOpen,
  students: Users,
  skills: Sparkles,
} as const;

/** Hidden panels still print. */

const infoTile = 'border-border bg-muted/50 rounded-lg border p-4';
const infoLabel = 'text-muted-foreground text-xs font-medium tracking-wide uppercase';

export function InstructorClassOverviewPage({ route }: { route: InstructorClassOverviewRoute }) {
  const router = useRouter();
  const params = useParams();
  const classId = params?.id as string;
  const { replaceBreadcrumbs } = useBreadcrumb();
  const [siteOrigin, setSiteOrigin] = useState('');
  const { value: tab, setValue: setTab, hrefFor } = useSectionTab(CLASS_OVERVIEW_TABS, 'overview');

  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<ContentItem | null>(null);
  const [contentTypeName, setContentTypeName] = useState<string>('');

  useEffect(() => {
    if (!classId) return;

    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/instructor/overview' },
      route.section,
      {
        id: 'preview-training',
        title: 'Preview',
        url: `${route.overviewBase}/${classId}`,
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs, classId, route.section, route.overviewBase]);

  useEffect(() => {
    setSiteOrigin(window.location.origin);
  }, []);

  const { data: combinedClass, isLoading: classIsLoading } = useClassDetails(classId as string);
  const classData = combinedClass?.class;
  const course = combinedClass?.course;
  const programCourses = combinedClass?.pCourses;
  const program = combinedClass?.program;
  const schedules = combinedClass?.schedule ?? [];
  const scheduleStats = useScheduleStats(
    useMemo(
      () =>
        schedules.map(schedule => ({
          duration_minutes: Number(schedule.duration_minutes ?? 0),
        })),
      [schedules]
    )
  );
  const calendarSchedules = useMemo<CalendarScheduleItem[]>(
    () =>
      schedules.map((schedule: ClassDetailsScheduleItem) => ({
        uuid: schedule.uuid ?? '',
        class_definition_uuid: schedule.class_definition_uuid ?? classId,
        start_time: new Date(schedule.start_time).toISOString(),
        end_time: new Date(schedule.end_time).toISOString(),
        timezone: schedule.timezone ?? 'UTC',
        title: schedule.title ?? classData?.title ?? 'Class session',
        location_type: schedule.location_type === 'ONLINE' ? 'ONLINE' : 'PHYSICAL',
        status: schedule.status === 'CANCELLED' ? 'CANCELLED' : 'SCHEDULED',
        duration_minutes: Number(schedule.duration_minutes ?? 0),
        duration_formatted: String(schedule.duration_formatted ?? ''),
        time_range: String(schedule.time_range ?? ''),
        is_currently_active: Boolean(schedule.is_currently_active),
        can_be_cancelled: Boolean(schedule.can_be_cancelled),
      })),
    [classData?.title, classId, schedules]
  );
  const amountPayable = (classData?.sale_price! * scheduleStats?.totalHours) as number;

  const formattedStart = useMemo(() => {
    if (!classData?.default_start_time) return 'N/A';
    try {
      return format(new Date(classData.default_start_time), 'MMM dd, yyyy • hh:mm a');
    } catch {
      return 'N/A';
    }
  }, [classData?.default_start_time]);

  const { data: cAssesssment } = useQuery({
    ...getCourseAssessmentsOptions({
      path: { courseUuid: classData?.course_uuid as string },
      query: { pageable: {} },
    }),
    enabled: !!classData?.course_uuid,
  });

  const { instructorInfo } = useInstructorInfo({
    instructorUuid: classData?.default_instructor_uuid as string,
  });
  const instructor = instructorInfo?.data;

  const {
    isLoading: isAllLessonsDataLoading,
    lessons: lessonsWithContent,
    contentTypeMap,
  } = useCourseLessonsWithContent({ courseUuid: classData?.course_uuid as string });

  const {
    isLoading,
    coursesWithLessons,
    contentTypeMap: programContentTypeMap,
  } = useProgramLessonsWithContent({
    programUuid: classData?.program_uuid as string,
    programCourses: programCourses,
  });

  const isClassForProgram = !!classData?.program_uuid;
  const isClassForCourse = !!classData?.course_uuid;

  const totalProgramLessons = coursesWithLessons?.reduce((sum, courseData) => {
    return sum + (courseData.lessons?.length || 0);
  }, 0);
  const lessonCount = lessonsWithContent?.length || totalProgramLessons || 0;

  // The skills the class teaches: its course's tags, or each program course's.
  const skillCourseIds = useMemo<string[]>(() => {
    if (course?.uuid) return [course.uuid];
    return (programCourses ?? []).map(c => c.uuid).filter(Boolean);
  }, [course?.uuid, programCourses]);
  const skillQueries = useQueries({
    queries: skillCourseIds.map(uuid => ({
      ...getCourseSkillsOptions({ path: { uuid } }),
      staleTime: STALE_TIMES.reference,
    })),
  });
  const skillsLoading = skillQueries.some(query => query.isPending);
  const skills = useMemo(
    () => mergeCourseSkills(skillQueries.map(query => query.data?.data)),
    [skillQueries]
  );

  const registrationLink = useMemo(() => {
    if (!siteOrigin) return '';

    if (course?.uuid) {
      return `${siteOrigin}/dashboard/student/courses/available-classes/${course.uuid}/enroll?id=${classId}`;
    }

    if (program?.uuid) {
      return `${siteOrigin}/dashboard/student/courses/available-programs/${program.uuid}/enroll?id=${classId}`;
    }

    return '';
  }, [classId, course?.uuid, program?.uuid, siteOrigin]);

  const inviteLink = useMemo(() => {
    if (!siteOrigin) return '';

    if (course?.uuid) {
      return `${siteOrigin}/class-invite?id=${classId}`;
    }

    if (program?.uuid) {
      return `${siteOrigin}/program-invite?id=${classId}`;
    }

    return '';
  }, [classId, course?.uuid, program?.uuid, siteOrigin]);

  const totalAssignments = cAssesssment?.data?.content?.length || 0;

  const { roster } = useClassRoster(classId);

  const handleViewContent = (content: ContentItem, contentType: string) => {
    setSelectedLesson(content);
    setContentTypeName(contentType);
    setIsViewerOpen(true);
  };

  if (isAllLessonsDataLoading || classIsLoading) {
    return (
      <div className={cn(route.containerClassName, 'flex flex-col gap-[18px]')}>
        <Skeleton className='h-[180px] w-full rounded-2xl' />
        <Skeleton className='h-11 w-full max-w-xl' />
        <div className={surfaceTheme.cardGrid}>
          <Skeleton className='h-[120px]' />
          <Skeleton className='h-[120px]' />
          <Skeleton className='h-[120px]' />
          <Skeleton className='h-[120px]' />
        </div>
      </div>
    );
  }

  const summary = toPlainSummary(classData?.description);
  const facts: EntityFact[] = [
    instructor?.full_name ? { key: 'instructor', icon: Users, label: instructor.full_name } : null,
    {
      key: 'hours',
      icon: Clock,
      value: scheduleStats?.totalHours ?? 0,
      label: classData?.duration_formatted
        ? `hours (${classData.duration_formatted}/class)`
        : 'hours',
    },
    { key: 'lessons', icon: BookOpen, value: lessonCount, label: 'lessons' },
    { key: 'assessments', icon: FileText, value: totalAssignments, label: 'assignments/quizzes' },
    { key: 'start', icon: CalendarDays, label: `Starts ${formattedStart}` },
    classData?.location_type
      ? {
          key: 'location',
          icon: MapPin,
          label: classData.location_type.toLowerCase().replace('_', ' '),
        }
      : null,
    {
      key: 'fee',
      icon: Wallet,
      label: `KES ${Number.isFinite(amountPayable) ? amountPayable.toFixed(2) : '0.00'}`,
    },
    {
      key: 'students',
      icon: Users,
      value: `${roster?.length ?? 0} / ${classData?.max_participants ?? '—'}`,
      label: 'students',
    },
  ].filter(Boolean) as EntityFact[];

  const counts: Partial<Record<ClassOverviewTab, number>> = {
    schedule: schedules.length,
    curriculum: lessonCount,
    students: roster?.length ?? 0,
    skills: skillsLoading ? undefined : skills.length,
  };
  const tabs: SectionTab<ClassOverviewTab>[] = CLASS_OVERVIEW_TABS.map(id => ({
    id,
    label: CLASS_OVERVIEW_TAB_LABELS[id],
    icon: TAB_ICONS[id],
    count: counts[id],
  }));

  return (
    <div className={cn(route.containerClassName, 'flex flex-col gap-[18px]')}>
      <EntityHeaderCard
        eyebrow='Class'
        title={classData?.title ?? 'Class'}
        badges={
          <>
            {classData?.is_active ? (
              <Badge variant='success' className='gap-1'>
                <CheckCircle aria-hidden className='size-3' />
                Active
              </Badge>
            ) : (
              <Badge
                variant='outline'
                className='border-warning/40 bg-warning/10 text-warning gap-1'
              >
                <AlertCircle aria-hidden className='size-3' />
                Inactive
              </Badge>
            )}
            {course?.category_names?.map((category: string) => (
              <Badge key={category} variant='outline' className='text-xs'>
                {category}
              </Badge>
            ))}
          </>
        }
        description={summary ? <p className='line-clamp-2'>{summary}</p> : undefined}
        context={
          classData?.is_active ? (
            <span className='text-success'>Your class is live and accepting new students.</span>
          ) : (
            <span className='text-warning'>
              This class is currently not active. Students cannot enroll until it is activated.
            </span>
          )
        }
        actions={
          <Button
            onClick={() => router.push(route.editHref(classData?.uuid))}
            variant='outline'
            size='sm'
            className='gap-2'
          >
            <Edit className='h-4 w-4' />
            Edit Class
          </Button>
        }
        facts={facts}
      />

      <SectionTabs
        tabs={tabs}
        value={tab}
        onValueChange={setTab}
        hrefFor={hrefFor}
        label='Class sections'
        sticky
      >
        <SectionTabPanel value='overview' className='flex flex-col gap-5'>
          <div className={surfaceTheme.cardGrid}>
            <div className={infoTile}>
              <span className={infoLabel}>{program?.uuid ? 'Program courses' : 'Course'}</span>
              {course?.uuid && (
                <div className='text-foreground mt-2 text-base font-semibold'>
                  {course?.name || '—'}
                </div>
              )}

              {program?.uuid && (
                <div className='text-foreground mt-2 text-base font-semibold'>
                  {programCourses && programCourses?.length > 0 ? (
                    <ul className='list-inside list-disc space-y-1'>
                      {programCourses?.map(c => <li key={c.uuid}>{c.name || '—'}</li>)}
                    </ul>
                  ) : (
                    '—'
                  )}
                </div>
              )}
            </div>

            <div className={infoTile}>
              <span className={infoLabel}>Class Type</span>
              <div className='mt-2 flex items-center gap-2'>
                {classData?.location_type === 'ONLINE' && (
                  <div className='bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full'>
                    <span className='text-primary text-xs font-bold'>ON</span>
                  </div>
                )}
                {classData?.location_type === 'IN_PERSON' && (
                  <div className='bg-accent/50 flex h-8 w-8 items-center justify-center rounded-full'>
                    <span className='text-accent-foreground text-xs font-bold'>IP</span>
                  </div>
                )}
                {classData?.location_type === 'HYBRID' && (
                  <div className='bg-secondary flex h-8 w-8 items-center justify-center rounded-full'>
                    <span className='text-secondary-foreground text-xs font-bold'>HY</span>
                  </div>
                )}
                <span className='text-foreground text-base font-semibold capitalize'>
                  {classData?.location_type?.toLowerCase().replace('_', ' ') || '—'}
                </span>
              </div>
            </div>

            <div className={infoTile}>
              <span className={infoLabel}>Academic Period</span>
              <div className='mt-2 text-sm'>
                {classData?.default_start_time && classData?.default_end_time ? (
                  <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
                    <span className='text-muted-foreground font-medium'>Date:</span>
                    <span className='text-foreground font-semibold'>
                      {new Date(classData.default_start_time).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span className='text-foreground font-semibold'>
                      {new Date(classData.default_start_time).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className='text-foreground font-semibold'>
                      {new Date(classData.default_end_time).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ) : (
                  <span className='text-foreground'>—</span>
                )}
              </div>
            </div>

            <div className={infoTile}>
              <span className={infoLabel}>Visibility</span>
              <div className='mt-2 flex items-center gap-2'>
                {classData?.class_visibility === 'PUBLIC' ? (
                  <>
                    <div className='bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full'>
                      <Globe className='text-primary h-4 w-4' />
                    </div>
                    <div>
                      <div className='text-foreground text-base font-semibold'>Public</div>
                      <div className='text-muted-foreground text-xs'>Visible to everyone</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className='bg-muted flex h-8 w-8 items-center justify-center rounded-full'>
                      <Globe className='text-muted-foreground h-4 w-4' />
                    </div>
                    <div>
                      <div className='text-foreground text-base font-semibold'>Private</div>
                      <div className='text-muted-foreground text-xs'>Invitation only</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className='grid items-start gap-5 2xl:grid-cols-2'>
            <div className={infoTile}>
              <span className={infoLabel}>Description</span>
              <div className='text-foreground mt-2 max-w-prose'>
                {classData?.description ? (
                  <RichTextRenderer htmlString={classData.description as string} />
                ) : (
                  <p className='text-muted-foreground text-sm italic'>No description provided</p>
                )}
              </div>
            </div>

            <CourseTrainingRequirements
              requirements={course?.training_requirements}
              viewerRole='instructor'
              description='Course delivery requirements for students, organisations, instructors, and creators.'
            />
          </div>

          {route.showShareLinks ? (
            <div className='grid grid-cols-1 gap-5 xl:grid-cols-2'>
              <LinkShareCard
                description='Send students directly to the class invite page.'
                title='Class Invite Link'
                url={inviteLink}
                footer={
                  <ShareButtons
                    url={inviteLink}
                    title={classData?.title}
                    what='class invite link'
                    fallback='Class invite'
                  />
                }
              />

              <LinkShareCard
                description='Copy or share the registration link for enrollment.'
                title='Registration Link'
                url={registrationLink}
                footer={
                  <ShareButtons
                    url={registrationLink}
                    title={classData?.title}
                    what='registration link'
                    fallback='Registration link'
                  />
                }
              />
            </div>
          ) : null}
        </SectionTabPanel>

        <SectionTabPanel value='schedule'>
          <ClassScheduleCalendar schedules={calendarSchedules} />
        </SectionTabPanel>

        <SectionTabPanel value='curriculum'>
          <Card>
            <CardContent className='space-y-3 p-4'>
              {(isAllLessonsDataLoading || isLoading) && <Spinner />}

              {isClassForCourse && !isAllLessonsDataLoading && lessonsWithContent?.length === 0 && (
                <div className='bg-muted/30 text-muted-foreground flex flex-col items-center justify-center rounded-lg p-6 text-center text-sm'>
                  <FileQuestion className='text-muted-foreground mb-3 h-8 w-8' />
                  <h4 className='font-medium'>No Class Resources</h4>
                  <p>This class doesn&apos;t have any resources/content yet.</p>
                </div>
              )}

              {isClassForProgram && !isLoading && coursesWithLessons?.length === 0 && (
                <div className='bg-muted/30 text-muted-foreground flex flex-col items-center justify-center rounded-lg p-6 text-center text-sm'>
                  <FileQuestion className='text-muted-foreground mb-3 h-8 w-8' />
                  <h4 className='font-medium'>No Program Resources</h4>
                  <p>This program doesn&apos;t have any resources/content yet.</p>
                </div>
              )}

              {isClassForCourse &&
                lessonsWithContent?.map((skill, skillIndex) => (
                  <div key={skillIndex}>
                    <div className='text-foreground mb-2 font-semibold'>
                      Lesson {skillIndex + 1}: {skill.lesson?.title}
                    </div>
                    <div className={surfaceTheme.cardGrid}>
                      {skill?.content?.data?.map((c, cIndex) => (
                        <LessonContentRow
                          key={c.uuid}
                          index={cIndex}
                          content={c}
                          typeName={contentTypeMap[c.content_type_uuid] || 'file'}
                          onView={handleViewContent}
                        />
                      ))}
                    </div>
                  </div>
                ))}

              {isClassForProgram &&
                coursesWithLessons?.map(courseData => (
                  <div key={courseData.course.uuid} className='space-y-4'>
                    <div className='border-border bg-muted/50 flex items-center gap-2 rounded-lg border p-4'>
                      <BookOpen className='text-primary h-5 w-5' />
                      <span className='text-foreground text-lg font-semibold'>
                        {courseData.course.name}
                      </span>
                    </div>

                    {courseData.lessons.map((skill, skillIndex) => (
                      <div key={skill.lesson.uuid} className='ml-4'>
                        <div className='text-foreground mb-2 font-semibold'>
                          Lesson {skillIndex + 1}: {skill.lesson?.title}
                        </div>
                        <div className={surfaceTheme.cardGrid}>
                          {skill?.content?.data?.map((c, cIndex) => (
                            <LessonContentRow
                              key={c.uuid}
                              index={cIndex}
                              content={c}
                              typeName={programContentTypeMap[c.content_type_uuid] || 'file'}
                              onView={handleViewContent}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
            </CardContent>
          </Card>
        </SectionTabPanel>

        <SectionTabPanel value='students'>
          <Card>
            <CardHeader>
              <CardTitle>Enrolled Students</CardTitle>
            </CardHeader>

            <CardContent>
              {!roster || roster.length === 0 ? (
                <div className='py-8 text-center'>
                  <Users className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                  <h3 className='text-foreground mb-2 font-medium'>No students enrolled yet</h3>
                  <p className='text-muted-foreground text-sm'>
                    Share your registration link to start getting enrollments
                  </p>
                </div>
              ) : (
                <div className='border-border overflow-x-auto rounded-md border'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Primary Guardian</TableHead>
                        <TableHead>Secondary Guardian</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {roster.map((entry, index) => {
                        const student = entry.student?.data;
                        const user = entry.user;

                        return (
                          <TableRow key={index}>
                            <TableCell className='font-medium'>
                              {user?.full_name || 'Unknown Student'}
                            </TableCell>
                            <TableCell>{user?.email || '--'}</TableCell>
                            <TableCell>{student?.primaryGuardianContact || '--'}</TableCell>
                            <TableCell>{student?.secondaryGuardianContact || '--'}</TableCell>
                            <TableCell>
                              <Badge variant='success'>
                                {entry.enrollment?.status || 'UNKNOWN'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </SectionTabPanel>

        <SectionTabPanel value='skills'>
          {skillsLoading ? (
            <div className={surfaceTheme.cardGrid}>
              <Skeleton className='h-[72px]' />
              <Skeleton className='h-[72px]' />
              <Skeleton className='h-[72px]' />
            </div>
          ) : skills.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title='No skills tagged yet'
              description={`The ${isClassForProgram ? "program's courses have" : 'course has'} no skills tagged. The course creator adds them on the course.`}
            />
          ) : (
            <ul className={surfaceTheme.cardGrid}>
              {skills.map(skill => (
                <li
                  key={skill.skill_uuid ?? skill.skill_slug ?? skill.skill_name}
                  className='border-border bg-card flex items-center gap-3 rounded-lg border p-4'
                >
                  <span className='bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-md'>
                    <Sparkles aria-hidden className='size-4' />
                  </span>
                  <div className='min-w-0'>
                    <p className='text-foreground truncate font-medium'>{skill.skill_name}</p>
                    <p className='text-muted-foreground text-xs capitalize'>
                      {[skill.level, skill.weight ? `weight ${skill.weight}/5` : null]
                        .filter(Boolean)
                        .join(' · ')}
                      {skill.skill_active === false ? ' · retired' : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionTabPanel>
      </SectionTabs>

      <LessonContentViewerDialog
        open={isViewerOpen}
        onOpenChange={setIsViewerOpen}
        content={selectedLesson}
        contentType={contentTypeName}
      />
    </div>
  );
}

function LessonContentRow({
  index,
  content,
  typeName,
  onView,
}: {
  index: number;
  content: ContentItem;
  typeName: string;
  onView: (content: ContentItem, typeName: string) => void;
}) {
  return (
    <div className='border-border bg-card hover:bg-accent/50 flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors'>
      <div className='flex min-w-0 items-center gap-3'>
        {getResourceIcon(typeName)}
        <div className='min-w-0'>
          <div className='text-foreground truncate font-medium'>
            {index + 1}. {content.title}
          </div>
          <div className='text-muted-foreground text-sm capitalize'>{typeName}</div>
        </div>
      </div>

      <Button
        onClick={() => onView(content, typeName)}
        variant='outline'
        size='sm'
        className='shrink-0 gap-2'
      >
        <Eye className='h-3 w-3' />
        View
      </Button>
    </div>
  );
}

function ShareButtons({
  url,
  title,
  what,
  fallback,
}: {
  url: string;
  title?: string;
  what: string;
  fallback: string;
}) {
  return (
    <div className='space-y-3'>
      <h4 className='text-sm font-medium'>Share via</h4>
      <div className='flex flex-wrap gap-2'>
        {socialShareActions.map(({ icon: Icon, label, platform }) => (
          <Button
            key={label}
            aria-label={`Share ${what} on ${label}`}
            className='gap-2'
            disabled={!url}
            onClick={() =>
              openShareWindow(
                buildSocialShareUrl(platform, {
                  title,
                  url,
                  description: `Check out this class: ${title ?? fallback}`,
                })
              )
            }
            size='sm'
            variant='outline'
          >
            <Icon className='h-4 w-4' />
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
