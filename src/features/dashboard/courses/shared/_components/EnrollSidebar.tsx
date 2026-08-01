'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Award,
  BookOpen,
  Building2,
  Calendar,
  Clock,
  Download,
  FileCheck,
  Globe,
  Infinity,
  MapPin,
  MoveRight,
  Search,
  Video,
  Wrench,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Course } from '@/services/client';
import { Button } from '@/components/ui/button';
import { useUserProfile } from '@/context/profile-context';
import { CombinedClassDetailsData } from '@/hooks/use-class-details';
import { UserDomain } from '@/lib/types';
import {
  deactivateClassDefinitionMutation,
  getClassDefinitionsForInstructorQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import { PreviewRow } from '@/app/dashboard/instructor/classes/new/_components/class-creation-preview-rail';

type Props = {
  course: Course;
  classData: CombinedClassDetailsData;
  creatorName: string;
  difficultyName: string | null;
  lessonCount: number;
  assessmentCount: number;
  durationLabel: string;
  onEnroll: () => void;
  handleBecomeInstructor: () => void;
  onSearchInstructor: () => void;
  onInviteStudents?: () => void;
  onApplyForFunding?: () => void;
  activeDomain?: UserDomain | null;
  becomeInstructorLabel?: string;
  becomeInstructorDisabled?: boolean;
  type?: 'course' | 'class';
};

export default function EnrollSidebar({
  course,
  classData,
  creatorName,
  difficultyName,
  lessonCount,
  assessmentCount,
  durationLabel,
  onEnroll,
  handleBecomeInstructor,
  onSearchInstructor,
  onInviteStudents,
  onApplyForFunding,
  activeDomain,
  becomeInstructorLabel = 'Apply to Train',
  becomeInstructorDisabled = false,
  type,
}: Props) {
  const router = useRouter();
  const qc = useQueryClient();
  const profile = useUserProfile();

  const priceLabel =
    typeof course.minimum_training_fee === 'number' && course.minimum_training_fee > 0
      ? `From Ksh ${course.minimum_training_fee.toLocaleString()}`
      : 'Pricing not set';

  const totalMinutes = classData?.schedule.reduce(
    (sum, item) => sum + Number(item.duration_minutes),
    0
  );
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const totalDuration = `${hours}h${minutes ? ` ${minutes}m` : ''}`;

  const [inviteOpen, setInviteOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const deleteClassMut = useMutation(deactivateClassDefinitionMutation());

  const handleDeleteClass = () => {
    if (!classData?.class?.uuid) return;

    deleteClassMut.mutate(
      {
        path: { uuid: classData?.class?.uuid },
      },
      {
        onSuccess: () => {
          toast.success('Class deleted successfully');
          setDeleteOpen(false);

          qc.invalidateQueries({
            queryKey: getClassDefinitionsForInstructorQueryKey({
              path: { instructorUuid: profile?.instructor?.uuid as string },
            }),
          });

          router.push('/dashboard/training-hub');
        },
        onError: error => {
          toast.error('Failed to delete class');
        },
      }
    );
  };

  // Instructors and organisations both apply to train a course.
  const isTrainerDomain =
    activeDomain === 'instructor' ||
    activeDomain === 'organisation' ||
    activeDomain === 'organisation_user';

  const showActionCard =
    (type === 'course' && activeDomain === 'instructor') ||
    (type === 'course' && activeDomain !== 'instructor') ||
    (type === 'class' && activeDomain === 'instructor');

  return (
    <div className='flex flex-col gap-4 sm:gap-5'>
      {/* ENROLL CARD */}
      {showActionCard && (
        <div className='border-border bg-card text-card-foreground rounded-xl border p-4 sm:p-5'>
          {type === 'course' && isTrainerDomain && (
            <>
              <div className='space-y-2'>
                <p className='text-md text-muted-foreground font-extrabold'>Split Ratio</p>
                <div className='bg-muted/40 space-y-3 rounded-md border p-3 text-sm'>
                  <div className='flex items-center justify-between'>
                    <p className='font-medium'>Course Creator</p>
                    <p className='font-semibold'>{course?.creator_share_percentage}%</p>
                  </div>

                  <div className='flex items-center justify-between'>
                    <p className='font-medium'>Instructor</p>
                    <p className='font-semibold'>{course?.instructor_share_percentage}%</p>
                  </div>

                  <div className='border-t pt-3'>
                    <p className='text-muted-foreground text-xs leading-relaxed'>
                      <span className='text-foreground font-medium'>Note:</span>{' '}
                      {course?.revenue_share_notes}
                    </p>
                  </div>
                </div>
              </div>

              <Button
                type='button'
                onClick={handleBecomeInstructor}
                disabled={becomeInstructorDisabled}
                className='bg-primary text-primary-foreground hover:bg-primary/90 mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md text-sm font-semibold shadow-sm transition sm:text-base'
              >
                {becomeInstructorLabel}
              </Button>
            </>
          )}

          {type === 'course' && !isTrainerDomain && (
            <>
              <p className='text-muted-foreground mb-1 text-sm font-medium'>
                Enroll in this course
              </p>

              <p className='text-foreground mb-4 text-xl font-black sm:text-2xl lg:text-3xl'>
                {priceLabel}
              </p>

              <div className='flex flex-col gap-2.5 sm:gap-3'>
                <Button
                  onClick={onEnroll}
                  className='bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center gap-2 rounded-md text-sm font-semibold shadow-sm transition sm:text-base'
                >
                  Enroll Now
                  <MoveRight className='h-4 w-4' />
                </Button>

                <Button
                  type='button'
                  onClick={onSearchInstructor}
                  className='border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition sm:py-3 sm:text-base'
                >
                  <Search className='h-4 w-4' />
                  Search Instructor
                </Button>
              </div>
            </>
          )}

          {type === 'class' && activeDomain === 'instructor' && (
            <>
              <p className='text-muted-foreground mb-1 text-sm font-medium'>
                Enroll students in this class
              </p>

              <p className='text-foreground mb-4 text-xl font-black sm:text-2xl lg:text-3xl'>
                From Ksh {classData?.class?.training_fee}
              </p>

              <div className='flex flex-col gap-2.5 sm:gap-3'>
                <Button
                  onClick={onInviteStudents}
                  className='bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center gap-2 rounded-md text-sm font-semibold shadow-sm transition sm:text-base'
                >
                  Invite Students
                </Button>

                <Button
                  type='button'
                  onClick={onApplyForFunding}
                  className='border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition sm:py-3 sm:text-base'
                >
                  Apply for funding
                </Button>
              </div>
            </>
          )}

          {/* <div className="mt-4 flex flex-col gap-3 pt-1">
      {[
        {
          icon: <Shield className="h-4 w-4 text-muted-foreground" />,
          text: "30-Day Money-Back Guarantee",
        },
        {
          icon: <Infinity className="h-4 w-4 text-muted-foreground" />,
          text: "Full Lifetime Access",
        },
        {
          icon: <Monitor className="h-4 w-4 text-muted-foreground" />,
          text: "Access on Mobile & Desktop",
        },
      ].map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          {item.icon}
          <span className="text-sm text-muted-foreground">{item.text}</span>
        </div>
      ))}
    </div> */}
        </div>
      )}

      {/* COURSE META */}
      {type === 'class' && (
        <div className='border-border bg-card rounded-xl border'>
          <div className='border-border border-b px-4 py-4 sm:px-5'>
            <h3 className='text-md font-extrabold'>Schedule Summary</h3>
          </div>

          <PreviewRow
            icon={Globe}
            label='Lecture Type'
            value={classData?.class?.location_type || 'N/A'}
          />

          <PreviewRow
            icon={MapPin}
            label='Location'
            value={classData?.class?.location_name || 'N/A'}
          />

          <PreviewRow
            icon={Building2}
            label='Session Format'
            value={classData?.class?.session_format || 'N/A'}
          />

          <PreviewRow
            icon={Calendar}
            label='Registration Period'
            value={
              classData?.class?.registration_period_start_date &&
              classData?.class?.registration_period_end_date
                ? `${new Date(
                    classData.class.registration_period_start_date
                  ).toLocaleDateString()} - ${new Date(
                    classData.class.registration_period_end_date
                  ).toLocaleDateString()}`
                : classData?.class?.registration_period_start_date
                  ? `${new Date(
                      classData.class.registration_period_start_date
                    ).toLocaleDateString()} (Continuous)`
                  : 'Continuous'
            }
          />

          <PreviewRow
            icon={Calendar}
            label='Start Date'
            value={
              classData?.class?.default_start_time
                ? new Date(classData.class.default_start_time).toLocaleDateString()
                : 'TBA'
            }
          />

          <PreviewRow icon={Clock} label='Total Hours' value={totalDuration || 'N/A'} />

          {classData?.class?.meeting_link && (
            <PreviewRow icon={Video} label='Meeting Link' value={classData.class.meeting_link} />
          )}

          {profile?.user_domain === 'instructor' && (
            <div className='border-border border-t p-4 sm:p-5'>
              <Button
                variant='outline'
                size='sm'
                className='h-9 w-full rounded-md'
                onClick={() => {
                  router.push(`/dashboard/classes/new?id=${classData?.class?.uuid}`);
                }}
              >
                Edit Schedule
              </Button>
            </div>
          )}
        </div>
      )}

      {/* COURSE INCLUDES */}
      <div className='border-border bg-card rounded-xl border p-4 shadow-sm sm:p-5'>
        <h3 className='text-foreground mb-3 text-sm font-semibold'>This course includes:</h3>

        <div className='flex flex-col gap-3'>
          {[
            {
              icon: <BookOpen className='text-muted-foreground h-4 w-4' />,
              text: `${lessonCount} Lessons`,
            },
            {
              icon: <FileCheck className='text-muted-foreground h-4 w-4' />,
              text: `${assessmentCount} Assessments`,
            },
            {
              icon: <Wrench className='text-muted-foreground h-4 w-4' />,
              text: 'Hands-on Projects',
            },
            {
              icon: <Download className='text-muted-foreground h-4 w-4' />,
              text: 'Downloadable Resources',
            },
            {
              icon: <Infinity className='text-muted-foreground h-4 w-4' />,
              text: 'Full Lifetime Access',
            },
            {
              icon: <Award className='text-muted-foreground h-4 w-4' />,
              text: 'Certificate of Completion',
            },
          ].map((item, i) => (
            <div key={i} className='flex items-center gap-2'>
              {item.icon}
              <span className='text-muted-foreground text-sm'>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {type === 'class' && activeDomain === 'instructor' && (
        <div>
          <Button
            onClick={() => setDeleteOpen(true)}
            variant='destructive'
            size='sm'
            className='h-10 w-full rounded-md'
          >
            Delete Class
          </Button>
        </div>
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class?</AlertDialogTitle>

            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className='font-medium'>"{classData?.class?.title}"</span>? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction
              onClick={handleDeleteClass}
              disabled={deleteClassMut.isPending}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {deleteClassMut.isPending ? 'Deleting...' : 'Delete Class'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
