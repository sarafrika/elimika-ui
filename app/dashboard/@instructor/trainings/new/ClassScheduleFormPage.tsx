'use client';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableRow
} from "@/components/ui/table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormEvent } from "react";
import { toast } from "sonner";
import { useInstructor } from "../../../../../context/instructor-context";
import { cn } from "../../../../../lib/utils";
import {
    createClassDefinitionMutation,
    getClassDefinitionQueryKey,
    getClassDefinitionsForInstructorQueryKey,
    updateClassDefinitionMutation
} from "../../../../../services/client/@tanstack/react-query.gen";
import { ScheduleSettings } from "./page";

const DAY_NAMES = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const RECURRENCE_TYPE_MAP: Record<string, string> = {
    day: "DAILY",
    week: "WEEKLY",
    month: "MONTHLY",
    year: "YEARLY",
};

export const ClassScheduleFormPage = ({
    data,
    resolvedId,
    classDetails,
    onChange,
    onClassCreated,
    onNext
}: {
    data: ScheduleSettings;
    resolvedId: string;
    classDetails: any;
    onChange: (updates: Partial<ScheduleSettings>) => void;
    onClassCreated: (uuid: string) => void;
    onNext: () => void;
}) => {
    const qc = useQueryClient();
    const instructor = useInstructor();
    const createClassDefinition = useMutation(createClassDefinitionMutation());
    const updateClassDefinition = useMutation(updateClassDefinitionMutation());

    const isFormValid = () => {
        if (!classDetails?.course_uuid || !classDetails?.title) {
            toast.error("Please complete Class Details first");
            return false;
        }
        if (!data.startClass.date || !data.startClass.startTime || !data.startClass.endTime) {
            toast.error("Please fill in all schedule fields");
            return false;
        }
        if (data.repeat.unit === "week" && (!data.repeat.days || data.repeat.days.length === 0)) {
            toast.error("Please select at least one day of the week");
            return false;
        }
        return true;
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!isFormValid()) return;

        try {
            const start_time = new Date(`${data.startClass.date}T${data.startClass.startTime}:00Z`).toISOString();
            const end_time = new Date(`${data.startClass.date}T${data.startClass.endTime}:00Z`).toISOString();

            const selectedDays = data.repeat.days || [];
            const days_of_week = selectedDays
                .sort()
                .map(dayIndex => DAY_NAMES[dayIndex])
                .join(",");

            const payload = {
                course_uuid: classDetails.course_uuid,
                title: classDetails.title,
                description: "",
                default_instructor_uuid: instructor?.uuid as string,
                class_visibility: 'PUBLIC',
                session_format: "GROUP",
                location_type: classDetails.location_type,
                location_name: classDetails.location_name,
                location_latitude: -1.292066,
                location_longitude: 36.821945,
                max_participants: classDetails.class_limit,
                allow_waitlist: true,
                is_active: true,
                default_start_time: start_time,
                default_end_time: end_time,
                session_templates: [
                    {
                        start_time: start_time,
                        end_time: end_time,
                        recurrence: {
                            recurrence_type: RECURRENCE_TYPE_MAP[data.repeat.unit],
                            interval_value: data.repeat.interval,
                            days_of_week: days_of_week || undefined,
                            occurrence_count: 8
                        },
                        conflict_resolution: "FAIL"
                    }
                ]
            };

            if (resolvedId) {
                updateClassDefinition.mutate(
                    { path: { uuid: resolvedId }, body: payload as any },
                    {
                        onSuccess: (response) => {
                            qc.invalidateQueries({
                                queryKey: getClassDefinitionsForInstructorQueryKey({
                                    path: { instructorUuid: instructor?.uuid as string },
                                }),
                            });

                            qc.invalidateQueries({
                                queryKey: getClassDefinitionQueryKey({
                                    path: { uuid: resolvedId },
                                }),
                            });

                            toast.success(response?.message || "Class updated successfully");
                            onNext();
                        },
                        onError: (error: any) => {
                            toast.error(error?.message || "Failed to update class");
                        }
                    }
                );
            } else {
                createClassDefinition.mutate(
                    { body: payload as any },
                    {
                        onSuccess: (response) => {
                            const savedUuid = response?.data?.class_definition?.uuid;

                            if (savedUuid) {
                                onClassCreated(savedUuid);
                            }

                            qc.invalidateQueries({
                                queryKey: getClassDefinitionsForInstructorQueryKey({
                                    path: { instructorUuid: instructor?.uuid as string },
                                }),
                            });

                            toast.success(response?.message || "Class created successfully");
                            onNext();
                        },
                        onError: (error: any) => {
                            toast.error(error?.message || "Failed to create class");
                        }
                    }
                );
            }
        } catch (error) {
            toast.error("An error occurred while processing your request");
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h2 className="text-xl font-bold text-foreground mb-2">Class Schedule</h2>
                <p className="text-muted-foreground">Set up your class schedule and recurrence</p>
            </div>

            <form onSubmit={handleSubmit}>
                <Card className="overflow-hidden shadow-lg rounded-xl">
                    <Table>
                        <TableBody>
                            {/* Academic Period */}
                            <TableRow className="border-b hover:bg-transparent">
                                <TableCell className="bg-muted/50 font-semibold w-1/3 py-5">
                                    Academic Period
                                </TableCell>
                                <TableCell className="bg-card py-5">
                                    <div className="flex gap-3 items-center flex-wrap">
                                        <Input
                                            type="date"
                                            value={data.academicPeriod.start}
                                            onChange={(e) =>
                                                onChange({
                                                    academicPeriod: { ...data.academicPeriod, start: e.target.value }
                                                })
                                            }
                                            className="w-44"
                                        />
                                        <span className="text-sm font-medium text-muted-foreground">to</span>
                                        <Input
                                            type="date"
                                            value={data.academicPeriod.end}
                                            onChange={(e) =>
                                                onChange({
                                                    academicPeriod: { ...data.academicPeriod, end: e.target.value }
                                                })
                                            }
                                            className="w-44"
                                        />
                                    </div>
                                </TableCell>
                            </TableRow>

                            {/* Registration Period */}
                            <TableRow className="border-b hover:bg-transparent">
                                <TableCell className="bg-muted/50 font-semibold py-5">
                                    Registration Period
                                </TableCell>
                                <TableCell className="bg-card py-5">
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap gap-4 items-end">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-semibold text-foreground">Start Date</label>
                                                <Input
                                                    type="date"
                                                    value={data.registrationPeriod.start}
                                                    onChange={(e) =>
                                                        onChange({
                                                            registrationPeriod: {
                                                                ...data.registrationPeriod,
                                                                start: e.target.value
                                                            }
                                                        })
                                                    }
                                                    className="w-44"
                                                />
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-semibold text-foreground">End Date</label>
                                                <Input
                                                    type="date"
                                                    value={data.registrationPeriod.end || ""}
                                                    disabled={data.registrationPeriod.continuous}
                                                    onChange={(e) =>
                                                        onChange({
                                                            registrationPeriod: {
                                                                ...data.registrationPeriod,
                                                                end: e.target.value
                                                            }
                                                        })
                                                    }
                                                    className="w-44"
                                                />
                                            </div>
                                        </div>

                                        <label className="flex items-center gap-3 text-sm font-medium text-foreground cursor-pointer w-fit">
                                            <input
                                                type="checkbox"
                                                checked={data.registrationPeriod.continuous || false}
                                                onChange={(e) =>
                                                    onChange({
                                                        registrationPeriod: {
                                                            ...data.registrationPeriod,
                                                            continuous: e.target.checked,
                                                            end: e.target.checked ? "" : data.registrationPeriod.end
                                                        }
                                                    })
                                                }
                                                className="rounded w-4 h-4"
                                            />
                                            Continuous Registration (no closing date)
                                        </label>
                                    </div>
                                </TableCell>
                            </TableRow>

                            {/* Start Classes */}
                            <TableRow className="border-b hover:bg-transparent">
                                <TableCell className="bg-muted/50 font-semibold py-5">
                                    Start Classes *
                                </TableCell>
                                <TableCell className="bg-card py-5">
                                    <div className="space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-semibold text-foreground">Class Day</label>
                                                <Input
                                                    type="date"
                                                    value={data.startClass.date || ""}
                                                    onChange={(e) =>
                                                        onChange({
                                                            startClass: {
                                                                ...data.startClass,
                                                                date: e.target.value
                                                            }
                                                        })
                                                    }
                                                    className="w-44"
                                                    required
                                                />
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-semibold text-foreground">Start Time</label>
                                                <Input
                                                    type="time"
                                                    value={data.startClass.startTime || ""}
                                                    onChange={(e) =>
                                                        onChange({
                                                            startClass: {
                                                                ...data.startClass,
                                                                startTime: e.target.value
                                                            }
                                                        })
                                                    }
                                                    disabled={data.allDay}
                                                    className="w-44"
                                                    required={!data.allDay}
                                                />
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-semibold text-foreground">End Time</label>
                                                <Input
                                                    type="time"
                                                    value={data.startClass.endTime || ""}
                                                    onChange={(e) =>
                                                        onChange({
                                                            startClass: {
                                                                ...data.startClass,
                                                                endTime: e.target.value
                                                            }
                                                        })
                                                    }
                                                    disabled={data.allDay}
                                                    className="w-44"
                                                    required={!data.allDay}
                                                />
                                            </div>
                                        </div>

                                        <label className="flex items-center gap-3 text-sm font-medium text-foreground cursor-pointer w-fit">
                                            <input
                                                type="checkbox"
                                                checked={data.allDay}
                                                onChange={(e) => onChange({ allDay: e.target.checked })}
                                                className="rounded w-4 h-4"
                                            />
                                            All Day (entire day booked)
                                        </label>
                                    </div>
                                </TableCell>
                            </TableRow>

                            {/* Class Schedule */}
                            <TableRow className="border-b hover:bg-transparent">
                                <TableCell className="bg-muted/50 font-semibold py-5">
                                    Classes Schedule *
                                </TableCell>
                                <TableCell className="bg-card py-5">
                                    <div className="space-y-4">
                                        {/* Repeat Frequency */}
                                        <div className="flex flex-wrap items-end gap-3">
                                            <label className="text-sm font-semibold text-foreground">Repeat every:</label>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={data.repeat.interval || 1}
                                                onChange={(e) =>
                                                    onChange({
                                                        repeat: {
                                                            ...data.repeat,
                                                            interval: parseInt(e.target.value, 10) || 1
                                                        }
                                                    })
                                                }
                                                className="w-20"
                                            />
                                            <Select
                                                value={data.repeat.unit || "week"}
                                                onValueChange={(value) =>
                                                    onChange({
                                                        repeat: {
                                                            ...data.repeat,
                                                            unit: value as "day" | "week" | "month" | "year"
                                                        }
                                                    })
                                                }
                                            >
                                                <SelectTrigger className="w-40">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="day">Day</SelectItem>
                                                    <SelectItem value="week">Week</SelectItem>
                                                    <SelectItem value="month">Month</SelectItem>
                                                    <SelectItem value="year">Year</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Weekly: Select Days */}
                                        {data.repeat.unit === "week" && (
                                            <div className="space-y-3">
                                                <label className="text-sm font-semibold text-foreground">Select days:</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, idx) => (
                                                        <label
                                                            key={day}
                                                            className={cn(
                                                                "flex items-center gap-2 border rounded-lg px-4 py-2.5 cursor-pointer select-none transition-all",
                                                                data.repeat.days?.includes(idx)
                                                                    ? "bg-primary/10 border-primary text-primary font-medium"
                                                                    : "border-border hover:bg-muted"
                                                            )}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={data.repeat.days?.includes(idx) || false}
                                                                onChange={(e) => {
                                                                    const days = new Set(data.repeat.days || []);
                                                                    if (e.target.checked) days.add(idx);
                                                                    else days.delete(idx);
                                                                    onChange({
                                                                        repeat: {
                                                                            ...data.repeat,
                                                                            days: Array.from(days).sort()
                                                                        }
                                                                    });
                                                                }}
                                                                className="rounded w-4 h-4"
                                                            />
                                                            <span className="text-sm font-medium">{day}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Display selected summary */}
                                        <div className="text-sm text-muted-foreground bg-muted/30 px-4 py-3 rounded-lg">
                                            {data.repeat.unit === "week" && data.repeat.days?.length
                                                ? `Repeats on: ${data.repeat.days.map((d) => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][d]).join(", ")}`
                                                : `Repeats every ${data.repeat.interval || 1} ${data.repeat.unit}(s)`}
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>

                            {/* End Repeat */}
                            <TableRow className="border-b hover:bg-transparent">
                                <TableCell className="bg-muted/50 font-semibold py-5">
                                    End Repeat
                                </TableCell>
                                <TableCell className="bg-card py-5">
                                    <div className="flex items-end gap-3">
                                        <label className="text-sm font-semibold text-foreground">On date:</label>
                                        <Input
                                            type="date"
                                            value={data.endRepeat}
                                            onChange={(e) => onChange({ endRepeat: e.target.value })}
                                            className="w-44"
                                        />
                                    </div>
                                </TableCell>
                            </TableRow>

                            {/* Alert Attendee */}
                            <TableRow className="hover:bg-transparent">
                                <TableCell className="bg-muted/50 font-semibold py-5">
                                    Alert Attendee
                                </TableCell>
                                <TableCell className="bg-card py-5">
                                    <label className="flex items-center gap-3 text-sm font-medium text-foreground cursor-pointer w-fit">
                                        <input
                                            type="checkbox"
                                            checked={data.alertAttendee}
                                            onChange={(e) => onChange({ alertAttendee: e.target.checked })}
                                            className="rounded w-4 h-4"
                                        />
                                        Send notifications to attendees
                                    </label>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </Card>

                <div className="mt-8 flex justify-end">
                    <Button
                        type="submit"
                        disabled={createClassDefinition.isPending || updateClassDefinition.isPending}
                        size="lg"
                        className="px-8"
                    >
                        {(createClassDefinition.isPending || updateClassDefinition.isPending)
                            ? "Saving..."
                            : "Save & Continue"}
                    </Button>
                </div>
            </form>
        </div>
    );
};
