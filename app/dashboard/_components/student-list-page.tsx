'use client';

import { useQueries } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  Copy,
  Mail,
  Menu,
  Phone,
  Search,
  Send,
  Settings,
  Star,
  User,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  getStudentScheduleOptions,
  getUserByUuidOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { Skeleton } from '../../../components/ui/skeleton';

type FilterType = 'all' | 'active' | 'inactive';
type Category = 'All';

const filterOptions: Array<{
  value: FilterType;
  label: string;
  description: string;
  icon: typeof User;
}> = [
  {
    value: 'all',
    label: 'All students',
    description: 'View the full learner directory.',
    icon: User,
  },
  {
    value: 'active',
    label: 'Active',
    description: 'Students with active access.',
    icon: UserCheck,
  },
  {
    value: 'inactive',
    label: 'Inactive',
    description: 'Students currently inactive.',
    icon: UserX,
  },
];

const categoryOptions: Category[] = ['All'];

export default function StudentsListPage({ studentsData }: { studentsData: any }) {
  const [page, setPage] = useState(0);

  const students = studentsData?.data?.content ?? [];
  const totalPages = studentsData?.data?.metadata?.totalPages ?? 0;

  const studentDetailQueries = useQueries({
    queries: students.map(student => ({
      ...getUserByUuidOptions({ path: { uuid: student.user_uuid as string } }),
      enabled: !!student.user_uuid,
    })),
  });
  const detailedStudents = studentDetailQueries.map(q => q.data?.data);

  const studentEnrollmentQueries = useQueries({
    queries: students.map(student => ({
      ...getStudentScheduleOptions({
        path: { studentUuid: student.uuid as string },
        query: { start: '2025-10-01' as any, end: '2030-12-31' as any },
      }),
      enabled: !!student.uuid,
    })),
  });
  const isLoading =
    studentDetailQueries.some(q => q.isLoading) ||
    studentEnrollmentQueries.some(q => q.isLoading);

  const detailedEnrollments = studentEnrollmentQueries.map(q => q.data?.data);

  const uniqueEnrollments = detailedEnrollments.map(enrollments => {
    if (!enrollments) return [];

    const seen = new Set();

    return enrollments.filter((enrollment: any) => {
      if (seen.has(enrollment.class_definition_uuid)) {
        return false;
      }
      seen.add(enrollment.class_definition_uuid);
      return true;
    });
  });

  const enrollmentMap = useMemo(
    () =>
      new Map(
        students.map((student, index) => [
          student.user_uuid as string,
          uniqueEnrollments[index] ?? [],
        ])
      ),
    [students, uniqueEnrollments]
  );

  const resolvedStudents = useMemo(
    () =>
      students
        .map((student, index) => {
          const user = detailedStudents[index];
          if (!user) return null;

          return {
            ...user,
            studentProfile: student,
            enrollmentCount: (uniqueEnrollments[index] ?? []).length,
          };
        })
        .filter(Boolean),
    [students, detailedStudents, uniqueEnrollments]
  );

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [selectedStudentUuid, setSelectedStudentUuid] = useState<string | null>(null);
  const [starredStudents, setStarredStudents] = useState<Set<string>>(new Set());

  // Mobile states
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState(false);

  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
        setIsMobileDetailsOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter students based on search, filter type, and category
  const filteredStudents = useMemo(() => {
    let filtered = resolvedStudents;

    // Search filter
    if (searchQuery) {
      const normalizedQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        student =>
          student?.display_name?.toLowerCase().includes(normalizedQuery) ||
          student?.username?.toLowerCase().includes(normalizedQuery) ||
          student?.email?.toLowerCase().includes(normalizedQuery)
      );
    }

    // Filter type
    if (selectedFilter === 'active') {
      filtered = filtered.filter(student => student?.active);
    } else if (selectedFilter === 'inactive') {
      filtered = filtered.filter(student => !student?.active);
    }

    // Category filter
    if (selectedCategory !== 'All') {
      // filtered = filtered.filter(student => student?.section === selectedCategory);
    }

    return filtered;
  }, [resolvedStudents, searchQuery, selectedFilter, selectedCategory]);

  const selectedStudent = useMemo(
    () => filteredStudents.find(student => student?.uuid === selectedStudentUuid) ?? null,
    [filteredStudents, selectedStudentUuid]
  );

  // Keep the current selection if it still exists after filtering; otherwise select the first row.
  useEffect(() => {
    if (filteredStudents.length === 0) {
      setSelectedStudentUuid(null);
      return;
    }

    const selectionStillVisible = filteredStudents.some(
      student => student?.uuid === selectedStudentUuid
    );

    if (!selectionStillVisible) {
      setSelectedStudentUuid(filteredStudents[0]?.uuid ?? null);
    }
  }, [filteredStudents, selectedStudentUuid]);

  const toggleStar = (studentUuid: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setStarredStudents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentUuid)) {
        newSet.delete(studentUuid);
      } else {
        newSet.add(studentUuid);
      }
      return newSet;
    });
  };

  const handleStudentClick = (student: any) => {
    setSelectedStudentUuid(student?.uuid ?? null);
    // Open mobile details sheet on mobile devices
    if (window.innerWidth < 1024) {
      setIsMobileDetailsOpen(true);
    }
  };

  const closeMobileDetails = () => {
    setIsMobileDetailsOpen(false);
  };

  const getEnrollmentForStudent = (studentUuid: string) => {
    return enrollmentMap.get(studentUuid) ?? [];
  };

  return (
    <Card className='p-2'>
      <div className='flex h-[calc(75vh-4rem)] gap-0 overflow-hidden sm:h-[calc(82vh-4rem)] md:h-[calc(80vh-4rem)]'>
        {/* Left Sidebar - Desktop Only */}
        <aside className='bg-background hidden w-72 flex-col border-r p-4 lg:flex'>
          <div className='space-y-5'>
            <div className='rounded-2xl border border-border/70 bg-muted/20 p-3'>
              <div className='mb-3 flex items-start justify-between gap-3'>
                <div>
                  <p className='text-sm font-semibold'>Smart filters</p>
                  <p className='text-muted-foreground text-xs'>
                    Narrow the student directory quickly.
                  </p>
                </div>
                <div className='rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary'>
                  {filteredStudents.length}
                </div>
              </div>

              <div className='space-y-2'>
                {filterOptions.map(option => {
                  const Icon = option.icon;
                  const isActive = selectedFilter === option.value;

                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSelectedFilter(option.value);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all ${
                        isActive
                          ? 'border-primary/30 bg-primary/10 text-primary shadow-sm'
                          : 'border-transparent bg-background hover:border-border/70 hover:bg-muted/60'
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <Icon size={18} />
                      </span>
                      <span className='min-w-0 flex-1'>
                        <span className='block text-sm font-semibold'>{option.label}</span>
                        <span className='text-muted-foreground block text-xs'>
                          {option.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className='rounded-2xl border border-border/70 bg-background p-3'>
              <div className='mb-3 flex items-center gap-2'>
                <span className='flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground'>
                  <Building2 size={16} />
                </span>
                <div>
                  <p className='text-sm font-semibold'>Categories</p>
                  <p className='text-muted-foreground text-xs'>
                    Segment learners when more groups are added.
                  </p>
                </div>
              </div>

              <div className='flex flex-wrap gap-2'>
                {categoryOptions.map(category => {
                  const isActive = selectedCategory === category;

                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-primary/30 bg-primary/10 text-primary'
                          : 'border-border/70 bg-background text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* Middle Section - Student List */}
        <div className='bg-background flex w-full flex-col border-r lg:w-72'>
          <div className='flex items-center gap-3 border-b p-4 lg:hidden'>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className='hover:bg-muted rounded-lg p-2'
            >
              <Menu size={20} />
            </button>
            <div className='relative flex-1'>
              <Search
                size={18}
                className='text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2'
              />
              <Input
                type='text'
                placeholder='Search Students'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='pl-10'
              />
            </div>
          </div>

          {/* Desktop Search Bar */}
          <div className='hidden border-b p-4 lg:block'>
            <div className='relative'>
              <Search
                size={18}
                className='text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2'
              />
              <Input
                type='text'
                placeholder='Search Students'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='pl-10'
              />
            </div>
          </div>

          {/* Student List */}
          <div className='flex-1 overflow-y-auto'>
            {isLoading ? (
              <div className='divide-y'>
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className='flex items-center gap-3 p-4'>
                    <Skeleton className='h-10 w-10 rounded-full' />
                    <div className='flex-1 space-y-2'>
                      <Skeleton className='h-4 w-32' />
                      <Skeleton className='h-3 w-24' />
                    </div>
                    <div className='flex items-center gap-2'>
                      <Skeleton className='h-6 w-6 rounded' />
                      <Skeleton className='h-6 w-6 rounded' />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className='text-muted-foreground p-8 text-center text-sm'>No students found</div>
            ) : (
              <div className='divide-y'>
                {filteredStudents.map((student: any) => {
                  const isSelected = selectedStudentUuid === student?.uuid;

                  return (
                    <div
                      key={student?.uuid}
                      onClick={() => handleStudentClick(student)}
                      className={`group flex cursor-pointer items-center gap-3 p-4 transition-colors ${
                        isSelected ? 'bg-muted' : 'hover:bg-muted/50'
                      }`}
                    >
                      <Avatar className='h-10 w-10'>
                        <AvatarImage src={student?.profile_image_url ?? ''} />
                        <AvatarFallback>{student?.display_name?.charAt(0)}</AvatarFallback>
                      </Avatar>

                      <div className='flex-1 overflow-hidden'>
                        <p className='truncate text-sm font-medium'>{student?.display_name}</p>
                        <p className='text-muted-foreground truncate text-xs'>
                          {student?.enrollmentCount || 0} classes enrolled
                        </p>
                      </div>

                      {/* <div className='flex items-center gap-1'>
                                                <button
                                                    onClick={e => toggleStar(student?.uuid, e)}
                                                    className='hover:bg-muted-foreground/10 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100'
                                                >
                                                    <Star
                                                        size={16}
                                                        className={isStarred ? 'fill-yellow-400 text-yellow-400' : ''}
                                                    />
                                                </button>
                                                <button
                                                    onClick={e => handleDelete(student?.uuid, e)}
                                                    className='hover:bg-muted-foreground/10 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100'
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div> */}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          <div className='flex items-center justify-between border-t p-3'>
            <p className='text-muted-foreground text-xs'>
              Page {page + 1} of {totalPages}
            </p>

            <div className='flex items-center gap-2'>
              <button
                disabled={page === 0}
                onClick={() => setPage(prev => Math.max(prev - 1, 0))}
                className='rounded border px-3 py-1 text-sm disabled:opacity-50'
              >
                Previous
              </button>

              <button
                disabled={page + 1 >= totalPages}
                onClick={() => setPage(prev => prev + 1)}
                className='rounded border px-3 py-1 text-sm disabled:opacity-50'
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Right Section - Student Details (Desktop Only) */}
        <div className='bg-background hidden flex-1 overflow-y-auto lg:block'>
          {!selectedStudent ? (
            <div className='text-muted-foreground flex h-full items-center justify-center'>
              Select a student to view details
            </div>
          ) : (
            <StudentDetailsContent
              selectedStudent={selectedStudent}
              starredStudents={starredStudents}
              toggleStar={toggleStar}
              getEnrollmentForStudent={getEnrollmentForStudent}
            />
          )}
        </div>
      </div>

      {/* Mobile Filter Sheet - Slides from left */}
      {isMobileMenuOpen && (
        <div className='fixed inset-0 z-50 lg:hidden'>
          {/* Backdrop */}
          <div
            className='absolute inset-0 bg-black/50'
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Sheet */}
          <aside className='animate-slide-in-left bg-background absolute top-0 bottom-0 left-0 w-80 max-w-[85vw] border-r p-4 shadow-xl'>
            <div className='mb-6 flex items-center justify-between'>
              <div>
                <h2 className='text-lg font-semibold'>Filters</h2>
                <p className='text-muted-foreground text-xs'>
                  Refine which students appear in the list.
                </p>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className='hover:bg-muted rounded-lg p-2'
              >
                <X size={20} />
              </button>
            </div>

            {/* Filter Options */}
            <div className='mb-6 rounded-2xl border border-border/70 bg-muted/20 p-3'>
              <div className='mb-3 flex items-center justify-between'>
                <h3 className='text-sm font-semibold'>Status</h3>
                <span className='rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary'>
                  {filteredStudents.length}
                </span>
              </div>
              <div className='space-y-2'>
                {filterOptions.map(option => {
                  const Icon = option.icon;
                  const isActive = selectedFilter === option.value;

                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSelectedFilter(option.value);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all ${
                        isActive
                          ? 'border-primary/30 bg-primary/10 text-primary'
                          : 'border-transparent bg-background hover:border-border/70 hover:bg-muted/60'
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <Icon size={18} />
                      </span>
                      <span className='min-w-0 flex-1'>
                        <span className='block text-sm font-semibold'>{option.label}</span>
                        <span className='text-muted-foreground block text-xs'>
                          {option.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Categories */}
            <div className='rounded-2xl border border-border/70 bg-background p-3'>
              <div className='mb-3 flex items-center gap-2'>
                <span className='flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground'>
                  <Building2 size={16} />
                </span>
                <div>
                  <h3 className='text-sm font-semibold'>Categories</h3>
                  <p className='text-muted-foreground text-xs'>Current grouping options.</p>
                </div>
              </div>
              <div className='flex flex-wrap gap-2'>
                {categoryOptions.map(category => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Mobile Student Details Sheet - Slides from right */}
      {isMobileDetailsOpen && selectedStudent && (
        <div className='fixed inset-0 z-50 overflow-y-hidden lg:hidden'>
          {/* Backdrop */}
          <div className='absolute inset-0 bg-black/50' onClick={closeMobileDetails} />

          {/* Sheet */}
          <div className='animate-slide-in-right bg-background absolute top-0 right-0 bottom-0 w-full shadow-xl'>
            {/* Mobile Header */}
            <div className='flex items-center gap-3 border-b p-4'>
              <button onClick={closeMobileDetails} className='hover:bg-muted rounded-lg p-2'>
                <ArrowLeft size={20} />
              </button>
              <h2 className='text-md flex-1 font-semibold'>Student Details</h2>
              <button className='hover:bg-muted rounded-lg p-2 text-yellow-500'>
                <Star
                  size={20}
                  className={starredStudents.has(selectedStudent.uuid) ? 'fill-yellow-500' : ''}
                  onClick={() => toggleStar(selectedStudent.uuid, {} as any)}
                />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className='h-[calc(100%-4rem)] overflow-y-auto'>
              <StudentDetailsContent
                selectedStudent={selectedStudent}
                starredStudents={starredStudents}
                toggleStar={toggleStar}
                getEnrollmentForStudent={getEnrollmentForStudent}
                isMobile={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (Mobile Only) */}
      <button className='bg-primary text-primary-foreground fixed right-6 bottom-6 flex h-14 w-14 items-center justify-center rounded-full shadow-lg lg:hidden'>
        <Settings size={24} />
      </button>
    </Card>
  );
}

// Separate component for student details to reuse in both desktop and mobile views
function StudentDetailsContent({
  selectedStudent,
  starredStudents,
  toggleStar,
  getEnrollmentForStudent,
  isMobile = false,
}: {
  selectedStudent: any;
  starredStudents: Set<string>;
  toggleStar: (uuid: string, e: any) => void;
  getEnrollmentForStudent: (uuid: string) => any;
  isMobile?: boolean;
}) {
  return (
    <div className='overflow-y-hidden p-6 sm:p-8'>
      {/* Header - Desktop Only (mobile has it in the sheet header) */}
      {!isMobile && (
        <div className='mb-6 flex items-start justify-between'>
          <h2 className='text-2xl font-bold'>Student Details</h2>

          {/* <div className='flex gap-2'>
            <button className='rounded-lg p-2 text-yellow-500 hover:bg-muted'>
              <Star
                size={20}
                className={
                  starredStudents.has(selectedStudent.uuid) ? 'fill-yellow-500' : ''
                }
                onClick={() => toggleStar(selectedStudent.uuid, {} as any)}
              />
            </button>
            <button className='rounded-lg p-2 hover:bg-muted'>
              <Edit size={20} />
            </button>
            <button className='rounded-lg p-2 text-destructive hover:bg-muted'>
              <Trash2 size={20} />
            </button>
          </div> */}
        </div>
      )}

      <div className='mb-4 flex items-center gap-4'>
        <a
          href={`/profile-user/${selectedStudent?.uuid}?domain=${'student'}`}
          target='_blank'
          rel='noopener noreferrer'
          className='text-primary flex cursor-pointer items-start justify-start self-start rounded-md p-2 transition hover:bg-gray-100'
        >
          <div className='flex items-center gap-1 text-sm'>
            <Send size={16} className='text-primary' />
            <span className='truncate'>View full profile</span>
          </div>
        </a>

        <button
          type='button'
          onClick={() => {
            const fullUrl = `${window.location.origin}/profile-user/${selectedStudent?.uuid}?domain=student`;
            navigator.clipboard.writeText(fullUrl);

            toast.success('Profile link copied to clipboard');
          }}
          className='flex cursor-pointer flex-row items-center gap-1 rounded-md p-2 text-sm transition hover:bg-gray-100'
          title='Copy profile link'
        >
          <Copy size={16} className='text-primary' />
          <span className='text-primary truncate'>Copy profile link</span>
        </button>
      </div>

      {/* Student Avatar & Basic Info */}
      <div className='mb-8 flex flex-row items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Avatar className='h-16 w-16 sm:h-20 sm:w-20'>
            <AvatarImage src={selectedStudent?.profile_image_url ?? ''} />
            <AvatarFallback className='text-xl sm:text-2xl'>
              {selectedStudent?.display_name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className='text-lg font-semibold sm:text-xl'>{selectedStudent?.display_name}</h3>
            <p className='text-muted-foreground text-sm sm:text-base'>
              {selectedStudent?.username}
            </p>
          </div>
        </div>
      </div>

      {/* Contact Information Grid */}
      <div className='grid gap-6 sm:grid-cols-2'>
        {/* Phone Number */}
        <div>
          <label className='text-muted-foreground mb-1 block text-sm font-medium'>
            Phone Number
          </label>
          <div className='flex items-center gap-2 text-sm'>
            <Phone size={16} className='text-muted-foreground' />
            <span>{selectedStudent?.phone_number || 'Not provided'}</span>
          </div>
        </div>

        {/* Email */}
        <div>
          <label className='text-muted-foreground mb-1 block text-sm font-medium'>
            Email address
          </label>
          <div className='flex items-center gap-2 text-sm'>
            <Mail size={16} className='text-muted-foreground' />
            <span className='truncate'>{selectedStudent?.email || selectedStudent?.username}</span>
          </div>
        </div>
      </div>

      {/* Enrolled Courses Section */}
      <div className='mt-12'>
        <h3 className='mb-4 text-base font-semibold sm:text-lg'>Enrolled Classes/Courses</h3>
        <main className='mx-0'>
          <CardContent className='p-4'>
            {getEnrollmentForStudent(selectedStudent.uuid)?.length > 0 ? (
              <div className='space-y-3'>
                {getEnrollmentForStudent(selectedStudent.uuid)?.map(
                  (enrollment: any, index: number) => (
                    <div key={index} className='rounded-lg border p-3'>
                      <div className='flex items-center justify-between'>
                        <div className='flex-1'>
                          <p className='text-sm font-medium sm:text-base'>
                            {enrollment?.title || 'Course'}
                          </p>
                          <p className='text-muted-foreground text-xs'>
                            Progress: {enrollment?.progress_percentage || 0}%
                          </p>
                        </div>
                        <div
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            enrollment?.status === 'COMPLETED'
                              ? 'text-success/70 bg-success/10'
                              : 'text-primary/70 bg-primary/10'
                          }`}
                        >
                          {enrollment?.status || 'IN_PROGRESS'}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className='text-muted-foreground text-sm'>No courses enrolled</p>
            )}
          </CardContent>
        </main>
      </div>

      {/* Notes Section */}
      <div className='mt-6'>
        <label className='text-muted-foreground mb-2 block text-sm font-medium'>Notes</label>
        <div className='bg-muted/30 text-muted-foreground rounded-lg border p-4 text-sm leading-relaxed'>
          {selectedStudent?.notes || 'No notes available for this student.'}
        </div>
      </div>

      {/* Action Buttons */}
      {/* <div className='mt-8 flex flex-col gap-3 sm:flex-row'>
        <Button className='flex-1'>
          <Edit size={16} className='mr-2' />
          Edit
        </Button>
        <Button variant='destructive' className='flex-1'>
          <Trash2 size={16} className='mr-2' />
          Delete
        </Button>
      </div> */}
    </div>
  );
}
