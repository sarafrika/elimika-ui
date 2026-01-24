'use client';

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Edit2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useInstructor } from "../../../../../context/instructor-context";
import {
    getAllCoursesOptions,
    getAllDifficultyLevelsOptions,
    searchTrainingApplicationsOptions,
} from "../../../../../services/client/@tanstack/react-query.gen";
import { ClassDetails } from "./page";

const CLASS_TYPE_OPTIONS = [
    { label: "Group", value: "GROUP" },
    { label: "Private", value: "PRIVATE" },
];

const LECTURE_TYPE_OPTIONS = [
    { label: "Online", value: "ONLINE" },
    { label: "In-person", value: "IN_PERSON" },
    { label: "Hybrid", value: "HYBRID" },
];

interface ScheduledSession {
    date: Date;
    startTime: string;
    endTime: string;
    hours: number;
}

export const ClassDetailsSection = ({
    data,
    onChange,
    courseDetail,
}: {
    data: ClassDetails;
    onChange: (updates: Partial<ClassDetails>) => void;
    courseDetail?: any;
}) => {
    const instructor = useInstructor();
    const prevCourseRef = useRef<string | null>(null);
    const prevClassTypeRef = useRef<string | null>(null);
    const prevLectureTypeRef = useRef<string | null>(null);

    // Custom scheduler state
    const [selectedDates, setSelectedDates] = useState<Date[]>([]);
    const [defaultStartTime, setDefaultStartTime] = useState("09:00");
    const [defaultEndTime, setDefaultEndTime] = useState("17:00");
    const [allDay, setAllDay] = useState(false);
    const [scheduledSessions, setScheduledSessions] = useState<ScheduledSession[]>([]);
    const [isSchedulerExpanded, setIsSchedulerExpanded] = useState(false);
    const [editingSession, setEditingSession] = useState<number | null>(null);
    const [editStartTime, setEditStartTime] = useState("");
    const [editEndTime, setEditEndTime] = useState("");

    const { data: difficulty } = useQuery(getAllDifficultyLevelsOptions());
    const difficultyLevels = difficulty?.data;

    const getDifficultyNameFromUUID = useCallback(
        (uuid: string): string | undefined => {
            return difficultyLevels?.find((level) => level.uuid === uuid)?.name;
        },
        [difficultyLevels]
    );

    const { data: courses } = useQuery(
        getAllCoursesOptions({ query: { pageable: {} } })
    );

    const { data: appliedCourses } = useQuery({
        ...searchTrainingApplicationsOptions({
            query: {
                pageable: {},
                searchParams: { applicant_uuid_eq: instructor?.uuid as string },
            },
        }),
        enabled: !!instructor?.uuid,
    });

    const approvedCourses = useMemo(() => {
        if (!courses?.data?.content || !appliedCourses?.data?.content) return [];

        const approvedApplicationMap = new Map(
            appliedCourses.data.content
                .filter((app) => app.status === "approved")
                .map((app) => [app.course_uuid, app])
        );

        return courses.data.content
            .filter((course) => approvedApplicationMap.has(course.uuid))
            .map((course) => ({
                ...course,
                application: approvedApplicationMap.get(course.uuid),
            }));
    }, [courses, appliedCourses]);

    const selectedCourse = useMemo(() => {
        return approvedCourses.find((course) => course.uuid === data.course_uuid);
    }, [approvedCourses, data.course_uuid]);

    // Calculate hours between times
    const calculateHours = (start: string, end: string): number => {
        if (!start || !end) return 0;
        const [startHour, startMin] = start.split(':').map(Number);
        const [endHour, endMin] = end.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        return Math.max(0, (endMinutes - startMinutes) / 60);
    };

    // Update scheduled sessions when dates or times change
    useEffect(() => {
        if (selectedDates.length > 0) {
            const sessions = selectedDates.map(date => {
                const existingSession = scheduledSessions.find(
                    s => s.date.toDateString() === date.toDateString()
                );

                if (existingSession) {
                    return existingSession;
                }

                return {
                    date,
                    startTime: allDay ? "00:00" : defaultStartTime,
                    endTime: allDay ? "23:59" : defaultEndTime,
                    hours: allDay ? 24 : calculateHours(defaultStartTime, defaultEndTime)
                };
            });
            setScheduledSessions(sessions);
        } else {
            setScheduledSessions([]);
        }
    }, [selectedDates, defaultStartTime, defaultEndTime, allDay]);

    // Handle course selection and auto-populate categories
    useEffect(() => {
        if (!selectedCourse || prevCourseRef.current === data.course_uuid) return;

        prevCourseRef.current = data.course_uuid;
        onChange({ categories: selectedCourse.category_names ?? [] });
        onChange({ class_limit: selectedCourse.class_limit });

    }, [selectedCourse, data.course_uuid, onChange]);

    // Handle class type & lecture type change to update rate card
    useEffect(() => {
        if (
            !data.class_type ||
            !data.location_type ||
            !selectedCourse?.application?.rate_card
        )
            return;

        const shouldUpdate =
            prevClassTypeRef.current !== data.class_type ||
            prevLectureTypeRef.current !== data.location_type;

        if (!shouldUpdate) return;

        prevClassTypeRef.current = data.class_type;
        prevLectureTypeRef.current = data.location_type;

        const rateCardKey = `${data.class_type}_${data.location_type}_rate`;
        const rate =
            selectedCourse.application.rate_card[
            rateCardKey as keyof typeof selectedCourse.application.rate_card
            ];

        if (rate !== undefined) {
            onChange({ rate_card: String(rate) });
        }
    }, [data.class_type, data.location_type, selectedCourse, onChange]);

    const handleDateSelect = (dates: Date[] | undefined) => {
        setSelectedDates(dates || []);
    };

    const removeSession = (index: number) => {
        const newSessions = [...scheduledSessions];
        const removedDate = newSessions[index].date;
        newSessions.splice(index, 1);
        setScheduledSessions(newSessions);
        setSelectedDates(prev => prev.filter(d => d.toDateString() !== removedDate.toDateString()));
    };

    const startEditSession = (index: number) => {
        setEditingSession(index);
        setEditStartTime(scheduledSessions[index].startTime);
        setEditEndTime(scheduledSessions[index].endTime);
    };

    const saveEditSession = (index: number) => {
        const newSessions = [...scheduledSessions];
        newSessions[index] = {
            ...newSessions[index],
            startTime: editStartTime,
            endTime: editEndTime,
            hours: calculateHours(editStartTime, editEndTime)
        };
        setScheduledSessions(newSessions);
        setEditingSession(null);
    };

    const cancelEdit = () => {
        setEditingSession(null);
        setEditStartTime("");
        setEditEndTime("");
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const totalHours = scheduledSessions.reduce((sum, session) => sum + session.hours, 0);

    return (
        <Card className="overflow-hidden shadow-sm border">
            <div className="bg-muted/50 px-6 py-4 border-b">
                <h3 className="font-semibold text-foreground text-lg">Class Details</h3>
            </div>

            <div className="divide-y">
                {/* Class Name/Category */}
                <div className="grid grid-cols-3 hover:bg-transparent">
                    <div className="bg-muted/30 font-semibold py-4 px-6">
                        Class Name/Category *
                    </div>
                    <div className="col-span-2 bg-card py-4 px-6">
                        <Input
                            placeholder="Enter class title"
                            value={data.title}
                            onChange={(e) => onChange({ title: e.target.value })}
                        />
                    </div>
                </div>

                {/* Course/Subject */}
                <div className="grid grid-cols-3 hover:bg-transparent">
                    <div className="bg-muted/30 font-semibold py-4 px-6">
                        Course/Subject *
                    </div>
                    <div className="col-span-2 bg-card py-4 px-6">
                        <Select
                            value={data.course_uuid}
                            onValueChange={(value) => onChange({ course_uuid: value })}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue>
                                    {selectedCourse ? selectedCourse.name : "Select a course"}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {approvedCourses.map((course) => (
                                    <SelectItem key={course.uuid} value={course.uuid as string}>
                                        {course.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Grade/Level */}
                <div className="grid grid-cols-3 hover:bg-transparent">
                    <div className="bg-muted/30 font-semibold py-4 px-6">
                        Grade/Level
                    </div>
                    <div className="col-span-2 bg-card py-4 px-6 text-sm text-muted-foreground grid grid-cols-3 gap-4">
                        <div>
                            {getDifficultyNameFromUUID(
                                selectedCourse?.difficulty_uuid || ""
                            ) || "—"}
                        </div>

                        <div>
                            {selectedCourse?.class_limit ?? "—"} max participants
                        </div>

                        <div>
                            {/* third column (leave empty or add something later) */}
                        </div>
                    </div>

                </div>


                {/* Class Type (Group/Private) */}
                <div className="grid grid-cols-3 hover:bg-transparent">
                    <div className="bg-muted/30 font-semibold py-4 px-6">
                        Class Type *
                    </div>
                    <div className="col-span-2 bg-card py-4 px-6">
                        <div className="flex gap-6">
                            {CLASS_TYPE_OPTIONS.map((option) => (
                                <label
                                    key={option.value}
                                    className="flex items-center gap-3 cursor-pointer"
                                >
                                    <input
                                        type="radio"
                                        name="class_type"
                                        value={option.value}
                                        checked={data.class_type === option.value}
                                        onChange={(e) =>
                                            onChange({ class_type: e.target.value })
                                        }
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm font-medium text-foreground">
                                        {option.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Lecture Type (Online/In-person/Hybrid) */}
                <div className="grid grid-cols-3 hover:bg-transparent">
                    <div className="bg-muted/30 font-semibold py-4 px-6">
                        Lecture Type *
                    </div>
                    <div className="col-span-2 bg-card py-4 px-6">
                        <div className="flex gap-6">
                            {LECTURE_TYPE_OPTIONS.map((option) => (
                                <label
                                    key={option.value}
                                    className="flex items-center gap-3 cursor-pointer"
                                >
                                    <input
                                        type="radio"
                                        name="lecture_type"
                                        value={option.value}
                                        checked={data.location_type === option.value}
                                        onChange={(e) =>
                                            onChange({ location_type: e.target.value })
                                        }
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm font-medium text-foreground">
                                        {option.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Rate Card */}
                <div className="grid grid-cols-3 hover:bg-transparent">
                    <div className="bg-muted/30 font-semibold py-4 px-6">
                        Rate Card
                    </div>
                    <div className="col-span-2 bg-card py-4 px-6">
                        <div className="w-full h-10 px-3 flex items-center gap-2 rounded-md border border-input bg-muted text-sm cursor-not-allowed">
                            <span>
                                {data.rate_card || "Auto-calculated from course"}
                            </span>
                            <span className="text-muted-foreground">
                                ({selectedCourse?.application?.rate_card?.currency})
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Rate is automatically set based on course and class type
                        </p>
                    </div>
                </div>
            </div>

            {/* Custom Scheduler Section */}
            <div className="border-t">
                <button
                    onClick={() => setIsSchedulerExpanded(!isSchedulerExpanded)}
                    className="w-full bg-muted/30 px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                    <h4 className="font-semibold text-foreground">Use Custom Schedule</h4>
                    {isSchedulerExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                    ) : (
                        <ChevronDown className="w-5 h-5" />
                    )}
                </button>

                {isSchedulerExpanded && (
                    <div className="p-6 space-y-6">
                        {/* Time Settings */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">
                                        Default Start Time
                                    </label>
                                    <Input
                                        type="time"
                                        value={defaultStartTime}
                                        onChange={(e) => setDefaultStartTime(e.target.value)}
                                        disabled={allDay}
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-2 block">
                                        Default End Time
                                    </label>
                                    <Input
                                        type="time"
                                        value={defaultEndTime}
                                        onChange={(e) => setDefaultEndTime(e.target.value)}
                                        disabled={allDay}
                                        className="w-full"
                                    />
                                </div>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={allDay}
                                        onChange={(e) => setAllDay(e.target.checked)}
                                        className="rounded w-4 h-4"
                                    />
                                    <span className="text-sm font-medium">All Day</span>
                                </label>
                                <div className="text-sm text-muted-foreground">
                                    Duration: {allDay ? "24" : calculateHours(defaultStartTime, defaultEndTime).toFixed(1)} hours
                                </div>
                            </div>

                            {/* Calendar */}
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    Select Dates
                                </label>
                                <Calendar
                                    mode="multiple"
                                    selected={selectedDates}
                                    onSelect={handleDateSelect}
                                    className="rounded-md border"
                                />
                            </div>
                        </div>

                        {/* Scheduled Sessions Table */}
                        {scheduledSessions.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h5 className="font-semibold text-sm">
                                        Scheduled Sessions ({scheduledSessions.length})
                                    </h5>
                                    <div className="text-sm text-muted-foreground">
                                        Total: {totalHours.toFixed(1)} hours
                                    </div>
                                </div>
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-muted/50">
                                                <tr className="border-b">
                                                    <th className="text-left p-3 font-medium text-sm">Date</th>
                                                    <th className="text-left p-3 font-medium text-sm">Start Time</th>
                                                    <th className="text-left p-3 font-medium text-sm">End Time</th>
                                                    <th className="text-left p-3 font-medium text-sm">Hours</th>
                                                    <th className="text-left p-3 font-medium text-sm">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {scheduledSessions.map((session, index) => (
                                                    <tr key={index} className="border-b last:border-0 hover:bg-muted/30">
                                                        <td className="p-3 font-medium">
                                                            {formatDate(session.date)}
                                                        </td>
                                                        <td className="p-3">
                                                            {editingSession === index ? (
                                                                <Input
                                                                    type="time"
                                                                    value={editStartTime}
                                                                    onChange={(e) => setEditStartTime(e.target.value)}
                                                                    className="w-full"
                                                                />
                                                            ) : (
                                                                session.startTime
                                                            )}
                                                        </td>
                                                        <td className="p-3">
                                                            {editingSession === index ? (
                                                                <Input
                                                                    type="time"
                                                                    value={editEndTime}
                                                                    onChange={(e) => setEditEndTime(e.target.value)}
                                                                    className="w-full"
                                                                />
                                                            ) : (
                                                                session.endTime
                                                            )}
                                                        </td>
                                                        <td className="p-3">
                                                            {editingSession === index
                                                                ? calculateHours(editStartTime, editEndTime).toFixed(1)
                                                                : session.hours.toFixed(1)}
                                                        </td>
                                                        <td className="p-3">
                                                            <div className="flex gap-2">
                                                                {editingSession === index ? (
                                                                    <>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() => saveEditSession(index)}
                                                                            className="h-8 w-8 p-0"
                                                                        >
                                                                            ✓
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={cancelEdit}
                                                                            className="h-8 w-8 p-0"
                                                                        >
                                                                            ✕
                                                                        </Button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() => startEditSession(index)}
                                                                            className="h-8 w-8 p-0"
                                                                        >
                                                                            <Edit2 className="w-4 h-4" />
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() => removeSession(index)}
                                                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                                        >
                                                                            <X className="w-4 h-4" />
                                                                        </Button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
};