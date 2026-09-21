'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

import { DataTable, SectionCard, StatusBadge, surfaceTheme } from '@/components/data-display';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { CertificateTemplate, ContentType, DifficultyLevel, GradingLevel } from '@/services/client';
import { ConfirmDialog } from '../components/confirm-dialog';
import { FormSheet } from '../components/form-sheet';
import { SectionBoundary } from '../components/section-boundary';
import { UnderlineTabs } from '../components/underline-tabs';
import {
  type CertificateTemplateValues,
  type ContentTypeValues,
  type DifficultyLevelValues,
  type GradingLevelValues,
  TEMPLATE_TYPES,
  useCertificateTemplates,
  useContentTypes,
  useDeleteCertificateTemplate,
  useDeleteContentType,
  useDeleteDifficultyLevel,
  useDeleteGradingLevel,
  useDifficultyLevels,
  useDocumentTypeCatalogue,
  useGradingLevels,
  useSaveCertificateTemplate,
  useSaveContentType,
  useSaveDifficultyLevel,
  useSaveGradingLevel,
} from '../hooks/use-config-lists';
import { adminRoutes } from '../lib/admin-routes';
import { enumParam } from '../state/search-state';
import { useSearchState } from '../state/use-search-state';
import { SecurityBanner } from './categories-page';

const TABS = ['content-types', 'difficulty', 'grading', 'certificates', 'document-types'] as const;
type ConfigTab = (typeof TABS)[number];
const tabParam = enumParam(TABS, 'content-types');

const TAB_LABELS: Record<ConfigTab, string> = {
  'content-types': 'Content types',
  difficulty: 'Difficulty levels',
  grading: 'Grading levels',
  certificates: 'Certificate templates',
  'document-types': 'Document types',
};

export function ConfigPage() {
  const [tab] = useSearchState<ConfigTab>('tab', tabParam);

  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <PageHeader
          eyebrow='Platform'
          title='Configuration lists'
          description='The vocabularies the rest of the platform picks from.'
        />

        <SecurityBanner />

        <UnderlineTabs
          active={tab}
          tabs={TABS.map(id => ({ id, label: TAB_LABELS[id], href: adminRoutes.config(id) }))}
        />

        {tab === 'content-types' ? <ContentTypesTab /> : null}
        {tab === 'difficulty' ? <DifficultyTab /> : null}
        {tab === 'grading' ? <GradingTab /> : null}
        {tab === 'certificates' ? <CertificatesTab /> : null}
        {tab === 'document-types' ? <DocumentTypesTab /> : null}
      </div>
    </div>
  );
}

function ContentTypesTab() {
  const { contentTypes, totalRows, pageCount, query } = useContentTypes();
  const save = useSaveContentType();
  const remove = useDeleteContentType();

  const [editing, setEditing] = useState<{ item?: ContentType } | null>(null);
  const [values, setValues] = useState<ContentTypeValues>({ name: '', mime_types: [] });
  const [mimeText, setMimeText] = useState('');
  const [confirmSave, setConfirmSave] = useState(false);
  const [deleting, setDeleting] = useState<ContentType | null>(null);

  const open = (item?: ContentType) => {
    setValues({
      name: item?.name ?? '',
      mime_types: item?.mime_types ?? [],
      max_file_size_mb: item?.max_file_size_mb ?? null,
    });
    setMimeText((item?.mime_types ?? []).join(', '));
    setEditing({ item });
  };

  const parsedMimes = mimeText
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);

  const error = !values.name.trim()
    ? 'A content type needs a name.'
    : parsedMimes.length === 0
      ? 'List at least one MIME type.'
      : undefined;

  return (
    <SectionCard
      title='Content types'
      description='What lesson content may be uploaded, and how large'
      actions={
        <Button size='sm' className='rounded-md' onClick={() => open()}>
          <Plus className='mr-1.5 size-3.5' />
          New content type
        </Button>
      }
    >
      <SectionBoundary
        label='the content types'
        loading={query.isLoading && contentTypes.length === 0}
        error={query.error}
        onRetry={query.refetch}
        empty={!query.isLoading && contentTypes.length === 0}
        emptyTitle='No content types yet'
        emptyDescription='Add the first upload type lessons may use.'
      >
        <DataTable
          hideToolbar
          data={contentTypes}
          isLoading={query.isLoading}
          getRowId={row => row.uuid ?? row.name}
          serverPagination={{ page: 0, pageCount, totalRows, onPageChange: () => {} }}
          columns={[
            { id: 'name', header: 'Name', cell: ({ row }) => row.original.name },
            {
              id: 'mime',
              header: 'MIME types',
              cell: ({ row }) => (
                <div className='flex flex-wrap gap-1'>
                  {(row.original.mime_types ?? []).slice(0, 4).map(mime => (
                    <Badge key={mime} variant='secondary' className='rounded-sm font-mono text-[11px]'>
                      {mime}
                    </Badge>
                  ))}
                  {(row.original.mime_types ?? []).length > 4 ? (
                    <span className='text-muted-foreground text-xs'>
                      +{(row.original.mime_types ?? []).length - 4}
                    </span>
                  ) : null}
                </div>
              ),
            },
            {
              id: 'size',
              header: 'Max size',
              cell: ({ row }) => (
                <span className='text-muted-foreground text-sm'>
                  {row.original.size_limit_display || `${row.original.max_file_size_mb ?? '—'} MB`}
                </span>
              ),
            },
            {
              id: 'category',
              header: 'Upload category',
              cell: ({ row }) => (
                <span className='text-muted-foreground text-sm'>
                  {row.original.upload_category || '—'}
                </span>
              ),
            },
            {
              id: 'actions',
              header: '',
              cell: ({ row }) => (
                <RowActions onEdit={() => open(row.original)} onDelete={() => setDeleting(row.original)} />
              ),
            },
          ]}
        />
      </SectionBoundary>

      <FormSheet
        open={editing !== null}
        onOpenChange={openState => {
          if (!openState) setEditing(null);
        }}
        title={editing?.item ? `Edit ${editing.item.name}` : 'New content type'}
        isDirty={values.name.trim().length > 0}
        isPending={save.isPending}
        submitLabel='Save content type'
        onSubmit={() => {
          if (error) return;
          setConfirmSave(true);
        }}
      >
        <div className='space-y-1.5'>
          <Label htmlFor='ct-name' className='text-sm font-semibold'>
            Name <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='ct-name'
            value={values.name}
            maxLength={50}
            className='rounded-md'
            onChange={event => setValues(current => ({ ...current, name: event.target.value }))}
          />
        </div>
        <div className='space-y-1.5'>
          <Label htmlFor='ct-mimes' className='text-sm font-semibold'>
            MIME types <span className='text-destructive'>*</span>
          </Label>
          <Textarea
            id='ct-mimes'
            rows={3}
            value={mimeText}
            placeholder='video/mp4, video/webm'
            className='rounded-md font-mono text-xs'
            onChange={event => setMimeText(event.target.value)}
          />
          <p className='text-muted-foreground text-xs'>Separate them with commas.</p>
        </div>
        <div className='space-y-1.5'>
          <Label htmlFor='ct-size' className='text-sm font-semibold'>
            Maximum size (MB)
          </Label>
          <Input
            id='ct-size'
            type='number'
            min={1}
            value={values.max_file_size_mb ?? ''}
            className='rounded-md'
            onChange={event =>
              setValues(current => ({
                ...current,
                max_file_size_mb: event.target.value ? Number(event.target.value) : null,
              }))
            }
          />
        </div>
        {error ? <p className='text-destructive text-xs'>{error}</p> : null}
      </FormSheet>

      <ConfirmDialog
        open={confirmSave}
        onOpenChange={setConfirmSave}
        action='saveContentType'
        subject={{ name: values.name.trim() }}
        isPending={save.isPending}
        onConfirm={() =>
          save.mutate(
            { uuid: editing?.item?.uuid, values: { ...values, mime_types: parsedMimes } },
            {
              onSuccess: () => {
                setConfirmSave(false);
                setEditing(null);
              },
            }
          )
        }
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={openState => {
          if (!openState) setDeleting(null);
        }}
        action='deleteContentType'
        subject={{ name: deleting?.name ?? '', confirmValue: deleting?.name ?? '' }}
        isPending={remove.isPending}
        onConfirm={() => {
          if (!deleting?.uuid) return;
          remove.mutate(
            { uuid: deleting.uuid, name: deleting.name },
            { onSuccess: () => setDeleting(null) }
          );
        }}
      />
    </SectionCard>
  );
}

function DifficultyTab() {
  const { levels, query } = useDifficultyLevels();
  const save = useSaveDifficultyLevel();
  const remove = useDeleteDifficultyLevel();

  const [editing, setEditing] = useState<{ item?: DifficultyLevel } | null>(null);
  const [values, setValues] = useState<DifficultyLevelValues>({ name: '', level_order: 1 });
  const [confirmSave, setConfirmSave] = useState(false);
  const [deleting, setDeleting] = useState<DifficultyLevel | null>(null);

  const open = (item?: DifficultyLevel) => {
    setValues({
      name: item?.name ?? '',
      level_order: item?.level_order ?? levels.length + 1,
      description: item?.description ?? '',
    });
    setEditing({ item });
  };

  return (
    <SectionCard
      title='Difficulty levels'
      description='The ladder a course is placed on'
      actions={
        <div className='flex items-center gap-2'>
          <Button size='sm' variant='outline' className='rounded-md' disabled>
            Reorder
          </Button>
          <Button size='sm' className='rounded-md' onClick={() => open()}>
            <Plus className='mr-1.5 size-3.5' />
            New level
          </Button>
        </div>
      }
    >
      <p className='text-muted-foreground mb-3 text-xs'>
        Reordering is switched off: the endpoint writes one row at a time against a unique
        constraint, so swapping two levels fails halfway. Set the order on each level instead until
        the backend can reorder in one transaction.
      </p>

      <SectionBoundary
        label='the difficulty levels'
        loading={query.isLoading && levels.length === 0}
        error={query.error}
        onRetry={query.refetch}
        empty={!query.isLoading && levels.length === 0}
        emptyTitle='No difficulty levels yet'
        emptyDescription='Add the first level a course can be set to.'
      >
        <ul className='divide-border/60 divide-y'>
          {levels.map(level => (
            <li key={level.uuid} className='flex items-center gap-3 py-2.5'>
              <span className='bg-muted text-muted-foreground flex size-7 items-center justify-center rounded-md font-mono text-xs'>
                {level.level_order}
              </span>
              <div className='min-w-0 flex-1'>
                <p className='text-foreground text-sm font-medium'>{level.name}</p>
                {level.description ? (
                  <p className='text-muted-foreground truncate text-xs'>{level.description}</p>
                ) : null}
              </div>
              {level.is_entry_level ? <StatusBadge tone='info' label='Entry level' /> : null}
              <RowActions onEdit={() => open(level)} onDelete={() => setDeleting(level)} />
            </li>
          ))}
        </ul>
      </SectionBoundary>

      <FormSheet
        open={editing !== null}
        onOpenChange={openState => {
          if (!openState) setEditing(null);
        }}
        title={editing?.item ? `Edit ${editing.item.name}` : 'New difficulty level'}
        isDirty={values.name.trim().length > 0}
        isPending={save.isPending}
        submitLabel='Save level'
        onSubmit={() => {
          if (!values.name.trim()) return;
          setConfirmSave(true);
        }}
      >
        <div className='space-y-1.5'>
          <Label htmlFor='dl-name' className='text-sm font-semibold'>
            Name <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='dl-name'
            value={values.name}
            maxLength={50}
            className='rounded-md'
            onChange={event => setValues(current => ({ ...current, name: event.target.value }))}
          />
        </div>
        <div className='space-y-1.5'>
          <Label htmlFor='dl-order' className='text-sm font-semibold'>
            Order
          </Label>
          <Input
            id='dl-order'
            type='number'
            min={1}
            max={10}
            value={values.level_order}
            className='rounded-md'
            onChange={event =>
              setValues(current => ({ ...current, level_order: Number(event.target.value) || 1 }))
            }
          />
          <p className='text-muted-foreground text-xs'>1 to 10, and unique across all levels.</p>
        </div>
        <div className='space-y-1.5'>
          <Label htmlFor='dl-description' className='text-sm font-semibold'>
            Description
          </Label>
          <Textarea
            id='dl-description'
            rows={3}
            maxLength={500}
            value={values.description ?? ''}
            className='rounded-md'
            onChange={event =>
              setValues(current => ({ ...current, description: event.target.value }))
            }
          />
        </div>
      </FormSheet>

      <ConfirmDialog
        open={confirmSave}
        onOpenChange={setConfirmSave}
        action='saveDifficultyLevel'
        subject={{ name: values.name.trim() }}
        isPending={save.isPending}
        onConfirm={() =>
          save.mutate(
            { uuid: editing?.item?.uuid, values },
            {
              onSuccess: () => {
                setConfirmSave(false);
                setEditing(null);
              },
            }
          )
        }
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={openState => {
          if (!openState) setDeleting(null);
        }}
        action='deleteDifficultyLevel'
        subject={{ name: deleting?.name ?? '', confirmValue: deleting?.name ?? '' }}
        isPending={remove.isPending}
        onConfirm={() => {
          if (!deleting?.uuid) return;
          remove.mutate(
            { uuid: deleting.uuid, name: deleting.name },
            { onSuccess: () => setDeleting(null) }
          );
        }}
      />
    </SectionCard>
  );
}

function GradingTab() {
  const { levels, totalRows, pageCount, query } = useGradingLevels();
  const save = useSaveGradingLevel();
  const remove = useDeleteGradingLevel();

  const [editing, setEditing] = useState<{ item?: GradingLevel } | null>(null);
  const [values, setValues] = useState<GradingLevelValues>({ name: '', points: 1, level_order: 1 });
  const [confirmSave, setConfirmSave] = useState(false);
  const [deleting, setDeleting] = useState<GradingLevel | null>(null);

  const open = (item?: GradingLevel) => {
    setValues({
      name: item?.name ?? '',
      points: item?.points ?? 1,
      level_order: item?.level_order ?? levels.length + 1,
    });
    setEditing({ item });
  };

  return (
    <SectionCard
      title='Grading levels'
      description='What a grader can award, and what each grade is worth'
      actions={
        <Button size='sm' className='rounded-md' onClick={() => open()}>
          <Plus className='mr-1.5 size-3.5' />
          New grading level
        </Button>
      }
    >
      <SectionBoundary
        label='the grading levels'
        loading={query.isLoading && levels.length === 0}
        error={query.error}
        onRetry={query.refetch}
        empty={!query.isLoading && levels.length === 0}
        emptyTitle='No grading levels yet'
        emptyDescription='Add the first grade that can be awarded.'
      >
        <DataTable
          hideToolbar
          data={levels}
          isLoading={query.isLoading}
          getRowId={row => row.uuid ?? row.name}
          serverPagination={{ page: 0, pageCount, totalRows, onPageChange: () => {} }}
          columns={[
            { id: 'name', header: 'Grade', cell: ({ row }) => row.original.name },
            {
              id: 'points',
              header: 'Points',
              cell: ({ row }) => <span className='font-mono text-xs'>{row.original.points}</span>,
            },
            {
              id: 'order',
              header: 'Order',
              cell: ({ row }) => (
                <span className='font-mono text-xs'>{row.original.level_order}</span>
              ),
            },
            {
              id: 'display',
              header: 'Shown as',
              cell: ({ row }) => (
                <span className='text-muted-foreground text-sm'>
                  {row.original.grade_display || '—'}
                </span>
              ),
            },
            {
              id: 'actions',
              header: '',
              cell: ({ row }) => (
                <RowActions onEdit={() => open(row.original)} onDelete={() => setDeleting(row.original)} />
              ),
            },
          ]}
        />
      </SectionBoundary>

      <FormSheet
        open={editing !== null}
        onOpenChange={openState => {
          if (!openState) setEditing(null);
        }}
        title={editing?.item ? `Edit ${editing.item.name}` : 'New grading level'}
        isDirty={values.name.trim().length > 0}
        isPending={save.isPending}
        submitLabel='Save level'
        onSubmit={() => {
          if (!values.name.trim()) return;
          setConfirmSave(true);
        }}
      >
        <div className='space-y-1.5'>
          <Label htmlFor='gl-name' className='text-sm font-semibold'>
            Name <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='gl-name'
            value={values.name}
            maxLength={50}
            className='rounded-md'
            onChange={event => setValues(current => ({ ...current, name: event.target.value }))}
          />
        </div>
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-1.5'>
            <Label htmlFor='gl-points' className='text-sm font-semibold'>
              Points
            </Label>
            <Input
              id='gl-points'
              type='number'
              min={1}
              max={10}
              value={values.points}
              className='rounded-md'
              onChange={event =>
                setValues(current => ({ ...current, points: Number(event.target.value) || 1 }))
              }
            />
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='gl-order' className='text-sm font-semibold'>
              Order
            </Label>
            <Input
              id='gl-order'
              type='number'
              min={1}
              max={10}
              value={values.level_order}
              className='rounded-md'
              onChange={event =>
                setValues(current => ({ ...current, level_order: Number(event.target.value) || 1 }))
              }
            />
          </div>
        </div>
        <p className='text-muted-foreground text-xs'>
          Points and order both run 1 to 10, and the order has to be unique.
        </p>
      </FormSheet>

      <ConfirmDialog
        open={confirmSave}
        onOpenChange={setConfirmSave}
        action='saveGradingLevel'
        subject={{ name: values.name.trim() }}
        isPending={save.isPending}
        onConfirm={() =>
          save.mutate(
            { uuid: editing?.item?.uuid, values },
            {
              onSuccess: () => {
                setConfirmSave(false);
                setEditing(null);
              },
            }
          )
        }
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={openState => {
          if (!openState) setDeleting(null);
        }}
        action='deleteGradingLevel'
        subject={{ name: deleting?.name ?? '', confirmValue: deleting?.name ?? '' }}
        isPending={remove.isPending}
        onConfirm={() => {
          if (!deleting?.uuid) return;
          remove.mutate(
            { uuid: deleting.uuid, name: deleting.name },
            { onSuccess: () => setDeleting(null) }
          );
        }}
      />
    </SectionCard>
  );
}

function CertificatesTab() {
  const { templates, totalRows, pageCount, query } = useCertificateTemplates();
  const save = useSaveCertificateTemplate();
  const remove = useDeleteCertificateTemplate();

  const [editing, setEditing] = useState<{ item?: CertificateTemplate } | null>(null);
  const [values, setValues] = useState<CertificateTemplateValues>({
    name: '',
    template_type: 'course_completion',
    template_html: '',
    active: true,
  });
  const [confirmSave, setConfirmSave] = useState(false);
  const [deleting, setDeleting] = useState<CertificateTemplate | null>(null);

  const open = (item?: CertificateTemplate) => {
    setValues({
      name: item?.name ?? '',
      template_type: (item?.template_type as string) ?? 'course_completion',
      template_html: item?.template_html ?? '',
      template_css: item?.template_css ?? '',
      background_image_url: item?.background_image_url ?? '',
      active: item?.active ?? true,
    });
    setEditing({ item });
  };

  const error = !values.name.trim()
    ? 'A template needs a name.'
    : !values.template_html.trim()
      ? 'The HTML is required — the database refuses a template without it.'
      : undefined;

  return (
    <SectionCard
      title='Certificate templates'
      description='The layouts certificates are issued with'
      actions={
        <Button size='sm' className='rounded-md' onClick={() => open()}>
          <Plus className='mr-1.5 size-3.5' />
          New template
        </Button>
      }
    >
      <p className='text-muted-foreground mb-3 text-xs'>
        Only the three types the backend accepts are offered here; the generated client still lists
        an older set. There is no preview endpoint, so a template can only be checked once a
        certificate is issued.
      </p>

      <SectionBoundary
        label='the certificate templates'
        loading={query.isLoading && templates.length === 0}
        error={query.error}
        onRetry={query.refetch}
        empty={!query.isLoading && templates.length === 0}
        emptyTitle='No templates yet'
        emptyDescription='Add the first certificate layout.'
      >
        <DataTable
          hideToolbar
          data={templates}
          isLoading={query.isLoading}
          getRowId={row => row.uuid ?? row.name}
          serverPagination={{ page: 0, pageCount, totalRows, onPageChange: () => {} }}
          columns={[
            { id: 'name', header: 'Template', cell: ({ row }) => row.original.name },
            {
              id: 'type',
              header: 'Type',
              cell: ({ row }) => (
                <span className='text-muted-foreground text-sm'>
                  {String(row.original.template_type ?? '').replace(/_/g, ' ')}
                </span>
              ),
            },
            {
              id: 'complexity',
              header: 'Design',
              cell: ({ row }) => (
                <span className='text-muted-foreground text-sm'>
                  {row.original.design_complexity || '—'}
                </span>
              ),
            },
            {
              id: 'active',
              header: 'Status',
              cell: ({ row }) => (
                <StatusBadge status={row.original.active ? 'active' : 'inactive'} />
              ),
            },
            {
              id: 'actions',
              header: '',
              cell: ({ row }) => (
                <RowActions onEdit={() => open(row.original)} onDelete={() => setDeleting(row.original)} />
              ),
            },
          ]}
        />
      </SectionBoundary>

      <FormSheet
        open={editing !== null}
        onOpenChange={openState => {
          if (!openState) setEditing(null);
        }}
        width='wide'
        title={editing?.item ? `Edit ${editing.item.name}` : 'New certificate template'}
        isDirty={values.name.trim().length > 0}
        isPending={save.isPending}
        submitLabel='Save template'
        onSubmit={() => {
          if (error) return;
          setConfirmSave(true);
        }}
      >
        <div className='space-y-1.5'>
          <Label htmlFor='tpl-name' className='text-sm font-semibold'>
            Name <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='tpl-name'
            value={values.name}
            maxLength={255}
            className='rounded-md'
            onChange={event => setValues(current => ({ ...current, name: event.target.value }))}
          />
        </div>
        <div className='space-y-1.5'>
          <Label className='text-sm font-semibold'>Type</Label>
          <Select
            value={values.template_type}
            onValueChange={value => setValues(current => ({ ...current, template_type: value }))}
          >
            <SelectTrigger className='rounded-md'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TEMPLATE_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='space-y-1.5'>
          <Label htmlFor='tpl-html' className='text-sm font-semibold'>
            HTML <span className='text-destructive'>*</span>
          </Label>
          <Textarea
            id='tpl-html'
            rows={8}
            maxLength={20000}
            value={values.template_html}
            className='rounded-md font-mono text-xs'
            onChange={event =>
              setValues(current => ({ ...current, template_html: event.target.value }))
            }
          />
        </div>
        <div className='space-y-1.5'>
          <Label htmlFor='tpl-css' className='text-sm font-semibold'>
            CSS
          </Label>
          <Textarea
            id='tpl-css'
            rows={5}
            maxLength={50000}
            value={values.template_css ?? ''}
            className='rounded-md font-mono text-xs'
            onChange={event =>
              setValues(current => ({ ...current, template_css: event.target.value }))
            }
          />
        </div>
        <div className='space-y-1.5'>
          <Label htmlFor='tpl-bg' className='text-sm font-semibold'>
            Background image URL
          </Label>
          <Input
            id='tpl-bg'
            value={values.background_image_url ?? ''}
            maxLength={500}
            className='rounded-md'
            onChange={event =>
              setValues(current => ({ ...current, background_image_url: event.target.value }))
            }
          />
        </div>
        <div className='flex items-center justify-between gap-4'>
          <Label htmlFor='tpl-active' className='text-sm font-semibold'>
            Active
          </Label>
          <Switch
            id='tpl-active'
            checked={values.active}
            onCheckedChange={checked => setValues(current => ({ ...current, active: checked }))}
          />
        </div>
        {error ? <p className='text-destructive text-xs'>{error}</p> : null}
      </FormSheet>

      <ConfirmDialog
        open={confirmSave}
        onOpenChange={setConfirmSave}
        action='saveCertificateTemplate'
        subject={{ name: values.name.trim() }}
        isPending={save.isPending}
        onConfirm={() =>
          save.mutate(
            { uuid: editing?.item?.uuid, values },
            {
              onSuccess: () => {
                setConfirmSave(false);
                setEditing(null);
              },
            }
          )
        }
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={openState => {
          if (!openState) setDeleting(null);
        }}
        action='deleteCertificateTemplate'
        subject={{ name: deleting?.name ?? '', confirmValue: deleting?.name ?? '' }}
        isPending={remove.isPending}
        onConfirm={() => {
          if (!deleting?.uuid) return;
          remove.mutate(
            { uuid: deleting.uuid, name: deleting.name },
            { onSuccess: () => setDeleting(null) }
          );
        }}
      />
    </SectionCard>
  );
}

function DocumentTypesTab() {
  const { documentTypes, query } = useDocumentTypeCatalogue();

  return (
    <SectionCard
      title='Document types'
      description='What onboarding asks people and organisations to upload'
    >
      <p className='text-muted-foreground mb-3 text-xs'>
        Read-only: these rows are seeded by database migration and have no create, update or delete
        endpoint. Changing them is a backend job.
      </p>

      <SectionBoundary
        label='the document types'
        loading={query.isLoading && documentTypes.length === 0}
        error={query.error}
        onRetry={query.refetch}
        empty={!query.isLoading && documentTypes.length === 0}
        emptyTitle='No document types'
        emptyDescription='Nothing has been seeded yet.'
      >
        <DataTable
          hideToolbar
          data={documentTypes}
          isLoading={query.isLoading}
          getRowId={row => row.uuid ?? row.name ?? ''}
          columns={[
            {
              id: 'name',
              header: 'Document',
              cell: ({ row }) => (
                <div className='min-w-0'>
                  <p className='text-foreground truncate text-sm font-medium'>{row.original.name}</p>
                  {row.original.description ? (
                    <p className='text-muted-foreground truncate text-xs'>
                      {row.original.description}
                    </p>
                  ) : null}
                </div>
              ),
            },
            {
              id: 'applies',
              header: 'Asked in',
              cell: ({ row }) => (
                <span className='text-muted-foreground text-sm'>
                  {row.original.applies_to === 'ORGANISATION' ? 'Organisation' : 'Credentials'}
                </span>
              ),
            },
            {
              id: 'required',
              header: 'Required',
              cell: ({ row }) =>
                row.original.is_required ? (
                  <StatusBadge tone='warning' label='Required' />
                ) : (
                  <span className='text-muted-foreground text-sm'>Optional</span>
                ),
            },
            {
              id: 'expiry',
              header: 'Expiry',
              cell: ({ row }) => (
                <span className='text-muted-foreground text-sm'>
                  {row.original.requires_expiry ? 'Carries an expiry' : 'No expiry'}
                </span>
              ),
            },
            {
              id: 'limits',
              header: 'Upload limits',
              cell: ({ row }) => (
                <span className='text-muted-foreground text-xs'>
                  {row.original.max_file_size_mb ? `${row.original.max_file_size_mb} MB` : '—'}
                  {row.original.allowed_extensions?.length
                    ? ` · ${row.original.allowed_extensions.join(', ')}`
                    : ''}
                </span>
              ),
            },
          ]}
        />
      </SectionBoundary>
    </SectionCard>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className='flex justify-end gap-2'>
      <Button variant='outline' size='sm' className='rounded-md' onClick={onEdit}>
        Edit
      </Button>
      <Button
        variant='outline'
        size='sm'
        className='text-destructive border-destructive/40 rounded-md'
        onClick={onDelete}
      >
        Delete
      </Button>
    </div>
  );
}
