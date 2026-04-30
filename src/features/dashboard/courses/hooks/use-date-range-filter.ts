'use client';

import { addYears } from 'date-fns';
import { useState } from 'react';

const toInputDate = (date: Date) => date.toISOString().slice(0, 10);

type Options = {
  /** Years from today to use as the default end. Defaults to 1. */
  defaultEndYearsFromNow?: number;
};

/**
 * Date-range filter state used by AvailableClassesPage / AvailableProgramsPage and friends.
 * `appliedStart` / `appliedEnd` change only when `applyDates()` validates input — bind
 * downstream queries to those, not to `startDateInput` / `endDateInput`.
 */
export function useDateRangeFilter({ defaultEndYearsFromNow = 1 }: Options = {}) {
  const today = new Date();
  const defaultStart = today;
  const defaultEnd = addYears(today, defaultEndYearsFromNow);

  const [startDateInput, setStartDateInput] = useState<string>(toInputDate(defaultStart));
  const [endDateInput, setEndDateInput] = useState<string>(toInputDate(defaultEnd));
  const [appliedStart, setAppliedStart] = useState<string>(toInputDate(defaultStart));
  const [appliedEnd, setAppliedEnd] = useState<string>(toInputDate(defaultEnd));
  const [dateError, setDateError] = useState<string | null>(null);

  const applyDates = () => {
    setDateError(null);

    if (!startDateInput || !endDateInput) {
      setDateError('Please select both start and end dates.');
      return;
    }

    const start = new Date(startDateInput);
    const end = new Date(endDateInput);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setDateError('Invalid date format.');
      return;
    }

    if (start > end) {
      setDateError('Start date must be before end date.');
      return;
    }

    setAppliedStart(startDateInput);
    setAppliedEnd(endDateInput);
  };

  const clearDates = () => {
    const start = toInputDate(defaultStart);
    const end = toInputDate(defaultEnd);

    setStartDateInput(start);
    setEndDateInput(end);
    setAppliedStart(start);
    setAppliedEnd(end);
    setDateError(null);
  };

  return {
    startDateInput,
    endDateInput,
    setStartDateInput,
    setEndDateInput,
    appliedStart,
    appliedEnd,
    dateError,
    applyDates,
    clearDates,
  };
}
