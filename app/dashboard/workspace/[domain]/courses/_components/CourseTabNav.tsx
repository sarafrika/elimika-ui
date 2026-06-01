"use client";

import { useState } from 'react';

type Props = {
  lessonCount: number;
  assessmentCount: number;
  requirementCount: number;
  reviewCount: number;
};

export default function CourseTabNav({
  lessonCount,
  assessmentCount,
  requirementCount,
  reviewCount,
}: Props) {
  const [active, setActive] = useState('Overview');

  const tabs = [
    'Overview',
    `Lessons (${lessonCount})`,
    'Assessment',
    `Requirements (${requirementCount})`,
    'Schedule',
    `Reviews (${reviewCount})`,
    'FAQs',
  ];

  return (
    <div className="border-border w-full overflow-x-auto border-b scrollbar-hide">
      <div className="flex min-w-max items-center">
        {tabs.map(tab => {
          const isActive = active === tab;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActive(tab)}
              title={
                tab === 'Assessment'
                  ? `Assessment items: ${assessmentCount}`
                  : undefined
              }
              className={[
                '-mb-px border-b-2 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors sm:px-4 sm:py-3 sm:text-sm',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
              ].join(' ')}
            >
              {tab}
            </button>
          );
        })}
      </div>
    </div>
  );
}