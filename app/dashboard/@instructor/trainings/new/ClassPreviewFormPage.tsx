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
import { Copy } from "lucide-react";
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
    };

    const handleSaveDraft = () => {
        // Implement save draft logic here
    };

    // Format class type for display
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
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-2">Review Your Class</h2>
                <p className="text-muted-foreground">Review all details before publishing your class</p>
            </div>

            <div className="flex items-center justify-end gap-3 mb-8">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleSaveDraft}
                >
                    Save as Draft
                </Button>

                <Button
                    type="button"
                    onClick={handlePublish}
                >
                    Publish Class
                </Button>
            </div>

            {/* Class Details Card */}
            <Card className="border-border mb-8 overflow-hidden">
                <Table>
                    <TableBody>
                        <TableRow className="border-b border-border">
                            <TableCell className="bg-muted font-semibold w-1/4">Course Title</TableCell>
                            <TableCell className="bg-card">
                                <div className="flex items-center justify-between">
                                    <span>{courseData?.name || classDetails.course_uuid || '-'}</span>
                                    {registrationLink && (
                                        <button
                                            onClick={() => copyToClipboard(registrationLink)}
                                            className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                                        >
                                            <Copy className='h-4 w-4' />
                                            {copied ? 'Copied!' : 'Copy registration link'}
                                        </button>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                        <TableRow className="border-b border-border">
                            <TableCell className="bg-muted font-semibold">Class Title</TableCell>
                            <TableCell className="bg-card">{classDetails.title || '-'}</TableCell>
                        </TableRow>
                        <TableRow className="border-b border-border">
                            <TableCell className="bg-muted font-semibold">Tagline/Categories</TableCell>
                            <TableCell className="bg-card">
                                {Array.isArray(classDetails.categories)
                                    ? classDetails.categories.join(', ')
                                    : classDetails.categories || courseData?.category_names?.join(', ') || '-'}
                            </TableCell>
                        </TableRow>
                        <TableRow className="border-b border-border">
                            <TableCell className="bg-muted font-semibold">Target Audience</TableCell>
                            <TableCell className="bg-card space-y-1">
                                <p>{getDifficultyNameFromUUID(courseData?.difficulty_uuid) || classDetails.targetAudience || '-'}</p>
                                <p className="text-sm text-muted-foreground">
                                    Ages {courseData?.age_lower_limit || '-'} - {courseData?.age_upper_limit || '-'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {classDetails.class_limit || courseData?.class_limit || '-'} max participants
                                </p>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="bg-muted font-semibold">Class Type</TableCell>
                            <TableCell className="bg-card">
                                <div className="flex justify-between items-center">
                                    <span>{formatClassType(classDetails.class_type) || 'Not specified'}</span>
                                    <span className="font-semibold text-foreground">
                                        Rate/Hr -  Ksh {parseFloat(classDetails.rate_card || '0').toLocaleString()}
                                    </span>
                                </div>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </Card>

            {/* Location and Classroom Card */}
            <Card className="border-border mb-8 overflow-hidden">
                <Table>
                    <TableBody>
                        <TableRow className="border-b border-border">
                            <TableCell className="bg-muted font-semibold w-1/4">Location Type</TableCell>
                            <TableCell className="bg-card">
                                {classDetails.location_type ?
                                    classDetails.location_type.charAt(0).toUpperCase() + classDetails.location_type.slice(1).replace('_', ' ')
                                    : '-'}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="bg-muted font-semibold">Classroom/Meeting Link</TableCell>
                            <TableCell className="bg-card">{classDetails.location_name || 'Not specified'}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </Card>

            {/* Schedule Details Card */}
            <Card className="border-border mb-8 overflow-hidden">
                <div className="bg-muted p-4 border-b border-border">
                    <span className="font-semibold text-foreground">Schedule Details</span>
                </div>
                <Table>
                    <TableBody>
                        <TableRow className="border-b border-border">
                            <TableCell className="bg-muted font-semibold w-1/4">Start Date</TableCell>
                            <TableCell className="bg-card">
                                {scheduleSettings.startClass.date
                                    ? new Date(scheduleSettings.startClass.date).toLocaleDateString()
                                    : '-'}
                            </TableCell>
                        </TableRow>
                        <TableRow className="border-b border-border">
                            <TableCell className="bg-muted font-semibold">Time</TableCell>
                            <TableCell className="bg-card flex flex-row items-center gap-4">
                                <p>
                                    {scheduleSettings.allDay
                                        ? 'All Day'
                                        : `${scheduleSettings.startClass.startTime || '-'} - ${scheduleSettings.startClass.endTime || '-'}`}
                                </p>
                                <p>
                                    ({totalHours} hours)
                                </p>
                            </TableCell>
                        </TableRow>
                        <TableRow className="border-b border-border">
                            <TableCell className="bg-muted font-semibold">Recurrence</TableCell>
                            <TableCell className="bg-card">
                                {scheduleSettings.repeat.unit === "week" && scheduleSettings.repeat.days?.length
                                    ? `Every ${scheduleSettings.repeat.interval} week(s) on ${scheduleSettings.repeat.days.map((d) => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][d]).join(", ")}`
                                    : `Every ${scheduleSettings.repeat.interval} ${scheduleSettings.repeat.unit}(s)`}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="bg-muted font-semibold">Registration Period</TableCell>
                            <TableCell className="bg-card">
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
                <Card className="border-border mb-8 overflow-hidden">
                    <div className="bg-muted p-4 border-b border-border flex justify-between items-center">
                        <span className="font-semibold text-foreground">Lessons Order</span>
                        <span className="text-sm text-muted-foreground">
                            {lessonsCount} lesson{lessonsCount !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-border bg-card hover:bg-card">
                                <TableHead className="text-foreground">Lesson #</TableHead>
                                <TableHead className="text-foreground">Title</TableHead>
                                <TableHead className="text-foreground">Duration</TableHead>
                                <TableHead className="text-foreground">Sequence</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {courseLessons
                                .slice()
                                .sort((a, b) => Number(a.lesson_sequence || 0) - Number(b.lesson_sequence || 0))
                                .map((lesson, index) => (
                                    <TableRow key={lesson.uuid || index} className="border-b border-border hover:bg-muted/30">
                                        <TableCell>Lesson {lesson.lesson_number || index + 1}</TableCell>
                                        <TableCell>{lesson.title || 'Untitled'}</TableCell>
                                        <TableCell>{lesson.duration || '-'}</TableCell>
                                        <TableCell>{lesson.lesson_sequence || index + 1}</TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </Card>
            )}

            {/* Order Total Card */}
            <Card className="border-border overflow-hidden">
                <div className="bg-muted p-4 flex justify-between items-center">
                    <div>
                        <span className="font-semibold text-foreground block mb-1">
                            Estimated Total Fee
                        </span>
                        <span className="text-sm text-muted-foreground">
                            Rate per lesson: Ksh {ratePerLesson.toLocaleString()} × {lessonsCount} lesson{lessonsCount !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <span className="font-bold text-lg text-foreground">
                        Ksh {totalFee.toLocaleString()}
                    </span>
                </div>
            </Card>
        </div>
    );
};