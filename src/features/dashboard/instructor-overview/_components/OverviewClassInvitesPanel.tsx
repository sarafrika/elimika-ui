import { CalendarDays } from 'lucide-react';
import { OverviewSectionShell } from './OverviewSectionShell';
import { ActionButton } from './OverviewSharedBits';
import type { OverviewInvite } from './overview-data';

type OverviewClassInvitesPanelProps = {
  invites: OverviewInvite[];
};

function InviteCard({ invite }: { invite: OverviewInvite }) {
  return (
    <article className='rounded-[10px] border border-border bg-card px-4 py-3 shadow-sm'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <h3 className='text-[1.05rem] font-semibold leading-tight text-foreground sm:text-[1.12rem]'>
            {invite.title}
          </h3>
          <p className='mt-1 text-[0.95rem] text-muted-foreground'>{invite.host}</p>
        </div>
        <button
          type='button'
          aria-label={`${invite.title} options`}
          className='text-muted-foreground transition hover:text-foreground'
        >
          •••
        </button>
      </div>

      <div className='mt-3 flex flex-col gap-3 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between'>
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <CalendarDays className='size-4' />
          <span>{invite.schedule}</span>
        </div>
        <ActionButton label={invite.actionLabel} tone={invite.actionTone === 'accept' ? 'success' : 'primary'} href={''} />
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
        <p className='rounded-[10px] text-center border border-dashed border-border bg-card px-4 py-6 text-sm text-muted-foreground'>
          No student enrollment interest has been recorded yet.
        </p>
      )}
    </OverviewSectionShell>
  );
}
