import { format } from 'date-fns';

export type StudentClassRecord = {
  uuid: string;
  classDetails: any;
  course: any;
  enrollments: any[];
  schedules: any[];
};

export type StudentScheduleInstance = {
  uuid: string;
  classDefinitionUuid: string;
  classHref: string;
  classTitle: string;
  classSubtitle?: string;
  courseName?: string;
  instructorName?: string;
  startTime: string;
  endTime: string;
  timeRange: string;
  durationFormatted: string;
  status?: string;
  locationType?: string;
  locationName?: string;
  classroom?: string;
  locationLabel: string;
  meetingUrl?: string;
  isCurrentlyActive?: boolean;
  studentAttended?: boolean | null;
};

export function humanizeEnum(value?: string | null) {
  if (!value) return '';

  return value
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getClassData(classRecord: StudentClassRecord | any) {
  return classRecord?.classDetails?.class_definition ?? classRecord?.classDetails ?? {};
}

export function formatClassroomLabel({
  locationName,
  classroom,
  locationType,
}: {
  locationName?: string | null;
  classroom?: string | null;
  locationType?: string | null;
}) {
  return locationName || classroom || humanizeEnum(locationType) || 'Location pending';
}

export function buildStudentScheduleInstances(classRecords: StudentClassRecord[]) {
  return classRecords
    .flatMap(classRecord => {
      const classData = getClassData(classRecord);
      const classTitle = classData?.title || classRecord.course?.name || 'Untitled class';
      const courseName = classRecord.course?.name;
      const instructorName = classData?.instructor?.full_name;

      return (classRecord.schedules ?? []).map((schedule: any) => {
        const startTime = new Date(schedule.start_time);
        const endTime = new Date(schedule.end_time);
        const locationType = schedule.location_type ?? classData?.location_type;
        const locationName = schedule.location_name ?? classData?.location_name;
        const classroom = schedule.room ?? classData?.classroom;
        const meetingUrl = schedule.meeting_url ?? classData?.meeting_link;

        return {
          uuid: schedule.uuid,
          classDefinitionUuid: classRecord.uuid,
          classHref: `/dashboard/schedule/classes/${classRecord.uuid}`,
          classTitle,
          classSubtitle: classData?.subtitle,
          courseName,
          instructorName,
          startTime: schedule.start_time,
          endTime: schedule.end_time,
          timeRange:
            schedule.time_range ?? `${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}`,
          durationFormatted:
            schedule.duration_formatted ??
            `${Math.max(
              0,
              Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))
            )} mins`,
          status: schedule.status,
          locationType,
          locationName,
          classroom,
          locationLabel: formatClassroomLabel({ locationName, classroom, locationType }),
          meetingUrl,
          isCurrentlyActive: schedule.is_currently_active,
          studentAttended: schedule.student_attended,
        } satisfies StudentScheduleInstance;
      });
    })
    .sort(
      (left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime()
    );
}

export function getNextScheduleInstance(scheduleInstances: StudentScheduleInstance[]) {
  const now = Date.now();

  return scheduleInstances.find(instance => new Date(instance.endTime).getTime() >= now) ?? null;
}
