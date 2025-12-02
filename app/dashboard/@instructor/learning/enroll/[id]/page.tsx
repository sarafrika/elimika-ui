'use client';

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import useCourseClassesWithDetails from '@/hooks/use-course-classes';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import ConfirmModal from '../../../../../../components/custom-modals/confirm-modal';
import { useInstructor } from '../../../../../../context/instructor-context';
import { enrollStudentMutation, getStudentScheduleQueryKey } from '../../../../../../services/client/@tanstack/react-query.gen';
import {
  CustomEmptyState,
  CustomLoadingState,
} from '../../../../@course_creator/_components/loading-state';
import EnrollCourseCard from '../../../../_components/enroll-course-card';

const EnrollmentPage = () => {
  const params = useParams();
  const qc = useQueryClient()
  const instructor = useInstructor()
  const courseId = params?.id as string;
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    if (courseId) {
      replaceBreadcrumbs([
        { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
        {
          id: 'learning',
          title: 'Learning',
          url: `/dashboard/learning`,
        },
        {
          id: 'course-details',
          title: `Enroll`,
          url: `/dashboard/learning/enroll/${courseId}`,
        },
      ]);
    }
  }, [replaceBreadcrumbs, courseId]);

  const [openEnrollModal, setOpenEnrollModal] = useState(false);
  const [enrollingClass, setEnrollingClass] = useState<any | null>(null);
  const { classes, loading, isError } = useCourseClassesWithDetails(
    courseId,
    '2025-09-12',
    '2026-12-12'
  );

  const enrollStudent = useMutation(enrollStudentMutation());
  const handleEnrollStudent = () => {
    if (instructor?.uuid && enrollingClass?.uuid) {
      enrollStudent.mutate(
        {
          body: { class_definition_uuid: enrollingClass?.uuid, student_uuid: instructor?.uuid },
        },
        {
          onSuccess: data => {
            qc.invalidateQueries({
              queryKey: getStudentScheduleQueryKey({
                path: { studentUuid: instructor?.uuid as string },
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
            // @ts-expect-error
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
      <CardHeader>
        <CardTitle className='text-2xl font-semibold'>Explore Classes Open for Enrollment</CardTitle>
        <CardDescription className=''>Discover courses designed to help you grow and succeed.</CardDescription>
      </CardHeader>

      {classes.length === 0 ? (
        <CustomEmptyState
          headline='No class found'
          subHeading='No classes available for this course.'
        />
      ) : (
        <div className='flex flex-row flex-wrap gap-4'>
          {classes.map((cls: any) => (
            <EnrollCourseCard
              href='#'
              key={cls?.uuid}
              cls={cls as any}
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
          <div className='space-y-3 text-sm text-muted-foreground'>
            <p>
              You are about to <strong>enroll</strong> in the following class/program:
            </p>

            <div className='rounded-md border bg-muted/60 p-3'>
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
