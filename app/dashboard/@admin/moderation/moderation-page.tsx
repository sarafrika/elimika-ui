'use client';

import { AdminDataTable, type AdminDataTableColumn } from '@/components/admin/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import {
  type ModerationQueueItem,
  type ModerationQueueParams,
  useModerationAction,
  useModerationQueue,
} from '@/services/admin';
import { formatDistanceToNow } from 'date-fns';
import { Ban, CheckCircle2, ClipboardCheck, Gavel, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

const moderationActionSchema = z.object({
  reason: z.string().max(500).optional(),
});

type ModerationActionFormValues = z.infer<typeof moderationActionSchema>;

const statusOptions = [
  { label: 'All statuses', value: 'all' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Dismissed', value: 'DISMISSED' },
];

const entityOptions = [
  { label: 'All entity types', value: '' },
  { label: 'Courses', value: 'course' },
  { label: 'Organisations', value: 'organisation' },
  { label: 'Users', value: 'user' },
  { label: 'Rubrics', value: 'rubric' },
];

export default function ModerationPage() {
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'DISMISSED'>('all');
  const [entityFilter, setEntityFilter] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { data, isLoading } = useModerationQueue({
    page,
    size: 20,
    status: statusFilter,
    entityType: entityFilter,
    search: searchQuery,
  });

  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const totalItems = data?.totalItems ?? 0;
  const totalPages = data?.totalPages ?? 0;

  useEffect(() => {
    if (!selectedItemId && items.length > 0) {
      setSelectedItemId(items[0]?.uuid ?? null);
    }
    if (selectedItemId && items.length > 0 && !items.some(item => item.uuid === selectedItemId)) {
      setSelectedItemId(items[0]?.uuid ?? null);
    }
  }, [items, selectedItemId]);

  useEffect(() => {
    if (page >= (data?.totalPages ?? 0)) {
      setPage(0);
    }
  }, [data?.totalPages, page]);

  const selectedItem = items.find(item => item.uuid === selectedItemId) ?? null;

  const columns: AdminDataTableColumn<ModerationQueueItem>[] = useMemo(
    () => [
      {
        id: 'entity',
        header: 'Entity',
        className: 'min-w-[200px]'
,
        cell: item => (
          <div className='space-y-1'>
            <div className='font-semibold'>{item.entity_type}</div>
            <div className='text-muted-foreground text-sm'>{item.entity_uuid}</div>
          </div>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        className: 'hidden sm:table-cell',
        cell: item => (
          <Badge variant={statusBadgeVariant(item.status)} className='capitalize'>
            {item.status?.toLowerCase()}
          </Badge>
        ),
      },
      {
        id: 'submitted',
        header: 'Submitted',
        className: 'hidden md:table-cell text-muted-foreground',
        cell: item => (
          <span className='text-sm'>
            {item.submitted_at ? formatDistanceToNow(new Date(item.submitted_at), { addSuffix: true }) : '—'}
          </span>
        ),
      },
      {
        id: 'submitted_by',
        header: 'Submitted by',
        className: 'hidden lg:table-cell text-muted-foreground',
        cell: item => <span className='text-sm'>{item.submitted_by_name ?? item.submitted_by ?? '—'}</span>,
      },
    ],
    []
  );

  const pendingCount = useMemo(() => items.filter(item => item.status === 'PENDING').length, [items]);

  return (
    <div className='mx-auto flex w-full max-w-7xl xl:max-w-[110rem] 2xl:max-w-[130rem] flex-col gap-6 px-4 py-10 2xl:px-10'>
      <div className='relative overflow-hidden rounded-3xl border border-primary/20 bg-card p-6 shadow-sm'>
        <div className='flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
          <div className='space-y-2'>
            <Badge variant='outline' className='border-primary/60 bg-primary/10 text-xs font-semibold uppercase tracking-wide'>
              Trust & safety
            </Badge>
            <h1 className='text-3xl font-semibold tracking-tight'>Moderation queue</h1>
            <p className='text-muted-foreground max-w-2xl text-sm'>
              Review flagged submissions, approve compliant content, or document dismissals directly from this operational view.
            </p>
          </div>
          <div className='grid gap-3 sm:grid-cols-2'>
            <MetricCard icon={<Gavel className='h-5 w-5 text-primary' />} label='Pending reviews' value={pendingCount} />
            <MetricCard icon={<ClipboardCheck className='h-5 w-5 text-primary' />} label='Items in scope' value={totalItems} />
          </div>
        </div>
      </div>

      <AdminDataTable
        title='Flagged submissions'
        description='Filter by status or entity type, then open a record to apply a moderation decision.'
        columns={columns}
        data={items}
        getRowId={item => item.uuid}
        selectedId={selectedItemId}
        onRowClick={item => {
          setSelectedItemId(item.uuid);
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
            setEntityFilter('');
            setPage(0);
          },
          placeholder: 'Search by entity UUID…',
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
            id: 'entityType',
            label: 'Entity',
            value: entityFilter,
            onValueChange: value => {
              setEntityFilter(value);
              setPage(0);
            },
            options: entityOptions,
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
          title: 'No moderation items',
          description: 'Good news—there are no flagged submissions awaiting review.',
          icon: <CheckCircle2 className='h-10 w-10 text-primary' />,
        }}
      />

      <ModerationDetailSheet
        item={selectedItem}
        open={isSheetOpen && Boolean(selectedItem)}
        onOpenChange={setIsSheetOpen}
        listParams={{ status: statusFilter, entityType: entityFilter, search: searchQuery, page, size: 20 }}
      />
    </div>
  );
}

interface ModerationDetailSheetProps {
  item: ModerationQueueItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listParams: ModerationQueueParams;
}

function ModerationDetailSheet({ item, open, onOpenChange, listParams }: ModerationDetailSheetProps) {
  const moderationAction = useModerationAction();
  const form = useForm<ModerationActionFormValues>({
    resolver: zodResolver(moderationActionSchema),
    defaultValues: { reason: '' },
  });

  const {
    status = 'all',
    entityType = '',
    search = '',
    page = 0,
    size = 20,
  } = listParams;

  useEffect(() => {
    form.reset({ reason: '' });
  }, [form]);

  const handleAction = (action: 'approve' | 'dismiss') => {
    if (!item?.uuid) return;

    moderationAction.mutate(
      {
        queueUuid: item.uuid,
        action,
        reason: form.getValues('reason') || undefined,
        listParams: {
          status,
          entityType,
          search,
          page,
          size,
        },
      },
      {
        onSuccess: () => {
          toast.success(action === 'approve' ? 'Submission approved' : 'Submission dismissed');
          onOpenChange(false);
        },
        onError: error => {
          toast.error(error instanceof Error ? error.message : 'Failed to process moderation action');
        },
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full max-w-xl border-l'>
        <SheetHeader>
          <SheetTitle>Moderation decision</SheetTitle>
          <SheetDescription>Inspect submission metadata, capture reviewer notes, and finalize a decision.</SheetDescription>
        </SheetHeader>
        {item ? (
          <ScrollArea className='mt-4 flex-1 pr-3'>
            <div className='space-y-6 pb-6'>
              <div className='rounded-lg border bg-muted/40 p-4 text-xs text-muted-foreground'>
                <div className='grid gap-2 sm:grid-cols-2'>
                  <div>
                    <span className='font-medium text-foreground'>Entity type:</span> {item.entity_type}
                  </div>
                  <div>
                    <span className='font-medium text-foreground'>Entity UUID:</span> {item.entity_uuid}
                  </div>
                  <div>
                    <span className='font-medium text-foreground'>Submitted:</span>{' '}
                    {item.submitted_at
                      ? formatDistanceToNow(new Date(item.submitted_at), { addSuffix: true })
                      : '—'}
                  </div>
                  <div>
                    <span className='font-medium text-foreground'>Submitted by:</span>{' '}
                    {item.submitted_by_name ?? item.submitted_by ?? '—'}
                  </div>
                </div>
              </div>

              <div className='rounded-lg border bg-background p-4'>
                <h3 className='text-sm font-semibold'>Payload</h3>
                <pre className='mt-2 max-h-60 overflow-auto rounded-md bg-muted/60 p-3 text-xs text-muted-foreground'>
                  {JSON.stringify(item.payload ?? {}, null, 2)}
                </pre>
              </div>

              <Form {...form}>
                <form className='space-y-4'>
                  <FormField
                    control={form.control}
                    name='reason'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reviewer notes</FormLabel>
                        <FormControl>
                          <Textarea placeholder='Document reasoning for audit trails (optional)' rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className='flex flex-col gap-3 sm:flex-row'>
                    <Button
                      type='button'
                      variant='outline'
                      className='flex-1'
                      disabled={moderationAction.isPending}
                      onClick={() => handleAction('approve')}
                    >
                      {moderationAction.isPending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <CheckCircle2 className='mr-2 h-4 w-4' />}
                      Approve
                    </Button>
                    <Button
                      type='button'
                      variant='outline'
                      className='flex-1 border-destructive text-destructive hover:bg-destructive/10'
                      disabled={moderationAction.isPending}
                      onClick={() => handleAction('dismiss')}
                    >
                      {moderationAction.isPending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Ban className='mr-2 h-4 w-4' />}
                      Dismiss
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </ScrollArea>
        ) : (
          <div className='flex h-full items-center justify-center text-sm text-muted-foreground'>Select a submission to moderate.</div>
        )}
      </SheetContent>
    </Sheet>
  );
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
    case 'APPROVED':
      return 'default';
    case 'DISMISSED':
      return 'outline';
    default:
      return 'secondary';
  }
}
