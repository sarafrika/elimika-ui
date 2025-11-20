'use client';

import RichTextRenderer from '@/components/editors/richTextRenders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useClassRoster } from '@/hooks/use-class-roster';
import { useCourseLessonsWithContent } from '@/hooks/use-courselessonwithcontent';
import { useInstructorInfo } from '@/hooks/use-instructor-info';
import { getResourceIcon } from '@/lib/resources-icon';
import {
  getClassDefinitionOptions,
  getCourseAssessmentsOptions,
  getCourseByUuidOptions,
  getInstructorScheduleOptions
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  CalendarDays,
  CheckCircle,
  Clock,
  Copy,
  DollarSign,
  Edit,
  Eye,
  Facebook,
  FileQuestion,
  FileText,
  Link,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Twitter,
  Users,
} from 'lucide-react';
import moment from 'moment';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const _localizer = momentLocalizer(moment);

export default function ClassPreviewPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params?.id as string;
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    if (!classId) return;

    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      {
        id: 'trainings',
        title: 'Training Classes',
        url: '/dashboard/trainings',
      },
      {
        id: 'preview-training',
        title: 'Preview',
        url: `/dashboard/trainings/overview/${classId}`,
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs, classId]);

  const { data, isLoading: classIsLoading } = useQuery({
    ...getClassDefinitionOptions({ path: { uuid: classId as string } }),
    enabled: !!classId,
  });
  const classData = data?.data;

  const {
    data: courseDetail,
    isLoading,
    isFetched,
  } = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: classData?.course_uuid as string } }),
    enabled: !!classData?.course_uuid,
  });
  const course = courseDetail?.data;

  const { data: cAssesssment } = useQuery({
    ...getCourseAssessmentsOptions({
      path: { courseUuid: classData?.course_uuid as string },
      query: { pageable: {} },
    }),
    enabled: !!classData?.course_uuid,
  });

  const { instructorInfo } = useInstructorInfo({
    instructorUuid: classData?.default_instructor_uuid as string,
  });
  // @ts-expect-error
  const instructor = instructorInfo?.data;

  const {
    isLoading: isAllLessonsDataLoading,
    lessons: lessonsWithContent,
    contentTypeMap,
  } = useCourseLessonsWithContent({ courseUuid: classData?.course_uuid as string });

  const [registrationLink] = useState(
    `https://elimika.sarafrika.com/trainings/${classData?.uuid}/register`
  );
  const [copied, setCopied] = useState(false);

  // const totalLessons = classData.schedule.skills.reduce((acc, skill) => acc + skill.lessons.length, 0);
  // const totalHours = classData.schedule.skills.reduce((total, skill) => {
  //     return total + skill.lessons.reduce((skillTotal, lesson) => {
  //         return skillTotal + (parseInt(lesson.duration) || 0);
  //     }, 0);
  // }, 0) / 60;

  // const totalFee = classData?.visibility.isFree ? 0 : classData.visibility.price * totalLessons;
  const totalFee = 499.99;
  const totalAssignments = cAssesssment?.data?.content?.length || 0;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_err) { }
  };

  const shareToSocial = (platform: string) => {
    const url = encodeURIComponent(registrationLink);
    const text = encodeURIComponent(`Check out this class: ${classData?.title}`);

    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      email: `mailto:?subject=${encodeURIComponent(classData?.title as string)}&body=${text}%20${url}`,
    };

    if (urls[platform as keyof typeof urls]) {
      window.open(urls[platform as keyof typeof urls], '_blank', 'width=600,height=400');
    }
  };

  const { data: timetable } = useQuery({
    ...getInstructorScheduleOptions({
      path: { instructorUuid: classData?.default_instructor_uuid as string },
      query: {
        start: '2026-11-02' as any,
        end: '2026-12-19' as any,
      },
    }),
  });

  const { roster, uniqueEnrollments, isLoading: rosterLoading } = useClassRoster(classId);
  console.log(roster, "roster")




  if (isLoading || isAllLessonsDataLoading || classIsLoading) {
    return (
      <div className='flex flex-col gap-6 space-y-2'>
        <Skeleton className='h-[150px] w-full' />

        <div className='flex flex-row items-center justify-between gap-4'>
          <Skeleton className='h-[250px] w-2/3' />
          <Skeleton className='h-[250px] w-1/3' />
        </div>

        <Skeleton className='h-[100px] w-full' />
      </div>
    );
  }

  return (
    <div className='mb-20 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <div>
            {classData?.is_active ? (
              <>
                <h1 className='text-2xl font-semibold text-green-700'>Active Class</h1>
                <p className='text-muted-foreground'>
                  Your class is live and accepting new students.
                </p>
              </>
            ) : (
              <>
                <h1 className='text-2xl font-semibold text-gray-700'>Inactive Class</h1>
                <p className='text-muted-foreground'>
                  This class is currently not active. Activate it to allow student enrollment.
                </p>
              </>
            )}
          </div>
        </div>

        <Button
          onClick={() => router.push(`/dashboard/trainings/create-new?id=${classData?.uuid}`)}
          variant='outline'
          className='gap-2'
        >
          <Edit className='h-4 w-4' />
          Edit Class
        </Button>
      </div>

      {/* Status Banner */}
      <div>
        {classData?.is_active ? (
          <Card className='border-green-200 bg-green-50'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <CheckCircle className='h-6 w-6 text-green-600' />
                <div>
                  <h3 className='font-semibold text-green-800'>Class Published Successfully!</h3>
                  <p className='text-sm text-green-700'>
                    Your class is now live and students can enroll. Share the registration link to
                    start getting enrollments.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className='border-yellow-200 bg-yellow-50'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-6 w-6 text-yellow-600'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 9v2m0 4h.01M21 12A9 9 0 1112 3a9 9 0 019 9z'
                  />
                </svg>
                <div>
                  <h3 className='font-semibold text-yellow-800'>Class is Currently Inactive</h3>
                  <p className='text-sm text-yellow-700'>
                    Students cannot enroll in this class until it’s activated. You can activate it
                    from your dashboard.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Class Preview Card */}
      <Card className='border-2'>
        <CardHeader>
          <div className='flex items-start justify-between'>
            <div className='flex-1'>
              <CardTitle className='text-xl'>{classData?.title}</CardTitle>
              {classData?.description && (
                <div className='text-muted-foreground mt-1'>
                  <RichTextRenderer maxChars={100} htmlString={classData?.description as string} />
                </div>
              )}
              <Badge className='mt-2 border-green-200 bg-green-100 text-green-800'>
                Published/Draft
              </Badge>
            </div>
            {/* {classData.coverImage && (
                            <Image
                                src={""}
                                alt="Class cover"
                                className="w-32 h-20 object-cover rounded-lg"
                                width={32}
                                height={20}
                            />
                        )} */}
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-2 gap-4 text-sm md:grid-cols-2 lg:grid-cols-4'>
            <div className='flex items-center gap-2'>
              <CalendarDays className='text-muted-foreground h-4 w-4' />
              <div>
                {/* <div className='font-medium'>{classData?.default_start_time as string}</div> */}
                <div className='text-muted-foreground'>Start Date</div>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <Users className='text-muted-foreground h-4 w-4' />
              <div>
                <div className='font-medium'>{instructor?.full_name}</div>
                <div className='text-muted-foreground'>Instructor</div>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <Clock className='text-muted-foreground h-4 w-4' />
              <div>
                <div className='font-medium'>{classData?.duration_formatted}</div>
                <div className='text-muted-foreground'>Total Hours</div>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <BookOpen className='text-muted-foreground h-4 w-4' />
              <div>
                <div className='font-medium'>{lessonsWithContent?.length}</div>
                <div className='text-muted-foreground'>Lessons</div>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <FileText className='text-muted-foreground h-4 w-4' />
              <div>
                <div className='font-medium'>{totalAssignments}</div>
                <div className='text-muted-foreground'>Assignments/Quizes</div>
              </div>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4 text-sm md:grid-cols-4'>
            {classData?.location_type && (
              <div className='flex items-center gap-2'>
                <MapPin className='text-muted-foreground h-4 w-4' />
                <span>{classData?.location_type}</span>
              </div>
            )}
            <div className='flex items-center gap-2'>
              <DollarSign className='text-muted-foreground h-4 w-4' />
              <span className='font-medium'>{`${totalFee.toFixed(2)}`}</span>
            </div>
            <div className='flex items-center gap-2'>
              <Users className='text-muted-foreground h-4 w-4' />
              <span>0 / {classData?.max_participants} students</span>
            </div>
          </div>

          <div className='flex flex-wrap gap-2'>
            {course?.category_names?.map((category: string, idx: number) => (
              <Badge key={idx} variant='outline' className='text-xs'>
                {category}
              </Badge>
            ))}

            {/* {classData.targetAudience.map((audience, index) => (
                            <Badge key={index} variant="outline">{audience}</Badge>
                        ))} */}
          </div>
        </CardContent>
      </Card>

      {/* Class Management Tabs */}
      <Tabs defaultValue='details' className='space-y-4'>
        <TabsList className='grid w-full grid-cols-5'>
          <TabsTrigger value='details'>Class Details</TabsTrigger>
          <TabsTrigger value='schedule'>Schedule</TabsTrigger>
          <TabsTrigger value='skills'>Skills</TabsTrigger>
          <TabsTrigger value='assignments'>Assessments</TabsTrigger>
          <TabsTrigger value='students'>Students</TabsTrigger>
        </TabsList>

        <TabsContent value='details' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Class Information</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                <div className='space-y-3'>
                  <div>
                    <span className='text-muted-foreground text-sm'>Course:</span>
                    <div className='font-medium'>{course?.name}</div>
                  </div>

                  <div>
                    <span className='text-muted-foreground text-sm'>Target Audience:</span>
                    {/* <div className="font-medium">{classData.targetAudience.join(', ')}</div> */}
                  </div>
                </div>
                <div className='space-y-3'>
                  <div>
                    <span className='text-muted-foreground text-sm'>Academic Period:</span>
                    <div className='font-medium'>
                      {/* {classData?.default_start_time as string} -{' '}
                      {classData?.default_end_time as string} */}
                    </div>
                  </div>
                  <div>
                    <span className='text-muted-foreground text-sm'>Class Type:</span>
                    <div className='font-medium capitalize'>{classData?.location_type}</div>
                  </div>
                  <div>
                    <span className='text-muted-foreground text-sm'>Visibility:</span>
                    {/* <div className="flex items-center gap-2 font-medium">
                                            {classData.visibility.publicity === 'public' ? (
                                                <Globe className="w-4 h-4 text-green-600" />
                                            ) : (
                                                <Globe className="w-4 h-4 text-blue-600" />
                                            )}
                                            <span className="capitalize">{classData.visibility.publicity}</span>
                                        </div> */}
                  </div>
                </div>
              </div>
              <div>
                <span className='text-muted-foreground text-sm'>Description:</span>
                <div className='mt-1'>
                  <RichTextRenderer maxChars={100} htmlString={classData?.description as string} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='schedule' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Weekly Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              {/* <div className="grid grid-cols-7 gap-2 text-center text-sm">
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                                    const dayKey = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][index];
                                    const isSelected = classData.timetable.selectedDays.includes(dayKey);
                                    const timeSlot = classData.timetable.timeSlots.find(ts => ts.day === dayKey);

                                    return (
                                        <div key={day} className={`p-3 rounded-lg border ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}>
                                            <div className="font-medium">{day}</div>
                                            {isSelected && timeSlot && (
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {timeSlot.startTime} - {timeSlot.endTime}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div> */}

              <Card>
                {timetable?.data?.map(s => {
                  const isCancelled = s?.status === 'CANCELLED';
                  const isActive = s?.is_currently_active;
                  const isPast = s?.time_range
                    ? new Date(s.time_range) < new Date()
                    : false;

                  return (
                    <div
                      key={s.uuid}
                      className={`mb-4 flex items-center justify-between rounded p-4 shadow-sm ${isCancelled ? 'bg-red-100' : 'bg-card'
                        }`}
                    >
                      <div>
                        <p className='font-semibold'>
                          {s?.title} - {s?.location_type}
                        </p>
                        {/* <p>{s?.start_time as any} - {s.end_time as any}</p> */}
                        <p>{s?.time_range}</p>
                        <p>{s?.max_participants} Participants</p>
                        <p>
                          {s?.status} - {s?.cancellation_reason}
                        </p>
                      </div>

                      {/* Active / Not Active Badge */}
                      <div className="flex gap-2">
                        {/* ACTIVE / NOT ACTIVE */}
                        <span
                          className={`rounded-full px-3 py-1 text-sm font-medium ${isActive ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                            }`}
                        >
                          {isActive ? 'Active' : 'Not active'}
                        </span>

                        {/* OCCURRED / UPCOMING */}
                        <span
                          className={`rounded-full px-3 py-1 text-sm font-medium ${isPast ? 'bg-gray-600 text-white' : 'bg-blue-500 text-white'
                            }`}
                        >
                          {isPast ? 'Occurred' : 'Upcoming'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='skills' className='space-y-4'>
          <Card>
            <CardContent className='space-y-3 p-4'>
              {isAllLessonsDataLoading && <Spinner />}

              {lessonsWithContent?.length === 0 && (
                <div className='text-muted-foreground flex flex-col items-center justify-center rounded-lg p-6 text-center text-sm'>
                  <FileQuestion className='mb-3 h-8 w-8 text-muted-foreground' />
                  <h4 className='font-medium'>No Class Resources</h4>
                  <p>
                    This class doesn&apos;t have any resources/content yet.
                  </p>
                </div>
              )}

              {lessonsWithContent?.map((skill, skillIndex) => (
                <div key={skillIndex}>
                  <div className='mb-2 font-semibold'>
                    {/* Show lesson index + title */}
                    Lesson {skillIndex + 1}: {skill.lesson?.title}
                  </div>

                  {/* Lesson contents */}
                  {skill?.content?.data?.map((c, cIndex) => {
                    const contentTypeName = contentTypeMap[c.content_type_uuid] || 'file';

                    return (
                      <div
                        key={c.uuid}
                        className='flex items-center justify-between rounded-lg p-3 hover:bg-card'
                      >
                        <div className='flex items-center gap-3'>
                          {getResourceIcon(contentTypeName)}
                          <div>
                            {/* Show content index + title */}
                            <div className='font-medium'>
                              {cIndex + 1}. {c.title}
                            </div>
                            <div className='text-muted-foreground text-sm'>{contentTypeName}</div>
                          </div>
                        </div>

                        <Button variant='outline' size='sm' className='gap-2'>
                          <Eye className='h-3 w-3' />
                          View
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='assignments' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Course Assessments</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              {cAssesssment?.data?.content?.map((assessment, index) => {
                return (
                  <div
                    key={index}
                    className='flex items-center justify-between rounded-lg bg-gray-50 p-3'
                  >
                    <div className='flex items-center gap-3'>
                      <div className='flex min-h-8 min-w-8 items-center justify-center rounded-full bg-blue-100'>
                        <span className='text-sm font-medium text-blue-600'>
                          {assessment?.assessment_type?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className='font-medium'>{assessment.title}</div>
                        <div className='text-muted-foreground text-sm'>
                          {assessment.description}
                        </div>
                      </div>
                    </div>
                    <Badge variant='outline'>{assessment?.assessment_type}</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enrolled Students</CardTitle>
            </CardHeader>

            <CardContent>
              {(!roster || roster.length === 0) ? (
                <div className="py-8 text-center">
                  <Users className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <h3 className="mb-2 font-medium text-gray-900">
                    No students enrolled yet
                  </h3>
                  <p className="text-sm text-gray-600">
                    Share your registration link to start getting enrollments
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Primary Guardian</TableHead>
                        <TableHead>Secondary Guardian</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {roster.map((entry, index) => {
                        // @ts-ignore
                        const student = entry.student?.data;
                        const user = entry.user;

                        return (
                          <TableRow key={index}>
                            {/* NAME */}
                            <TableCell className="font-medium">
                              {user?.full_name || "Unknown Student"}
                            </TableCell>

                            {/* EMAIL */}
                            <TableCell>{user?.email || "--"}</TableCell>

                            {/* PRIMARY GUARDIAN */}
                            <TableCell>
                              {student?.primaryGuardianContact || "--"}
                            </TableCell>

                            {/* SECONDARY GUARDIAN */}
                            <TableCell>
                              {student?.secondaryGuardianContact || "--"}
                            </TableCell>

                            {/* STATUS */}
                            <TableCell>
                              <Badge variant="success">
                                {entry.enrollment?.status || "UNKNOWN"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Registration Link and Sharing */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Link className='h-5 w-5' />
            Registration Link
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex gap-2'>
            <Input value={registrationLink} readOnly className='font-mono text-sm' />
            <Button
              onClick={() => copyToClipboard(registrationLink)}
              variant='outline'
              className='gap-2'
            >
              <Copy className='h-4 w-4' />
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>

          <div className='space-y-3'>
            <h4 className='font-medium'>Share Your Class</h4>
            <div className='flex flex-wrap gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => copyToClipboard(registrationLink)}
                className='gap-2'
              >
                <Copy className='h-4 w-4' />
                Copy Link
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => shareToSocial('facebook')}
                className='gap-2'
              >
                <Facebook className='h-4 w-4' />
                Facebook
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => shareToSocial('twitter')}
                className='gap-2'
              >
                <Twitter className='h-4 w-4' />
                Twitter
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => shareToSocial('linkedin')}
                className='gap-2'
              >
                <Linkedin className='h-4 w-4' />
                LinkedIn
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => shareToSocial('whatsapp')}
                className='gap-2'
              >
                <MessageCircle className='h-4 w-4' />
                WhatsApp
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => shareToSocial('email')}
                className='gap-2'
              >
                <Mail className='h-4 w-4' />
                Email
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
