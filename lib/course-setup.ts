import type { ApiResponseCourse, Course, CourseSkill } from '@/services/client/types.gen';

export type CourseSkillDraft = {
  skillUuid: string;
  name: string;
  level: CourseSkill['level'];
  weight: number;
  active: boolean;
};

export type CoursePrerequisiteDraft = {
  courseUuid: string;
  name: string;
  isMandatory: boolean;
};

export type CourseSetupDrafts = {
  skills: CourseSkillDraft[] | null;
  prerequisites: CoursePrerequisiteDraft[] | null;
};

export type CourseSetupSectionRef = {
  savePending: (courseUuid: string) => Promise<void>;
};

export function getCreatedCourse(response: Course | ApiResponseCourse): Course {
  if (('error' in response && response.error) || ('success' in response && response.success === false)) {
    throw new Error(
      'message' in response && response.message ? response.message : 'Could not create the course.'
    );
  }
  const course = 'data' in response ? response.data : response;
  if (!course || !('name' in course) || !course.uuid) {
    throw new Error('The course was created without a course UUID. Please try again.');
  }
  return course;
}
