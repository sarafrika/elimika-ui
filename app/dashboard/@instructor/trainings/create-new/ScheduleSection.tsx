'use client';

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
    TableRow,
} from "@/components/ui/table";
import { useMemo } from "react";
import { cn } from "../../../../../lib/utils";
import { ScheduleSettings } from "./page";


export const ScheduleSection = ({
    data,
    onChange,
    occurrenceCount
}: {
    data: ScheduleSettings;
    onChange: (updates: Partial<ScheduleSettings>) => void;
    occurrenceCount: number;
}) => {
    const displaySummary = useMemo(() => {
        if (data.repeat.unit === "week" && data.repeat.days?.length) {
            return `Repeats on: ${data.repeat.days.map((d) => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][d]).join(", ")}`;
        }
        return `Repeats every ${data.repeat.interval} ${data.repeat.unit}(s)`;
    }, [data.repeat.unit, data.repeat.interval, data.repeat.days]);

    return (
        <Card className="overflow-hidden shadow-sm border">
            <div className="bg-muted/50 px-6 py-4 border-b">
                <h3 className="font-semibold text-foreground text-lg">Class Schedule</h3>
            </div>

            <Table>
                <TableBody>
                    {/* Academic Period */}
                    <TableRow className="border-b hover:bg-transparent">
                        <TableCell className="bg-muted/30 font-semibold w-1/3 py-4">
                            Academic Period
                        </TableCell>
                        <TableCell className="bg-card py-4">
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
                        <TableCell className="bg-muted/30 font-semibold py-4">
                            Registration Period
                        </TableCell>
                        <TableCell className="bg-card py-4">
                            <div className="space-y-3">
                                <div className="flex flex-wrap gap-4 items-end">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-semibold text-muted-foreground">Start Date</label>
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
                                        <label className="text-xs font-semibold text-muted-foreground">End Date</label>
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
                        <TableCell className="bg-muted/30 font-semibold py-4">
                            Start Classes *
                        </TableCell>
                        <TableCell className="bg-card py-4">
                            <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-semibold text-muted-foreground">Class Day</label>
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
                                        <label className="text-xs font-semibold text-muted-foreground">Start Time</label>
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
                                        <label className="text-xs font-semibold text-muted-foreground">End Time</label>
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

                    {/* Repeat Configuration */}
                    <TableRow className="border-b hover:bg-transparent">
                        <TableCell className="bg-muted/30 font-semibold py-4">
                            Repeat *
                        </TableCell>
                        <TableCell className="bg-card py-4">
                            <div className="space-y-4">
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

                                <div className="text-sm text-muted-foreground bg-muted/30 px-4 py-3 rounded-lg">
                                    {displaySummary}
                                </div>
                            </div>
                        </TableCell>
                    </TableRow>

                    {/* End Repeat */}
                    <TableRow className="hover:bg-transparent">
                        <TableCell className="bg-muted/30 font-semibold py-4">
                            End Repeat *
                        </TableCell>
                        <TableCell className="bg-card py-4">
                            <div className="space-y-3">
                                <div className="flex items-end gap-3">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-semibold text-muted-foreground">On date:</label>
                                        <Input
                                            type="date"
                                            value={data.endRepeat}
                                            onChange={(e) => onChange({ endRepeat: e.target.value })}
                                            className="w-44"
                                            required
                                        />
                                    </div>
                                </div>
                                {occurrenceCount > 0 && (
                                    <div className="text-sm bg-primary/10 text-primary px-4 py-2.5 rounded-lg border border-primary/20 font-medium">
                                        Total occurrences: <span className="font-bold">{occurrenceCount}</span>
                                    </div>
                                )}
                            </div>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </Card>
    );
};