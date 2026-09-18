'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  type AcademicPeriod,
  addDays,
  calendarDayInput,
  computeSessionWindows,
  DAY_TOKEN,
  DAYS,
  type DayKey,
  type DayRow,
  DEFAULT_DAYS,
  firstOccurrenceOnOrAfter,
  firstRegistrationWindowError,
  fmtDate,
  type PreviewWindow,
  type ScheduleMode,
  scheduledSessions,
  scheduleTotals,
  sessionMinutesFor,
  toDateTime,
  validateRegistrationWindow,
} from '@/components/class-form';
import { useTimeZone } from '@/context/timezone-context';
import { normalizeScheduleTimeZone } from '@/lib/date';
import type { ClassMarketplaceJob, ClassSessionTemplate } from '@/services/client';
import { RecurrenceTypeEnum } from '@/services/client';

const hhmm = (date: Date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

/** Older rows predate end_time being required, so their stored duration is the fallback. */
function templateMinutes(template: ClassSessionTemplate) {
  if (template.start_time && template.end_time) {
    const diff = Math.round(
      (new Date(template.end_time).getTime() - new Date(template.start_time).getTime()) / 60000
    );
    if (Number.isInteger(diff) && diff > 0) return diff;
  }
  const stored = Number(template.duration_minutes);
  return Number.isInteger(stored) && stored > 0 ? stored : 120;
}

/** Schedule answers for a job: how sessions repeat, their windows and the registration window. */
export function useJobSchedule({ requireOpenRegistration }: { requireOpenRegistration: boolean }) {
  const { zone: preferredZone, source: preferredZoneSource } = useTimeZone();
  const activeZone = normalizeScheduleTimeZone(
    preferredZoneSource === 'default' ? undefined : preferredZone
  );

  const today = useMemo(() => new Date(), []);
  const [mode, setMode] = useState<ScheduleMode>('standard');
  const [days, setDays] = useState<Record<DayKey, DayRow>>(DEFAULT_DAYS);
  const [repeatEvery, setRepeatEvery] = useState('1');
  const [repeatUnit, setRepeatUnit] = useState('Week');
  const [startDate, setStartDate] = useState(fmtDate(today));
  const [endDate, setEndDate] = useState(fmtDate(addDays(today, 42)));
  const [pickedDates, setPickedDates] = useState<Date[]>([]);
  const [pickMonth, setPickMonth] = useState<Date>(today);
  const [sessionStart, setSessionStart] = useState('10:00');
  const [sessionEnd, setSessionEnd] = useState('12:00');
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([
    {
      id: 'ap-1',
      name: 'Academic Period 1',
      startDate: fmtDate(today),
      endDate: fmtDate(addDays(today, 77)),
      slots: [{ day: 'Wed', start: '09:00', end: '11:00' }],
    },
  ]);
  // Required and deliberately empty: a filled job copies these onto its class verbatim.
  const [regStart, setRegStart] = useState('');
  const [regEnd, setRegEnd] = useState('');
  const [timezone, setTimezone] = useState(activeZone);
  const [timezoneTouched, setTimezoneTouched] = useState(false);

  useEffect(() => {
    if (timezoneTouched) return;
    setTimezone(current =>
      normalizeScheduleTimeZone(current) === activeZone ? current : activeZone
    );
  }, [activeZone, timezoneTouched]);

  const changeTimezone = (value: string) => {
    setTimezoneTouched(true);
    setTimezone(normalizeScheduleTimeZone(value));
  };
  const updateDay = (day: DayKey, patch: Partial<DayRow>) =>
    setDays(previous => ({ ...previous, [day]: { ...previous[day], ...patch } }));

  const sortedPickedDates = useMemo(
    () => [...pickedDates].sort((a, b) => a.getTime() - b.getTime()),
    [pickedDates]
  );

  const sessions = useMemo(
    () =>
      scheduledSessions({
        mode,
        startDate,
        endDate,
        days,
        pickedDates: sortedPickedDates,
        sessionStart,
        sessionEnd,
        periods: academicPeriods,
      }),
    [mode, startDate, endDate, days, sortedPickedDates, sessionStart, sessionEnd, academicPeriods]
  );
  const totals = useMemo(() => scheduleTotals(sessions), [sessions]);

  const windows: PreviewWindow[] = useMemo(
    () =>
      mode === 'standard'
        ? computeSessionWindows(startDate, endDate, days)
        : sessions.map(session => ({
            start: session.date,
            end: new Date(session.date.getTime() + session.minutes * 60000),
          })),
    [mode, startDate, endDate, days, sessions]
  );

  const registrationErrors = useMemo(
    () => validateRegistrationWindow(regStart, regEnd, { requireOpen: requireOpenRegistration }),
    [regStart, regEnd, requireOpenRegistration]
  );

  const blocker = useMemo(() => {
    if (
      mode === 'standard' &&
      DAYS.some(
        day =>
          days[day].active &&
          !days[day].allDay &&
          sessionMinutesFor(days[day].start, days[day].end) === undefined
      )
    ) {
      return 'Every class day must end after it starts.';
    }
    if (mode === 'pick' && sessionMinutesFor(sessionStart, sessionEnd) === undefined) {
      return 'The session must end after it starts.';
    }
    if (
      mode === 'academic' &&
      academicPeriods.some(period =>
        period.slots.some(slot => sessionMinutesFor(slot.start, slot.end) === undefined)
      )
    ) {
      return 'Every academic slot must end after it starts.';
    }
    if (sessions.length === 0) return 'Add at least one session.';
    return firstRegistrationWindowError(registrationErrors) ?? null;
  }, [mode, days, sessionStart, sessionEnd, academicPeriods, sessions, registrationErrors]);

  const buildSessionTemplates = (): ClassSessionTemplate[] => {
    const interval = Math.max(1, Math.trunc(Number(repeatEvery) || 1));
    if (mode === 'pick') {
      return sortedPickedDates.map(date => ({
        start_time: toDateTime(fmtDate(date), sessionStart, timezone),
        end_time: toDateTime(fmtDate(date), sessionEnd, timezone),
        timezone,
        conflict_resolution: 'FAIL' as const,
      }));
    }
    if (mode === 'academic') {
      return academicPeriods.flatMap(period => {
        const periodEnd = new Date(`${period.endDate}T23:59:59`);
        const validEnd = !Number.isNaN(periodEnd.getTime());
        return period.slots.flatMap(slot => {
          const first = firstOccurrenceOnOrAfter(period.startDate, slot.day);
          if (!first || (validEnd && first > periodEnd)) return [];
          return [
            {
              start_time: toDateTime(fmtDate(first), slot.start, timezone),
              end_time: toDateTime(fmtDate(first), slot.end, timezone),
              timezone,
              recurrence: {
                recurrence_type: RecurrenceTypeEnum.WEEKLY,
                interval_value: interval,
                days_of_week: DAY_TOKEN[slot.day],
                ...(validEnd ? { end_date: periodEnd } : {}),
              },
              conflict_resolution: 'FAIL' as const,
            },
          ];
        });
      });
    }
    const endBoundary = new Date(`${endDate}T23:59:59`);
    return DAYS.filter(day => days[day].active).flatMap(day => {
      const row = days[day];
      const first = firstOccurrenceOnOrAfter(startDate, day);
      if (!first || first > endBoundary) return [];
      return [
        {
          start_time: toDateTime(fmtDate(first), row.allDay ? '00:00' : row.start, timezone),
          end_time: toDateTime(fmtDate(first), row.allDay ? '23:59' : row.end, timezone),
          timezone,
          recurrence: {
            recurrence_type: RecurrenceTypeEnum.WEEKLY,
            interval_value: interval,
            days_of_week: DAY_TOKEN[day],
            end_date: endBoundary,
          },
          conflict_resolution: 'FAIL' as const,
        },
      ];
    });
  };

  const academicBounds = () => {
    if (mode !== 'academic') return {};
    const starts = academicPeriods
      .map(period => period.startDate)
      .filter(Boolean)
      .sort();
    const ends = academicPeriods
      .map(period => period.endDate)
      .filter(Boolean)
      .sort();
    if (starts.length === 0 || ends.length === 0) return {};
    return {
      academic_period_start_date: new Date(`${starts[0]}T00:00:00`),
      academic_period_end_date: new Date(`${ends[ends.length - 1]}T23:59:59`),
    };
  };

  const hydrate = useCallback((job: ClassMarketplaceJob) => {
    const templates = job.session_templates ?? [];
    const recurring = templates.filter(template => template.recurrence?.recurrence_type);
    const oneOff = templates.filter(template => !template.recurrence?.recurrence_type);

    if (recurring.length > 0) {
      setMode('standard');
      const next = {} as Record<DayKey, DayRow>;
      for (const day of DAYS) next[day] = { ...DEFAULT_DAYS[day], active: false };
      for (const template of recurring) {
        const token = (template.recurrence?.days_of_week ?? '').split(',')[0]?.trim();
        const day = DAYS.find(key => DAY_TOKEN[key] === token);
        if (!day || !template.start_time) continue;
        const start = new Date(template.start_time);
        const end = template.end_time
          ? new Date(template.end_time)
          : new Date(start.getTime() + templateMinutes(template) * 60000);
        next[day] = { active: true, start: hhmm(start), end: hhmm(end), allDay: false };
      }
      setDays(next);
      const interval = recurring[0]?.recurrence?.interval_value;
      if (interval) setRepeatEvery(String(interval));
      const earliest = recurring
        .map(template => (template.start_time ? new Date(template.start_time) : null))
        .filter((date): date is Date => date !== null)
        .sort((a, b) => a.getTime() - b.getTime())[0];
      if (earliest) setStartDate(fmtDate(earliest));
      const seriesEnd = recurring[0]?.recurrence?.end_date;
      if (seriesEnd) setEndDate(fmtDate(new Date(seriesEnd)));
    } else if (oneOff.length > 0) {
      setMode('pick');
      const dates = oneOff
        .map(template => (template.start_time ? new Date(template.start_time) : null))
        .filter((date): date is Date => date !== null);
      setPickedDates(dates);
      if (dates[0]) setPickMonth(dates[0]);
      const first = oneOff[0];
      if (first?.start_time) {
        const start = new Date(first.start_time);
        setSessionStart(hhmm(start));
        setSessionEnd(
          hhmm(
            first.end_time
              ? new Date(first.end_time)
              : new Date(start.getTime() + templateMinutes(first) * 60000)
          )
        );
      }
    }

    // A `format: date` field arrives as UTC midnight; calendarDayInput reads the stored day.
    setRegStart(calendarDayInput(job.registration_period_start_date));
    setRegEnd(calendarDayInput(job.registration_period_end_date));
  }, []);

  return {
    mode,
    setMode,
    days,
    updateDay,
    repeatEvery,
    setRepeatEvery,
    repeatUnit,
    setRepeatUnit,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    pickedDates,
    setPickedDates,
    sortedPickedDates,
    pickMonth,
    setPickMonth,
    sessionStart,
    setSessionStart,
    sessionEnd,
    setSessionEnd,
    academicPeriods,
    setAcademicPeriods,
    regStart,
    setRegStart,
    regEnd,
    setRegEnd,
    registrationErrors,
    timezone,
    changeTimezone,
    sessions,
    totals,
    windows,
    blocker,
    buildSessionTemplates,
    academicBounds,
    hydrate,
  };
}

export type JobSchedule = ReturnType<typeof useJobSchedule>;
