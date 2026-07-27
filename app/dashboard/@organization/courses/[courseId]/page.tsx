// @ts-nocheck -- 1:1 Lovable port; @hey-api generated-client type drift
'use client';

import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  Archive,
  ArrowLeft,
  BookOpen,
  Briefcase,
  ClipboardList,
  Clock,
  Copy,
  Download,
  FileText,
  HelpCircle,
  Lock,
  Paperclip,
  Pencil,
  PlayCircle,
  PlusSquare,
  Printer,
  Share2,
  Star,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { AsyncSection } from '@/components/data/async-section';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrganisation } from '@/context/organisation-context';
import { extractEntity, extractList, extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import type { ClassDefinition, ContentType, Course, CourseTrainingApplication, DifficultyLevel, User } from '@/services/client';
import {
  getAllContentTypesOptions,
  getAllDifficultyLevelsOptions,
  getClassDefinitionsForOrganisationOptions,
  getCourseByUuidOptions,
  getCourseEnrollmentsOptions,
  getUsersByOrganisationAndDomainOptions,
  searchTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { client } from '@/services/client/client.gen';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';

const currency = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 });
const stripHtml = (html?: string) => (html ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

// Shape returned by GET /courses/{uuid}/organisations/{uuid}/content.
type OrgLessonContent = { uuid?: string; title?: string; content_type_uuid?: string; is_required?: boolean };
type OrgLesson = {
  uuid?: string;
  lesson_number?: number;
  title?: string;
  description?: string;
  learning_objectives?: string;
  content_count?: number;
  contents?: OrgLessonContent[];
};
type OrgCourseContent = {
  full_access?: boolean;
  total_lessons?: number;
  average_rating?: number | null;
  total_reviews?: number;
  lessons?: OrgLesson[];
};

// Pick an icon from a content-type name (video / quiz / assignment / document / …).
const kindIconFor = (typeName?: string) => {
  const n = (typeName ?? '').toLowerCase();
  if (n.includes('video')) return PlayCircle;
  if (n.includes('quiz') || n.includes('assessment')) return HelpCircle;
  if (n.includes('assign')) return ClipboardList;
  if (n.includes('text') || n.includes('article') || n.includes('read') || n.includes('doc') || n.includes('pdf')) return FileText;
  return Paperclip;
};

const RATE_TIERS: { method: string; fmt: string; loc: string; key: string }[] = [
  { method: 'Group In-Person', fmt: 'GROUP', loc: 'IN_PERSON', key: 'group_inperson_rate' },
  { method: 'Group Virtual', fmt: 'GROUP', loc: 'ONLINE', key: 'group_online_rate' },
  { method: 'Private In-Person', fmt: 'INDIVIDUAL', loc: 'IN_PERSON', key: 'private_inperson_rate' },
  { method: 'Private Virtual', fmt: 'INDIVIDUAL', loc: 'ONLINE', key: 'private_online_rate' },
];

const instructorName = (u?: User) => (u ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email || 'Instructor' : '—');
const instructorInitials = (u?: User) =>
  u ? `${u.first_name?.[0] ?? ''}${u.last_name?.[0] ?? ''}`.toUpperCase() || '?' : '?';

export default function CourseDetailPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params?.courseId ?? '';
  const router = useRouter();
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';

  const courseQuery = useQuery({ ...getCourseByUuidOptions({ path: { uuid: courseId } }), enabled: Boolean(courseId) });
  const course = extractEntity<Course>(courseQuery.data);

  const difficultyQuery = useQuery({ ...getAllDifficultyLevelsOptions() });
  const level = useMemo(() => {
    if (!course?.difficulty_uuid) return null;
    return extractList<DifficultyLevel>(difficultyQuery.data).find(d => d.uuid === course.difficulty_uuid)?.name ?? null;
  }, [course, difficultyQuery.data]);

  const applicationsQuery = useQuery({
    ...searchTrainingApplicationsOptions({
      query: { searchParams: { applicant_uuid_eq: organisationUuid, applicant_type_eq: 'organisation' }, pageable: { page: 0, size: 100 } },
    }),
    enabled: Boolean(organisationUuid),
  });
  const application = (applicationsQuery.data?.data?.content ?? []).find((a: CourseTrainingApplication) => a.course_uuid === courseId);

  const classesQuery = useQuery({
    ...getClassDefinitionsForOrganisationOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
  });
  const classDefs: ClassDefinition[] = useMemo(
    () => (classesQuery.data?.data ?? []).map(c => c.class_definition).filter(cd => cd?.course_uuid === courseId),
    [classesQuery.data, courseId]
  );

  const instructorsQuery = useQuery({
    ...getUsersByOrganisationAndDomainOptions({ path: { uuid: organisationUuid, domainName: 'instructor' } }),
    enabled: Boolean(organisationUuid),
  });
  const instructor = useMemo(() => {
    const uuid = classDefs[0]?.default_instructor_uuid;
    if (!uuid) return undefined;
    return extractPage<User>(instructorsQuery.data).items.find(u => u.uuid === uuid);
  }, [classDefs, instructorsQuery.data]);

  const enrolQuery = useQuery({
    ...getCourseEnrollmentsOptions({ path: { courseUuid: courseId }, query: { pageable: { page: 0, size: 1 } } }),
    enabled: Boolean(courseId),
    retry: false,
  });
  const students = getTotalFromMetadata(extractPage(enrolQuery.data).metadata);

  // Approval-gated course content. Served by the org content endpoint: full lesson
  // content when the school is approved to train, outline-only summary otherwise.
  const contentQuery = useQuery({
    queryKey: ['organisation-course-content', courseId, organisationUuid],
    enabled: Boolean(courseId && organisationUuid),
    retry: false,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const res = await client.get({
        url: '/api/v1/courses/{courseUuid}/organisations/{organisationUuid}/content',
        path: { courseUuid: courseId, organisationUuid },
        security: [{ scheme: 'bearer', type: 'http' }],
      });
      return extractEntity(res.data);
    },
  });
  const content = contentQuery.data as OrgCourseContent | null;
  const lessons = content?.lessons ?? [];
  const fullAccess = Boolean(content?.full_access);

  const contentTypesQuery = useQuery({ ...getAllContentTypesOptions() });
  const contentTypeName = useMemo(() => {
    const map = new Map<string, string>();
    extractList<ContentType>(contentTypesQuery.data).forEach(ct => ct.uuid && map.set(ct.uuid, ct.name ?? ''));
    return map;
  }, [contentTypesQuery.data]);

  const pricing = RATE_TIERS.filter(t => Number(application?.rate_card?.[t.key] ?? 0) > 0).map(t => ({
    method: t.method,
    amount: Number(application?.rate_card?.[t.key] ?? 0),
    lessons: Number(classDefs.find(cd => cd.session_format === t.fmt && cd.location_type === t.loc)?.scheduled_session_count ?? 0),
  }));

  const cats = course?.category_names ?? [];
  const image = toAuthenticatedMediaUrl(course?.banner_url ?? course?.thumbnail_url) ?? null;
  const status = course?.active !== false && course ? 'Active' : 'Inactive';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Could not copy link');
    }
  };

  if (courseQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    );
  }
  if (!course) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Course not found.</p>
        <Link href="/dashboard/courses" className="text-primary underline">
          Back to Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/courses')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Courses
        </Button>
        <Badge variant={status === 'Active' ? 'default' : 'secondary'}>{status}</Badge>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="grid gap-4 p-4 sm:grid-cols-[220px_1fr] sm:p-6">
          {image ? (
            <img src={image} alt={course.name} className="h-40 w-full rounded-lg object-cover sm:h-full" />
          ) : (
            <div className="flex h-40 w-full items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 sm:h-full">
              <Users className="h-8 w-8 text-primary/50" />
            </div>
          )}
          <div className="space-y-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{course.name}</h1>
              <p className="text-sm text-muted-foreground">
                {[cats[0], cats[1]].filter(Boolean).join(' • ') || 'General'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{level ?? '—'}</Badge>
              <Badge variant="outline">{course.total_duration_display ?? '—'}</Badge>
              <Badge variant="outline">
                <Users className="mr-1 h-3 w-3" />
                {students} students
              </Badge>
              <Badge variant="outline">{classDefs.length} classes</Badge>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Avatar className="h-8 w-8">
                {instructor?.profile_image_url && <AvatarImage src={instructor.profile_image_url} alt={instructorName(instructor)} />}
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{instructorInitials(instructor)}</AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <div className="font-medium">{instructorName(instructor)}</div>
                <div className="text-xs text-muted-foreground">Lead instructor</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">About this course</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="text-muted-foreground">{stripHtml(course.description) || 'No description provided.'}</p>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase text-muted-foreground">Created</dt>
                  <dd className="font-medium">{course.created_date ? dayjs(course.created_date).format('DD MMM YYYY') : '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-muted-foreground">Duration</dt>
                  <dd className="font-medium">{course.total_duration_display ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-muted-foreground">Level</dt>
                  <dd className="font-medium">{level ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-muted-foreground">Subject</dt>
                  <dd className="font-medium">{cats[1] ?? cats[0] ?? '—'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="curriculum" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                {content?.total_lessons ?? lessons.length} lessons
              </Badge>
              {content?.average_rating != null && (
                <Badge variant="outline" className="gap-1">
                  <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                  {Number(content.average_rating).toFixed(1)} ({content?.total_reviews ?? 0})
                </Badge>
              )}
              {fullAccess && (
                <Badge variant="outline" className="gap-1 border-success/40 bg-success/10 text-success">
                  Full read access
                </Badge>
              )}
            </div>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" /> Read-only — only the creator can edit
            </span>
          </div>

          <AsyncSection
            loading={contentQuery.isLoading && !contentQuery.data}
            error={contentQuery.error}
            empty={!contentQuery.isLoading && lessons.length === 0}
            emptyTitle="No curriculum yet"
            emptyDescription="This course doesn't have any published lessons yet."
          >
            {!fullAccess && lessons.length > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2.5 text-sm">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <p className="text-muted-foreground">
                  You're seeing the course outline. Full lesson content unlocks once your school is approved to train this course.
                </p>
              </div>
            )}
            {lessons.map((lesson: OrgLesson) => (
              <Card key={lesson.lesson_number ?? lesson.uuid} className="mt-3">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {lesson.title ?? `Lesson ${lesson.lesson_number}`}
                  </CardTitle>
                  {lesson.learning_objectives && (
                    <p className="text-sm text-muted-foreground">{stripHtml(lesson.learning_objectives)}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {fullAccess && Array.isArray(lesson.contents) ? (
                    lesson.contents.map((item: OrgLessonContent) => {
                      const typeName = contentTypeName.get(item.content_type_uuid) ?? '';
                      const Icon = kindIconFor(typeName);
                      return (
                        <div key={item.uuid} className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2">
                          <Icon className="h-4 w-4 shrink-0 text-primary" />
                          <span className="min-w-0 flex-1 truncate text-sm">{item.title ?? (typeName || 'Content')}</span>
                          {item.is_required && (
                            <Badge variant="secondary" className="shrink-0 text-[10px]">Required</Badge>
                          )}
                          {typeName && <span className="shrink-0 text-xs text-muted-foreground">{typeName}</span>}
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                      <Lock className="h-3.5 w-3.5" />
                      {lesson.content_count ?? 0} content items — locked until approved
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </AsyncSection>
        </TabsContent>

        <TabsContent value="pricing" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Delivery methods & pricing</CardTitle>
            </CardHeader>
            <CardContent>
              {pricing.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pricing configured for this course yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Method</TableHead>
                        <TableHead>Lessons</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pricing.map(p => (
                        <TableRow key={p.method}>
                          <TableCell className="font-medium">{p.method}</TableCell>
                          <TableCell>{p.lessons}</TableCell>
                          <TableCell className="text-right font-mono">{currency.format(p.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Course actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button variant="outline" className="justify-start" onClick={() => router.push('/dashboard/classes')}>
                  <PlusSquare className="mr-2 h-4 w-4" /> Create class
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => router.push('/dashboard/instructors')}>
                  <Briefcase className="mr-2 h-4 w-4" /> Post a job
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => toast.info('Edit is disabled — course records are managed by the course creator.')}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit (locked)
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" /> Print
                </Button>
                <Button variant="outline" className="justify-start" onClick={copyLink}>
                  <Copy className="mr-2 h-4 w-4" /> Copy link
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => toast.success('Share sheet opened')}>
                  <Share2 className="mr-2 h-4 w-4" /> Share
                </Button>
                <Button variant="outline" className="justify-start text-destructive" onClick={() => toast.success(`${course.name} archived`)}>
                  <Archive className="mr-2 h-4 w-4" /> Archive
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
