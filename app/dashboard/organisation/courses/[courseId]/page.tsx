// @ts-nocheck -- 1:1 Lovable port; @hey-api generated-client type drift
'use client';

import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  Archive,
  ArrowLeft,
  Award,
  BookOpen,
  Briefcase,
  ChevronDown,
  ClipboardList,
  Clock,
  Copy,
  Download,
  FileText,
  GraduationCap,
  Heart,
  HelpCircle,
  Layers,
  Lock,
  MessageSquare,
  Paperclip,
  Pencil,
  PlayCircle,
  PlusSquare,
  Printer,
  Share2,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { AsyncSection } from '@/components/data/async-section';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrganisation } from '@/context/organisation-context';
import { extractEntity, extractList, extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import { cn } from '@/lib/utils';
import type {
  ClassDefinition,
  ContentType,
  Course,
  CourseReview,
  CourseTrainingApplication,
  DifficultyLevel,
  User,
} from '@/services/client';
import {
  getAllContentTypesOptions,
  getAllDifficultyLevelsOptions,
  getClassDefinitionsForOrganisationOptions,
  getCourseByUuidOptions,
  getCourseCompletionRateOptions,
  getCourseEnrollmentsOptions,
  getCourseRequirementsOptions,
  getCourseReviewsOptions,
  getPublishedCoursesOptions,
  getUsersByOrganisationAndDomainOptions,
  searchTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { client } from '@/services/client/client.gen';
import { absoluteUrl, publicCourseUrl } from '@/src/features/dashboard/lib/dashboard-url';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';

const currency = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  maximumFractionDigits: 0,
});
const stripHtml = (html?: string) =>
  (html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Split objectives / requirements prose into bullet points.
const toBullets = (text?: string): string[] => {
  const clean = stripHtml(text);
  if (!clean) return [];
  const parts = /[\n•;]/.test(clean) ? clean.split(/[\n•;]+/) : clean.split(/(?<=\.)\s+/);
  return parts
    .map(s => s.trim().replace(/^[-–]\s*/, ''))
    .filter(Boolean)
    .slice(0, 8);
};

type OrgLessonContent = {
  uuid?: string;
  title?: string;
  content_type_uuid?: string;
  is_required?: boolean;
};
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

const kindOf = (typeName?: string): 'video' | 'article' | 'quiz' | 'assignment' | 'file' => {
  const n = (typeName ?? '').toLowerCase();
  if (n.includes('video')) return 'video';
  if (n.includes('quiz') || n.includes('assessment')) return 'quiz';
  if (n.includes('assign')) return 'assignment';
  if (
    n.includes('text') ||
    n.includes('article') ||
    n.includes('read') ||
    n.includes('doc') ||
    n.includes('pdf')
  )
    return 'article';
  return 'file';
};
const kindIcon = {
  video: PlayCircle,
  article: FileText,
  quiz: HelpCircle,
  assignment: ClipboardList,
  file: Paperclip,
};
const kindColor = {
  video: 'text-destructive bg-destructive/10',
  article: 'text-sky-600 bg-sky-50',
  quiz: 'text-warning bg-warning/10',
  assignment: 'text-primary bg-primary/10',
  file: 'text-muted-foreground bg-muted',
};

const RATE_TIERS: { method: string; fmt: string; loc: string; key: string }[] = [
  { method: 'Group In-Person', fmt: 'GROUP', loc: 'IN_PERSON', key: 'group_inperson_hourly_rate' },
  { method: 'Group Virtual', fmt: 'GROUP', loc: 'ONLINE', key: 'group_online_hourly_rate' },
  {
    method: 'Private In-Person',
    fmt: 'INDIVIDUAL',
    loc: 'IN_PERSON',
    key: 'private_inperson_hourly_rate',
  },
  { method: 'Private Virtual', fmt: 'INDIVIDUAL', loc: 'ONLINE', key: 'private_online_hourly_rate' },
];

const instructorName = (u?: User) =>
  u ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email || 'Instructor' : '—';
const instructorInitials = (u?: User) =>
  u ? `${u.first_name?.[0] ?? ''}${u.last_name?.[0] ?? ''}`.toUpperCase() || '?' : '?';
const reviewerName = (r: CourseReview) =>
  r.is_anonymous ? 'Anonymous learner' : (r.created_by?.split('@')[0] ?? 'Learner');
const reviewerInitials = (name: string) =>
  name
    .split(/[\s.@_-]+/)
    .map(s => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'L';

export default function CourseDetailPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params?.courseId ?? '';
  const router = useRouter();
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 1: true });
  const [favorite, setFavorite] = useState(false);

  const courseQuery = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: courseId } }),
    enabled: Boolean(courseId),
  });
  const course = extractEntity<Course>(courseQuery.data);

  const difficultyQuery = useQuery({ ...getAllDifficultyLevelsOptions() });
  const level = useMemo(() => {
    if (!course?.difficulty_uuid) return null;
    return (
      extractList<DifficultyLevel>(difficultyQuery.data).find(
        d => d.uuid === course.difficulty_uuid
      )?.name ?? null
    );
  }, [course, difficultyQuery.data]);

  const applicationsQuery = useQuery({
    ...searchTrainingApplicationsOptions({
      query: {
        searchParams: { applicant_uuid_eq: organisationUuid, applicant_type_eq: 'organisation' },
        pageable: { page: 0, size: 100 },
      },
    }),
    enabled: Boolean(organisationUuid),
  });
  const application = (applicationsQuery.data?.data?.content ?? []).find(
    (a: CourseTrainingApplication) => a.course_uuid === courseId
  );

  const classesQuery = useQuery({
    ...getClassDefinitionsForOrganisationOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
  });
  const classDefs: ClassDefinition[] = useMemo(
    () =>
      (classesQuery.data?.data ?? [])
        .map(c => c.class_definition)
        .filter(cd => cd?.course_uuid === courseId),
    [classesQuery.data, courseId]
  );

  const instructorsQuery = useQuery({
    ...getUsersByOrganisationAndDomainOptions({
      path: { uuid: organisationUuid, domainName: 'instructor' },
    }),
    enabled: Boolean(organisationUuid),
  });
  const instructor = useMemo(() => {
    const uuid = classDefs[0]?.default_instructor_uuid;
    if (!uuid) return undefined;
    return extractPage<User>(instructorsQuery.data).items.find(u => u.uuid === uuid);
  }, [classDefs, instructorsQuery.data]);

  const enrolQuery = useQuery({
    ...getCourseEnrollmentsOptions({
      path: { courseUuid: courseId },
      query: { pageable: { page: 0, size: 1 } },
    }),
    enabled: Boolean(courseId),
    retry: false,
  });
  const students = getTotalFromMetadata(extractPage(enrolQuery.data).metadata);

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
  const totalContentItems = lessons.reduce(
    (acc, l) => acc + (l.content_count ?? l.contents?.length ?? 0),
    0
  );

  const contentTypesQuery = useQuery({ ...getAllContentTypesOptions() });
  const contentTypeName = useMemo(() => {
    const map = new Map<string, string>();
    extractList<ContentType>(contentTypesQuery.data).forEach(
      ct => ct.uuid && map.set(ct.uuid, ct.name ?? '')
    );
    return map;
  }, [contentTypesQuery.data]);

  const reviewsQuery = useQuery({
    ...getCourseReviewsOptions({ path: { courseUuid: courseId } }),
    enabled: Boolean(courseId),
    retry: false,
  });
  const reviews = extractList<CourseReview>(reviewsQuery.data);
  const reviewCount = content?.total_reviews ?? reviews.length;
  const avgRating =
    content?.average_rating ??
    (reviews.length ? reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length : null);
  const distribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    reviews.forEach(r => {
      const i = Math.min(5, Math.max(1, Math.round(r.rating ?? 0)));
      counts[i - 1] += 1;
    });
    return counts;
  }, [reviews]);

  const requirementsQuery = useQuery({
    ...getCourseRequirementsOptions({ path: { courseUuid: courseId } }),
    enabled: Boolean(courseId),
    retry: false,
  });
  const prerequisites = useMemo(() => {
    const list = extractList<Record<string, unknown>>(requirementsQuery.data);
    const fromApi = list
      .map(r => stripHtml(String(r.requirement_text ?? r.description ?? r.name ?? '')))
      .filter(Boolean);
    return fromApi.length ? fromApi.slice(0, 8) : [];
  }, [requirementsQuery.data]);

  const completionQuery = useQuery({
    ...getCourseCompletionRateOptions({ path: { courseUuid: courseId } }),
    enabled: Boolean(courseId),
    retry: false,
  });
  const completion = useMemo(() => {
    const d = extractEntity<Record<string, unknown>>(completionQuery.data);
    const raw = Number(d?.completion_rate ?? d?.rate ?? d?.percentage ?? NaN);
    return Number.isFinite(raw) ? Math.round(raw > 1 ? raw : raw * 100) : null;
  }, [completionQuery.data]);

  const relatedQuery = useQuery({
    ...getPublishedCoursesOptions({ query: { pageable: { page: 0, size: 40 } } }),
  });
  const learnItems = toBullets(course?.objectives);
  const cats = course?.category_names ?? [];
  const related = useMemo(() => {
    const items = extractPage<Course>(relatedQuery.data).items;
    return items
      .filter(c => c.uuid !== courseId && (c.category_names ?? []).some(cn => cats.includes(cn)))
      .slice(0, 3);
  }, [relatedQuery.data, courseId, cats]);

  const pricing = RATE_TIERS.filter(t => Number(application?.rate_card?.[t.key] ?? 0) > 0).map(
    t => ({
      method: t.method,
      amount: Number(application?.rate_card?.[t.key] ?? 0),
      lessons:
        Number(
          classDefs.find(cd => cd.session_format === t.fmt && cd.location_type === t.loc)
            ?.scheduled_session_count ?? 0
        ) ||
        content?.total_lessons ||
        0,
    })
  );

  const image = toAuthenticatedMediaUrl(course?.banner_url ?? course?.thumbnail_url) ?? null;
  const [imgError, setImgError] = useState(false);
  const status = course?.active !== false && course ? 'Active' : 'Inactive';
  const highlights = useMemo(() => {
    const h: { icon: typeof Award; label: string }[] = [];
    if (level) h.push({ icon: GraduationCap, label: `${level} level` });
    if (content?.total_lessons)
      h.push({ icon: BookOpen, label: `${content.total_lessons} structured lessons` });
    if (pricing.length)
      h.push({
        icon: Award,
        label: `${pricing.length} delivery method${pricing.length === 1 ? '' : 's'}`,
      });
    if (classDefs.length)
      h.push({
        icon: Users,
        label: `${classDefs.length} class${classDefs.length === 1 ? '' : 'es'} running`,
      });
    return h;
  }, [level, content, pricing.length, classDefs.length]);

  const copyLink = async () => {
    // Share the public, role-independent URL so the link previews for anyone,
    // not the org-only dashboard URL that only worked inside this dashboard.
    try {
      await navigator.clipboard.writeText(absoluteUrl(publicCourseUrl(courseId)));
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Could not copy link');
    }
  };
  const download = () => {
    const blob = new Blob([JSON.stringify(course ?? {}, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(course?.name ?? 'course').replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Course record downloaded');
  };
  const toggleLesson = (n: number) => setExpanded(prev => ({ ...prev, [n]: !prev[n] }));

  if (courseQuery.isLoading) {
    return (
      <div className='mx-auto w-full max-w-[1400px] space-y-6 px-3 py-4 sm:px-5 lg:px-6'>
        <Skeleton className='h-10 w-40' />
        <Skeleton className='h-72 w-full rounded-2xl' />
      </div>
    );
  }
  if (!course) {
    return (
      <div className='p-6'>
        <p className='text-muted-foreground'>Course not found.</p>
        <Link href='/dashboard/organisation/courses' className='text-primary underline'>
          Back to Courses
        </Link>
      </div>
    );
  }

  const ratingDisplay = avgRating != null ? avgRating.toFixed(1) : '—';

  return (
    <div className='mx-auto w-full max-w-[1400px] space-y-6 px-3 py-4 sm:px-5 lg:px-6'>
      {/* Top bar */}
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => router.push('/dashboard/organisation/courses')}
        >
          <ArrowLeft className='mr-2 h-4 w-4' /> Back to Courses
        </Button>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setFavorite(v => !v);
              toast.success(favorite ? 'Removed from favorites' : 'Added to favorites');
            }}
          >
            <Heart
              className={cn('mr-2 h-4 w-4', favorite && 'fill-destructive text-destructive')}
            />
            {favorite ? 'Saved' : 'Save'}
          </Button>
          <Button variant='outline' size='sm' onClick={copyLink}>
            <Share2 className='mr-2 h-4 w-4' /> Share
          </Button>
          <Badge variant={status === 'Active' ? 'default' : 'secondary'}>{status}</Badge>
        </div>
      </div>

      {/* HERO */}
      <div className='bg-card relative overflow-hidden rounded-2xl border shadow-sm'>
        <div className='relative h-56 w-full sm:h-72 lg:h-80'>
          {image && !imgError ? (
            <img
              src={image}
              alt={course.name}
              onError={() => setImgError(true)}
              className='h-full w-full object-cover'
            />
          ) : (
            <div className='h-full w-full bg-gradient-to-br from-teal-600 to-teal-800' />
          )}
          <div className='absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10' />
          <div className='absolute inset-x-0 bottom-0 flex flex-col gap-4 p-5 sm:p-8'>
            <div className='flex flex-wrap items-center gap-2'>
              {cats[0] && (
                <Badge className='bg-teal-500/95 text-white hover:bg-teal-500'>{cats[0]}</Badge>
              )}
              {cats[1] && (
                <Badge
                  variant='outline'
                  className='border-white/40 bg-white/10 text-white backdrop-blur'
                >
                  {cats[1]}
                </Badge>
              )}
            </div>
            <div className='max-w-3xl'>
              <h1 className='text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl'>
                {course.name}
              </h1>
              <p className='mt-2 line-clamp-2 max-w-2xl text-sm text-white/85 sm:text-base'>
                {stripHtml(course.description)}
              </p>
            </div>
            <div className='flex flex-wrap items-center gap-4 text-sm text-white/90'>
              <div className='flex items-center gap-2'>
                <Avatar className='h-9 w-9 border-2 border-white/70'>
                  {instructor?.profile_image_url && (
                    <AvatarImage
                      src={instructor.profile_image_url}
                      alt={instructorName(instructor)}
                    />
                  )}
                  <AvatarFallback className='bg-teal-700 text-xs text-white'>
                    {instructorInitials(instructor)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className='leading-tight font-medium'>{instructorName(instructor)}</div>
                  <div className='text-xs text-white/70'>Lead instructor</div>
                </div>
              </div>
              <span className='hidden h-6 w-px bg-white/30 sm:block' />
              <div className='flex items-center gap-1.5'>
                <Star className='fill-warning text-warning h-4 w-4' />
                <span className='font-medium'>{ratingDisplay}</span>
                <span className='text-white/70'>({reviewCount} reviews)</span>
              </div>
              <span className='hidden h-6 w-px bg-white/30 sm:block' />
              <div className='flex items-center gap-1.5'>
                <Users className='h-4 w-4' /> {students.toLocaleString()} enrolled
              </div>
            </div>
          </div>
        </div>

        {/* Stat strip */}
        <div className='bg-border grid grid-cols-2 gap-px sm:grid-cols-4'>
          {[
            { icon: BookOpen, label: 'Lessons', value: content?.total_lessons ?? lessons.length },
            { icon: Layers, label: 'Content items', value: totalContentItems },
            { icon: Clock, label: 'Duration', value: course.total_duration_display ?? '—' },
            { icon: GraduationCap, label: 'Level', value: level ?? 'All levels' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className='bg-card flex items-center gap-3 px-4 py-4 sm:px-6'>
              <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600'>
                <Icon className='h-5 w-5' />
              </div>
              <div>
                <div className='text-muted-foreground text-xs tracking-wide uppercase'>{label}</div>
                <div className='text-base font-semibold'>{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN GRID */}
      <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]'>
        <div className='min-w-0 space-y-6'>
          <Tabs defaultValue='overview'>
            <TabsList className='bg-muted/60 h-auto w-full flex-wrap justify-start gap-2 rounded-full p-1.5'>
              {[
                { v: 'overview', label: 'Overview' },
                {
                  v: 'curriculum',
                  label: `Curriculum · ${content?.total_lessons ?? lessons.length}`,
                },
                { v: 'pricing', label: 'Pricing' },
                { v: 'reviews', label: `Reviews · ${reviewCount}` },
                { v: 'actions', label: 'Actions' },
              ].map(t => (
                <TabsTrigger
                  key={t.v}
                  value={t.v}
                  className='data-[state=active]:bg-card rounded-full px-4 py-1.5 text-sm data-[state=active]:text-teal-700 data-[state=active]:shadow-sm'
                >
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* OVERVIEW */}
            <TabsContent value='overview' className='mt-6 space-y-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-base'>
                    <Sparkles className='h-4 w-4 text-teal-600' /> About this course
                  </CardTitle>
                </CardHeader>
                <CardContent className='text-sm leading-relaxed'>
                  <p className='text-muted-foreground'>
                    {stripHtml(course.description) || 'No description provided.'}
                  </p>
                </CardContent>
              </Card>

              {learnItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-base'>
                      <Target className='h-4 w-4 text-teal-600' /> What you'll learn
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className='grid gap-3 sm:grid-cols-2'>
                      {learnItems.map(o => (
                        <li key={o} className='flex items-start gap-2 text-sm'>
                          <CheckIcon /> <span>{o}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              <div className='grid gap-6 md:grid-cols-2'>
                <Card>
                  <CardHeader>
                    <CardTitle className='text-base'>Prerequisites</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {prerequisites.length ? (
                      <ul className='text-muted-foreground space-y-2 text-sm'>
                        {prerequisites.map(p => (
                          <li key={p} className='flex items-start gap-2'>
                            <span className='mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500' />{' '}
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className='text-muted-foreground text-sm'>
                        No prerequisites — open to all learners.
                      </p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className='text-base'>Course highlights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className='grid gap-3 sm:grid-cols-2'>
                      {highlights.map(({ icon: Icon, label }) => (
                        <li key={label} className='flex items-center gap-2 text-sm'>
                          <div className='flex h-8 w-8 items-center justify-center rounded-md bg-teal-50 text-teal-600'>
                            <Icon className='h-4 w-4' />
                          </div>
                          <span>{label}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* CURRICULUM */}
            <TabsContent value='curriculum' className='mt-6 space-y-4'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <div className='text-muted-foreground flex flex-wrap items-center gap-2 text-sm'>
                  <Badge variant='outline' className='gap-1'>
                    <BookOpen className='h-3.5 w-3.5' /> {content?.total_lessons ?? lessons.length}{' '}
                    lessons
                  </Badge>
                  {fullAccess ? (
                    <Badge
                      variant='outline'
                      className='border-success/40 bg-success/10 text-success gap-1'
                    >
                      Full read access
                    </Badge>
                  ) : (
                    <Badge
                      variant='outline'
                      className='border-warning/40 bg-warning/10 text-warning gap-1'
                    >
                      <Lock className='h-3 w-3' /> Preview
                    </Badge>
                  )}
                </div>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() =>
                      setExpanded(Object.fromEntries(lessons.map(l => [l.lesson_number, true])))
                    }
                  >
                    Expand all
                  </Button>
                  <Button variant='ghost' size='sm' onClick={() => setExpanded({})}>
                    Collapse all
                  </Button>
                </div>
              </div>

              <AsyncSection
                loading={contentQuery.isLoading && !contentQuery.data}
                error={contentQuery.error}
                empty={!contentQuery.isLoading && lessons.length === 0}
                emptyTitle='No curriculum yet'
                emptyDescription="This course doesn't have any published lessons yet."
              >
                <div className='space-y-3'>
                  {lessons.map((lesson: OrgLesson) => {
                    const num = lesson.lesson_number ?? 0;
                    const isOpen = !!expanded[num];
                    const items = lesson.contents ?? [];
                    return (
                      <Card key={num || lesson.uuid} className='overflow-hidden'>
                        <button
                          type='button'
                          onClick={() => toggleLesson(num)}
                          className='hover:bg-muted/40 flex w-full items-center gap-4 p-4 text-left transition'
                        >
                          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 text-sm font-semibold text-white shadow-sm'>
                            {num}
                          </div>
                          <div className='min-w-0 flex-1'>
                            <div className='truncate font-medium'>
                              {lesson.title ?? `Lesson ${num}`}
                            </div>
                            {lesson.learning_objectives && (
                              <div className='text-muted-foreground truncate text-xs'>
                                {stripHtml(lesson.learning_objectives)}
                              </div>
                            )}
                          </div>
                          <div className='text-muted-foreground hidden items-center gap-3 text-xs sm:flex'>
                            <span>{lesson.content_count ?? items.length} items</span>
                          </div>
                          <ChevronDown
                            className={cn(
                              'text-muted-foreground h-4 w-4 shrink-0 transition-transform',
                              isOpen && 'rotate-180'
                            )}
                          />
                        </button>
                        {isOpen && (fullAccess ? items.length > 0 : true) && (
                          <>
                            <Separator />
                            <div className='space-y-1.5 p-3'>
                              {fullAccess ? (
                                items.map((item: OrgLessonContent) => {
                                  const typeName =
                                    contentTypeName.get(item.content_type_uuid) ?? '';
                                  const kind = kindOf(typeName);
                                  const Icon = kindIcon[kind];
                                  return (
                                    <div
                                      key={item.uuid}
                                      className='hover:bg-muted/50 flex items-center gap-3 rounded-lg px-3 py-2 transition'
                                    >
                                      <div
                                        className={cn(
                                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                                          kindColor[kind]
                                        )}
                                      >
                                        <Icon className='h-4 w-4' />
                                      </div>
                                      <span className='min-w-0 flex-1 truncate text-sm'>
                                        {item.title ?? (typeName || 'Content')}
                                      </span>
                                      {item.is_required && (
                                        <Badge variant='secondary' className='shrink-0 text-[10px]'>
                                          Required
                                        </Badge>
                                      )}
                                      {typeName && (
                                        <span className='text-muted-foreground shrink-0 text-xs'>
                                          {typeName}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })
                              ) : (
                                <div className='bg-muted/20 text-muted-foreground flex items-center gap-2 rounded-lg border px-3 py-2 text-xs'>
                                  <Lock className='h-3.5 w-3.5' /> {lesson.content_count ?? 0}{' '}
                                  content items — locked until approved
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </AsyncSection>
              <p className='text-muted-foreground flex items-center gap-1 text-xs'>
                <Lock className='h-3.5 w-3.5' /> Read-only — only the creator can edit
              </p>
            </TabsContent>

            {/* PRICING */}
            <TabsContent value='pricing' className='mt-6 space-y-4'>
              {pricing.length === 0 ? (
                <Card>
                  <CardContent className='text-muted-foreground p-6 text-sm'>
                    No pricing configured for this course yet.
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
                    {pricing.map((p, i) => (
                      <Card
                        key={p.method}
                        className={cn(
                          'relative overflow-hidden transition hover:shadow-md',
                          i === 0 && 'border-teal-500/60 ring-1 ring-teal-500/20'
                        )}
                      >
                        <CardHeader className='pb-3'>
                          <div className='flex items-start justify-between gap-2'>
                            <CardTitle className='min-w-0 text-base leading-tight break-words'>
                              {p.method}
                            </CardTitle>
                            {i === 0 && (
                              <Badge className='shrink-0 bg-teal-500 text-[10px] hover:bg-teal-500'>
                                Popular
                              </Badge>
                            )}
                          </div>
                          <p className='text-muted-foreground text-xs'>
                            {p.lessons} lessons included
                          </p>
                        </CardHeader>
                        <CardContent className='space-y-3'>
                          <div className='min-w-0 font-mono text-2xl leading-tight font-semibold break-words text-teal-700 tabular-nums sm:text-3xl'>
                            {currency.format(p.amount)}
                          </div>
                          {p.lessons > 0 && (
                            <div className='text-muted-foreground text-xs break-words'>
                              ≈ {currency.format(Math.round(p.amount / p.lessons))} / lesson
                            </div>
                          )}
                          <Button
                            className='w-full'
                            variant={i === 0 ? 'default' : 'outline'}
                            onClick={() => router.push('/dashboard/organisation/classes')}
                          >
                            <PlusSquare className='mr-2 h-4 w-4' /> Create class
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <Card>
                    <CardHeader>
                      <CardTitle className='text-base'>All methods</CardTitle>
                    </CardHeader>
                    <CardContent className='overflow-x-auto'>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Method</TableHead>
                            <TableHead>Lessons</TableHead>
                            <TableHead className='text-right'>Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pricing.map(p => (
                            <TableRow key={p.method}>
                              <TableCell className='font-medium'>{p.method}</TableCell>
                              <TableCell>{p.lessons}</TableCell>
                              <TableCell className='text-right font-mono'>
                                {currency.format(p.amount)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* REVIEWS */}
            <TabsContent value='reviews' className='mt-6 space-y-4'>
              <AsyncSection
                loading={reviewsQuery.isLoading && !reviewsQuery.data}
                error={reviewsQuery.error}
                empty={!reviewsQuery.isLoading && reviews.length === 0}
                emptyTitle='No reviews yet'
                emptyDescription='Learner reviews for this course will appear here.'
              >
                <Card>
                  <CardContent className='flex flex-wrap items-center gap-8 p-6'>
                    <div className='text-center'>
                      <div className='text-5xl font-semibold text-teal-700'>{ratingDisplay}</div>
                      <div className='mt-1 flex items-center justify-center gap-0.5'>
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star
                            key={n}
                            className={cn(
                              'h-4 w-4',
                              n <= Math.round(avgRating ?? 0)
                                ? 'fill-warning text-warning'
                                : 'text-muted'
                            )}
                          />
                        ))}
                      </div>
                      <div className='text-muted-foreground mt-1 text-xs'>
                        {reviewCount} reviews
                      </div>
                    </div>
                    <div className='min-w-[220px] flex-1 space-y-1.5'>
                      {[5, 4, 3, 2, 1].map(n => {
                        const pct = reviews.length
                          ? Math.round((distribution[n - 1] / reviews.length) * 100)
                          : 0;
                        return (
                          <div key={n} className='flex items-center gap-3 text-xs'>
                            <span className='text-muted-foreground w-6'>{n}★</span>
                            <Progress value={pct} className='h-2 flex-1' />
                            <span className='text-muted-foreground w-8 text-right'>{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
                <div className='grid gap-3'>
                  {reviews.map(r => {
                    const name = reviewerName(r);
                    return (
                      <Card key={r.uuid}>
                        <CardContent className='space-y-2 p-5'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                              <div className='flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-700'>
                                {reviewerInitials(name)}
                              </div>
                              <div>
                                <div className='text-sm font-medium'>{name}</div>
                                <div className='text-muted-foreground text-xs'>
                                  {r.created_date
                                    ? dayjs(r.created_date).format('DD MMM YYYY')
                                    : ''}
                                </div>
                              </div>
                            </div>
                            <div className='flex items-center gap-0.5'>
                              {[1, 2, 3, 4, 5].map(n => (
                                <Star
                                  key={n}
                                  className={cn(
                                    'h-3.5 w-3.5',
                                    n <= (r.rating ?? 0)
                                      ? 'fill-warning text-warning'
                                      : 'text-muted'
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                          {r.headline && <p className='text-sm font-medium'>{r.headline}</p>}
                          {r.comments && (
                            <p className='text-muted-foreground text-sm'>{r.comments}</p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </AsyncSection>
            </TabsContent>

            {/* ACTIONS */}
            <TabsContent value='actions' className='mt-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>Course actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid gap-2 sm:grid-cols-2'>
                    <Button
                      variant='outline'
                      className='justify-start'
                      onClick={() => router.push('/dashboard/organisation/classes')}
                    >
                      <PlusSquare className='mr-2 h-4 w-4' /> Create class
                    </Button>
                    <Button
                      variant='outline'
                      className='justify-start'
                      onClick={() =>
                        router.push(
                          `/dashboard/organisation/jobs/new?courseUuid=${courseId}`
                        )
                      }
                    >
                      <Briefcase className='mr-2 h-4 w-4' /> Post a job
                    </Button>
                    <Button
                      variant='outline'
                      className='justify-start'
                      onClick={() =>
                        toast.info(
                          'Edit is disabled — course content is managed by the course creator.'
                        )
                      }
                    >
                      <Pencil className='mr-2 h-4 w-4' /> Edit (locked)
                    </Button>
                    <Button
                      variant='outline'
                      className='justify-start'
                      onClick={() => window.print()}
                    >
                      <Printer className='mr-2 h-4 w-4' /> Print
                    </Button>
                    <Button variant='outline' className='justify-start' onClick={download}>
                      <Download className='mr-2 h-4 w-4' /> Download record
                    </Button>
                    <Button variant='outline' className='justify-start' onClick={copyLink}>
                      <Copy className='mr-2 h-4 w-4' /> Copy link
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* SIDEBAR */}
        <aside className='space-y-6 lg:sticky lg:top-4 lg:self-start'>
          <Card className='overflow-hidden'>
            <div className='bg-gradient-to-br from-teal-600 to-teal-800 p-5 text-white'>
              <div className='text-xs tracking-wide text-white/70 uppercase'>Starting from</div>
              <div className='mt-1 font-mono text-3xl font-semibold'>
                {pricing.length > 0
                  ? currency.format(Math.min(...pricing.map(p => p.amount)))
                  : '—'}
              </div>
              <div className='mt-1 text-xs text-white/70'>
                {pricing.length} delivery method{pricing.length === 1 ? '' : 's'}
              </div>
              <Button
                className='bg-card hover:bg-card/90 mt-4 w-full text-teal-700'
                onClick={() => router.push('/dashboard/organisation/classes')}
              >
                <PlusSquare className='mr-2 h-4 w-4' /> Create class
              </Button>
              <Button
                variant='outline'
                className='mt-2 w-full border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white'
                onClick={() =>
                        router.push(
                          `/dashboard/organisation/jobs/new?courseUuid=${courseId}`
                        )
                      }
              >
                <Briefcase className='mr-2 h-4 w-4' /> Post a job
              </Button>
            </div>
            <CardContent className='space-y-4 pt-5'>
              {completion != null && (
                <>
                  <div className='space-y-2'>
                    <div className='flex items-center justify-between text-xs'>
                      <span className='text-muted-foreground'>Cohort completion</span>
                      <span className='font-medium'>{completion}%</span>
                    </div>
                    <Progress value={completion} className='h-2' />
                  </div>
                  <Separator />
                </>
              )}
              <dl className='space-y-3 text-sm'>
                <div className='flex items-center justify-between'>
                  <dt className='text-muted-foreground'>Created</dt>
                  <dd className='font-medium'>
                    {course.created_date ? dayjs(course.created_date).format('DD MMM YYYY') : '—'}
                  </dd>
                </div>
                <div className='flex items-center justify-between'>
                  <dt className='text-muted-foreground'>Duration</dt>
                  <dd className='font-medium'>{course.total_duration_display ?? '—'}</dd>
                </div>
                <div className='flex items-center justify-between'>
                  <dt className='text-muted-foreground'>Level</dt>
                  <dd className='font-medium'>{level ?? '—'}</dd>
                </div>
                <div className='flex items-center justify-between'>
                  <dt className='text-muted-foreground'>Subject</dt>
                  <dd className='font-medium'>{cats[1] ?? cats[0] ?? '—'}</dd>
                </div>
                <div className='flex items-center justify-between'>
                  <dt className='text-muted-foreground'>Classes running</dt>
                  <dd className='font-medium'>{classDefs.length}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-base'>
                <TrendingUp className='h-4 w-4 text-teal-600' /> Related courses
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              {related.length === 0 && (
                <p className='text-muted-foreground text-sm'>No related courses yet.</p>
              )}
              {related.map(r => {
                const img = toAuthenticatedMediaUrl(r.banner_url ?? r.thumbnail_url) ?? null;
                return (
                  <Link
                    key={r.uuid}
                    href={`/dashboard/organisation/courses/${r.uuid}`}
                    className='hover:bg-muted/60 flex items-center gap-3 rounded-lg p-2 transition'
                  >
                    {img ? (
                      <img
                        src={img}
                        alt={r.name}
                        className='h-12 w-16 shrink-0 rounded-md object-cover'
                      />
                    ) : (
                      <div className='bg-muted flex h-12 w-16 shrink-0 items-center justify-center rounded-md'>
                        <BookOpen className='text-muted-foreground h-4 w-4' />
                      </div>
                    )}
                    <div className='min-w-0 flex-1'>
                      <div className='truncate text-sm font-medium'>{r.name}</div>
                      <div className='text-muted-foreground truncate text-xs'>
                        {(r.category_names ?? [])[0] ?? 'Course'}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      className='mt-0.5 h-4 w-4 shrink-0 text-teal-600'
      fill='none'
      viewBox='0 0 24 24'
      stroke='currentColor'
      strokeWidth={2}
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
      />
    </svg>
  );
}
