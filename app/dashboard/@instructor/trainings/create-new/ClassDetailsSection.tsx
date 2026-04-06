'use client';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, GraduationCap } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Textarea } from '../../../../../components/ui/textarea';
import { useInstructor } from '../../../../../context/instructor-context';
import {
  getAllCoursesOptions,
  getAllDifficultyLevelsOptions,
  getAllTrainingProgramsOptions,
  searchProgramTrainingApplicationsOptions,
  searchTrainingApplicationsOptions,
} from '../../../../../services/client/@tanstack/react-query.gen';
import { ClassDetails } from './page';

const CLASS_TYPE_OPTIONS = [
  { label: 'Group', value: 'PUBLIC' },
  { label: 'Private', value: 'PRIVATE' },
];

const LECTURE_TYPE_OPTIONS = [
  { label: 'Online', value: 'ONLINE' },
  { label: 'In-person', value: 'IN_PERSON' },
  { label: 'Hybrid', value: 'HYBRID' },
];

const CLASS_FOR_OPTIONS = [
  { label: 'Course', value: 'course', icon: BookOpen },
  { label: 'Program', value: 'program', icon: GraduationCap },
];

export const ClassDetailsSection = ({
  data,
  onChange,
  courseDetail,
}: {
  data: ClassDetails;
  onChange: (updates: Partial<ClassDetails>) => void;
  courseDetail?: any;
}) => {
  const instructor = useInstructor();
  const prevCourseRef = useRef<string | null>(null);
  const prevProgramRef = useRef<string | null>(null);
  const prevClassTypeRef = useRef<string | null>(null);
  const prevLectureTypeRef = useRef<string | null>(null);

  // State for class type selection (course or program)
  const [classFor, setClassFor] = useState<'course' | 'program'>('course');

  // Detect classFor from existing data when editing
  useEffect(() => {
    if (data.program_uuid) {
      setClassFor('program');
    } else if (data.course_uuid) {
      setClassFor('course');
    }
  }, [data.program_uuid, data.course_uuid]);

  const { data: difficulty } = useQuery(getAllDifficultyLevelsOptions());
  const difficultyLevels = difficulty?.data;

  const getDifficultyNameFromUUID = useCallback(
    (uuid: string): string | undefined => {
      return difficultyLevels?.find(level => level.uuid === uuid)?.name;
    },
    [difficultyLevels]
  );

  // COURSES //
  const { data: courses } = useQuery(getAllCoursesOptions({ query: { pageable: {} } }));
  const { data: appliedCourses } = useQuery({
    ...searchTrainingApplicationsOptions({
      query: {
        pageable: {},
        searchParams: { applicant_uuid_eq: instructor?.uuid as string },
      },
    }),
    enabled: !!instructor?.uuid,
  });
  const approvedCourses = useMemo(() => {
    if (!courses?.data?.content || !appliedCourses?.data?.content) return [];

    const approvedApplicationMap = new Map(
      appliedCourses.data.content
        .filter(app => app.status === 'approved')
        .map(app => [app.course_uuid, app])
    );

    return courses.data.content
      .filter(course => approvedApplicationMap.has(course.uuid))
      .map(course => ({
        ...course,
        application: approvedApplicationMap.get(course.uuid),
      }));
  }, [courses, appliedCourses]);

  // PROGRAMS //
  const { data: programs } = useQuery(getAllTrainingProgramsOptions({ query: { pageable: {} } }));
  const { data: appliedPrograms } = useQuery({
    ...searchProgramTrainingApplicationsOptions({
      query: {
        pageable: {},
        searchParams: { applicant_uuid_eq: instructor?.uuid as string },
      },
    }),
    enabled: !!instructor?.uuid,
  });
  const approvedPrograms = useMemo(() => {
    if (!programs?.data?.content || !appliedPrograms?.data?.content) return [];

    const approvedApplicationMap = new Map(
      appliedPrograms.data.content
        .filter(app => app.status === 'approved')
        .map(app => [app.program_uuid, app])
    );

    return programs.data.content
      .filter(program => approvedApplicationMap.has(program.uuid))
      .map(program => ({
        ...program,
        application: approvedApplicationMap.get(program.uuid),
      }));
  }, [programs, appliedPrograms]);

  const selectedCourse = useMemo(() => {
    return approvedCourses.find(course => course.uuid === data.course_uuid);
  }, [approvedCourses, data.course_uuid]);

  const selectedProgram = useMemo(() => {
    return approvedPrograms.find(program => program.uuid === data.program_uuid);
  }, [approvedPrograms, data.program_uuid]);

  const selectedItem = classFor === 'course' ? selectedCourse : selectedProgram;

  // Handle course selection and auto-populate categories
  useEffect(() => {
    if (!selectedCourse || prevCourseRef.current === data.course_uuid) return;

    prevCourseRef.current = data.course_uuid;
    onChange({ categories: selectedCourse.category_names ?? [] });
    onChange({ class_limit: selectedCourse.class_limit });
  }, [selectedCourse, data.course_uuid, onChange]);

  // Handle program selection and auto-populate categories
  useEffect(() => {
    if (!selectedProgram || prevProgramRef.current === data.program_uuid) return;

    prevProgramRef.current = data.program_uuid;
    onChange({ categories: selectedProgram.category_names ?? [] });
    onChange({ class_limit: selectedProgram.class_limit });
  }, [selectedProgram, data.program_uuid, onChange]);

  // Handle class type & lecture type change to update rate card for COURSES
  useEffect(() => {
    if (
      classFor !== 'course' ||
      !data.class_type ||
      !data.location_type ||
      !selectedCourse?.application?.rate_card
    )
      return;

    const shouldUpdate =
      prevClassTypeRef.current !== data.class_type ||
      prevLectureTypeRef.current !== data.location_type;

    if (!shouldUpdate) return;

    prevClassTypeRef.current = data.class_type;
    prevLectureTypeRef.current = data.location_type;

    const rateCardKey = `${data.class_type}_${data.location_type}_rate`;
    const rate =
      selectedCourse.application.rate_card[
        rateCardKey as keyof typeof selectedCourse.application.rate_card
      ];

    if (rate !== undefined) {
      onChange({ rate_card: String(rate) });
    }
  }, [data.class_type, data.location_type, selectedCourse, onChange, classFor]);

  // Handle class type & lecture type change to update rate card for PROGRAMS
  useEffect(() => {
    if (
      classFor !== 'program' ||
      !data.class_type ||
      !data.location_type ||
      !selectedProgram?.application?.rate_card
    )
      return;

    const shouldUpdate =
      prevClassTypeRef.current !== data.class_type ||
      prevLectureTypeRef.current !== data.location_type;

    if (!shouldUpdate) return;

    prevClassTypeRef.current = data.class_type;
    prevLectureTypeRef.current = data.location_type;

    const rateCardKey = `${data.class_type}_${data.location_type}_rate`;
    const rate =
      selectedProgram.application.rate_card[
        rateCardKey as keyof typeof selectedProgram.application.rate_card
      ];

    if (rate !== undefined) {
      onChange({ rate_card: String(rate) });
    }
  }, [data.class_type, data.location_type, selectedProgram, onChange, classFor]);

  // Handle classFor toggle - clear the opposite selection
  const handleClassForChange = (value: 'course' | 'program') => {
    setClassFor(value);
    if (value === 'course') {
      onChange({ program_uuid: undefined });
    } else {
      onChange({ course_uuid: undefined });
    }
  };

  return (
    <Card className='overflow-hidden border pt-0 shadow-sm'>
      <div className='bg-muted/50 border-b px-6 py-4'>
        <h3 className='text-foreground text-lg font-semibold'>Class Details</h3>
      </div>

      <div className='divide-y'>
        {/* Class Type Selector (Course vs Program) */}
        {!data?.uuid && (
          <div className='grid grid-cols-3 pb-4 hover:bg-transparent'>
            <div className='bg-muted/30 px-6 font-semibold'>Create Class For *</div>
            <div className='bg-card col-span-2 px-6'>
              <div className='flex gap-4'>
                {CLASS_FOR_OPTIONS.map(option => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleClassForChange(option.value as 'course' | 'program')}
                      className={`flex flex-1 items-center gap-3 rounded-lg border-2 p-4 transition-all ${
                        classFor === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          classFor === option.value ? 'bg-primary/20' : 'bg-muted'
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 ${
                            classFor === option.value ? 'text-primary' : 'text-muted-foreground'
                          }`}
                        />
                      </div>
                      <div className='text-left'>
                        <div className='text-sm font-semibold'>{option.label}</div>
                        <div className='text-muted-foreground text-xs'>
                          {option.value === 'course'
                            ? `${approvedCourses.length} available`
                            : `${approvedPrograms.length} available`}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Class Name/Category */}
        <div className='grid grid-cols-3 hover:bg-transparent'>
          <div className='bg-muted/30 px-6 py-4 font-semibold'>Class Name/Category *</div>
          <div className='bg-card col-span-2 px-6 py-4'>
            <Input
              placeholder='Enter class title'
              value={data.title}
              onChange={e => onChange({ title: e.target.value })}
            />
          </div>
        </div>

        {/* Course/Program Selection */}
        <div className='grid grid-cols-3 hover:bg-transparent'>
          <div className='bg-muted/30 px-6 py-4 font-semibold'>
            {classFor === 'course' ? 'Course/Subject' : 'Training Program'} *
          </div>
          <div className='bg-card col-span-2 px-6 py-4'>
            {classFor === 'course' ? (
              <Select
                value={data.course_uuid}
                onValueChange={value => onChange({ course_uuid: value })}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue>
                    {selectedCourse ? selectedCourse.name : 'Select a course'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {approvedCourses.length === 0 ? (
                    <div className='text-muted-foreground p-4 text-center text-sm'>
                      No approved courses available
                    </div>
                  ) : (
                    approvedCourses.map(course => (
                      <SelectItem key={course.uuid} value={course.uuid as string}>
                        {course.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            ) : (
              <Select
                value={data.program_uuid}
                onValueChange={value => onChange({ program_uuid: value })}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue>
                    {selectedProgram ? selectedProgram.title : 'Select a program'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {approvedPrograms.length === 0 ? (
                    <div className='text-muted-foreground p-4 text-center text-sm'>
                      No approved programs available
                    </div>
                  ) : (
                    approvedPrograms.map(program => (
                      <SelectItem key={program.uuid} value={program.uuid as string}>
                        {program.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Class Description */}
        <div className='grid grid-cols-3 hover:bg-transparent'>
          <div className='bg-muted/30 px-6 py-4 font-semibold'>Class Description</div>
          <div className='bg-card col-span-2 px-6 py-4'>
            <Textarea
              placeholder='Enter class description'
              value={data.description}
              rows={6}
              onChange={e => onChange({ description: e.target.value })}
            />
          </div>
        </div>

        {/* Grade/Level */}
        <div className='grid grid-cols-3 hover:bg-transparent'>
          <div className='bg-muted/30 px-6 py-4 font-semibold'>Grade/Level</div>
          <div className='bg-card text-muted-foreground col-span-2 grid grid-cols-3 gap-4 px-6 py-4 text-sm'>
            <div>{getDifficultyNameFromUUID(selectedItem?.difficulty_uuid || '') || '—'}</div>

            <div>{selectedItem?.class_limit ?? '—'} max participants</div>

            <div>{/* third column (leave empty or add something later) */}</div>
          </div>
        </div>

        {/* Class Type (Group/Private) */}
        <div className='grid grid-cols-3 hover:bg-transparent'>
          <div className='bg-muted/30 px-6 py-4 font-semibold'>Class Type *</div>
          <div className='bg-card col-span-2 px-6 py-4'>
            <div className='flex gap-6'>
              {CLASS_TYPE_OPTIONS.map(option => (
                <label key={option.value} className='flex cursor-pointer items-center gap-3'>
                  <input
                    type='radio'
                    name='class_type'
                    value={option.value}
                    checked={data.class_type === option.value}
                    onChange={e => onChange({ class_type: e.target.value })}
                    className='h-4 w-4'
                  />
                  <span className='text-foreground text-sm font-medium'>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Lecture Type (Online/In-person/Hybrid) */}
        <div className='grid grid-cols-3 hover:bg-transparent'>
          <div className='bg-muted/30 px-6 py-4 font-semibold'>Lecture Type *</div>
          <div className='bg-card col-span-2 px-6 py-4'>
            <div className='flex gap-6'>
              {LECTURE_TYPE_OPTIONS.map(option => (
                <label key={option.value} className='flex cursor-pointer items-center gap-3'>
                  <input
                    type='radio'
                    name='lecture_type'
                    value={option.value}
                    checked={data.location_type === option.value}
                    onChange={e => onChange({ location_type: e.target.value })}
                    className='h-4 w-4'
                  />
                  <span className='text-foreground text-sm font-medium'>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Rate Card */}
        <div className='grid grid-cols-3 hover:bg-transparent'>
          <div className='bg-muted/30 px-6 py-4 font-semibold'>Rate Card</div>
          <div className='bg-card col-span-2 px-6 py-4'>
            <div className='border-input bg-muted flex h-10 w-full cursor-not-allowed items-center gap-2 rounded-md border px-3 text-sm'>
              <span>
                {data.rate_card ||
                  `Auto-calculated from ${classFor === 'course' ? 'course' : 'program'}`}
              </span>
              <span className='text-muted-foreground'>
                ({selectedItem?.application?.rate_card?.currency || 'N/A'})
              </span>
            </div>
            <p className='text-muted-foreground mt-2 text-xs'>
              Rate is automatically set based on {classFor === 'course' ? 'course' : 'program'} and
              class type
            </p>
          </div>
        </div>
      </div>

    </Card>
  );
};
