'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Spinner from '@/components/ui/spinner';
import {
    getStudentScheduleOptions,
    getUserByUuidOptions
} from '@/services/client/@tanstack/react-query.gen';
import { useQueries } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
    ArrowLeft,
    Building2,
    Calendar,
    Mail,
    MapPin,
    Menu,
    Phone,
    Search,
    Settings,
    Star,
    Trash2,
    User,
    UserCheck,
    UserX,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../../../components/ui/badge';

type FilterType = 'all' | 'active' | 'inactive';
type Category = 'All';

export default function StudentsListPage({ studentsData }: { studentsData: any }) {
    const [pageSize] = useState(20);
    const [page, setPage] = useState(0);

    const students = studentsData?.data?.content ?? [];
    const totalPages = studentsData?.data?.metadata?.totalPages ?? 0;
    const totalElements = studentsData?.data?.metadata?.totalElements ?? 0;

    const studentDetailQueries = useQueries({
        queries: students.map(student => ({
            ...getUserByUuidOptions({ path: { uuid: student.user_uuid as string } }),
            enabled: !!student.uuid,
        })),
    });
    const detailedStudents = studentDetailQueries.map(q => q.data?.data);
    const isLoading = studentDetailQueries.some(q => q.isLoading);

    const studentEnrollmentQueries = useQueries({
        queries: students.map(student => ({
            ...getStudentScheduleOptions({
                path: { studentUuid: student.uuid as string },
                query: { start: '2025-10-10' as any, end: '2026-12-19' as any },
            }),
            enabled: !!student.uuid,
        })),
    });
    const detailedEnrollments = studentEnrollmentQueries.map(q => q.data?.data);
    const sortedEnrollments = detailedEnrollments.map(enrollments =>
        enrollments?.sort((a: any, b: any) => {
            const dateA = new Date(a.enrollment_date);
            const dateB = new Date(b.enrollment_date);
            return dateB.getTime() - dateA.getTime();
        })
    );

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

    // State management
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
    const [selectedCategory, setSelectedCategory] = useState<Category>('All');
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
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
        let filtered = detailedStudents.filter(Boolean);

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(
                student =>
                    student?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    student?.username?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter type
        if (selectedFilter === 'active') {
            filtered = filtered.filter(student => student?.active);
        }

        // Category filter (assuming you have section data)
        if (selectedCategory !== 'All') {
            // Implement section filtering based on your data structure
            // filtered = filtered.filter(student => student?.section === selectedCategory);
        }

        return filtered;
    }, [detailedStudents, searchQuery, selectedFilter, selectedCategory, starredStudents]);

    // Set first student as selected by default
    useState(() => {
        if (filteredStudents.length > 0 && !selectedStudent) {
            setSelectedStudent(filteredStudents[0]);
        }
    });

    const toggleStar = (studentUuid: string, e: React.MouseEvent) => {
        e.stopPropagation();
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

    const handleDelete = (studentUuid: string, e: React.MouseEvent) => {
        e.stopPropagation();
        // Implement delete logic
    };

    const handleStudentClick = (student: any) => {
        setSelectedStudent(student);
        // Open mobile details sheet on mobile devices
        if (window.innerWidth < 1024) {
            setIsMobileDetailsOpen(true);
        }
    };

    const closeMobileDetails = () => {
        setIsMobileDetailsOpen(false);
    };

    const getEnrollmentForStudent = (studentUuid: string) => {
        const index = students.findIndex(s => s.user_uuid === studentUuid);
        return index >= 0 ? uniqueEnrollments[index] : null;
    };

    useEffect(() => {
        setPage(0);
    }, [searchQuery, selectedFilter, selectedCategory]);

    return (
        <Card className='p-2'>
            <div className='flex h-[calc(75vh-4rem)] sm:h-[calc(82vh-4rem)] md:h-[calc(80vh-4rem)] gap-0 overflow-hidden'>
                {/* Left Sidebar - Desktop Only */}
                <aside className='bg-background hidden w-64 flex-col border-r p-4 lg:flex'>
                    {/* Filter Options */}
                    <div className='mb-6 space-y-2'>
                        <button
                            onClick={() => setSelectedFilter('all')}
                            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${selectedFilter === 'all' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                                }`}
                        >
                            <User size={16} />
                            All
                        </button>
                        <button
                            onClick={() => {
                                setSelectedFilter('active');
                                setIsMobileMenuOpen(false);
                            }}
                            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${selectedFilter === 'active' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                                }`}
                        >
                            <UserCheck className='text-success/50' size={16} />
                            Active
                        </button>
                        <button
                            onClick={() => {
                                setSelectedFilter('inactive');
                                setIsMobileMenuOpen(false);
                            }}
                            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${selectedFilter === 'active' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                                }`}
                        >
                            <UserX className='text-destructive/50' size={16} />
                            Inactive
                        </button>
                    </div>

                    {/* Categories */}
                    <div>
                        <h3 className='text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase'>
                            Categories
                        </h3>
                        <div className='space-y-2'>
                            {/* {(['All', 'Section A', 'Section B', 'Section C'] as Category[]).map(category => ( */}
                            {(['All'] as Category[]).map(category => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${selectedCategory === category ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                                        }`}
                                >
                                    <Building2 size={16} />
                                    {category}
                                </button>
                            ))}
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
                            <div className='flex items-center justify-center p-8'>
                                <Spinner />
                            </div>
                        ) : filteredStudents.length === 0 ? (
                            <div className='text-muted-foreground p-8 text-center text-sm'>No students found</div>
                        ) : (
                            <div className='divide-y'>
                                {filteredStudents.map((student: any) => {
                                    const isStarred = starredStudents.has(student?.uuid);
                                    const isSelected = selectedStudent?.uuid === student?.uuid;
                                    const enrollment = getEnrollmentForStudent(student?.uuid);

                                    return (
                                        <div
                                            key={student?.uuid}
                                            onClick={() => handleStudentClick(student)}
                                            className={`group flex cursor-pointer items-center gap-3 p-4 transition-colors ${isSelected ? 'bg-muted' : 'hover:bg-muted/50'
                                                }`}
                                        >
                                            <Avatar className='h-10 w-10'>
                                                <AvatarImage src={student?.profile_image_url ?? ''} />
                                                <AvatarFallback>{student?.display_name?.charAt(0)}</AvatarFallback>
                                            </Avatar>

                                            <div className='flex-1 overflow-hidden'>
                                                <p className='truncate text-sm font-medium'>{student?.display_name}</p>
                                                <p className='text-muted-foreground truncate text-xs'>
                                                    {enrollment?.length || 0} classes enrolled
                                                </p>
                                            </div>

                                            <div className='flex items-center gap-1'>
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
                                            </div>
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
                    <aside className='animate-slide-in-left bg-background absolute top-0 bottom-0 left-0 w-80 max-w-[85vw] p-4 shadow-xl'>
                        <div className='mb-6 flex items-center justify-between'>
                            <h2 className='text-lg font-semibold'>Filters</h2>
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className='hover:bg-muted rounded-lg p-2'
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Filter Options */}
                        <div className='mb-6 space-y-2'>
                            <button
                                onClick={() => {
                                    setSelectedFilter('all');
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${selectedFilter === 'all' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                                    }`}
                            >
                                <Mail size={16} />
                                All
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedFilter('active');
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${selectedFilter === 'active' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                                    }`}
                            >
                                <UserCheck className='text-success/50' size={16} />
                                Active
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedFilter('inactive');
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${selectedFilter === 'active' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                                    }`}
                            >
                                <UserX className='text-destructive/50' size={16} />
                                Inactive
                            </button>
                        </div>

                        {/* Categories */}
                        <div>
                            <h3 className='text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase'>
                                Categories
                            </h3>
                            <div className='space-y-2'>
                                {(['All'] as Category[]).map(category => (
                                    <button
                                        key={category}
                                        onClick={() => {
                                            setSelectedCategory(category);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${selectedCategory === category
                                            ? 'bg-primary/10 text-primary'
                                            : 'hover:bg-muted'
                                            }`}
                                    >
                                        <Building2 size={16} />
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
                <div className='fixed inset-0 z-50 lg:hidden overflow-y-hidden'>
                    {/* Backdrop */}
                    <div className='absolute inset-0 bg-black/50' onClick={closeMobileDetails} />

                    {/* Sheet */}
                    <div className='animate-slide-in-right bg-background absolute top-0 right-0 bottom-0 w-full shadow-xl'>
                        {/* Mobile Header */}
                        <div className='flex items-center gap-3 border-b p-4'>
                            <button onClick={closeMobileDetails} className='hover:bg-muted rounded-lg p-2'>
                                <ArrowLeft size={20} />
                            </button>
                            <h2 className='flex-1 text-md font-semibold'>Student Details</h2>
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

            {/* Student Avatar & Basic Info */}
            <div className='mb-8 flex items-center gap-4'>
                <Avatar className='h-16 w-16 sm:h-20 sm:w-20'>
                    <AvatarImage src={selectedStudent?.profile_image_url ?? ''} />
                    <AvatarFallback className='text-xl sm:text-2xl'>
                        {selectedStudent?.display_name?.charAt(0)}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h3 className='text-lg font-semibold sm:text-xl'>{selectedStudent?.display_name}</h3>
                    <p className='text-muted-foreground text-sm sm:text-base'>{selectedStudent?.username}</p>
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

                {/* Address */}
                <div className='sm:col-span-2'>
                    <label className='text-muted-foreground mb-1 block text-sm font-medium'>Address</label>
                    <div className='flex items-start gap-2 text-sm'>
                        <MapPin size={16} className='text-muted-foreground mt-0.5' />
                        <span>{selectedStudent?.address || 'Not provided'}</span>
                    </div>
                </div>

                {/* Address */}
                <div className='sm:col-span-2'>
                    <label className='text-muted-foreground mb-1 block text-sm font-medium'>Date of Birth</label>
                    <div className='flex items-start gap-2 text-sm'>
                        <Calendar size={16} className='text-muted-foreground mt-0.5' />
                        <span>
                            {selectedStudent.dob ? format(new Date(selectedStudent.dob), 'dd MMM yyyy') : 'N/A'}
                        </span>
                    </div>
                </div>

                {/* Address */}
                <div className='sm:col-span-2'>
                    <label className='text-muted-foreground mb-1 block text-sm font-medium'>Gender</label>
                    <div className='flex items-start gap-2 text-sm'>
                        <Calendar size={16} className='text-muted-foreground mt-0.5' />
                        <span>
                            {selectedStudent.gender || 'N/A'}
                        </span>
                    </div>
                </div>

                {/* Department/Grade */}
                <div>
                    <label className='text-muted-foreground mb-1 block text-sm font-medium'>
                        Grade Level
                    </label>
                    <div className='flex items-center gap-2 text-sm'>
                        <User size={16} className='text-muted-foreground' />
                        <span>{selectedStudent?.grade_level || 'Not specified'}</span>
                    </div>
                </div>

                {/* Student ID */}
                <div>
                    <label className='text-muted-foreground mb-1 block text-sm font-medium'>Student ID</label>
                    <div className='text-sm font-medium'>
                        {selectedStudent?.student_id || selectedStudent?.uuid?.slice(0, 8)}
                    </div>
                </div>
            </div>

            <div className='mt-8'>
                <h3 className='mb-4 text-lg font-semibold'>Account Status</h3>
                <dl className='grid gap-4'>
                    <div>
                        <dt className='text-muted-foreground text-xs font-medium uppercase'>Status</dt>
                        <dd className='mt-1'>
                            <Badge variant={selectedStudent.active ? 'secondary' : 'outline'}>
                                {selectedStudent.active ? 'Active' : 'Inactive'}
                            </Badge>
                        </dd>
                    </div>
                    <div>
                        <dt className='text-muted-foreground text-xs font-medium uppercase'>Created</dt>
                        <dd className='mt-1 text-sm'>
                            {selectedStudent.created_date
                                ? format(new Date(selectedStudent.created_date), 'dd MMM yyyy, HH:mm')
                                : 'N/A'}
                        </dd>
                    </div>
                    <div>
                        <dt className='text-muted-foreground text-xs font-medium uppercase'>
                            Last Updated
                        </dt>
                        <dd className='mt-1 text-sm'>
                            {selectedStudent.updated_date
                                ? format(new Date(selectedStudent.updated_date), 'dd MMM yyyy, HH:mm')
                                : 'N/A'}
                        </dd>
                    </div>
                    <div>
                        <dt className='text-muted-foreground text-xs font-medium uppercase'>UUID</dt>
                        <dd className='mt-1 font-mono text-xs'>{selectedStudent.uuid || 'N/A'}</dd>
                    </div>
                </dl>
            </div>

            {/* Enrolled Courses Section */}
            <div className='mt-8'>
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
                                                    className={`rounded-full px-2 py-1 text-xs font-medium ${enrollment?.status === 'COMPLETED'
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
