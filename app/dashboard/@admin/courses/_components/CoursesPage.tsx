'use client';

import DeleteModal from '@/components/custom-modals/delete-modal';
import ErrorPage from '@/components/ErrorPage';
import { Course } from '@/services/client';
import {
  deleteCourseCreatorMutation,
  getAllCourseCreatorsQueryKey,
  getAllCoursesOptions,
  unverifyCourseCreatorMutation,
  verifyCourseCreatorMutation
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import CourseDetailsPanel from './CourseDetailsPanel';
import CourseList from './CourseList';
import CourseMobileModal from './CourseMobileModal';

export default function CoursesPage() {
  const { data, error, isLoading, isFetching } = useQuery(
    getAllCoursesOptions({ query: { pageable: { page: 0, size: 20, sort: ['desc'] } } })
  );

  const courses = useMemo(() => data?.data?.content ?? [], [data?.data?.content]);
  const [selectedCourse, setSelectedCourses] = useState<Course | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    if (courses.length > 0 && !selectedCourse) {
      setSelectedCourses(courses[0] as any);
    }
  }, [courses, selectedCourse]);

  const approveCourseCreator = useMutation(verifyCourseCreatorMutation());
  const unVerifyCourseCreator = useMutation(unverifyCourseCreatorMutation());

  const handleApproveCourse = async (course: Course) => {
    try {
      approveCourseCreator.mutate(
        { path: { uuid: course.uuid! }, query: { reason: '' } },
        {
          onSuccess: data => {
            qc.invalidateQueries({
              queryKey: getAllCourseCreatorsQueryKey({ query: { pageable: {} } }),
            });
            // @ts-ignore
            toast.success(data?.message || 'Course creator verified successfully');
          },
        }
      );
    } catch (error) { }
  };

  const handleUnverifyCourse = async (course: Course) => {
    // try {
    //   unVerifyCourseCreator.mutate(
    //     { path: { uuid: course.uuid! }, query: { reason: '' } },
    //     {
    //       onSuccess: data => {
    //         qc.invalidateQueries({
    //           queryKey: getAllCourseCreatorsQueryKey({ query: { pageable: {} } }),
    //         });
    //         // @ts-ignore
    //         toast.success(data?.message || 'Course creator verification removed successfully');
    //       },
    //     }
    //   );
    // } catch (error) { }
  };

  const handleDeclineCourse = async (course: Course) => {
    toast.message('Implement reject/decline here');
  };

  const handeCourseCreatorSelect = (course: Course) => {
    setSelectedCourses(course as any);
    // Open modal on small screens
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsModalOpen(true);
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const deleteCourseCreator = useMutation(deleteCourseCreatorMutation());
  const handleCourseCreatorDelete = (course: Course) => {
    setDeletingId(course.uuid as string);
    setOpenDeleteModal(true);
  };

  const confirmDeleteCourseCreator = () => {
    if (!deletingId) return;

    deleteCourseCreator.mutate(
      { path: { uuid: deletingId as string } },
      {
        onSuccess: () => {
          toast.success('Course creator deleted successfully');
          qc.invalidateQueries({
            queryKey: getAllCourseCreatorsQueryKey({ query: { pageable: {} } }),
          });
        },
      }
    );
  };

  const filteredAndSortedCourseCourses = courses
    .filter(course => {
      const matchesSearch =
        course.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.objectives?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const courseStatus = course.status ? 'PUBLISHED' : 'DRAFT';
      const matchesStatus = statusFilter === 'all' || courseStatus === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_date || '').getTime();
      const dateB = new Date(b.created_date || '').getTime();

      if (sortOrder === 'asc') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });

  if (error) {
    return (
      <ErrorPage message={error?.message || 'Something went wrong while fetching courses'} />
    );
  }

  return (
    <div className='bg-background flex h-[calc(100vh-120px)] flex-col lg:flex-row'>
      <CourseList
        courses={filteredAndSortedCourseCourses as any}
        selectedCourse={selectedCourse as any}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        onCourseSelect={handeCourseCreatorSelect}
        onCourseDelete={handleCourseCreatorDelete}
        isLoading={isLoading || isFetching}
      />

      {/* Right Panel - Instructor Details (Desktop only) */}
      <CourseDetailsPanel
        course={selectedCourse as any}
        onApprove={handleApproveCourse}
        onUnverify={handleUnverifyCourse}
        onDecline={handleDeclineCourse}
        isApprovePending={approveCourseCreator.isPending}
        isUnverifyPending={unVerifyCourseCreator.isPending}
        isDeclinePending={false}
      />

      {/* Mobile Modal */}
      <CourseMobileModal
        course={selectedCourse as any}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onApprove={handleApproveCourse}
        onUnverify={handleUnverifyCourse}
        onDecline={handleDeclineCourse}
      />

      <DeleteModal
        open={openDeleteModal}
        setOpen={setOpenDeleteModal}
        title='Delete Course Creator'
        description='This course creator will be deleted permanently. Are you sure you want to delete this course creator? This action cannot be undone.'
        onConfirm={confirmDeleteCourseCreator}
        isLoading={deleteCourseCreator.isPending}
        confirmText='Delete Course Creator'
      />
    </div>
  );
}
