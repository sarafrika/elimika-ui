import { cn } from '@/lib/utils';
import type { AssessmentTab } from './assessment-data';

type AssessmentTopBarProps = {
  activeCount: number;
  activeTab: AssessmentTab;
  completedCount: number;
  competenciesCount: number;
  onTabChange: (tab: AssessmentTab) => void;
};

const tabs: { key: AssessmentTab; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
];

export function AssessmentTopBar({
  activeCount,
  activeTab,
  completedCount,
  competenciesCount,
  onTabChange,
}: AssessmentTopBarProps) {
  const countByTab = {
    active: activeCount,
    completed: completedCount,
  };

  return (
    <header className='border-border bg-background/80 flex flex-col gap-4 border-b px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between'>
      <div className='flex flex-wrap items-center gap-x-5 gap-y-3'>
        <h2 className='text-foreground text-2xl font-semibold tracking-normal sm:text-3xl'>
          Assessments & Competencies
        </h2>
        {/* <div className='text-muted-foreground flex items-center gap-2 text-sm'>
          <Search className='size-4' />
          <span>Sarah Otieno</span>
        </div> */}
      </div>

      <div className='text-muted-foreground flex flex-wrap items-center gap-3 text-sm'>
        {tabs.map(tab => (
          <button
            aria-pressed={activeTab === tab.key}
            className={cn(
              'hover:text-foreground focus-visible:ring-ring rounded-md px-2 py-1 font-medium transition focus-visible:ring-2 focus-visible:outline-none',
              activeTab === tab.key && 'bg-accent text-foreground'
            )}
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            type='button'
          >
            {tab.label} ({countByTab[tab.key]})
          </button>
        ))}
        <button
          aria-pressed={activeTab === 'competencies'}
          className={cn(
            'border-border bg-card text-foreground hover:bg-accent focus-visible:ring-ring rounded-md border px-3 py-1 font-semibold shadow-xs transition focus-visible:ring-2 focus-visible:outline-none',
            activeTab === 'competencies' && 'border-primary bg-primary/10 text-primary'
          )}
          onClick={() => onTabChange('competencies')}
          type='button'
        >
          Competencies ({competenciesCount})
        </button>
      </div>
    </header>
  );
}
