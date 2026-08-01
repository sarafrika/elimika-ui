import { cn } from '@/lib/utils';
import type { SkillsFundTabId } from '../data';

type SkillsFundTabsProps = {
  activeTab: SkillsFundTabId;
  onTabChange: (tab: SkillsFundTabId) => void;
  tabs: Array<{ id: SkillsFundTabId; label: string; count: number }>;
};

export function SkillsFundTabs({ activeTab, onTabChange, tabs }: SkillsFundTabsProps) {
  return (
    <nav
      aria-label='Skills funding categories'
      className='border-border flex flex-wrap gap-x-5 gap-y-2 border-b px-3 py-2 sm:px-4'
    >
      {tabs.map(tab => (
        <button
          key={tab.id}
          type='button'
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'border-b-2 pb-2 text-[0.95rem] font-medium transition sm:text-[1rem]',
            activeTab === tab.id
              ? 'border-primary text-foreground'
              : 'text-muted-foreground hover:text-foreground border-transparent'
          )}
        >
          {tab.label} ({tab.count})
        </button>
      ))}
    </nav>
  );
}
