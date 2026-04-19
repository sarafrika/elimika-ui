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
      className='flex flex-wrap gap-x-5 gap-y-2 border-b border-slate-200 px-3 py-2 sm:px-4'
    >
      {tabs.map(tab => (
        <button
          key={tab.id}
          type='button'
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'border-b-2 pb-2 text-[0.95rem] font-medium transition sm:text-[1rem]',
            activeTab === tab.id
              ? 'border-blue-500 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          )}
        >
          {tab.label} ({tab.count})
        </button>
      ))}
    </nav>
  );
}
