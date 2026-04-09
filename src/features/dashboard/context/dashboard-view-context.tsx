'use client';

import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import type { UserDomain } from '@/lib/types';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';

export const AvailableViews = [
  'student',
  'admin',
  'parent',
  'instructor',
  'course_creator',
  'organization',
] as const;

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
  availableViews?: readonly DashboardView[];
}) {
  const domain = useUserDomain();

  const mapDomainToView = (currentDomain?: UserDomain | null): DashboardView => {
    if (!currentDomain) return 'student';
    if (currentDomain === 'organisation' || currentDomain === 'organisation_user') {
      return 'organization';
    }
    return currentDomain as DashboardView;
  };

  const normalizedAvailableViews = useMemo(() => {
    if (availableViews && availableViews.length > 0 && availableViews !== AvailableViews) {
      return [...availableViews];
    }

    if (domain.domains.length > 0) {
      return Array.from(
        new Set(domain.domains.map(currentDomain => mapDomainToView(currentDomain)))
      ) as DashboardView[];
    }

    return [...AvailableViews];
  }, [availableViews, domain.domains]);

  const [view, setViewState] = useState<DashboardView>(
    initialView ?? mapDomainToView(domain.activeDomain ?? domain.domains[0])
  );

  useEffect(() => {
    const nextView = mapDomainToView(domain.activeDomain ?? domain.domains[0]);
    if (nextView && nextView !== view) {
      setViewState(nextView);
    }
  }, [domain.activeDomain, domain.domains, view]);

  const setView = (nextView: DashboardView) => {
    if (normalizedAvailableViews.includes(nextView)) {
      setViewState(nextView);
      const mappedDomain =
        nextView === 'organization' ? ('organisation' as UserDomain) : (nextView as UserDomain);
      domain.setActiveDomain(mappedDomain);
    }
  };

  return (
    <DashboardViewContext.Provider
      value={{ view, setView, availableViews: normalizedAvailableViews }}
    >
      {children}
    </DashboardViewContext.Provider>
  );
}

export function useDashboardView() {
  const context = useContext(DashboardViewContext);
  if (!context) {
    throw new Error('useDashboardView must be used within DashboardViewProvider');
  }
  return context;
}
