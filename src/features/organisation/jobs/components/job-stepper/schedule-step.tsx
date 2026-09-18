'use client';

import { CalendarDays } from 'lucide-react';

import {
  AcademicPeriodsPanel,
  PickDatesPanel,
  RegistrationWindow,
  ResourceAvailabilityPreview,
  ScheduleModeCards,
  StandardSchedule,
  unitsLabel,
} from '@/components/class-form';
import { Badge } from '@/components/ui/badge';
import type { OrganisationResource } from '@/services/client';
import type { JobSchedule } from './use-job-schedule';

function SessionsSummary({ schedule }: { schedule: JobSchedule }) {
  const { sessions, totals } = schedule;
  const first = sessions[0];
  const last = sessions[sessions.length - 1];

  return (
    <div className='border-border/60 bg-muted/20 flex flex-col gap-2 rounded-md border px-3 py-3'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <p className='text-foreground flex items-center gap-2 text-sm font-semibold'>
          <CalendarDays className='text-primary size-4' aria-hidden />
          Sessions this creates
        </p>
        <div className='flex flex-wrap gap-1.5'>
          <Badge>{unitsLabel(totals.sessions, 'per_session')}</Badge>
          <Badge variant='outline'>{unitsLabel(totals.minutes / 60, 'per_hour')}</Badge>
          <Badge variant='outline'>
            {totals.days} class {totals.days === 1 ? 'day' : 'days'}
          </Badge>
        </div>
      </div>
      <p className='text-muted-foreground text-sm'>
        {first && last
          ? `First: ${first.label}, ${first.time} · Last: ${last.label}`
          : 'No sessions match these dates and times yet.'}
      </p>
    </div>
  );
}

export function ScheduleStep({
  schedule,
  organisationUuid,
  resources,
  excludeJobUuid,
}: {
  schedule: JobSchedule;
  organisationUuid: string;
  resources: OrganisationResource[];
  excludeJobUuid?: string;
}) {
  const hasRegistrationInput = Boolean(schedule.regStart || schedule.regEnd);

  return (
    <div className='flex flex-col gap-6'>
      <ScheduleModeCards value={schedule.mode} onChange={schedule.setMode} />

      {schedule.mode === 'pick' ? (
        <PickDatesPanel
          pickedDates={schedule.pickedDates}
          onPickedDatesChange={schedule.setPickedDates}
          sortedPickedDates={schedule.sortedPickedDates}
          pickMonth={schedule.pickMonth}
          onPickMonthChange={schedule.setPickMonth}
          sessionStart={schedule.sessionStart}
          onSessionStartChange={schedule.setSessionStart}
          sessionEnd={schedule.sessionEnd}
          onSessionEndChange={schedule.setSessionEnd}
          timezone={schedule.timezone}
          onTimezoneChange={schedule.changeTimezone}
        />
      ) : schedule.mode === 'academic' ? (
        <AcademicPeriodsPanel
          periods={schedule.academicPeriods}
          onChange={schedule.setAcademicPeriods}
        />
      ) : (
        <StandardSchedule
          days={schedule.days}
          onDayChange={schedule.updateDay}
          repeatEvery={schedule.repeatEvery}
          onRepeatEveryChange={schedule.setRepeatEvery}
          repeatUnit={schedule.repeatUnit}
          onRepeatUnitChange={schedule.setRepeatUnit}
          startDate={schedule.startDate}
          onStartDateChange={schedule.setStartDate}
          endDate={schedule.endDate}
          onEndDateChange={schedule.setEndDate}
          timezone={schedule.timezone}
          onTimezoneChange={schedule.changeTimezone}
          totalSessions={schedule.totals.sessions}
        />
      )}

      <RegistrationWindow
        idPrefix='job-registration'
        start={schedule.regStart}
        onStartChange={schedule.setRegStart}
        end={schedule.regEnd}
        onEndChange={schedule.setRegEnd}
        errors={hasRegistrationInput ? schedule.registrationErrors : undefined}
      />

      <SessionsSummary schedule={schedule} />

      {resources.length > 0 ? (
        <ResourceAvailabilityPreview
          organisationUuid={organisationUuid}
          resources={resources}
          windows={schedule.windows}
          excludeJobUuid={excludeJobUuid}
        />
      ) : null}
    </div>
  );
}
