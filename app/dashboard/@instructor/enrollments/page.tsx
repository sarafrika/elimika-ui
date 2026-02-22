'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useInstructor } from '@/context/instructor-context';
import { elimikaDesignSystem } from '@/lib/design-system';
import {
  getClassDefinitionsForInstructorOptions,
  getEnrollmentsForClassOptions,
  getStudentByIdOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQueries, useQuery } from '@tanstack/react-query';
import {
  Award,
  BookOpen,
  Filter,
  GraduationCap,
  Search,
  Send,
  TrendingUp,
  Users,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const EnrollmentsPage = () => {
  const router = useRouter();
  const instructor = useInstructor();

  // State
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [classSearchQuery, setClassSearchQuery] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'enrollments'>('name');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch classes
  const { data: classesData, isLoading: isLoadingClasses } = useQuery({
    ...getClassDefinitionsForInstructorOptions({
      path: { instructorUuid: instructor?.uuid as string },
      query: { activeOnly: true },
    }),
    enabled: !!instructor?.uuid,
  });

  const instructorClasses = classesData?.data?.map((item: any) => item.class_definition) || [];

  // Fetch enrollments for all classes
  const enrollmentQueries = useQueries({
    queries: instructorClasses.map((classItem: any) => ({
      ...getEnrollmentsForClassOptions({
        path: { uuid: classItem.uuid },
      }),
      enabled: !!classItem.uuid,
    })),
  });

  // Calculate enrollment counts and KPIs
  const { enrollmentCountsByClass, totalStudents, totalClasses, avgEnrollment } = useMemo(() => {
    const counts: Record<string, number> = {};
    let totalUniqueStudents = new Set<string>();
    let totalEnrollments = 0;

    instructorClasses.forEach((classItem: any, index: number) => {
      const enrollments = enrollmentQueries[index]?.data?.data || [];
      const uniqueStudents = new Set(enrollments.map((e: any) => e.student_uuid));

      counts[classItem.uuid] = uniqueStudents.size;
      totalEnrollments += uniqueStudents.size;

      enrollments.forEach((e: any) => totalUniqueStudents.add(e.student_uuid));
    });

    return {
      enrollmentCountsByClass: counts,
      totalStudents: totalUniqueStudents.size,
      totalClasses: instructorClasses.length,
      avgEnrollment: instructorClasses.length > 0 ? totalEnrollments / instructorClasses.length : 0,
    };
  }, [instructorClasses, enrollmentQueries]);

  // Filter and sort classes
  const filteredClasses = useMemo(() => {
    let filtered = instructorClasses.filter((classItem: any) =>
      classItem.title?.toLowerCase().includes(classSearchQuery.toLowerCase())
    );

    if (sortBy === 'enrollments') {
      filtered.sort((a: any, b: any) =>
        (enrollmentCountsByClass[b.uuid] || 0) - (enrollmentCountsByClass[a.uuid] || 0)
      );
    } else {
      filtered.sort((a: any, b: any) =>
        (a.title || '').localeCompare(b.title || '')
      );
    }

    return filtered;
  }, [instructorClasses, classSearchQuery, sortBy, enrollmentCountsByClass]);

  // Set initial selected class
  useEffect(() => {
    if (!selectedClassId && filteredClasses.length > 0) {
      setSelectedClassId(filteredClasses[0].uuid);
    }
  }, [filteredClasses, selectedClassId]);

  // Get enrollments and students for selected class
  const selectedClassIndex = instructorClasses.findIndex((c: any) => c.uuid === selectedClassId);
  const enrollmentsForSelectedClass =
    selectedClassIndex >= 0 ? enrollmentQueries[selectedClassIndex]?.data?.data || [] : [];
  const isLoadingEnrollments =
    selectedClassIndex >= 0 ? enrollmentQueries[selectedClassIndex]?.isLoading : false;

  const uniqueStudentUuids: string[] = Array.from(
    new Set(enrollmentsForSelectedClass.map((e: any) => e.student_uuid).filter(Boolean))
  );

  const studentQueries = useQueries({
    queries: uniqueStudentUuids.map((studentUuid: string) => ({
      ...getStudentByIdOptions({
        path: { uuid: studentUuid },
      }),
      enabled: !!studentUuid,
    })),
  });

  const studentsData = studentQueries.map(q => q.data).filter(Boolean);
  const students = studentsData?.map((item: any) => item.data) || [];

  // Filter students by search query
  const filteredStudents = useMemo(() => {
    return students.filter((student: any) =>
      student?.full_name?.toLowerCase().includes(studentSearchQuery.toLowerCase())
    );
  }, [students, studentSearchQuery]);

  const selectedClass = instructorClasses.find((c: any) => c.uuid === selectedClassId);
  const isLoadingStudents = studentQueries.some(q => q.isLoading);

  const handleViewProfile = (studentUuid: string) => {
    router.push(`/dashboard/enrollments/${selectedClassId}?id=${studentUuid}`);
  };

  return (
    <div className={`${elimikaDesignSystem.components.pageContainer} space-y-4 px-4 py-4 sm:px-6`}>
      {/* Header */}
      <section>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-foreground text-lg font-bold sm:text-xl'>Enrollments</h1>
            <p className='text-muted-foreground mt-0.5 text-xs sm:text-sm'>
              Manage and track student enrollments across all your classes
            </p>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setShowFilters(!showFilters)}
            className='w-full sm:w-auto lg:hidden'
          >
            <Filter className='mr-1.5 h-3.5 w-3.5' />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>
      </section>

      {/* KPI Cards */}
      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        <Card className='p-0'>
          <CardContent className='p-3'>
            <div className='flex items-center gap-2.5'>
              <div className='bg-primary/10 rounded-lg p-2'>
                <Users className='text-primary h-4 w-4' />
              </div>
              <div className='min-w-0 flex-1'>
                <p className='text-muted-foreground text-xs'>Total Students</p>
                <h3 className='text-lg font-bold'>{totalStudents}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='p-0'>
          <CardContent className='p-3'>
            <div className='flex items-center gap-2.5'>
              <div className='bg-chart-1/10 rounded-lg p-2'>
                <BookOpen className='text-chart-1 h-4 w-4' />
              </div>
              <div className='min-w-0 flex-1'>
                <p className='text-muted-foreground text-xs'>Active Classes</p>
                <h3 className='text-lg font-bold'>{totalClasses}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='p-0'>
          <CardContent className='p-3'>
            <div className='flex items-center gap-2.5'>
              <div className='bg-chart-2/10 rounded-lg p-2'>
                <TrendingUp className='text-chart-2 h-4 w-4' />
              </div>
              <div className='min-w-0 flex-1'>
                <p className='text-muted-foreground text-xs'>Avg per Class</p>
                <h3 className='text-lg font-bold'>{avgEnrollment.toFixed(0)}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='p-0'>
          <CardContent className='p-3'>
            <div className='flex items-center gap-2.5'>
              <div className='bg-chart-3/10 rounded-lg p-2'>
                <GraduationCap className='text-chart-3 h-4 w-4' />
              </div>
              <div className='min-w-0 flex-1'>
                <p className='text-muted-foreground text-xs'>Current Class</p>
                <h3 className='text-lg font-bold'>
                  {enrollmentCountsByClass[selectedClassId || ''] || 0}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className='grid gap-4 lg:grid-cols-12'>
        {/* Left Sidebar - Class List */}
        <div className={`space-y-3 lg:col-span-4 ${!showFilters && 'hidden lg:block'}`}>
          <Card className='p-3'>
            {/* Search and Sort */}
            <div className='space-y-2'>
              <div className='relative'>
                <Search className='text-muted-foreground absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2' />
                <Input
                  placeholder='Search classes...'
                  value={classSearchQuery}
                  onChange={(e) => setClassSearchQuery(e.target.value)}
                  className='h-8 pl-8 pr-8 text-sm'
                />
                {classSearchQuery && (
                  <button
                    onClick={() => setClassSearchQuery('')}
                    className='text-muted-foreground hover:text-foreground absolute right-2.5 top-1/2 -translate-y-1/2'
                  >
                    <X className='h-3.5 w-3.5' />
                  </button>
                )}
              </div>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className='h-8 text-sm'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='name'>Sort by Name</SelectItem>
                  <SelectItem value='enrollments'>Sort by Enrollments</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Class List */}
            <div className='max-h-[calc(100vh-420px)] space-y-1.5 overflow-y-auto no-scrollbar'>
              {isLoadingClasses ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className='p-2.5'>
                    <div className='space-y-1.5'>
                      <Skeleton className='h-3.5 w-3/4' />
                      <Skeleton className='h-3 w-1/2' />
                    </div>
                  </Card>
                ))
              ) : filteredClasses.length === 0 ? (
                <div className='text-muted-foreground py-6 text-center text-xs'>
                  No classes found
                </div>
              ) : (
                filteredClasses.map((classItem: any) => {
                  const enrollmentCount = enrollmentCountsByClass[classItem.uuid] || 0;
                  const isSelected = selectedClassId === classItem.uuid;

                  return (
                    <Card
                      key={classItem.uuid}
                      onClick={() => {
                        setSelectedClassId(classItem.uuid);
                        setShowFilters(false);
                      }}
                      className={`cursor-pointer p-2.5 transition-all hover:shadow-md ${isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'hover:bg-muted/50'
                        }`}
                    >
                      <div className='flex items-start justify-between gap-2'>
                        <div className='min-w-0 flex-1'>
                          <h4 className='truncate text-sm font-semibold'>
                            {classItem.title || 'Unnamed Class'}
                          </h4>
                          <p className='text-muted-foreground mt-0.5 truncate text-xs'>
                            {classItem.course_title || 'No course'}
                          </p>
                        </div>
                        <Badge
                          variant={isSelected ? 'default' : 'secondary'}
                          className='shrink-0 text-xs'
                        >
                          {enrollmentCount}
                        </Badge>
                      </div>
                      {isSelected && (
                        <div className='mt-1.5 flex items-center gap-1'>
                          <Award className='text-primary h-3 w-3' />
                          <span className='text-primary text-xs font-medium'>Selected</span>
                        </div>
                      )}
                    </Card>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Right Content - Student List */}
        <div className='space-y-3 lg:col-span-8'>
          {/* Student Search and Info */}
          {selectedClassId && (
            <Card className='p-3'>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex-1'>
                  <h3 className='text-base font-semibold'>
                    {selectedClass?.title || 'Class Details'}
                  </h3>
                  <p className='text-muted-foreground mt-0.5 text-xs'>
                    {filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'} enrolled
                  </p>
                </div>

                <div className='relative w-full sm:w-56'>
                  <Search className='text-muted-foreground absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2' />
                  <Input
                    placeholder='Search students...'
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    className='h-8 pl-8 pr-8 text-sm'
                  />
                  {studentSearchQuery && (
                    <button
                      onClick={() => setStudentSearchQuery('')}
                      className='text-muted-foreground hover:text-foreground absolute right-2.5 top-1/2 -translate-y-1/2'
                    >
                      <X className='h-3.5 w-3.5' />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Students Grid */}
          <div className='overflow-hidden rounded-lg border bg-card'>
            <ul className='divide-y'>
              {filteredStudents.map((student: any) => {
                const enrollment = enrollmentsForSelectedClass.find(
                  (e: any) => e.student_uuid === student?.uuid
                );

                return (
                  <li
                    key={student?.uuid}
                    className='flex items-center justify-between gap-4 p-4 hover:bg-muted/40 transition-colors'
                  >
                    {/* Left Section */}
                    <div className='flex items-center gap-3 min-w-0 flex-1'>
                      <Avatar className='h-10 w-10 border'>
                        <AvatarImage src={student?.avatar_url} />
                        <AvatarFallback className='text-xs font-semibold'>
                          {student?.full_name
                            ?.split(' ')
                            .map((n: any) => n[0])
                            .join('')
                            .toUpperCase() || '??'}
                        </AvatarFallback>
                      </Avatar>

                      <div className='min-w-0 flex-1'>
                        <div className='flex items-center gap-2'>
                          <h4 className='truncate text-sm font-semibold'>
                            {student?.full_name || 'Unknown Student'}
                          </h4>
                          <Badge variant='outline' className='text-xs'>
                            Active
                          </Badge>
                        </div>

                        <p className='text-muted-foreground truncate text-xs'>
                          ID: {student?.student_id || student?.uuid?.slice(0, 8)}
                        </p>

                        {student?.email && (
                          <p className='text-muted-foreground truncate text-xs'>
                            {student.email}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Middle Section (Progress) */}
                    {enrollment?.progress_percentage !== undefined && (
                      <div className='hidden w-40 sm:block'>
                        <div className='mb-1 flex justify-between text-xs'>
                          <span className='text-muted-foreground'>Progress</span>
                          <span className='font-medium'>
                            {enrollment.progress_percentage}%
                          </span>
                        </div>
                        <div className='bg-muted h-1.5 w-full rounded-full overflow-hidden'>
                          <div
                            className='bg-primary h-full transition-all'
                            style={{ width: `${enrollment.progress_percentage}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Right Section (Action) */}
                    <Button
                      size='sm'
                      className='h-8 text-xs'
                      onClick={() => handleViewProfile(student?.uuid as string)}
                    >
                      View
                    </Button>

                    <a
                      href={`/profile-user/${student?.user_uuid}?domain=${'student'}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-primary flex cursor-pointer items-start justify-start self-start rounded-md p-2 transition hover:bg-gray-100'
                    >
                      <div className='flex items-center gap-1 text-sm'>
                        <Send size={16} className='text-primary' />
                        <span className='truncate'>View full profile</span>
                      </div>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EnrollmentsPage;