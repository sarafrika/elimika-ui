'use client';

import {
  BookOpen,
  CheckCircle2,
  Clock3,
  GraduationCap,
  MoreHorizontal,
  Paperclip,
  Pencil,
  School,
  Search,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';

import { StatCard } from '@/app/dashboard/student/skills-wallet/_components/SkillsWalletShared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import type { UserDocument, UserEducation } from '@/services/client/types.gen';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';

const VIEW_TABS = ['All Education', 'By Field', 'Verified', 'Pending', 'With Evidence'] as const;
const STATUS_FILTERS = ['All Statuses', 'Verified', 'Pending', 'Rejected', 'Expired'] as const;

export function verificationStatus(documents: UserDocument[]) {
  if (documents.some(document => document.status === 'Rejected')) return 'Rejected';
  if (documents.some(document => document.status === 'Expired')) return 'Expired';
  if (documents.length && documents.every(document => document.is_verified || document.status === 'Approved'))
    return 'Verified';
  return 'Pending';
}

type SkillsWalletEducationListProps = {
  education: UserEducation[];
  documentsByEducation: Map<string, UserDocument[]>;
  onEdit?: (education: UserEducation) => void;
  onDelete?: (education: UserEducation) => void;
};

export function SkillsWalletEducationList({
  education,
  documentsByEducation,
  onEdit,
  onDelete,
}: SkillsWalletEducationListProps) {
  const [activeView, setActiveView] = useState<(typeof VIEW_TABS)[number]>('All Education');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  const records = useMemo(() => education.map(item => {
    const documents = item.uuid ? documentsByEducation.get(item.uuid) ?? [] : [];
    return { education: item, documents, status: verificationStatus(documents) };
  }), [education, documentsByEducation]);

  const summary = useMemo(() => {
    const fields = new Map<string, number>();
    const schools = new Set<string>();
    let verified = 0;
    let pending = 0;
    for (const record of records) {
      const field = record.education.field_of_study?.trim() || 'Not specified';
      fields.set(field, (fields.get(field) ?? 0) + 1);
      if (record.education.school_name.trim()) schools.add(record.education.school_name.trim());
      if (record.status === 'Verified') verified++;
      if (record.status === 'Pending') pending++;
    }
    return {
      verified,
      pending,
      schools: schools.size,
      fieldCount: [...fields.keys()].filter(field => field !== 'Not specified').length,
      fields: [...fields].map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    };
  }, [records]);

  const stats = [
    { icon: GraduationCap, label: 'Qualifications', value: records.length, tint: 'bg-primary/10 text-primary', sub: 'Saved education records' },
    { icon: CheckCircle2, label: 'Verified', value: summary.verified, tint: 'bg-success/10 text-success', sub: 'Evidence verified' },
    { icon: Clock3, label: 'Pending', value: summary.pending, tint: 'bg-warning/10 text-warning', sub: 'Awaiting verification' },
    { icon: School, label: 'Institutions', value: summary.schools, tint: 'bg-secondary text-secondary-foreground', sub: 'Schools and awarding bodies' },
    { icon: BookOpen, label: 'Fields of Study', value: summary.fieldCount, tint: 'bg-muted text-foreground', sub: 'Across your qualifications' },
  ];

  const filteredRecords = useMemo(() => records.filter(record => {
    if (activeView === 'Verified' && record.status !== 'Verified') return false;
    if (activeView === 'Pending' && record.status !== 'Pending') return false;
    if (activeView === 'With Evidence' && !record.documents.length) return false;
    if (statusFilter !== 'All Statuses' && record.status !== statusFilter) return false;
    const item = record.education;
    return !deferredSearch || [
      item.qualification,
      item.field_of_study,
      item.school_name,
      item.year_completed?.toString(),
      item.certificate_number,
    ].some(value => value?.toLowerCase().includes(deferredSearch));
  }).sort((a, b) => activeView === 'By Field'
    ? (a.education.field_of_study ?? '').localeCompare(b.education.field_of_study ?? '') ||
      a.education.qualification.localeCompare(b.education.qualification)
    : 0), [records, activeView, statusFilter, deferredSearch]);

  return (
    <>
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-5'>
        {stats.map(stat => <StatCard key={stat.label} {...stat} />)}
      </div>

      <div className='grid gap-4 lg:grid-cols-4'>
        <Card className='min-w-0 lg:col-span-3'>
          <CardHeader className='pb-3'>
            <div className='flex flex-col gap-3'>
              <div className='flex gap-4 overflow-x-auto text-sm' role='group' aria-label='Education views'>
                {VIEW_TABS.map(label => (
                  <Button
                    key={label}
                    type='button'
                    variant='ghost'
                    onClick={() => setActiveView(label)}
                    aria-pressed={label === activeView}
                    className={`h-auto shrink-0 rounded-none px-0 pb-1 text-sm hover:bg-transparent ${label === activeView
                      ? 'border-primary text-primary border-b-2 font-medium'
                      : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <div className='flex flex-wrap items-center gap-2 md:justify-end'>
                <div className='relative min-w-0 flex-1 md:max-w-64'>
                  <Search className='text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2' />
                  <Input
                    className='h-8 pl-8'
                    placeholder='Search education…'
                    aria-label='Search education'
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type='button' variant='outline' size='sm'>
                      <SlidersHorizontal className='mr-1 h-3.5 w-3.5' />
                      {statusFilter}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-48'>
                    <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                      {STATUS_FILTERS.map(status => (
                        <DropdownMenuRadioItem key={status} value={status}>{status}</DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-3'>
            {filteredRecords.length ? filteredRecords.map(({ education: item, documents, status }) => (
              <div key={item.uuid} className='space-y-3 rounded-lg border p-3 transition hover:border-primary/40'>
                <div className='flex items-start gap-4'>
                  <div className='bg-primary/10 text-primary grid h-10 w-10 shrink-0 place-items-center rounded-md'>
                    <GraduationCap className='h-5 w-5' />
                  </div>
                  <div className='grid min-w-0 flex-1 grid-cols-1 items-start gap-2 md:grid-cols-2 xl:grid-cols-4 xl:gap-4'>
                    <div className='min-w-0'>
                      <p className='font-medium break-words'>{item.qualification}</p>
                      <Badge variant={status === 'Verified' ? 'success' : 'outline'} className='mt-1 text-[10px]'>
                        {status}
                      </Badge>
                    </div>
                    <div className='min-w-0'>
                      <p className='text-muted-foreground text-[11px]'>Field of study</p>
                      <p className='text-sm break-words'>{item.field_of_study || 'Not specified'}</p>
                    </div>
                    <div className='min-w-0'>
                      <p className='text-muted-foreground text-[11px]'>Institution</p>
                      <p className='text-sm break-words'>{item.school_name}</p>
                    </div>
                    <div>
                      <p className='text-muted-foreground text-[11px]'>Year completed</p>
                      <p className='text-sm'>{item.year_completed ?? 'Not specified'}</p>
                      {item.start_year ? (
                        <p className='text-muted-foreground text-xs'>Started {item.start_year}</p>
                      ) : null}
                    </div>
                  </div>
                  {onEdit || onDelete ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type='button' size='icon' variant='ghost' className='h-8 w-8 shrink-0' disabled={!item.uuid} aria-label={`More options for ${item.qualification}`}>
                          <MoreHorizontal className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem disabled={!onEdit} onSelect={() => onEdit?.(item)}>
                          <Pencil className='h-4 w-4' />Edit education
                        </DropdownMenuItem>
                        <DropdownMenuItem variant='destructive' disabled={!onDelete} onSelect={() => onDelete?.(item)}>
                          <Trash2 className='h-4 w-4' />Delete education
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </div>
                <div className='space-y-1 border-t pt-3 text-sm'>
                  {item.certificate_number ? (
                    <p className='text-muted-foreground break-words'>Certificate number: {item.certificate_number}</p>
                  ) : null}
                  <p className='text-muted-foreground flex items-center gap-1.5 text-xs'>
                    <Paperclip className='h-3.5 w-3.5' />
                    {documents.length ? `${documents.length} evidence document${documents.length === 1 ? '' : 's'}` : 'No evidence uploaded.'}
                  </p>
                  {documents.length ? (
                    <ul className='space-y-1'>
                      {documents.map(document => {
                        const url = toAuthenticatedMediaUrl(document.file_url);
                        const label = document.original_filename || document.title || 'Education evidence';
                        return <li key={document.uuid}>{url ? (
                          <a className='text-primary break-words underline' href={url} target='_blank' rel='noopener noreferrer'>{label}</a>
                        ) : <span>{label}</span>}</li>;
                      })}
                    </ul>
                  ) : onEdit ? (
                    <p className='text-muted-foreground text-xs'>Edit this qualification to attach evidence.</p>
                  ) : null}
                </div>
              </div>
            )) : (
              <EmptyState
                variant='compact'
                icon={records.length ? Search : GraduationCap}
                title={records.length ? 'No education matches your filters' : 'No education added yet'}
                description={records.length
                  ? 'Try another view, clear the search term, or change the status filter.'
                  : 'Add a qualification with evidence to start your education record.'}
              />
            )}
          </CardContent>
        </Card>

        <div className='min-w-0 space-y-4'>
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base'>Education by Field</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              {summary.fields.length ? summary.fields.map(field => (
                <div key={field.name}>
                  <div className='flex items-start justify-between gap-2 text-sm'>
                    <span className='min-w-0 break-words'>{field.name}</span>
                    <span className='text-muted-foreground shrink-0'>{field.count}</span>
                  </div>
                  <Progress
                    value={(field.count / records.length) * 100}
                    className='mt-1 h-1.5'
                    aria-label={`${field.name}: ${field.count} qualifications`}
                  />
                </div>
              )) : (
                <p className='text-muted-foreground text-sm'>Your fields of study will appear here.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
