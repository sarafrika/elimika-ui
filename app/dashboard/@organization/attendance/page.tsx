// @ts-nocheck -- 1:1 Lovable port; @hey-api generated-client type drift
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ClipboardCheck, Clock, Search, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/page-header';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useOrganisation } from '@/context/organisation-context';
import { extractList, extractPage } from '@/lib/api-helpers';
import type { ClassDefinition, Enrollment, User } from '@/services/client';
import {
  getClassDefinitionsForOrganisationOptions,
  getEnrollmentsForClassOptions,
  getEnrollmentsForClassQueryKey,
  getUsersByOrganisationAndDomainOptions,
  markAttendanceMutation,
} from '@/services/client/@tanstack/react-query.gen';

type Status = 'Present' | 'Absent' | 'Not marked';

const STATUS_STYLE: Record<Status, string> = {
  Present: 'bg-success/10 text-success',
  Absent: 'bg-destructive/10 text-destructive',
  'Not marked': 'bg-muted text-muted-foreground',
};

const statusOf = (e: Enrollment): Status => {
  if (!e.is_attendance_marked) return 'Not marked';
  return e.did_attend ? 'Present' : 'Absent';
};

const initials = (u?: User) =>
  u ? `${u.first_name?.[0] ?? ''}${u.last_name?.[0] ?? ''}`.toUpperCase() || (u.email?.[0] ?? '?').toUpperCase() : '?';
const fullName = (u?: User) => (u ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email || 'Student' : 'Student');

export default function AttendancePage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const queryClient = useQueryClient();

  const classesQuery = useQuery({
    ...getClassDefinitionsForOrganisationOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
  });
  const classes: ClassDefinition[] = useMemo(
    () =>
      (classesQuery.data?.data ?? [])
        .map(c => c.class_definition)
        .filter((c): c is ClassDefinition => Boolean(c?.uuid)),
    [classesQuery.data]
  );

  const [selectedClass, setSelectedClass] = useState<string>('');
  const activeClass = selectedClass || classes[0]?.uuid || '';

  const studentsQuery = useQuery({
    ...getUsersByOrganisationAndDomainOptions({ path: { uuid: organisationUuid, domainName: 'student' } }),
    enabled: Boolean(organisationUuid),
  });
  const studentsByUuid = useMemo(() => {
    const map = new Map<string, User>();
    for (const u of extractPage<User>(studentsQuery.data).items) if (u.uuid) map.set(u.uuid, u);
    return map;
  }, [studentsQuery.data]);

  const enrollmentsQuery = useQuery({
    ...getEnrollmentsForClassOptions({ path: { uuid: activeClass } }),
    enabled: Boolean(activeClass),
  });
  const enrollments = extractList<Enrollment>(enrollmentsQuery.data);

  const mark = useMutation({
    ...markAttendanceMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getEnrollmentsForClassQueryKey({ path: { uuid: activeClass } }) });
    },
  });

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<string>('all');

  const rows = useMemo(
    () =>
      enrollments.filter(e => {
        if (status !== 'all' && statusOf(e) !== status) return false;
        if (query) {
          const name = fullName(studentsByUuid.get(e.student_uuid ?? ''));
          if (!name.toLowerCase().includes(query.toLowerCase())) return false;
        }
        return true;
      }),
    [enrollments, status, query, studentsByUuid]
  );

  const totals = useMemo(() => {
    const present = enrollments.filter(e => e.is_attendance_marked && e.did_attend).length;
    const absent = enrollments.filter(e => e.is_attendance_marked && !e.did_attend).length;
    const marked = present + absent;
    return { enrolled: enrollments.length, present, absent, rate: marked ? Math.round((present / marked) * 100) : 0 };
  }, [enrollments]);

  const handleMark = (e: Enrollment, attended: boolean) => {
    if (!e.uuid) return;
    mark.mutate(
      { path: { enrollmentUuid: e.uuid }, query: { attended } },
      {
        onSuccess: () =>
          toast.success(attended ? 'Marked present' : 'Marked absent', {
            description: fullName(studentsByUuid.get(e.student_uuid ?? '')),
          }),
        onError: () => toast.error('Could not update attendance'),
      }
    );
  };

  const loading = classesQuery.isLoading || enrollmentsQuery.isLoading;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]">
      <PageHeader
        title="Attendance"
        description="Track student attendance across classes and sessions."
        action={
          classes.length ? (
            <Select value={activeClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="h-9 w-[220px] sm:w-[260px]">
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map(c => (
                  <SelectItem key={c.uuid} value={c.uuid as string}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{totals.enrolled}</div>
            <div className="text-xs text-muted-foreground">Enrolled students</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-success">
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{totals.present}</div>
            <div className="text-xs text-muted-foreground">Present</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-destructive">
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{totals.absent}</div>
            <div className="text-xs text-muted-foreground">Absent</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-teal-400">
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{totals.rate}%</div>
            <div className="text-xs text-muted-foreground">Attendance rate</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by student" value={query} onChange={e => setQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-52">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="Present">Present</SelectItem>
            <SelectItem value="Absent">Absent</SelectItem>
            <SelectItem value="Not marked">Not marked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
              <ClipboardCheck className="h-8 w-8 text-muted-foreground" />
              <div className="font-medium">{enrollments.length === 0 ? 'No enrolled students' : 'No students match'}</div>
              <p className="text-sm text-muted-foreground">
                {enrollments.length === 0 ? 'Enrol students into this class to record attendance.' : 'Try adjusting the filters above.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Student</TableHead>
                    <TableHead className="whitespace-nowrap">Enrollment status</TableHead>
                    <TableHead className="whitespace-nowrap">Attendance</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Mark</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(e => {
                    const st = statusOf(e);
                    const student = studentsByUuid.get(e.student_uuid ?? '');
                    return (
                      <TableRow key={e.uuid}>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                {initials(student)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{fullName(student)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {e.status_description ?? e.status ?? '—'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge className={STATUS_STYLE[st]} variant="secondary">
                            {st === 'Present' && <CheckCircle2 className="mr-1 h-3 w-3" />}
                            {st === 'Absent' && <XCircle className="mr-1 h-3 w-3" />}
                            {st === 'Not marked' && <Clock className="mr-1 h-3 w-3" />}
                            {st}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right">
                          <div className="inline-flex gap-2">
                            <Button
                              size="sm"
                              variant={st === 'Present' ? 'default' : 'outline'}
                              disabled={mark.isPending}
                              onClick={() => handleMark(e, true)}
                            >
                              Present
                            </Button>
                            <Button
                              size="sm"
                              variant={st === 'Absent' ? 'destructive' : 'outline'}
                              disabled={mark.isPending}
                              onClick={() => handleMark(e, false)}
                            >
                              Absent
                            </Button>
                          </div>
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
    </div>
  );
}
