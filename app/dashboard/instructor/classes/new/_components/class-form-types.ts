// Form state shapes shared by the class builder.
export interface ClassDetails {
  uuid: string;
  course_uuid: null | string;
  program_uuid: null | string;
  title: string;
  description: string;
  categories: string[];
  class_type: string; // 'group' | 'private'
  location_type: string; // 'ONLINE' | 'IN_PERSON' | 'HYBRID'
  rate_card: string;
  class_limit: number;
  targetAudience: string;
  location_name: string;
  location_latitude?: string;
  location_longitude?: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  repeatUnit: string;
  instructorName?: string;
  meeting_link: string;
  classroom: string;
  class_color: string;
  reminder: string;
  thumbnail_url?: string;
  promotional_video_url?: string;
}

export interface ScheduleSettings {
  academicPeriod: {
    start: string;
    end: string;
  };
  /** Mandatory on every class — enrolment is refused outside it. */
  registrationPeriod: {
    start: string;
    end: string;
  };
  startClass: {
    date: string;
    startTime?: string;
    endTime?: string;
  };
  allDay: boolean;
  repeat: {
    interval: number;
    unit: 'day' | 'week' | 'month' | 'year';
    days?: number[];
  };
  endRepeat: string;
  alertAttendee: boolean;
  timetable: {
    days: string[];
    time: {
      duration: string;
    };
  };
  recurringOptions: string;
  timezone: string;
  classType: string;
  location: string;
  pin: string;
  classroom: string;
  totalSlots: number;
  weekly?: unknown;
}

export interface NotificationSettings {
  reminder: string;
  classColour: string;
}
