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
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useClassRoster } from '@/hooks/use-class-roster';
import { useCourseLessonsWithContent } from '@/hooks/use-courselessonwithcontent';
import { useInstructorInfo } from '@/hooks/use-instructor-info';
import { getResourceIcon } from '@/lib/resources-icon';
import {
  getCourseAssessmentsOptions
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  BookOpen,
  CalendarDays,
  CheckCircle,
  Clock,
  Copy,
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
  Users
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useClassDetails } from '../../../../../../hooks/use-class-details';
import { useScheduleStats } from '../../../../../../hooks/use-schedule-stats';
import { AudioPlayer } from '../../../../@student/schedule/classes/[id]/AudioPlayer';
import { ReadingMode } from '../../../../@student/schedule/classes/[id]/ReadingMode';
import { ClassScheduleCalendar } from '../../../../@student/schedule/classes/[id]/SudentClassSchedule';
import { VideoPlayer } from '../../../../@student/schedule/classes/[id]/VideoPlayer';

interface ContentItem {
  uuid: string;
  title: string;
  content_type_uuid: string;
  content_text?: string;
  description?: string;
}

type SharePlatform =
  | "facebook"
  | "twitter"
  | "linkedin"
  | "whatsapp"
  | "email";

type ShareOptions = {
  title?: string;
  links: string[];
};

export default function ClassPreviewPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params?.id as string;
  const { replaceBreadcrumbs } = useBreadcrumb();

  // State for video player and reading mode
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const [selectedLesson, setSelectedLesson] = useState<ContentItem | null>(null);
  const [contentTypeName, setContentTypeName] = useState<string>('');

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


  const { data: combinedClass, isLoading: classIsLoading } = useClassDetails(classId as string);
  const classData = combinedClass?.class;
  const course = combinedClass?.course;
  const schedules = combinedClass?.schedule;
  const scheduleStats = useScheduleStats(schedules as any);
  const totalAmount = classData?.training_fee! * scheduleStats?.totalHours as number
  const amountPayable = totalAmount

  // Format dates
  const { formattedStart, formattedEnd } = useMemo(() => {
    if (!classData) {
      return { formattedStart: '', formattedEnd: '' };
    }

    try {
      const start = classData?.default_start_time
        ? new Date(classData.default_start_time)
        : null;
      const end = classData?.default_end_time
        ? new Date(classData.default_end_time)
        : null;

      return {
        formattedStart: start ? format(start, 'MMM dd, yyyy • hh:mm a') : 'N/A',
        formattedEnd: end ? format(end, 'MMM dd, yyyy • hh:mm a') : 'N/A',
      };
    } catch (e) {
      return { formattedStart: 'N/A', formattedEnd: 'N/A' };
    }
  }, [classData]);

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

  const registrationLink = typeof window !== 'undefined'
    ? `${window.location.origin}/dashboard/browse-courses/available-classes/${course?.uuid}/enroll?id=${classId}`
    : '';

  const inviteLink =
    typeof window !== 'undefined' ? `${window.location.origin}/class-invite?id=${classId}` : '';

  const [copied, setCopied] = useState(false);

  // const totalLessons = classData.schedule.skills.reduce((acc, skill) => acc + skill.lessons.length, 0);
  // const totalHours = classData.schedule.skills.reduce((total, skill) => {
  //     return total + skill.lessons.reduce((skillTotal, lesson) => {
  //         return skillTotal + (parseInt(lesson.duration) || 0);
  //     }, 0);
  // }, 0) / 60;

  // const totalFee = classData?.visibility.isFree ? 0 : classData.visibility.price * totalLessons;
  const totalAssignments = cAssesssment?.data?.content?.length || 0;

  const copyLink = async (
    text: string,
    setCopied?: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      if (setCopied) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  const shareToSocial = (
    platform: SharePlatform,
    { title, links }: ShareOptions
  ) => {
    const joinedLinks = links.join("\n");
    const encodedLinks = encodeURIComponent(joinedLinks);
    const encodedText = encodeURIComponent(
      title ? `Check out this class: ${title}` : "Check this out"
    );

    const urls: Record<SharePlatform, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedLinks}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedLinks}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedLinks}`,
      whatsapp: `https://wa.me/?text=${encodedText}%0A${encodedLinks}`,
      email: `mailto:?subject=${encodeURIComponent(
        title ?? "Shared Links"
      )}&body=${encodedText}%0A${encodedLinks}`,
    };

    window.open(urls[platform], "_blank", "width=600,height=400");
  };

  const { roster } = useClassRoster(classId);

  // Handle viewing content
  const handleViewContent = (content: ContentItem, contentType: string) => {
    setSelectedLesson(content);
    setContentTypeName(contentType);

    if (contentType === 'video') {
      setIsPlaying(true);
    } else if (contentType === 'pdf' || contentType === 'text') {
      setIsReading(true);
    } else if (contentType === 'audio') {
      setIsAudioPlaying(true);
    }
  };


  if (isAllLessonsDataLoading || classIsLoading) {
    return (
      <div className="flex flex-col gap-6 space-y-2">
        <Skeleton className="h-[150px] w-full" />

        <div className="flex flex-row items-center justify-between gap-4">
          <Skeleton className="h-[250px] w-2/3" />
          <Skeleton className="h-[250px] w-1/3" />
        </div>

        <Skeleton className="h-[100px] w-full" />
      </div>
    );
  }

  return (
    <div className="mb-20 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            {classData?.is_active ? (
              <>
                <h1 className="text-2xl font-semibold text-success">Active Class</h1>
                <p className="text-muted-foreground">
                  Your class is live and accepting new students.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-semibold text-foreground">Inactive Class</h1>
                <p className="text-muted-foreground">
                  This class is currently not active. Activate it to allow student enrollment.
                </p>
              </>
            )}
          </div>
        </div>

        <Button
          onClick={() => router.push(`/dashboard/trainings/create-new?id=${classData?.uuid}`)}
          variant="outline"
          className="gap-2"
        >
          <Edit className="h-4 w-4" />
          Edit Class
        </Button>
      </div>

      {/* Status Banner */}
      <div>
        {classData?.is_active ? (
          <Card className="border-success/30 bg-success/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-success" />
                <div>
                  <h3 className="font-semibold text-success">Class Published Successfully!</h3>
                  <p className="text-sm text-success">
                    Your class is now live and students can enroll. Share the registration link
                    to start getting enrollments.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-warning/40 bg-warning/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-warning"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01M21 12A9 9 0 1112 3a9 9 0 019 9z"
                  />
                </svg>
                <div>
                  <h3 className="font-semibold text-warning">Class is Currently Inactive</h3>
                  <p className="text-sm text-warning">
                    Students cannot enroll in this class until it's activated. You can activate
                    it from your dashboard.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Class Preview Card */}
      <Card className="border-2">
        <CardHeader>
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">
                  {classData?.title}
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  {course?.category_names?.map((category: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                </div>
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

            {classData?.description && (
              <div className="text-muted-foreground">
                <RichTextRenderer
                  maxChars={100}
                  htmlString={classData?.description as string}
                />
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Primary Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-xs">Instructor</span>
              </div>
              <div className="font-medium">{instructor?.full_name}</div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-xs">Duration  ({classData?.duration_formatted}/class)</span>
              </div>
              <div className="font-medium">{scheduleStats?.totalHours}</div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                <span className="text-xs">Lessons</span>
              </div>
              <div className="font-medium">{lessonsWithContent?.length}</div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span className="text-xs">Assignments/Quizzes</span>
              </div>
              <div className="font-medium">{totalAssignments}</div>
            </div>
          </div>

          {/* Secondary Info */}
          <div className="flex flex-wrap items-center gap-6 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Start Date</span>
              <span className="font-medium">{formattedStart}</span>
            </div>

            {classData?.location_type && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{classData?.location_type}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">KES {amountPayable.toFixed(2)}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {roster?.length} / {classData?.max_participants} students
              </span>
            </div>
          </div>

          {/* {classData.targetAudience.map((audience, index) => (
      <Badge key={index} variant="outline">{audience}</Badge>
    ))} */}
        </CardContent>
      </Card>

      {/* Class Management Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Class Details</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Class Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-muted-foreground">Course:</span>
                    <div className="font-medium">{course?.name}</div>
                  </div>

                  <div>
                    <span className="text-sm text-muted-foreground">Target Audience:</span>
                    {/* <div className="font-medium">{classData.targetAudience.join(', ')}</div> */}
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-muted-foreground">Academic Period:</span>
                    <div className="font-medium">
                      {/* {classData?.default_start_time as string} -{' '}
                                            {classData?.default_end_time as string} */}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Class Type:</span>
                    <div className="font-medium capitalize">{classData?.location_type}</div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Visibility:</span>
                    {/* <div className="flex items-center gap-2 font-medium">
                                            {classData.visibility.publicity === 'public' ? (
                                                <Globe className="w-4 h-4 text-success" />
                                            ) : (
                                                <Globe className="w-4 h-4 text-primary" />
                                            )}
                                            <span className="capitalize">{classData.visibility.publicity}</span>
                                        </div> */}
                  </div>
                </div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Description:</span>
                <div className="mt-1">
                  <RichTextRenderer
                    maxChars={100}
                    htmlString={classData?.description as string}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <CardContent>
            <ClassScheduleCalendar schedules={schedules as any} />
          </CardContent>
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardContent className="space-y-3 p-4">
              {isAllLessonsDataLoading && <Spinner />}

              {lessonsWithContent?.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-lg bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                  <FileQuestion className="mb-3 h-8 w-8 text-muted-foreground" />
                  <h4 className="font-medium">No Class Resources</h4>
                  <p>This class doesn&apos;t have any resources/content yet.</p>
                </div>
              )}

              {lessonsWithContent?.map((skill, skillIndex) => (
                <div key={skillIndex}>
                  <div className="mb-2 font-semibold">
                    {/* Show lesson index + title */}
                    Lesson {skillIndex + 1}: {skill.lesson?.title}
                  </div>

                  {/* Lesson contents */}
                  {skill?.content?.data?.map((c, cIndex) => {
                    const contentTypeName = contentTypeMap[c.content_type_uuid] || 'file';

                    return (
                      <div
                        key={c.uuid}
                        className="flex items-center justify-between rounded-lg p-3 hover:bg-card"
                      >
                        <div className="flex items-center gap-3">
                          {getResourceIcon(contentTypeName)}
                          <div>
                            {/* Show content index + title */}
                            <div className="font-medium">
                              {cIndex + 1}. {c.title}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {contentTypeName}
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleViewContent(c, contentTypeName)}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          <Eye className="h-3 w-3" />
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

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enrolled Students</CardTitle>
            </CardHeader>

            <CardContent>
              {!roster || roster.length === 0 ? (
                <div className="py-8 text-center">
                  <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 font-medium text-foreground">
                    No students enrolled yet
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Share your registration link to start getting enrollments
                  </p>
                </div>
              ) : (
                <div className="rounded-md border border-border">
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
                              {user?.full_name || 'Unknown Student'}
                            </TableCell>

                            {/* EMAIL */}
                            <TableCell>{user?.email || '--'}</TableCell>

                            {/* PRIMARY GUARDIAN */}
                            <TableCell>{student?.primaryGuardianContact || '--'}</TableCell>

                            {/* SECONDARY GUARDIAN */}
                            <TableCell>
                              {student?.secondaryGuardianContact || '--'}
                            </TableCell>

                            {/* STATUS */}
                            <TableCell>
                              <Badge variant="success">
                                {entry.enrollment?.status || 'UNKNOWN'}
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
        <CardHeader className='gap-4' >
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Registration Link
          </CardTitle>
          <div className="flex gap-2">
            <Input value={registrationLink} readOnly className="font-mono text-sm" />
            <Button
              onClick={() => copyLink(registrationLink, setCopied)}
              variant="outline"
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </CardHeader>

        <CardHeader className='gap-4' >
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Class Invite Link
          </CardTitle>
          <div className="flex gap-2">
            <Input value={inviteLink} readOnly className="font-mono text-sm" />
            <Button
              onClick={() => copyLink(inviteLink, setCopied)}
              variant="outline"
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 px-6">
          <div className="space-y-3">
            <h4 className="font-medium">Share Your Class</h4>
            <div className="flex flex-wrap gap-2">

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  shareToSocial("facebook", {
                    title: classData?.title,
                    links: [registrationLink, inviteLink],
                  })
                }
                className="gap-2"
              >
                <Facebook className="h-4 w-4" />
                Facebook
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  shareToSocial("twitter", {
                    title: classData?.title,
                    links: [registrationLink, inviteLink],
                  })
                }
                className="gap-2"
              >
                <Twitter className="h-4 w-4" />
                Twitter
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  shareToSocial("linkedin", {
                    title: classData?.title,
                    links: [registrationLink, inviteLink],
                  })
                }
                className="gap-2"
              >
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  shareToSocial("whatsapp", {
                    title: classData?.title,
                    links: [registrationLink, inviteLink],
                  })
                }
                className="gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  shareToSocial("email", {
                    title: classData?.title,
                    links: [registrationLink, inviteLink],
                  })
                }
                className="gap-2"
              >
                <Mail className="h-4 w-4" />
                Email
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Player Modal */}
      <VideoPlayer
        isOpen={isPlaying && contentTypeName === 'video'}
        onClose={() => setIsPlaying(false)}
        videoUrl={selectedLesson?.content_text || ''}
        title={selectedLesson?.title}
      />

      {/* Reading Mode Modal */}
      <ReadingMode
        isOpen={isReading && (contentTypeName === 'pdf' || contentTypeName === 'text')}
        onClose={() => setIsReading(false)}
        title={selectedLesson?.title || ''}
        description={selectedLesson?.description}
        content={selectedLesson?.content_text || ''}
        contentType={contentTypeName as 'text' | 'pdf'}
      />

      <AudioPlayer
        isOpen={isAudioPlaying && contentTypeName === 'audio'}
        onClose={() => setIsAudioPlaying(false)}
        audioUrl={selectedLesson?.content_text || ''}
        title={selectedLesson?.title}
        description={selectedLesson?.description}
      />
    </div>
  );
}