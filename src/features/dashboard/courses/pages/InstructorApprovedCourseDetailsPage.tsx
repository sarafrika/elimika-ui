'use client';

import { CourseTrainingRequirements } from '@/app/dashboard/_components/course-training-requirements';
import { LessonContentViewerDialog, type LessonContentPreviewItem } from '@/components/content-preview/LessonContentPreview';
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
import useCourseClasses from '@/hooks/use-course-classes';
import { useCourseLessonsWithContent } from '@/hooks/use-courselessonwithcontent';
import { extractEntity, extractList, extractPage } from '@/lib/api-helpers';
import { cn } from '@/lib/utils';
import {
  ApplicantTypeEnum,
  type Course,
  type CourseReview,
  type CourseTrainingApplication,
  type CourseTrainingRequirement,
  type DifficultyLevel,
  type User
} from '@/services/client';
import {
  getAllDifficultyLevelsOptions,
  getCourseByUuidOptions,
  getCourseCreatorByUuidOptions,
  getCourseEnrollmentsOptions,
  getCourseReviewsOptions,
  getCourseTrainingRequirementsOptions,
  searchTrainingApplicationsOptions
} from '@/services/client/@tanstack/react-query.gen';
import { absoluteUrl, publicCourseUrl } from '@/src/features/dashboard/lib/dashboard-url';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle,
  ChevronDown,
  Clock,
  Download,
  Eye,
  FileText,
  GraduationCap,
  Heart,
  HelpCircle,
  Layers,
  Lock,
  Paperclip,
  PlayCircle,
  PlusSquare,
  Printer,
  Share2,
  Sparkles,
  Star,
  Target,
  Users,
  type LucideIcon
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useStudentsByIds } from '../../../../../hooks/use-batched-lookups';
import { useUserProfile } from '../../../profile/context/profile-context';

const currency = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  maximumFractionDigits: 0,
});

const RATE_TIERS: { method: string; fmt: string; loc: string; key: keyof NonNullable<CourseTrainingApplication['rate_card']> }[] = [
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

function notAvailable(value?: string | number | null) {
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'Not available';
  if (typeof value === 'string' && value.trim()) return value;
  return 'Not available';
}

function stripHtml(html?: string | null) {
  return (html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toBullets(text?: string | null) {
  const clean = stripHtml(text);
  if (!clean) return [];
  const parts = /[\n•;]/.test(clean) ? clean.split(/[\n•;]+/) : clean.split(/(?<=\.)\s+/);
  return parts.map(item => item.trim().replace(/^[-–]\s*/, '')).filter(Boolean).slice(0, 8);
}

function formatDuration(course?: Course | null) {
  if (!course) return 'Not available';
  if (!course.duration_hours && !course.duration_minutes && !course.total_duration_display) {
    return 'Not available';
  }
  if (course.total_duration_display?.trim()) return course.total_duration_display;
  return `${course.duration_hours ?? 0} Hours ${course.duration_minutes ?? 0} Minutes`;
}

function formatInstructorName(user?: User | null) {
  if (!user) return 'Not available';
  return `${user.full_name ?? ''}`.trim() || 'Not available';
}

function initials(user?: User | null) {
  if (!user) return 'NA';
  return `${user.full_name?.[0] ?? ''}`.toUpperCase() || 'NA';
}

function ratingLabel(rating?: number | null) {
  if (typeof rating !== 'number' || Number.isNaN(rating)) return 'Not available';
  return rating.toFixed(1);
}

function ReviewInitials(name: string) {
  return (
    name
      .split(/[\s.@_-]+/)
      .map(part => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'NA'
  );
}

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

const kindIcon: Record<'video' | 'article' | 'quiz' | 'assignment' | 'file', LucideIcon> = {
  video: PlayCircle,
  article: FileText,
  quiz: HelpCircle,
  assignment: BookOpen,
  file: Paperclip,
};

const kindColor: Record<'video' | 'article' | 'quiz' | 'assignment' | 'file', string> = {
  video: 'text-destructive bg-destructive/10',
  article: 'text-sky-600 bg-sky-50',
  quiz: 'text-warning bg-warning/10',
  assignment: 'text-primary bg-primary/10',
  file: 'text-muted-foreground bg-muted',
};

export default function InstructorApprovedCourseDetailsPage({ courseId }: { courseId: string }) {
  const router = useRouter();
  const profile = useUserProfile()
  const instructor = profile?.instructor;
  const instructorUuid = instructor?.uuid ?? '';
  const [favorite, setFavorite] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 1: true });
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<LessonContentPreviewItem | null>(null);
  const [selectedContentType, setSelectedContentType] = useState('');

  const courseQuery = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: courseId } }),
    enabled: Boolean(courseId),
  });
  const course = extractEntity<Course>(courseQuery.data);

  const difficultyQuery = useQuery(getAllDifficultyLevelsOptions());
  const difficultyLevels = extractPage<DifficultyLevel>(difficultyQuery.data).items;
  const difficultyName = useMemo(() => {
    if (!course?.difficulty_uuid) return 'Not available';
    return difficultyLevels.find(level => level.uuid === course.difficulty_uuid)?.name ?? 'Not available';
  }, [course?.difficulty_uuid, difficultyLevels]);

  const applicationQuery = useQuery({
    ...searchTrainingApplicationsOptions({
      query: {
        pageable: { page: 0, size: 100 },
        searchParams: {
          applicant_uuid_eq: instructorUuid,
          applicant_type_eq: ApplicantTypeEnum.INSTRUCTOR,
        },
      },
    }),
    enabled: Boolean(instructorUuid),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const approvedApplication = useMemo(() => {
    const items = (applicationQuery.data?.data?.content ?? []) as CourseTrainingApplication[];
    return items.find(item => item.course_uuid === courseId && item.status === 'approved') ?? null;
  }, [applicationQuery.data, courseId]);

  const creatorQuery = useQuery({
    ...getCourseCreatorByUuidOptions({ path: { uuid: course?.course_creator_uuid ?? '' } }),
    enabled: Boolean(course?.course_creator_uuid),
  });
  const courseCreator = extractEntity<User>(creatorQuery.data);

  const enrollmentsQuery = useQuery({
    ...getCourseEnrollmentsOptions({
      path: { courseUuid: courseId },
      query: { pageable: { page: 0, size: 1 } },
    }),
    enabled: Boolean(courseId),
    retry: false,
  });
  const enrolledCount = enrollmentsQuery?.data?.data?.metadata?.totalElements || 0

  const requirementsQuery = useQuery({
    ...getCourseTrainingRequirementsOptions({ path: { courseUuid: courseId as string }, query: { pageable: {} } }),
    enabled: Boolean(courseId),
    retry: false,
  });
  const requirements = extractList<CourseTrainingRequirement>(requirementsQuery?.data?.data?.content);

  const reviewsQuery = useQuery({
    ...getCourseReviewsOptions({ path: { courseUuid: courseId } }),
    enabled: Boolean(courseId),
    retry: false,
  });
  const reviews = extractList<CourseReview>(reviewsQuery.data);
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return null;
    return reviews.reduce((sum, review) => sum + (review.rating ?? 0), 0) / reviews.length;
  }, [reviews]);
  const ratingDisplay = ratingLabel(averageRating);
  const reviewStudentIds = useMemo(
    () =>
      reviews
        .filter(review => !review.is_anonymous)
        .map(review => review.student_uuid)
        .filter((id): id is string => Boolean(id)),
    [reviews]
  );
  const { studentMap: reviewStudentMap } = useStudentsByIds(reviewStudentIds);

  const {
    isLoading: lessonsLoading,
    lessons: lessonsWithContent,
    contentTypeMap,
    contentTypeDetailsMap,
  } = useCourseLessonsWithContent({ courseUuid: courseId });

  const { classes } = useCourseClasses(courseId);

  const contentItemsTotal = useMemo(
    () => lessonsWithContent.reduce((total, lesson) => total + (lesson.content?.data?.length ?? 0), 0),
    [lessonsWithContent]
  );

  const pricingRows = useMemo(() => {
    const rateCard = approvedApplication?.rate_card ?? null;
    if (!rateCard) return [];

    return RATE_TIERS.map(tier => {
      const amount = Number(rateCard[tier.key] ?? 0);
      const matchingClass = classes.find(
        classItem =>
          classItem.session_format === tier.fmt && classItem.location_type === tier.loc
      );

      return {
        method: tier.method,
        amount,
        lessons:
          matchingClass?.scheduled_session_count != null
            ? Number(matchingClass.scheduled_session_count)
            : undefined,
      };
    }).filter(row => row.amount > 0);
  }, [approvedApplication?.rate_card, classes]);

  const openContent = (content: LessonContentPreviewItem, contentType: string) => {
    setSelectedContent(content);
    setSelectedContentType(contentType);
    setViewerOpen(true);
  };

  const copyLink = async () => {
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

  const goBack = () => router.push('/dashboard/instructor/my-courses');

  const createClass = () => router.push(`/dashboard/instructor/classes/new?id=${courseId}`);

  const image = toAuthenticatedMediaUrl(course?.banner_url ?? course?.thumbnail_url) ?? null;
  const categories = course?.category_names ?? [];
  const learnItems = toBullets(course?.objectives ?? course?.description);
  const status = course ? (course.active !== false ? 'Active' : 'Inactive') : 'Not available';

  const classCount = classes.length;
  const lessonCount = lessonsWithContent.length;

  const heroRating = ratingDisplay;
  const heroReviewCount = reviews.length > 0 ? `${reviews.length} reviews` : 'Not available';
  const heroEnrollmentCount =
    enrolledCount > 0 ? `${enrolledCount.toLocaleString()} enrolled` : 'Not available';

  const detailStatItems = [
    { icon: BookOpen, label: 'Lessons', value: lessonCount > 0 ? lessonCount : 'Not available' },
    {
      icon: Layers,
      label: 'Content items',
      value: contentItemsTotal > 0 ? contentItemsTotal : 'Not available',
    },
    { icon: Clock, label: 'Duration', value: formatDuration(course) },
    { icon: GraduationCap, label: 'Level', value: difficultyName },
  ];

  const courseSummaryValue = (value: string | number | null | undefined) => {
    if (typeof value === 'number') return String(value);
    return value?.toString().trim() ? value.toString() : 'Not available';
  };

  const pricingDisplay = pricingRows.length > 0 ? pricingRows : [];

  const sectionsLoading = courseQuery.isLoading || applicationQuery.isLoading || enrollmentsQuery.isLoading || reviewsQuery.isLoading;

  if (sectionsLoading && !course) {
    return (
      <div className='mx-auto w-full max-w-[1400px] space-y-6 px-3 py-4 sm:px-5 lg:px-6'>
        <Skeleton className='h-10 w-40' />
        <Skeleton className='h-72 w-full rounded-2xl' />
        <div className='grid gap-4 md:grid-cols-4'>
          {[...Array(4)].map((_, index) => (
            <Skeleton key={index} className='h-24 rounded-xl' />
          ))}
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className='p-6'>
        <p className='text-muted-foreground'>Course not found.</p>
        <Link href='/dashboard/instructor/my-courses' className='text-primary underline'>
          Back to Courses
        </Link>
      </div>
    );
  }

  const instructorDisplayName = instructor?.full_name;
  // @ts-ignore
  const instructorAvatarInitials = initials(instructor);
  const pricingSummary = pricingDisplay.length > 0 ? pricingDisplay : null;

  return (
    <div className='mx-auto w-full max-w-[1400px] space-y-6 px-3 py-4 sm:px-5 lg:px-6'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <Button variant='ghost' size='sm' onClick={goBack}>
          <ArrowLeft className='mr-2 h-4 w-4' /> Back to Courses
        </Button>
        <div className='flex flex-wrap items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setFavorite(value => !value);
              toast.success(favorite ? 'Removed from favorites' : 'Added to favorites');
            }}
          >
            <Heart className={cn('mr-2 h-4 w-4', favorite && 'fill-destructive text-destructive')} />
            {favorite ? 'Saved' : 'Save'}
          </Button>
          <Button variant='outline' size='sm' onClick={copyLink}>
            <Share2 className='mr-2 h-4 w-4' /> Share
          </Button>
          <Badge variant={status === 'Active' ? 'default' : 'secondary'}>{status}</Badge>
        </div>
      </div>

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
              <Badge className='bg-primary/10 text-primary rounded-full border-0 px-3 py-1 font-semibold'>
                {difficultyName}
              </Badge>
              <Badge
                className='bg-teal-500/95 text-white hover:bg-teal-500'
              >
                {categories[0] ?? 'Not available'}
              </Badge>
              {categories[1] ? (
                <Badge
                  variant='outline'
                  className='border-white/40 bg-white/10 text-white backdrop-blur'
                >
                  {categories[1]}
                </Badge>
              ) : null}
            </div>
            <div className='max-w-3xl'>
              <h1 className='text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl'>
                {course.name}
              </h1>
              <p className='mt-2 line-clamp-2 max-w-2xl text-sm text-white/85 sm:text-base'>
                {stripHtml(course.description) || 'Not available'}
              </p>
            </div>
            <div className='flex flex-wrap items-center gap-4 text-sm text-white/90'>
              <div className='flex items-center gap-2'>
                <Avatar className='h-9 w-9 border-2 border-white/70'>
                  {courseCreator?.profile_image_url ? (
                    <AvatarImage src={courseCreator.profile_image_url} alt={instructorDisplayName} />
                  ) : null}
                  <AvatarFallback className='bg-teal-700 text-xs text-white'>
                    {instructorAvatarInitials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className='leading-tight font-medium'>{instructorDisplayName}</div>
                  <div className='text-xs text-white/70'>Lead instructor</div>
                </div>
              </div>
              <span className='hidden h-6 w-px bg-white/30 sm:block' />
              <div className='flex items-center gap-1.5'>
                <Star className='fill-warning text-warning h-4 w-4' />
                <span className='font-medium'>{heroRating}</span>
                <span className='text-white/70'>({heroReviewCount})</span>
              </div>
              <span className='hidden h-6 w-px bg-white/30 sm:block' />
              <div className='flex items-center gap-1.5'>
                <Users className='h-4 w-4' /> {heroEnrollmentCount}
              </div>
            </div>
          </div>
        </div>

        <div className='bg-border grid grid-cols-2 gap-px sm:grid-cols-4'>
          {detailStatItems.map(({ icon: Icon, label, value }) => (
            <div key={label} className='bg-card flex items-center gap-3 px-4 py-4 sm:px-6'>
              <div className='bg-teal-50 text-teal-600 flex h-10 w-10 items-center justify-center rounded-lg'>
                <Icon className='h-5 w-5' />
              </div>
              <div>
                <div className='text-muted-foreground text-xs tracking-wide uppercase'>{label}</div>
                <div className='text-base font-semibold'>{courseSummaryValue(value)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]'>
        <div className='min-w-0 space-y-6'>
          <Tabs defaultValue='overview'>
            <TabsList className='bg-muted/60 h-auto w-full flex-wrap justify-start gap-2 rounded-full p-1.5'>
              {[
                { value: 'overview', label: 'Overview' },
                { value: 'curriculum', label: `Curriculum · ${lessonCount}` },
                { value: 'pricing', label: 'Pricing' },
                { value: 'reviews', label: `Reviews · ${reviews.length}` },
                { value: 'actions', label: 'Actions' },
              ].map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className='data-[state=active]:bg-card rounded-full px-4 py-1.5 text-sm data-[state=active]:text-teal-700 data-[state=active]:shadow-sm'
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value='overview' className='mt-6 space-y-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-base'>
                    <Sparkles className='h-4 w-4 text-teal-600' /> About this course
                  </CardTitle>
                </CardHeader>
                <CardContent className='text-sm leading-relaxed'>
                  <p className='text-muted-foreground'>
                    {stripHtml(course.description) || 'Not available'}
                  </p>
                </CardContent>
              </Card>

              {learnItems.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-base'>
                      <Target className='h-4 w-4 text-teal-600' /> What you&apos;ll learn
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className='grid gap-3 sm:grid-cols-2'>
                      {learnItems.map(item => (
                        <li key={item} className='flex items-start gap-2 text-sm'>
                          <CheckCircle className='mt-0.5 h-4 w-4 text-teal-600' />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-base'>
                      <Target className='h-4 w-4 text-teal-600' /> What you&apos;ll learn
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='text-muted-foreground text-sm'>Not available</CardContent>
                </Card>
              )}

              <div className='grid gap-6 md:grid-cols-2'>
                <Card>
                  <CardHeader>
                    <CardTitle className='text-base'>Prerequisites</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {requirements.length ? (
                      <ul className='space-y-2 text-sm'>
                        {requirements.map(req => (
                          <li key={req.uuid ?? req.name} className='flex items-start gap-2'>
                            <span className='bg-teal-500 mt-2 h-1.5 w-1.5 shrink-0 rounded-full' />
                            <span className='text-muted-foreground'>{req.name ?? 'Not available'}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className='text-muted-foreground text-sm'>Not available</p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className='text-base'>Course highlights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className='grid gap-3 sm:grid-cols-2'>
                      {[
                        {
                          icon: GraduationCap,
                          label: `${difficultyName !== 'Not available' ? `${difficultyName} level` : 'Not available'}`,
                        },
                        {
                          icon: BookOpen,
                          label: lessonCount > 0 ? `${lessonCount} structured lessons` : 'Not available',
                        },
                        {
                          icon: Award,
                          label:
                            pricingRows.length > 0
                              ? `${pricingRows.length} delivery method${pricingRows.length === 1 ? '' : 's'}`
                              : 'Not available',
                        },
                        {
                          icon: Users,
                          label:
                            classCount > 0
                              ? `${classCount} class${classCount === 1 ? '' : 'es'} running`
                              : 'Not available',
                        },
                      ].map(({ icon: Icon, label }, index) => (
                        <li key={index} className='flex items-center gap-2 text-sm'>
                          <div className='bg-teal-50 text-teal-600 flex h-8 w-8 items-center justify-center rounded-md'>
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

            <TabsContent value='curriculum' className='mt-6 space-y-4'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <div className='text-muted-foreground flex flex-wrap items-center gap-2 text-sm'>
                  <Badge variant='outline' className='gap-1'>
                    <BookOpen className='h-3.5 w-3.5' /> {lessonCount} lessons
                  </Badge>
                  <Badge variant='outline' className='border-success/40 bg-success/10 text-success gap-1'>
                    Full read access
                  </Badge>
                </div>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() =>
                      setExpanded(Object.fromEntries(lessonsWithContent.map(lesson => [lesson.lesson.lesson_number ?? 0, true])))
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
                loading={lessonsLoading && lessonsWithContent.length === 0}
                error={undefined}
                empty={!lessonsLoading && lessonsWithContent.length === 0}
                emptyTitle='No curriculum yet'
                emptyDescription="This course doesn't have any published lessons yet."
              >
                <div className='space-y-3'>
                  {lessonsWithContent.map((entry, index) => {
                    const lesson = entry.lesson;
                    const lessonNumber = lesson.lesson_number ?? index + 1;
                    const open = !!expanded[lessonNumber];
                    const contents = entry.content?.data ?? [];

                    return (
                      <Card key={lesson.uuid ?? lessonNumber} className='overflow-hidden'>
                        <button
                          type='button'
                          onClick={() => setExpanded(prev => ({ ...prev, [lessonNumber]: !prev[lessonNumber] }))}
                          className='hover:bg-muted/40 flex w-full items-center gap-4 p-4 text-left transition'
                        >
                          <div className='from-teal-500 to-teal-700 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-sm font-semibold text-white shadow-sm'>
                            {lessonNumber}
                          </div>
                          <div className='min-w-0 flex-1'>
                            <div className='truncate font-medium'>{lesson.title ?? `Lesson ${lessonNumber}`}</div>
                            <div className='text-muted-foreground truncate text-xs'>
                              {lesson.description ? stripHtml(lesson.description) : 'Not available'}
                            </div>
                          </div>
                          <div className='text-muted-foreground hidden items-center gap-3 text-xs sm:flex'>
                            <span>{contents.length} items</span>
                          </div>
                          <ChevronDown
                            className={cn(
                              'text-muted-foreground h-4 w-4 shrink-0 transition-transform',
                              open && 'rotate-180'
                            )}
                          />
                        </button>
                        {open && (
                          <>
                            <Separator />
                            <div className='space-y-1.5 p-3'>
                              {contents.length ? (
                                contents.map((content, contentIndex) => {
                                  const contentType =
                                    (content.content_type_uuid && contentTypeMap[content.content_type_uuid]) ||
                                    'Not available';
                                  const kind = kindOf(contentType);
                                  const Icon = kindIcon[kind];
                                  return (
                                    <div
                                      key={content.uuid ?? contentIndex}
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
                                        {content.title ?? 'Not available'}
                                      </span>
                                      {content.is_required ? (
                                        <Badge variant='secondary' className='shrink-0 text-[10px]'>
                                          Required
                                        </Badge>
                                      ) : null}
                                      <span className='text-muted-foreground shrink-0 text-xs'>
                                        {contentType}
                                      </span>
                                      <Button
                                        variant='ghost'
                                        size='sm'
                                        className='gap-1.5 text-xs'
                                        onClick={() =>
                                          openContent(
                                            content as LessonContentPreviewItem,
                                            contentType
                                          )
                                        }
                                      >
                                        <Eye className='size-3.5' />
                                        Review
                                      </Button>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className='bg-muted/20 text-muted-foreground flex items-center gap-2 rounded-lg border px-3 py-2 text-xs'>
                                  <Lock className='h-3.5 w-3.5' /> Not available
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
            </TabsContent>

            <TabsContent value='pricing' className='mt-6 space-y-4'>
              {pricingSummary ? (
                <>
                  <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
                    {pricingSummary.map((row, index) => (
                      <Card
                        key={row.method}
                        className={cn(
                          'relative overflow-hidden transition hover:shadow-md',
                          index === 0 && 'border-teal-500/60 ring-1 ring-teal-500/20'
                        )}
                      >
                        <CardHeader className='pb-3'>
                          <div className='flex items-start justify-between gap-2'>
                            <CardTitle className='min-w-0 text-base leading-tight break-words'>
                              {row.method}
                            </CardTitle>
                            {index === 0 ? (
                              <Badge className='shrink-0 bg-teal-500 text-[10px] hover:bg-teal-500'>
                                Popular
                              </Badge>
                            ) : null}
                          </div>
                          <p className='text-muted-foreground text-xs'>
                            {row.lessons ?? 'Not available'} lessons included
                          </p>
                        </CardHeader>
                        <CardContent className='space-y-3'>
                          <div className='min-w-0 text-2xl leading-tight font-semibold break-words text-teal-700 tabular-nums sm:text-3xl'>
                            {currency.format(row.amount)}
                          </div>
                          {typeof row.lessons === 'number' && row.lessons > 0 ? (
                            <div className='text-muted-foreground text-xs break-words'>
                              ≈ {currency.format(Math.round(row.amount / row.lessons))} / lesson
                            </div>
                          ) : (
                            <div className='text-muted-foreground text-xs break-words'>Not available</div>
                          )}
                          {/* <Button className='w-full' variant={index === 0 ? 'default' : 'outline'} onClick={createClass}>
                            <PlusSquare className='mr-2 h-4 w-4' /> Create class
                          </Button> */}
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
                          {pricingSummary.map(row => (
                            <TableRow key={row.method}>
                              <TableCell className='font-medium'>{row.method}</TableCell>
                              <TableCell>{row.lessons ?? 'Not available'}</TableCell>
                              <TableCell className='text-right font-mono'>
                                {currency.format(row.amount)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className='text-muted-foreground p-6 text-sm'>Not available</CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value='reviews' className='mt-6 space-y-4'>
              <AsyncSection
                loading={reviewsQuery.isLoading && reviews.length === 0}
                error={undefined}
                empty={!reviewsQuery.isLoading && reviews.length === 0}
                emptyTitle='No reviews yet'
                emptyDescription='Learner reviews for this course will appear here.'
              >
                <Card>
                  <CardContent className='flex flex-wrap items-center gap-8 p-6'>
                    <div className='text-center'>
                      <div className='text-5xl font-semibold text-teal-700'>{heroRating}</div>
                      <div className='mt-1 flex items-center justify-center gap-0.5'>
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star
                            key={n}
                            className={cn(
                              'h-4 w-4',
                              n <= Math.round(averageRating ?? 0)
                                ? 'fill-warning text-warning'
                                : 'text-muted'
                            )}
                          />
                        ))}
                      </div>
                      <div className='text-muted-foreground mt-1 text-xs'>
                        {reviews.length > 0 ? `${reviews.length} reviews` : 'Not available'}
                      </div>
                    </div>
                    <div className='min-w-[220px] flex-1 space-y-1.5'>
                      {[5, 4, 3, 2, 1].map(rating => {
                        const count = reviews.filter(review => Math.round(review.rating ?? 0) === rating).length;
                        const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
                        return (
                          <div key={rating} className='flex items-center gap-3 text-xs'>
                            <span className='text-muted-foreground w-6'>{rating}★</span>
                            <Progress value={pct} className='h-2 flex-1' />
                            <span className='text-muted-foreground w-8 text-right'>{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
                <div className='grid gap-3'>
                  {reviews.map(review => {
                    const student = review?.student_uuid
                      ? reviewStudentMap[review.student_uuid]
                      : undefined;

                    const name = review?.is_anonymous ? 'Anonymous learner' : student?.full_name

                    return (
                      <Card key={review.uuid}>
                        <CardContent className='space-y-2 p-5'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                              <div className='bg-teal-100 text-teal-700 flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold'>
                                {name}
                              </div>
                              <div>
                                <div className='text-sm font-medium'>{name}</div>
                                <div className='text-muted-foreground text-xs'>
                                  {review.created_date
                                    ? dayjs(review.created_date).format('DD MMM YYYY')
                                    : 'Not available'}
                                </div>
                              </div>
                            </div>
                            <div className='flex items-center gap-0.5'>
                              {[1, 2, 3, 4, 5].map(n => (
                                <Star
                                  key={n}
                                  className={cn(
                                    'h-3.5 w-3.5',
                                    n <= (review.rating ?? 0)
                                      ? 'fill-warning text-warning'
                                      : 'text-muted'
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                          <p className='text-sm font-medium'>
                            {review.headline || 'Not available'}
                          </p>
                          <p className='text-muted-foreground text-sm'>
                            {review.comments || 'Not available'}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </AsyncSection>
            </TabsContent>

            <TabsContent value='actions' className='mt-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>Course actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid gap-2 sm:grid-cols-2'>
                    <Button variant='outline' className='justify-start' onClick={createClass}>
                      <PlusSquare className='mr-2 h-4 w-4' /> Create class
                    </Button>
                    <Button variant='outline' className='justify-start' onClick={copyLink}>
                      <Share2 className='mr-2 h-4 w-4' /> Share
                    </Button>
                    <Button variant='outline' className='justify-start' onClick={download}>
                      <Download className='mr-2 h-4 w-4' /> Download
                    </Button>
                    <Button variant='outline' className='justify-start' onClick={() => window.print()}>
                      <Printer className='mr-2 h-4 w-4' /> Print
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <aside className='space-y-4'>
          <Card className='border-border/70 shadow-sm'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-lg'>Course requirements</CardTitle>
            </CardHeader>
            <CardContent className='text-sm'>
              <CourseTrainingRequirements
                requirements={requirements}
                viewerRole='instructor'
              />
            </CardContent>
          </Card>
        </aside>
      </div>

      <LessonContentViewerDialog
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        content={selectedContent}
        contentType={selectedContentType}
        contentTypeDetailsMap={contentTypeDetailsMap}
      />
    </div>
  );
}
