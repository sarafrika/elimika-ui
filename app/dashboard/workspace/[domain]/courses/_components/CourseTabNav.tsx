"use client";

type Props = {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
};

export default function ClassCourseTabNav({ tabs, activeTab, onTabChange }: Props) {
  return (
    <div className="border-border w-full overflow-x-auto border-b scrollbar-hide">
      <div className="flex min-w-max items-center">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={[
                "-mb-px border-b-2 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors sm:px-4 sm:py-3 sm:text-sm",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
              ].join(" ")}
            >
              {tab}
            </button>
          )
        })}
      </div>
    </div>
  );
}