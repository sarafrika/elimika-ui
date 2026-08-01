'use client';

import { EmptyState } from '@/components/ui/empty-state';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '../../../../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../../../../../components/ui/dropdown-menu';
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
      className={`inline-block rounded-md px-2 py-0.5 text-center text-xs font-medium ${
        styles[status] ?? styles['Upcoming']
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
    <div className='flex items-center gap-1.5'>
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

export function SessionTable() {
  const { sessions, isLoading } = useInstructorAnalyticsData();

  const [search, setSearch] = useState('');
  const [selectedInstructor, setSelectedInstructor] = useState('all');

  const instructors = useMemo(() => {
    return [...new Set(sessions.map(s => s.instructor))];
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      const matchesSearch =
        s.session.toLowerCase().includes(search.toLowerCase()) ||
        s.program.toLowerCase().includes(search.toLowerCase()) ||
        s.instructor.toLowerCase().includes(search.toLowerCase());

      const matchesInstructor = selectedInstructor === 'all' || s.instructor === selectedInstructor;

      return matchesSearch && matchesInstructor;
    });
  }, [sessions, search, selectedInstructor]);

  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(sessions.length / PAGE_SIZE);

  const paginatedSessions = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;

    return filteredSessions.slice(start, end);
  }, [sessions, page]);

  const startItem = sessions.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;

  const endItem = Math.min(page * PAGE_SIZE, sessions.length);

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

      <div className='mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder='Search sessions, programs, instructors...'
          className='border-border bg-background text-foreground placeholder:text-muted-foreground w-full rounded-md border px-3 py-2 text-xs sm:w-1/2'
        />

        {/* Instructor filter */}
        <select
          value={selectedInstructor}
          onChange={e => setSelectedInstructor(e.target.value)}
          className='border-border bg-background text-foreground w-full rounded-md border px-3 py-2 text-xs sm:w-48'
        >
          <option value='all'>All Instructors</option>
          {instructors.map(ins => (
            <option key={ins} value={ins}>
              {ins}
            </option>
          ))}
        </select>
      </div>

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
            <div className='border-border bg-muted/20 mb-4 flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2'>
              <span className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                Instructors:
              </span>

              {[...new Set(filteredSessions.map(s => s.instructor))].map(instructor => (
                <span
                  key={instructor}
                  className='bg-background text-foreground ring-border rounded-full px-2.5 py-1 text-xs font-medium shadow-sm ring-1'
                >
                  {instructor}
                </span>
              ))}
            </div>

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
                      {/* {(() => {
                        const [startDate, endDate] = s.dateRange.split(" - ");

                        return (
                          <>
                            <div>{startDate}</div>
                            {endDate && <div>{endDate}</div>}
                          </>
                        );
                      })()} */}
                      sdflsdf
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
                      <td className='px-2 py-2.5 text-center'>{s.totalHours}</td>
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
              Showing {startItem} to {endItem} of {sessions.length} sessions
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
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(sessions.length / PAGE_SIZE);

  const paginatedSessions = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;

    return sessions.slice(start, end);
  }, [sessions, page]);

  const startItem = sessions.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;

  const endItem = Math.min(page * PAGE_SIZE, sessions.length);

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

      {isLoading ? (
        <div className='border-border/50 bg-muted/40 text-muted-foreground rounded-xl border p-8 text-center text-sm'>
          Loading session analytics...
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title='No sessions found'
          description='Your instructor sessions will appear here once they are scheduled or completed.'
          variant='card'
        />
      ) : (
        <>
          <div className='overflow-x-auto'>
            <div className='border-border bg-muted/20 mb-4 flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2'>
              <span className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                Instructors:
              </span>

              {[...new Set(sessions.map(s => s.instructor))].map(instructor => (
                <span
                  key={instructor}
                  className='bg-background text-foreground ring-border rounded-full px-2.5 py-1 text-xs font-medium shadow-sm ring-1'
                >
                  {instructor}
                </span>
              ))}
            </div>

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
                      {/* {(() => {
                        const [startDate, endDate] = s.dateRange.split(" - ");

                        return (
                          <>
                            <div>{startDate}</div>
                            {endDate && <div>{endDate}</div>}
                          </>
                        );
                      })()} */}
                      sfd
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
                      <td className='px-2 py-2.5 text-center'>{s.totalHours}</td>
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
              Showing {startItem} to {endItem} of {sessions.length} sessions
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
      className={`flex h-6 w-6 items-center justify-center rounded text-xs transition-colors ${
        active
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
