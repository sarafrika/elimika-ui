import { type ApiDateInput, dayjs, parseApiDate, resolveDisplayZone } from '@/lib/date';
import type {
  EntryTypeEnum2 as EntryTypeEnum,
  ScheduledInstance,
  StatusEnum13,
} from '@/services/client/types.gen';

export type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  entry_type?: EntryTypeEnum | 'BOOKING';
  /** IANA zone the wall-clock fields below are rendered in. */
  timeZone: string;
  startTime: string; // HH:mm wall clock in timeZone
  endTime: string; // HH:mm wall clock in timeZone
  startDateTime: string; // ISO-8601 instant carrying its offset
  endDateTime: string; // ISO-8601 instant carrying its offset
  date: Date; // local midnight of the event's day in timeZone
  day: string; // weekday name
  location?: string;
  attendees?: number;
  isRecurring?: boolean;
  recurringDays?: string[];
  status: NonNullable<ScheduledInstance['status']> | StatusEnum13;
  color?: string;
  reminders?: number[];
  notes?: string;
  is_available?: boolean;
  /** Organisation that engaged the instructor for this session, when the class is org-owned. */
  organisation?: string;
};

export type AvailabilityData = {
  events: CalendarEvent[];
  settings: {
    timezone: string; // IANA zone the calendar renders in
    autoAcceptBookings: boolean;
    bufferTime: number; // minutes between slots
    workingHours: {
      start: string;
      end: string;
    };
  };
};

export type ClassScheduleItem = {
  uuid: string;
  title: string;
  start_time: Date;
  end_time: Date;
  status: ScheduledInstance['status'];
  location_type: string;
  max_participants: number;
  cancellation_reason?: string | null;
  entry_type?: EntryTypeEnum;
  is_available?: boolean;
  organisation_uuid?: string | null;
  organisation_name?: string | null;
};

export type AvailabilityClassData = {
  status?: string;
  classTitle: string;
  timetable: {
    timeSlots: Array<{
      day: string;
    }>;
  };
  academicPeriod: {
    startDate: string;
    endDate: string;
  };
};

// export function transformAvailabilityArray(dataArray: unknown[]): AvailabilitySlot[] {
//   const dayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

//   return dataArray?.map(data => {
//     let day: string;

//     if (data.specific_date) {
//       const date = new Date(data.specific_date);
//       day = dayMap[date.getDay()] || 'Unknown';
//     } else if (data.day_of_week !== null && data.day_of_week !== undefined) {
//       day = dayMap[data.day_of_week] || 'Unknown';
//     } else {
//       day = 'Unknown';
//     }

//     const startDateTime = data.specific_date
//       ? `${new Date(data.specific_date).toISOString().slice(0, 10)}T${data.start_time?.slice(0, 5)}:00`
//       : undefined;

//     const endDateTime = data.specific_date
//       ? `${new Date(data.specific_date).toISOString().slice(0, 10)}T${data.end_time?.slice(0, 5)}:00`
//       : undefined;

//     return {
//       id: data.uuid,
//       day,
//       startTime: data.start_time?.slice(0, 5),
//       endTime: data.end_time?.slice(0, 5),
//       status: data.is_available ? 'available' : 'unavailable',
//       recurring: data.availability_type === 'weekly' || data.availability_type === 'daily',
//       note: data.availability_description || '',
//       is_available: data.is_available,
//       custom_pattern: data.custom_pattern || '',
//       date: data.specific_date ? new Date(data.specific_date) : undefined,
//       startDateTime,
//       endDateTime,
//     };
//   });
// }

export type CalendarInstants = Pick<
  CalendarEvent,
  'timeZone' | 'startTime' | 'endTime' | 'startDateTime' | 'endDateTime' | 'date' | 'day'
>;

/** Zone the calendar renders in: the viewer's own, falling back to UTC off-browser. */
export function calendarDisplayZone(): string {
  return resolveDisplayZone();
}

/**
 * Derive every positioning and display field of an event from its two instants,
 * so a slot's label and the moment it is placed at can never disagree.
 */
export function toCalendarInstants(
  start: ApiDateInput,
  end: ApiDateInput,
  zone: string = calendarDisplayZone()
): CalendarInstants {
  const startAt = (parseApiDate(start) ?? dayjs()).tz(zone);
  const endAt = (parseApiDate(end) ?? startAt).tz(zone);

  return {
    timeZone: zone,
    startTime: startAt.format('HH:mm'),
    endTime: endAt.format('HH:mm'),
    startDateTime: startAt.format(),
    endDateTime: endAt.format(),
    date: dayjs(startAt.format('YYYY-MM-DD')).toDate(),
    day: startAt.format('dddd'),
  };
}

export function convertToCalendarEvents(classes: ClassScheduleItem[]): CalendarEvent[] {
  const zone = calendarDisplayZone();

  return classes.map(item => {
    const instants = toCalendarInstants(item.start_time, item.end_time, zone);

    const colorMap: Record<string, string> = {
      SCHEDULED: 'hsl(var(--primary))',
      CANCELLED: 'hsl(var(--destructive))',
      COMPLETED: 'hsl(var(--success))',
    };
    const defaultEventColor = 'hsl(var(--muted-foreground))';

    const statusKey = String(item.status ?? '').toUpperCase();

    return {
      id: item.uuid,
      title: item.title || '',
      ...instants,
      entry_type: item.entry_type,
      is_available: item.is_available,
      location: item.location_type === 'ONLINE' ? 'Online' : item.location_type,
      attendees: item.max_participants,
      isRecurring: false,
      recurringDays: [],
      status: item.status ?? 'SCHEDULED',
      color: colorMap[statusKey] || defaultEventColor,
      reminders: [15],
      notes: item.cancellation_reason || '',
      organisation: item.organisation_name || undefined,
    };
  });
}
