export type AvailabilitySlot = {
  id: string;
  day: string;
  startTime: string;      // HH:mm
  endTime: string;        // HH:mm
  date?: Date;            // optional specific date
  status: 'available' | 'unavailable' | 'reserved' | 'booked';
  recurring?: boolean;
  note?: string;
  is_available?: boolean;
  custom_pattern?: string;
  startDateTime?: string; // optional ISO datetime
  endDateTime?: string;   // optional ISO datetime
};

export type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  type: 'booked' | 'available' | 'unavailable' | 'reserved';
  startTime: string;       // HH:mm
  endTime: string;         // HH:mm
  startDateTime: string;   // ISO YYYY-MM-DDTHH:mm:ss
  endDateTime: string;     // ISO YYYY-MM-DDTHH:mm:ss
  date: Date;              // main date for event
  day: string;             // weekday name
  location?: string;
  attendees?: number;
  isRecurring?: boolean;
  recurringDays?: string[];
  status: 'available' | 'unavailable' | 'reserved' | 'booked';
  color?: string;
  reminders?: number[];
  notes?: string;
};

export type AvailabilityData = {
  slots: AvailabilitySlot[];
  events: CalendarEvent[];
  settings: {
    timezone: string;
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
  status: string;
  location_type: string;
  max_participants: number;
  cancellation_reason?: string | null;
};

export function transformAvailabilityArray(dataArray: any[]): AvailabilitySlot[] {
  const dayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return dataArray?.map(data => {
    let day: string;

    if (data.specific_date) {
      const date = new Date(data.specific_date);
      day = dayMap[date.getDay()] || 'Unknown';
    } else if (data.day_of_week !== null && data.day_of_week !== undefined) {
      day = dayMap[data.day_of_week] || 'Unknown';
    } else {
      day = 'Unknown';
    }

    const startDateTime = data.specific_date
      ? `${new Date(data.specific_date).toISOString().slice(0, 10)}T${data.start_time?.slice(0, 5)}:00`
      : undefined;

    const endDateTime = data.specific_date
      ? `${new Date(data.specific_date).toISOString().slice(0, 10)}T${data.end_time?.slice(0, 5)}:00`
      : undefined;

    return {
      id: data.uuid,
      day,
      startTime: data.start_time?.slice(0, 5),
      endTime: data.end_time?.slice(0, 5),
      status: data.is_available ? 'available' : 'unavailable',
      recurring: data.availability_type === 'weekly' || data.availability_type === 'daily',
      note: data.availability_description || '',
      is_available: data.is_available,
      custom_pattern: data.custom_pattern || '',
      date: data.specific_date ? new Date(data.specific_date) : undefined,
      startDateTime,
      endDateTime,
    };
  });
}

export function convertToCalendarEvents(classes: ClassScheduleItem[]): CalendarEvent[] {
  return classes.map(item => {
    const start = new Date(item.start_time);
    const end = new Date(item.end_time);

    const startTime = start.toTimeString().slice(0, 5);
    const endTime = end.toTimeString().slice(0, 5);
    const startDateTime = start.toISOString().slice(0, 19);
    const endDateTime = end.toISOString().slice(0, 19);
    const day = start.toLocaleDateString('en-US', { weekday: 'long' });

    const colorMap: Record<string, string> = {
      SCHEDULED: 'hsl(var(--primary))',
      CANCELLED: 'hsl(var(--destructive))',
      COMPLETED: 'hsl(var(--success))',
    };
    const defaultEventColor = 'hsl(var(--muted-foreground))';

    const statusMap: Record<string, CalendarEvent['status']> = {
      SCHEDULED: 'booked',
      CANCELLED: 'unavailable',
      COMPLETED: 'booked',
      RESERVED: 'reserved',
      BOOKED: 'booked',
      AVAILABLE: 'available',
    };

    const statusKey = String(item.status ?? '').toUpperCase();
    const mappedStatus = statusMap[statusKey] ?? 'booked';

    return {
      id: item.uuid,
      title: item.title.toUpperCase(),
      type: 'booked',
      startTime,
      endTime,
      startDateTime,
      endDateTime,
      date: new Date(start.toDateString()),
      day,
      location: item.location_type === 'ONLINE' ? 'Online' : item.location_type,
      attendees: item.max_participants,
      isRecurring: false,
      recurringDays: [],
      status: mappedStatus,
      color: colorMap[statusKey] || defaultEventColor,
      reminders: [15],
      notes: item.cancellation_reason || '',
    };
  });
}
