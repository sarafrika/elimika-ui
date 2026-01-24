'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { format, isAfter, isBefore } from 'date-fns';
import { ArrowRight, BookOpen, Calendar, Clock, MapPin, User } from 'lucide-react';
import Link from 'next/link';

interface EnrolledClassCardProps {
    classDefinition: any;
    enrollment: any;
    course: any;
    href: string;
}

const EnrolledClassCard = ({ classDefinition, enrollment, course, href }: EnrolledClassCardProps) => {
    const classData = classDefinition?.class_definition
    // Parse dates
    const startDate = classData?.default_start_time
        ? new Date(classData.default_start_time)
        : null;
    const endDate = classData?.default_end_time
        ? new Date(classData.default_end_time)
        : null;
    const now = new Date();

    // Determine class status
    const getClassStatus = () => {
        if (!startDate || !endDate) return { label: 'Scheduled', variant: 'secondary' as const };

        if (isBefore(now, startDate)) {
            return { label: 'Upcoming', variant: 'default' as const };
        } else if (isAfter(now, endDate)) {
            return { label: 'Completed', variant: 'secondary' as const };
        } else {
            return { label: 'In Progress', variant: 'default' as const };
        }
    };

    const status = getClassStatus();

    // Calculate progress (mock - replace with actual progress if available)
    const calculateProgress = () => {
        if (!startDate || !endDate) return 0;

        if (isBefore(now, startDate)) return 0;
        if (isAfter(now, endDate)) return 100;

        const totalDuration = endDate.getTime() - startDate.getTime();
        const elapsed = now.getTime() - startDate.getTime();
        return Math.round((elapsed / totalDuration) * 100);
    };

    const progress = calculateProgress();

    return (
        <Card className='group flex h-full flex-col overflow-hidden transition-all hover:shadow-lg'>
            {/* Header with image/gradient */}
            <div className='relative h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-background'>
                <div className='absolute inset-0 flex items-center justify-center'>
                    <BookOpen className='h-12 w-12 text-primary/40' />
                </div>
                <div className='absolute right-3 top-3'>
                    <Badge variant={status.variant}>{status.label}</Badge>
                </div>
            </div>

            <CardHeader className='space-y-2 pb-3'>
                <h3 className='line-clamp-2 text-lg font-semibold leading-tight group-hover:text-primary'>
                    {course?.name || classData?.title || 'Untitled Class'}
                </h3>
                {classData?.subtitle && (
                    <p className='line-clamp-2 text-sm text-muted-foreground'>
                        {classData.subtitle}
                    </p>
                )}
            </CardHeader>

            <CardContent className='flex-1 space-y-4 pb-4'>
                {/* Progress bar for in-progress classes */}
                {status.label === 'In Progress' && (
                    <div className='space-y-2'>
                        <div className='flex items-center justify-between text-xs'>
                            <span className='text-muted-foreground'>Course Progress</span>
                            <span className='font-medium'>{progress}%</span>
                        </div>
                        <Progress value={progress} className='h-2' />
                    </div>
                )}

                {/* Class details */}
                <div className='space-y-2'>
                    {/* Instructor */}
                    {classData?.instructor?.full_name && (
                        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                            <User className='h-4 w-4 flex-shrink-0' />
                            <span className='truncate'>{classData.instructor.full_name}</span>
                        </div>
                    )}

                    {/* Start date */}
                    {startDate && (
                        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                            <Calendar className='h-4 w-4 flex-shrink-0' />
                            <span>{format(startDate, 'MMM dd, yyyy')}</span>
                        </div>
                    )}

                    {/* Duration */}
                    {startDate && endDate && (
                        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                            <Clock className='h-4 w-4 flex-shrink-0' />
                            <span>
                                {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))}{' '}
                                days
                            </span>
                        </div>
                    )}

                    {/* Location */}
                    {classData?.location_type && (
                        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                            <MapPin className='h-4 w-4 flex-shrink-0' />
                            <span className='truncate'>{classData.location_type}</span>
                        </div>
                    )}
                </div>

                {/* Enrollment info */}
                {enrollment?.enrollment_date && (
                    <div className='rounded-lg bg-muted/50 p-2'>
                        <p className='text-xs text-muted-foreground'>
                            Enrolled {format(new Date(enrollment.enrollment_date), 'MMM dd, yyyy')}
                        </p>
                    </div>
                )}
            </CardContent>

            <CardFooter className='pt-0'>
                <Link href={href} className='w-full'>
                    <Button variant='outline' className='w-full group-hover:bg-primary group-hover:text-primary-foreground'>
                        {status.label === 'Completed' ? 'View Details' : 'Continue Learning'}
                        <ArrowRight className='ml-2 h-4 w-4 transition-transform group-hover:translate-x-1' />
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
};

export default EnrolledClassCard;