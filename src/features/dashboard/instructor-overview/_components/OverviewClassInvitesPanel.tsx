import { CalendarDays } from 'lucide-react';
import { OverviewSectionShell } from './OverviewSectionShell';
import { ActionButton } from './OverviewSharedBits';
import type { OverviewInvite } from './overview-data';

type OverviewClassInvitesPanelProps = {
  invites: OverviewInvite[];
};

function InviteCard({ invite }: { invite: OverviewInvite }) {
  return (
    <article className='border-border bg-card rounded-[10px] border px-4 py-3 shadow-sm'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <h3 className='text-foreground text-[1.05rem] leading-tight font-semibold sm:text-[1.12rem]'>
            {invite.title}
          </h3>
          <p className='text-muted-foreground mt-1 text-[0.95rem]'>{invite.host}</p>
        </div>
        <button
          type='button'
          aria-label={`${invite.title} options`}
          className='text-muted-foreground hover:text-foreground transition'
        >
          •••
        </button>
      </div>

      <div className='mt-3 flex flex-col gap-3 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between'>
        <div className='text-muted-foreground flex items-center gap-2 text-sm'>
          <CalendarDays className='size-4' />
          <span>{invite.schedule}</span>
        </div>
        <ActionButton
          label={invite.actionLabel}
          tone={invite.actionTone === 'accept' ? 'success' : 'primary'}
          href={''}
        />
      </div>
    </article>
  );
}

export function OverviewClassInvitesPanel({ invites }: OverviewClassInvitesPanelProps) {
  return (
    <OverviewSectionShell title='Class Invites' trailingMode='none' onActionHref=''>
      {invites.length ? (
        <div className='space-y-3'>
          {invites.map(invite => (
            <InviteCard key={invite.id} invite={invite} />
          ))}
        </div>
      ) : (
        <p className='border-border bg-card text-muted-foreground rounded-[10px] border border-dashed px-4 py-6 text-center text-sm'>
          No student enrollment interest has been recorded yet.
        </p>
      )}
    </OverviewSectionShell>
  );
}
