'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useState } from 'react';
import type { ClassData } from '../../trainings/create-new/academic-period-form';
import { EventModal } from './event-modal';
import type { AvailabilityData, CalendarEvent } from './types';
import { mapEventTypeToStatus } from './weekly-availability-grid';

interface DailyAvailabilityGridProps {
    availabilityData: AvailabilityData;
    onAvailabilityUpdate: (data: AvailabilityData) => void;
    isEditing: boolean;
    classes: ClassData[];
}

export function DailyAvailabilityGrid({
    availabilityData,
    onAvailabilityUpdate,
    classes,
}: DailyAvailabilityGridProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<{ time: string; date: Date } | null>(null);

    const timeSlots = generateTimeSlots();

    function generateTimeSlots() {
        const slots = [];
        for (let hour = 5; hour < 24; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`);
        }
        return slots;
    }

    const navigateDay = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
        setCurrentDate(newDate);
    };

    const getSlotStatus = (time: string, date: Date) => {
        const event = getEventForSlot(time, date);
        if (event) {
            return event.status;
        }

        const slot = availabilityData.events.find(s => {
            if (s.startTime !== time) return false;

            if (!doesSlotApplyToDate(s, date)) return false;

            return true;
        });

        if (slot) {
            return mapEventTypeToStatus(slot.entry_type || "SCHEDULED_INSTANCE");
        }

        const hasClass = classes.some(classItem => {
            if (classItem.status !== 'published') return false;

            return classItem.timetable.timeSlots.some(timeSlot => {
                const classDate = new Date(date);

                const isCorrectTime = timeSlot.startTime === time;

                const isWithinPeriod =
                    classDate >= new Date(classItem.academicPeriod.startDate) &&
                    classDate <= new Date(classItem.academicPeriod.endDate);

                return isCorrectTime && isWithinPeriod;
            });
        });

        if (hasClass) {
            return 'booked';
        }

        return null;
    };

    const getAvailabilityForSlot = (day: string, time: string) => {
        return availabilityData?.events?.find((slot: any) => {
            if (slot?.day?.toLowerCase() !== day.toLowerCase()) return false;

            const slotTime = new Date(`2000-01-01T${time}:00`);
            const start = new Date(`2000-01-01T${slot.startTime}:00`);
            const end = new Date(`2000-01-01T${slot.endTime}:00`);

            return slotTime >= start && slotTime < end && slot.entry_type === "AVAILABILITY";
        });
    };

    const isAvailabilityStartSlot = (day: string, time: string) => {
        return availabilityData.events.some(
            (slot: any) =>
                slot?.day?.toLowerCase() === day.toLowerCase() &&
                slot?.startTime === time &&
                slot.entry_type === "AVAILABILITY"
        );
    };

    // blocked slots
    function doesSlotApplyToDate(slot: any, date: Date) {
        if (slot.recurring) {
            const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
            return weekday.toLowerCase() === slot.day.toLowerCase();
        }

        if (slot.date) {
            const slotDate = new Date(slot.date);
            return slotDate.toDateString() === date.toDateString();
        }

        return false;
    }

    const getBlockedSlot = (time: string, date: Date) => {
        return availabilityData?.events?.find(slot => {
            if (slot.entry_type !== "BLOCKED") return false;

            if (!doesSlotApplyToDate(slot, date)) return false;

            const slotTime = new Date(`2000-01-01T${time}:00`);
            const start = new Date(`2000-01-01T${slot.startTime}:00`);
            const end = new Date(`2000-01-01T${slot.endTime}:00`);

            return slotTime >= start && slotTime < end;
        });
    };

    const isBlockedStartSlot = (day: string, time: string, date: Date) => {
        return availabilityData.events.some(slot => {
            if (slot.entry_type !== "BLOCKED") return false;
            if (!doesSlotApplyToDate(slot, date)) return false;

            return (
                slot.day.toLowerCase() === day.toLowerCase() &&
                slot.startTime === time
            );
        });
    };

    // event slots
    const getEventForSlot = (time: string, date: Date) => {
        return availabilityData?.events?.find(event => {
            if (event.entry_type !== "SCHEDULED_INSTANCE") return false;
            if (!event.date) return false;
            const eventDate = new Date(event.date);
            const isSameDate = eventDate.toDateString() === date.toDateString();

            // Check if the time slot falls within the event's duration
            const slotTime = new Date(`2000-01-01T${time}:00`);
            const eventStart = new Date(`2000-01-01T${event.startTime}:00`);
            const eventEnd = new Date(`2000-01-01T${event.endTime}:00`);

            const isWithinTimeRange = slotTime >= eventStart && slotTime < eventEnd;

            return isSameDate && isWithinTimeRange;
        });
    };

    const isEventStartSlot = (time: string, date: Date) => {
        const event = getEventForSlot(time, date);
        if (!event) return false;

        return event.startTime === time;
    };

    const getEventSpanHeight = (event: CalendarEvent) => {
        const start = new Date(`2000-01-01T${event.startTime}:00`);
        const end = new Date(`2000-01-01T${event.endTime}:00`);

        const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

        return durationMinutes / 60;
    };


    const shouldSkipSlot = (time: string, date: Date) => {
        const event = getEventForSlot(time, date);
        if (!event) return false;

        return event.startTime !== time;
    };

    const handleSlotClick = (time: string) => {
        const existingEvent = getEventForSlot(time, currentDate);

        if (existingEvent) {
            setSelectedEvent(existingEvent);
            setSelectedSlot(null);
        } else {
            setSelectedEvent(null);
            setSelectedSlot({ time, date: currentDate });
        }

        setIsEventModalOpen(true);
    };

    const handleSaveEvent = (eventData: CalendarEvent) => {
        const updated = [...availabilityData.events];
        const idx = updated.findIndex(e => e.id === eventData.id);

        if (idx >= 0) updated[idx] = eventData;
        else updated.push(eventData);

        onAvailabilityUpdate({ ...availabilityData, events: updated });
    };

    const handleDeleteEvent = (id: string) => {
        onAvailabilityUpdate({
            ...availabilityData,
            events: availabilityData.events.filter(e => e.id !== id),
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={() => navigateDay('prev')}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <h3 className="font-medium">
                        {currentDate.toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric',
                        })}
                    </h3>

                    <Button variant="outline" size="sm" onClick={() => navigateDay('next')}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="overflow-hidden rounded-lg border">
                <div className="grid grid-cols-2 border-b">
                    <div className="border-r p-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="p-3 text-center">
                        {currentDate.toLocaleDateString()}
                    </div>
                </div>

                <div className="max-h-[600px] overflow-y-auto">
                    {timeSlots.map((time) => {
                        const status = getSlotStatus(time, currentDate);
                        const event = getEventForSlot(time, currentDate);
                        const isEventStart = isEventStartSlot(time, currentDate);
                        const weekday = currentDate.toLocaleDateString("en-US", { weekday: "long" });

                        if (shouldSkipSlot(time, currentDate)) return null;

                        return (
                            <div key={time} className="grid grid-cols-2 border-b relative">
                                <div className="flex items-center border-r p-2 text-xs text-muted-foreground">
                                    {time}
                                </div>

                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div
                                                className="relative w-full h-8 cursor-pointer"
                                                onClick={() => handleSlotClick(time)}
                                            >
                                                {/* Availability Block */}
                                                {isAvailabilityStartSlot(weekday, time) && (() => {
                                                    const slot = getAvailabilityForSlot(weekday, time);
                                                    if (!slot) return null;

                                                    return (
                                                        <div
                                                            className="absolute inset-x-1 top-1 z-10 rounded"
                                                            style={{
                                                                height: getEventSpanHeight(slot) * 36,
                                                                backgroundColor: "rgba(34,197,94,0.25)",
                                                                border: "2px solid rgba(34,197,94,0.4)",
                                                            }}
                                                        >
                                                            <div className="flex h-full flex-col items-center justify-center text-xs font-medium text-success">
                                                                Available
                                                                <span className="text-muted-foreground">
                                                                    {slot.startTime} - {slot.endTime}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}

                                                {/* Blocked / Unavailable Block */}
                                                {isBlockedStartSlot(weekday, time, currentDate) && (() => {
                                                    const slot = getBlockedSlot(time, currentDate);
                                                    if (!slot) return null;

                                                    return (
                                                        <div
                                                            className="absolute inset-x-1 top-0 z-10 rounded"
                                                            style={{
                                                                height: getEventSpanHeight(slot) * 50,
                                                                backgroundColor: "rgba(239,68,68,0.25)",
                                                                border: "2px solid rgba(239,68,68,0.4)",
                                                            }}
                                                        >
                                                            <div className="flex h-full flex-col items-center justify-center text-xs font-medium text-destructive">
                                                                Blocked
                                                                <span className="text-destructive">
                                                                    {slot.startTime} - {slot.endTime}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}

                                                {/* Event Block */}
                                                {event && isEventStart && (
                                                    <div
                                                        className="absolute inset-x-1 top-1 z-20 rounded bg-primary/20 border border-primary/40"
                                                        style={{
                                                            height: getEventSpanHeight(event) * 36,
                                                        }}
                                                    >
                                                        <div className="flex h-full flex-col items-center justify-center text-xs font-medium">
                                                            {event.title}
                                                            <span className="text-xs text-primary">
                                                                {event.startTime} - {event.endTime}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <div className="text-sm">
                                                <div className="font-medium">{time}</div>
                                                {event && (
                                                    <>
                                                        <div className="mt-1 text-xs">Event: {event.title}</div>
                                                        <div className="text-xs">
                                                            {event.startTime} - {event.endTime}
                                                        </div>
                                                    </>
                                                )}
                                                <div className="mt-1 text-xs">Status: {status || 'Click to add event'}</div>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                            </div>
                        );
                    })}
                </div>
            </div>

            <Card className="p-4">
                <div className="text-sm text-muted-foreground">
                    Click any time slot to add or edit events
                </div>
            </Card>

            <EventModal
                isOpen={isEventModalOpen}
                onClose={() => setIsEventModalOpen(false)}
                event={selectedEvent}
                selectedSlot={selectedSlot as any}
                onSave={handleSaveEvent}
                onDelete={handleDeleteEvent}
            />
        </div>
    );
}
