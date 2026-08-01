'use client';

interface TabNavProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TabNav({ tabs, activeTab, onTabChange }: TabNavProps) {
  return (
    <div className='border-border scrollbar-hide mb-4 overflow-x-auto border-b sm:mb-5'>
      <nav role='tablist' aria-label='Tabs' className='flex min-w-max'>
        {tabs.map(tab => {
          const isActive = activeTab === tab;

          return (
            <button
              key={tab}
              type='button'
              role='tab'
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab)}
              className={[
                'border-b-2 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors sm:px-4 sm:text-sm',
                isActive
                  ? 'border-primary text-primary'
                  : 'text-muted-foreground hover:border-border hover:text-foreground border-transparent',
              ].join(' ')}
            >
              {tab}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
