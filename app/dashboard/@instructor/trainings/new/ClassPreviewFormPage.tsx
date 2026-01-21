
'use client'

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { Calendar, CheckCircle2, Clock, Copy, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getAllDifficultyLevelsOptions } from "../../../../../services/client/@tanstack/react-query.gen";
import { ClassDetails, ScheduleSettings } from "./page";

export const ClassPreviewFormPage = ({
    classDetails,
    classUuid,
    scheduleSettings,
    courseData,
    courseLessons
}: {
    classDetails: ClassDetails;
    classUuid: string;
    scheduleSettings: ScheduleSettings;
    courseData?: any;
    courseLessons?: any[];
}) => {
    const { data: difficulty } = useQuery(getAllDifficultyLevelsOptions());
    const difficultyLevels = difficulty?.data;

    const getDifficultyNameFromUUID = (uuid: string): string | undefined => {
        return difficultyLevels?.find(level => level.uuid === uuid)?.name;
    };

    const registrationLink = courseData?.uuid
        ? `https://elimika.sarafrika.com/dashboard/browse-courses/enroll/${courseData.uuid}`
        : '';
    const [copied, setCopied] = useState(false);

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast.success("Link copied to clipboard!");
        } catch (err) {
            toast.error("Failed to copy link to clipboard");
        }
    };

    const totalHours = (() => {
        if (scheduleSettings.allDay) { return 12; }

        const { startTime, endTime } = scheduleSettings.startClass;

        if (!startTime || !endTime) return 0;

        const [startH, startM] = startTime.split(":").map(Number);
        const [endH, endM] = endTime.split(":").map(Number);

        const start = startH + startM / 60;
        const end = endH + endM / 60;

        const diff = end >= start ? end - start : 24 - start + end;

        return Number(diff.toFixed(2));
    })();

    const ratePerLesson = parseFloat(classDetails.rate_card) * totalHours || 0;
    const lessonsCount = courseLessons?.length || 0;
    const totalFee = ratePerLesson * lessonsCount;

    const handlePublish = () => {
        // Implement publish logic here
        toast.success("Class published successfully!");
    };

    const handleSaveDraft = () => {
        // Implement save draft logic here
        toast.success("Class saved as draft!");
    };

    const formatClassType = (classType: string) => {
        const typeMap: Record<string, string> = {
            'group_inperson_rate': 'In-person Group Class',
            'group_online_rate': 'Online Group Class',
            'private_inperson_rate': 'In-person Private Class',
            'private_online_rate': 'Online Private Class'
        };
        return typeMap[classType] || classType;
    };

    return (
        <div className="max-w-5xl mx-auto px-6">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-foreground mb-2">Review Your Class</h2>
                    <p className="text-muted-foreground">Review all details before publishing your class</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleSaveDraft}
                        size="lg"
                        className="px-6"
                    >
                        Save as Draft
                    </Button>

                    <Button
                        type="button"
                        onClick={handlePublish}
                        size="lg"
                        className="px-8"
                    >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Publish Class
                    </Button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card className="p-5 border shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Duration</p>
                            <p className="text-lg font-semibold text-foreground">{totalHours} hours</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-5 border shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Max Participants</p>
                            <p className="text-lg font-semibold text-foreground">{classDetails.class_limit || courseData?.class_limit || 0}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-5 border shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Lessons</p>
                            <p className="text-lg font-semibold text-foreground">{lessonsCount}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Class Details Card */}
            <Card className="mb-6 overflow-hidden shadow-lg rounded-xl">
                <div className="bg-muted/50 px-6 py-4 border-b">
                    <h3 className="font-semibold text-foreground text-lg">Class Details</h3>
                </div>
                <Table>
                    <TableBody>
                        <TableRow className="border-b hover:bg-transparent">
                            <TableCell className="bg-muted/30 font-semibold w-1/3 py-5">Course Title</TableCell>
                            <TableCell className="bg-card py-5">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">{courseData?.name || classDetails.course_uuid || '-'}</span>
                                    {registrationLink && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyToClipboard(registrationLink)}
                                            className="flex items-center gap-2 text-primary hover:text-primary/80"
                                        >
                                            <Copy className='h-4 w-4' />
                                            {copied ? 'Copied!' : 'Copy link'}
                                        </Button>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                        <TableRow className="border-b hover:bg-transparent">
                            <TableCell className="bg-muted/30 font-semibold py-5">Class Title</TableCell>
                            <TableCell className="bg-card py-5 font-medium">{classDetails.title || '-'}</TableCell>
                        </TableRow>
                        <TableRow className="border-b hover:bg-transparent">
                            <TableCell className="bg-muted/30 font-semibold py-5">Tagline/Categories</TableCell>
                            <TableCell className="bg-card py-5">
                                <div className="flex flex-wrap gap-2">
                                    {(Array.isArray(classDetails.categories)
                                        ? classDetails.categories
                                        : classDetails.categories
                                            ? [classDetails.categories]
                                            : courseData?.category_names || []
                                    ).map((cat: string, idx: number) => (
                                        <span key={idx} className="px-3 py-1 bg-muted rounded-full text-sm font-medium">
                                            {cat}
                                        </span>
                                    ))}
                                </div>
                            </TableCell>
                        </TableRow>
                        <TableRow className="border-b hover:bg-transparent">
                            <TableCell className="bg-muted/30 font-semibold py-5">Target Audience</TableCell>
                            <TableCell className="bg-card py-5 space-y-2">
                                <p className="font-medium">{getDifficultyNameFromUUID(courseData?.difficulty_uuid) || classDetails.targetAudience || '-'}</p>
                                <p className="text-sm text-muted-foreground">
                                    Ages {courseData?.age_lower_limit || '-'} - {courseData?.age_upper_limit || '-'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {classDetails.class_limit || courseData?.class_limit || '-'} max participants
                                </p>
                            </TableCell>
                        </TableRow>
                        <TableRow className="hover:bg-transparent">
                            <TableCell className="bg-muted/30 font-semibold py-5">Class Type</TableCell>
                            <TableCell className="bg-card py-5">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">{formatClassType(classDetails.class_type) || 'Not specified'}</span>
                                    <span className="font-bold text-foreground text-lg">
                                        Ksh {parseFloat(classDetails.rate_card || '0').toLocaleString()}/hr
                                    </span>
                                </div>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </Card>

            {/* Location and Classroom Card */}
            <Card className="mb-6 overflow-hidden shadow-lg rounded-xl">
                <div className="bg-muted/50 px-6 py-4 border-b">
                    <h3 className="font-semibold text-foreground text-lg">Location & Classroom</h3>
                </div>
                <Table>
                    <TableBody>
                        <TableRow className="border-b hover:bg-transparent">
                            <TableCell className="bg-muted/30 font-semibold w-1/3 py-5">Location Type</TableCell>
                            <TableCell className="bg-card py-5 font-medium">
                                {classDetails.location_type ?
                                    classDetails.location_type.charAt(0).toUpperCase() + classDetails.location_type.slice(1).replace('_', ' ')
                                    : '-'}
                            </TableCell>
                        </TableRow>
                        <TableRow className="hover:bg-transparent">
                            <TableCell className="bg-muted/30 font-semibold py-5">Classroom/Meeting Link</TableCell>
                            <TableCell className="bg-card py-5 font-medium">{classDetails.location_name || 'Not specified'}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </Card>

            {/* Schedule Details Card */}
            <Card className="mb-6 overflow-hidden shadow-lg rounded-xl">
                <div className="bg-muted/50 px-6 py-4 border-b">
                    <h3 className="font-semibold text-foreground text-lg">Schedule Details</h3>
                </div>
                <Table>
                    <TableBody>
                        <TableRow className="border-b hover:bg-transparent">
                            <TableCell className="bg-muted/30 font-semibold w-1/3 py-5">Start Date</TableCell>
                            <TableCell className="bg-card py-5 font-medium">
                                {scheduleSettings.startClass.date
                                    ? new Date(scheduleSettings.startClass.date).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })
                                    : '-'}
                            </TableCell>
                        </TableRow>
                        <TableRow className="border-b hover:bg-transparent">
                            <TableCell className="bg-muted/30 font-semibold py-5">Time</TableCell>
                            <TableCell className="bg-card py-5">
                                <div className="flex items-center gap-4">
                                    <p className="font-medium">
                                        {scheduleSettings.allDay
                                            ? 'All Day'
                                            : `${scheduleSettings.startClass.startTime || '-'} - ${scheduleSettings.startClass.endTime || '-'}`}
                                    </p>
                                    <span className="px-3 py-1 bg-muted rounded-full text-sm font-medium">
                                        {totalHours} hours
                                    </span>
                                </div>
                            </TableCell>
                        </TableRow>
                        <TableRow className="border-b hover:bg-transparent">
                            <TableCell className="bg-muted/30 font-semibold py-5">Recurrence</TableCell>
                            <TableCell className="bg-card py-5 font-medium">
                                {scheduleSettings.repeat.unit === "week" && scheduleSettings.repeat.days?.length
                                    ? `Every ${scheduleSettings.repeat.interval} week(s) on ${scheduleSettings.repeat.days.map((d) => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][d]).join(", ")}`
                                    : `Every ${scheduleSettings.repeat.interval} ${scheduleSettings.repeat.unit}(s)`}
                            </TableCell>
                        </TableRow>
                        <TableRow className="hover:bg-transparent">
                            <TableCell className="bg-muted/30 font-semibold py-5">Registration Period</TableCell>
                            <TableCell className="bg-card py-5 font-medium">
                                {scheduleSettings.registrationPeriod.continuous
                                    ? 'Continuous registration'
                                    : scheduleSettings.registrationPeriod.start && scheduleSettings.registrationPeriod.end
                                        ? `${new Date(scheduleSettings.registrationPeriod.start).toLocaleDateString()} - ${new Date(scheduleSettings.registrationPeriod.end).toLocaleDateString()}`
                                        : 'Not set'}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </Card>

            {/* Lessons Order Card */}
            {courseLessons && courseLessons.length > 0 && (
                <Card className="mb-6 overflow-hidden shadow-lg rounded-xl">
                    <div className="bg-muted/50 px-6 py-4 border-b flex justify-between items-center">
                        <h3 className="font-semibold text-foreground text-lg">Lessons Order</h3>
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                            {lessonsCount} lesson{lessonsCount !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow className="border-b bg-muted/30 hover:bg-muted/30">
                                <TableHead className="text-foreground font-semibold py-4">Lesson #</TableHead>
                                <TableHead className="text-foreground font-semibold">Title</TableHead>
                                <TableHead className="text-foreground font-semibold">Duration</TableHead>
                                <TableHead className="text-foreground font-semibold">Sequence</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {courseLessons
                                .slice()
                                .sort((a, b) => Number(a.lesson_sequence || 0) - Number(b.lesson_sequence || 0))
                                .map((lesson, index) => (
                                    <TableRow key={lesson.uuid || index} className="border-b hover:bg-muted/20">
                                        <TableCell className="font-medium py-4">Lesson {lesson.lesson_number || index + 1}</TableCell>
                                        <TableCell className="font-medium">{lesson.title || 'Untitled'}</TableCell>
                                        <TableCell className="text-muted-foreground">{lesson.duration || '-'}</TableCell>
                                        <TableCell className="text-muted-foreground">{lesson.lesson_sequence || index + 1}</TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </Card>
            )}

            {/* Order Total Card */}
            <Card className="overflow-hidden shadow-lg rounded-xl border-2 border-primary/20">
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 px-6 py-6 flex justify-between items-center">
                    <div>
                        <span className="font-bold text-foreground text-lg block mb-2">
                            Estimated Total Fee
                        </span>
                        <span className="text-sm text-muted-foreground">
                            Rate per lesson: Ksh {ratePerLesson.toLocaleString()} × {lessonsCount} lesson{lessonsCount !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-foreground">
                            Ksh {totalFee.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                            Total course fee
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};