// @ts-nocheck -- 1:1 Lovable port; @hey-api generated-client type drift
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Calendar, MoreHorizontal, Plus, Search, Trash2, Trophy, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import type { Competition } from '@/services/client';
import {
  createCompetitionMutation,
  deleteCompetitionMutation,
  listCompetitionsOptions,
  listCompetitionsQueryKey,
} from '@/services/client/@tanstack/react-query.gen';

const STATUS_STYLE: Record<string, string> = {
  Upcoming: 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200',
  'Registration Open': 'bg-success/10 text-success',
  'In Progress': 'bg-warning/10 text-warning',
  Completed: 'bg-muted text-foreground',
};

const STATUSES = ['Upcoming', 'Registration Open', 'In Progress', 'Completed'];

function CreateCompetitionDialog({ organisationUuid }: { organisationUuid: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const create = useMutation(createCompetitionMutation());

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className='mr-2 h-4 w-4' /> New Competition
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>Create competition</DialogTitle>
          <DialogDescription>
            Schedule a competition or event for your organisation.
          </DialogDescription>
        </DialogHeader>
        <form
          className='space-y-4'
          onSubmit={e => {
            e.preventDefault();
            const f = e.currentTarget;
            const name = (f.elements.namedItem('c-name') as HTMLInputElement)?.value.trim();
            const category = (f.elements.namedItem('c-category') as HTMLInputElement)?.value.trim();
            const venue = (f.elements.namedItem('c-venue') as HTMLInputElement)?.value.trim();
            const date = (f.elements.namedItem('c-date') as HTMLInputElement)?.value;
            const capacity = (f.elements.namedItem('c-capacity') as HTMLInputElement)?.value;
            const status = (f.elements.namedItem('c-status') as HTMLInputElement)?.value;
            if (!name) {
              toast.error('Competition name is required.');
              return;
            }
            create.mutate(
              {
                path: { organisationUuid },
                body: {
                  name,
                  category: category || undefined,
                  venue_name: venue || undefined,
                  event_date: date ? new Date(date).toISOString() : undefined,
                  capacity: capacity ? Number(capacity) : undefined,
                  status: status || 'Upcoming',
                },
              },
              {
                onSuccess: async () => {
                  setOpen(false);
                  toast.success('Competition created', { description: name });
                  await qc.invalidateQueries({
                    queryKey: listCompetitionsQueryKey({ path: { organisationUuid } }),
                  });
                },
                onError: () => toast.error('Could not create competition.'),
              }
            );
          }}
        >
          <div className='space-y-2'>
            <Label htmlFor='c-name'>Name</Label>
            <Input
              id='c-name'
              name='c-name'
              placeholder='e.g. Inter-School Robotics Cup'
              required
            />
          </div>
          <div className='grid gap-3 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='c-category'>Category</Label>
              <Input id='c-category' name='c-category' placeholder='e.g. STEM' />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='c-venue'>Venue</Label>
              <Input id='c-venue' name='c-venue' placeholder='e.g. Auditorium' />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='c-date'>Date</Label>
              <Input id='c-date' name='c-date' type='datetime-local' />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='c-capacity'>Capacity (teams)</Label>
              <Input id='c-capacity' name='c-capacity' type='number' min={0} placeholder='20' />
            </div>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='c-status'>Status</Label>
            <select
              id='c-status'
              name='c-status'
              defaultValue='Upcoming'
              className='border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-1'
            >
              {STATUSES.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type='submit' disabled={create.isPending}>
              {create.isPending ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function CompetitionPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const qc = useQueryClient();

  const competitionsQuery = useQuery({
    ...listCompetitionsOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
  });
  const competitions = extractList<Competition>(competitionsQuery.data);

  const remove = useMutation(deleteCompetitionMutation());

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<string>('all');

  const rows = useMemo(
    () =>
      competitions.filter(c => {
        if (status !== 'all' && c.status !== status) return false;
        if (
          query &&
          !`${c.name} ${c.category ?? ''} ${c.venue_name ?? ''}`
            .toLowerCase()
            .includes(query.toLowerCase())
        )
          return false;
        return true;
      }),
    [competitions, status, query]
  );

  const kpis = useMemo(() => {
    const upcoming = competitions.filter(
      c => c.status === 'Upcoming' || c.status === 'Registration Open'
    ).length;
    const live = competitions.filter(c => c.status === 'In Progress').length;
    const teams = competitions.reduce((a, c) => a + Number(c.team_count ?? 0), 0);
    return { total: competitions.length, upcoming, live, teams };
  }, [competitions]);

  return (
    <div className='mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]'>
      <PageHeader
        title='Competition'
        description='Organize and manage student competitions.'
        action={<CreateCompetitionDialog organisationUuid={organisationUuid} />}
      />

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Card className='border-l-primary border-l-4'>
          <CardContent className='p-6'>
            <div className='text-2xl font-bold'>{kpis.total}</div>
            <div className='text-muted-foreground text-xs'>Total events</div>
          </CardContent>
        </Card>
        <Card className='border-l-4 border-l-sky-500'>
          <CardContent className='p-6'>
            <div className='text-2xl font-bold'>{kpis.upcoming}</div>
            <div className='text-muted-foreground text-xs'>Upcoming</div>
          </CardContent>
        </Card>
        <Card className='border-l-warning border-l-4'>
          <CardContent className='p-6'>
            <div className='text-2xl font-bold'>{kpis.live}</div>
            <div className='text-muted-foreground text-xs'>In progress</div>
          </CardContent>
        </Card>
        <Card className='border-l-4 border-l-teal-400'>
          <CardContent className='p-6'>
            <div className='text-2xl font-bold'>{kpis.teams}</div>
            <div className='text-muted-foreground text-xs'>Teams registered</div>
          </CardContent>
        </Card>
      </div>

      <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
        <div className='relative flex-1'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
          <Input
            placeholder='Search competitions, categories, or venues'
            value={query}
            onChange={e => setQuery(e.target.value)}
            className='pl-9'
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className='sm:w-56'>
            <SelectValue placeholder='All statuses' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All statuses</SelectItem>
            {STATUSES.map(s => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className='p-0'>
          {competitionsQuery.isLoading ? (
            <div className='space-y-2 p-4'>
              {[...Array(5)].map((_, i) => (
                <div key={i} className='bg-muted h-12 w-full animate-pulse rounded' />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className='flex flex-col items-center justify-center gap-2 p-12 text-center'>
              <Trophy className='text-muted-foreground h-8 w-8' />
              <div className='font-medium'>
                {competitions.length === 0 ? 'No competitions yet' : 'No competitions match'}
              </div>
              <p className='text-muted-foreground text-sm'>
                {competitions.length === 0
                  ? 'Create a competition to get started.'
                  : 'Try adjusting your filters.'}
              </p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table className='min-w-[820px]'>
                <TableHeader>
                  <TableRow>
                    <TableHead className='whitespace-nowrap'>Competition</TableHead>
                    <TableHead className='whitespace-nowrap'>Category</TableHead>
                    <TableHead className='whitespace-nowrap'>Date</TableHead>
                    <TableHead className='whitespace-nowrap'>Venue</TableHead>
                    <TableHead className='whitespace-nowrap'>Teams</TableHead>
                    <TableHead className='whitespace-nowrap'>Status</TableHead>
                    <TableHead className='text-right whitespace-nowrap'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(c => (
                    <TableRow key={c.uuid}>
                      <TableCell className='whitespace-nowrap'>
                        <div className='font-medium'>{c.name}</div>
                        {c.description && (
                          <div className='text-muted-foreground max-w-xs truncate text-xs'>
                            {c.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className='whitespace-nowrap'>{c.category ?? '—'}</TableCell>
                      <TableCell className='whitespace-nowrap'>
                        <span className='inline-flex items-center gap-1'>
                          <Calendar className='text-muted-foreground h-3 w-3' />
                          {c.event_date ? dayjs(c.event_date).format('DD MMM YYYY') : '—'}
                        </span>
                      </TableCell>
                      <TableCell className='whitespace-nowrap'>{c.venue_name ?? '—'}</TableCell>
                      <TableCell className='whitespace-nowrap'>
                        <span className='inline-flex items-center gap-1'>
                          <Users className='text-muted-foreground h-3 w-3' />
                          {Number(c.team_count ?? 0)}
                          {c.capacity != null ? `/${c.capacity}` : ''}
                        </span>
                      </TableCell>
                      <TableCell className='whitespace-nowrap'>
                        <Badge
                          className={STATUS_STYLE[c.status] ?? 'bg-muted text-foreground'}
                          variant='secondary'
                        >
                          {c.status}
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
                              className='text-destructive focus:text-destructive'
                              onClick={() =>
                                remove.mutate(
                                  { path: { competitionUuid: c.uuid } },
                                  {
                                    onSuccess: async () => {
                                      toast.success('Competition deleted', { description: c.name });
                                      await qc.invalidateQueries({
                                        queryKey: listCompetitionsQueryKey({
                                          path: { organisationUuid },
                                        }),
                                      });
                                    },
                                    onError: () => toast.error('Could not delete competition.'),
                                  }
                                )
                              }
                            >
                              <Trash2 className='mr-2 h-4 w-4' /> Delete
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
        </CardContent>
      </Card>
    </div>
  );
}
