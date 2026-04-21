'use client';

import { useUserDomain } from '@/context/user-domain-context';
import type { CourseCreatorSkill, Student, StudentSchedule } from '@/services/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, CheckCircle, Clock, PlusCircle, Star, TrendingUp, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '../../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { useCourseCreator } from '../../../../context/course-creator-context';
import { useMultipleClassDetails } from '../../../../hooks/use-class-multiple-details';
import { useUserDomains } from '../../../../hooks/use-user-query';
import {
  addCourseCreatorSkillMutation,
  getCourseCreatorSkillsOptions,
  getCourseCreatorSkillsQueryKey,
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
  beginner: 25,
  intermediate: 50,
  advanced: 75,
  expert: 100,
};

const skillColorMap = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-muted', 'bg-primary/80'];

type SkillProficiency = CourseCreatorSkill['proficiency_level'];

const skillProficiencyOptions: SkillProficiency[] = [
  'beginner',
  'intermediate',
  'advanced',
  'expert',
];

const isSkillProficiency = (value: string): value is SkillProficiency => {
  return skillProficiencyOptions.includes(value as SkillProficiency);
};

const getSkillColor = (index: number) =>
  skillColorMap[index % skillColorMap.length] ?? 'bg-primary';

type SkillCard = {
  name: string;
  level: CourseCreatorSkill['proficiency_level'];
  icon: string;
  color: string;
};

type CourseView = {
  name?: string;
  status?: string;
  category_names?: string[];
  grade?: string;
  completedDate?: string | Date;
  progress?: number;
};

type ClassWithCourse = {
  class?: {
    uuid?: string;
    title?: string;
  } | null;
  course?: CourseView | null;
};

type CourseStatus = 'complete' | 'passed' | 'failed' | 'incomplete';

type StatusBadge = {
  text: string;
  bg: string;
  text_color: string;
  icon: typeof CheckCircle | typeof XCircle | typeof Clock;
};

const MySkillsPage = () => {
  const router = useRouter();
  const creator = useCourseCreator();
  const queryClient = useQueryClient();
  const uuid = creator?.profile?.uuid as string;
  const { domains } = useUserDomains();
  const userDomain = useUserDomain();
  const userDomains = Array.isArray(domains) ? domains : domains ? [domains] : [];
  const hasStudentProfile = userDomains.includes('student');

  const [showStudentProfileNotice, setShowStudentProfileNotice] = useState(false);
  const [isAddSkillModalOpen, setIsAddSkillModalOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillProficiency, setNewSkillProficiency] = useState<SkillProficiency | ''>('');

  const addSkillMutation = useMutation({
    ...addCourseCreatorSkillMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getCourseCreatorSkillsQueryKey({
          query: { pageable: {} },
          path: { courseCreatorUuid: uuid as string },
        }),
      });
      // Reset form and close modal
      setNewSkillName('');
      setNewSkillProficiency('');
      setIsAddSkillModalOpen(false);
    },
  });

  const handleAddSkill = () => {
    if (!newSkillName.trim() || !newSkillProficiency) {
      return;
    }

    addSkillMutation.mutate({
      body: {
        course_creator_uuid: uuid,
        skill_name: newSkillName.trim(),
        proficiency_level: newSkillProficiency,
      },
      path: { courseCreatorUuid: uuid },
    });
  };

  const { data: studentSearch } = useQuery({
    ...searchStudentsOptions({
      query: {
        pageable: {},
        searchParams: { user_uuid_eq: creator?.profile?.user_uuid as string },
      },
    }),
    enabled: !!creator?.profile?.user_uuid,
  });
  const studentSearchResults = (studentSearch?.content ?? []) as Student[];
  const studentInfo = studentSearchResults[0];

  const { data, isLoading: skillsIsLoading } = useQuery({
    ...getCourseCreatorSkillsOptions({
      path: { courseCreatorUuid: uuid },
      query: { pageable: {} },
    }),
    enabled: !!uuid,
  });
  const apiSkills: CourseCreatorSkill[] = data?.data?.content ?? [];
  const skills = apiSkills;

  // overall progress = average proficiency score
  const overallProgress =
    skills.length > 0
      ? Math.round(
          skills.reduce(
            (acc, skill) => acc + (proficiencyScoreMap[skill.proficiency_level.toLowerCase()] || 0),
            0
          ) / skills.length
        )
      : 0;

  // top 3 skills by proficiency
  const topSkills: SkillCard[] = [...skills]
    .sort(
      (a, b) =>
        (proficiencyScoreMap[b.proficiency_level.toLowerCase()] || 0) -
        (proficiencyScoreMap[a.proficiency_level.toLowerCase()] || 0)
    )
    .slice(0, 3)
    .map((skill, index) => ({
      name: skill.skill_name,
      level: skill.proficiency_level,
      icon: '⭐',
      color: getSkillColor(index),
    }));

  const { data: studentEnrollmentData } = useQuery({
    ...getStudentScheduleOptions({
      path: { studentUuid: studentInfo?.uuid ?? '' },
      query: { start: new Date('2026-01-20'), end: new Date('2027-01-20') },
    }),
    enabled: !!studentInfo?.uuid,
  });

  const studentEnrollmentsApi: StudentSchedule[] = studentEnrollmentData?.data ?? [];
  // const studentEnrollments = useMockEnrollment ? mockStudentEnrollments : studentEnrollmentsApi;
  const studentEnrollments = studentEnrollmentsApi;

  const uniqueClassDefinitionUuids = [
    ...new Set(
      studentEnrollments
        .map(enrollment => enrollment.class_definition_uuid)
        .filter((uuid): uuid is string => Boolean(uuid))
    ),
  ];

  const { data: allClasses, isLoading: enrollmentIsLoading } = useMultipleClassDetails(
    uniqueClassDefinitionUuids
  );
  const classDetails = allClasses as ClassWithCourse[];

  const getStatusBadge = (status?: string): StatusBadge => {
    const badges: Record<CourseStatus, StatusBadge> = {
      complete: {
        text: 'Completed',
        bg: 'bg-primary/10',
        text_color: 'text-primary',
        icon: CheckCircle,
      },
      passed: {
        text: 'Passed',
        bg: 'bg-primary/10',
        text_color: 'text-primary',
        icon: CheckCircle,
      },
      failed: {
        text: 'Failed',
        bg: 'bg-destructive/10',
        text_color: 'text-destructive',
        icon: XCircle,
      },
      incomplete: {
        text: 'In Progress',
        bg: 'bg-muted',
        text_color: 'text-muted-foreground',
        icon: Clock,
      },
    };

    if (status === 'complete' || status === 'passed' || status === 'failed') {
      return badges[status];
    }

    return badges.incomplete;
  };

  const getGradeColor = (grade?: string | null) => {
    if (!grade) return 'text-muted-foreground';
    if (grade.startsWith('A')) return 'text-primary';
    if (grade.startsWith('B')) return 'text-primary/80';
    if (grade.startsWith('C')) return 'text-muted-foreground';
    if (grade.startsWith('D')) return 'text-destructive/80';
    return 'text-destructive';
  };

  const stats = {
    total: classDetails.length,
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

          <div className='flex flex-row items-center gap-4'>
            {/* <Button
              size='default'
              className='bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2'
              onClick={() => setIsAddSkillModalOpen(true)}
            >
              <PlusCircle className='h-5 w-5' />
              Add New Skill
            </Button> */}

            <Button
              size='default'
              className='bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2'
              // onClick={() => { setShowStudentProfileNotice(true) }}
              onClick={() => router.push('/dashboard/courses')}
            >
              {/* Browse Courses */}
              <PlusCircle className='h-5 w-5' />
              Add New Skill
            </Button>
          </div>
        </div>
      </section>

      {showStudentProfileNotice && (
        <div className='border-destructive bg-destructive/10 text-destructive my-6 flex flex-col gap-3 rounded-md border-l-4 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4'>
          <div className='flex flex-col gap-1'>
            <p className='font-medium'>⚠️ Student profile required</p>
            <p className='text-destructive/90 text-sm'>
              To add skills to your skill set, you need a student profile. If you already have one,
              simply switch profile. Otherwise, create a student profile to continue.
            </p>
          </div>

          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              className='border-destructive text-destructive hover:bg-destructive/10'
              onClick={async () => {
                if (userDomain.activeDomain === 'student') return;

                userDomain.setActiveDomain('student');

                // allow context to update
                await new Promise(resolve => setTimeout(resolve, 300));

                router.push('/dashboard/overview');
                router.refresh();
              }}
            >
              Switch profile
            </Button>

            {!hasStudentProfile && (
              <Button
                size='sm'
                className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                onClick={() => router.push('/dashboard/add-profile')}
              >
                Create profile
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Hero Section - Skills Snapshot */}
      <section className='mb-8'>
        <div className='bg-muted border-input rounded-xl border p-6 shadow-sm'>
          <div className='mb-4 flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <TrendingUp className='text-primary h-6 w-6' />
              <h2 className='text-foreground text-xl font-bold'>My Skills Snapshot</h2>
            </div>

            {/* <Button
              variant='outline'
              size='sm'
              onClick={() => setUseMockData(prev => !prev)}
              className='text-xs'
            >
              {useMockData ? 'Use API Data' : 'Use Demo Data'}
            </Button> */}
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
                  <Button
                    onClick={() => setIsAddSkillModalOpen(true)}
                    className='hidden items-center gap-2'
                  >
                    <PlusCircle className='h-4 w-4' />
                    Add New Skill
                  </Button>

                  <Button
                    size='default'
                    className='bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2'
                    // onClick={() => {  setShowStudentProfileNotice(true);}}
                    onClick={() => router.push('/dashboard/courses')}
                  >
                    {/* Browse Courses */}
                    <PlusCircle className='h-5 w-5' />
                    Add New Skill
                  </Button>
                </div>
              ) : (
                <div>
                  <h3 className='text-foreground mb-3 flex items-center gap-2 text-sm font-semibold'>
                    <Star className='fill-primary text-primary h-4 w-4' />
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
        <div className='grid grid-cols-2 gap-4 sm:grid-cols-3'>
          <div className='bg-card border-input rounded-lg border p-4 shadow-sm'>
            <div className='mb-1 flex items-center gap-2'>
              <BookOpen className='text-muted-foreground h-4 w-4' />
              <p className='text-muted-foreground text-xs'>Total Courses</p>
            </div>
            <p className='text-foreground text-2xl font-bold'>{stats.total}</p>
          </div>
          <div className='bg-card border-input rounded-lg border p-4 shadow-sm'>
            <div className='mb-1 flex items-center gap-2'>
              <CheckCircle className='text-primary h-4 w-4' />
              <p className='text-muted-foreground text-xs'>Completed</p>
            </div>
            <p className='text-primary text-2xl font-bold'>{stats.completed}</p>
          </div>
          <div className='bg-card border-input rounded-lg border p-4 shadow-sm'>
            <div className='mb-1 flex items-center gap-2'>
              <Clock className='text-muted-foreground h-4 w-4' />
              <p className='text-muted-foreground text-xs'>In Progress</p>
            </div>
            <p className='text-muted-foreground text-2xl font-bold'>{stats.inProgress}</p>
          </div>
          {/* <div className='bg-card border-input rounded-lg border p-4 shadow-sm'>
            <div className='mb-1 flex items-center gap-2'>
              <XCircle className='text-destructive h-4 w-4' />
              <p className='text-muted-foreground text-xs'>Failed</p>
            </div>
            <p className='text-destructive text-2xl font-bold'>{stats.failed}</p>
          </div> */}
        </div>
      </section>

      {/* Enrolled Courses List */}
      <section>
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='text-foreground flex items-center gap-2 text-xl font-bold'>
            <BookOpen className='h-5 w-5' />
            Enrolled Courses
          </h2>

          {/* <Button
            variant='outline'
            size='sm'
            onClick={() => setUseMockEnrollment(prev => !prev)}
            className='text-xs'
          >
            {useMockEnrollment ? 'Use API Data' : 'Use Demo Data'}
          </Button> */}
        </div>

        {enrollmentIsLoading ? (
          <EnrollmentSkeleton />
        ) : (
          <>
            <div className='space-y-4'>
              {classDetails.map((en, index) => {
                const statusInfo = getStatusBadge(en?.course?.status);
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={en?.class?.uuid ?? `class-${index}`}
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
                                {en?.course?.category_names?.join(', ') || 'Uncategorized'}
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
                                  ? 'bg-primary'
                                  : en?.course?.status === 'failed'
                                    ? 'bg-destructive'
                                    : 'bg-muted-foreground'
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

            {classDetails.length === 0 && (
              <div className='bg-muted border-input rounded-lg border p-8 text-center'>
                <BookOpen className='text-muted-foreground mx-auto mb-3 h-12 w-12' />
                <h3 className='text-foreground mb-2 text-lg font-semibold'>
                  No courses enrolled yet
                </h3>
                <p className='text-muted-foreground mb-4'>
                  Start your learning journey. enroll in a course and obtain new skills.
                </p>
                {/* <button
                  onClick={() => {
                    setShowStudentProfileNotice(true);
                  }}
                  className='bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 py-2 font-medium transition-colors'>
                  Browse Courses
                </button> */}
              </div>
            )}
          </>
        )}
      </section>

      <section className='mb-20' />

      {/* Add Skill Modal */}
      <Dialog open={isAddSkillModalOpen} onOpenChange={setIsAddSkillModalOpen}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>Add New Skill</DialogTitle>
            <DialogDescription>
              Add a new skill to your profile. Specify the skill name and your proficiency level.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='skill-name'>Skill Name</Label>
              <Input
                id='skill-name'
                placeholder='e.g., Instructional Design'
                value={newSkillName}
                onChange={e => setNewSkillName(e.target.value)}
                disabled={addSkillMutation.isPending}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='proficiency-level'>Proficiency Level</Label>
              <Select
                value={newSkillProficiency}
                onValueChange={value => {
                  setNewSkillProficiency(isSkillProficiency(value) ? value : '');
                }}
                disabled={addSkillMutation.isPending}
              >
                <SelectTrigger id='proficiency-level'>
                  <SelectValue placeholder='Select proficiency level' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='beginner'>Beginner</SelectItem>
                  <SelectItem value='intermediate'>Intermediate</SelectItem>
                  <SelectItem value='advanced'>Advanced</SelectItem>
                  <SelectItem value='expert'>Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {addSkillMutation.isError && (
              <div className='bg-destructive/10 text-destructive rounded-md p-3 text-sm'>
                Failed to add skill. Please try again.
              </div>
            )}
          </div>

          <div className='flex justify-end gap-3'>
            <Button
              variant='outline'
              onClick={() => {
                setIsAddSkillModalOpen(false);
                setNewSkillName('');
                setNewSkillProficiency('');
              }}
              disabled={addSkillMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddSkill}
              disabled={!newSkillName.trim() || !newSkillProficiency || addSkillMutation.isPending}
            >
              {addSkillMutation.isPending ? 'Adding...' : 'Add Skill'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MySkillsPage;
