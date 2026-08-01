// @ts-nocheck -- 1:1 Lovable port; @hey-api generated-client type drift
'use client';

import { useQuery } from '@tanstack/react-query';
import { GraduationCap, Plus, Search, Timer } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { extractPage } from '@/lib/api-helpers';
import type { ClassDefinition, Quiz } from '@/services/client';
import {
  getAllQuizzesOptions,
  getClassDefinitionsForOrganisationOptions,
} from '@/services/client/@tanstack/react-query.gen';

type Status = 'Draft' | 'Active' | 'Published';

const STATUS_STYLE: Record<Status, string> = {
  Draft: 'bg-muted text-foreground',
  Active: 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200',
  Published: 'bg-success/10 text-success',
};

const statusOf = (q: Quiz): Status => {
  if (!q.is_published) return 'Draft';
  return q.active ? 'Active' : 'Published';
};

export default function ExamsPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';

  const classesQuery = useQuery({
    ...getClassDefinitionsForOrganisationOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
  });
  const classTitleByUuid = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of classesQuery.data?.data ?? []) {
      const cd: ClassDefinition | undefined = c.class_definition;
      if (cd?.uuid) map.set(cd.uuid, cd.title);
    }
    return map;
  }, [classesQuery.data]);

  const quizzesQuery = useQuery({
    ...getAllQuizzesOptions({ query: { pageable: { page: 0, size: 200 } } }),
    enabled: classTitleByUuid.size > 0,
  });

  const orgQuizzes = useMemo(
    () =>
      extractPage<Quiz>(quizzesQuery.data).items.filter(
        q => q.class_definition_uuid && classTitleByUuid.has(q.class_definition_uuid)
      ),
    [quizzesQuery.data, classTitleByUuid]
  );

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<string>('all');

  const rows = useMemo(
    () =>
      orgQuizzes.filter(q => {
        if (status !== 'all' && statusOf(q) !== status) return false;
        if (query) {
          const course = classTitleByUuid.get(q.class_definition_uuid ?? '') ?? '';
          if (!`${q.title} ${course}`.toLowerCase().includes(query.toLowerCase())) return false;
        }
        return true;
      }),
    [orgQuizzes, status, query, classTitleByUuid]
  );

  const kpis = useMemo(() => {
    const published = orgQuizzes.filter(q => q.is_published).length;
    const drafts = orgQuizzes.filter(q => !q.is_published).length;
    const timed = orgQuizzes.filter(q => q.is_timed).length;
    return { total: orgQuizzes.length, published, drafts, timed };
  }, [orgQuizzes]);

  const loading = classesQuery.isLoading || quizzesQuery.isLoading;

  return (
    <div className='mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]'>
      <PageHeader
        title='Exams'
        description='Schedule exams, record results, and issue reports.'
        action={
          <Button
            onClick={() =>
              toast.info('Schedule exam', {
                description: 'Exams are built as quizzes within a class lesson.',
              })
            }
          >
            <Plus className='mr-2 h-4 w-4' />
            Schedule Exam
          </Button>
        }
      />

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Card className='border-l-primary border-l-4'>
          <CardContent className='p-6'>
            <div className='text-2xl font-bold'>{kpis.total}</div>
            <div className='text-muted-foreground text-xs'>Total exams</div>
          </CardContent>
        </Card>
        <Card className='border-l-success border-l-4'>
          <CardContent className='p-6'>
            <div className='text-2xl font-bold'>{kpis.published}</div>
            <div className='text-muted-foreground text-xs'>Published</div>
          </CardContent>
        </Card>
        <Card className='border-l-4 border-l-sky-500'>
          <CardContent className='p-6'>
            <div className='text-2xl font-bold'>{kpis.timed}</div>
            <div className='text-muted-foreground text-xs'>Timed</div>
          </CardContent>
        </Card>
        <Card className='border-l-4 border-l-teal-400'>
          <CardContent className='p-6'>
            <div className='text-2xl font-bold'>{kpis.drafts}</div>
            <div className='text-muted-foreground text-xs'>Drafts</div>
          </CardContent>
        </Card>
      </div>

      <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
        <div className='relative flex-1'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
          <Input
            placeholder='Search exams or courses'
            value={query}
            onChange={e => setQuery(e.target.value)}
            className='pl-9'
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className='sm:w-52'>
            <SelectValue placeholder='All statuses' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All statuses</SelectItem>
            <SelectItem value='Draft'>Draft</SelectItem>
            <SelectItem value='Active'>Active</SelectItem>
            <SelectItem value='Published'>Published</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className='p-0'>
          {loading ? (
            <div className='space-y-2 p-4'>
              {[...Array(5)].map((_, i) => (
                <div key={i} className='bg-muted h-12 w-full animate-pulse rounded' />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className='flex flex-col items-center justify-center gap-2 p-12 text-center'>
              <GraduationCap className='text-muted-foreground h-8 w-8' />
              <div className='font-medium'>
                {orgQuizzes.length === 0 ? 'No exams yet' : 'No exams match'}
              </div>
              <p className='text-muted-foreground text-sm'>
                {orgQuizzes.length === 0
                  ? 'Exams built in your class lessons will appear here.'
                  : 'Try adjusting your filters.'}
              </p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table className='min-w-[820px]'>
                <TableHeader>
                  <TableRow>
                    <TableHead className='whitespace-nowrap'>Exam</TableHead>
                    <TableHead className='whitespace-nowrap'>Course</TableHead>
                    <TableHead className='whitespace-nowrap'>Duration</TableHead>
                    <TableHead className='whitespace-nowrap'>Attempts</TableHead>
                    <TableHead className='whitespace-nowrap'>Passing score</TableHead>
                    <TableHead className='whitespace-nowrap'>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(q => {
                    const st = statusOf(q);
                    return (
                      <TableRow key={q.uuid}>
                        <TableCell className='whitespace-nowrap'>
                          <div className='font-medium'>{q.title}</div>
                          {q.description && (
                            <div className='text-muted-foreground max-w-xs truncate text-xs'>
                              {q.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className='whitespace-nowrap'>
                          {classTitleByUuid.get(q.class_definition_uuid ?? '') ?? '—'}
                        </TableCell>
                        <TableCell className='whitespace-nowrap'>
                          {q.is_timed ? (
                            <span className='inline-flex items-center gap-1'>
                              <Timer className='text-muted-foreground h-3 w-3' />
                              {q.time_limit_display ?? `${q.time_limit_minutes} min`}
                            </span>
                          ) : (
                            <span className='text-muted-foreground'>Untimed</span>
                          )}
                        </TableCell>
                        <TableCell className='whitespace-nowrap'>
                          {q.attempts_allowed ?? '—'}
                        </TableCell>
                        <TableCell className='whitespace-nowrap'>
                          {q.passing_score != null ? `${q.passing_score}%` : '—'}
                        </TableCell>
                        <TableCell className='whitespace-nowrap'>
                          <Badge className={STATUS_STYLE[st]} variant='secondary'>
                            {st}
                          </Badge>
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
