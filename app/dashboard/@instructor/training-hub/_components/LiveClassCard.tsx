'use client';

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
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import {
  isAuthenticatedMediaUrl,
  toAuthenticatedMediaUrl
} from '@/src/lib/media-url';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleCheck,
  EllipsisVertical,
  Eye,
  Filter,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  Users
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../../../../../components/ui/sheet';
import { useUserProfile } from '../../../../../context/profile-context';
import { useDifficultyLevels } from '../../../../../hooks/use-difficultyLevels';
import { cn } from '../../../../../lib/utils';
import { deactivateClassDefinitionMutation, getAllStudentsOptions, getClassDefinitionsForInstructorQueryKey, getCourseEnrollmentsOptions, getEnrollmentsForClassOptions } from '../../../../../services/client/@tanstack/react-query.gen';
import { RichTextPreview } from '../../classes/class-training/[id]/_components/ClassTrainingPage';
import type { TrainingHubLiveClass } from './training-hub-data';

type LiveClassCardProps = {
  liveClass: TrainingHubLiveClass;
};

export function LiveClassCard({
  liveClass,
}: LiveClassCardProps) {
  const qc = useQueryClient()
  const profile = useUserProfile()

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'enrolled' | 'not_enrolled'>('all');

  const { data: courseEnrollments } = useQuery({
    ...getCourseEnrollmentsOptions({
      path: { courseUuid: liveClass?.class?.course_uuid as string },
      query: { pageable: {} }
    })
  })

  const { data: classEnrollments } = useQuery({
    ...getEnrollmentsForClassOptions({
      path: { uuid: liveClass?.class?.uuid as string },
    })
  })

  const { data: allStudents } = useQuery({
    ...getAllStudentsOptions({ query: { pageable: {} } })
  })

  const studentUuids = useMemo(
    () =>
      courseEnrollments?.data?.content
        ?.map(enrollment => enrollment.student_uuid)
        .filter(Boolean) ?? [],
    [courseEnrollments]
  );

  const enrolledSet = useMemo(() => {
    return new Set(studentUuids);
  }, [studentUuids]);

  const classEnrolledSet = useMemo(() => {
    return new Set(
      (classEnrollments?.data ?? []).map(e => e.student_uuid)
    );
  }, [classEnrollments]);

  const students = useMemo(() => {
    const all = allStudents?.data?.content ?? [];

    return all.filter(student => enrolledSet.has(student?.uuid as string));
  }, [allStudents, enrolledSet]);

  const filteredStudents = useMemo(() => {
    const all = allStudents?.data?.content ?? [];

    return all
      .filter(student => {
        const isEnrolled = classEnrolledSet.has(student?.uuid as string);

        if (filter === 'enrolled') return isEnrolled;
        if (filter === 'not_enrolled') return !isEnrolled;
        return true;
      })

      .filter(student => {
        if (!search.trim()) return true;

        return student.full_name
          ?.toLowerCase()
          .includes(search.toLowerCase());
      });
  }, [allStudents, enrolledSet, filter, search]);

  const inviteStudents = useMemo(() => {
    const all = allStudents?.data?.content ?? [];

    return all.filter(student => {
      const uuid = student?.uuid as string;
      return !classEnrolledSet.has(uuid);
    });
  }, [allStudents, classEnrolledSet]);

  const [selectedStudentUuids, setSelectedStudentUuids] = useState<string[]>([]);

  const toggleStudent = (studentUuid: string) => {
    setSelectedStudentUuids(current =>
      current.includes(studentUuid)
        ? current.filter(id => id !== studentUuid)
        : [...current, studentUuid]
    );
  };

  // const inviteStudentsMutation = useMutation({
  //   mutationFn: async () => {
  //     return inviteStudentsToLiveClass({
  //       path: {
  //         liveClassUuid: liveClass.uuid,
  //       },
  //       body: {
  //         student_uuids: selectedStudentUuids,
  //       },
  //     });
  //   },
  //   onSuccess: () => {
  //     toast.success(
  //       `${selectedStudentUuids.length} student(s) invited`
  //     );

  //     setSelectedStudentUuids([]);
  //     setInviteOpen(false);
  //   },
  // });


  const imageUrl = toAuthenticatedMediaUrl(liveClass.imageUrl as string);
  const promotionalVideoUrl = toAuthenticatedMediaUrl(liveClass.promotionalVideoUrl as string);

  const deleteClassMut = useMutation(deactivateClassDefinitionMutation());

  const handleDeleteClass = () => {
    if (!liveClass?.classUuid) return;

    deleteClassMut.mutate(
      {
        path: { uuid: liveClass.classUuid },
      },
      {
        onSuccess: () => {
          toast.success('Class deleted successfully');
          setDeleteOpen(false);

          qc.invalidateQueries({
            queryKey: getClassDefinitionsForInstructorQueryKey({ path: { instructorUuid: profile?.instructor?.uuid as string } })
          })
        },
        onError: (error) => {
          toast.error('Failed to delete class');
        },
      }
    );
  };

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const registrationLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/dashboard/workspace/student/courses/available-classes/${liveClass?.class?.course?.uuid}/enroll?id=${liveClass?.classUuid}`
      : '';

  const statusConfig =
    liveClass.status === 'published'
      ? {
        label: 'Published',
        className:
          'border-success/20 bg-success/10 text-success',
      }
      : liveClass.status === 'draft'
        ? {
          label: 'Draft',
          className:
            'border-warning/20 bg-warning/10 text-warning',
        }
        : {
          label: 'On-going',
          className:
            'border-primary/20 bg-primary/10 text-primary',
        };


  const { difficultyMap } = useDifficultyLevels();

  const progress = liveClass?.class?.class_progress_percentage;
  const sessionsRemaining =
    Number(liveClass?.sessions) - Number(liveClass?.class?.completed_session_count);

  const completed = sessionsRemaining === 0

  const formattedDate = liveClass?.class?.default_start_time
    ? new Date(liveClass.class.default_start_time).toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    : 'Not set';

  const bundledCourses = liveClass.programCourses ?? [];
  const topDifficultyLabels = Array.from(
    new Set(
      [
        liveClass?.class?.course?.difficulty_uuid
          ? difficultyMap[liveClass.class.course.difficulty_uuid] ?? 'General'
          : null,
        ...bundledCourses.map(course =>
          course.difficulty_uuid ? difficultyMap[course.difficulty_uuid] ?? 'General' : 'General'
        ),
      ].filter((value): value is string => Boolean(value))
    )
  );

  const totalMinutes = liveClass?.class?.schedule?.reduce(
    (sum, item) => sum + Number(item?.duration_minutes || 0),
    0
  );

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const timeHrsMinutes = `${hours} hrs ${minutes} mins`

  return (
    <Card className='overflow-hidden p-0 rounded-md border border-border/60 bg-card shadow-sm'>
      <CardContent className='p-0'>
        <div className='flex flex-col'>
          {/* TOP SECTION */}
          <div className='flex flex-col gap-4 p-4 lg:flex-row lg:items-start'>
            <div>
              {/* IMAGE */}
              <div className='hidden lg:flex relative h-[120px] w-full overflow-hidden rounded-md bg-muted lg:w-[180px] lg:min-w-[180px]'>
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={liveClass.title}
                    fill
                    className='object-cover'
                    unoptimized={isAuthenticatedMediaUrl(
                      imageUrl
                    )}
                  />
                ) : (
                  <div className='bg-primary/10 text-primary flex h-full w-full items-center justify-center'>
                    <BookOpen className='size-10' />
                  </div>
                )}
              </div>
            </div>

            {/* CONTENT */}
            <div className='min-w-0 flex-1'>
              {/* HEADER */}
              <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0 flex-1'>
                  <h3 className='text-foreground mt-2 line-clamp-1 text-xl font-semibold tracking-[-0.02em]'>
                    {liveClass.title}
                  </h3>

                  <div className='text-muted-foreground mt-1 line-clamp-2 text-sm'>
                    <RichTextPreview html={liveClass?.class?.course?.description as string} />
                  </div>
                </div>

                {/* DROPDOWN */}
                <div className='flex flex-row items-center gap-2' >
                  <Button
                    variant='ghost'
                    className='border mt-2 text-primary'
                    onClick={() => setInviteOpen(true)}
                  >
                    <UserPlus />
                    <p>Invite student</p>
                  </Button>


                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        aria-label='More options'
                        variant='ghost'
                        size='icon'
                        className='h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                      >
                        <EllipsisVertical className='size-4' />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      align='end'
                      className='w-52'
                    >
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/dashboard/classes/new?id=${liveClass?.classUuid}`}
                          className='flex items-center gap-2'
                        >
                          <Plus className='size-4' />
                          Add class
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild>
                        <Link
                          href={`/dashboard/training-hub/classes/${liveClass.classUuid}`}
                          className='flex items-center gap-2'
                        >
                          <Eye className='size-4' />
                          View class
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild>
                        <Link
                          href={`/dashboard/classes/new?id=${liveClass?.classUuid}`}
                          className='flex items-center gap-2'
                        >
                          <Pencil className='size-4' />
                          Edit class
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        className='text-destructive focus:text-destructive'
                        onClick={() => setDeleteOpen(true)}
                      >
                        <Trash2 className='mr-2 size-4' />
                        Delete class
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>



              </div>

              <div className='flex flex-wrap items-center gap-2 mt-2'>
                <span className='inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground'>
                  {liveClass.provider}
                </span>

                <span className='inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground'>
                  {timeHrsMinutes}
                </span>

                <span className='inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground'>
                  {liveClass.fee} /hr/student
                </span>

                <div className='flex flex-wrap items-center gap-2'>
                  {topDifficultyLabels.map(difficulty => (
                    <span
                      key={difficulty}
                      className='inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground'
                    >
                      {difficulty}
                    </span>
                  ))}
                </div>
              </div>

              {bundledCourses.length > 0 && (
                <div className='mt-3 flex flex-wrap items-center gap-2'>
                  <span className='text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground'>
                    Program courses:
                  </span>

                  {bundledCourses.map((course, index) => (
                    <div
                      key={course.uuid ?? `${course.name}-${index}`}
                      className='inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted'
                    >
                      {course.name}
                    </div>
                  ))}
                </div>
              )}

              {/* STATS */}
              <div className='mt-5 flex flex-wrap items-center justify-evenly gap-3 border-t border-border/60 pt-4'>
                <StatItem
                  icon={<BookOpen className='size-4' />}
                  value={liveClass.classes}
                  label='Sessions'
                />

                <StatItem
                  icon={<Users className='size-4' />}
                  value={liveClass.students}
                  label='Students'
                />

                <StatItem
                  icon={<CalendarDays className='size-4' />}
                  value={formattedDate}
                  label='Start Date'
                />

                <div>
                  <p className='rounded-md px-0.5 py-1.5 text-sm font-semibold'>
                    {liveClass?.class?.location_type}
                  </p>

                  <p className='text-xs opacity-80'>
                    {liveClass?.class?.class_visibility}
                  </p>
                </div>
              </div>
            </div>
          </div>




          {/* BOTTOM SECTION */}
          {completed ?
            <div className="flex flex-col gap-4 bg-success/5 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
                  <CheckCircle2 className="h-7 w-7" />
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">
                      Training Completed
                    </h3>

                    <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success">
                      Completed
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    You've successfully delivered all scheduled sessions for this class.
                  </p>
                </div>
              </div>

              <div className="flex w-full max-w-md flex-col md:flex-row gap-3 lg:w-auto">
                <Link
                  href={`/dashboard/classes/class-training/${liveClass.classUuid}`}
                  className="inline-flex h-10 w-full items-center justify-center rounded-md bg-success px-5 text-sm font-semibold text-success-foreground transition-colors hover:bg-success/90 focus:outline-none focus:ring-2 focus:ring-success focus:ring-offset-2 min-w-fit"
                >
                  View Class
                </Link>

                <Link
                  href={`/dashboard/classes/class-training/${liveClass.classUuid}/award-certificates`}
                  className="inline-flex h-10 w-full text-center items-center justify-center rounded-md bg-success px-5 text-sm font-semibold text-success-foreground transition-colors hover:bg-success/90 focus:outline-none focus:ring-2 focus:ring-success focus:ring-offset-2 min-w-fit"
                >
                  Certificates
                </Link>
              </div>
            </div>
            :
            <div className='border-t border-border/60 bg-muted/20 px-4 py-4'>
              <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
                {/* PROGRESS */}
                <div className='min-w-0 flex-1'>
                  <div className='mb-2 flex items-center justify-between gap-3'>
                    <p className='text-sm font-medium text-foreground'>
                      Overall Progress
                    </p>

                    <p className='text-sm font-semibold text-primary'>
                      {sessionsRemaining} Sessions Remaining
                    </p>
                  </div>

                  <Progress
                    value={progress}
                    className='bg-muted h-2'
                    indicatorClassName='bg-primary'
                  />

                  <p className='text-muted-foreground mt-2 text-sm'>
                    {progress}% completed
                  </p>
                </div>

                {/* ACTIONS */}
                <div className='flex items-center gap-2'>
                  <Link
                    href={(() => {
                      return `/dashboard/classes/class-training/${liveClass.classUuid}`;
                    })()}
                    className='inline-flex h-9 min-w-[120px] items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90'
                  >
                    Open Class
                  </Link>
                </div>
              </div>

            </div>
          }
        </div>
      </CardContent>


      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete Class?
            </AlertDialogTitle>

            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className='font-medium'>
                "{liveClass.title}"
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={handleDeleteClass}
              disabled={deleteClassMut.isPending}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {deleteClassMut.isPending
                ? 'Deleting...'
                : 'Delete Class'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <Sheet open={inviteOpen} onOpenChange={setInviteOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col p-0 sm:max-w-xl"
        >
          <div className="border-b px-3">
            <SheetHeader>
              <SheetTitle>Invite Students</SheetTitle>

              <SheetDescription>
                Invite students to join your live class.
              </SheetDescription>
            </SheetHeader>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6 px-3">
              <div>
                <h3 className="mb-3 text-sm font-medium">
                  Select students
                </h3>

                <div className="flex flex-row gap-2 mb-3">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search students..."
                    className="h-9 w-full rounded-md border px-3 text-sm"
                  />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent className="w-48" align="start">
                      <DropdownMenuItem
                        onClick={() => setFilter("all")}
                        className={cn(
                          "flex items-center justify-between",
                          filter === "all" && "bg-muted font-medium"
                        )}
                      >
                        All
                        {filter === "all" && <Check className="h-4 w-4" />}
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => setFilter("enrolled")}
                        className={cn(
                          "flex items-center justify-between",
                          filter === "enrolled" && "bg-muted font-medium"
                        )}
                      >
                        Enrolled
                        {filter === "enrolled" && <Check className="h-4 w-4" />}
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => setFilter("not_enrolled")}
                        className={cn(
                          "flex items-center justify-between",
                          filter === "not_enrolled" && "bg-muted font-medium"
                        )}
                      >
                        Not enrolled
                        {filter === "not_enrolled" && <Check className="h-4 w-4" />}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2">
                  {filteredStudents.map(student => {
                    const selected = selectedStudentUuids.includes(
                      student?.uuid as string
                    );

                    return (
                      <button
                        key={student?.uuid}
                        type="button"
                        onClick={() => toggleStudent(student?.uuid as string)}
                        className={cn(
                          "flex w-full items-start justify-between rounded-lg border p-3 text-left transition-colors",
                          selected &&
                          "border-primary bg-primary/5"
                        )}
                      >
                        <div className="min-w-0 w-full flex flex-row items-center justify-between">
                          <p className="truncate font-medium text-sm">
                            {student?.full_name}
                          </p>


                          <div className='flex flex-row items-center gapp-2' >
                            <p className="truncate font-medium flex items-center gap-2">
                              {classEnrolledSet.has(student?.uuid as string) && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary">
                                  Enrolled
                                </span>
                              )}
                            </p>
                            <CircleCheck
                              className={cn(
                                "h-5 w-5 transition-colors",
                                selected ? "text-primary" : "hidden"
                              )}
                            />
                          </div>

                        </div>

                      </button>
                    );
                  })}
                </div>
              </div>

              {/* <LinkShareCard
                title="Registration Link"
                description="Copy or share the registration link for enrollment."
                url={registrationLink}
                footer={
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">
                      Share via
                    </h4>

                    <div className="flex flex-wrap gap-2">
                      {socialShareActions.map(
                        ({ icon: Icon, label, platform }) => (
                          <Button
                            key={label}
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            disabled={!registrationLink}
                            onClick={() =>
                              openShareWindow(
                                buildSocialShareUrl(platform, {
                                  title: liveClass.title,
                                  url: registrationLink,
                                  description: `Check out this class: ${liveClass.title}`,
                                })
                              )
                            }
                          >
                            <Icon className="h-4 w-4" />
                            {label}
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                }
              /> */}
            </div>
          </div>

          {/* Fixed footer */}
          <div className="bg-background border-t p-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                {selectedStudentUuids.length} selected
              </p>

              <Button
              // disabled={
              //   selectedStudentUuids.length === 0 ||
              //   inviteStudentsMutation.isPending
              // }
              // onClick={() => inviteStudentsMutation.mutate()}
              >
                Send invite
                {selectedStudentUuids.length > 0
                  ? ` (${selectedStudentUuids.length})`
                  : ""}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </Card>
  );
}

function StatItem({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className='flex items-start gap-2 border-border/50 md:border-r md:pr-3 last:border-r-0'>
      <div className='text-muted-foreground mt-0.5 shrink-0'>
        {icon}
      </div>

      <div className='min-w-0'>
        <p className='text-foreground truncate text-sm font-semibold'>
          {value}
        </p>

        <p className='text-muted-foreground text-xs'>
          {label}
        </p>
      </div>
    </div>
  );
}
