'use client';

import { EmptyState } from '@/components/ui/empty-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../../../../../components/ui/dropdown-menu';

import { ANALYTICS_STATUS_OPTIONS } from './analytics-filters';
import { useInstructorAnalyticsData } from './useInstructorAnalyticsData';

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Completed: 'bg-success/20 text-success border border-success/40',
    Ongoing: 'bg-primary/20 text-primary border border-primary/40',
    Upcoming: 'bg-muted/70 text-primary/30 border border-muted/40',
    Cancelled: 'bg-destructive/20 text-destructive border border-destructive/40',
  };
  return (
    <span
      className={`inline-block rounded-md px-2 py-0.5 text-center text-xs font-medium ${styles[status] ?? styles['Upcoming']
        }`}
    >
      {status}
    </span>
  );
}

function CompletionBar({ pct }: { pct: number }) {
  const color =
    pct >= 90
      ? 'bg-success'
      : pct >= 70
        ? 'bg-success/70'
        : pct >= 50
          ? 'bg-warning'
          : 'bg-destructive';
  return (
    <div className='flex flex-col items-center gap-1.5'>
      <div className='bg-muted/20 h-1.5 w-16 rounded-full'>
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className='text-foreground text-xs font-medium'>{pct}%</span>
    </div>
  );
}

function StarRating({ value }: { value: number | null }) {
  if (value === null) {
    return <span className='text-muted-foreground text-xs font-medium'>N/A</span>;
  }

  return (
    <div className='flex items-center gap-1'>
      <span className='text-warning text-xs'>★</span>
      <span className='text-foreground text-xs font-medium'>{value}</span>
    </div>
  );
}

const PAGE_SIZE = 25;

type SessionPerformanceFilters = {
  sessionName: string;
  programName: string;
  status: string;
};

const DEFAULT_SESSION_PERFORMANCE_FILTERS: SessionPerformanceFilters = {
  sessionName: 'all',
  programName: 'all',
  status: 'all',
};

function SessionPerformanceFilterBar({
  filters,
  programNames,
  sessionNames,
  onChange,
  onReset,
}: {
  filters: SessionPerformanceFilters;
  programNames: string[];
  sessionNames: string[];
  onChange: (updates: Partial<SessionPerformanceFilters>) => void;
  onReset: () => void;
}) {
  const hasActiveFilters =
    filters.sessionName !== 'all' ||
    filters.programName !== 'all' ||
    filters.status !== 'all';

  return (
    <div className='mb-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4'>

      <Select value={filters.programName} onValueChange={value => onChange({ programName: value })}>
        <SelectTrigger className='w-full'>
          <SelectValue placeholder='All programs' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All programs</SelectItem>
          {programNames.map(programName => (
            <SelectItem key={programName} value={programName}>
              {programName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.sessionName} onValueChange={value => onChange({ sessionName: value })}>
        <SelectTrigger className='w-full'>
          <SelectValue placeholder='All sessions' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All sessions</SelectItem>
          {sessionNames.map(sessionName => (
            <SelectItem key={sessionName} value={sessionName}>
              {sessionName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.status} onValueChange={value => onChange({ status: value })}>
        <SelectTrigger className='w-full'>
          <SelectValue placeholder='All statuses' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All statuses</SelectItem>
          {ANALYTICS_STATUS_OPTIONS.map(status => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        type='button'
        variant='ghost'
        size='sm'
        onClick={onReset}
        disabled={!hasActiveFilters}
        className='w-full justify-center'
      >
        Reset filters
      </Button>
    </div>
  );
}

export function SessionTable() {
  const { sessions, isLoading } = useInstructorAnalyticsData();
  const sessionNames = useMemo(() => [...new Set(sessions.map(s => s.session))].sort(), [sessions]);
  const programNames = useMemo(() => [...new Set(sessions.map(s => s.program))].sort(), [sessions]);

  const [filters, setFilters] = useState<SessionPerformanceFilters>(
    DEFAULT_SESSION_PERFORMANCE_FILTERS
  );

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      const matchesSessionName = filters.sessionName === 'all' || s.session === filters.sessionName;
      const matchesProgramName = filters.programName === 'all' || s.program === filters.programName;
      const matchesStatus = filters.status === 'all' || s.status === filters.status;

      return matchesSessionName && matchesProgramName && matchesStatus;
    });
  }, [filters.programName, filters.sessionName, filters.status, sessions]);

  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(filteredSessions.length / PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [filters.programName, filters.sessionName, filters.status]);

  useEffect(() => {
    setPage(currentPage => Math.min(currentPage, Math.max(1, totalPages)));
  }, [totalPages]);

  const paginatedSessions = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;

    return filteredSessions.slice(start, end);
  }, [filteredSessions, page]);

  const startItem = filteredSessions.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;

  const endItem = Math.min(page * PAGE_SIZE, filteredSessions.length);

  const [visibleColumns, setVisibleColumns] = useState({
    program: true,
    session: true,
    date: true,
    location: true,
    participants: true,
    completion: true,
    satisfaction: true,
    trainingHours: true,
    status: true,
  });

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  const afterParticipantsColSpan = [
    visibleColumns.completion,
    visibleColumns.satisfaction,
    visibleColumns.trainingHours,
    visibleColumns.status,
  ].filter(Boolean).length;

  return (
    <div className='bg-card border-border rounded-xl border p-3 shadow-sm sm:p-4'>
      <h3 className='text-foreground mb-3 text-xs font-semibold sm:text-sm'>
        Session Performance Summary
      </h3>

      <SessionPerformanceFilterBar
        filters={filters}
        programNames={programNames}
        sessionNames={sessionNames}
        onChange={updates =>
          setFilters(current => ({
            ...current,
            ...updates,
          }))
        }
        onReset={() =>
          setFilters(DEFAULT_SESSION_PERFORMANCE_FILTERS)
        }
      />

      {isLoading ? (
        <div className='border-border/50 bg-muted/40 text-muted-foreground rounded-xl border p-8 text-center text-sm'>
          Loading session analytics...
        </div>
      ) : filteredSessions.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title='No sessions found'
          description='Your instructor sessions will appear here once they are scheduled or completed.'
          variant='card'
        />
      ) : (
        <>
          <div className='overflow-x-auto'>
            <div className='mb-4 flex justify-end'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' size='sm'>
                    Columns
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align='end'>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.location}
                    onCheckedChange={() => toggleColumn('location')}
                  >
                    Location
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.participants}
                    onCheckedChange={() => toggleColumn('participants')}
                  >
                    Participants
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.completion}
                    onCheckedChange={() => toggleColumn('completion')}
                  >
                    Completion Rate
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.satisfaction}
                    onCheckedChange={() => toggleColumn('satisfaction')}
                  >
                    Avg. Satisfaction
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.trainingHours}
                    onCheckedChange={() => toggleColumn('trainingHours')}
                  >
                    Training Hours
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.status}
                    onCheckedChange={() => toggleColumn('status')}
                  >
                    Status
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <table className='w-full min-w-[700px] text-xs'>
              <thead>
                <tr className='border-border border-b'>
                  <th className='text-muted-foreground px-2 py-2 text-left font-medium'>Program</th>

                  <th className='text-muted-foreground px-2 py-2 text-left font-medium'>
                    Session Name
                  </th>

                  <th className='text-muted-foreground px-2 py-2 text-left font-medium'>Date</th>

                  {visibleColumns.location && (
                    <th className='text-muted-foreground px-2 py-2 text-left font-medium'>
                      Location
                    </th>
                  )}

                  {visibleColumns.participants && (
                    <th
                      className='text-muted-foreground px-2 py-2 text-center font-medium'
                      colSpan={2}
                    >
                      Participants
                    </th>
                  )}

                  {visibleColumns.completion && (
                    <th className='text-muted-foreground px-2 py-2 text-left font-medium'>
                      Completion Rate
                    </th>
                  )}

                  {visibleColumns.satisfaction && (
                    <th className='text-muted-foreground px-2 py-2 text-left font-medium'>
                      Avg. Satisfaction
                    </th>
                  )}

                  {visibleColumns.trainingHours && (
                    <th className='text-muted-foreground px-2 py-2 text-left font-medium'>
                      Training Hours
                    </th>
                  )}

                  {visibleColumns.status && (
                    <th className='text-muted-foreground px-2 py-2 text-left font-medium'>
                      Status
                    </th>
                  )}
                </tr>

                <tr className='border-border/50 border-b'>
                  <th colSpan={3 + (visibleColumns.location ? 1 : 0)} />

                  {visibleColumns.participants && (
                    <>
                      <th className='text-muted-foreground px-2 py-1 text-center font-normal'>
                        Enrolled
                      </th>

                      <th className='text-muted-foreground px-2 py-1 text-center font-normal'>
                        Attended
                      </th>
                    </>
                  )}

                  <th colSpan={afterParticipantsColSpan} />
                </tr>
              </thead>

              <tbody>
                {paginatedSessions.map(s => (
                  <tr
                    key={s.id}
                    className='border-border/50 hover:bg-muted/10 border-b transition-colors'
                  >
                    <td className='px-2 py-2.5'>
                      <div className='line-clamp-2 max-w-[220px]'>{s.program}</div>
                    </td>

                    <td className='px-2 py-2.5 font-medium'>
                      <div className='line-clamp-2 max-w-[220px]'>{s.session}</div>
                    </td>

                    <td className='text-muted-foreground w-[120px] px-2 py-2.5'>
                      <div className='flex flex-col'>
                        <span>{s.date}</span>
                        <span className='text-muted-foreground/70 text-xs'>
                          ({s.totalHours} hours)
                        </span>
                      </div>
                    </td>

                    {visibleColumns.location && (
                      <td className='text-muted-foreground max-w-[120px] truncate px-2 py-2.5 whitespace-nowrap'>
                        {s.location}
                      </td>
                    )}

                    {visibleColumns.participants && (
                      <>
                        <td className='px-2 py-2.5 text-center'>{s.enrolled}</td>

                        <td className='px-2 py-2.5 text-center'>{s.attended}</td>
                      </>
                    )}

                    {visibleColumns.completion && (
                      <td className='px-2 py-2.5'>
                        <CompletionBar pct={s.completionRate} />
                      </td>
                    )}

                    {visibleColumns.satisfaction && (
                      <td className='px-2 py-2.5'>
                        <StarRating value={s.satisfaction} />
                      </td>
                    )}

                    {visibleColumns.trainingHours && (
                      <td className='px-2 py-2.5 text-center'>{s.trainingHours}</td>
                    )}

                    {visibleColumns.status && (
                      <td className='px-2 py-2.5'>
                        <StatusBadge status={s.status} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className='mt-3 flex flex-wrap items-center justify-between gap-2'>
            <span className='text-muted-foreground text-xs'>
              Showing {startItem} to {endItem} of {filteredSessions.length} sessions
            </span>
            <div className='flex items-center gap-1'>
              <Button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                <ChevronLeft />
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(Math.max(0, page - 3), Math.min(totalPages, page + 2))
                .map(pageNumber => (
                  <Button
                    key={pageNumber}
                    disabled={page !== pageNumber}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                ))}

              <Button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function SessionTableSummary() {
  const { sessions, isLoading } = useInstructorAnalyticsData();
  const sessionNames = useMemo(() => [...new Set(sessions.map(s => s.session))].sort(), [sessions]);
  const programNames = useMemo(() => [...new Set(sessions.map(s => s.program))].sort(), [sessions]);
  const [filters, setFilters] = useState<SessionPerformanceFilters>(
    DEFAULT_SESSION_PERFORMANCE_FILTERS
  );
  const [page, setPage] = useState(1);

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      const matchesSessionName = filters.sessionName === 'all' || s.session === filters.sessionName;
      const matchesProgramName = filters.programName === 'all' || s.program === filters.programName;
      const matchesStatus = filters.status === 'all' || s.status === filters.status;

      return matchesSessionName && matchesProgramName && matchesStatus;
    });
  }, [filters.programName, filters.sessionName, filters.status, sessions]);

  const totalPages = Math.ceil(filteredSessions.length / PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [filters.programName, filters.sessionName, filters.status]);

  useEffect(() => {
    setPage(currentPage => Math.min(currentPage, Math.max(1, totalPages)));
  }, [totalPages]);

  const paginatedSessions = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;

    return filteredSessions.slice(start, end);
  }, [filteredSessions, page]);

  const startItem = filteredSessions.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;

  const endItem = Math.min(page * PAGE_SIZE, filteredSessions.length);

  const [visibleColumns, setVisibleColumns] = useState({
    program: true,
    session: true,
    date: true,
    location: true,
    participants: true,
    completion: true,
    satisfaction: true,
    trainingHours: true,
    status: true,
  });

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  const afterParticipantsColSpan = [
    visibleColumns.completion,
    visibleColumns.satisfaction,
    visibleColumns.trainingHours,
    visibleColumns.status,
  ].filter(Boolean).length;

  return (
    <div className='bg-card border-border rounded-xl border p-3 shadow-sm sm:p-4'>
      <h3 className='text-foreground mb-3 text-xs font-semibold sm:text-sm'>
        Session Performance Summary
      </h3>

      <SessionPerformanceFilterBar
        filters={filters}
        programNames={programNames}
        sessionNames={sessionNames}
        onChange={updates =>
          setFilters(current => ({
            ...current,
            ...updates,
          }))
        }
        onReset={() =>
          setFilters(DEFAULT_SESSION_PERFORMANCE_FILTERS)
        }
      />

      {isLoading ? (
        <div className='border-border/50 bg-muted/40 text-muted-foreground rounded-xl border p-8 text-center text-sm'>
          Loading session analytics...
        </div>
      ) : filteredSessions.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title='No sessions found'
          description='Your instructor sessions will appear here once they are scheduled or completed.'
          variant='card'
        />
      ) : (
        <>
          <div className='overflow-x-auto'>
            <div className='mb-4 flex justify-end'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' size='sm'>
                    Columns
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align='end'>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.location}
                    onCheckedChange={() => toggleColumn('location')}
                  >
                    Location
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.participants}
                    onCheckedChange={() => toggleColumn('participants')}
                  >
                    Participants
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.completion}
                    onCheckedChange={() => toggleColumn('completion')}
                  >
                    Completion Rate
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.satisfaction}
                    onCheckedChange={() => toggleColumn('satisfaction')}
                  >
                    Avg. Satisfaction
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.trainingHours}
                    onCheckedChange={() => toggleColumn('trainingHours')}
                  >
                    Training Hours
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.status}
                    onCheckedChange={() => toggleColumn('status')}
                  >
                    Status
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <table className='w-full min-w-[700px] text-xs'>
              <thead>
                <tr className='border-border border-b'>
                  <th className='text-muted-foreground px-2 py-2 text-left font-medium'>Program</th>

                  <th className='text-muted-foreground px-2 py-2 text-left font-medium'>
                    Session Name
                  </th>

                  <th className='text-muted-foreground px-2 py-2 text-left font-medium'>Date</th>

                  {visibleColumns.location && (
                    <th className='text-muted-foreground px-2 py-2 text-left font-medium'>
                      Location
                    </th>
                  )}

                  {visibleColumns.participants && (
                    <th
                      className='text-muted-foreground px-2 py-2 text-center font-medium'
                      colSpan={2}
                    >
                      Participants
                    </th>
                  )}

                  {visibleColumns.completion && (
                    <th className='text-muted-foreground px-2 py-2 text-left font-medium'>
                      Completion Rate
                    </th>
                  )}

                  {visibleColumns.satisfaction && (
                    <th className='text-muted-foreground px-2 py-2 text-left font-medium'>
                      Avg. Satisfaction
                    </th>
                  )}

                  {visibleColumns.trainingHours && (
                    <th className='text-muted-foreground px-2 py-2 text-left font-medium'>
                      Training Hours
                    </th>
                  )}

                  {visibleColumns.status && (
                    <th className='text-muted-foreground px-2 py-2 text-left font-medium'>
                      Status
                    </th>
                  )}
                </tr>

                <tr className='border-border/50 border-b'>
                  <th colSpan={3 + (visibleColumns.location ? 1 : 0)} />

                  {visibleColumns.participants && (
                    <>
                      <th className='text-muted-foreground px-2 py-1 text-center font-normal'>
                        Enrolled
                      </th>

                      <th className='text-muted-foreground px-2 py-1 text-center font-normal'>
                        Attended
                      </th>
                    </>
                  )}

                  <th colSpan={afterParticipantsColSpan} />
                </tr>
              </thead>

              <tbody>
                {paginatedSessions.map(s => (
                  <tr
                    key={s.id}
                    className='border-border/50 hover:bg-muted/10 border-b transition-colors'
                  >
                    <td className='px-2 py-2.5'>
                      <div className='line-clamp-2 max-w-[220px]'>{s.program}</div>
                    </td>

                    <td className='px-2 py-2.5 font-medium'>
                      <div className='line-clamp-2 max-w-[220px]'>{s.session}</div>
                    </td>

                    <td className='text-muted-foreground w-[120px] px-2 py-2.5'>
                      <div className='flex flex-col'>
                        <span>{s.date}</span>
                        <span className='text-muted-foreground/70 text-xs'>
                          ({s.totalHours} hours)
                        </span>
                      </div>
                    </td>

                    {visibleColumns.location && (
                      <td className='text-muted-foreground max-w-[120px] truncate px-2 py-2.5 whitespace-nowrap'>
                        {s.location}
                      </td>
                    )}

                    {visibleColumns.participants && (
                      <>
                        <td className='px-2 py-2.5 text-center'>{s.enrolled}</td>

                        <td className='px-2 py-2.5 text-center'>{s.attended}</td>
                      </>
                    )}

                    {visibleColumns.completion && (
                      <td className='px-2 py-2.5'>
                        <CompletionBar pct={s.completionRate} />
                      </td>
                    )}

                    {visibleColumns.satisfaction && (
                      <td className='px-2 py-2.5'>
                        <StarRating value={s.satisfaction} />
                      </td>
                    )}

                    {visibleColumns.trainingHours && (
                      <td className='px-2 py-2.5 text-center'>{s.trainingHours} ({s.actualTrainingHours})</td>
                    )}

                    {visibleColumns.status && (
                      <td className='px-2 py-2.5'>
                        <StatusBadge status={s.status} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className='mt-3 flex flex-wrap items-center justify-between gap-2'>
            <span className='text-muted-foreground text-xs'>
              Showing {startItem} to {endItem} of {filteredSessions.length} sessions
            </span>
            <div className='flex items-center gap-1'>
              <Button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                <ChevronLeft />
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(Math.max(0, page - 3), Math.min(totalPages, page + 2))
                .map(pageNumber => (
                  <Button
                    key={pageNumber}
                    disabled={page !== pageNumber}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                ))}

              <Button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PagBtn({
  label,
  active,
  disabled,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      className={`flex h-6 w-6 items-center justify-center rounded text-xs transition-colors ${active
        ? 'bg-primary/20 text-card-foreground'
        : disabled
          ? 'text-muted-foreground cursor-default'
          : 'text-foreground hover:bg-muted/10'
        }`}
    >
      {label}
    </button>
  );
}
