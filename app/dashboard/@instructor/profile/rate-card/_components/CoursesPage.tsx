'use client';

import DeleteModal from '@/components/custom-modals/delete-modal';
import type { Course } from '@/services/client';
import {
  deleteCourseMutation,
  getAllCourseCreatorsQueryKey,
  getAllCoursesOptions,
  getAllCoursesQueryKey,
  searchTrainingApplicationsOptions,
  unverifyCourseCreatorMutation,
  verifyCourseCreatorMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUserProfile } from '../../../../../../context/profile-context';
import { useProfileFormMode } from '../../../../../../context/profile-form-mode-context';
import CourseDetailsPanel from './CourseDetailsPanel';
import CourseList from './CourseList';
import CourseMobileModal from './CourseMobileModal';

export default function CoursesPage() {
  const user = useUserProfile();
  const { disableEditing } = useProfileFormMode();

  const size = 50;
  const [page] = useState(0);

  const { data: allCourses } = useQuery(
    getAllCoursesOptions({ query: { pageable: { page, size, sort: [] } } })
  );

  const { data: appliedCourses } = useQuery({
    ...searchTrainingApplicationsOptions({
      query: {
        pageable: {},
        searchParams: { applicant_uuid_eq: user?.instructor?.uuid as string },
      },
    }),
    enabled: !!user?.instructor?.uuid,
  });

  // const combinedCourses = React.useMemo(() => {
  //   if (!allCourses?.data?.content || !appliedCourses?.data?.content) return [];
  //   const appliedMap = new Map(
  //     appliedCourses.data.content.map((app: any) => [app.course_uuid, app])
  //   );
  //   return allCourses.data.content.map((course: any) => ({
  //     ...course,
  //     application: appliedMap.get(course.uuid) || null,
  //   }));
  // }, [allCourses, appliedCourses]);
  const combinedCourses = React.useMemo(() => {
    if (!allCourses?.data?.content || !appliedCourses?.data?.content) return [];

    const appliedMap = new Map(
      appliedCourses.data.content.map((app: any) => [app.course_uuid, app])
    );

    // Only return courses that have an application
    return allCourses.data.content
      .filter((course: any) => appliedMap.has(course.uuid))
      .map((course: any) => ({
        ...course,
        application: appliedMap.get(course.uuid),
      }));
  }, [allCourses, appliedCourses]);

  const courses = useMemo(() => combinedCourses ?? [], [combinedCourses]);
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
            // @ts-expect-error
            toast.success(data?.message || 'Course creator verified successfully');
          },
        }
      );
    } catch (_error) {}
  };

  const handleUnverifyCourse = async (_course: Course) => {
    // try {
    //   unVerifyCourseCreator.mutate(
    //     { path: { uuid: course.uuid! }, query: { reason: '' } },
    //     {
    //       onSuccess: data => {
    //         qc.invalidateQueries({
    //           queryKey: getAllCourseCreatorsQueryKey({ query: { pageable: {} } }),
    //         });
    //         // @ts-expect-error
    //         toast.success(data?.message || 'Course creator verification removed successfully');
    //       },
    //     }
    //   );
    // } catch (error) { }
  };

  const handleDeclineCourse = async (_course: Course) => {
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

  const deleteCourse = useMutation(deleteCourseMutation());
  const handleCourseCreatorDelete = (course: Course) => {
    setDeletingId(course.uuid as string);
    setOpenDeleteModal(true);
  };

  const confirmDeleteCourseCreator = () => {
    if (!deletingId) return;

    deleteCourse.mutate(
      { path: { uuid: deletingId as string } },
      {
        onSuccess: () => {
          toast.success('Course deleted successfully');
          qc.invalidateQueries({
            queryKey: getAllCoursesQueryKey({ query: { pageable: {} } }),
          });
        },
      }
    );
  };

  const filteredAndSortedCourses = courses
    .filter(course => {
      const matchesSearch =
        course.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.objectives?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const courseStatus = course.status;
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

  // if (error) {
  //   return <ErrorPage message={error?.message || 'Something went wrong while fetching courses'} />;
  // }

  return (
    <div className='bg-background border-border flex h-[calc(100vh-120px)] flex-col overflow-hidden rounded-lg border lg:flex-row'>
      <CourseList
        courses={filteredAndSortedCourses as any}
        selectedCourse={selectedCourse as any}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        onCourseSelect={handeCourseCreatorSelect}
        onCourseDelete={handleCourseCreatorDelete}
        // isLoading={isLoading || isFetching}
        isLoading={false}
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
        title='Delete Course'
        description='This course will be deleted permanently. Are you sure you want to delete this course? This action cannot be undone.'
        onConfirm={confirmDeleteCourseCreator}
        isLoading={deleteCourse.isPending}
        confirmText='Delete Course'
      />
    </div>
  );
}
