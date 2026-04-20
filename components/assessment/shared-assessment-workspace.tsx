'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';
import {
  getStudentAssignmentSubmissionState,
  useStudentAssignmentData,
} from '@/src/features/dashboard/student-assessment/useStudentAssignmentData';
import {
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  Clock3,
  FileText,
  FolderOpen,
  ListFilter,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  Star,
  UploadCloud,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { RichTextPreview } from '../../app/dashboard/@instructor/classes/class-training/[id]/_components/ClassTrainingPage';

export type AssessmentWorkspaceRole = 'student' | 'instructor';
type AssessmentTab = 'active' | 'completed' | 'competencies';
type AssessmentSort = 'newest' | 'due-soon' | 'title';
type AssessmentStatus = 'in-progress' | 'pending-review' | 'completed' | 'overdue';
type AssessmentStatusFilter = 'all' | AssessmentStatus;

type AssessmentListItem = {
  category: string;
  dueAt: number | null;
  dueLabel: string;
  fileName: string;
  fileSize: string;
  id: string;
  learnerName: string;
  points: number;
  score: number | null;
  skill: string;
  status: AssessmentStatus;
  statusLabel: string;
  submittedAt: string;
  summary: string;
  title: string;
};

type Competency = {
  accent: string;
  artifacts: string;
  dueLabel: string;
  id: string;
  level: string;
  metric: string;
  progress: number;
  score: string;
  status: string;
  title: string;
  trend: string;
};

const assessments: AssessmentListItem[] = [
  {
    category: 'Design',
    dueAt: new Date('2026-04-23T23:59:59').getTime(),
    dueLabel: 'Due in 3 days',
    fileName: 'Design.pdf',
    fileSize: '3.2 MB',
    id: 'web-design-project',
    learnerName: 'Sarah Otieno',
    points: 16,
    score: null,
    skill: 'Web Design',
    status: 'in-progress',
    statusLabel: 'In Progress',
    submittedAt: 'May 10, 2026',
    summary: 'Revamp a nonprofit website with a new design',
    title: 'Web Design Project',
  },
  {
    category: 'Progress',
    dueAt: new Date('2026-04-21T23:59:59').getTime(),
    dueLabel: 'Due in 1 day',
    fileName: 'Analysis.pdf',
    fileSize: '1.5 MB',
    id: 'data-analysis-report',
    learnerName: 'John Mwangi',
    points: 18,
    score: null,
    skill: 'Data Analysis',
    status: 'pending-review',
    statusLabel: 'Pending Review',
    submittedAt: 'May 6, 2026',
    summary: 'Analyze the provided dataset and compile a detailed report based on the findings.',
    title: 'Data Analysis Report',
  },
  {
    category: 'Presentation',
    dueAt: new Date('2026-04-19T23:59:59').getTime(),
    dueLabel: 'Completed',
    fileName: 'Speaking.mp4',
    fileSize: '18 MB',
    id: 'public-speaking',
    learnerName: 'Sarah Otieno',
    points: 20,
    score: 17,
    skill: 'Public Speaking',
    status: 'completed',
    statusLabel: 'Completed',
    submittedAt: 'Apr 26, 2026',
    summary: 'Deliver a persuasive five-minute talk with clear pacing and visual support.',
    title: 'Public Speaking',
  },
  {
    category: 'Marketing',
    dueAt: new Date('2026-04-18T23:59:59').getTime(),
    dueLabel: 'Completed',
    fileName: 'Campaign.pdf',
    fileSize: '2.4 MB',
    id: 'digital-marketing',
    learnerName: 'Daniel Njoroge',
    points: 20,
    score: 14,
    skill: 'Digital Marketing',
    status: 'completed',
    statusLabel: 'Completed',
    submittedAt: 'Apr 18, 2026',
    summary: 'Prepare a launch campaign and explain the channel strategy.',
    title: 'Digital Marketing',
  },
];

const competencies: Competency[] = [
  {
    accent: 'bg-warning',
    artifacts: '6 Projects',
    dueLabel: 'Due in 2 days',
    id: 'uvx-design',
    level: 'Intermediate',
    metric: 'Progress manages',
    progress: 54,
    score: '9.20',
    status: 'Intermediate',
    title: 'UVX Design',
    trend: 'Needs improvement',
  },
  {
    accent: 'bg-primary',
    artifacts: '4.1 points',
    dueLabel: 'Due in 1 day',
    id: 'graphic-design',
    level: 'Proficient',
    metric: 'Highly stated',
    progress: 72,
    score: '4.5',
    status: 'Proficient',
    title: 'Graphic Design',
    trend: '4.5 / 5',
  },
  {
    accent: 'bg-destructive',
    artifacts: '10 Projects',
    dueLabel: '1 week ago',
    id: 'public-speaking',
    level: 'Advanced',
    metric: 'Export speaker',
    progress: 82,
    score: '4.5',
    status: 'Advanced',
    title: 'Public Speaking',
    trend: '4.5 / 5',
  },
  {
    accent: 'bg-success',
    artifacts: '8 Projects',
    dueLabel: 'Last reviewed',
    id: 'digital-marketing',
    level: 'Intermediate',
    metric: 'Project complete',
    progress: 62,
    score: '4.5',
    status: 'Intermediate',
    title: 'Digital Marketing',
    trend: '2 / 8',
  },
  {
    accent: 'bg-secondary',
    artifacts: '3 reports',
    dueLabel: 'Due in 3 days',
    id: 'html-css',
    level: 'Intermediate',
    metric: 'Code review',
    progress: 46,
    score: '3.8',
    status: 'Intermediate',
    title: 'HTML & CSS',
    trend: '4 Projects',
  },
  {
    accent: 'bg-muted-foreground',
    artifacts: '10 documents',
    dueLabel: 'Needs action',
    id: 'data-analysis',
    level: 'Needs improvement',
    metric: 'Report quality',
    progress: 34,
    score: '3.2',
    status: 'Needs improvement',
    title: 'Data Analysis',
    trend: 'Needs improvement',
  },
];

const topStudents = [
  { avatar: '', due: 'Overdue', initials: 'SO', name: 'Sarah Otieno' },
  { avatar: '', due: '1 day', initials: 'NA', name: 'Nathaniel' },
  { avatar: '', due: '3 days', initials: 'DA', name: 'Daniel' },
];

function formatDate(value?: string | Date | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) return 'No deadline';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'No deadline';

  return new Intl.DateTimeFormat(
    'en-US',
    options ?? { month: 'short', day: 'numeric', year: 'numeric' }
  ).format(date);
}

function getDateTime(value?: string | Date | null) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();

  return Number.isNaN(time) ? null : time;
}

function formatBytes(value?: bigint | number | null) {
  if (value == null) return 'No file';

  const size = typeof value === 'bigint' ? Number(value) : value;
  if (!Number.isFinite(size) || size <= 0) return 'No file';

  const units = ['B', 'KB', 'MB', 'GB'];
  let resolved = size;
  let unitIndex = 0;

  while (resolved >= 1024 && unitIndex < units.length - 1) {
    resolved /= 1024;
    unitIndex += 1;
  }

  return `${resolved >= 10 || unitIndex === 0 ? Math.round(resolved) : resolved.toFixed(1)} ${units[unitIndex]}`;
}

function getFilteredAssessments(
  data: AssessmentListItem[],
  tab: AssessmentTab,
  search: string,
  skill: string,
  statusFilter: AssessmentStatusFilter,
  sort: AssessmentSort
) {
  const query = search.trim().toLowerCase();

  return data
    .filter(assessment => {
      const status = getAssessmentStatus(assessment);
      const matchesTab =
        tab === 'active'
          ? status !== 'completed'
          : tab === 'completed'
            ? status === 'completed'
            : true;
      const matchesSearch =
        !query ||
        [assessment.title, assessment.learnerName, assessment.summary, assessment.skill]
          .join(' ')
          .toLowerCase()
          .includes(query);
      const matchesSkill = skill === 'all' || assessment.skill === skill;
      const matchesStatus = statusFilter === 'all' || status === statusFilter;

      return matchesTab && matchesSearch && matchesSkill && matchesStatus;
    })
    .sort((left, right) => {
      if (sort === 'title') return left.title.localeCompare(right.title);

      if (sort === 'due-soon') {
        return (left.dueAt ?? Number.MAX_SAFE_INTEGER) - (right.dueAt ?? Number.MAX_SAFE_INTEGER);
      }

      const leftTime = new Date(left.submittedAt).getTime();
      const rightTime = new Date(right.submittedAt).getTime();

      return (Number.isNaN(rightTime) ? 0 : rightTime) - (Number.isNaN(leftTime) ? 0 : leftTime);
    });
}

function getFilteredCompetencies(
  data: Competency[],
  search: string,
  skill: string,
  statusFilter: AssessmentStatusFilter,
  sort: AssessmentSort
) {
  const query = search.trim().toLowerCase();

  return data
    .filter(competency => {
      const matchesSearch =
        !query ||
        [
          competency.title,
          competency.level,
          competency.metric,
          competency.status,
          competency.artifacts,
          competency.trend,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query);
      const matchesSkill = skill === 'all' || competency.title === skill;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'completed'
          ? competency.progress >= 80
          : statusFilter === 'in-progress'
            ? competency.progress > 0 && competency.progress < 80
            : false);

      return matchesSearch && matchesSkill && matchesStatus;
    })
    .sort((left, right) => {
      if (sort === 'title') return left.title.localeCompare(right.title);
      if (sort === 'due-soon') return left.dueLabel.localeCompare(right.dueLabel);

      return right.progress - left.progress;
    });
}

function isAssessmentOverdue(assessment: AssessmentListItem) {
  return (
    assessment.status !== 'completed' && assessment.dueAt != null && assessment.dueAt < Date.now()
  );
}

function getAssessmentStatus(assessment: AssessmentListItem): AssessmentStatus {
  return isAssessmentOverdue(assessment) ? 'overdue' : assessment.status;
}

function getAssessmentStatusLabel(assessment: AssessmentListItem) {
  return getAssessmentStatus(assessment) === 'overdue' ? 'Overdue' : assessment.statusLabel;
}

function getAssessmentDueLabel(assessment: AssessmentListItem) {
  if (isAssessmentOverdue(assessment)) {
    return assessment.dueAt ? `Overdue since ${formatDate(new Date(assessment.dueAt))}` : 'Overdue';
  }

  return assessment.dueLabel;
}

function StatusBadge({ assessment }: { assessment: AssessmentListItem }) {
  const status = getAssessmentStatus(assessment);

  return (
    <Badge
      className={cn(
        'h-6 rounded-md px-2.5 text-xs font-medium',
        status === 'in-progress' && 'bg-primary/10 text-primary hover:bg-primary/10',
        status === 'pending-review' && 'bg-success/10 text-success hover:bg-success/10',
        status === 'completed' && 'bg-success/10 text-success hover:bg-success/10',
        status === 'overdue' && 'bg-destructive/10 text-destructive hover:bg-destructive/10'
      )}
    >
      {getAssessmentStatusLabel(assessment)}
    </Badge>
  );
}

function TabsBar({
  activeCount,
  activeTab,
  completedCount,
  competenciesCount,
  onTabChange,
}: {
  activeCount: number;
  activeTab: AssessmentTab;
  completedCount: number;
  competenciesCount: number;
  onTabChange: (tab: AssessmentTab) => void;
}) {
  const tabs = [
    { count: activeCount, label: 'Active', value: 'active' as const },
    { count: completedCount, label: 'Completed', value: 'completed' as const },
    { count: competenciesCount, label: 'Competencies', value: 'competencies' as const },
  ];

  return (
    <div className='flex flex-wrap items-center gap-3'>
      {tabs.map(tab => (
        <button
          aria-pressed={activeTab === tab.value}
          className={cn(
            'text-muted-foreground hover:text-foreground h-9 rounded-md px-3 text-sm font-medium transition',
            activeTab === tab.value && 'bg-background text-foreground ring-border shadow-sm ring-1'
          )}
          key={tab.value}
          onClick={() => onTabChange(tab.value)}
          type='button'
        >
          {tab.label}
          {tab.value === 'competencies' || activeTab === tab.value ? ` (${tab.count})` : ''}
        </button>
      ))}
    </div>
  );
}

function HeaderActions({ role }: { role: AssessmentWorkspaceRole }) {
  return (
    <div className='grid w-full gap-2 sm:w-auto sm:grid-cols-2'>
      <Button className='h-10 justify-center rounded-md px-4' type='button'>
        {role === 'instructor' ? (
          <>
            <Plus className='size-4' />
            Add Assessments
          </>
        ) : (
          <>
            <UploadCloud className='size-4' />
            Submit Assessment
          </>
        )}
      </Button>
      <Button className='h-10 justify-center rounded-md px-4' variant='outline' type='button'>
        <FolderOpen className='size-4' />
        View Report
      </Button>
    </div>
  );
}

function SearchAndFilters({
  onSearchChange,
  onSkillChange,
  onSortChange,
  onStatusChange,
  search,
  skill,
  skills,
  sort,
  status,
}: {
  onSearchChange: (value: string) => void;
  onSkillChange: (value: string) => void;
  onSortChange: (value: AssessmentSort) => void;
  onStatusChange: (value: AssessmentStatusFilter) => void;
  search: string;
  skill: string;
  skills: string[];
  sort: AssessmentSort;
  status: AssessmentStatusFilter;
}) {
  return (
    <div className='grid gap-3 md:grid-cols-[minmax(0,1fr)_140px_150px_130px]'>
      <div className='relative'>
        <Search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
        <Input
          className='bg-background h-11 rounded-md pr-10 pl-10'
          onChange={event => onSearchChange(event.target.value)}
          placeholder='Search assessments...'
          value={search}
        />
        <Settings2 className='text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2' />
      </div>
      <Select value={skill} onValueChange={onSkillChange}>
        <SelectTrigger className='bg-background h-11 w-full rounded-md'>
          <SelectValue placeholder='All Skills' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All Skills</SelectItem>
          {skills.map(item => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={sort} onValueChange={value => onSortChange(value as AssessmentSort)}>
        <SelectTrigger className='bg-background h-11 w-full rounded-md'>
          <span className='inline-flex items-center gap-2'>
            <Menu className='size-4' />
            <SelectValue placeholder='Newest' />
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='newest'>Newest</SelectItem>
          <SelectItem value='due-soon'>Due soon</SelectItem>
          <SelectItem value='title'>Title</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={status}
        onValueChange={value => onStatusChange(value as AssessmentStatusFilter)}
      >
        <SelectTrigger className='bg-background h-11 w-full rounded-md'>
          <span className='inline-flex items-center gap-2'>
            <ListFilter className='size-4' />
            <SelectValue placeholder='Filters' />
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All Statuses</SelectItem>
          <SelectItem value='in-progress'>In Progress</SelectItem>
          <SelectItem value='pending-review'>Pending Review</SelectItem>
          <SelectItem value='completed'>Completed</SelectItem>
          <SelectItem value='overdue'>Overdue</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function EmptyAssessmentsState() {
  return (
    <div className='border-border bg-card text-muted-foreground flex min-h-[220px] flex-col items-center justify-center rounded-md border p-8 text-center text-sm'>
      <FileText className='text-primary/70 mb-3 size-10' />
      <p className='text-foreground text-base font-semibold'>No assessments found</p>
      <p className='mt-1 max-w-md'>
        Try a different search term, skill, status, or sort option to find matching assessments.
      </p>
    </div>
  );
}

function AssessmentCard({
  assessment,
  role,
}: {
  assessment: AssessmentListItem;
  role: AssessmentWorkspaceRole;
}) {
  const primaryAction =
    role === 'instructor'
      ? assessment.score === null
        ? 'Update Review'
        : 'View Report'
      : assessment.score === null
        ? 'Submit Assessment'
        : 'View Assessment';

  return (
    <article className='border-border/70 bg-card rounded-md border shadow-xs'>
      <div className='border-border/60 flex items-start justify-between gap-4 border-b p-4'>
        <div className='min-w-0'>
          <h3 className='truncate text-xl font-semibold'>{assessment.title}</h3>
          <p className='text-muted-foreground mt-2 text-sm'>
            Submitted by {assessment.learnerName} on {assessment.submittedAt}
          </p>
        </div>
        <StatusBadge assessment={assessment} />
      </div>
      <div className='border-border/60 space-y-4 border-b p-4'>
        <p className='flex items-center gap-2'>
          <Star className='text-warning fill-warning size-4 shrink-0' />
          <div className='text-muted-foreground flex text-sm'>
            <RichTextPreview html={assessment.summary} />
          </div>
        </p>
        <div className='grid gap-3 md:grid-cols-[120px_minmax(0,1fr)_auto] md:items-center'>
          <Badge className='bg-primary text-primary-foreground h-8 w-fit rounded-md px-4'>
            {assessment.category}
          </Badge>
          <div className='text-muted-foreground flex min-w-0 items-center gap-2 text-sm'>
            <FileText className='text-primary size-4 shrink-0' />
            <span className='text-foreground truncate font-medium'>{assessment.fileName}</span>
            <span className='shrink-0'>({assessment.fileSize})</span>
          </div>
          <Button className='h-9 rounded-md px-5' type='button'>
            {primaryAction}
            <ArrowUpRight className='size-4' />
          </Button>
        </div>
      </div>
      <footer className='flex flex-wrap items-center gap-x-6 gap-y-2 p-4 text-sm'>
        <span className='text-muted-foreground'>
          Total Score:{' '}
          <span className='text-foreground font-medium'>
            {assessment.score ?? '----'} / {assessment.points}
          </span>
        </span>
        <span
          className={cn(
            'text-muted-foreground',
            isAssessmentOverdue(assessment) && 'text-destructive font-medium'
          )}
        >
          {getAssessmentDueLabel(assessment)}
        </span>
        <button className='text-muted-foreground hover:text-foreground ml-auto' type='button'>
          <MoreHorizontal className='size-5' />
        </button>
      </footer>
    </article>
  );
}

function AssessmentCardSkeleton() {
  return (
    <article className='border-border/70 bg-card rounded-md border shadow-xs'>
      <div className='border-border/60 flex items-start justify-between gap-4 border-b p-4'>
        <div className='min-w-0 flex-1 space-y-2'>
          <Skeleton className='h-6 w-52' />
          <Skeleton className='h-4 w-60' />
        </div>
        <Skeleton className='h-6 w-24 rounded-md' />
      </div>
      <div className='border-border/60 space-y-4 border-b p-4'>
        <Skeleton className='h-16 w-full' />
        <div className='grid gap-3 md:grid-cols-[120px_minmax(0,1fr)_auto]'>
          <Skeleton className='h-8 w-24 rounded-md' />
          <Skeleton className='h-8 w-full rounded-md' />
          <Skeleton className='h-9 w-36 rounded-md' />
        </div>
      </div>
      <div className='flex flex-wrap items-center gap-x-6 gap-y-2 p-4'>
        <Skeleton className='h-4 w-32' />
        <Skeleton className='h-4 w-24' />
      </div>
    </article>
  );
}

function AssessmentOverview({
  activeCount,
  completedCount,
  overdueCount,
  pendingCount,
}: {
  activeCount: number;
  completedCount: number;
  overdueCount: number;
  pendingCount: number;
}) {
  return (
    <section className='border-border/70 bg-card rounded-md border p-4 shadow-xs'>
      <div className='mb-4 flex items-center justify-between gap-3'>
        <h3 className='font-semibold'>Assessment Overview</h3>
        <Button className='h-8 rounded-md text-xs' variant='outline' type='button'>
          <UploadCloud className='size-3.5' />
          Assessments
        </Button>
      </div>
      <div className='grid grid-cols-4 gap-3 border-b pb-4 text-center'>
        {[
          [String(activeCount), 'Active'],
          [String(completedCount), 'Completed'],
          [String(pendingCount), 'Pending'],
          [String(overdueCount), 'Overdue'],
        ].map(([value, label]) => (
          <div key={label}>
            <p className='text-primary text-2xl font-semibold'>{value}</p>
            <p className='text-muted-foreground text-xs'>{label}</p>
          </div>
        ))}
      </div>
      <div className='space-y-2 pt-4 text-sm'>
        <p className='text-muted-foreground flex items-center gap-2'>
          <BriefcaseBusiness className='text-primary size-4' />
          {activeCount} in progress
        </p>
        <p className='text-muted-foreground flex items-center gap-2'>
          <Clock3 className='text-warning size-4' />
          {overdueCount} overdue
        </p>
      </div>
    </section>
  );
}

function Deadlines({ items }: { items: AssessmentListItem[] }) {
  return (
    <section className='border-border/70 bg-card rounded-md border p-4 shadow-xs'>
      <h3 className='mb-4 font-semibold'>Upcoming Deadlines</h3>
      <div className='space-y-3'>
        {items.slice(0, 3).map(assessment => {
          const overdue = isAssessmentOverdue(assessment);

          return (
            <div
              className={cn(
                'flex gap-2 rounded-md border border-transparent p-2 text-sm',
                overdue && 'border-destructive/20 bg-destructive/10 text-destructive'
              )}
              key={assessment.id}
            >
              <CalendarDays
                className={cn(
                  'mt-0.5 size-4 shrink-0',
                  overdue ? 'text-destructive' : 'text-primary'
                )}
              />
              <div className='min-w-0'>
                <p className='font-medium'>{assessment.title}</p>
                <p className={cn('text-muted-foreground', overdue && 'text-destructive/80')}>
                  {getAssessmentDueLabel(assessment)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TopStudentsPanel() {
  return (
    <section className='border-border/70 bg-card rounded-md border p-4 shadow-xs'>
      <div className='mb-4 flex items-center justify-between'>
        <h3 className='font-semibold'>Assessment Overview</h3>
        <Button className='h-8 rounded-md text-xs' variant='outline' type='button'>
          <UploadCloud className='size-3.5' />
          Assessments
        </Button>
      </div>
      <div className='bg-background relative overflow-hidden rounded-md border p-4'>
        <p className='mb-4 flex items-center gap-2 text-sm font-semibold'>
          <Clock3 className='text-primary size-4' />
          Top Students
        </p>
        <div className='relative z-10 space-y-3'>
          {topStudents.map(student => (
            <div className='flex items-center gap-3' key={student.name}>
              <Avatar className='size-7'>
                <AvatarImage src={student.avatar} alt={student.name} />
                <AvatarFallback>{student.initials}</AvatarFallback>
              </Avatar>
              <span className='min-w-0 flex-1 truncate text-sm font-medium'>{student.name}</span>
              <span className='text-muted-foreground text-xs'>{student.due}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CompetencyCard({ competency }: { competency: Competency }) {
  return (
    <article className='border-border/70 bg-card grid gap-4 rounded-md border p-4 shadow-xs min-[1400px]:grid-cols-[minmax(0,1fr)_minmax(150px,0.9fr)]'>
      <div className='min-w-0'>
        <div className='mb-3 flex items-start justify-between gap-3'>
          <div>
            <h3 className='font-semibold'>{competency.title}</h3>
            <p className='text-muted-foreground mt-1 text-xs'>{competency.artifacts}</p>
          </div>
          <Badge className='bg-success/10 text-success hover:bg-success/10'>
            {competency.level}
          </Badge>
        </div>
        <div className='flex items-center gap-2'>
          <span
            className={cn(
              'inline-flex size-6 items-center justify-center rounded-sm',
              competency.accent
            )}
          >
            <BookOpen className='text-primary-foreground size-3.5' />
          </span>
          <span className='bg-primary text-primary-foreground inline-flex size-6 items-center justify-center rounded-sm text-xs font-bold'>
            AI
          </span>
          <span className='text-muted-foreground ml-auto text-xs'>{competency.dueLabel}</span>
        </div>
      </div>
      <div className='space-y-2'>
        <div className='flex justify-between gap-3 text-xs'>
          <span className='text-muted-foreground'>{competency.metric}</span>
          <span className='font-semibold'>{competency.trend}</span>
        </div>
        <Progress className='h-1.5' value={competency.progress} indicatorClassName='bg-success' />
        <div className='flex justify-between gap-3 text-xs'>
          <span className='text-muted-foreground'>{competency.status}</span>
          <span className='font-semibold'>{competency.score}</span>
        </div>
      </div>
    </article>
  );
}

function CompetencyChart({ compact = false }: { compact?: boolean }) {
  return (
    <section className='border-border/70 bg-card rounded-md border p-4 shadow-xs'>
      <div className='mb-4 flex items-center justify-between gap-3'>
        <div className='flex min-w-0 items-center gap-2'>
          <h2 className='text-xl font-semibold'>Competency Chart</h2>
          <Badge className='bg-warning/10 text-warning hover:bg-warning/10'>Mock data</Badge>
        </div>
        <Button className='h-8 rounded-md text-xs' variant='outline' type='button'>
          Assessments
          <ChevronDown className='size-3.5' />
        </Button>
      </div>
      <div className='space-y-3'>
        {(compact ? competencies.slice(0, 4) : competencies).map(competency => (
          <CompetencyCard competency={competency} key={competency.id} />
        ))}
      </div>
    </section>
  );
}

function CompetenciesGrid({ items }: { items: Competency[] }) {
  return (
    <div className='grid gap-4 min-[1400px]:grid-cols-3 lg:grid-cols-2'>
      {items.length > 0 ? (
        items.map(competency => <CompetencyCard competency={competency} key={competency.id} />)
      ) : (
        <div className='min-[1400px]:col-span-3 lg:col-span-2'>
          <EmptyAssessmentsState />
        </div>
      )}
    </div>
  );
}

function StudentAssessmentList({ role }: { role: AssessmentWorkspaceRole }) {
  const [activeTab, setActiveTab] = useState<AssessmentTab>('active');
  const [search, setSearch] = useState('');
  const [skill, setSkill] = useState('all');
  const [sort, setSort] = useState<AssessmentSort>('newest');
  const [statusFilter, setStatusFilter] = useState<AssessmentStatusFilter>('all');
  const { assignmentRows, isLoading } = useStudentAssignmentData();

  const studentAssessments = useMemo<AssessmentListItem[]>(
    () =>
      assignmentRows.map(row => {
        const status = getStudentAssignmentSubmissionState(row);
        const primaryAttachment = row.attachments[0];
        const dueAt = row.schedule?.due_at ?? row.assignment?.due_date;
        const dueTime = getDateTime(dueAt);
        const skillLabel =
          row.classMeta.courseTitle || row.assignment.assignment_category || 'Assignment';

        return {
          category: row.assignment.assignment_category || 'Assignment',
          dueAt: dueTime,
          dueLabel: dueAt ? `Due ${formatDate(dueAt)}` : 'Self paced',
          fileName:
            primaryAttachment?.original_filename ||
            primaryAttachment?.stored_filename ||
            'No attachment',
          fileSize: formatBytes(primaryAttachment?.file_size_bytes),
          id: row.assignment.uuid || `${row.classMeta.classUuid}-${row.assignment.title}`,
          learnerName: 'You',
          points: row.assignment.max_points ?? row.latestSubmission?.max_score ?? 100,
          score: row.latestSubmission?.score ?? null,
          skill: skillLabel,
          status:
            status.key === 'graded'
              ? 'completed'
              : status.key === 'submitted'
                ? 'pending-review'
                : status.label === 'Overdue'
                  ? 'overdue'
                  : 'in-progress',
          statusLabel: status.label,
          submittedAt: formatDate(
            row.latestSubmission?.submitted_at ||
              row.latestSubmission?.updated_date ||
              row.latestSubmission?.created_date ||
              dueAt
          ),
          summary:
            row.assignment.description ||
            row.assignment.instructions ||
            `${row.classMeta.classTitle} in ${row.classMeta.courseTitle}`,
          title: row.assignment.title,
        };
      }),
    [assignmentRows]
  );

  const filteredAssessments = useMemo(
    () => getFilteredAssessments(studentAssessments, activeTab, search, skill, statusFilter, sort),
    [activeTab, search, skill, sort, statusFilter, studentAssessments]
  );
  const filteredCompetencies = useMemo(
    () => getFilteredCompetencies(competencies, search, skill, statusFilter, sort),
    [search, skill, sort, statusFilter]
  );

  const skills = useMemo(
    () =>
      Array.from(
        new Set([
          ...studentAssessments.map(assessment => assessment.skill),
          ...competencies.map(competency => competency.title),
        ])
      ).sort(),
    [studentAssessments]
  );

  const activeCount = studentAssessments.filter(
    assessment => getAssessmentStatus(assessment) !== 'completed'
  ).length;
  const completedCount = studentAssessments.filter(
    assessment => getAssessmentStatus(assessment) === 'completed'
  ).length;
  const pendingCount = studentAssessments.filter(
    assessment =>
      getAssessmentStatus(assessment) === 'in-progress' ||
      getAssessmentStatus(assessment) === 'pending-review'
  ).length;
  const overdueCount = studentAssessments.filter(
    assessment => getAssessmentStatus(assessment) === 'overdue'
  ).length;
  const upcomingDeadlines = useMemo(
    () =>
      [...studentAssessments]
        .filter(assessment => assessment.dueAt != null && assessment.status !== 'completed')
        .sort((left, right) => (left.dueAt ?? 0) - (right.dueAt ?? 0)),
    [studentAssessments]
  );

  return (
    <main className='bg-muted/30 min-h-screen overflow-hidden'>
      <section className='mx-auto w-full max-w-7xl space-y-5 px-4 py-4 sm:px-6 lg:px-8'>
        <div className='border-border/70 bg-card rounded-md border p-4 shadow-xs sm:p-5'>
          <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
            <div className='min-w-0 space-y-4'>
              <h1 className='truncate text-2xl font-semibold'>
                {activeTab === 'competencies'
                  ? `Competencies (${competencies.length})`
                  : 'Assessments & Competencies'}
              </h1>
              <TabsBar
                activeCount={activeCount}
                activeTab={activeTab}
                completedCount={completedCount}
                competenciesCount={competencies.length}
                onTabChange={setActiveTab}
              />
            </div>
            <HeaderActions role={role} />
          </div>
        </div>

        <div className='space-y-5'>
          <SearchAndFilters
            onSearchChange={setSearch}
            onSkillChange={setSkill}
            onSortChange={setSort}
            onStatusChange={setStatusFilter}
            search={search}
            skill={skill}
            skills={skills}
            sort={sort}
            status={statusFilter}
          />

          {activeTab === 'competencies' ? (
            <CompetenciesGrid items={filteredCompetencies} />
          ) : (
            <div className='grid items-start gap-5 min-[1400px]:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]'>
              <div className='flex flex-col gap-5'>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <AssessmentCardSkeleton key={`assessment-skeleton-${index}`} />
                  ))
                ) : filteredAssessments.length > 0 ? (
                  filteredAssessments.map(assessment => (
                    <AssessmentCard assessment={assessment} key={assessment.id} role={role} />
                  ))
                ) : (
                  <EmptyAssessmentsState />
                )}
              </div>
              <div className='grid gap-5 min-[1400px]:block min-[1400px]:space-y-5 lg:grid-cols-2'>
                <AssessmentOverview
                  activeCount={activeCount}
                  completedCount={completedCount}
                  overdueCount={overdueCount}
                  pendingCount={pendingCount}
                />
                <Deadlines items={upcomingDeadlines} />
              </div>
            </div>
          )}

          <div className='grid gap-5 min-[1400px]:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]'>
            <CompetencyChart compact={activeTab !== 'competencies'} />
            <TopStudentsPanel />
          </div>
        </div>
      </section>
    </main>
  );
}

export function SharedAssessmentWorkspace({ role }: { role: AssessmentWorkspaceRole }) {
  const [activeTab, setActiveTab] = useState<AssessmentTab>('active');
  const [search, setSearch] = useState('');
  const [skill, setSkill] = useState('all');
  const [sort, setSort] = useState<AssessmentSort>('newest');
  const [statusFilter, setStatusFilter] = useState<AssessmentStatusFilter>('all');
  const filteredAssessments = useMemo(
    () => getFilteredAssessments(assessments, activeTab, search, skill, statusFilter, sort),
    [activeTab, search, skill, sort, statusFilter]
  );
  const filteredCompetencies = useMemo(
    () => getFilteredCompetencies(competencies, search, skill, statusFilter, sort),
    [search, skill, sort, statusFilter]
  );
  const activeCount = assessments.filter(
    assessment => getAssessmentStatus(assessment) !== 'completed'
  ).length;
  const completedCount = assessments.filter(
    assessment => getAssessmentStatus(assessment) === 'completed'
  ).length;
  const overdueCount = assessments.filter(
    assessment => getAssessmentStatus(assessment) === 'overdue'
  ).length;
  const pendingCount = assessments.filter(
    assessment =>
      getAssessmentStatus(assessment) === 'in-progress' ||
      getAssessmentStatus(assessment) === 'pending-review'
  ).length;
  const skills = Array.from(
    new Set([
      ...assessments.map(assessment => assessment.skill),
      ...competencies.map(competency => competency.title),
    ])
  ).sort();
  const upcomingDeadlines = [...assessments]
    .filter(assessment => assessment.dueAt != null && assessment.status !== 'completed')
    .sort((left, right) => (left.dueAt ?? 0) - (right.dueAt ?? 0));

  if (role === 'student') {
    return <StudentAssessmentList role={role} />;
  }

  return (
    <main className='bg-muted/30 min-h-screen overflow-hidden'>
      <section className='mx-auto w-full max-w-7xl space-y-5 px-4 py-4 sm:px-6 lg:px-8'>
        <div className='border-border/70 bg-card rounded-md border p-4 shadow-xs sm:p-5'>
          <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
            <div className='min-w-0 space-y-4'>
              <h1 className='truncate text-2xl font-semibold'>
                {activeTab === 'competencies'
                  ? `Competencies (${competencies.length})`
                  : 'Assessments & Competencies'}
              </h1>
              <TabsBar
                activeCount={activeCount}
                activeTab={activeTab}
                completedCount={completedCount}
                competenciesCount={competencies.length}
                onTabChange={setActiveTab}
              />
            </div>
            <HeaderActions role={role} />
          </div>
        </div>

        <div className='space-y-5'>
          <SearchAndFilters
            onSearchChange={setSearch}
            onSkillChange={setSkill}
            onSortChange={setSort}
            onStatusChange={setStatusFilter}
            search={search}
            skill={skill}
            skills={skills}
            sort={sort}
            status={statusFilter}
          />

          {activeTab === 'competencies' ? (
            <CompetenciesGrid items={filteredCompetencies} />
          ) : (
            <div className='grid items-start gap-5 min-[1400px]:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]'>
              <div className='flex flex-col gap-5'>
                {filteredAssessments.length > 0 ? (
                  filteredAssessments.map(assessment => (
                    <AssessmentCard assessment={assessment} key={assessment.id} role={role} />
                  ))
                ) : (
                  <EmptyAssessmentsState />
                )}
              </div>
              <div className='grid gap-5 min-[1400px]:block min-[1400px]:space-y-5 lg:grid-cols-2'>
                <AssessmentOverview
                  activeCount={activeCount}
                  completedCount={completedCount}
                  overdueCount={overdueCount}
                  pendingCount={pendingCount}
                />
                <Deadlines items={upcomingDeadlines} />
              </div>
            </div>
          )}

          <div className='grid gap-5 min-[1400px]:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]'>
            <CompetencyChart compact={activeTab !== 'competencies'} />
            <TopStudentsPanel />
          </div>
        </div>
      </section>
    </main>
  );
}
