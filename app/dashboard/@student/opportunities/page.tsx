'use client';

import clsx from 'clsx';
import {
  Briefcase,
  GraduationCap,
  Trophy,
  UserPlus,
  Users,
  Wrench,
} from 'lucide-react';
import { useState } from 'react';

import ApprenticeshipsPage from './apprenticeships/page';
import AttachementPage from './attachment/page';
import ClubsPage from './clubs/page';
import CompetitionPage from './competition/page';
import JobsPage from './jobs/page';
import ScholarshipPage from './scholarships/page';

type TabKey =
  | 'jobs'
  | 'apprenticeships'
  | 'attachment'
  | 'scholarships'
  | 'competitions'
  | 'clubs';

export default function OpportunitiesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('jobs');

  const tabs = [
    {
      key: 'jobs' as TabKey,
      label: 'Jobs',
      icon: Briefcase,
      count: 4,
    },
    {
      key: 'apprenticeships' as TabKey,
      label: 'Apprenticeships',
      icon: Wrench,
      count: 0,
    },
    {
      key: 'attachment' as TabKey,
      label: 'Attachments',
      icon: UserPlus,
      count: 0,
    },
    {
      key: 'scholarships' as TabKey,
      label: 'Scholarships',
      icon: GraduationCap,
      count: 0,
    },
    {
      key: 'competitions' as TabKey,
      label: 'Competitions',
      icon: Trophy,
      count: 0,
    },
    {
      key: 'clubs' as TabKey,
      label: 'Clubs',
      icon: Users,
      count: 0,
    },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* LEFT MENU (desktop) / TOP MENU (mobile) */}
      <div className="md:w-64 border border-border rounded-md">
        <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible py-4">
          {tabs.map(({ key, label, count, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={clsx(
                'flex items-center justify-between gap-3 rounded-md px-4 py-3 text-sm whitespace-nowrap transition',
                activeTab === key
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              )}
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {label}
              </span>

              <span className="text-xs opacity-80">({count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1">
        {activeTab === 'jobs' && <JobsPage />}
        {activeTab === 'apprenticeships' && <ApprenticeshipsPage />}
        {activeTab === 'attachment' && <AttachementPage />}
        {activeTab === 'scholarships' && <ScholarshipPage />}
        {activeTab === 'competitions' && <CompetitionPage />}
        {activeTab === 'clubs' && <ClubsPage />}

      </div>
    </div>
  );
}
