'use client';

import { useQuery } from '@tanstack/react-query';
import { FilePenLine } from 'lucide-react';
import type { CourseEditDiff, CoursePendingEdit } from '@/services/client';
import { getCourseEditDiffOptions } from '@/services/client/@tanstack/react-query.gen';
import { adminTheme } from '../../../_components/ui/admin-theme';
import { SectionCard, SectionCardSkeleton } from '../../../_components/ui/SectionCard';

/** Renders "—" for an absent value so an added or cleared field is still legible. */
function Value({ children }: { children?: string | null }) {
  if (!children) {
    return <span className='text-muted-foreground'>—</span>;
  }
  return <span>{children}</span>;
}

function CountPill({ label, count }: { label: string; count: number }) {
  return (
    <div className='rounded-md border border-border bg-card px-3 py-2'>
      <p className='text-lg font-semibold tabular-nums'>{count}</p>
      <p className='text-xs text-muted-foreground'>{label}</p>
    </div>
  );
}

/**
 * What a creator's pending edit would change if approved.
 *
 * Only shown while an edit is awaiting review. The live course keeps serving its approved
 * content throughout, so this is a preview of a proposal, not of anything learners can see.
 */
export function PendingEditSection({
  courseUuid,
  pendingEdit,
}: {
  courseUuid: string;
  pendingEdit: CoursePendingEdit;
}) {
  const { data, isLoading } = useQuery(getCourseEditDiffOptions({ path: { uuid: courseUuid } }));
  const diff = data?.data as CourseEditDiff | undefined;

  if (isLoading) {
    return <SectionCardSkeleton rows={4} />;
  }

  const fieldChanges = diff?.field_changes ?? [];
  const submittedAt = pendingEdit.submitted_at
    ? new Date(pendingEdit.submitted_at).toLocaleString()
    : undefined;

  return (
    <SectionCard
      title='Proposed changes'
      description={
        submittedAt
          ? `Submitted ${submittedAt}. Learners still see the approved version.`
          : 'Learners still see the approved version.'
      }
    >
      <div className='space-y-5'>
        <div className='grid grid-cols-3 gap-2'>
          <CountPill label='Lessons added' count={diff?.lessons_added ?? 0} />
          <CountPill label='Lessons removed' count={diff?.lessons_removed ?? 0} />
          <CountPill label='Lessons changed' count={diff?.lessons_modified ?? 0} />
        </div>

        {fieldChanges.length === 0 ? (
          <p className='text-sm text-muted-foreground'>
            No course fields changed. The edit only affects the curriculum.
          </p>
        ) : (
          <div>
            <p className={adminTheme.sectionLabel}>Field changes</p>
            <div className='mt-2 overflow-x-auto'>
              <table className='w-full min-w-[32rem] border-collapse text-sm'>
                <thead>
                  <tr className='border-b border-border text-left text-xs text-muted-foreground'>
                    <th className='py-2 pr-4 font-medium'>Field</th>
                    <th className='py-2 pr-4 font-medium'>Live now</th>
                    <th className='py-2 font-medium'>Proposed</th>
                  </tr>
                </thead>
                <tbody>
                  {fieldChanges.map(change => (
                    <tr key={change.field} className='border-b border-border/60 align-top'>
                      <td className='py-2 pr-4 font-medium'>{change.field}</td>
                      <td className='py-2 pr-4 text-muted-foreground'>
                        <Value>{change.live_value}</Value>
                      </td>
                      <td className='py-2'>
                        <Value>{change.draft_value}</Value>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className='flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground'>
          <FilePenLine className='mt-0.5 size-3.5 shrink-0' />
          <span>
            Approving replaces the live content with these changes. Rejecting discards them and
            leaves the published course exactly as it is.
          </span>
        </p>
      </div>
    </SectionCard>
  );
}
