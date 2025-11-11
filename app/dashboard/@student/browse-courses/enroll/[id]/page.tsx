'use client';

import ConfirmModal from '@/components/custom-modals/confirm-modal';
import { Card } from '@/components/ui/card';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useStudent } from '@/context/student-context';
import useBundledClassInfo from '@/hooks/use-course-classes';
import {
  enrollStudentMutation,
  getStudentScheduleQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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
  const [enrollingClass, setEnrollingClass] = useState<any | null>(null);
  const { classes, loading, isError } = useBundledClassInfo(
    courseId,
    '2024-10-23',
    '2026-12-12',
    student
  );

  const enrollStudent = useMutation(enrollStudentMutation());
  const handleEnrollStudent = () => {
    if (student?.uuid && enrollingClass?.uuid) {
      enrollStudent.mutate(
        {
          body: { class_definition_uuid: enrollingClass?.uuid, student_uuid: student?.uuid },
        },
        {
          onSuccess: data => {
            qc.invalidateQueries({
              queryKey: getStudentScheduleQueryKey({
                path: { studentUuid: student?.uuid as string },
                query: {
                  start: new Date('2025-11-02'),
                  end: new Date('2026-12-19'),
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
                setEnrollingClass(cls);
              }}
              variant='full'
            />
          ))}
        </div>
      )}

      <ConfirmModal
        open={openEnrollModal}
        setOpen={setOpenEnrollModal}
        title="Confirm Enrollment"
        description={
          <div className="space-y-3 text-sm text-gray-700">
            <p>
              You are about to <strong>enroll</strong> in the following class/program:
            </p>

            <div className="rounded-md bg-gray-50 border p-3">
              <p><strong>Course Name:</strong> {enrollingClass?.course?.name}</p>
              <p><strong>Instructor:</strong> {enrollingClass?.instructor?.full_name}</p>
              {/* <p><strong>Schedule:</strong> {enrollingCourse?.scheduleSummary}</p> */}
              <p><strong>Start Date:</strong> {(enrollingClass?.default_start_time)}</p>
              <p><strong>End Date:</strong> {(enrollingClass?.default_end_time)}</p>
              {enrollingClass?.location_type && (
                <p><strong>Location:</strong> {enrollingClass?.location_type}</p>
              )}
            </div>

            <p>
              By enrolling, you’ll gain access to course materials, session updates,
              and any assessments or assignments tied to this program. Ensure that
              you’ve reviewed your class schedule and that this time slot works for you.
            </p>

            <p><strong>Training Fee:{"  "} </strong>KES {enrollingClass?.training_fee}</p>

            <p className="text-yellow-600 font-medium">
              Note: Once enrolled, you may need to contact your instructor or admin to withdraw.
            </p>
          </div>
        }
        onConfirm={handleEnrollStudent}
        isLoading={enrollStudent.isPending}
        confirmText="Yes, Enroll Me"
        cancelText="No, Cancel"
        variant="primary"
      />
    </Card>
  );
};

export default EnrollmentPage;
