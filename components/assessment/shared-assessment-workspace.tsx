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
import { cn } from '@/lib/utils';
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

export type AssessmentWorkspaceRole = 'student' | 'instructor';
type AssessmentTab = 'active' | 'completed' | 'competencies';

type Assessment = {
  category: string;
  dueLabel: string;
  fileName: string;
  fileSize: string;
  id: string;
  learnerName: string;
  points: number;
  score: number | null;
  skill: string;
  status: 'in-progress' | 'pending-review' | 'completed' | 'overdue';
  statusLabel: string;
  submittedAt: string;
  title: string;
  summary: string;
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

const assessments: Assessment[] = [
  {
    category: 'Design',
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

function getFilteredAssessments(tab: AssessmentTab, search: string, skill: string) {
  const query = search.trim().toLowerCase();

  return assessments.filter(assessment => {
    const matchesTab =
      tab === 'active'
        ? assessment.score === null
        : tab === 'completed'
          ? assessment.score !== null || assessment.status === 'pending-review'
          : true;
    const matchesSearch =
      !query ||
      [assessment.title, assessment.learnerName, assessment.summary, assessment.skill]
        .join(' ')
        .toLowerCase()
        .includes(query);
    const matchesSkill = skill === 'all' || assessment.skill === skill;

    return matchesTab && matchesSearch && matchesSkill;
  });
}

function StatusBadge({ assessment }: { assessment: Assessment }) {
  return (
    <Badge
      className={cn(
        'h-6 rounded-md px-2.5 text-xs font-medium',
        assessment.status === 'in-progress' && 'bg-primary/10 text-primary hover:bg-primary/10',
        assessment.status === 'pending-review' &&
        'bg-success/10 text-success hover:bg-success/10',
        assessment.status === 'completed' && 'bg-success/10 text-success hover:bg-success/10',
        assessment.status === 'overdue' &&
        'bg-destructive/10 text-destructive hover:bg-destructive/10'
      )}
    >
      {assessment.statusLabel}
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
            activeTab === tab.value && 'bg-background text-foreground shadow-sm ring-1 ring-border'
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
  search,
  skill,
}: {
  onSearchChange: (value: string) => void;
  onSkillChange: (value: string) => void;
  search: string;
  skill: string;
}) {
  return (
    <div className='grid gap-3 md:grid-cols-[minmax(0,1fr)_140px_150px_130px]'>
      <div className='relative'>
        <Search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
        <Input
          className='bg-background h-11 rounded-md pl-10 pr-10'
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
          {Array.from(new Set(assessments.map(assessment => assessment.skill))).map(item => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button className='h-11 justify-between rounded-md' variant='outline' type='button'>
        <span className='inline-flex items-center gap-2'>
          <Menu className='size-4' />
          Newest
        </span>
        <ChevronDown className='size-4' />
      </Button>
      <Button className='h-11 justify-between rounded-md' variant='outline' type='button'>
        <span className='inline-flex items-center gap-2'>
          <ListFilter className='size-4' />
          Filters
        </span>
        <ChevronDown className='size-4' />
      </Button>
    </div>
  );
}

function AssessmentCard({
  assessment,
  role,
}: {
  assessment: Assessment;
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
        <p className='text-muted-foreground flex gap-2 text-sm leading-6'>
          <Star className='text-warning mt-0.5 size-4 shrink-0 fill-warning' />
          <span>{assessment.summary}</span>
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
        <span className='text-muted-foreground'>{assessment.dueLabel}</span>
        <button className='ml-auto text-muted-foreground hover:text-foreground' type='button'>
          <MoreHorizontal className='size-5' />
        </button>
      </footer>
    </article>
  );
}

function AssessmentOverview() {
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
          ['3', 'Active'],
          ['1', 'Accepted'],
          ['1', 'Rejected'],
          ['1', 'Up'],
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
          In Progress
        </p>
        <p className='text-muted-foreground flex items-center gap-2'>
          <Clock3 className='text-warning size-4' />1 Overdue
        </p>
      </div>
    </section>
  );
}

function Deadlines() {
  return (
    <section className='border-border/70 bg-card rounded-md border p-4 shadow-xs'>
      <h3 className='mb-4 font-semibold'>Upcoming Deadlines</h3>
      <div className='space-y-3'>
        {assessments.slice(0, 2).map(assessment => (
          <div className='flex gap-2 text-sm' key={assessment.id}>
            <CalendarDays className='text-primary mt-0.5 size-4 shrink-0' />
            <div>
              <p className='font-medium'>{assessment.title}</p>
              <p className='text-muted-foreground'>{assessment.dueLabel}</p>
            </div>
          </div>
        ))}
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
          <Badge className='bg-success/10 text-success hover:bg-success/10'>{competency.level}</Badge>
        </div>
        <div className='flex items-center gap-2'>
          <span className={cn('inline-flex size-6 items-center justify-center rounded-sm', competency.accent)}>
            <BookOpen className='size-3.5 text-primary-foreground' />
          </span>
          <span className='bg-primary inline-flex size-6 items-center justify-center rounded-sm text-xs font-bold text-primary-foreground'>
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
        <h2 className='text-xl font-semibold'>Competency Chart</h2>
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

function CompetenciesGrid() {
  return (
    <div className='grid gap-4 lg:grid-cols-2 min-[1400px]:grid-cols-3'>
      {competencies.map(competency => (
        <CompetencyCard competency={competency} key={competency.id} />
      ))}
    </div>
  );
}

export function SharedAssessmentWorkspace({ role }: { role: AssessmentWorkspaceRole }) {
  const [activeTab, setActiveTab] = useState<AssessmentTab>('completed');
  const [search, setSearch] = useState('');
  const [skill, setSkill] = useState('all');
  const filteredAssessments = useMemo(
    () => getFilteredAssessments(activeTab, search, skill),
    [activeTab, search, skill]
  );
  const activeCount = assessments.filter(assessment => assessment.score === null).length;
  const completedCount = assessments.filter(
    assessment => assessment.score !== null || assessment.status === 'pending-review'
  ).length;

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
            search={search}
            skill={skill}
          />

          {activeTab === 'competencies' ? (
            <CompetenciesGrid />
          ) : (
            <div className='grid gap-5 min-[1400px]:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]'>
              <div className='space-y-5'>
                {filteredAssessments.length > 0 ? (
                  filteredAssessments.map(assessment => (
                    <AssessmentCard assessment={assessment} key={assessment.id} role={role} />
                  ))
                ) : (
                  <div className='border-border bg-card text-muted-foreground rounded-md border p-6 text-sm'>
                    No assessments match the selected filters.
                  </div>
                )}
              </div>
              <div className='grid gap-5 lg:grid-cols-2 min-[1400px]:block min-[1400px]:space-y-5'>
                <AssessmentOverview />
                <Deadlines />
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
