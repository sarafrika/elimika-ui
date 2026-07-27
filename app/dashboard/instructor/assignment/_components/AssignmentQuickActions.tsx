import { AlertCircle, BellRing, CalendarClock, ChevronRight, ClipboardPlus } from 'lucide-react';

type AssignmentQuickActionsProps = {
  insights: {
    overdueTasks: number;
    pendingGrading: number;
    totalSubmissions: number;
  };
};

export function AssignmentQuickActions({ insights }: AssignmentQuickActionsProps) {
  const riskItems = [
    {
      icon: AlertCircle,
      subtitle: insights.overdueTasks > 0 ? 'Tasks that need attention' : 'No overdue work right now',
      title: `${insights.overdueTasks} overdue task${insights.overdueTasks === 1 ? '' : 's'}`,
    },
    {
      icon: AlertCircle,
      subtitle: 'Submissions still waiting for instructor review',
      title: `${insights.pendingGrading} pending grading`,
    },
  ];

  const actions = [
    { icon: ClipboardPlus, label: 'Open Class Training' },
    { icon: CalendarClock, label: `${insights.totalSubmissions} submissions tracked` },
    { icon: BellRing, label: 'Send Reminder' },
  ];

  return (
    <section className='space-y-4'>
      <div className='border-border/70 bg-card rounded-xl border p-3 shadow-sm sm:p-4'>
        <div className='mb-3 px-1'>
          <p className='text-muted-foreground text-[11px] font-semibold tracking-[0.16em] uppercase'>
            Needs attention
          </p>
          <h3 className='text-foreground mt-1 text-sm font-bold sm:text-base'>Review Queue</h3>
        </div>

        <div className='space-y-2'>
          {riskItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                type='button'
                className='hover:bg-muted/60 flex w-full items-start justify-between gap-3 rounded-lg px-2 py-3 text-left transition-colors sm:px-3'
              >
                <div className='flex min-w-0 gap-3'>
                  <span className='bg-warning/15 text-warning flex h-9 w-9 shrink-0 items-center justify-center rounded-xl'>
                    <Icon className='h-4 w-4' />
                  </span>
                  <div className='min-w-0 space-y-1'>
                    <p className='text-foreground text-sm font-semibold sm:text-base'>
                      {item.title}
                    </p>
                    {item.subtitle ? (
                      <p className='text-muted-foreground text-xs leading-relaxed sm:text-sm'>
                        {item.subtitle}
                      </p>
                    ) : null}
                  </div>
                </div>
                <ChevronRight className='text-muted-foreground mt-2 h-4 w-4 shrink-0' />
              </button>
            );
          })}
        </div>
      </div>

      <div className='border-border/70 bg-card rounded-xl border p-3 shadow-sm sm:p-4'>
        <div className='mb-3 px-1'>
          <p className='text-muted-foreground text-[11px] font-semibold tracking-[0.16em] uppercase'>
            Shortcuts
          </p>
          <h3 className='text-foreground mt-1 text-sm font-bold sm:text-base'>Quick Actions</h3>
        </div>

        <div className='space-y-1'>
          {actions.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type='button'
                className='hover:bg-muted/60 flex w-full items-center justify-between rounded-lg px-2 py-3 text-left transition-colors sm:px-3'
              >
                <div className='flex min-w-0 items-center gap-3'>
                  <span className='bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-xl'>
                    <Icon className='h-4 w-4' />
                  </span>
                  <span className='text-foreground line-clamp-1 text-sm font-semibold sm:text-base'>
                    {action.label}
                  </span>
                </div>
                <ChevronRight className='text-muted-foreground h-4 w-4 shrink-0' />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
