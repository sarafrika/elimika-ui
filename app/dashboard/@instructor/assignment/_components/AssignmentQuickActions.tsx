import { AlertCircle, BellRing, CalendarClock, ChevronRight, ClipboardPlus } from 'lucide-react';

const riskItems = [
  {
    icon: AlertCircle,
    subtitle: '',
    title: '3 students not submitted',
  },
  {
    icon: AlertCircle,
    subtitle: 'Cluster of at-risk students',
    title: 'Low performance trend',
  },
];

const actions = [
  { icon: ClipboardPlus, label: 'Assign to Class' },
  { icon: CalendarClock, label: 'Extend Deadline' },
  { icon: BellRing, label: 'Send Reminder' },
];

export function AssignmentQuickActions() {
  return (
    <section className='space-y-4'>
      <div className='border-border/60 rounded-2xl border bg-white p-4 shadow-sm'>
        <div className='space-y-4'>
          {riskItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                type='button'
                className='hover:bg-muted/40 flex w-full items-start justify-between rounded-lg px-2 py-2 text-left transition-colors'
              >
                <div className='flex gap-3'>
                  <span className='bg-warning/15 flex h-9 w-9 items-center justify-center rounded-full text-warning'>
                    <Icon className='h-4 w-4' />
                  </span>
                  <div className='space-y-1'>
                    <p className='text-foreground text-lg font-medium'>{item.title}</p>
                    {item.subtitle ? (
                      <p className='text-muted-foreground text-sm'>{item.subtitle}</p>
                    ) : null}
                  </div>
                </div>
                <ChevronRight className='text-muted-foreground mt-2 h-4 w-4' />
              </button>
            );
          })}
        </div>
      </div>

      <div className='border-border/60 rounded-2xl border bg-white p-4 shadow-sm'>
        <div className='space-y-1'>
          {actions.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type='button'
                className='hover:bg-muted/40 flex w-full items-center justify-between rounded-lg px-2 py-3 text-left transition-colors'
              >
                <div className='flex items-center gap-3'>
                  <span className='text-primary'>
                    <Icon className='h-5 w-5' />
                  </span>
                  <span className='text-foreground text-lg font-medium'>{action.label}</span>
                </div>
                <ChevronRight className='text-muted-foreground h-4 w-4' />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
