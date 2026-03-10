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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
  BookOpen,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  Search,
  TrendingUp,
  Users,
  X,
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
  const [selectedStudentForSheet, setSelectedStudentForSheet] = useState<any>(null);
  const [isStudentDetailsSheetOpen, setIsStudentDetailsSheetOpen] = useState(false);
  const [isStudentsListSheetOpen, setIsStudentsListSheetOpen] = useState(false);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

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
      filtered.sort(
        (a: any, b: any) =>
          (enrollmentCountsByClass[b.uuid] || 0) - (enrollmentCountsByClass[a.uuid] || 0)
      );
    } else {
      filtered.sort((a: any, b: any) => (a.title || '').localeCompare(b.title || ''));
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

  // const handleStudentClick = (student: any) => {
  //   setSelectedStudentForSheet(student);
  //   setIsStudentDetailsSheetOpen(true);
  // };
  const handleStudentClick = (student: any) => {
    setExpandedStudentId(prev => (prev === student.uuid ? null : student.uuid));
  };

  const handleClassSelect = (classUuid: string) => {
    setSelectedClassId(classUuid);
    setShowFilters(false);
    // On mobile, open students sheet when class is selected
    if (window.innerWidth < 1024) {
      setIsStudentsListSheetOpen(true);
    }
  };

  const getEnrollmentForStudent = (studentUuid: string) => {
    return enrollmentsForSelectedClass.find((e: any) => e.student_uuid === studentUuid);
  };

  return (
    <div className={`${elimikaDesignSystem.components.pageContainer} space-y-4 px-4 py-4 sm:px-6`}>
      {/* Header */}
      <section>
        <div className='flex flex-col gap-2'>
          <div>
            <h1 className='text-foreground text-lg font-bold sm:text-xl'>Enrollments</h1>
            <p className='text-muted-foreground mt-0.5 text-xs sm:text-sm'>
              Manage and track student enrollments across all your classes
            </p>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        <Card className='border-border/50 from-primary/5 bg-gradient-to-br to-transparent p-0 transition-shadow hover:shadow-md'>
          <CardContent className='p-3'>
            <div className='flex items-center gap-2.5'>
              <div className='bg-primary/10 rounded-lg p-2'>
                <Users className='text-primary h-4 w-4' />
              </div>
              <div className='min-w-0 flex-1'>
                <p className='text-muted-foreground text-xs'>Total Students</p>
                <h3 className='text-foreground text-lg font-bold'>{totalStudents}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-border/50 from-chart-1/5 bg-gradient-to-br to-transparent p-0 transition-shadow hover:shadow-md'>
          <CardContent className='p-3'>
            <div className='flex items-center gap-2.5'>
              <div className='bg-chart-1/10 rounded-lg p-2'>
                <BookOpen className='text-chart-1 h-4 w-4' />
              </div>
              <div className='min-w-0 flex-1'>
                <p className='text-muted-foreground text-xs'>Active Classes</p>
                <h3 className='text-foreground text-lg font-bold'>{totalClasses}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-border/50 from-chart-2/5 bg-gradient-to-br to-transparent p-0 transition-shadow hover:shadow-md'>
          <CardContent className='p-3'>
            <div className='flex items-center gap-2.5'>
              <div className='bg-chart-2/10 rounded-lg p-2'>
                <TrendingUp className='text-chart-2 h-4 w-4' />
              </div>
              <div className='min-w-0 flex-1'>
                <p className='text-muted-foreground text-xs'>Avg per Class</p>
                <h3 className='text-foreground text-lg font-bold'>{avgEnrollment.toFixed(0)}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-border/50 from-chart-3/5 bg-gradient-to-br to-transparent p-0 transition-shadow hover:shadow-md'>
          <CardContent className='p-3'>
            <div className='flex items-center gap-2.5'>
              <div className='bg-chart-3/10 rounded-lg p-2'>
                <GraduationCap className='text-chart-3 h-4 w-4' />
              </div>
              <div className='min-w-0 flex-1'>
                <p className='text-muted-foreground text-xs'>Current Class</p>
                <h3 className='text-foreground text-lg font-bold'>
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
        <div className='space-y-3 lg:col-span-4'>
          <Card className='border-border/50 p-3'>
            {/* Search and Sort */}
            <div className='space-y-2'>
              <div className='relative'>
                <Search className='text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2' />
                <Input
                  placeholder='Search classes...'
                  value={classSearchQuery}
                  onChange={e => setClassSearchQuery(e.target.value)}
                  className='border-border/50 focus-visible:ring-primary/20 h-8 pr-8 pl-8 text-sm'
                />
                {classSearchQuery && (
                  <button
                    onClick={() => setClassSearchQuery('')}
                    className='text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 transition-colors'
                  >
                    <X className='h-3.5 w-3.5' />
                  </button>
                )}
              </div>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className='border-border/50 focus:ring-primary/20 h-8 text-sm'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='name'>Sort by Name</SelectItem>
                  <SelectItem value='enrollments'>Sort by Enrollments</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Class List */}
            <div className='no-scrollbar mt-3 max-h-[calc(100vh-420px)] space-y-1.5 overflow-y-auto'>
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
                      onClick={() => handleClassSelect(classItem.uuid)}
                      className={`group border-border/50 cursor-pointer p-2.5 transition-all hover:shadow-md ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-primary/30 ring-1'
                          : 'hover:border-border hover:bg-accent/5'
                      }`}
                    >
                      <div className='flex items-start justify-between gap-2'>
                        <div className='min-w-0 flex-1'>
                          <h4 className='text-foreground truncate text-sm font-semibold'>
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
                    </Card>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Right Content - Student List (Desktop Only) */}
        <div className='hidden space-y-3 lg:col-span-8 lg:block'>
          {/* Student Search and Info */}
          {selectedClassId && (
            <Card className='border-border/50 p-3'>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex-1'>
                  <h3 className='text-foreground text-base font-semibold'>
                    {selectedClass?.title || 'Class Details'}
                  </h3>
                  <p className='text-muted-foreground mt-0.5 text-xs'>
                    {filteredStudents.length}{' '}
                    {filteredStudents.length === 1 ? 'student' : 'students'} enrolled
                  </p>
                </div>

                <div className='relative w-full sm:w-56'>
                  <Search className='text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2' />
                  <Input
                    placeholder='Search students...'
                    value={studentSearchQuery}
                    onChange={e => setStudentSearchQuery(e.target.value)}
                    className='border-border/50 focus-visible:ring-primary/20 h-8 pr-8 pl-8 text-sm'
                  />
                  {studentSearchQuery && (
                    <button
                      onClick={() => setStudentSearchQuery('')}
                      className='text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 transition-colors'
                    >
                      <X className='h-3.5 w-3.5' />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Students List */}
          {selectedClassId === null ? (
            <Card className='border-border/50 p-8 text-center sm:p-10'>
              <div className='bg-muted/50 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full sm:h-14 sm:w-14'>
                <BookOpen className='text-muted-foreground h-6 w-6 sm:h-7 sm:w-7' />
              </div>
              <h3 className='text-foreground mb-1.5 text-base font-semibold'>Select a Class</h3>
              <p className='text-muted-foreground mx-auto max-w-sm text-xs sm:text-sm'>
                Choose a class from the sidebar to view its enrolled students
              </p>
            </Card>
          ) : isLoadingEnrollments || isLoadingStudents ? (
            <Card className='border-border/50 overflow-hidden'>
              <ul className='divide-border/50 divide-y'>
                {Array.from({ length: 4 }).map((_, i) => (
                  <li key={i} className='p-4'>
                    <div className='flex items-center gap-3'>
                      <Skeleton className='h-10 w-10 rounded-full' />
                      <div className='flex-1 space-y-1.5'>
                        <Skeleton className='h-3.5 w-32' />
                        <Skeleton className='h-3 w-40' />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ) : filteredStudents.length === 0 ? (
            <Card className='border-border/50 p-8 text-center sm:p-10'>
              <div className='bg-muted/50 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full sm:h-14 sm:w-14'>
                <Users className='text-muted-foreground h-6 w-6 sm:h-7 sm:w-7' />
              </div>
              <h3 className='text-foreground mb-1.5 text-base font-semibold'>
                {studentSearchQuery ? 'No Students Found' : 'No Enrollments Yet'}
              </h3>
              <p className='text-muted-foreground mx-auto max-w-sm text-xs sm:text-sm'>
                {studentSearchQuery
                  ? 'Try adjusting your search query'
                  : 'Students will appear here once they enroll in this class'}
              </p>
            </Card>
          ) : (
            <Card className='border-border/50 bg-card overflow-hidden'>
              <ul className='divide-border/50 divide-y'>
                {filteredStudents.map((student: any) => {
                  const enrollment = getEnrollmentForStudent(student?.uuid);

                  return (
                    <li key={student?.uuid} className='group hover:bg-accent/5 transition-colors'>
                      <div className='flex items-center gap-3 p-3 sm:gap-4 sm:p-4'>
                        {/* Avatar & Info */}
                        <div className='flex min-w-0 flex-1 items-center gap-3'>
                          <Avatar className='border-border ring-background h-10 w-10 border ring-2'>
                            <AvatarImage src={student?.avatar_url} />
                            <AvatarFallback className='bg-primary/10 text-primary text-xs font-semibold'>
                              {student?.full_name
                                ?.split(' ')
                                .map((n: any) => n[0])
                                .join('')
                                .toUpperCase() || '??'}
                            </AvatarFallback>
                          </Avatar>

                          <div className='min-w-0 flex-1'>
                            <div className='flex items-center gap-2'>
                              <h4 className='text-foreground truncate text-sm font-semibold'>
                                {student?.full_name || 'Unknown Student'}
                              </h4>
                              <Badge
                                variant='outline'
                                className='border-success/30 bg-success/10 text-success hidden shrink-0 text-xs sm:inline-flex'
                              >
                                Active
                              </Badge>
                            </div>

                            <p className='text-muted-foreground truncate text-xs'>
                              ID: {student?.student_id || student?.uuid?.slice(0, 8)}
                            </p>

                            {student?.email && (
                              <p className='text-muted-foreground hidden truncate text-xs sm:block'>
                                {student.email}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Progress (Desktop) */}
                        {enrollment?.progress_percentage !== undefined && (
                          <div className='hidden w-32 shrink-0 lg:block'>
                            <div className='mb-1 flex justify-between text-xs'>
                              <span className='text-muted-foreground'>Progress</span>
                              <span className='text-foreground font-medium'>
                                {enrollment.progress_percentage}%
                              </span>
                            </div>
                            <div className='bg-muted h-1.5 w-full overflow-hidden rounded-full'>
                              <div
                                className='bg-primary h-full rounded-full transition-all'
                                style={{ width: `${enrollment.progress_percentage}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className='hidden shrink-0 items-center gap-2 md:flex'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleViewProfile(student?.uuid as string)}
                            className='text-primary hover:bg-primary/10 hover:text-primary h-8 text-xs'
                          >
                            View Enrollment
                          </Button>

                          <a
                            href={`/profile-user/${student?.user_uuid}?domain=${'student'}`}
                            target='_blank'
                            rel='noopener noreferrer'
                            onClick={e => e.stopPropagation()}
                          >
                            <Button
                              variant='ghost'
                              size='sm'
                              className='text-primary hover:bg-primary/10 hover:text-primary h-8 text-xs'
                            >
                              <ExternalLink className='mr-1.5 h-3 w-3' />
                              Profile
                            </Button>
                          </a>
                        </div>

                        {/* Mobile: Show Sheet Button */}
                        <button
                          onClick={() => handleStudentClick(student)}
                          className='text-muted-foreground hover:text-foreground shrink-0 transition-colors md:hidden'
                        >
                          <ChevronRight className='h-5 w-5' />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </div>
      </div>

      {/* Mobile Students List Sheet */}
      <Sheet open={isStudentsListSheetOpen} onOpenChange={setIsStudentsListSheetOpen}>
        <SheetContent side='right' className='w-full sm:max-w-md'>
          <SheetHeader className='mb-4'>
            <SheetTitle className='text-foreground'>
              {selectedClass?.title || 'Students'}
            </SheetTitle>
            <SheetDescription className='text-muted-foreground'>
              {filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'}{' '}
              enrolled
            </SheetDescription>
          </SheetHeader>

          {/* Student Search */}
          <div className='mx-4 mb-4'>
            <div className='relative'>
              <Search className='text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2' />
              <Input
                placeholder='Search students...'
                value={studentSearchQuery}
                onChange={e => setStudentSearchQuery(e.target.value)}
                className='border-border/50 focus-visible:ring-primary/20 h-8 pr-8 pl-8 text-sm'
              />
              {studentSearchQuery && (
                <button
                  onClick={() => setStudentSearchQuery('')}
                  className='text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 transition-colors'
                >
                  <X className='h-3.5 w-3.5' />
                </button>
              )}
            </div>
          </div>

          {/* Students List */}
          <div className='mx-4 space-y-2'>
            {isLoadingEnrollments || isLoadingStudents ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className='border-border/50 flex items-center gap-3 rounded-lg border p-3'
                >
                  <Skeleton className='h-10 w-10 rounded-full' />
                  <div className='flex-1 space-y-1.5'>
                    <Skeleton className='h-3.5 w-32' />
                    <Skeleton className='h-3 w-40' />
                  </div>
                </div>
              ))
            ) : filteredStudents.length === 0 ? (
              <div className='border-border/50 rounded-lg border p-8 text-center'>
                <div className='bg-muted/50 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full'>
                  <Users className='text-muted-foreground h-6 w-6' />
                </div>
                <h3 className='text-foreground mb-1.5 text-sm font-semibold'>
                  {studentSearchQuery ? 'No Students Found' : 'No Enrollments Yet'}
                </h3>
                <p className='text-muted-foreground text-xs'>
                  {studentSearchQuery
                    ? 'Try adjusting your search query'
                    : 'Students will appear here once they enroll'}
                </p>
              </div>
            ) : (
              filteredStudents.map((student: any) => {
                const enrollment = getEnrollmentForStudent(student?.uuid);
                const isExpanded = expandedStudentId === student?.uuid;

                return (
                  <div
                    key={student?.uuid}
                    className='border-border/50 rounded-lg border transition-colors'
                  >
                    <div
                      onClick={() => handleStudentClick(student)}
                      className='group hover:bg-accent/5 flex cursor-pointer items-center gap-3 p-3'
                    >
                      <Avatar className='border-border ring-background h-10 w-10 border ring-2'>
                        <AvatarImage src={student?.avatar_url} />
                        <AvatarFallback className='bg-primary/10 text-primary text-xs font-semibold'>
                          {student?.full_name
                            ?.split(' ')
                            .map((n: any) => n[0])
                            .join('')
                            .toUpperCase() || '??'}
                        </AvatarFallback>
                      </Avatar>

                      <div className='min-w-0 flex-1'>
                        <div className='flex items-center gap-2'>
                          <h4 className='text-foreground truncate text-sm font-semibold'>
                            {student?.full_name || 'Unknown Student'}
                          </h4>
                          <Badge
                            variant='outline'
                            className='border-success/30 bg-success/10 text-success shrink-0 text-xs sm:inline-flex'
                          >
                            Active
                          </Badge>
                        </div>

                        <p className='text-muted-foreground truncate text-xs'>
                          ID: {student?.student_id || student?.uuid?.slice(0, 8)}
                        </p>
                      </div>

                      <ChevronRight
                        className={`h-5 w-5 shrink-0 transition-transform ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                      />
                    </div>

                    {isExpanded && (
                      <div className='border-border/50 space-y-4 border-t px-4 pb-4'>
                        {/* Progress */}
                        {enrollment?.progress_percentage !== undefined && (
                          <div>
                            <div className='mb-1 flex justify-between text-xs'>
                              <span>Progress</span>
                              <span>{enrollment.progress_percentage}%</span>
                            </div>
                            <div className='bg-muted h-2 w-full overflow-hidden rounded-full'>
                              <div
                                className='bg-primary h-full'
                                style={{ width: `${enrollment.progress_percentage}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className='flex gap-2 pt-2'>
                          <Button
                            size='sm'
                            className='text-primary flex-1'
                            variant='outline'
                            onClick={() => handleViewProfile(student?.uuid)}
                          >
                            View Enrollment Info
                          </Button>

                          <a
                            href={`/profile-user/${student?.user_uuid}?domain=student`}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='flex-1'
                          >
                            <Button size='sm' variant='outline' className='text-primary w-full'>
                              <ExternalLink className='mr-1.5 h-3 w-3' />
                              Profile
                            </Button>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default EnrollmentsPage;
