'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Briefcase,
  Eye,
  GraduationCap,
  Mail,
  MoreHorizontal,
  Plus,
  Star,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { KeyboardEvent } from 'react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ALL_CATEGORIES, CategoryTabs, filterByCategoryTabs } from '@/components/category-tabs';
import { PageHeader } from '@/components/dashboard/page-header';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { extractList } from '@/lib/api-helpers';
import { getErrorMessage } from '@/lib/error-utils';
import { formatCount, toNumber } from '@/lib/metrics';
import type { OrganisationInvitation, OrgInstructorSummary } from '@/services/client';
import {
  getOrganisationInstructorSummariesOptions,
  listOrganisationInvitationsOptions,
} from '@/services/client/@tanstack/react-query.gen';

const initials = (name?: string) =>
  (name ?? '?')
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

type InstructorRow = OrgInstructorSummary & {
  id: string;
  name: string;
  category: string;
  subject: string | null;
  programType: null;
  status: 'Active';
  classCount: number;
  reviewCount: number;
  rating: number | null;
};

const normaliseRating = (value: OrgInstructorSummary['average_rating']) => {
  if (value == null) return null;
  const rating = toNumber(value, Number.NaN);
  return Number.isFinite(rating) ? rating : null;
};

const isPendingInstructorInvite = (invite: OrganisationInvitation) =>
  String(invite.domain_name ?? '').toLowerCase() === 'instructor' &&
  ['PENDING', 'AWAITING_GUARDIAN_CONSENT'].includes(String(invite.status ?? ''));

const instructorHref = (id: string) =>
  `/dashboard/organisation/instructors/${encodeURIComponent(id)}`;

export default function InstructorsPage() {
  const router = useRouter();
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';

  const summariesQuery = useQuery({
    ...getOrganisationInstructorSummariesOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
  });
  const invitationsQuery = useQuery({
    ...listOrganisationInvitationsOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
  });
  const instructors = extractList<OrgInstructorSummary>(summariesQuery.data);
  const invitations = extractList<OrganisationInvitation>(invitationsQuery.data);

  const items = useMemo(
    () =>
      instructors.map<InstructorRow>((i, index) => {
        const name = i.full_name?.trim() || i.email || 'Unnamed instructor';
        return {
          ...i,
          id: i.user_uuid ?? i.instructor_uuid ?? i.email ?? `instructor-${index}`,
          name,
          category: i.field_of_study || 'General',
          subject: i.top_skill ?? i.field_of_study ?? null,
          programType: null,
          status: 'Active',
          classCount: toNumber(i.class_count),
          reviewCount: toNumber(i.review_count),
          rating: normaliseRating(i.average_rating),
        };
      }),
    [instructors]
  );

  const [levelSort, setLevelSort] = useState<'asc' | 'desc' | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORIES);
  const [subjectByCategory, setSubjectByCategory] = useState<Record<string, string>>({});

  const openInstructor = (id: string) => router.push(instructorHref(id));
  const handleRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, id: string) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openInstructor(id);
  };

  const filtered = useMemo(
    () => filterByCategoryTabs(items, activeCategory, subjectByCategory, null),
    [items, activeCategory, subjectByCategory]
  );

  const sorted = useMemo(() => {
    if (!levelSort) return filtered;
    return filtered.slice().sort((a, b) => {
      const ra = (a.highest_qualification ?? '').toLowerCase();
      const rb = (b.highest_qualification ?? '').toLowerCase();
      return levelSort === 'asc' ? ra.localeCompare(rb) : rb.localeCompare(ra);
    });
  }, [levelSort, filtered]);

  const kpis = useMemo(() => {
    const assignedClasses = items.reduce((total, item) => total + item.classCount, 0);
    const invited = invitations.filter(isPendingInstructorInvite).length;
    return {
      active: items.length,
      invited,
      onLeave: 0,
      assignedClasses,
    };
  }, [invitations, items]);

  const errorDescription = getErrorMessage(
    summariesQuery.error,
    'Refresh the page or try again in a moment.'
  );

  return (
    <div className='mx-auto w-full max-w-[2200px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[2400px]'>
      <PageHeader
        title='Instructors & Staff'
        description='Onboard instructors, assign courses, and track performance.'
        actions={
          <Button onClick={() => router.push('/dashboard/organisation/jobs/new')}>
            <Briefcase className='mr-2 h-4 w-4' /> Post a job
          </Button>
        }
      />

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Card className='border-l-primary border-l-4'>
          <CardContent className='p-6'>
            <div className='text-2xl font-bold'>{formatCount(kpis.active, '0')}</div>
            <div className='text-muted-foreground text-xs'>Active instructors</div>
          </CardContent>
        </Card>
        <Card className='border-l-warning border-l-4'>
          <CardContent className='p-6'>
            <div className='text-2xl font-bold'>{formatCount(kpis.invited, '0')}</div>
            <div className='text-muted-foreground text-xs'>Invited (pending)</div>
          </CardContent>
        </Card>
        <Card className='border-l-accent border-l-4'>
          <CardContent className='p-6'>
            <div className='text-2xl font-bold'>{formatCount(kpis.onLeave, '0')}</div>
            <div className='text-muted-foreground text-xs'>On leave</div>
          </CardContent>
        </Card>
        <Card className='border-l-success border-l-4'>
          <CardContent className='p-6'>
            <div className='text-2xl font-bold'>{formatCount(kpis.assignedClasses, '0')}</div>
            <div className='text-muted-foreground text-xs'>Assigned classes</div>
          </CardContent>
        </Card>
      </div>

      {items.length > 0 && (
        <CategoryTabs
          items={items}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          subjectByCategory={subjectByCategory}
          onSubjectChange={setSubjectByCategory}
        />
      )}

      {summariesQuery.isLoading ? (
        <div className='space-y-2'>
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className='h-14 w-full' />
          ))}
        </div>
      ) : summariesQuery.isError ? (
        <EmptyState
          icon={GraduationCap}
          title='Could not load instructors'
          description={errorDescription}
          action={
            <Button variant='outline' size='sm' onClick={() => summariesQuery.refetch()}>
              Retry
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title='No instructors yet'
          description='Invite instructors to your organisation to see them here.'
        />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title='No instructors match this filter'
          description='Choose another category or subject to widen the list.'
        />
      ) : (
        <div className='overflow-x-auto rounded-lg border'>
          <Table className='min-w-[760px]'>
            <TableHeader>
              <TableRow>
                <TableHead className='whitespace-nowrap'>Instructor</TableHead>
                <TableHead className='min-w-[140px] whitespace-nowrap'>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='-ml-2 h-8 gap-1 px-2 font-medium'
                    onClick={() =>
                      setLevelSort(s => (s === null ? 'desc' : s === 'desc' ? 'asc' : null))
                    }
                  >
                    Level of study
                    {levelSort === 'asc' ? (
                      <ArrowUp className='h-3.5 w-3.5' />
                    ) : levelSort === 'desc' ? (
                      <ArrowDown className='h-3.5 w-3.5' />
                    ) : (
                      <ArrowUpDown className='text-muted-foreground h-3.5 w-3.5' />
                    )}
                  </Button>
                </TableHead>
                <TableHead className='min-w-[120px] whitespace-nowrap'>Subject</TableHead>
                <TableHead className='whitespace-nowrap'>Status</TableHead>
                <TableHead className='text-center whitespace-nowrap'>Classes</TableHead>
                <TableHead className='whitespace-nowrap'>Rating</TableHead>
                <TableHead className='text-right whitespace-nowrap'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map(i => {
                const href = instructorHref(i.id);
                return (
                  <TableRow
                    key={i.id}
                    aria-label={`View ${i.name} profile`}
                    className='hover:bg-muted/50 cursor-pointer'
                    role='link'
                    tabIndex={0}
                    onClick={() => openInstructor(i.id)}
                    onKeyDown={event => handleRowKeyDown(event, i.id)}
                  >
                    <TableCell className='whitespace-nowrap'>
                      <div className='flex items-center gap-3'>
                        <Avatar className='h-8 w-8 shrink-0'>
                          <AvatarFallback className='bg-primary/10 text-primary text-xs font-semibold'>
                            {initials(i.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className='font-medium'>{i.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className='min-w-[120px] whitespace-nowrap'>
                      {i.highest_qualification ? (
                        <Badge variant='secondary'>{i.highest_qualification}</Badge>
                      ) : (
                        <span className='text-muted-foreground'>-</span>
                      )}
                    </TableCell>
                    <TableCell className='text-muted-foreground min-w-[120px] whitespace-nowrap'>
                      {i.top_skill ?? i.field_of_study ?? '-'}
                    </TableCell>
                    <TableCell className='whitespace-nowrap'>
                      <Badge variant='default'>Active</Badge>
                    </TableCell>
                    <TableCell className='text-center whitespace-nowrap'>
                      {formatCount(i.classCount, '0')}
                    </TableCell>
                    <TableCell className='font-medium whitespace-nowrap'>
                      {i.rating != null ? (
                        <span className='inline-flex items-center gap-1'>
                          <Star className='fill-warning text-warning h-3.5 w-3.5' />
                          {i.rating.toFixed(1)}
                          <span className='text-muted-foreground text-xs font-normal'>
                            ({formatCount(i.reviewCount, '0')})
                          </span>
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className='text-right whitespace-nowrap'>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8'
                            onClick={e => e.stopPropagation()}
                          >
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem
                            onClick={e => {
                              e.stopPropagation();
                              router.push(href);
                            }}
                          >
                            <Eye className='mr-2 h-4 w-4' /> View profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={!i.email}
                            onClick={e => {
                              e.stopPropagation();
                              if (!i.email) {
                                toast.error('Email unavailable');
                                return;
                              }
                              window.location.href = `mailto:${i.email}`;
                            }}
                          >
                            <Mail className='mr-2 h-4 w-4' /> Email instructor
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={e => {
                              e.stopPropagation();
                              router.push(
                                `/dashboard/organisation/classes/new?instructorUuid=${encodeURIComponent(
                                  i.instructor_uuid ?? i.id
                                )}`
                              );
                            }}
                          >
                            <Plus className='mr-2 h-4 w-4' /> Assign class
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
    </div>
  );
}
