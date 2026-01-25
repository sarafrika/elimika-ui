import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { format, isBefore } from 'date-fns';
import { Calendar, CheckCircle, Clock, MapPin, User, Video } from 'lucide-react';

export type ClassScheduleItem = {
    uuid: string;
    start_time: string;
    end_time: string;
    title: string;
    location_type: 'ONLINE' | 'PHYSICAL';
    status: 'SCHEDULED' | 'CANCELLED';
    duration_formatted: string;
    instructor_name?: string;
    student_attended?: boolean | null;
};

interface ScheduleDetailsDialogProps {
    schedule: ClassScheduleItem | null;
    isOpen: boolean;
    onClose: () => void;
    onJoinClass?: (schedule: ClassScheduleItem) => void;
}

export function ScheduleDetailsDialog({
    schedule,
    isOpen,
    onClose,
    onJoinClass,
}: ScheduleDetailsDialogProps) {
    if (!schedule) return null;

    const isPast = isBefore(new Date(schedule.end_time), new Date());

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] sm:max-w-2xl p-4 sm:p-6">
                <DialogHeader>
                    <DialogTitle className="text-base sm:text-lg">
                        Class Session Details
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Title and Badges */}
                    <div>
                        <h3 className="text-lg sm:text-xl font-semibold mb-2">
                            {schedule.title}
                        </h3>
                        <div className="flex gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                                {schedule.location_type === 'ONLINE' ? (
                                    <>
                                        <Video className="h-3 w-3 mr-1" /> Online
                                    </>
                                ) : (
                                    <>
                                        <MapPin className="h-3 w-3 mr-1" /> Physical
                                    </>
                                )}
                            </Badge>
                            <Badge
                                variant={
                                    schedule.status === 'SCHEDULED' ? 'default' : 'destructive'
                                }
                                className="text-xs"
                            >
                                {schedule.status}
                            </Badge>
                            {isPast && schedule.student_attended !== null && (
                                <Badge
                                    variant={schedule.student_attended ? 'default' : 'destructive'}
                                    className="text-xs"
                                >
                                    {schedule.student_attended ? 'Attended' : 'Missed'}
                                </Badge>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Details Grid */}
                    <div className="grid gap-4">
                        {/* Date */}
                        <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="font-medium text-sm sm:text-base">Date</p>
                                <p className="text-sm text-muted-foreground">
                                    {format(new Date(schedule.start_time), 'EEEE, MMMM d, yyyy')}
                                </p>
                            </div>
                        </div>

                        {/* Time */}
                        <div className="flex items-start gap-3">
                            <Clock className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="font-medium text-sm sm:text-base">Time</p>
                                <p className="text-sm text-muted-foreground">
                                    {format(new Date(schedule.start_time), 'h:mm a')} -{' '}
                                    {format(new Date(schedule.end_time), 'h:mm a')}
                                    <Badge variant="secondary" className="ml-2 text-xs">
                                        {schedule.duration_formatted}
                                    </Badge>
                                </p>
                            </div>
                        </div>

                        {/* Instructor */}
                        {schedule.instructor_name && (
                            <div className="flex items-start gap-3">
                                <User className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="font-medium text-sm sm:text-base">Instructor</p>
                                    <p className="text-sm text-muted-foreground">
                                        {schedule.instructor_name}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Attendance Status */}
                        {schedule.student_attended !== null && (
                            <div className="flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="font-medium text-sm sm:text-base">Attendance</p>
                                    <Badge
                                        variant={schedule.student_attended ? 'default' : 'destructive'}
                                        className="text-xs mt-1"
                                    >
                                        {schedule.student_attended ? 'Attended' : 'Missed'}
                                    </Badge>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Join Class Button */}
                    {!isPast && schedule.status === 'SCHEDULED' && (
                        <>
                            <Separator />
                            <div className="pt-2">
                                <Button
                                    className="w-full gap-2"
                                    size="lg"
                                    onClick={() => onJoinClass?.(schedule)}
                                >
                                    <Video className="h-5 w-5" />
                                    Join Class
                                </Button>
                            </div>
                        </>
                    )}

                    {/* Past Class Info */}
                    {isPast && (
                        <>
                            <Separator />
                            <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                                <p className="text-xs sm:text-sm text-muted-foreground text-center">
                                    This class session has ended
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}