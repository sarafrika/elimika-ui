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
import { Copy, Trash2 } from "lucide-react";
import { useState } from "react";
import { getAllDifficultyLevelsOptions, getClassDefinitionOptions, getCourseByUuidOptions, getCourseLessonsOptions } from "../../../../../services/client/@tanstack/react-query.gen";
import { ClassDetails, ScheduleSettings } from "./page";

interface Lesson {
    id: number;
    duration: string;
    date: string;
    time: string;
}

export const ClassPreviewFormPage = ({
    classDetails,
    classUuid,
    scheduleSettings
}: {
    classDetails: ClassDetails;
    classUuid: string
    scheduleSettings: ScheduleSettings;
}) => {
    const [lessons, setLessons] = useState<Lesson[]>(
        Array.from({ length: 12 }, (_, i) => ({
            id: i + 1,
            duration: '1h',
            date: 'Dates',
            time: 'Time'
        }))
    );

    const { data: difficulty } = useQuery(getAllDifficultyLevelsOptions());
    const difficultyLevels = difficulty?.data;

    const getDifficultyNameFromUUID = (uuid: string): string | undefined => {
        return difficultyLevels?.find(level => level.uuid === uuid)?.name;
    };

    const { data } = useQuery({
        ...getClassDefinitionOptions({ path: { uuid: classUuid } }),
        enabled: !!classUuid
    })
    const classData = data?.data

    const {
        data: courseDetail,
    } = useQuery({
        ...getCourseByUuidOptions({ path: { uuid: classData?.course_uuid as string } }),
        enabled: !!classData?.course_uuid,
    });
    const course = courseDetail?.data;

    const { data: courseLessons } = useQuery({
        ...getCourseLessonsOptions({ path: { courseUuid: classData?.course_uuid as string }, query: { pageable: {} } }),
        enabled: !!classData?.course_uuid
    })

    const registrationLink = course?.uuid
        ? `https://elimika.sarafrika.com/dashboard/browse-courses/enroll/${course.uuid}`
        : '';
    const [copied, setCopied] = useState(false);

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (_err) { }
    };

    const ratePerLesson = 500;
    const totalFee = ratePerLesson * lessons.length;

    const addLesson = () => {
        setLessons([...lessons, {
            id: lessons.length + 1,
            duration: '1h',
            date: 'Dates',
            time: 'Time'
        }]);
    };

    const deleteLesson = (id: number) => {
        setLessons(lessons.filter(lesson => lesson.id !== id));
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
                    onClick={() => console.log("Save as Draft")}
                >
                    Save as Draft
                </Button>

                <Button
                    type="button"
                    onClick={() => console.log("Publish")}
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
                                    <span>{course?.name || '-'}</span>
                                    <button
                                        onClick={() => copyToClipboard(registrationLink)}
                                        className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                                    >
                                        <Copy className='h-4 w-4' />
                                        {copied ? 'Copied!' : 'Copy registration link'}
                                    </button>
                                </div>
                            </TableCell>
                        </TableRow>
                        <TableRow className="border-b border-border">
                            <TableCell className="bg-muted font-semibold">Class Title</TableCell>
                            <TableCell className="bg-card">{classData?.title || '-'}</TableCell>
                        </TableRow>
                        <TableRow className="border-b border-border">
                            <TableCell className="bg-muted font-semibold">Tagline</TableCell>
                            <TableCell className="bg-card">{course?.category_names || '-'}</TableCell>
                        </TableRow>
                        <TableRow className="border-b border-border">
                            <TableCell className="bg-muted font-semibold">Target Audience</TableCell>
                            <TableCell className="bg-card space-y-1">
                                <p>{getDifficultyNameFromUUID(course?.difficulty_uuid as string)}</p>
                                <p className="text-sm text-muted-foreground">Ages {course?.age_lower_limit} - {course?.age_upper_limit}</p>
                                <p className="text-sm text-muted-foreground">{course?.class_limit} max participants</p>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="bg-muted font-semibold">Class Type</TableCell>
                            <TableCell className="bg-card">
                                <div className="flex justify-between items-center">
                                    <span className="italic">{classData?.location_type || '(Online Group Class | Online Private Class | In-person group class | In person Private Class)'}</span>
                                    <span className="font-semibold text-foreground">{classData?.training_fee} (Ksh)</span>
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
                            <TableCell className="bg-muted font-semibold w-1/4">Location</TableCell>
                            <TableCell className="bg-card italic">{classData?.location_name || '(Type /Pindrop)'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="bg-muted font-semibold">Classroom</TableCell>
                            <TableCell className="bg-card italic">(Insert) / Meeting link</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </Card>

            {/* Lessons Order Card */}
            <Card className="border-border mb-8 overflow-hidden">
                <div className="bg-muted p-4 border-b border-border flex justify-between items-center">
                    <span className="font-semibold text-foreground">Lessons Order</span>
                    <span className="text-sm text-muted-foreground">{courseLessons?.data?.content?.length} half hour lessons</span>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow className="border-b border-border bg-card hover:bg-card">
                            <TableHead className="text-foreground">Lesson #</TableHead>
                            <TableHead className="text-foreground">Duration</TableHead>
                            <TableHead className="text-foreground">Pick Dates</TableHead>
                            <TableHead className="text-foreground">Pick Time</TableHead>
                            <TableHead className="text-center text-foreground">Add</TableHead>
                            <TableHead className="text-center text-foreground">Edit</TableHead>
                            <TableHead className="text-center text-foreground">Delete</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {courseLessons?.data?.content
                            ?.slice()
                            ?.sort((a, b) => Number(a.lesson_sequence) - Number(b.lesson_sequence))
                            ?.map((lesson) => (
                                <TableRow key={lesson.uuid} className="border-b border-border hover:bg-muted/30">
                                    <TableCell>Lesson {lesson.lesson_number}</TableCell>
                                    <TableCell>{lesson?.duration || "Duration"}</TableCell>
                                    <TableCell>{lesson.date || "Dates"}</TableCell>
                                    <TableCell>{lesson.time || "Time"}</TableCell>
                                    <TableCell className="text-center">
                                        <button className="text-primary hover:text-primary/80 transition-colors">+</button>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <button className="text-primary hover:text-primary/80 transition-colors">✏️</button>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <button
                                            onClick={() => deleteLesson(lesson.id)}
                                            className="text-destructive hover:text-destructive/80 transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </Card>

            {/* Order Total Card */}
            <Card className="border-border overflow-hidden">
                <div className="bg-muted p-4 flex justify-between items-center">
                    <div>
                        <span className="font-semibold text-foreground block mb-1">
                            Order Total
                        </span>
                        <span className="text-sm text-muted-foreground">
                            Total Fee = Rate × Total Number of Lessons (Multiple currency)
                        </span>
                    </div>
                    <span className="font-bold text-lg text-foreground">Ksh {totalFee.toLocaleString()}</span>
                </div>
            </Card>
        </div>
    );
};