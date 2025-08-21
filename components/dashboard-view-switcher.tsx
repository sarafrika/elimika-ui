'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { useDashboardView } from './dashboard-view-context';

const LABELS: Record<string, string> = {
  student: 'Student',
  admin: 'Admin',
  instructor: 'Instructor',
};

interface DashboardViewSwitcherProps {
  className?: string;
}

export default function DashboardViewSwitcher({ className }: DashboardViewSwitcherProps) {
  const { view, setView, availableViews } = useDashboardView();

  // Hide toggle if only one view or if only 'organisation_user' (as string)
  if (
    availableViews.length < 2 ||
    (availableViews.length === 1 && String(availableViews[0]) === 'organisation_user')
  )
    return null;

  return (
    <div className={`${className || ''} flex items-center gap-2`}>
      <span className='text-sm font-medium'>Dashboard View:</span>
      {availableViews.map(v => (
        <Button
          key={v}
          variant={view === v ? 'default' : 'outline'}
          size='sm'
          onClick={() => setView(v)}
          className={view === v ? 'font-bold' : ''}
        >
          {LABELS[v] || (v ? String(v).charAt(0).toUpperCase() + String(v).slice(1) : '')}
        </Button>
      ))}
    </div>
  );
}
