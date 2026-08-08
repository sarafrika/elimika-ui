// @ts-nocheck -- 1:1 Lovable port; @hey-api generated-client type drift
'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Briefcase,
  GraduationCap,
  MessageSquare,
  MoreHorizontal,
  Star,
  Trash2,
  UserX,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ALL_CATEGORIES, CategoryTabs, filterByCategoryTabs } from '@/components/category-tabs';
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
import type { OrgInstructorSummary } from '@/services/client';
import { getOrganisationInstructorSummariesOptions } from '@/services/client/@tanstack/react-query.gen';

const initials = (name?: string) =>
  (name ?? '?')
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

export default function InstructorsPage() {
  const router = useRouter();
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';

  const summariesQuery = useQuery({
    ...getOrganisationInstructorSummariesOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
  });
  const instructors = extractList<OrgInstructorSummary>(summariesQuery.data);

  const items = useMemo(
    () =>
      instructors.map(i => ({
        ...i,
        category: i.field_of_study || 'General',
        subject: i.top_skill ?? null,
        programType: null,
      })),
    [instructors]
  );

  const [levelSort, setLevelSort] = useState<'asc' | 'desc' | null>(null);
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORIES);
  const [subjectByCategory, setSubjectByCategory] = useState<Record<string, string>>({});

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
    const totalClasses = instructors.reduce((a, i) => a + (i.class_count ?? 0), 0);
    const rated = instructors.filter(i => (i.review_count ?? 0) > 0);
    const avgRating = rated.length
      ? (rated.reduce((a, i) => a + (i.average_rating ?? 0), 0) / rated.length).toFixed(1)
      : '—';
    return { total: instructors.length, totalClasses, rated: rated.length, avgRating };
  }, [instructors]);

  const selected = instructors.find(i => i.user_uuid === selectedUuid);

  return (
    <div className='mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]'>
      <PageHeader
        title='Instructors & Staff'
        description='Onboard instructors, assign courses, and track performance.'
        action={
          <Button
            onClick={() => router.push('/dashboard/organisation/jobs/new')}
          >
            <Briefcase className='mr-2 h-4 w-4' /> Post a job
          </Button>
        }
      />

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Card className='border-l-primary border-l-4'>
          <CardContent className='p-6'>
            <div className='text-2xl font-bold'>{kpis.total}</div>
            <div className='text-muted-foreground text-xs'>Instructors</div>
          </CardContent>
        </Card>
        <Card className='border-l-success border-l-4'>
          <CardContent className='p-6'>
            <div className='text-2xl font-bold'>{kpis.totalClasses}</div>
            <div className='text-muted-foreground text-xs'>Assigned classes</div>
          </CardContent>
        </Card>
        <Card className='border-l-4 border-l-teal-400'>
          <CardContent className='p-6'>
            <div className='text-2xl font-bold'>{kpis.rated}</div>
            <div className='text-muted-foreground text-xs'>With reviews</div>
          </CardContent>
        </Card>
        <Card className='border-l-warning border-l-4'>
          <CardContent className='p-6'>
            <div className='text-2xl font-bold'>{kpis.avgRating}</div>
            <div className='text-muted-foreground text-xs'>Avg. rating</div>
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
      ) : instructors.length === 0 ? (
        <div className='rounded-lg border border-dashed p-12 text-center'>
          <GraduationCap className='text-muted-foreground mx-auto h-8 w-8' />
          <div className='mt-2 font-medium'>No instructors yet</div>
          <p className='text-muted-foreground text-sm'>
            Invite instructors to your organisation to see them here.
          </p>
        </div>
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
              {sorted.map(i => (
                <TableRow
                  key={i.user_uuid}
                  className='hover:bg-muted/50 cursor-pointer'
                  onClick={() => setSelectedUuid(i.user_uuid ?? null)}
                >
                  <TableCell className='whitespace-nowrap'>
                    <div className='flex items-center gap-3'>
                      <Avatar className='h-8 w-8 shrink-0'>
                        <AvatarFallback className='bg-primary/10 text-primary text-xs font-semibold'>
                          {initials(i.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className='font-medium'>{i.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className='min-w-[120px] whitespace-nowrap'>
                    {i.highest_qualification ? (
                      <Badge variant='secondary'>{i.highest_qualification}</Badge>
                    ) : (
                      <span className='text-muted-foreground'>—</span>
                    )}
                  </TableCell>
                  <TableCell className='text-muted-foreground min-w-[120px] whitespace-nowrap'>
                    {i.top_skill ?? i.field_of_study ?? '—'}
                  </TableCell>
                  <TableCell className='whitespace-nowrap'>
                    <Badge variant='default'>Active</Badge>
                  </TableCell>
                  <TableCell className='text-center whitespace-nowrap'>
                    {i.class_count ?? 0}
                  </TableCell>
                  <TableCell className='font-medium whitespace-nowrap'>
                    {i.average_rating != null ? (
                      <span className='inline-flex items-center gap-1'>
                        <Star className='fill-warning text-warning h-3.5 w-3.5' />
                        {Number(i.average_rating).toFixed(1)}
                        <span className='text-muted-foreground text-xs font-normal'>
                          ({i.review_count ?? 0})
                        </span>
                      </span>
                    ) : (
                      '—'
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
                            toast.info('Message', { description: `Messaging ${i.full_name}.` });
                          }}
                        >
                          <MessageSquare className='mr-2 h-4 w-4' /> Message
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={e => {
                            e.stopPropagation();
                            toast.warning('Suspend', { description: `${i.full_name} suspended.` });
                          }}
                        >
                          <UserX className='mr-2 h-4 w-4' /> Suspend
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className='text-destructive focus:text-destructive'
                          onClick={e => {
                            e.stopPropagation();
                            toast.error('Remove', { description: `${i.full_name} removed.` });
                          }}
                        >
                          <Trash2 className='mr-2 h-4 w-4' /> Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet open={selected != null} onOpenChange={o => !o && setSelectedUuid(null)}>
        <SheetContent className='w-full overflow-y-auto sm:max-w-md'>
          {selected ? (
            <>
              <SheetHeader>
                <div className='flex items-center gap-4'>
                  <Avatar className='h-14 w-14'>
                    <AvatarFallback className='bg-primary/10 text-primary font-semibold'>
                      {initials(selected.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className='min-w-0'>
                    <SheetTitle className='truncate'>{selected.full_name}</SheetTitle>
                    <SheetDescription>
                      {selected.top_skill ?? selected.field_of_study ?? 'Instructor'}
                    </SheetDescription>
                    <div className='mt-2'>
                      <Badge variant='default'>Active</Badge>
                    </div>
                  </div>
                </div>
              </SheetHeader>
              <div className='mt-6 space-y-4 text-sm'>
                <Detail label='Email' value={selected.email ?? '—'} />
                <Detail
                  label='Highest qualification'
                  value={selected.highest_qualification ?? '—'}
                />
                <Detail label='Field of study' value={selected.field_of_study ?? '—'} />
                <Detail label='Assigned classes' value={String(selected.class_count ?? 0)} />
                <Detail
                  label='Rating'
                  value={
                    selected.average_rating != null
                      ? `${Number(selected.average_rating).toFixed(1)} (${selected.review_count ?? 0} reviews)`
                      : 'No reviews yet'
                  }
                />
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex items-start justify-between gap-4 border-b pb-3'>
      <span className='text-muted-foreground'>{label}</span>
      <span className='text-right font-medium'>{value}</span>
    </div>
  );
}
