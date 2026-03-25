export type ViewMode = 'day' | 'week' | 'month' | 'year';

export interface ClassSchedule {
  uuid: string;
  class_definition_uuid: string;
  instructor_uuid: string;
  start_time: Date;
  end_time: Date;
  status?: string;
}

export interface ClassDefinition {
  uuid: string;
  title: string;
  course: {
    uuid: string;
    name: string;
    course_creator_uuid: string;
  };
  instructor: {
    uuid: string;
    full_name?: string;
  };
  location_name: string;
  location_type: string;
  location_latitude?: number;
  location_longitude?: number;
  max_participants: number;
  session_format: string;
  training_fee: number;
  schedule: ClassSchedule[];
  allow_waitlist: boolean;
  is_active: boolean;
  duration_minutes: bigint;
  duration_formatted: string;
}

export interface CalendarEvent {
  id: string;
  classDefinitionId: string;
  title: string;
  courseName: string;
  instructor: string;
  location: string;
  locationType: string;
  startTime: Date;
  endTime: Date;
  color: string;
  maxParticipants: number;
  trainingFee: number;
  sessionFormat: string;
}

export interface StudentEnrollment {
  id: string;
  name: string;
  enrollmentDate: Date;
  attendanceStatus: 'present' | 'absent' | 'pending';
}

export interface ScheduleFilterItem {
  id: string;
  name: string;
}

export interface ScheduleFilterSection {
  key: string;
  label: string;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  items: ScheduleFilterItem[];
  onItemClick: (id: string) => void;
  selectedId?: string | null;
}
