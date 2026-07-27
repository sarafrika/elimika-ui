// @ts-nocheck -- 1:1 Lovable port; @hey-api generated-client type drift
'use client';

import { useQueries, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { BookOpen, Eye, FileDown, FileText, MoreHorizontal, Printer, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useOrganisation } from '@/context/organisation-context';
import { extractEntity } from '@/lib/api-helpers';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import type { Course } from '@/services/client';
import { getCourseByUuidOptions, searchTrainingApplicationsOptions } from '@/services/client/@tanstack/react-query.gen';

const statusVariant = (status?: string) => {
  const s = (status ?? '').toLowerCase();
  if (s === 'approved' || s === 'accepted') return 'default' as const;
  if (s === 'rejected' || s === 'revoked') return 'destructive' as const;
  return 'outline' as const;
};
const pretty = (v?: string | null) => (v ? v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—');

function CourseImage({ src, alt }: { src?: string | null; alt: string }) {
  if (src) return <img src={src} alt={alt} className="h-12 w-16 shrink-0 rounded-md object-cover" />;
  return (
    <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary/15 to-primary/5">
      <BookOpen className="h-5 w-5 text-primary/70" />
    </div>
  );
}

function ApplicationActions({ onView }: { onView: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => e.stopPropagation()} aria-label="Application actions">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
        <DropdownMenuItem onClick={onView}>
          <Eye className="mr-2 h-4 w-4" /> View details
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Print
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onView}>
          <FileDown className="mr-2 h-4 w-4" /> Download
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onView}>
          <RefreshCw className="mr-2 h-4 w-4" /> Reapply
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function MyApplicationsPage() {
  const router = useRouter();
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';

  const applicationsQuery = useQuery({
    ...searchTrainingApplicationsOptions({
      query: {
        searchParams: { applicant_uuid_eq: organisationUuid, applicant_type_eq: 'organisation' },
        pageable: { page: 0, size: 100 },
      },
    }),
    enabled: Boolean(organisationUuid),
  });
  const applications = applicationsQuery.data?.data?.content ?? [];

  const courseUuids = useMemo(
    () => Array.from(new Set(applications.map(a => a.course_uuid).filter(Boolean) as string[])),
    [applications]
  );
  const courseQueries = useQueries({
    queries: courseUuids.map(uuid => ({ ...getCourseByUuidOptions({ path: { uuid } }), enabled: Boolean(uuid), staleTime: 5 * 60 * 1000 })),
  });
  const courseByUuid = useMemo(() => {
    const map = new Map<string, { course?: Course; loading: boolean }>();
    courseQueries.forEach((q, i) => map.set(courseUuids[i], { course: extractEntity<Course>(q.data) ?? undefined, loading: q.isLoading }));
    return map;
  }, [courseQueries, courseUuids]);

  const goToApp = (id?: string) => id && router.push(`/dashboard/organisation/my-applications/${id}`);

  const rows = applications.map(app => {
    const entry = app.course_uuid ? courseByUuid.get(app.course_uuid) : undefined;
    const course = entry?.course;
    const cats = course?.category_names ?? [];
    return {
      id: app.uuid as string,
      loading: entry?.loading ?? false,
      course: course?.name,
      subject: cats[1] ?? cats[0] ?? '—',
      image: toAuthenticatedMediaUrl(course?.banner_url ?? course?.thumbnail_url) ?? null,
      submitted: app.created_date ? dayjs(app.created_date).format('DD MMM YYYY') : '—',
      status: pretty(app.status),
      rawStatus: app.status,
      notes: app.review_notes ?? app.rejection_reason ?? '—',
    };
  });

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]">
      <PageHeader title="My Applications" description="Track applications to train courses and their review status." />

      {applications.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No applications yet"
          description="Apply to train a course from the catalogue and track its review status here."
        />
      ) : (
        <div className="space-y-3">
          {/* Mobile card list */}
          <div className="sm:hidden">
            <div className="divide-y divide-border rounded-lg border">
              {rows.map(row => (
                <div
                  key={row.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => goToApp(row.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      goToApp(row.id);
                    }
                  }}
                  className="flex cursor-pointer items-start gap-3 p-3 hover:bg-muted/40"
                >
                  <CourseImage src={row.image} alt={row.course ?? 'Course'} />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="truncate font-medium">{row.course ?? (row.loading ? '…' : 'Course')}</span>
                      <Badge variant={statusVariant(row.rawStatus)} className="shrink-0">{row.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{row.subject}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-xs">{row.submitted}</Badge>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="line-clamp-2 flex-1 text-xs text-muted-foreground">{row.notes}</p>
                      <ApplicationActions onView={() => goToApp(row.id)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-lg border sm:block">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24 whitespace-nowrap">Image</TableHead>
                  <TableHead className="whitespace-nowrap">Course</TableHead>
                  <TableHead className="min-w-[120px] whitespace-nowrap">Subject</TableHead>
                  <TableHead className="whitespace-nowrap">Submitted</TableHead>
                  <TableHead className="whitespace-nowrap">Cohort</TableHead>
                  <TableHead className="whitespace-nowrap">Mode</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Reviewer notes</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(row => (
                  <TableRow key={row.id} onClick={() => goToApp(row.id)} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="whitespace-nowrap">
                      <CourseImage src={row.image} alt={row.course ?? 'Course'} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-medium">
                      {row.course ?? (row.loading ? <Skeleton className="h-4 w-40" /> : 'Course')}
                    </TableCell>
                    <TableCell className="min-w-[120px] whitespace-nowrap text-muted-foreground">{row.subject}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{row.submitted}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">—</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">—</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant={statusVariant(row.rawStatus)}>{row.status}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs whitespace-nowrap text-sm text-muted-foreground">{row.notes}</TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      <ApplicationActions onView={() => goToApp(row.id)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
