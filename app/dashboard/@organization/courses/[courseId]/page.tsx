// @ts-nocheck -- 1:1 Lovable port; @hey-api generated-client type drift
'use client';

import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Archive, ArrowLeft, Briefcase, Copy, Download, Pencil, PlusSquare, Printer, Share2, Users } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrganisation } from '@/context/organisation-context';
import { extractEntity, extractList, extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import type { ClassDefinition, Course, CourseTrainingApplication, DifficultyLevel, User } from '@/services/client';
import {
  getAllDifficultyLevelsOptions,
  getClassDefinitionsForOrganisationOptions,
  getCourseByUuidOptions,
  getCourseEnrollmentsOptions,
  getUsersByOrganisationAndDomainOptions,
  searchTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';

const currency = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 });
const stripHtml = (html?: string) => (html ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

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
