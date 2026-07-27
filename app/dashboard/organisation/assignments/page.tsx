// @ts-nocheck -- 1:1 Lovable port; @hey-api generated-client type drift
'use client';

import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { FileText, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useOrganisation } from '@/context/organisation-context';
import { extractPage } from '@/lib/api-helpers';
import type { Assignment, ClassDefinition } from '@/services/client';
import {
  getAllAssignmentsOptions,
  getClassDefinitionsForOrganisationOptions,
} from '@/services/client/@tanstack/react-query.gen';

type Status = 'Draft' | 'Published' | 'Due soon' | 'Closed';

const STATUS_STYLE: Record<Status, string> = {
  Draft: 'bg-muted text-foreground',
  Published: 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200',
  'Due soon': 'bg-warning/10 text-warning',
  Closed: 'bg-success/10 text-success',
};

const statusOf = (a: Assignment): Status => {
  if (!a.is_published) return 'Draft';
  if (!a.due_date) return 'Published';
  const due = dayjs(a.due_date);
  if (due.isBefore(dayjs(), 'day')) return 'Closed';
  if (due.diff(dayjs(), 'day') <= 7) return 'Due soon';
  return 'Published';
};

export default function AssignmentsPage() {
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

  const assignmentsQuery = useQuery({
    ...getAllAssignmentsOptions({ query: { pageable: { page: 0, size: 200 } } }),
    enabled: classTitleByUuid.size > 0,
  });

  // Org-scoped: only assignments attached to one of this org's class definitions.
  const orgAssignments = useMemo(
    () =>
      extractPage<Assignment>(assignmentsQuery.data).items.filter(
        a => a.class_definition_uuid && classTitleByUuid.has(a.class_definition_uuid)
      ),
    [assignmentsQuery.data, classTitleByUuid]
  );

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<string>('all');

  const rows = useMemo(
    () =>
      orgAssignments.filter(a => {
        if (status !== 'all' && statusOf(a) !== status) return false;
        if (query) {
          const course = classTitleByUuid.get(a.class_definition_uuid ?? '') ?? '';
          if (!`${a.title} ${course}`.toLowerCase().includes(query.toLowerCase())) return false;
        }
        return true;
      }),
    [orgAssignments, status, query, classTitleByUuid]
  );

  const kpis = useMemo(() => {
    const published = orgAssignments.filter(a => a.is_published).length;
    const drafts = orgAssignments.filter(a => !a.is_published).length;
    const dueSoon = orgAssignments.filter(a => statusOf(a) === 'Due soon').length;
    return { total: orgAssignments.length, published, drafts, dueSoon };
  }, [orgAssignments]);

  const loading = classesQuery.isLoading || assignmentsQuery.isLoading;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]">
      <PageHeader
        title="Assignments"
        description="Create, distribute, and grade student assignments."
        action={
          <Button onClick={() => toast.info('New assignment', { description: 'Assignments are created from within a class lesson.' })}>
            <Plus className="mr-2 h-4 w-4" />
            New Assignment
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{kpis.total}</div>
            <div className="text-xs text-muted-foreground">Total assignments</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-sky-500">
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{kpis.published}</div>
            <div className="text-xs text-muted-foreground">Published</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-warning">
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{kpis.dueSoon}</div>
            <div className="text-xs text-muted-foreground">Due soon</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-teal-400">
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{kpis.drafts}</div>
            <div className="text-xs text-muted-foreground">Drafts</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search assignments or courses" value={query} onChange={e => setQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-52">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Published">Published</SelectItem>
            <SelectItem value="Due soon">Due soon</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 w-full animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <div className="font-medium">{orgAssignments.length === 0 ? 'No assignments yet' : 'No assignments match'}</div>
              <p className="text-sm text-muted-foreground">
                {orgAssignments.length === 0 ? 'Assignments created in your class lessons will appear here.' : 'Try adjusting your filters.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[820px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Assignment</TableHead>
                    <TableHead className="whitespace-nowrap">Course</TableHead>
                    <TableHead className="whitespace-nowrap">Due</TableHead>
                    <TableHead className="whitespace-nowrap">Points</TableHead>
                    <TableHead className="whitespace-nowrap">Submission types</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(a => {
                    const st = statusOf(a);
                    return (
                      <TableRow key={a.uuid}>
                        <TableCell className="whitespace-nowrap">
                          <div className="font-medium">{a.title}</div>
                          {a.assignment_category && (
                            <div className="text-xs capitalize text-muted-foreground">
                              {String(a.assignment_category).toLowerCase().replace(/_/g, ' ')}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{classTitleByUuid.get(a.class_definition_uuid ?? '') ?? '—'}</TableCell>
                        <TableCell className="whitespace-nowrap">{a.due_date ? dayjs(a.due_date).format('DD MMM YYYY') : '—'}</TableCell>
                        <TableCell className="whitespace-nowrap">{a.points_display ?? (a.max_points != null ? `${a.max_points} pts` : '—')}</TableCell>
                        <TableCell className="max-w-xs truncate whitespace-nowrap text-muted-foreground">{a.submission_summary ?? '—'}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge className={STATUS_STYLE[st]} variant="secondary">
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
