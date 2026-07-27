// @ts-nocheck -- 1:1 Lovable port; @hey-api generated-client type drift
'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Lock,
  Star,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { AsyncSection } from '@/components/data/async-section';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganisation } from '@/context/organisation-context';
import { extractEntity, extractList, extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import type { Course, DifficultyLevel } from '@/services/client';
import {
  getAllDifficultyLevelsOptions,
  getCourseByUuidOptions,
  getCourseEnrollmentsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { client } from '@/services/client/client.gen';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';

const currency = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 });
const stripHtml = (html?: string) => (html ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

// Shape returned by GET /courses/{uuid}/organisations/{uuid}/content.
type OrgLesson = {
  uuid?: string;
  lesson_number?: number;
  title?: string;
  learning_objectives?: string;
  content_count?: number;
};
type OrgCourseContent = {
  total_lessons?: number;
  average_rating?: number | null;
  total_reviews?: number;
  lessons?: OrgLesson[];
};

const PERKS = [
  "Full read access to every lesson's content",
  'All quizzes, assignments and resources',
  'Ability to create classes and assign instructors',
  'The same materials learners see — kept in sync by the creator',
];

export default function CoursePreviewPage() {
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

  const enrolQuery = useQuery({
    ...getCourseEnrollmentsOptions({ path: { courseUuid: courseId }, query: { pageable: { page: 0, size: 1 } } }),
    enabled: Boolean(courseId),
    retry: false,
  });
  const enrolled = getTotalFromMetadata(extractPage(enrolQuery.data).metadata);

  // Approval-gated outline. From the catalogue the org is (by definition) not yet
  // approved, so this returns the summary: lesson outline + content counts + rating, no bodies.
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

  const cats = course?.category_names ?? [];
  const image = toAuthenticatedMediaUrl(course?.banner_url ?? course?.thumbnail_url) ?? null;
  const [imgError, setImgError] = useState(false);
  const apply = () => router.push(`/dashboard/organisation/courses/apply/${courseId}`);

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
        <Link href="/dashboard/organisation/courses/catalog" className="text-primary underline">
          Back to Catalogue
        </Link>
      </div>
    );
  }

  const rating = content?.average_rating;
  const totalLessons = content?.total_lessons ?? lessons.length;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/organisation/courses/catalog')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Catalogue
        </Button>
        <Badge variant="outline" className="gap-1 border-warning/40 bg-warning/10 text-warning">
          <Lock className="h-3 w-3" /> Preview — not yet approved to train
        </Badge>
      </div>

      {/* Hero */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="grid gap-4 p-4 sm:grid-cols-[260px_1fr] sm:p-6">
          {image && !imgError ? (
            <img
              src={image}
              alt={course.name}
              loading="lazy"
              onError={() => setImgError(true)}
              className="h-44 w-full rounded-lg object-cover sm:h-full"
            />
          ) : (
            <div className="flex h-44 w-full items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 sm:h-full">
              <BookOpen className="h-8 w-8 text-primary/50" />
            </div>
          )}
          <div className="space-y-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{course.name}</h1>
              <p className="text-sm text-muted-foreground">{[cats[0], cats[1]].filter(Boolean).join(' • ') || 'General'}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {rating != null && (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  <span className="font-semibold">{Number(rating).toFixed(1)}</span>
                  <span className="text-muted-foreground">({content?.total_reviews ?? 0} reviews)</span>
                </span>
              )}
              <Badge variant="outline">{level ?? '—'}</Badge>
              <Badge variant="outline">
                <BookOpen className="mr-1 h-3 w-3" />
                {totalLessons} lessons
              </Badge>
              <Badge variant="outline">
                <Users className="mr-1 h-3 w-3" />
                {enrolled.toLocaleString()} enrolled
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button onClick={apply} className="gap-2">
                <GraduationCap className="h-4 w-4" /> Apply to Train
              </Button>
              {Number(course.price) > 0 && (
                <span className="text-sm text-muted-foreground">
                  from <span className="font-semibold text-foreground">{currency.format(Number(course.price))}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Curriculum outline (locked) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base">What you'll teach</CardTitle>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" /> Full content unlocks after approval
            </span>
          </CardHeader>
          <CardContent>
            <AsyncSection
              loading={contentQuery.isLoading && !contentQuery.data}
              error={contentQuery.error}
              empty={!contentQuery.isLoading && lessons.length === 0}
              emptyTitle="Outline coming soon"
              emptyDescription="This course hasn't published its lesson outline yet."
            >
              <div className="space-y-2">
                {lessons.map((lesson: OrgLesson) => (
                  <div
                    key={lesson.lesson_number ?? lesson.uuid}
                    className="flex items-start justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {lesson.title ?? `Lesson ${lesson.lesson_number}`}
                      </div>
                      {lesson.learning_objectives && (
                        <p className="line-clamp-1 text-xs text-muted-foreground">{stripHtml(lesson.learning_objectives)}</p>
                      )}
                    </div>
                    <Badge variant="outline" className="shrink-0 gap-1 text-xs text-muted-foreground">
                      <Lock className="h-3 w-3" />
                      {lesson.content_count ?? 0} items
                    </Badge>
                  </div>
                ))}
              </div>
            </AsyncSection>
          </CardContent>
        </Card>

        {/* Approval value prop */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Once approved, your school gets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {PERKS.map(item => (
                <div key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span className="text-muted-foreground">{item}</span>
                </div>
              ))}
              <p className="pt-2 text-xs text-muted-foreground">
                Content stays read-only — only the course creator can edit it.
              </p>
            </CardContent>
          </Card>
          <Button onClick={apply} className="w-full gap-2">
            <GraduationCap className="h-4 w-4" /> Apply to Train
          </Button>
        </div>
      </div>
    </div>
  );
}
