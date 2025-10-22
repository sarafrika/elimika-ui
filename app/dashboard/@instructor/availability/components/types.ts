export type AvailabilitySlot = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  date?: Date;
  status: 'available' | 'unavailable' | 'reserved' | 'booked';
  recurring?: boolean;
  note?: string;
  is_available?: boolean;
  custom_pattern?: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  type: 'booked' | 'available' | 'unavailable' | 'reserved';
  startTime: string;
  endTime: string;
  date: Date;
  day: string;
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

export function transformAvailabilityArray(dataArray: any[]) {
  const dayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return dataArray?.map(data => ({
    id: data.uuid,
    day: dayMap[data.day_of_week ?? 0],
    startTime: data.start_time?.slice(0, 5),
    endTime: data.end_time?.slice(0, 5),
    status: data.is_available ? 'available' : 'unavailable',
    recurring: data.availability_type === 'weekly',
    note: data.availability_description || '',
    is_available: data.is_available,
    custom_pattern: data.custom_pattern || '',
  }));
}

export function convertToCalendarEvents(classes: ClassScheduleItem[]): CalendarEvent[] {
  return classes.map(item => {
    const start = new Date(item.start_time);
    const end = new Date(item.end_time);

    const getTimeString = (date: Date) => date.toTimeString().slice(0, 5);
    const getDayName = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'long' });

    // Optional: determine color by status (use normalized uppercase key)
    const colorMap: Record<string, string> = {
      SCHEDULED: '#1E90FF',
      CANCELLED: '#FF6B6B',
      COMPLETED: '#2ECC71',
    };

    // Map incoming status strings to the allowed CalendarEvent['status'] union
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
      title: item.title,
      type: 'booked',
      startTime: getTimeString(start),
      endTime: getTimeString(end),
      date: new Date(start.toDateString()),
      day: getDayName(start),
      location: item.location_type === 'ONLINE' ? 'Online' : item.location_type,
      attendees: item.max_participants,
      isRecurring: false,
      recurringDays: [],
      status: mappedStatus,
      color: colorMap[statusKey] || '#888',
      reminders: [15],
      notes: item.cancellation_reason || '',
    };
  });
}
