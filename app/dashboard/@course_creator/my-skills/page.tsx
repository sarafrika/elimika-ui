'use client';

import { useQuery } from '@tanstack/react-query';
import { BookOpen, CheckCircle, Clock, PlusCircle, Star, TrendingUp, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../../components/ui/button';
import { useCourseCreator } from '../../../../context/course-creator-context';
import { useMultipleClassDetails } from '../../../../hooks/use-class-multiple-details';
import {
  getCourseCreatorSkillsOptions,
  getStudentScheduleOptions,
  searchStudentsOptions,
} from '../../../../services/client/@tanstack/react-query.gen';
import { EnrollmentSkeleton, SkillSkeleton } from '../../@instructor/my-skills/page';

const elimikaDesignSystem = {
  components: {
    pageContainer: 'container mx-auto px-4 py-6 max-w-7xl',
  },
};

const proficiencyScoreMap: Record<string, number> = {
  BEGINNER: 25,
  INTERMEDIATE: 50,
  ADVANCED: 75,
  EXPERT: 100,
};

const proficiencyLabelMap: Record<string, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  EXPERT: 'Expert',
};

const skillColorMap = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
];

const MySkillsPage = () => {
  const creator = useCourseCreator();
  const uuid = creator?.profile?.uuid as string;

  const { data: studentSearch } = useQuery({
    ...searchStudentsOptions({
      query: {
        pageable: {},
        searchParams: {
          user_uuid_eq: creator?.profile?.user_uuid as string,
        },
      },
    }),
    enabled: !!creator?.profile?.user_uuid,
  });
  // @ts-ignore
  const studentInfo = studentSearch?.data?.content[0];

  const { data, isLoading: skillsIsLoading } = useQuery({
    ...getCourseCreatorSkillsOptions({
      path: { courseCreatorUuid: uuid },
      query: { pageable: {} },
    }),
    enabled: !!uuid,
  });
  const [useMockData, setUseMockData] = useState(false);
  const apiSkills = data?.data?.content ?? [];
  const mockSkills = [
    {
      uuid: 'skill234-1111-22aa-bbbb-1234567890ab',
      course_creator_uuid: 'c1r2e3a4-5t6o-7r89-0abc-defghijklmno',
      skill_name: 'Curriculum Development',
      proficiency_level: 'ADVANCED',
      created_date: '2024-06-10T10:12:45',
      created_by: 'creator@example.com',
      updated_date: '2024-06-18T08:40:10',
      updated_by: 'creator@example.com',
    },
    {
      uuid: 'skill345-2222-33bb-cccc-2345678901bc',
      course_creator_uuid: 'c1r2e3a4-5t6o-7r89-0abc-defghijklmno',
      skill_name: 'Learning Experience Design (LXD)',
      proficiency_level: 'EXPERT',
      created_date: '2024-05-22T16:05:30',
      created_by: 'creator@example.com',
      updated_date: '2024-06-01T11:20:00',
      updated_by: 'creator@example.com',
    },
    {
      uuid: 'skill456-3333-44cc-dddd-3456789012cd',
      course_creator_uuid: 'c1r2e3a4-5t6o-7r89-0abc-defghijklmno',
      skill_name: 'Assessment Design',
      proficiency_level: 'ADVANCED',
      created_date: '2024-04-18T09:45:12',
      created_by: 'creator@example.com',
      updated_date: '2024-05-02T14:10:55',
      updated_by: 'creator@example.com',
    },
    {
      uuid: 'skill567-4444-55dd-eeee-4567890123de',
      course_creator_uuid: 'c1r2e3a4-5t6o-7r89-0abc-defghijklmno',
      skill_name: 'eLearning Development',
      proficiency_level: 'EXPERT',
      created_date: '2024-03-12T13:00:00',
      created_by: 'creator@example.com',
      updated_date: '2024-06-05T17:25:40',
      updated_by: 'creator@example.com',
    },
    {
      uuid: 'skill678-5555-66ee-ffff-5678901234ef',
      course_creator_uuid: 'c1r2e3a4-5t6o-7r89-0abc-defghijklmno',
      skill_name: 'Storyboarding',
      proficiency_level: 'INTERMEDIATE',
      created_date: '2024-02-28T08:35:18',
      created_by: 'creator@example.com',
      updated_date: '2024-03-15T10:00:00',
      updated_by: 'creator@example.com',
    },
  ];
  const skills = useMockData ? mockSkills : apiSkills;

  // overall progress = average proficiency score
  const overallProgress =
    skills.length > 0
      ? Math.round(
          skills.reduce(
            (acc: number, skill: any) => acc + (proficiencyScoreMap[skill.proficiency_level] || 0),
            0
          ) / skills.length
        )
      : 0;

  // top 3 skills by proficiency
  const topSkills = [...skills]
    .sort(
      (a: any, b: any) =>
        (proficiencyScoreMap[b.proficiency_level] || 0) -
        (proficiencyScoreMap[a.proficiency_level] || 0)
    )
    .slice(0, 3)
    .map((skill: any, index: number) => ({
      name: skill.skill_name,
      level: proficiencyLabelMap[skill.proficiency_level],
      icon: '⭐',
      color: skillColorMap[index % skillColorMap.length],
    }));

  const { data: studentEnrollmentData } = useQuery({
    ...getStudentScheduleOptions({
      path: { studentUuid: studentInfo?.uuid },
      query: { start: '2026-01-20' as any, end: '2027-01-20' as any },
    }),
    enabled: !!studentInfo?.uuid,
  });

  const [useMockEnrollment, setUseMockEnrollment] = useState(false);
  const studentEnrollmentsApi = studentEnrollmentData?.data;
  const mockStudentEnrollments = [
    {
      enrollment_uuid: 'en123456-7890-abcd-ef01-234567890abc',
      scheduled_instance_uuid: 'si123456-7890-abcd-ef01-234567890abc',
      class_definition_uuid: '49958252-fb3e-4a48-a693-972111cb1390',
      instructor_uuid: 'inst1234-5678-90ab-cdef-123456789abc',
      title: 'Introduction to Java Programming',
      start_time: '2024-09-15T09:00:00',
      end_time: '2024-09-15T10:30:00',
      timezone: 'UTC',
      location_type: 'IN_PERSON',
      location_name: 'Nairobi HQ – Room 101',
      location_latitude: -1.292066,
      location_longitude: 36.821945,
      scheduling_status: 'SCHEDULED',
      enrollment_status: 'ENROLLED',
      attendance_marked_at: null,
    },
    {
      enrollment_uuid: 'en123456-7890-abcd-ef01-234567890abc',
      scheduled_instance_uuid: 'si123456-7890-abcd-ef01-234567890abc',
      class_definition_uuid: '30fb8f5e-8ce7-4871-923c-de6316a2d9b8',
      instructor_uuid: 'inst1234-5678-90ab-cdef-123456789abc',
      title: 'Introduction to Java Programming',
      start_time: '2024-09-15T09:00:00',
      end_time: '2024-09-15T10:30:00',
      timezone: 'UTC',
      location_type: 'IN_PERSON',
      location_name: 'Nairobi HQ – Room 101',
      location_latitude: -1.292066,
      location_longitude: 36.821945,
      scheduling_status: 'SCHEDULED',
      enrollment_status: 'ENROLLED',
      attendance_marked_at: null,
    },
    {
      enrollment_uuid: 'en123456-7890-abcd-ef01-234567890abc',
      scheduled_instance_uuid: 'si123456-7890-abcd-ef01-234567890abc',
      class_definition_uuid: 'e1fa19fc-1bd3-4cdb-9c35-564ac56dd071',
      instructor_uuid: 'inst1234-5678-90ab-cdef-123456789abc',
      title: 'Introduction to Java Programming',
      start_time: '2024-09-15T09:00:00',
      end_time: '2024-09-15T10:30:00',
      timezone: 'UTC',
      location_type: 'IN_PERSON',
      location_name: 'Nairobi HQ – Room 101',
      location_latitude: -1.292066,
      location_longitude: 36.821945,
      scheduling_status: 'SCHEDULED',
      enrollment_status: 'ENROLLED',
      attendance_marked_at: null,
    },
  ];
  const studentEnrollments = useMockEnrollment ? mockStudentEnrollments : studentEnrollmentsApi;

  const uniqueClassDefinitionUuids = [
    ...new Set(studentEnrollments?.map(e => e.class_definition_uuid)),
  ];

  const { data: allClasses, isLoading: enrollmentIsLoading } = useMultipleClassDetails(
    uniqueClassDefinitionUuids as any
  );

  const getStatusBadge = (status: any) => {
    const badges = {
      complete: {
        text: 'Completed',
        bg: 'bg-blue-100',
        text_color: 'text-blue-800',
        icon: CheckCircle,
      },
      passed: {
        text: 'Passed',
        bg: 'bg-green-100',
        text_color: 'text-green-800',
        icon: CheckCircle,
      },
      failed: { text: 'Failed', bg: 'bg-red-100', text_color: 'text-destructive', icon: XCircle },
      incomplete: {
        text: 'In Progress',
        bg: 'bg-yellow-100',
        text_color: 'text-yellow-800',
        icon: Clock,
      },
    };
    // @ts-ignore
    return badges[status] || badges.incomplete;
  };

  const getGradeColor = (grade: any) => {
    if (!grade) return 'text-muted-foreground';
    if (grade.startsWith('A')) return 'text-green-600';
    if (grade.startsWith('B')) return 'text-blue-600';
    if (grade.startsWith('C')) return 'text-yellow-600';
    if (grade.startsWith('D')) return 'text-orange-600';
    return 'text-destructive';
  };

  const stats = {
    total: allClasses.length,
    // completed: courses.filter(c => c.status === 'complete' || c.status === 'passed').length,
    // inProgress: courses.filter(c => c.status === 'incomplete').length,
    // failed: courses.filter(c => c.status === 'failed').length,
    completed: 0,
    inProgress: 0,
    failed: 0,
  };

  return (
    <div className={elimikaDesignSystem.components.pageContainer}>
      {/* Header */}
      <section className='mb-6'>
        <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-foreground text-2xl font-bold'>My Skills</h1>
            <p className='text-muted-foreground text-sm'>
              Review, track, and develop your skills. Add new competencies, monitor your progress,
              and showcase your expertise.
            </p>
          </div>
          <Button
            size={'default'}
            className='bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 font-medium shadow-sm transition-colors'
          >
            <PlusCircle className='h-5 w-5' />
            Add New Skill
          </Button>
        </div>
      </section>

      <div className='my-6 flex flex-col gap-2 rounded-md border-l-4 border-yellow-500 bg-yellow-100 p-4 text-yellow-800 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4'>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
          <p className='font-medium'>🚧 This page is under construction.</p>
          <p className='text-sm text-yellow-900'>Mock data is being used for this template</p>
        </div>
      </div>

      {/* Hero Section - Skills Snapshot */}
      <section className='mb-8'>
        <div className='bg-muted border-input rounded-xl border p-6 shadow-sm'>
          <div className='mb-4 flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <TrendingUp className='text-primary h-6 w-6' />
              <h2 className='text-foreground text-xl font-bold'>My Skills Snapshot</h2>
            </div>

            <Button
              variant='outline'
              size='sm'
              onClick={() => setUseMockData(prev => !prev)}
              className='text-xs'
            >
              {useMockData ? 'Use API Data' : 'Use Demo Data'}
            </Button>
          </div>

          {skillsIsLoading ? (
            <SkillSkeleton />
          ) : (
            <>
              {/* Overall Progress */}
              <div className='mb-6'>
                <div className='mb-2 flex items-center justify-between'>
                  <span className='text-foreground text-sm font-medium'>
                    Overall Skills Progress
                  </span>
                  <span className='text-primary text-2xl font-bold'>{overallProgress}%</span>
                </div>
                <div className='bg-background border-input h-3 w-full overflow-hidden rounded-full border'>
                  <div
                    className='bg-primary h-3 rounded-full transition-all duration-500'
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
                <p className='text-muted-foreground mt-1 text-xs'>Skills Verified</p>
              </div>

              {/* Top 3 Skills Badges */}
              {skills.length === 0 ? (
                <div className='flex flex-col items-center justify-center px-4 text-center'>
                  <TrendingUp className='text-muted-foreground mb-3 h-12 w-12' />
                  <h3 className='text-foreground mb-1 text-lg font-semibold'>
                    No skills added yet
                  </h3>
                  <p className='text-muted-foreground mb-4 max-w-md text-sm'>
                    Start building your profile by adding your first skill. Your progress and top
                    skills will appear here.
                  </p>
                  <Button className='flex items-center gap-2'>
                    <PlusCircle className='h-4 w-4' />
                    Add Your First Skill
                  </Button>
                </div>
              ) : (
                <div>
                  <h3 className='text-foreground mb-3 flex items-center gap-2 text-sm font-semibold'>
                    <Star className='h-4 w-4 fill-yellow-500 text-yellow-500' />
                    Top Skills
                  </h3>
                  <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
                    {topSkills.map((skill, index) => (
                      <div
                        key={index}
                        className='bg-card border-input rounded-lg border p-4 shadow-sm transition-shadow hover:shadow-md'
                      >
                        <div className='mb-2 flex items-start justify-between'>
                          <div
                            className={`${skill.color} flex h-12 w-12 items-center justify-center rounded-full text-2xl shadow-sm`}
                          >
                            {skill.icon}
                          </div>
                          <span className='bg-muted text-muted-foreground rounded-full px-2 py-1 text-xs font-medium'>
                            #{index + 1}
                          </span>
                        </div>
                        <h4 className='text-foreground mb-1 text-sm font-semibold'>{skill.name}</h4>
                        <p className='text-muted-foreground text-xs uppercase'>{skill.level}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Quick Stats */}
      <section className='mb-6'>
        <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
          <div className='bg-card border-input rounded-lg border p-4 shadow-sm'>
            <div className='mb-1 flex items-center gap-2'>
              <BookOpen className='text-muted-foreground h-4 w-4' />
              <p className='text-muted-foreground text-xs'>Total Courses</p>
            </div>
            <p className='text-foreground text-2xl font-bold'>{stats.total}</p>
          </div>
          <div className='bg-card border-input rounded-lg border p-4 shadow-sm'>
            <div className='mb-1 flex items-center gap-2'>
              <CheckCircle className='h-4 w-4 text-green-500' />
              <p className='text-muted-foreground text-xs'>Completed</p>
            </div>
            <p className='text-2xl font-bold text-green-600'>{stats.completed}</p>
          </div>
          <div className='bg-card border-input rounded-lg border p-4 shadow-sm'>
            <div className='mb-1 flex items-center gap-2'>
              <Clock className='h-4 w-4 text-yellow-500' />
              <p className='text-muted-foreground text-xs'>In Progress</p>
            </div>
            <p className='text-2xl font-bold text-yellow-600'>{stats.inProgress}</p>
          </div>
          <div className='bg-card border-input rounded-lg border p-4 shadow-sm'>
            <div className='mb-1 flex items-center gap-2'>
              <XCircle className='text-destructive h-4 w-4' />
              <p className='text-muted-foreground text-xs'>Failed</p>
            </div>
            <p className='text-destructive text-2xl font-bold'>{stats.failed}</p>
          </div>
        </div>
      </section>

      {/* Enrolled Courses List */}
      <section>
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='text-foreground flex items-center gap-2 text-xl font-bold'>
            <BookOpen className='h-5 w-5' />
            Enrolled Courses
          </h2>

          <Button
            variant='outline'
            size='sm'
            onClick={() => setUseMockEnrollment(prev => !prev)}
            className='text-xs'
          >
            {useMockEnrollment ? 'Use API Data' : 'Use Demo Data'}
          </Button>
        </div>

        {enrollmentIsLoading ? (
          <EnrollmentSkeleton />
        ) : (
          <>
            <div className='space-y-4'>
              {allClasses.map((en: any) => {
                const statusInfo = getStatusBadge(en?.course?.status);
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={en?.class?.uuid}
                    className='bg-card border-input rounded-lg border p-5 shadow-sm transition-shadow hover:shadow-md'
                  >
                    <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
                      <div className='flex-1'>
                        <div className='mb-2 flex items-start gap-3'>
                          <div className='mt-1'>
                            <StatusIcon className={`h-5 w-5 ${statusInfo.text_color}`} />
                          </div>
                          <div className='flex-1'>
                            <h3 className='text-foreground mb-1 font-semibold'>
                              {en?.course?.name}
                            </h3>
                            <h3 className='text-foreground mb-2 font-semibold'>
                              Enrolled Class: {en?.class?.title}
                            </h3>
                            <div className='flex flex-wrap items-center gap-2'>
                              <span
                                className={`rounded-full px-2 py-1 text-xs ${statusInfo.bg} ${statusInfo.text_color} font-medium`}
                              >
                                {statusInfo.text}
                              </span>
                              <span className='bg-muted text-muted-foreground rounded-full px-2 py-1 text-xs'>
                                {en?.course?.category_names?.map((i: any) => i)}
                              </span>
                              {en?.course?.grade ? (
                                <span
                                  className={`bg-muted rounded-full px-2 py-1 text-xs font-semibold ${getGradeColor(en?.course?.grade)}`}
                                >
                                  Grade: {en?.course?.grade}
                                </span>
                              ) : (
                                <span
                                  className={`bg-muted rounded-full px-2 py-1 text-xs font-semibold`}
                                >
                                  Grade: N/A
                                </span>
                              )}
                              {en?.course?.completedDate ? (
                                <span className='text-muted-foreground text-xs'>
                                  Completed:{' '}
                                  {new Date(en?.course?.completedDate).toLocaleDateString()}
                                </span>
                              ) : (
                                <span className='text-muted-foreground text-xs'>
                                  Completed: Date N/A
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className='mt-3'>
                          <div className='mb-1 flex items-center justify-between'>
                            <span className='text-muted-foreground text-xs'>Progress</span>
                            <span className='text-foreground text-xs font-semibold'>
                              {en?.course?.progress || 0}%
                            </span>
                          </div>
                          <div className='bg-background border-input h-2 w-full overflow-hidden rounded-full border'>
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                en?.course?.status === 'complete' || en?.course?.status === 'passed'
                                  ? 'bg-success'
                                  : en?.course?.status === 'failed'
                                    ? 'bg-destructive'
                                    : 'bg-yellow-500'
                              }`}
                              style={{ width: `${en?.course?.progress || 0}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className='sm:ml-4'>
                        <button className='bg-muted text-foreground hover:bg-muted/80 border-input w-full rounded-lg border px-4 py-2 text-sm font-medium transition-colors sm:w-auto'>
                          View Course
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {allClasses.length === 0 && (
              <div className='bg-muted border-input rounded-lg border p-8 text-center'>
                <BookOpen className='text-muted-foreground mx-auto mb-3 h-12 w-12' />
                <h3 className='text-foreground mb-2 text-lg font-semibold'>
                  No courses enrolled yet
                </h3>
                <p className='text-muted-foreground mb-4'>
                  Start your learning journey by enrolling in a course
                </p>
                <button className='bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 py-2 font-medium transition-colors'>
                  Browse Courses
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <section className='mb-20' />
    </div>
  );
};

export default MySkillsPage;
