'use client';

import { Card } from '@/components/ui/card';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useStudent } from '@/context/student-context';
import useBundledClassInfo from '@/hooks/use-course-classes';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import ConfirmModal from '../../../../../../components/custom-modals/confirm-modal';
import {
  enrollStudentMutation,
  getStudentScheduleQueryKey,
} from '../../../../../../services/client/@tanstack/react-query.gen';
import { CustomLoadingState } from '../../../../@course_creator/_components/loading-state';
import EnrollCourseCard from '../../../../_components/enroll-course-card';

const EnrollmentPage = () => {
  const params = useParams();
  const courseId = params?.id as string;
  const { replaceBreadcrumbs } = useBreadcrumb();
  const student = useStudent();
  const qc = useQueryClient();

  useEffect(() => {
    if (courseId) {
      replaceBreadcrumbs([
        { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
        {
          id: 'courses',
          title: 'Browse Courses',
          url: `/dashboard/browse-courses`,
        },
        {
          id: 'course-details',
          title: `Enroll`,
          url: `/dashboard/browse-courses/enroll/${courseId}`,
        },
      ]);
    }
  }, [replaceBreadcrumbs, courseId]);

  const [openEnrollModal, setOpenEnrollModal] = useState(false);
  const [enrollingCourse, setEnrollingCourse] = useState<any | null>(null);
  const { classes, loading, isError } = useBundledClassInfo(
    courseId,
    '2024-10-23',
    '2026-12-12',
    student
  );

  const enrollStudent = useMutation(enrollStudentMutation());
  const handleEnrollStudent = () => {
    if (student?.uuid && enrollingCourse?.uuid) {
      enrollStudent.mutate(
        {
          body: { class_definition_uuid: enrollingCourse?.uuid, student_uuid: student?.uuid },
        },
        {
          onSuccess: data => {
            qc.invalidateQueries({
              queryKey: getStudentScheduleQueryKey({
                path: { studentUuid: student?.uuid as string },
                query: {
                  start: new Date('2025-11-02'),
                  end: new Date('2025-12-19'),
                },
              }),
            });
            setOpenEnrollModal(false);
            toast.success(data?.message || 'Student enrolled successfully');
          },
          onError: data => {
            // @ts-ignore
            toast.error(data?.error as string);
            setOpenEnrollModal(false);
          },
        }
      );
    } else {
      toast.error('Student not found');
    }
  };

  if (loading) {
    return <CustomLoadingState subHeading='Loading available classes...' />;
  }

  return (
    <Card className='space-y-4 px-6 py-10'>
      <div>
        <h1 className='text-2xl font-semibold'>Explore Classes Open for Enrollment</h1>
        <p className='text-gray-600'>Discover courses designed to help you grow and succeed.</p>
      </div>

      {classes.length === 0 ? (
        <Card className='text-gray-500'>No classes available for this course.</Card>
      ) : (
        <div className='flex flex-row flex-wrap gap-4'>
          {classes.map((cls: any) => (
            <EnrollCourseCard
              key={cls?.uuid}
              href='#'
              cls={cls as any}
              enrollmentPercentage={5}
              isFull={false}
              disableEnroll={cls?.enrollments?.length > 0}
              handleEnroll={() => {
                setOpenEnrollModal(true);
                setEnrollingCourse(cls);
              }}
              variant='full'
            />
          ))}
        </div>
      )}

      <ConfirmModal
        open={openEnrollModal}
        setOpen={setOpenEnrollModal}
        title='Enroll'
        description='you will enrol for this class/program.'
        onConfirm={handleEnrollStudent}
        isLoading={enrollStudent.isPending}
        confirmText='Enroll'
        cancelText='No, cancel'
        variant='destructive'
      />
    </Card>
  );
};

export default EnrollmentPage;
