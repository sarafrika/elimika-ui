'use client';
import { useMutation } from '@tanstack/react-query';
import { BookOpen, CheckCircle2, Layers, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AsyncSection } from '@/components/data/async-section';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import type { ContentItem } from '@/services/admin/credential-review';
import {
  moderateCourseMutation,
  moderateProgramMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { adminTheme } from '../../_components/ui/admin-theme';
import { SectionCard } from '../../_components/ui/SectionCard';
import { StatusBadge } from '../../_components/ui/StatusBadge';

function ContentRow({
  item,
  onModerated,
}: {
  item: ContentItem;
  onModerated: () => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const moderateCourse = useMutation(moderateCourseMutation());
  const moderateProgram = useMutation(moderateProgramMutation());
  const isPending = moderateCourse.isPending || moderateProgram.isPending;

  const run = async (action: 'approve' | 'reject', actionReason?: string) => {
    if (!item.uuid) return;
    const mutation = item.type === 'course' ? moderateCourse : moderateProgram;
    try {
      await mutation.mutateAsync({ path: { uuid: item.uuid }, query: { action, reason: actionReason } });
      toast.success(action === 'approve' ? `${item.title} approved` : `${item.title} rejected`);
      setRejecting(false);
      setReason('');
      onModerated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Moderation failed');
    }
  };

  const Icon = item.type === 'course' ? BookOpen : Layers;

  return (
    <div className='flex flex-col gap-3 rounded-md border border-border/60 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between'>
      <div className='flex min-w-0 items-center gap-3'>
        <span className='flex size-9 shrink-0 items-center justify-center rounded-md border border-border/60 bg-card'>
          <Icon className='size-4 text-muted-foreground' />
        </span>
        <div className='min-w-0'>
          <p className='truncate text-sm font-medium text-foreground'>{item.title}</p>
          <p className='truncate text-xs capitalize text-muted-foreground'>
            {item.type}
            {item.subtitle ? ` · ${item.subtitle}` : ''}
          </p>
        </div>
      </div>
      <div className='flex items-center gap-2'>
        <StatusBadge status={item.status} tone={item.statusTone} label={item.status} />
        {item.pending ? (
          <>
            <Button size='sm' variant='outline' disabled={isPending} onClick={() => run('approve')}>
              <CheckCircle2 className='size-4' />
              Approve
            </Button>
            <Button size='sm' variant='ghost' disabled={isPending} onClick={() => setRejecting(true)}>
              <XCircle className='size-4' />
              Reject
            </Button>
          </>
        ) : null}
      </div>

      <Dialog open={rejecting} onOpenChange={setRejecting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {item.title}</DialogTitle>
            <DialogDescription>
              Add an optional reason — the creator will see this when their {item.type} is sent back.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder='Reason for rejection (optional)…'
            value={reason}
            onChange={event => setReason(event.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant='ghost' onClick={() => setRejecting(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={() => run('reject', reason.trim() || undefined)} disabled={isPending}>
              Reject {item.type}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ContentApprovalsTab({
  items,
  pendingCount,
  isLoading,
  onModerated,
}: {
  items: ContentItem[];
  pendingCount: number;
  isLoading: boolean;
  onModerated: () => void;
}) {
  // Pending items first, then by title.
  const sorted = [...items].sort(
    (a, b) => Number(b.pending) - Number(a.pending) || a.title.localeCompare(b.title)
  );

  return (
    <SectionCard
      title='Content & approvals'
      description={
        pendingCount
          ? `${pendingCount} item${pendingCount === 1 ? '' : 's'} awaiting your approval`
          : 'Courses and programs authored or taught'
      }
    >
      <AsyncSection
        loading={isLoading && sorted.length === 0}
        empty={sorted.length === 0}
        skeleton={
          <div className='space-y-3'>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className='h-16 w-full rounded-md' />
            ))}
          </div>
        }
        emptyState={
          <p className={`${adminTheme.sectionLabel} normal-case`}>No courses or programs yet.</p>
        }
      >
        <div className='space-y-3'>
          {sorted.map(item => (
            <ContentRow key={`${item.type}-${item.uuid}`} item={item} onModerated={onModerated} />
          ))}
        </div>
      </AsyncSection>
    </SectionCard>
  );
}
