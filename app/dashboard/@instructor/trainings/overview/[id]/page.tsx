'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import {
    getClassDefinitionOptions,
    getCourseAssessmentsOptions,
    getCourseByUuidOptions
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, CalendarDays, CheckCircle, Clock, Copy, DollarSign, Edit, Eye, Facebook, FileQuestion, FileText, Link, Linkedin, Mail, MapPin, MessageCircle, Twitter, Users } from 'lucide-react';
import moment from 'moment';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import RichTextRenderer from '../../../../../../components/editors/richTextRenders';
import { Skeleton } from '../../../../../../components/ui/skeleton';
import Spinner from '../../../../../../components/ui/spinner';
import { useCourseLessonsWithContent } from '../../../../../../hooks/use-courselessonwithcontent';
import { useInstructorInfo } from '../../../../../../hooks/use-instructor-info';
import { getResourceIcon } from '../../../../../../lib/resources-icon';

const localizer = momentLocalizer(moment);

export default function ClassPreviewPage() {
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

    const { data } = useQuery({
        ...getClassDefinitionOptions({ path: { uuid: classId as string } }),
        enabled: !!classId,
    });
    const classData = data?.data;

    const { data: courseDetail, isLoading, isError } = useQuery({
        ...getCourseByUuidOptions({ path: { uuid: classData?.course_uuid as string } }),
        enabled: !!classData?.course_uuid,
    })
    const course = courseDetail?.data

    const { data: cAssesssment } = useQuery({
        ...getCourseAssessmentsOptions({ path: { courseUuid: classData?.course_uuid as string }, query: { pageable: {} } }),
        enabled: !!classData?.course_uuid
    })
    const { instructorInfo } = useInstructorInfo({ instructorUuid: classData?.default_instructor_uuid as string });
    // @ts-ignore
    const instructor = instructorInfo?.data


    const {
        isLoading: isAllLessonsDataLoading,
        lessons: lessonsWithContent,
        contentTypeMap,
    } = useCourseLessonsWithContent({ courseUuid: classData?.course_uuid as string });


    const [registrationLink] = useState(`https://elimika.sarafrika.com/trainings/${classData?.uuid}/register`);
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

    // const formatDate = (date: Date) => {
    //     return format(date, 'MMM dd, yyyy');
    // };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) { }
    };

    const shareToSocial = (platform: string) => {
        const url = encodeURIComponent(registrationLink);
        const text = encodeURIComponent(`Check out this class: ${classData?.title}`);

        const urls = {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
            twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
            whatsapp: `https://wa.me/?text=${text}%20${url}`,
            email: `mailto:?subject=${encodeURIComponent(classData?.title as string)}&body=${text}%20${url}`
        };

        if (urls[platform as keyof typeof urls]) {
            window.open(urls[platform as keyof typeof urls], '_blank', 'width=600,height=400');
        }
    };

    if (isLoading) {
        return (
            <div className='space-y-2'>
                <Skeleton className='h-4 w-2/3' />
                <Skeleton className='h-4 w-1/2' />
                <Skeleton className='h-4 w-1/4' />
            </div>
        )
    }

    return (
        <div className="space-y-6 mb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold">Published Class</h1>
                        <p className="text-muted-foreground">Your class is now live and ready for students</p>
                    </div>
                </div>
                <Button onClick={() => { }} variant="outline" className="gap-2">
                    <Edit className="w-4 h-4" />
                    Edit Class
                </Button>
            </div>

            {/* Status Banner */}
            <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <div>
                            <h3 className="font-semibold text-green-800">Class Published Successfully!</h3>
                            <p className="text-green-700 text-sm">
                                Your class is now live and students can enroll. Share the registration link to start getting enrollments.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Class Preview Card */}
            <Card className="border-2">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <CardTitle className="text-xl">{classData?.title}</CardTitle>
                            {classData?.description && (
                                <div className='text-muted-foreground mt-1'>
                                    <RichTextRenderer maxChars={100} htmlString={classData?.description as string} />
                                </div>
                            )}
                            <Badge className="mt-2 bg-green-100 text-green-800 border-green-200">
                                Published/Draft
                            </Badge>
                        </div>
                        <Image
                            src={""}
                            alt="Class cover"
                            className="w-32 h-20 object-cover rounded-lg bg-gray-300"
                            width={32}
                            height={20}
                        />
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
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <CalendarDays className="w-4 h-4 text-muted-foreground" />
                            <div>
                                <div className="font-medium">{classData?.default_start_time as string}</div>
                                <div className="text-muted-foreground">Start Date</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <div>
                                <div className="font-medium">{instructor?.full_name}</div>
                                <div className="text-muted-foreground">Instructor</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <div>
                                <div className="font-medium">{classData?.duration_formatted}</div>
                                <div className="text-muted-foreground">Total Hours</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-muted-foreground" />
                            <div>
                                <div className="font-medium">totalLessons - 8</div>
                                <div className="text-muted-foreground">Lessons</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <div>
                                <div className="font-medium">{totalAssignments}</div>
                                <div className="text-muted-foreground">Assignments/Quizes</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {classData?.location_type && (
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                <span>{classData?.location_type}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">
                                {`${totalFee.toFixed(2)}`}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span>0 / {classData?.max_participants} students</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {course?.category_names?.map((category: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
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
            <Tabs defaultValue="details" className="space-y-4">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="details">Class Details</TabsTrigger>
                    <TabsTrigger value="schedule">Schedule</TabsTrigger>
                    <TabsTrigger value="skills">Skills</TabsTrigger>
                    <TabsTrigger value="assignments">Assignments</TabsTrigger>
                    <TabsTrigger value="students">Students</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Class Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                            {classData?.default_start_time as string} - {classData?.default_end_time as string}
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
                                <span className="text-sm text-muted-foreground">Description:</span>
                                <div className='mt-1'>
                                    <RichTextRenderer maxChars={100} htmlString={classData?.description as string} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="schedule" className="space-y-4">
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
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="skills" className="space-y-4">
                    <Card>
                        <CardContent className="p-4 space-y-3">
                            {isAllLessonsDataLoading && <Spinner />}

                            {lessonsWithContent?.length === 0 && (
                                <div className="flex flex-col items-center justify-center p-6 rounded-lg text-center text-muted-foreground">
                                    <FileQuestion className="w-8 h-8 mb-3 text-gray-400" />
                                    <h4 className="text-sm font-medium">No Class Resources</h4>
                                    <p className="text-sm text-gray-500">This class doesn&apos;t have any resources/content yet.</p>
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
                                                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                                            >
                                                <div className="flex gap-3 items-center">
                                                    {getResourceIcon(contentTypeName)}
                                                    <div>
                                                        {/* Show content index + title */}
                                                        <div className="font-medium">
                                                            {cIndex + 1}. {c.title}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">{contentTypeName}</div>
                                                    </div>
                                                </div>

                                                <Button variant="outline" size="sm" className="gap-2">
                                                    <Eye className="w-3 h-3" />
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

                <TabsContent value="assignments" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Course Assessments</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {cAssesssment?.data?.content?.map((assessment, index) => {
                                return (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="min-w-8 min-h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                <span className="text-blue-600 text-sm font-medium">
                                                    {assessment?.assessment_type?.charAt(0)}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="font-medium">{assessment.title}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {assessment.description}
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant="outline">
                                            {assessment?.assessment_type}
                                        </Badge>
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
                            <div className="text-center py-8">
                                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="font-medium text-gray-900 mb-2">No students enrolled yet</h3>
                                <p className="text-gray-600 text-sm">
                                    Share your registration link to start getting enrollments
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>


            {/* Registration Link and Sharing */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Link className="w-5 h-5" />
                        Registration Link
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            value={registrationLink}
                            readOnly
                            className="font-mono text-sm"
                        />
                        <Button
                            onClick={() => copyToClipboard(registrationLink)}
                            variant="outline"
                            className="gap-2"
                        >
                            <Copy className="w-4 h-4" />
                            {copied ? 'Copied!' : 'Copy'}
                        </Button>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-medium">Share Your Class</h4>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(registrationLink)}
                                className="gap-2"
                            >
                                <Copy className="w-4 h-4" />
                                Copy Link
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => shareToSocial('facebook')}
                                className="gap-2"
                            >
                                <Facebook className="w-4 h-4" />
                                Facebook
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => shareToSocial('twitter')}
                                className="gap-2"
                            >
                                <Twitter className="w-4 h-4" />
                                Twitter
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => shareToSocial('linkedin')}
                                className="gap-2"
                            >
                                <Linkedin className="w-4 h-4" />
                                LinkedIn
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => shareToSocial('whatsapp')}
                                className="gap-2"
                            >
                                <MessageCircle className="w-4 h-4" />
                                WhatsApp
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => shareToSocial('email')}
                                className="gap-2"
                            >
                                <Mail className="w-4 h-4" />
                                Email
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
