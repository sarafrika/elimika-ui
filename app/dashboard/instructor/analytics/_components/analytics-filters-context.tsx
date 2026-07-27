'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';

import {
  DEFAULT_ANALYTICS_FILTERS,
  type InstructorAnalyticsFilters,
} from './analytics-filters';
import { normalizeAnalyticsFilters } from './analytics-url';

type AnalyticsFiltersContextValue = {
  filters: InstructorAnalyticsFilters;
  setFilters: Dispatch<SetStateAction<InstructorAnalyticsFilters>>;
  resetFilters: () => void;
};

const AnalyticsFiltersContext = createContext<AnalyticsFiltersContextValue | null>(null);

const cloneDefaultFilters = (): InstructorAnalyticsFilters => ({
  ...DEFAULT_ANALYTICS_FILTERS,
  statuses: [...DEFAULT_ANALYTICS_FILTERS.statuses],
});

interface AnalyticsFiltersProviderProps {
  children: ReactNode;
  initialFilters?: Partial<InstructorAnalyticsFilters>;
}

export function AnalyticsFiltersProvider({
  children,
  initialFilters,
}: AnalyticsFiltersProviderProps) {
  const normalizedInitialFilters = useMemo(
    () => normalizeAnalyticsFilters(initialFilters),
    [initialFilters]
  );

  const [filters, setFilters] = useState<InstructorAnalyticsFilters>(normalizedInitialFilters);

  useEffect(() => {
    setFilters((current) => {
      const sameFilters =
        current.dateFrom === normalizedInitialFilters.dateFrom &&
        current.dateTo === normalizedInitialFilters.dateTo &&
        current.program === normalizedInitialFilters.program &&
        current.location === normalizedInitialFilters.location &&
        current.statuses.length === normalizedInitialFilters.statuses.length &&
        current.statuses.every((status, index) => status === normalizedInitialFilters.statuses[index]);

      return sameFilters ? current : normalizedInitialFilters;
    });
  }, [normalizedInitialFilters]);

  const resetFilters = () => {
    setFilters(cloneDefaultFilters());
  };

  const value = useMemo(
    () => ({ filters, setFilters, resetFilters }),
    [filters]
  );

  return (
    <AnalyticsFiltersContext.Provider value={value}>
      {children}
    </AnalyticsFiltersContext.Provider>
  );
}

export function useAnalyticsFilters() {
  const context = useContext(AnalyticsFiltersContext);

  if (context) {
    return context;
  }

  return {
    filters: cloneDefaultFilters(),
    setFilters: (() => undefined) as Dispatch<SetStateAction<InstructorAnalyticsFilters>>,
    resetFilters: () => undefined,
  };
}
