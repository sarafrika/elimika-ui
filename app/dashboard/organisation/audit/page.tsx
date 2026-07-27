// @ts-nocheck -- 1:1 Lovable port; @hey-api generated-client type drift
'use client';

import { useQuery } from '@tanstack/react-query';
import { BookOpen, GraduationCap, TrendingUp, Users } from 'lucide-react';
import { useMemo } from 'react';

import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useOrganisation } from '@/context/organisation-context';
import { extractList, extractPage } from '@/lib/api-helpers';
import type { ClassDefinition, ClassEnrolmentCountDto, StudentEnrolmentSummaryDto, User } from '@/services/client';
import {
  getClassEnrolmentCountsOptions,
  getClassDefinitionsForOrganisationOptions,
  getStudentSummariesOptions,
  getUsersByOrganisationAndDomainOptions,
} from '@/services/client/@tanstack/react-query.gen';

export default function ReportsPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';

  const studentsQuery = useQuery({
    ...getUsersByOrganisationAndDomainOptions({ path: { uuid: organisationUuid, domainName: 'student' } }),
    enabled: Boolean(organisationUuid),
  });
  const instructorsQuery = useQuery({
    ...getUsersByOrganisationAndDomainOptions({ path: { uuid: organisationUuid, domainName: 'instructor' } }),
    enabled: Boolean(organisationUuid),
  });
  const classesQuery = useQuery({
    ...getClassDefinitionsForOrganisationOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
  });
  const countsQuery = useQuery({
    ...getClassEnrolmentCountsOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
  });
  const summariesQuery = useQuery({
    ...getStudentSummariesOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
  });

  const students = extractPage<User>(studentsQuery.data).items;
  const instructors = extractPage<User>(instructorsQuery.data).items;

  const classDefs: ClassDefinition[] = useMemo(
    () =>
      (classesQuery.data?.data ?? [])
        .map(c => c.class_definition)
        .filter((c): c is ClassDefinition => Boolean(c?.uuid)),
    [classesQuery.data]
  );

  const enrolledByClass = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of extractList<ClassEnrolmentCountDto>(countsQuery.data)) {
      if (c.class_definition_uuid) map.set(c.class_definition_uuid, Number(c.enrolled ?? 0));
    }
    return map;
  }, [countsQuery.data]);

  const summaries = extractList<StudentEnrolmentSummaryDto>(summariesQuery.data);
  const avgCompletion = useMemo(() => {
    const withData = summaries.filter(s => Number(s.total ?? 0) > 0);
    if (!withData.length) return 0;
    const sum = withData.reduce((a, s) => a + Number(s.completed ?? 0) / Number(s.total ?? 1), 0);
    return Math.round((sum / withData.length) * 100);
  }, [summaries]);

  const topClasses = useMemo(() => {
    return classDefs
      .map(cd => {
        const scheduled = Number(cd.scheduled_session_count ?? 0);
        const completed = Number(cd.completed_session_count ?? 0);
        return {
          uuid: cd.uuid as string,
          title: cd.title,
          enrolled: enrolledByClass.get(cd.uuid as string) ?? 0,
          capacity: cd.max_participants ?? null,
          completion: scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0,
        };
      })
      .sort((a, b) => b.enrolled - a.enrolled)
      .slice(0, 10);
  }, [classDefs, enrolledByClass]);

  const totalEnrolments = useMemo(
    () => [...enrolledByClass.values()].reduce((a, v) => a + v, 0),
    [enrolledByClass]
  );

  const kpis = [
    { label: 'Total students', value: students.length, icon: Users, border: 'border-l-primary' },
    { label: 'Instructors', value: instructors.length, icon: GraduationCap, border: 'border-l-success' },
    { label: 'Total enrolments', value: totalEnrolments, icon: BookOpen, border: 'border-l-teal-400' },
    { label: 'Avg. completion', value: `${avgCompletion}%`, icon: TrendingUp, border: 'border-l-warning' },
  ];

  const loading = classesQuery.isLoading || countsQuery.isLoading;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]">
      <PageHeader title="Reports" description="Organisation performance — enrolments, completion and top classes." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className={`border-l-4 ${k.border}`}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{k.value}</div>
                  <div className="text-xs text-muted-foreground">{k.label}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Top classes by enrolment</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : topClasses.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">No class data yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[640px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 whitespace-nowrap">Rank</TableHead>
                    <TableHead className="whitespace-nowrap">Class</TableHead>
                    <TableHead className="whitespace-nowrap text-center">Enrolments</TableHead>
                    <TableHead className="whitespace-nowrap text-center">Capacity</TableHead>
                    <TableHead className="min-w-[160px] whitespace-nowrap">Completion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topClasses.map((c, idx) => (
                    <TableRow key={c.uuid}>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="secondary">{idx + 1}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-medium">{c.title}</TableCell>
                      <TableCell className="whitespace-nowrap text-center">{c.enrolled}</TableCell>
                      <TableCell className="whitespace-nowrap text-center text-muted-foreground">{c.capacity ?? '—'}</TableCell>
                      <TableCell className="min-w-[160px]">
                        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                          <span>{c.completion}%</span>
                        </div>
                        <Progress value={c.completion} className="h-2" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
