import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, User, Video } from 'lucide-react';

export type ClassScheduleItem = {
    uuid: string;
    start_time: string;
    end_time: string;
    title: string;
    location_type: 'ONLINE' | 'PHYSICAL';
    duration_formatted: string;
    instructor_name?: string;
};

interface NextClassCardProps {
    nextClass: ClassScheduleItem | null;
    onJoinClass?: (schedule: ClassScheduleItem) => void;
}

export function NextClassCard({ nextClass, onJoinClass }: NextClassCardProps) {

    return (
        <div className="border-b bg-muted/30">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 sm:py-6">
                <Card className="border-primary/50 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                            Next Class Session
                        </CardTitle>
                    </CardHeader>

                    {nextClass ? <CardContent>
                        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                            {/* Class Details */}
                            <div className="space-y-2 sm:space-y-3">
                                {/* Title */}
                                <div>
                                    <h3 className="font-semibold text-base sm:text-lg mb-1">
                                        {nextClass.title}
                                    </h3>
                                    <Badge variant="outline" className="mb-2 text-xs">
                                        {nextClass.location_type === 'ONLINE' ? (
                                            <>
                                                <Video className="h-3 w-3 mr-1" /> Online
                                            </>
                                        ) : (
                                            <>
                                                <MapPin className="h-3 w-3 mr-1" /> Physical
                                            </>
                                        )}
                                    </Badge>
                                </div>

                                {/* Date */}
                                <div className="flex items-center gap-2 text-xs sm:text-sm">
                                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                                    <span className="font-medium">
                                        {format(new Date(nextClass.start_time), 'EEEE, MMMM d, yyyy')}
                                    </span>
                                </div>

                                {/* Time */}
                                <div className="flex items-center gap-2 text-xs sm:text-sm flex-wrap">
                                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                                    <span>
                                        {format(new Date(nextClass.start_time), 'h:mm a')} -{' '}
                                        {format(new Date(nextClass.end_time), 'h:mm a')}
                                    </span>
                                    <Badge variant="secondary" className="text-xs">
                                        {nextClass.duration_formatted}
                                    </Badge>
                                </div>

                                {/* Instructor */}
                                {nextClass.instructor_name && (
                                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                                        <User className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                                        <span>{nextClass.instructor_name}</span>
                                    </div>
                                )}
                            </div>

                            {/* Join Button */}
                            <div className="flex items-center justify-start md:justify-end">
                                <Button
                                    size="lg"
                                    className="gap-2 w-full sm:w-auto"
                                    onClick={() => onJoinClass?.(nextClass)}
                                >
                                    <Video className="h-5 w-5" />
                                    Join Class
                                </Button>
                            </div>
                        </div>
                    </CardContent> : <CardContent>No next class</CardContent>}

                </Card>
            </div>
        </div>
    );
}