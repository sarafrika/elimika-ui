'use client';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useUserProfile } from '../context/profile-context';
import { UserDomain } from '../lib/types';
import { ELIMIKA_DASHBOARD_STORAGE_KEY } from '../lib/utils';

export const AvailableViews = ['student', 'admin', 'instructor', 'organization'];
const dashboardViews = [...AvailableViews] as const;
export type DashboardView = (typeof dashboardViews)[number];

interface DashboardViewContextType {
  view: DashboardView;
  setView: (view: DashboardView) => void;
  availableViews: DashboardView[];
}

const DashboardViewContext = createContext<DashboardViewContextType | undefined>(undefined);

export function DashboardViewProvider({
  children,
  initialView,
  availableViews = AvailableViews,
}: {
  children: ReactNode;
  initialView?: DashboardView;
  availableViews?: DashboardView[];
}) {
  // Load from localStorage if available
  const profile = useUserProfile();
  const [view, setViewState] = useState<DashboardView>(
    initialView ?? profile?.activeDomain ?? 'student'
  );

  // Save to localStorage on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ELIMIKA_DASHBOARD_STORAGE_KEY, view);
    }
  }, [view]);

  // Only allow switching to available views
  const setView = (v: DashboardView) => {
    if (availableViews.includes(v)) {
      setViewState(v);
      profile?.setActiveDomain(v as UserDomain);
    }
  };

  return (
    <DashboardViewContext.Provider value={{ view, setView, availableViews }}>
      {children}
    </DashboardViewContext.Provider>
  );
}

export function useDashboardView() {
  const ctx = useContext(DashboardViewContext);
  if (!ctx) throw new Error('useDashboardView must be used within DashboardViewProvider');
  return ctx;
}
