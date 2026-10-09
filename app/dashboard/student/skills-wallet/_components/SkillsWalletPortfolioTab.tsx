'use client';

import { PortfolioProjectDialog } from '@/app/dashboard/_components/skills-wallet/PortfolioProjectDialog';
import { PORTFOLIO_ITEM_TYPES, portfolioLink } from '@/app/dashboard/_components/skills-wallet/portfolio';
import DeleteModal from '@/components/custom-modals/delete-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateOnly } from '@/lib/date';
import { getErrorMessage } from '@/lib/error-utils';
import { STALE_TIMES } from '@/lib/query-client';
import {
  deletePortfolioItemMutation, getSummaryQueryKey, listPortfolioOptions, listPortfolioQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import type { UserPortfolioItem } from '@/services/client/types.gen';
import { requireApiData } from '@/src/features/onboarding/lib/user-onboarding';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Briefcase, ExternalLink, FileText, Link2, Pencil, Plus, Trash2, Video } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { StatCard } from './SkillsWalletShared';

export function SkillsWalletPortfolioTab() {
  const queryClient = useQueryClient();
  const portfolioQuery = useQuery({
    ...listPortfolioOptions(),
    select: requireApiData,
    staleTime: STALE_TIMES.entity,
  });
  const rows = portfolioQuery.data ?? [];
  const [editor, setEditor] = useState<{ project?: UserPortfolioItem } | null>(null);
  const [deleting, setDeleting] = useState<UserPortfolioItem | null>(null);
  const deletion = useMutation(deletePortfolioItemMutation());
  const deletionLock = useRef(false);
  const [deletingPending, setDeletingPending] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const refresh = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: listPortfolioQueryKey() }),
    queryClient.invalidateQueries({ queryKey: getSummaryQueryKey() }),
  ]);
  const remove = async () => {
    if (!deleting?.uuid || deletionLock.current) return;
    deletionLock.current = true;
    setDeletingPending(true);
    setDeleteError('');
    try {
      const response = await deletion.mutateAsync({ path: { itemUuid: deleting.uuid } });
      if (typeof response === 'object' && response !== null && (
        ('error' in response && response.error) || ('success' in response && response.success === false)
      )) throw new Error(getErrorMessage(response, 'Unable to delete this project.'));
      await refresh();
      setDeleting(null);
      toast.success('Project deleted.');
    } catch (error) {
      setDeleteError(getErrorMessage(error, 'Unable to delete this project. Please try again.'));
    } finally {
      deletionLock.current = false;
      setDeletingPending(false);
    }
  };

  const stats = [
    { icon: Briefcase, label: 'Portfolio Items', value: rows.length, tint: 'bg-primary/10 text-primary' },
    { icon: Briefcase, label: 'Projects', value: rows.filter(item => item.item_type === 'PROJECT').length, tint: 'bg-secondary text-secondary-foreground' },
    { icon: FileText, label: 'Work Samples', value: rows.filter(item => item.item_type === 'WORK_SAMPLE').length, tint: 'bg-success/10 text-success' },
    { icon: Video, label: 'Media', value: rows.filter(item => item.item_type === 'MEDIA').length, tint: 'bg-warning/10 text-warning' },
    { icon: Link2, label: 'With Links or Attachments', value: rows.filter(item => portfolioLink(item.link_url)).length, tint: 'bg-muted text-foreground' },
  ];

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div>
          <h2 className='text-xl font-semibold'>My Portfolio</h2>
          <p className='text-muted-foreground text-sm'>Showcase your best work with projects, work samples, and attachments.</p>
        </div>
        <Button type='button' onClick={() => setEditor({})}>
          <Plus className='size-4' /> Add New Project
        </Button>
      </div>

      {portfolioQuery.isLoading ? (
        <div className='space-y-4' aria-label='Loading portfolio'>
          <Skeleton className='h-24 w-full' />
          <Skeleton className='h-56 w-full' />
        </div>
      ) : portfolioQuery.isError ? (
        <EmptyState
          title='Unable to load portfolio'
          description='Please try loading your projects again.'
          action={<Button type='button' variant='outline' onClick={() => void portfolioQuery.refetch()}>Try again</Button>}
        />
      ) : (
        <>
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-5'>
            {stats.map(stat => <StatCard key={stat.label} {...stat} />)}
          </div>
          {rows.length ? (
            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
              {rows.map(project => {
                const link = portfolioLink(project.link_url);
                return (
                  <Card key={project.uuid} className='gap-0 overflow-hidden py-0'>
                    <div className='bg-muted grid h-32 place-items-center'>
                      <Briefcase className='text-muted-foreground h-10 w-10' />
                    </div>
                    <CardContent className='space-y-3 p-4'>
                      <div className='flex items-start justify-between gap-3'>
                        <div className='min-w-0 space-y-2'>
                          <Badge variant='outline'>{PORTFOLIO_ITEM_TYPES[project.item_type] || 'Other'}</Badge>
                          <h3 className='font-medium break-words'>{project.title}</h3>
                        </div>
                        <div className='flex shrink-0 gap-1'>
                          <Button type='button' variant='ghost' size='icon' disabled={!project.uuid || deletingPending} aria-label={`Edit project: ${project.title}`} onClick={() => setEditor({ project })}>
                            <Pencil className='size-4' />
                          </Button>
                          <Button type='button' variant='ghost' size='icon' disabled={!project.uuid || deletingPending} aria-label={`Delete project: ${project.title}`} onClick={() => {
                            setDeleteError('');
                            setDeleting(project);
                          }}>
                            <Trash2 className='text-destructive size-4' />
                          </Button>
                        </div>
                      </div>
                      <p className='text-muted-foreground line-clamp-3 text-sm whitespace-pre-wrap break-words'>{project.description || 'No description provided.'}</p>
                      <div className='flex flex-wrap items-center justify-between gap-2'>
                        <span className='text-muted-foreground text-xs'>
                          {formatDateOnly(project.completed_on, 'No project date')}
                        </span>
                        {link && <Button type='button' variant='outline' size='sm' asChild>
                          <a href={link} target='_blank' rel='noopener noreferrer'>
                            <ExternalLink className='size-4' /> Open project
                          </a>
                        </Button>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={Briefcase} title='No portfolio entries yet' description='Add your first project to showcase your work.' />
          )}
        </>
      )}
      {editor && <PortfolioProjectDialog project={editor.project} onClose={() => setEditor(null)} onSaved={refresh} />}
      <DeleteModal
        open={!!deleting}
        setOpen={open => { if (!open && !deletionLock.current) setDeleting(null); }}
        title='Delete project?'
        description={<>
          Remove “{deleting?.title}” from your portfolio? Uploaded documents will remain in your profile.
          {deleteError && <span role='alert' className='text-destructive mt-2 block'>{deleteError}</span>}
        </>}
        onConfirm={() => void remove()}
        isLoading={deletingPending}
        confirmText='Delete project'
      />
    </div>
  );
}
