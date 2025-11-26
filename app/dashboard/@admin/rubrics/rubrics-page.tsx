'use client';

import { AdminDataTable, type AdminDataTableColumn } from '@/components/admin/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { type AdminRubric, useAdminRubrics, useUpdateAdminRubric } from '@/services/admin';
import { zAssessmentRubric } from '@/services/client/zod.gen';
import { format } from 'date-fns';
import { ClipboardList, Loader2, NotebookPen, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

const rubricFormSchema = z.object({
  title: zAssessmentRubric.shape.title,
  description: zAssessmentRubric.shape.description.optional(),
  status: zAssessmentRubric.shape.status,
  is_public: zAssessmentRubric.shape.is_public.optional().transform(value => Boolean(value)),
  total_weight: zAssessmentRubric.shape.total_weight.optional(),
  rubric_type: zAssessmentRubric.shape.rubric_type,
});

const statusOptions = [
  { label: 'All statuses', value: 'all' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'In review', value: 'IN_REVIEW' },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Archived', value: 'ARCHIVED' },
];

const visibilityOptions = [
  { label: 'All audiences', value: 'all' },
  { label: 'Public', value: 'public' },
  { label: 'Private', value: 'private' },
];

export default function AdminRubricsPage() {
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'ARCHIVED'>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');
  const [selectedRubricId, setSelectedRubricId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { data, isLoading } = useAdminRubrics({
    page,
    size: 20,
    search: searchQuery,
    status: statusFilter,
    visibility: visibilityFilter,
  });

  const rubrics = useMemo(() => data?.items ?? [], [data?.items]);
  const totalItems = data?.totalItems ?? 0;
  const totalPages = data?.totalPages ?? 0;

  useEffect(() => {
    if (!selectedRubricId && rubrics.length > 0) {
      setSelectedRubricId(rubrics[0]?.uuid ?? null);
    }
  }, [rubrics, selectedRubricId]);

  useEffect(() => {
    if (page >= (data?.totalPages ?? 0)) {
      setPage(0);
    }
  }, [data?.totalPages, page]);

  const selectedRubric = rubrics.find(rubric => rubric.uuid === selectedRubricId) ?? null;

  const columns: AdminDataTableColumn<AdminRubric>[] = useMemo(
    () => [
      {
        id: 'title',
        header: 'Rubric',
        className: 'min-w-[220px]'
,
        cell: rubric => (
          <div className='space-y-1'>
            <div className='font-semibold'>{rubric.title}</div>
            <div className='text-muted-foreground text-sm'>{rubric.rubric_type}</div>
          </div>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        className: 'hidden sm:table-cell',
        cell: rubric => (
          <Badge variant={statusBadgeVariant(rubric.status)} className='capitalize'>
            {rubric.status?.replace(/_/g, ' ').toLowerCase()}
          </Badge>
        ),
      },
      {
        id: 'visibility',
        header: 'Visibility',
        className: 'hidden md:table-cell',
        cell: rubric => (
          <Badge variant={rubric.is_public ? 'default' : 'outline'}>{rubric.is_public ? 'Public' : 'Private'}</Badge>
        ),
      },
      {
        id: 'updated',
        header: 'Updated',
        className: 'hidden lg:table-cell text-muted-foreground',
        cell: rubric => (
          <span className='text-sm'>
            {rubric.updated_date ? format(new Date(rubric.updated_date), 'dd MMM yyyy') : '—'}
          </span>
        ),
      },
    ],
    []
  );

  const publishedCount = useMemo(() => rubrics.filter(rubric => rubric.status === 'PUBLISHED').length, [rubrics]);
  const publicCount = useMemo(() => rubrics.filter(rubric => rubric.is_public).length, [rubrics]);

  return (
    <div className='mx-auto flex w-full max-w-7xl xl:max-w-[110rem] 2xl:max-w-[130rem] flex-col gap-6 px-4 py-10 2xl:px-10'>
      <div className='relative overflow-hidden rounded-3xl border border-primary/20 bg-card p-6 shadow-sm'>
        <div className='flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
          <div className='space-y-2'>
            <Badge variant='outline' className='border-primary/60 bg-primary/10 text-xs font-semibold uppercase tracking-wide'>
              Quality assurance
            </Badge>
            <h1 className='text-3xl font-semibold tracking-tight'>Rubric library</h1>
            <p className='text-muted-foreground max-w-2xl text-sm'>
              Govern assessment quality, share reusable grading frameworks, and monitor rubric publication workflows.
            </p>
          </div>
          <div className='grid gap-3 sm:grid-cols-2'>
            <MetricCard icon={<ClipboardList className='h-5 w-5 text-primary' />} label='Total rubrics' value={totalItems} />
            <MetricCard icon={<ShieldCheck className='h-5 w-5 text-primary' />} label='Published' value={publishedCount} />
          </div>
        </div>
        <div className='mt-6 grid gap-3 sm:grid-cols-2'>
          <MetricCard icon={<NotebookPen className='h-5 w-5 text-primary' />} label='Public templates' value={publicCount} />
          <MetricCard icon={<Badge className='bg-primary/20 text-primary'>%</Badge>} label='Avg total weight' value={averageWeight(rubrics)} />
        </div>
      </div>

      <AdminDataTable
        title='Assessment rubrics'
        description='Track publication status, visibility, and ownership for rubric assets.'
        columns={columns}
        data={rubrics}
        getRowId={rubric => rubric.uuid ?? rubric.title}
        selectedId={selectedRubricId}
        onRowClick={rubric => {
          setSelectedRubricId(rubric.uuid ?? null);
          setIsSheetOpen(true);
        }}
        isLoading={isLoading}
        search={{
          value: searchQuery,
          onChange: value => {
            setSearchQuery(value);
            setPage(0);
          },
          onReset: () => {
            setSearchQuery('');
            setStatusFilter('all');
            setVisibilityFilter('all');
            setPage(0);
          },
          placeholder: 'Search by title or rubric type…',
        }}
        filters={[
          {
            id: 'status',
            label: 'Status',
            value: statusFilter,
            onValueChange: value => {
              setStatusFilter((value as typeof statusFilter) || 'all');
              setPage(0);
            },
            options: statusOptions,
          },
          {
            id: 'visibility',
            label: 'Visibility',
            value: visibilityFilter,
            onValueChange: value => {
              setVisibilityFilter((value as typeof visibilityFilter) || 'all');
              setPage(0);
            },
            options: visibilityOptions,
          },
        ]}
        pagination={{
          page,
          pageSize: 20,
          totalItems,
          totalPages: totalPages || 1,
          onPageChange: next => setPage(next),
        }}
        emptyState={{
          title: 'No rubrics found',
          description: 'Adjust filters or review content workflows to surface rubric templates.',
          icon: <ClipboardList className='h-10 w-10 text-primary' />,
        }}
      />

      <RubricDetailSheet
        rubric={selectedRubric}
        open={isSheetOpen && Boolean(selectedRubric)}
        onOpenChange={setIsSheetOpen}
      />
    </div>
  );
}

type RubricFormValues = z.infer<typeof rubricFormSchema>;

interface RubricDetailSheetProps {
  rubric: AdminRubric | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function RubricDetailSheet({ rubric, open, onOpenChange }: RubricDetailSheetProps) {
  const updateRubric = useUpdateAdminRubric();

  const form = useForm<RubricFormValues>({
    resolver: zodResolver(rubricFormSchema),
    defaultValues: rubric ? mapRubricToForm(rubric) : undefined,
    mode: 'onBlur',
  });

  useEffect(() => {
    form.reset(rubric ? mapRubricToForm(rubric) : undefined);
  }, [rubric, form]);

  const handleSubmit = (values: RubricFormValues) => {
    if (!rubric?.uuid) return;

    updateRubric.mutate(
      {
        path: { uuid: rubric.uuid },
        body: {
          ...rubric,
          ...values,
          is_public: values.is_public ?? rubric.is_public ?? false,
        },
      },
      {
        onSuccess: () => {
          toast.success('Rubric updated');
          onOpenChange(false);
        },
        onError: error => {
          toast.error(error instanceof Error ? error.message : 'Failed to update rubric');
        },
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full max-w-xl border-l'>
        <SheetHeader>
          <SheetTitle>Rubric details</SheetTitle>
          <SheetDescription>Adjust publication status, total weighting, and visibility.</SheetDescription>
        </SheetHeader>
        {rubric ? (
          <ScrollArea className='mt-4 flex-1 pr-3'>
            <Form {...form}>
              <form className='space-y-6 pb-6' onSubmit={form.handleSubmit(handleSubmit)}>
                <FormField
                  control={form.control}
                  name='title'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder='Assessment rubric title' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='description'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder='Provide context for evaluators' rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='rubric_type'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rubric type</FormLabel>
                      <FormControl>
                        <Input placeholder='e.g. PROJECT_ASSESSMENT' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className='grid gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='total_weight'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total weight</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            value={field.value ?? ''}
                            onChange={event => field.onChange(event.target.value ? Number(event.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='status'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Publishing status</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder='Select status' />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.filter(option => option.value !== 'all').map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name='is_public'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                      <div className='space-y-0.5'>
                        <FormLabel>Public template</FormLabel>
                        <p className='text-muted-foreground text-sm'>Public rubrics can be reused by other course creators.</p>
                      </div>
                      <FormControl>
                        <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className='rounded-lg border bg-muted/40 p-4 text-xs text-muted-foreground'>
                  <div className='grid gap-2 sm:grid-cols-2'>
                    <div>
                      <span className='font-medium text-foreground'>Created:</span>{' '}
                      {rubric.created_date ? format(new Date(rubric.created_date), 'dd MMM yyyy, HH:mm') : '—'}
                    </div>
                    <div>
                      <span className='font-medium text-foreground'>Updated:</span>{' '}
                      {rubric.updated_date ? format(new Date(rubric.updated_date), 'dd MMM yyyy, HH:mm') : '—'}
                    </div>
                    <div>
                      <span className='font-medium text-foreground'>Course creator:</span> {rubric.course_creator_uuid ?? '—'}
                    </div>
                    <div>
                      <span className='font-medium text-foreground'>Rubric UUID:</span> {rubric.uuid ?? '—'}
                    </div>
                  </div>
                </div>

                <Button type='submit' className='w-full' disabled={updateRubric.isPending}>
                  {updateRubric.isPending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
                  Save changes
                </Button>
              </form>
            </Form>
          </ScrollArea>
        ) : (
          <div className='flex h-full items-center justify-center text-sm text-muted-foreground'>Select a rubric to manage details.</div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function mapRubricToForm(rubric: AdminRubric): RubricFormValues {
  return {
    title: rubric.title ?? '',
    description: rubric.description ?? '',
    status: rubric.status ?? 'DRAFT',
    is_public: Boolean(rubric.is_public),
    total_weight: rubric.total_weight,
    rubric_type: rubric.rubric_type ?? '',
  };
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
}

function MetricCard({ icon, label, value }: MetricCardProps) {
  return (
    <Card className='bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <CardContent className='flex items-center gap-3 p-4'>
        <div className='rounded-full bg-primary/10 p-2'>{icon}</div>
        <div>
          <p className='text-muted-foreground text-xs font-medium uppercase tracking-wide'>{label}</p>
          <p className='text-foreground text-xl font-semibold'>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function statusBadgeVariant(status?: string) {
  switch (status) {
    case 'PUBLISHED':
      return 'default';
    case 'IN_REVIEW':
      return 'secondary';
    case 'ARCHIVED':
      return 'outline';
    default:
      return 'secondary';
  }
}

function averageWeight(rubrics: AdminRubric[]) {
  if (rubrics.length === 0) return 0;
  const total = rubrics.reduce((acc, rubric) => acc + (rubric.total_weight ?? 0), 0);
  return Math.round(total / rubrics.length);
}
