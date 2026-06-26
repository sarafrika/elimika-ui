"use client";

import { EmptyState } from '@/components/ui/empty-state';
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from 'react';
import { Button } from '../../../../../components/ui/button';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '../../../../../components/ui/dropdown-menu';
import { useInstructorAnalyticsData } from "./useInstructorAnalyticsData";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Completed: "bg-success/20 text-success border border-success/40",
    Ongoing: "bg-primary/20 text-primary border border-primary/40",
    Upcoming: "bg-muted/70 text-primary/30 border border-muted/40",
    Cancelled: "bg-destructive/20 text-destructive border border-destructive/40",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 text-center rounded-md text-xs font-medium ${styles[status] ?? styles["Upcoming"]
        }`}
    >
      {status}
    </span>
  );
}

function CompletionBar({ pct }: { pct: number }) {
  const color =
    pct >= 90
      ? "bg-success"
      : pct >= 70
        ? "bg-success/70"
        : pct >= 50
          ? "bg-warning"
          : "bg-destructive";
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 rounded-full bg-muted/20">
        <div
          className={`${color} h-1.5 rounded-full`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-foreground">{pct}%</span>
    </div>
  );
}

function StarRating({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-xs font-medium text-muted-foreground">N/A</span>;
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-warning text-xs">★</span>
      <span className="text-xs font-medium text-foreground">{value}</span>
    </div>
  );
}

const PAGE_SIZE = 25;


export function SessionTable() {
  const { sessions, isLoading } = useInstructorAnalyticsData();

  const [search, setSearch] = useState("");
  const [selectedInstructor, setSelectedInstructor] = useState("all");

  const instructors = useMemo(() => {
    return [...new Set(sessions.map((s) => s.instructor))];
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchesSearch =
        s.session.toLowerCase().includes(search.toLowerCase()) ||
        s.program.toLowerCase().includes(search.toLowerCase()) ||
        s.instructor.toLowerCase().includes(search.toLowerCase());

      const matchesInstructor =
        selectedInstructor === "all" || s.instructor === selectedInstructor;

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

  const startItem =
    sessions.length === 0
      ? 0
      : (page - 1) * PAGE_SIZE + 1;

  const endItem = Math.min(
    page * PAGE_SIZE,
    sessions.length
  );


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
    <div className="bg-card rounded-xl border border-border p-3 shadow-sm sm:p-4">
      <h3 className="mb-3 text-xs font-semibold text-foreground sm:text-sm">
        Session Performance Summary
      </h3>


      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search sessions, programs, instructors..."
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground sm:w-1/2"
        />

        {/* Instructor filter */}
        <select
          value={selectedInstructor}
          onChange={(e) => setSelectedInstructor(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground sm:w-48"
        >
          <option value="all">All Instructors</option>
          {instructors.map((ins) => (
            <option key={ins} value={ins}>
              {ins}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-border/50 bg-muted/40 p-8 text-center text-sm text-muted-foreground">
          Loading session analytics...
        </div>
      ) : filteredSessions.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No sessions found"
          description="Your instructor sessions will appear here once they are scheduled or completed."
          variant="card"
        />
      ) : (
        <>
          <div className="overflow-x-auto">

            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Instructors:
              </span>

              {[...new Set(filteredSessions.map((s) => s.instructor))].map((instructor) => (
                <span
                  key={instructor}
                  className="rounded-full bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-sm ring-1 ring-border"
                >
                  {instructor}
                </span>
              ))}
            </div>


            <div className="flex justify-end mb-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Columns
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.location}
                    onCheckedChange={() => toggleColumn("location")}
                  >
                    Location
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.participants}
                    onCheckedChange={() => toggleColumn("participants")}
                  >
                    Participants
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.completion}
                    onCheckedChange={() => toggleColumn("completion")}
                  >
                    Completion Rate
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.satisfaction}
                    onCheckedChange={() => toggleColumn("satisfaction")}
                  >
                    Avg. Satisfaction
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.trainingHours}
                    onCheckedChange={() => toggleColumn("trainingHours")}
                  >
                    Training Hours
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.status}
                    onCheckedChange={() => toggleColumn("status")}
                  >
                    Status
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <table className="w-full min-w-[700px] text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                    Program
                  </th>

                  <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                    Session Name
                  </th>

                  <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                    Date
                  </th>

                  {visibleColumns.location && (
                    <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                      Location
                    </th>
                  )}

                  {visibleColumns.participants && (
                    <th
                      className="px-2 py-2 text-center font-medium text-muted-foreground"
                      colSpan={2}
                    >
                      Participants
                    </th>
                  )}

                  {visibleColumns.completion && (
                    <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                      Completion Rate
                    </th>
                  )}

                  {visibleColumns.satisfaction && (
                    <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                      Avg. Satisfaction
                    </th>
                  )}

                  {visibleColumns.trainingHours && (
                    <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                      Training Hours
                    </th>
                  )}

                  {visibleColumns.status && (
                    <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                      Status
                    </th>
                  )}
                </tr>

                <tr className="border-b border-border/50">
                  <th colSpan={3 + (visibleColumns.location ? 1 : 0)} />

                  {visibleColumns.participants && (
                    <>
                      <th className="px-2 py-1 text-center text-muted-foreground font-normal">
                        Enrolled
                      </th>

                      <th className="px-2 py-1 text-center text-muted-foreground font-normal">
                        Attended
                      </th>
                    </>
                  )}

                  <th colSpan={afterParticipantsColSpan} />
                </tr>
              </thead>

              <tbody>
                {paginatedSessions.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-border/50 hover:bg-muted/10 transition-colors"
                  >
                    <td className="px-2 py-2.5">
                      <div className="max-w-[220px] line-clamp-2">
                        {s.program}
                      </div>
                    </td>

                    <td className="px-2 py-2.5 font-medium">
                      <div className="max-w-[220px] line-clamp-2">
                        {s.session}
                      </div>
                    </td>

                    <td className="px-2 py-2.5 text-muted-foreground w-[120px]">
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
                      <td className="px-2 py-2.5 whitespace-nowrap text-muted-foreground max-w-[120px] truncate">
                        {s.location}
                      </td>
                    )}

                    {visibleColumns.participants && (
                      <>
                        <td className="px-2 py-2.5 text-center">
                          {s.enrolled}
                        </td>

                        <td className="px-2 py-2.5 text-center">
                          {s.attended}
                        </td>
                      </>
                    )}

                    {visibleColumns.completion && (
                      <td className="px-2 py-2.5">
                        <CompletionBar pct={s.completionRate} />
                      </td>
                    )}

                    {visibleColumns.satisfaction && (
                      <td className="px-2 py-2.5">
                        <StarRating value={s.satisfaction} />
                      </td>
                    )}

                    {visibleColumns.trainingHours && (
                      <td className="px-2 py-2.5 text-center">
                        {s.totalHours}
                      </td>
                    )}

                    {visibleColumns.status && (
                      <td className="px-2 py-2.5">
                        <StatusBadge status={s.status} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              Showing {startItem} to {endItem} of {sessions.length} sessions
            </span>
            <div className="flex items-center gap-1">
              <Button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft />
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(
                  Math.max(0, page - 3),
                  Math.min(totalPages, page + 2)
                )
                .map((pageNumber) => (
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
                onClick={() =>
                  setPage((p) => Math.min(totalPages, p + 1))
                }
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

  const startItem =
    sessions.length === 0
      ? 0
      : (page - 1) * PAGE_SIZE + 1;

  const endItem = Math.min(
    page * PAGE_SIZE,
    sessions.length
  );

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
    <div className="bg-card rounded-xl border border-border p-3 shadow-sm sm:p-4">
      <h3 className="mb-3 text-xs font-semibold text-foreground sm:text-sm">
        Session Performance Summary
      </h3>

      {isLoading ? (
        <div className="rounded-xl border border-border/50 bg-muted/40 p-8 text-center text-sm text-muted-foreground">
          Loading session analytics...
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No sessions found"
          description="Your instructor sessions will appear here once they are scheduled or completed."
          variant="card"
        />
      ) : (
        <>
          <div className="overflow-x-auto">

            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Instructors:
              </span>

              {[...new Set(sessions.map((s) => s.instructor))].map((instructor) => (
                <span
                  key={instructor}
                  className="rounded-full bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-sm ring-1 ring-border"
                >
                  {instructor}
                </span>
              ))}
            </div>

            <div className="flex justify-end mb-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Columns
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.location}
                    onCheckedChange={() => toggleColumn("location")}
                  >
                    Location
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.participants}
                    onCheckedChange={() => toggleColumn("participants")}
                  >
                    Participants
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.completion}
                    onCheckedChange={() => toggleColumn("completion")}
                  >
                    Completion Rate
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.satisfaction}
                    onCheckedChange={() => toggleColumn("satisfaction")}
                  >
                    Avg. Satisfaction
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.trainingHours}
                    onCheckedChange={() => toggleColumn("trainingHours")}
                  >
                    Training Hours
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.status}
                    onCheckedChange={() => toggleColumn("status")}
                  >
                    Status
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <table className="w-full min-w-[700px] text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                    Program
                  </th>

                  <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                    Session Name
                  </th>

                  <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                    Date
                  </th>

                  {visibleColumns.location && (
                    <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                      Location
                    </th>
                  )}

                  {visibleColumns.participants && (
                    <th
                      className="px-2 py-2 text-center font-medium text-muted-foreground"
                      colSpan={2}
                    >
                      Participants
                    </th>
                  )}

                  {visibleColumns.completion && (
                    <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                      Completion Rate
                    </th>
                  )}

                  {visibleColumns.satisfaction && (
                    <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                      Avg. Satisfaction
                    </th>
                  )}

                  {visibleColumns.trainingHours && (
                    <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                      Training Hours
                    </th>
                  )}

                  {visibleColumns.status && (
                    <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                      Status
                    </th>
                  )}
                </tr>

                <tr className="border-b border-border/50">
                  <th colSpan={3 + (visibleColumns.location ? 1 : 0)} />

                  {visibleColumns.participants && (
                    <>
                      <th className="px-2 py-1 text-center text-muted-foreground font-normal">
                        Enrolled
                      </th>

                      <th className="px-2 py-1 text-center text-muted-foreground font-normal">
                        Attended
                      </th>
                    </>
                  )}

                  <th colSpan={afterParticipantsColSpan} />
                </tr>
              </thead>

              <tbody>
                {paginatedSessions.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-border/50 hover:bg-muted/10 transition-colors"
                  >
                    <td className="px-2 py-2.5">
                      <div className="max-w-[220px] line-clamp-2">
                        {s.program}
                      </div>
                    </td>

                    <td className="px-2 py-2.5 font-medium">
                      <div className="max-w-[220px] line-clamp-2">
                        {s.session}
                      </div>
                    </td>

                    <td className="px-2 py-2.5 text-muted-foreground w-[120px]">
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
                      <td className="px-2 py-2.5 whitespace-nowrap text-muted-foreground max-w-[120px] truncate">
                        {s.location}
                      </td>
                    )}

                    {visibleColumns.participants && (
                      <>
                        <td className="px-2 py-2.5 text-center">
                          {s.enrolled}
                        </td>

                        <td className="px-2 py-2.5 text-center">
                          {s.attended}
                        </td>
                      </>
                    )}

                    {visibleColumns.completion && (
                      <td className="px-2 py-2.5">
                        <CompletionBar pct={s.completionRate} />
                      </td>
                    )}

                    {visibleColumns.satisfaction && (
                      <td className="px-2 py-2.5">
                        <StarRating value={s.satisfaction} />
                      </td>
                    )}

                    {visibleColumns.trainingHours && (
                      <td className="px-2 py-2.5 text-center">
                        {s.totalHours}
                      </td>
                    )}

                    {visibleColumns.status && (
                      <td className="px-2 py-2.5">
                        <StatusBadge status={s.status} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              Showing {startItem} to {endItem} of {sessions.length} sessions
            </span>
            <div className="flex items-center gap-1">
              <Button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft />
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(
                  Math.max(0, page - 3),
                  Math.min(totalPages, page + 2)
                )
                .map((pageNumber) => (
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
                onClick={() =>
                  setPage((p) => Math.min(totalPages, p + 1))
                }
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
        ? "bg-primary/20 text-card-foreground"
        : disabled
          ? "cursor-default text-muted-foreground"
          : "text-foreground hover:bg-muted/10"
        }`}
    >
      {label}
    </button>
  );
}


