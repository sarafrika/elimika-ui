import { CalendarDays } from 'lucide-react';
import { OverviewSectionShell } from './OverviewSectionShell';
import { ActionButton } from './OverviewSharedBits';
import type { OverviewInvite } from './overview-data';

type OverviewClassInvitesPanelProps = {
  invites: OverviewInvite[];
};

function InviteCard({ invite }: { invite: OverviewInvite }) {
  return (
    <article className='rounded-[10px] border border-[#e6e8fb] bg-white px-4 py-3 shadow-[0_6px_18px_rgba(99,102,241,0.04)]'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <h3 className='text-[1.05rem] font-semibold leading-tight text-slate-900 sm:text-[1.12rem]'>
            {invite.title}
          </h3>
          <p className='mt-1 text-[0.95rem] text-slate-600'>{invite.host}</p>
        </div>
        <button
          type='button'
          aria-label={`${invite.title} options`}
          className='text-slate-400 transition hover:text-slate-600'
        >
          •••
        </button>
      </div>

      <div className='mt-3 flex flex-col gap-3 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between'>
        <div className='flex items-center gap-2 text-sm text-slate-500'>
          <CalendarDays className='size-4' />
          <span>{invite.schedule}</span>
        </div>
        <ActionButton label={invite.actionLabel} tone={invite.actionTone === 'accept' ? 'success' : 'primary'} />
      </div>
    </article>
  );
}

export function OverviewClassInvitesPanel({ invites }: OverviewClassInvitesPanelProps) {
  return (
    <OverviewSectionShell title='Class Invites' trailingMode='none'>
      <div className='space-y-3'>
        {invites.map(invite => (
          <InviteCard key={invite.id} invite={invite} />
        ))}
      </div>
    </OverviewSectionShell>
  );
}
