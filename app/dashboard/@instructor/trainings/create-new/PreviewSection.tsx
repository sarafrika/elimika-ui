'use client';

import { Card } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Calendar, Clock, Users } from "lucide-react";
import { useMemo } from "react";
import { ClassDetails, ScheduleSettings } from "./page";

export const PreviewSection = ({
    classDetails,
    scheduleSettings,
    courseData,
    courseLessons,
    occurrenceCount
}: {
    classDetails: ClassDetails;
    scheduleSettings: ScheduleSettings;
    courseData?: any;
    courseLessons?: any[];
    occurrenceCount: number;
}) => {

    const totalHours = useMemo(() => {
        if (scheduleSettings.allDay) return 12;

        const { startTime, endTime } = scheduleSettings.startClass;
        if (!startTime || !endTime) return 0;

        const [startH, startM] = startTime.split(":").map(Number);
        const [endH, endM] = endTime.split(":").map(Number);

        // @ts-ignore
        const start = startH + startM / 60;
        // @ts-ignore
        const end = endH + endM / 60;
        const diff = end >= start ? end - start : 24 - start + end;

        return Number(diff.toFixed(2));
    }, [scheduleSettings]);

    const ratePerLesson = parseFloat(classDetails.rate_card || '0') * totalHours || 0;
    const lessonsCount = courseLessons?.length || 0;
    const totalFee = ratePerLesson * lessonsCount;

    return (
        <Card className="overflow-hidden shadow-sm border">
            <div className="bg-muted/50 px-6 py-4 border-b">
                <h3 className="font-semibold text-foreground text-lg">Preview</h3>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 border-b">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="text-lg font-semibold text-foreground">{totalHours} hours</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Max Participants</p>
                        <p className="text-lg font-semibold text-foreground">{classDetails.class_limit || 0}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Occurrences</p>
                        <p className="text-lg font-semibold text-foreground">{occurrenceCount}</p>
                    </div>
                </div>
            </div>

            {/* Details */}
            <Table>
                <TableBody>
                    <TableRow className="hover:bg-transparent">
                        <TableCell className="bg-muted/30 font-semibold w-1/3 py-4">Course</TableCell>
                        <TableCell className="bg-card py-4">{courseData?.name || classDetails.course_uuid}</TableCell>
                    </TableRow>

                    <TableRow className="hover:bg-transparent">
                        <TableCell className="bg-muted/30 font-semibold py-4">Title</TableCell>
                        <TableCell className="bg-card py-4">{classDetails.title}</TableCell>
                    </TableRow>

                    <TableRow className="hover:bg-transparent">
                        <TableCell className="bg-muted/30 font-semibold py-4">Type</TableCell>
                        <TableCell className="bg-card py-4">{classDetails.class_type}</TableCell>
                    </TableRow>

                    <TableRow className="hover:bg-transparent">
                        <TableCell className="bg-muted/30 font-semibold py-4">Start Date</TableCell>
                        <TableCell className="bg-card py-4">
                            {scheduleSettings.startClass.date
                                ? new Date(scheduleSettings.startClass.date).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })
                                : '—'}
                        </TableCell>
                    </TableRow>

                    <TableRow className="hover:bg-transparent">
                        <TableCell className="bg-muted/30 font-semibold py-4">Time</TableCell>
                        <TableCell className="bg-card py-4">
                            {scheduleSettings.allDay
                                ? 'All Day'
                                : `${scheduleSettings.startClass.startTime || '—'} - ${scheduleSettings.startClass.endTime || '—'}`}
                        </TableCell>
                    </TableRow>

                    <TableRow className="hover:bg-transparent">
                        <TableCell className="bg-muted/30 font-semibold py-4">Total Fee</TableCell>
                        <TableCell className="bg-card py-4 font-bold text-primary">
                            KES {totalFee.toLocaleString()}
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>

            {/* Lessons */}
            {courseLessons && courseLessons.length > 0 && (
                <div className="border-t">
                    <div className="bg-muted/50 px-6 py-3">
                        <h4 className="font-semibold text-foreground">Lessons ({lessonsCount})</h4>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                                <TableHead className="text-foreground font-semibold">Lesson</TableHead>
                                <TableHead className="text-foreground font-semibold">Title</TableHead>
                                <TableHead className="text-foreground font-semibold">Sequence</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {courseLessons
                                .slice()
                                .sort((a, b) => Number(a.lesson_sequence || 0) - Number(b.lesson_sequence || 0))
                                .map((lesson, index) => (
                                    <TableRow key={lesson.uuid || index}>
                                        <TableCell>Lesson {lesson.lesson_number || index + 1}</TableCell>
                                        <TableCell>{lesson.title || 'Untitled'}</TableCell>
                                        <TableCell>{lesson.lesson_sequence || index + 1}</TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </Card>
    );
};