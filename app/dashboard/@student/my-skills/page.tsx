'use client';

import { useQueries, useQuery } from '@tanstack/react-query';
import {
  Award,
  BookOpen,
  CheckCircle,
  Clock,
  Download,
  type LucideIcon,
  PlusCircle,
  Star,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent } from '../../../../components/ui/card';
import { Skeleton } from '../../../../components/ui/skeleton';
import { useStudent } from '../../../../context/student-context';
import {
  getClassDefinitionOptions,
  getCourseByUuidOptions,
  getStudentCertificatesOptions,
  getStudentScheduleOptions,
  getTrainingProgramByUuidOptions,
} from '../../../../services/client/@tanstack/react-query.gen';
import type {
  Certificate,
  ClassDefinition,
  Course,
  StudentSchedule,
  TrainingProgram,
} from '../../../../services/client/types.gen';

const elimikaDesignSystem = {
  components: {
    pageContainer: 'container mx-auto px-4 py-6 max-w-7xl',
  },
};

const stripHtml = (value?: string) => (value ? value.replace(/<[^>]+>/g, '').trim() : '');

const truncateText = (value?: string, length = 140) => {
  if (!value) return '';
  return value.length > length ? `${value.slice(0, length).trim()}...` : value;
};

type Enrollment = StudentSchedule;
type CourseOrProgram = Course | TrainingProgram;
type SkillLevel = 'Advanced' | 'Intermediate' | 'Beginner';
type CourseStatus = 'complete' | 'passed' | 'failed' | 'incomplete';

type Skill = {
  uuid?: string;
  name: string;
  type: 'Course' | 'Program';
  grade?: string;
  finalGrade?: number;
  completedDate: Date;
  certificateUrl?: string;
  isDownloadable?: boolean;
  certificateType?: string;
  level: SkillLevel;
};

type EnrolledCourse = {
  id?: string;
  title: string;
  status: CourseStatus;
  progress: number;
  grade: string | null;
  completedDate: Date | null;
  category: string;
  type: 'Course' | 'Program';
  enrollmentStatus?: Enrollment['enrollment_status'];
  classTitle: string | null;
  description: string;
  duration: string | null;
  classLimit: number | null;
  course_uuid: string;
  program_uuid: string;
};

type StatusBadge = {
  text: string;
  bg: string;
  text_color: string;
  icon: LucideIcon;
};

const getCourseOrProgramName = (courseOrProgram?: CourseOrProgram) =>
  !courseOrProgram
    ? 'Unknown Skill'
    : 'name' in courseOrProgram
      ? courseOrProgram.name
      : courseOrProgram.title;

const getCourseOrProgramCategory = (courseOrProgram?: CourseOrProgram) =>
  courseOrProgram && 'category_names' in courseOrProgram
    ? courseOrProgram.category_names?.[0] || 'General'
    : 'General';

const getCourseOrProgramDuration = (courseOrProgram?: CourseOrProgram) => {
  if (!courseOrProgram) return null;

  if ('duration_hours' in courseOrProgram) {
    return `${courseOrProgram.duration_hours}h ${courseOrProgram.duration_minutes || 0}m`;
  }

  return `${courseOrProgram.total_duration_hours}h ${courseOrProgram.total_duration_minutes || 0}m`;
};

const getSkillLevel = (finalGrade?: number): SkillLevel =>
  finalGrade && finalGrade >= 90
    ? 'Advanced'
    : finalGrade && finalGrade >= 75
      ? 'Intermediate'
      : 'Beginner';

const MySkillsPage = () => {
  const router = useRouter();
  const student = useStudent();

  // Fetch certificates
  const { data: certificatesData, isLoading: isLoadingCertificates } = useQuery({
    ...getStudentCertificatesOptions({ path: { studentUuid: student?.uuid as string } }),
    enabled: !!student?.uuid,
  });

  const certificates = certificatesData?.data || [];

  // Fetch enrollments
  const { data: enrollmentsData, isLoading: isLoadingEnrollments } = useQuery({
    ...getStudentScheduleOptions({
      path: { studentUuid: student?.uuid as string },
      query: { start: new Date('2026-01-01'), end: new Date('2027-12-31') },
    }),
    enabled: !!student?.uuid,
  });

  // Get unique enrollments (by class_definition_uuid)
  const uniqueEnrollments = useMemo(() => {
    if (!enrollmentsData?.data) return [];

    const map = new Map<string, Enrollment>();
    enrollmentsData.data.forEach(item => {
      if (item.class_definition_uuid && !map.has(item.class_definition_uuid)) {
        map.set(item.class_definition_uuid, item);
      }
    });

    return Array.from(map.values());
  }, [enrollmentsData?.data]);

  const classDefinitionUuids = useMemo(
    () =>
      Array.from(
        new Set(
          uniqueEnrollments
            .map(enrollment => enrollment.class_definition_uuid)
            .filter((uuid): uuid is string => Boolean(uuid))
        )
      ),
    [uniqueEnrollments]
  );

  const classDefinitionQueries = useQueries({
    queries: classDefinitionUuids.map((uuid: string) => ({
      ...getClassDefinitionOptions({ path: { uuid } }),
      enabled: !!uuid,
    })),
  });

  const classDefinitionsMap = useMemo(() => {
    const map = new Map<string, ClassDefinition>();
    classDefinitionQueries.forEach((query, index) => {
      const classDefinition = query.data?.data?.class_definition;
      const classDefinitionUuid = classDefinitionUuids[index];
      if (classDefinition && classDefinitionUuid) {
        map.set(classDefinitionUuid, classDefinition);
      }
    });
    return map;
  }, [classDefinitionQueries, classDefinitionUuids]);

  // Extract unique course/program UUIDs from certificates and enrollments
  const { courseUuids, programUuids } = useMemo(() => {
    const courses = new Set<string>();
    const programs = new Set<string>();

    // From certificates
    certificates.forEach(cert => {
      if (cert.course_uuid) courses.add(cert.course_uuid);
      if (cert.program_uuid) programs.add(cert.program_uuid);
    });

    // From enrollments
    uniqueEnrollments.forEach(enroll => {
      const classDefinition = enroll.class_definition_uuid
        ? classDefinitionsMap.get(enroll.class_definition_uuid)
        : undefined;
      if (classDefinition?.course_uuid) courses.add(classDefinition.course_uuid);
      if (classDefinition?.program_uuid) programs.add(classDefinition.program_uuid);
    });

    return {
      courseUuids: Array.from(courses),
      programUuids: Array.from(programs),
    };
  }, [certificates, uniqueEnrollments, classDefinitionsMap]);

  // Fetch all courses
  const courseQueries = useQueries({
    queries: courseUuids.map((uuid: string) => ({
      ...getCourseByUuidOptions({ path: { uuid } }),
      enabled: !!uuid,
    })),
  });

  // Fetch all programs
  const programQueries = useQueries({
    queries: programUuids.map((uuid: string) => ({
      ...getTrainingProgramByUuidOptions({ path: { uuid } }),
      enabled: !!uuid,
    })),
  });

  // Create maps of courses and programs
  const coursesMap = useMemo(() => {
    const map = new Map<string, Course>();
    courseQueries.forEach((query, index) => {
      const courseUuid = courseUuids[index];
      if (query.data?.data && courseUuid) {
        map.set(courseUuid, query.data.data);
      }
    });
    return map;
  }, [courseQueries, courseUuids]);

  const programsMap = useMemo(() => {
    const map = new Map<string, TrainingProgram>();
    programQueries.forEach((query, index) => {
      const programUuid = programUuids[index];
      if (query.data?.data && programUuid) {
        map.set(programUuid, query.data.data);
      }
    });
    return map;
  }, [programQueries, programUuids]);

  // Calculate skills from certificates
  const skills = useMemo<Skill[]>(() => {
    return certificates
      .filter(cert => cert.is_valid)
      .map(cert => {
        const courseOrProgram = cert.course_uuid
          ? coursesMap.get(cert.course_uuid)
          : cert.program_uuid
            ? programsMap.get(cert.program_uuid)
            : undefined;

        return {
          uuid: cert.uuid,
          name: getCourseOrProgramName(courseOrProgram),
          type: cert.course_uuid ? 'Course' : 'Program',
          grade: cert.grade_letter,
          finalGrade: cert.final_grade,
          completedDate: cert.completion_date,
          certificateUrl: cert.certificate_url,
          isDownloadable: cert.is_downloadable,
          certificateType: cert.certificate_type,
          level: getSkillLevel(cert.final_grade),
        };
      });
  }, [certificates, coursesMap, programsMap]);

  // Get top 3 skills (highest grades)
  const topSkills = useMemo(() => {
    return [...skills]
      .sort((a, b) => (b.finalGrade || 0) - (a.finalGrade || 0))
      .slice(0, 3)
      .map((skill, index) => ({
        name: skill.name,
        level: skill.level,
        icon: index === 0 ? '🏆' : index === 1 ? '🥈' : '🥉',
        color: index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500',
        grade: skill.grade,
      }));
  }, [skills]);

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    if (skills.length === 0) return 0;
    const totalGrades = skills.reduce((sum, skill) => sum + (skill.finalGrade || 0), 0);
    return Math.round(totalGrades / skills.length);
  }, [skills]);

  // Process enrollments into course cards
  const enrolledCourses = useMemo<EnrolledCourse[]>(() => {
    return uniqueEnrollments.map(enroll => {
      const classDefinition = enroll.class_definition_uuid
        ? classDefinitionsMap.get(enroll.class_definition_uuid)
        : undefined;
      const courseUuid = classDefinition?.course_uuid;
      const programUuid = classDefinition?.program_uuid;
      const courseOrProgram = courseUuid
        ? coursesMap.get(courseUuid)
        : programUuid
          ? programsMap.get(programUuid)
          : undefined;

      // Find matching certificate
      const certificate = certificates.find(
        cert =>
          (cert.course_uuid && cert.course_uuid === courseUuid) ||
          (cert.program_uuid && cert.program_uuid === programUuid)
      );

      let status: CourseStatus = 'incomplete';
      let progress = 0; // Default for in-progress

      if (certificate) {
        if (certificate.is_valid) {
          status = (certificate.final_grade || 0) >= 50 ? 'passed' : 'failed';
          progress = 100;
        }
      } else if (String(enroll.enrollment_status) === 'COMPLETED') {
        status = 'complete';
        progress = 100;
      }

      return {
        id: enroll.enrollment_uuid,
        title:
          getCourseOrProgramName(courseOrProgram) ||
          classDefinition?.title ||
          enroll.title ||
          'Unknown Course',
        status,
        progress,
        grade: certificate?.grade_letter || null,
        completedDate: certificate?.completion_date || null,
        category: getCourseOrProgramCategory(courseOrProgram),
        type: courseUuid ? 'Course' : 'Program',
        enrollmentStatus: enroll.enrollment_status,
        classTitle: classDefinition?.title || null,
        description: truncateText(stripHtml(courseOrProgram?.description), 180),
        duration: getCourseOrProgramDuration(courseOrProgram),
        classLimit: courseOrProgram?.class_limit ?? null,
        course_uuid: courseUuid || '',
        program_uuid: programUuid || '',
      };
    });
  }, [uniqueEnrollments, classDefinitionsMap, coursesMap, programsMap, certificates]);

  const getStatusBadge = (status: CourseStatus): StatusBadge => {
    const badges: Record<CourseStatus, StatusBadge> = {
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
      failed: {
        text: 'Failed',
        bg: 'bg-red-100',
        text_color: 'text-destructive',
        icon: XCircle,
      },
      incomplete: {
        text: 'In Progress',
        bg: 'bg-yellow-100',
        text_color: 'text-yellow-800',
        icon: Clock,
      },
    };
    return badges[status];
  };

  const getGradeColor = (grade?: string | null) => {
    if (!grade) return 'text-muted-foreground';
    if (grade.startsWith('A')) return 'text-green-600';
    if (grade.startsWith('B')) return 'text-blue-600';
    if (grade.startsWith('C')) return 'text-yellow-600';
    if (grade.startsWith('D')) return 'text-orange-600';
    return 'text-destructive';
  };

  const stats = useMemo(() => {
    const completed = enrolledCourses.filter(
      c => c.status === 'complete' || c.status === 'passed'
    ).length;
    const inProgress = enrolledCourses.filter(c => c.status === 'incomplete').length;
    const failed = enrolledCourses.filter(c => c.status === 'failed').length;

    return {
      total: enrolledCourses.length,
      completed,
      inProgress,
      failed,
      skillsEarned: skills.length,
    };
  }, [enrolledCourses, skills]);

  const isLoading =
    isLoadingCertificates ||
    isLoadingEnrollments ||
    classDefinitionQueries.some(q => q.isLoading) ||
    courseQueries.some(q => q.isLoading) ||
    programQueries.some(q => q.isLoading);

  if (isLoading) {
    return (
      <div className={elimikaDesignSystem.components.pageContainer}>
        <div className='space-y-6'>
          <Skeleton className='h-12 w-64' />
          <Skeleton className='h-48 w-full' />
          <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className='h-24 w-full' />
            ))}
          </div>
          <Skeleton className='h-96 w-full' />
        </div>
      </div>
    );
  }

  return (
    <div className={elimikaDesignSystem.components.pageContainer}>
      {/* Header */}
      <section className='mb-6'>
        <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-foreground text-2xl font-bold'>My Skills</h1>
            <p className='text-muted-foreground text-sm'>
              Review, track, and develop your skills earned through course certificates
            </p>
          </div>
          <Button
            onClick={() => router.push('/dashboard/all-courses')}
            size='default'
            className='bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2'
          >
            <PlusCircle className='h-5 w-5' />
            Browse Courses
          </Button>
        </div>
      </section>

      {/* Hero Section - Skills Snapshot */}
      <section className='mb-8'>
        <Card className='border-border/50'>
          <CardContent className='p-6'>
            <div className='mb-4 flex items-center gap-2'>
              <TrendingUp className='text-primary h-6 w-6' />
              <h2 className='text-foreground text-xl font-bold'>My Skills Snapshot</h2>
            </div>

            {/* Overall Progress */}
            <div className='mb-6'>
              <div className='mb-2 flex items-center justify-between'>
                <span className='text-foreground text-sm font-medium'>
                  Average Skills Performance
                </span>
                <span className='text-primary text-2xl font-bold'>{overallProgress}%</span>
              </div>
              <div className='bg-muted h-3 w-full overflow-hidden rounded-full'>
                <div
                  className='bg-primary h-3 rounded-full transition-all duration-500'
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
              <p className='text-muted-foreground mt-1 text-xs'>
                Based on {skills.length} verified skill{skills.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Top 3 Skills Badges */}
            {topSkills.length > 0 ? (
              <div>
                <h3 className='text-foreground mb-3 flex items-center gap-2 text-sm font-semibold'>
                  <Star className='h-4 w-4 fill-yellow-500 text-yellow-500' />
                  Top Skills
                </h3>
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
                  {topSkills.map((skill, index) => (
                    <div
                      key={index}
                      className='bg-card border-border/50 rounded-lg border p-4 shadow-sm transition-shadow hover:shadow-md'
                    >
                      <div className='mb-2 flex items-start justify-between'>
                        <div
                          className={`${skill.color} flex h-12 w-12 items-center justify-center rounded-full text-2xl shadow-sm`}
                        >
                          {skill.icon}
                        </div>
                        <Badge variant='secondary' className='text-xs'>
                          Grade: {skill.grade}
                        </Badge>
                      </div>
                      <h4 className='text-foreground mb-1 text-sm font-semibold'>{skill.name}</h4>
                      <p className='text-muted-foreground text-xs'>{skill.level}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className='text-muted-foreground text-center text-sm'>
                Complete courses and earn certificates to see your top skills here
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Quick Stats */}
      <section className='mb-6'>
        <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
          <Card className='border-border/50'>
            <CardContent className='p-4'>
              <div className='mb-1 flex items-center gap-2'>
                <Award className='text-primary h-4 w-4' />
                <p className='text-muted-foreground text-xs'>Skills Earned</p>
              </div>
              <p className='text-foreground text-2xl font-bold'>{stats.skillsEarned}</p>
            </CardContent>
          </Card>

          <Card className='border-border/50'>
            <CardContent className='p-4'>
              <div className='mb-1 flex items-center gap-2'>
                <BookOpen className='text-muted-foreground h-4 w-4' />
                <p className='text-muted-foreground text-xs'>Total Enrolled</p>
              </div>
              <p className='text-foreground text-2xl font-bold'>{stats.total}</p>
            </CardContent>
          </Card>

          <Card className='border-border/50'>
            <CardContent className='p-4'>
              <div className='mb-1 flex items-center gap-2'>
                <CheckCircle className='h-4 w-4 text-green-500' />
                <p className='text-muted-foreground text-xs'>Completed</p>
              </div>
              <p className='text-2xl font-bold text-green-600'>{stats.completed}</p>
            </CardContent>
          </Card>

          <Card className='border-border/50'>
            <CardContent className='p-4'>
              <div className='mb-1 flex items-center gap-2'>
                <Clock className='h-4 w-4 text-yellow-500' />
                <p className='text-muted-foreground text-xs'>In Progress</p>
              </div>
              <p className='text-2xl font-bold text-yellow-600'>{stats.inProgress}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Enrolled Courses List */}
      <section>
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='text-foreground flex items-center gap-2 text-xl font-bold'>
            <BookOpen className='h-5 w-5' />
            My Enrolled Courses
          </h2>
        </div>

        {enrolledCourses.length > 0 ? (
          <div className='space-y-4'>
            {enrolledCourses.map(course => {
              const statusInfo = getStatusBadge(course.status);
              const StatusIcon = statusInfo.icon;

              return (
                <Card
                  key={course.id}
                  className='border-border/50 transition-shadow hover:shadow-md'
                >
                  <CardContent className='p-5'>
                    <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
                      <div className='flex-1'>
                        <div className='mb-2 flex items-start gap-3'>
                          <div className='mt-1'>
                            <StatusIcon className={`h-5 w-5 ${statusInfo.text_color}`} />
                          </div>
                          <div className='flex-1'>
                            <h3 className='text-foreground mb-1 font-semibold'>{course.title}</h3>
                            {course.classTitle && course.classTitle !== course.title && (
                              <p className='text-muted-foreground mb-2 text-sm'>
                                Class: {course.classTitle}
                              </p>
                            )}
                            {course.description && (
                              <p className='text-muted-foreground mb-3 text-sm'>
                                {course.description}
                              </p>
                            )}
                            <div className='flex flex-wrap items-center gap-2'>
                              <Badge className={`${statusInfo.bg} ${statusInfo.text_color}`}>
                                {statusInfo.text}
                              </Badge>
                              <Badge variant='outline' className='text-xs'>
                                {course.type}
                              </Badge>
                              <Badge variant='secondary' className='text-xs'>
                                {course.category}
                              </Badge>
                              {course.grade && (
                                <Badge
                                  variant='outline'
                                  className={`text-xs font-semibold ${getGradeColor(course.grade)}`}
                                >
                                  Grade: {course.grade}
                                </Badge>
                              )}
                              {course.completedDate && (
                                <span className='text-muted-foreground text-xs'>
                                  Completed: {new Date(course.completedDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <div className='text-muted-foreground mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs'>
                              {course.duration && <span>Duration: {course.duration}</span>}
                              {course.classLimit && <span>Class limit: {course.classLimit}</span>}
                              <span>Status: {course.enrollmentStatus || 'ACTIVE'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className='mt-3'>
                          <div className='mb-1 flex items-center justify-between'>
                            <span className='text-muted-foreground text-xs'>Progress</span>
                            <span className='text-foreground text-xs font-semibold'>
                              {course.progress}%
                            </span>
                          </div>
                          <div className='bg-muted h-2 w-full overflow-hidden rounded-full'>
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                course.status === 'complete' || course.status === 'passed'
                                  ? 'bg-success'
                                  : course.status === 'failed'
                                    ? 'bg-destructive'
                                    : 'bg-yellow-500'
                              }`}
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className='flex gap-2 sm:ml-4 sm:flex-col'>
                        <Button
                          variant='outline'
                          size='sm'
                          className='flex-1 sm:flex-none'
                          disabled={!course.course_uuid}
                          onClick={() =>
                            window.open(`/dashboard/all-courses/${course.course_uuid}`, '_blank')
                          }
                        >
                          View Course
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className='border-border/50'>
            <CardContent className='p-8 text-center'>
              <BookOpen className='text-muted-foreground mx-auto mb-3 h-12 w-12' />
              <h3 className='text-foreground mb-2 text-lg font-semibold'>
                No courses enrolled yet
              </h3>
              <p className='text-muted-foreground mb-4'>
                Start your learning journey by enrolling in a course
              </p>
              <Button
                onClick={() => router.push('/dashboard/all-courses')}
                className='bg-primary text-primary-foreground hover:bg-primary/90'
              >
                Browse Courses
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Earned Skills/Certificates Section */}
      {skills.length > 0 && (
        <section className='mt-8'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-foreground flex items-center gap-2 text-xl font-bold'>
              <Award className='h-5 w-5' />
              Earned Skills & Certificates
            </h2>
          </div>

          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {skills.map(skill => (
              <Card key={skill.uuid} className='border-border/50 transition-shadow hover:shadow-md'>
                <CardContent className='p-4'>
                  <div className='mb-3 flex items-start justify-between'>
                    <div className='flex-1'>
                      <h4 className='text-foreground mb-1 font-semibold'>{skill.name}</h4>
                      <p className='text-muted-foreground text-xs'>{skill.certificateType}</p>
                    </div>
                    <Badge className={`shrink-0 ${getGradeColor(skill.grade)}`}>
                      {skill.grade}
                    </Badge>
                  </div>

                  <div className='space-y-2'>
                    <div className='flex items-center justify-between text-xs'>
                      <span className='text-muted-foreground'>Score</span>
                      <span className='text-foreground font-semibold'>{skill.finalGrade}%</span>
                    </div>
                    <div className='flex items-center justify-between text-xs'>
                      <span className='text-muted-foreground'>Level</span>
                      <Badge variant='secondary' className='text-xs'>
                        {skill.level}
                      </Badge>
                    </div>
                    <div className='flex items-center justify-between text-xs'>
                      <span className='text-muted-foreground'>Completed</span>
                      <span className='text-foreground'>
                        {new Date(skill.completedDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {skill.isDownloadable && skill.certificateUrl && (
                    <Button
                      variant='outline'
                      size='sm'
                      className='mt-3 w-full'
                      onClick={() => window.open(skill.certificateUrl, '_blank')}
                    >
                      <Download className='mr-2 h-3 w-3' />
                      Download Certificate
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className='mb-20' />
    </div>
  );
};

export default MySkillsPage;
