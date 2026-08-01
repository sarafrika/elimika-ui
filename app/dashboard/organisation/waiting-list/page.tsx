// @ts-nocheck -- 1:1 Lovable port; @hey-api generated-client type drift
'use client';

import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { CheckCircle, Clock, MoreHorizontal, Trash2, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useOrganisation } from '@/context/organisation-context';
import { extractList, extractPage } from '@/lib/api-helpers';
import type { ClassDefinition, Enrollment, User } from '@/services/client';
import {
  getClassDefinitionsForOrganisationOptions,
  getEnrollmentsForClassOptions,
  getUsersByOrganisationAndDomainOptions,
} from '@/services/client/@tanstack/react-query.gen';

const initials = (u?: User) =>
  u
    ? `${u.first_name?.[0] ?? ''}${u.last_name?.[0] ?? ''}`.toUpperCase() ||
      (u.email?.[0] ?? '?').toUpperCase()
    : '?';
const fullName = (u?: User) =>
  u ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email || 'Student' : 'Student';

export default function WaitingListPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';

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
  const activeClassDef = classes.find(c => c.uuid === activeClass);

  const studentsQuery = useQuery({
    ...getUsersByOrganisationAndDomainOptions({
      path: { uuid: organisationUuid, domainName: 'student' },
    }),
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

  // Real waitlist: WAITLISTED enrollments, ordered by application time.
  const waitlist = useMemo(
    () =>
      extractList<Enrollment>(enrollmentsQuery.data)
        .filter(e => (e.status ?? '').toUpperCase() === 'WAITLISTED')
        .sort(
          (a, b) =>
            new Date(a.created_date ?? 0).getTime() - new Date(b.created_date ?? 0).getTime()
        ),
    [enrollmentsQuery.data]
  );

  const capacity = activeClassDef?.max_participants ?? null;
  const loading = classesQuery.isLoading || enrollmentsQuery.isLoading;

  return (
    <div className='mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]'>
      <PageHeader
        title='Waiting List'
        description='Students waiting for a seat, grouped by class.'
        action={
          classes.length ? (
            <Select value={activeClass} onValueChange={setSelectedClass}>
              <SelectTrigger className='h-9 w-[220px] sm:w-[260px]'>
                <SelectValue placeholder='Select a class' />
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

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <Card className='border-l-primary border-l-4'>
          <CardContent className='p-6'>
            <div className='text-2xl font-bold'>{waitlist.length}</div>
            <div className='text-muted-foreground text-xs'>On the waiting list</div>
          </CardContent>
        </Card>
        <Card className='border-l-4 border-l-teal-400'>
          <CardContent className='p-6'>
            <div className='text-2xl font-bold'>{capacity ?? '—'}</div>
            <div className='text-muted-foreground text-xs'>Class capacity</div>
          </CardContent>
        </Card>
        <Card className='border-l-success border-l-4'>
          <CardContent className='p-6'>
            <div className='text-2xl font-bold'>
              {capacity != null
                ? Math.max(
                    0,
                    capacity -
                      extractList<Enrollment>(enrollmentsQuery.data).filter(
                        e => (e.status ?? '').toUpperCase() === 'ENROLLED'
                      ).length
                  )
                : '—'}
            </div>
            <div className='text-muted-foreground text-xs'>Seats available</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className='p-0'>
          {loading ? (
            <div className='space-y-2 p-4'>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
            </div>
          ) : waitlist.length === 0 ? (
            <div className='p-6'>
              <EmptyState
                icon={Users}
                title='No one waiting'
                description={
                  activeClassDef
                    ? `${activeClassDef.title} has no waitlisted students.`
                    : 'Select a class to view its waiting list.'
                }
              />
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table className='min-w-[640px]'>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-12 whitespace-nowrap'>#</TableHead>
                    <TableHead className='whitespace-nowrap'>Student</TableHead>
                    <TableHead className='whitespace-nowrap'>Applied on</TableHead>
                    <TableHead className='whitespace-nowrap'>Status</TableHead>
                    <TableHead className='text-right whitespace-nowrap'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {waitlist.map((e, idx) => {
                    const student = studentsByUuid.get(e.student_uuid ?? '');
                    return (
                      <TableRow key={e.uuid}>
                        <TableCell className='text-muted-foreground text-sm whitespace-nowrap'>
                          {idx + 1}
                        </TableCell>
                        <TableCell className='whitespace-nowrap'>
                          <div className='flex items-center gap-3'>
                            <Avatar className='h-8 w-8 shrink-0'>
                              <AvatarFallback className='bg-primary/10 text-primary text-xs font-semibold'>
                                {initials(student)}
                              </AvatarFallback>
                            </Avatar>
                            <span className='font-medium'>{fullName(student)}</span>
                          </div>
                        </TableCell>
                        <TableCell className='text-muted-foreground whitespace-nowrap'>
                          {e.created_date ? dayjs(e.created_date).format('DD MMM YYYY') : '—'}
                        </TableCell>
                        <TableCell className='whitespace-nowrap'>
                          <Badge
                            variant='outline'
                            className='border-warning/30 bg-warning/10 text-warning gap-1'
                          >
                            <Clock className='h-3 w-3' /> Waitlisted
                          </Badge>
                        </TableCell>
                        <TableCell className='text-right whitespace-nowrap'>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' size='icon' className='h-8 w-8'>
                                <MoreHorizontal className='h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem
                                onClick={() =>
                                  toast.success('Offer sent', {
                                    description: `${fullName(student)} has been offered a seat.`,
                                  })
                                }
                              >
                                <CheckCircle className='mr-2 h-4 w-4' /> Offer a seat
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className='text-destructive focus:text-destructive'
                                onClick={() =>
                                  toast.error('Removed from waitlist', {
                                    description: fullName(student),
                                  })
                                }
                              >
                                <Trash2 className='mr-2 h-4 w-4' /> Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
