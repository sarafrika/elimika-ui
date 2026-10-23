'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
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
import { cn } from '@/lib/utils';
import {
  BarChart3,
  ClipboardList,
  Download,
  FileSpreadsheet,
  Home,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useDeferredValue, useMemo, useState } from 'react';
import {
  assessmentStatusLabels,
  type AssessmentResultRow,
  type AssessmentRole,
  type AssessmentRow,
  type AssessmentStatus,
} from './assessment-list-data';
import { AssessmentCompetenciesTab } from './AssessmentCompetenciesTab';
import { StudentCredentialStats } from './StudentCredentialStats';
import { useAssessmentListData } from './use-assessment-list-data';
import { useResultStudents } from './use-result-students';

const tabs = [
  { value: 'overview', label: 'Overview', icon: Home },
  { value: 'all', label: 'All Assessments', icon: ClipboardList },
  { value: 'results', label: 'Results', icon: FileSpreadsheet },
  { value: 'competencies', label: 'Competencies', icon: Sparkles },
] as const;
type AssessmentTab = (typeof tabs)[number]['value'];

const statusTone: Record<AssessmentStatus, string> = {
  upcoming: 'bg-info/10 text-info',
  pending: 'bg-muted text-muted-foreground',
  'in-progress': 'bg-primary/10 text-primary',
  'awaiting-grading': 'bg-warning/10 text-warning-foreground',
  completed: 'bg-success/10 text-success',
  overdue: 'bg-destructive/10 text-destructive',
  returned: 'bg-warning/10 text-warning-foreground',
};

function dateLabel(value: number | null) {
  return value == null
    ? 'No deadline'
    : new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(value);
}

function Score({ value }: { value: number | null }) {
  if (value == null) return <span className='text-muted-foreground'>—</span>;
  return (
    <div className='min-w-24 space-y-1'>
      <span className='text-xs font-medium tabular-nums'>{Math.round(value * 10) / 10}%</span>
      <Progress
        value={Math.max(0, Math.min(value, 100))}
        className='h-1.5'
        aria-label={`Score: ${Math.round(value)}%`}
      />
    </div>
  );
}

function AssessmentTable({ rows, role }: { rows: AssessmentRow[]; role: AssessmentRole }) {
  return (
    <div className='border-border bg-card min-w-0 overflow-hidden rounded-xl border'>
      <Table className='min-w-[980px]' aria-label='Issued assessments'>
        <TableHeader>
          <TableRow>
            <TableHead className='pl-5'>Assessment</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Instructor</TableHead>
            {role === 'instructor' && <TableHead className='text-right'>Learners</TableHead>}
            <TableHead>Due / Date</TableHead>
            <TableHead>{role === 'instructor' ? 'Avg. Score' : 'Your Score'}</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className='pr-5 text-right'>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(row => (
            <TableRow key={row.id}>
              <TableCell className='max-w-72 py-4 pl-5 whitespace-normal'>
                <Link
                  href={row.href}
                  className='text-foreground hover:text-primary font-medium hover:underline'
                >
                  {row.title}
                </Link>
                <p className='text-muted-foreground mt-1 text-xs'>
                  {row.kind === 'quiz'
                    ? 'Quiz · Automatically graded'
                    : 'Assignment · Instructor graded'}
                </p>
              </TableCell>
              <TableCell className='max-w-48 whitespace-normal'>
                {row.classMeta.courseTitle}
              </TableCell>
              <TableCell>
                <Badge variant='secondary' className='max-w-48 whitespace-normal'>
                  {row.classMeta.title}
                </Badge>
              </TableCell>
              <TableCell className='max-w-40 whitespace-normal'>{row.instructorName}</TableCell>
              {role === 'instructor' && (
                <TableCell className='text-right tabular-nums'>
                  {row.classMeta.learners ?? '—'}
                </TableCell>
              )}
              <TableCell>{dateLabel(row.dueAt)}</TableCell>
              <TableCell>
                <Score value={row.percentage} />
              </TableCell>
              <TableCell>
                <Badge variant='secondary' className={statusTone[row.status]}>
                  {assessmentStatusLabels[row.status]}
                </Badge>
              </TableCell>
              <TableCell className='pr-5 text-right'>
                <Button asChild variant='outline' size='sm'>
                  <Link href={row.href}>
                    {role === 'instructor'
                      ? row.kind === 'quiz'
                        ? 'View results'
                        : 'View submissions'
                      : row.status === 'completed'
                        ? 'View result'
                        : 'Open assessment'}
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ResultsTable({
  rows,
  names,
  avatars,
  loadingNames,
  role,
}: {
  rows: AssessmentResultRow[];
  names: Record<string, string>;
  avatars: Record<string, string | undefined>;
  loadingNames: boolean;
  role: AssessmentRole;
}) {
  return (
    <div className='border-border bg-card min-w-0 overflow-hidden rounded-xl border'>
      <Table className='min-w-[1040px]' aria-label='Student assessment results'>
        <TableHeader>
          <TableRow>
            <TableHead className='pl-5'>Student</TableHead>
            <TableHead>Assessment</TableHead>
            <TableHead>Class / Course</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Result</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className='pr-5 text-right'>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(row => (
            <TableRow key={row.id}>
              <TableCell className='max-w-48 py-4 pl-5 whitespace-normal'>
                <div className='flex items-center gap-3'>
                  <Avatar className='size-9'>
                    <AvatarImage
                      src={avatars[row.enrollmentUuid]}
                      alt={`${names[row.enrollmentUuid] || 'Student'} avatar`}
                    />
                    <AvatarFallback className='text-xs'>
                      {names[row.enrollmentUuid]
                        ?.split(/\s+/)
                        .filter(Boolean)
                        .slice(0, 2)
                        .map(part => part[0])
                        .join('')
                        .toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className='min-w-0'>
                    {names[row.enrollmentUuid] ? (
                      <p className='font-medium'>{names[row.enrollmentUuid]}</p>
                    ) : loadingNames ? (
                      <Skeleton className='h-4 w-28' />
                    ) : (
                      <p className='text-muted-foreground text-xs'>Name unavailable</p>
                    )}
                    <p className='text-muted-foreground mt-1 text-xs'>
                      Enrollment {row.enrollmentUuid.slice(0, 8)}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className='max-w-64 whitespace-normal'>
                <Link href={row.href} className='hover:text-primary font-medium hover:underline'>
                  {row.assessment.title}
                </Link>
                <p className='text-muted-foreground mt-1 text-xs'>
                  {row.assessment.kind === 'quiz' ? 'Quiz · Automatically graded' : 'Assignment'}
                </p>
              </TableCell>
              <TableCell className='max-w-48 whitespace-normal'>
                <p className='font-bold'>{row.assessment.classMeta.title}</p>
                <p className='text-muted-foreground mt-1 text-xs'>
                  {row.assessment.classMeta.courseTitle}
                </p>
              </TableCell>
              <TableCell>{row.submittedAt == null ? '—' : dateLabel(row.submittedAt)}</TableCell>
              <TableCell className='tabular-nums'>
                <div className='space-y-1'>
                  {row.score != null && (
                    <p className='text-muted-foreground text-xs'>
                      {row.maxScore == null ? row.score : `${row.score} / ${row.maxScore}`}
                    </p>
                  )}
                  <Score value={row.percentage} />
                </div>
              </TableCell>
              <TableCell className='max-w-48 whitespace-normal'>
                {row.grade ? (
                  <Badge variant='secondary' className='whitespace-normal'>
                    {row.grade}
                  </Badge>
                ) : (
                  <span className='text-muted-foreground text-xs'>
                    {row.status === 'awaiting-grading' ? 'Awaiting grading' : 'Band unavailable'}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant='secondary' className={statusTone[row.status]}>
                  {assessmentStatusLabels[row.status]}
                </Badge>
              </TableCell>
              <TableCell className='pr-5 text-right'>
                <Button asChild variant='outline' size='sm'>
                  <Link href={row.href}>
                    {role === 'instructor' && row.assessment.kind === 'assignment'
                      ? 'Review submission'
                      : 'View result'}
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className='bg-card h-9 w-full min-w-0'>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value='all'>{label}: All</SelectItem>
        {options.map(option => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function downloadCsv(data: Array<Array<string | number | null>>, fileName: string) {
  const cell = (value: string | number | null) => {
    // Keep spreadsheet formula prefixes inert when an assessment title is user authored.
    const text = String(value ?? '');
    return `"${(/^[=+\-@\t\r]/.test(text) ? `'${text}` : text).replaceAll('"', '""')}"`;
  };
  const content = data.map(row => row.map(cell).join(',')).join('\r\n');
  const url = URL.createObjectURL(
    new Blob(['\uFEFF', content], { type: 'text/csv;charset=utf-8;' })
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function exportAssessments(rows: AssessmentRow[], role: AssessmentRole) {
  downloadCsv(
    [
      [
        'Assessment',
        'Type',
        'Course',
        'Class',
        'Instructor',
        'Due',
        role === 'instructor' ? 'Average score (%)' : 'Your score (%)',
        'Status',
      ],
      ...rows.map(row => [
        row.title,
        row.kind,
        row.classMeta.courseTitle,
        row.classMeta.title,
        row.instructorName,
        dateLabel(row.dueAt),
        row.percentage,
        assessmentStatusLabels[row.status],
      ]),
    ],
    'assessments.csv'
  );
}

function exportResults(rows: AssessmentResultRow[], names: Record<string, string>) {
  downloadCsv(
    [
      [
        'Student',
        'Enrollment',
        'Assessment',
        'Type',
        'Course',
        'Class',
        'Submitted',
        'Score',
        'Max score',
        'Percentage',
        'Result',
        'Status',
      ],
      ...rows.map(row => [
        names[row.enrollmentUuid] || '',
        row.enrollmentUuid,
        row.assessment.title,
        row.assessment.kind,
        row.assessment.classMeta.courseTitle,
        row.assessment.classMeta.title,
        row.submittedAt == null ? '' : dateLabel(row.submittedAt),
        row.score,
        row.maxScore,
        row.percentage,
        row.grade,
        assessmentStatusLabels[row.status],
      ]),
    ],
    'assessment-results.csv'
  );
}

function StudentAssessmentList({ role }: { role: AssessmentRole }) {
  const { rows, resultRows, isLoading, isError, retry } = useAssessmentListData(role);
  const [tab, setTab] = useState<AssessmentTab>('overview');
  const [search, setSearch] = useState('');
  const query = useDeferredValue(search.trim().toLowerCase());
  const [course, setCourse] = useState('all');
  const [classId, setClassId] = useState('all');
  const [instructor, setInstructor] = useState('all');
  const [kind, setKind] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const options = useMemo(() => {
    const collect = (
      getValue: (row: AssessmentRow) => string,
      getLabel: (row: AssessmentRow) => string
    ) =>
      [
        ...new Map(
          rows
            .filter(row => getValue(row))
            .map(row => [getValue(row), { value: getValue(row), label: getLabel(row) }])
        ).values(),
      ].sort((a, b) => a.label.localeCompare(b.label));
    return {
      courses: collect(
        row => row.classMeta.courseUuid,
        row => row.classMeta.courseTitle
      ),
      classes: collect(
        row => row.classMeta.uuid,
        row => row.classMeta.title
      ),
      instructors: collect(
        row => row.instructorUuid,
        row => row.instructorName
      ),
    };
  }, [rows]);
  const filtered = useMemo(
    () =>
      rows
        .filter(
          row =>
            (course === 'all' || row.classMeta.courseUuid === course) &&
            (classId === 'all' || row.classMeta.uuid === classId) &&
            // (instructor === 'all' || row.instructorUuid === instructor) &&
            (kind === 'all' || row.kind === kind) &&
            (status === 'all' || row.status === status) &&
            (!query ||
              [
                row.title,
                row.classMeta.courseTitle,
                row.classMeta.title,
                row.instructorName,
                row.kind,
              ]
                .join(' ')
                .toLowerCase()
                .includes(query))
        )
        .sort((a, b) => b.issuedAt - a.issuedAt || a.title.localeCompare(b.title)),
    [rows, course, classId, instructor, kind, status, tab, query]
  );
  const filteredResults = useMemo(
    () =>
      resultRows.filter(row => {
        const assessment = row.assessment;
        return (
          (course === 'all' || assessment.classMeta.courseUuid === course) &&
          (classId === 'all' || assessment.classMeta.uuid === classId) &&
          (kind === 'all' || assessment.kind === kind) &&
          (status === 'all' || row.status === status) &&
          (!query ||
            [
              assessment.title,
              assessment.classMeta.courseTitle,
              assessment.classMeta.title,
              assessment.instructorName,
              assessment.kind,
            ]
              .join(' ')
              .toLowerCase()
              .includes(query))
        );
      }),
    [resultRows, course, classId, kind, status, query]
  );
  const rowCount = tab === 'results' ? filteredResults.length : filtered.length;
  const totalPages = Math.max(1, Math.ceil(rowCount / pageSize));
  const currentPage = Math.min(page, totalPages);
  const shownRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const shownResults = useMemo(
    () =>
      tab === 'results'
        ? filteredResults.slice((currentPage - 1) * pageSize, currentPage * pageSize)
        : [],
    [tab, filteredResults, currentPage]
  );
  const resultStudents = useResultStudents(shownResults, role);
  const metrics = useMemo(() => {
    const scored = rows.flatMap(row => (row.percentage == null ? [] : [row.percentage]));
    return [
      { label: 'Total Assessments', value: rows.length, accent: 'border-l-primary' },
      {
        label: 'Quizzes',
        value: rows.filter(row => row.kind === 'quiz').length,
        accent: 'border-l-info',
      },
      {
        label: 'Assignments',
        value: rows.filter(row => row.kind === 'assignment').length,
        accent: 'border-l-primary',
      },
      {
        label: 'Awaiting Grading',
        value: rows.filter(row => row.status === 'awaiting-grading').length,
        accent: 'border-l-warning',
      },
      {
        label: 'Completed',
        value: rows.filter(row => row.status === 'completed').length,
        accent: 'border-l-success',
      },
      {
        label: 'Overdue',
        value: rows.filter(row => row.status === 'overdue').length,
        accent: 'border-l-destructive',
      },
      {
        label: 'Average Score',
        value: scored.length
          ? `${Math.round(scored.reduce((a, b) => a + b, 0) / scored.length)}%`
          : '—',
        accent: 'border-l-info',
      },
    ];
  }, [rows]);
  const hasFilters =
    Boolean(search) || [course, classId, instructor, kind, status].some(value => value !== 'all');
  const changeFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };
  const resetFilters = () => {
    setSearch('');
    setCourse('all');
    setClassId('all');
    setInstructor('all');
    setKind('all');
    setStatus('all');
    setPage(1);
  };

  const filters = (
    <div className='space-y-3'>
      <div className='relative'>
        <Search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
        <Input
          type='search'
          value={search}
          onChange={event => changeFilter(setSearch)(event.target.value)}
          aria-label='Search assessments'
          placeholder='Search assessments, courses, classes or instructors'
          className='bg-card h-10 pl-9'
        />
      </div>
      <div className='grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5'>
        <FilterSelect
          label='Course'
          value={course}
          onChange={changeFilter(setCourse)}
          options={options.courses}
        />
        <FilterSelect
          label='Class'
          value={classId}
          onChange={changeFilter(setClassId)}
          options={options.classes}
        />
        {/* <FilterSelect
                label='Instructor'
                value={instructor}
                onChange={changeFilter(setInstructor)}
                options={options.instructors}
              /> */}
        <FilterSelect
          label='Assessment Type'
          value={kind}
          onChange={changeFilter(setKind)}
          options={[
            { value: 'quiz', label: 'Quiz' },
            { value: 'assignment', label: 'Assignment' },
          ]}
        />
        <FilterSelect
          label='Status'
          value={status}
          onChange={changeFilter(setStatus)}
          options={Object.entries(assessmentStatusLabels).map(([value, label]) => ({
            value,
            label,
          }))}
        />
      </div>
      {hasFilters && (
        <Button variant='ghost' size='sm' onClick={resetFilters}>
          <X className='size-4' />
          Clear filters
        </Button>
      )}
    </div>
  );

  return (
    <section className='w-full min-w-0 space-y-6 p-3 sm:p-6' aria-label='Assessments workspace'>
      <header className='flex flex-wrap items-start justify-between gap-4'>
        <div className='min-w-0 space-y-1'>
          <p className='text-muted-foreground text-sm'>
            {role === 'instructor'
              ? 'Monitor all quizzes and assignments issued across your classes.'
              : 'Track quizzes and assignments issued by your instructors, and review your results.'}
          </p>
        </div>
        <Button
          variant='outline'
          size='sm'
          onClick={() =>
            tab === 'results'
              ? exportResults(shownResults, resultStudents.names)
              : exportAssessments(filtered, role)
          }
          disabled={
            isLoading ||
            isError ||
            rowCount === 0 ||
            tab === 'competencies' ||
            (tab === 'results' && resultStudents.isLoading && !resultStudents.isError)
          }
        >
          <Download className='size-4' /> {tab === 'results' ? 'Export page' : 'Export'}
        </Button>
      </header>

      {role === 'student' && <StudentCredentialStats />}

      <nav aria-label='Assessment sections' className='flex flex-wrap gap-2'>
        {tabs.map(item => {
          const Icon = item.icon;
          return (
            <Button
              key={item.value}
              type='button'
              variant={tab === item.value ? 'default' : 'outline'}
              aria-pressed={tab === item.value}
              onClick={() => {
                setTab(item.value);
                setPage(1);
              }}
              className='h-7 rounded-full px-4 text-xs'
            >
              <Icon className='size-3.5' />
              {item.label}
            </Button>
          );
        })}
      </nav>

      {tab === 'overview' && (
        <div
          className='grid grid-cols-2 gap-3 lg:grid-cols-4 2xl:grid-cols-7'
          aria-label='Assessment summary'
        >
          {metrics.map(metric => (
            <Card key={metric.label} className={cn('min-w-0 border-l-4 py-0', metric.accent)}>
              <CardContent className='p-4'>
                {isLoading || isError ? (
                  <Skeleton className='mb-1 h-8 w-14' />
                ) : (
                  <p className='text-foreground text-2xl font-bold tracking-tight tabular-nums'>
                    {metric.value}
                  </p>
                )}
                <p className='text-muted-foreground text-xs font-medium'>{metric.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab === 'competencies' ? (
        <AssessmentCompetenciesTab
          rows={filtered}
          results={resultRows}
          filters={filters}
          isLoading={isLoading}
          isError={isError}
          hasFilters={hasFilters}
          onRetry={retry}
        />
      ) : (
        <>
          {filters}
          {isError ? (
            <EmptyState
              icon={ClipboardList}
              title='Unable to load assessments'
              description='Some assessment data could not be loaded. Try again to see complete results.'
              action={<Button onClick={retry}>Try again</Button>}
            />
          ) : isLoading ? (
            <div className='space-y-3' role='status' aria-label='Loading assessments'>
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className='h-16 w-full rounded-xl' />
              ))}
            </div>
          ) : rowCount === 0 ? (
            <EmptyState
              icon={tab === 'results' ? BarChart3 : ClipboardList}
              title={
                hasFilters
                  ? 'No assessments match'
                  : tab === 'results'
                    ? 'No results yet'
                    : 'No assessments issued yet'
              }
              description={
                hasFilters
                  ? 'Adjust the filters above.'
                  : tab === 'results'
                    ? 'Results will appear after students submit their assessments.'
                    : 'Quizzes and assignments will appear here when issued to a class.'
              }
              variant='card'
            />
          ) : (
            <>
              {tab === 'results' ? (
                <>
                  {resultStudents.isError && (
                    <div className='text-muted-foreground flex flex-wrap items-center gap-2 text-sm'>
                      <p>Some student details could not be loaded.</p>
                      <Button variant='outline' size='sm' onClick={resultStudents.retry}>
                        Retry student details
                      </Button>
                    </div>
                  )}
                  <ResultsTable
                    rows={shownResults}
                    names={resultStudents.names}
                    avatars={resultStudents.avatars}
                    loadingNames={resultStudents.isLoading && !resultStudents.isError}
                    role={role}
                  />
                </>
              ) : (
                <AssessmentTable rows={shownRows} role={role} />
              )}
              <div className='text-muted-foreground flex flex-wrap items-center justify-between gap-3 text-sm'>
                <p>
                  {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, rowCount)} of{' '}
                  {rowCount} {tab === 'results' ? 'results' : 'assessments'}
                </p>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={currentPage === 1}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={currentPage === totalPages}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}

export function SharedAssessmentWorkspace({ role }: { role: AssessmentRole }) {
  return <StudentAssessmentList role={role} />;
}

export function InstructorAssessmentWorkspace() {
  return <StudentAssessmentList role='instructor' />;
}
