'use client'

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useInstructor } from '../../../../../context/instructor-context';
import { useClassDetails } from '../../../../../hooks/use-class-details';
import {
    createClassDefinitionMutation,
    getClassDefinitionQueryKey,
    getClassDefinitionsForInstructorQueryKey,
    updateClassDefinitionMutation
} from '../../../../../services/client/@tanstack/react-query.gen';
import { ClassDetailsSection } from './ClassDetailsSection';
import { ClassInformationSection } from './ClassInfoSection';
import { NotificationSection } from './NotificationSection';
import { PreviewSection } from './PreviewSection';
import { ScheduleSection } from './ScheduleSection';


// Types
export interface ClassDetails {
    uuid: string,
    course_uuid: string;
    title: string;
    categories: string[];
    class_type: string; // 'group' | 'private'
    location_type: string; // 'online' | 'in_person' | 'hybrid'
    rate_card: string;
    class_limit: number;
    targetAudience: string;
    location_name: string;
    startDate: string;
    endDate: string;
    allDay: boolean;
    repeatUnit: string;
    instructorName?: string,
    meeting_link: string,
    classroom: string,
    class_color: string,
    reminder: string
}

export interface ScheduleSettings {
    academicPeriod: {
        start: string;
        end: string;
    };
    registrationPeriod: {
        start: string;
        end: string;
        continuous?: boolean;
    };
    startClass: {
        date: string;
        startTime?: string;
        endTime?: string;
    };
    allDay: boolean;
    repeat: {
        interval: number;
        unit: "day" | "week" | "month" | "year";
        days?: number[];
    };
    endRepeat: string;
    alertAttendee: boolean;
    timetable: {
        days: string[];
        time: {
            duration: string;
        };
    };
    recurringOptions: string;
    timezone: string;
    classType: string;
    location: string;
    pin: string;
    classroom: string;
    totalSlots: number;
}

export interface NotificationSettings {
    reminder: string;
    classColour: string;
}

const DAY_NAMES = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const RECURRENCE_TYPE_MAP: Record<string, string> = {
    day: "DAILY",
    week: "WEEKLY",
    month: "MONTHLY",
    year: "YEARLY",
};

// Utility function to calculate occurrences
const calculateOccurrences = (
    startDate: string,
    endDate: string,
    repeatUnit: string,
    repeatInterval: number,
    selectedDays?: number[]
): number => {
    if (!startDate || !endDate) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) return 0;

    let occurrences = 0;
    let current = new Date(start);

    switch (repeatUnit) {
        case 'day':
            while (current <= end) {
                occurrences++;
                current.setDate(current.getDate() + repeatInterval);
            }
            break;

        case 'week':
            if (!selectedDays || selectedDays.length === 0) {
                occurrences = 0;
                break;
            }

            // Start from the beginning of the first week
            const startOfWeek = new Date(start);
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Monday

            let weekCursor = new Date(startOfWeek);

            while (weekCursor <= end) {
                for (const day of selectedDays) {
                    const occurrence = new Date(weekCursor);
                    occurrence.setDate(weekCursor.getDate() + day);

                    if (occurrence >= start && occurrence <= end) {
                        occurrences++;
                    }
                }
                weekCursor.setDate(weekCursor.getDate() + repeatInterval * 7);
            }
            break;

        case 'month':
            while (current <= end) {
                occurrences++;
                current.setMonth(current.getMonth() + repeatInterval);
            }
            break;

        case 'year':
            while (current <= end) {
                occurrences++;
                current.setFullYear(current.getFullYear() + repeatInterval);
            }
            break;

        default:
            occurrences = 0;
    }

    return Math.max(0, occurrences);
};

const ClassBuilderPage = () => {
    const searchParams = useSearchParams();
    const classId = searchParams.get('id');
    const qc = useQueryClient();
    const router = useRouter()
    const instructor = useInstructor();

    const [savedClassUuid, setSavedClassUuid] = useState<string | null>(null);
    const [isPreviewMode, setIsPreviewMode] = useState(false);

    const resolveId = classId || savedClassUuid;
    const { data: combinedClass, isLoading } = useClassDetails(resolveId as string);

    const classData = combinedClass?.class;
    const courseDetail = combinedClass?.course;
    const courseLessons = combinedClass?.lessons;

    const createClassDefinition = useMutation(createClassDefinitionMutation());
    const updateClassDefinition = useMutation(updateClassDefinitionMutation());

    // Class Details State
    const [classDetails, setClassDetails] = useState<ClassDetails>({
        uuid: '',
        course_uuid: '',
        title: '',
        categories: [],
        class_type: '',
        rate_card: '',
        location_type: '',
        location_name: '',
        class_limit: 0,
        targetAudience: '',
        allDay: false,
        endDate: '',
        repeatUnit: '1',
        startDate: '',
        instructorName: instructor?.full_name,
        class_color: '',
        classroom: '',
        meeting_link: '',
        reminder: ''
    });

    // Schedule Settings State
    const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings>({
        academicPeriod: { start: '', end: '' },
        registrationPeriod: { start: '', end: '', continuous: false },
        startClass: { date: "", startTime: '', endTime: '' },
        allDay: false,
        repeat: {
            interval: 1,
            unit: 'week',
            days: []
        },
        endRepeat: '',
        alertAttendee: false,
        timetable: {
            days: [],
            time: { duration: '' }
        },
        recurringOptions: '',
        timezone: '',
        classType: '',
        location: '',
        pin: '',
        classroom: '',
        totalSlots: 0
    });

    // Notification Settings State
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
        reminder: '',
        classColour: ''
    });

    // Sync fetched data to state
    useEffect(() => {
        if (classData && !isLoading) {
            setClassDetails({
                uuid: classData?.uuid || '',
                course_uuid: classData?.course_uuid as string,
                title: classData?.title || '',
                categories: Array.isArray(classData?.categories)
                    ? classData?.categories
                    : classData?.categories ? [classData.categories] : [],
                class_type: classData.class_visibility || '',
                rate_card: classData.rate_card || classData?.training_fee,
                location_type: classData.location_type || classData?.session_format,
                location_name: classData.location_name || '',
                class_limit: classData.max_participants || 0,
                targetAudience: classData?.targetAudience || '',
                instructorName: instructor?.full_name,
                startDate: '',
                repeatUnit: '',
                endDate: '',
                allDay: false,
                class_color: '',
                classroom: '',
                meeting_link: '',
                reminder: ''
            });

            if (classData.default_start_time) {
                const startDate = new Date(classData.default_start_time);
                const endDate = new Date(classData.default_end_time);

                setScheduleSettings((prev: any) => ({
                    ...prev,
                    startClass: {
                        date: startDate.toISOString().split('T')[0],
                        startTime: startDate.toTimeString().slice(0, 5),
                        endTime: endDate.toTimeString().slice(0, 5)
                    }
                }));
            }
        }
    }, [classData, isLoading, courseDetail]);

    // Calculate occurrence count
    const occurrenceCount = calculateOccurrences(
        scheduleSettings.startClass.date,
        scheduleSettings.endRepeat,
        scheduleSettings.repeat.unit,
        scheduleSettings.repeat.interval,
        scheduleSettings.repeat.unit === 'week' ? scheduleSettings.repeat.days : undefined
    );

    // Form Validation
    const isFormValid = (): boolean => {
        if (!classDetails?.course_uuid || !classDetails?.title) {
            toast.error("Please complete Class Details");
            return false;
        }
        if (!scheduleSettings.startClass.date || !scheduleSettings.startClass.startTime || !scheduleSettings.startClass.endTime) {
            toast.error("Please fill in all schedule fields");
            return false;
        }
        if (scheduleSettings.repeat.unit === "week" && (!scheduleSettings.repeat.days || scheduleSettings.repeat.days.length === 0)) {
            toast.error("Please select at least one day of the week");
            return false;
        }
        if (!scheduleSettings.endRepeat) {
            toast.error("Please set an end date for the recurrence");
            return false;
        }
        if (occurrenceCount === 0) {
            toast.error("Invalid date range or recurrence settings");
            return false;
        }
        return true;
    };

    // Handle Form Submit
    const handleSubmit = (e: FormEvent<HTMLFormElement>, isDraft: boolean = false) => {
        e.preventDefault();

        if (!isFormValid()) return;

        try {
            const start_time = new Date(`${scheduleSettings.startClass.date}T${scheduleSettings.startClass.startTime}:00Z`).toISOString();
            const end_time = new Date(`${scheduleSettings.startClass.date}T${scheduleSettings.startClass.endTime}:00Z`).toISOString();

            const selectedDays = scheduleSettings.repeat.days || [];
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
                is_active: !isDraft,
                default_start_time: start_time,
                default_end_time: end_time,
                meeting_link: '',
                session_templates: [
                    {
                        start_time: start_time,
                        end_time: end_time,
                        recurrence: {
                            recurrence_type: RECURRENCE_TYPE_MAP[scheduleSettings.repeat.unit],
                            interval_value: scheduleSettings.repeat.interval,
                            days_of_week: days_of_week || undefined,
                            occurrence_count: occurrenceCount
                        },
                        conflict_resolution: "FAIL"
                    }
                ]
            };

            if (resolveId) {
                updateClassDefinition.mutate(
                    { path: { uuid: resolveId }, body: payload as any },
                    {
                        onSuccess: (response) => {
                            qc.invalidateQueries({
                                queryKey: getClassDefinitionsForInstructorQueryKey({
                                    path: { instructorUuid: instructor?.uuid as string },
                                }),
                            });

                            qc.invalidateQueries({
                                queryKey: getClassDefinitionQueryKey({
                                    path: { uuid: resolveId },
                                }),
                            });

                            toast.success(isDraft ? "Class saved as draft" : "Class updated successfully");

                            router.push('/dashboard/trainings')
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
                                setSavedClassUuid(savedUuid);
                            }

                            qc.invalidateQueries({
                                queryKey: getClassDefinitionsForInstructorQueryKey({
                                    path: { instructorUuid: instructor?.uuid as string },
                                }),
                            });

                            toast.success(isDraft ? "Class saved as draft" : "Class created successfully");
                            router.push('/dashboard/trainings')

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
        <div className="min-h-screen bg-background py-8 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Class Builder</h1>
                    <p className="text-muted-foreground">
                        Create and customize your training class with all required details, schedule, and notifications.
                    </p>
                </div>

                {isLoading ? <ClassFormSkeleton /> :
                    <>
                        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
                            <div className='flex flex-end items-center justify-between' >
                                <Button variant={"outline"} onClick={() => router.push('/dashboard/trainings')} >
                                    <ArrowLeft />

                                    Back
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleSubmit(e as any, true);
                                    }}
                                    disabled={createClassDefinition.isPending || updateClassDefinition.isPending}
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    Save as Draft
                                </Button>
                            </div>

                            {/* Class Details Section */}
                            <ClassDetailsSection
                                data={classDetails}
                                onChange={(updates) => setClassDetails(prev => ({ ...prev, ...updates }))}
                                courseDetail={courseDetail}
                            />

                            {/* Schedule Section */}
                            <ScheduleSection
                                data={scheduleSettings}
                                onChange={(updates) => setScheduleSettings(prev => ({ ...prev, ...updates }))}
                                occurrenceCount={occurrenceCount}
                            />

                            {/* Class Information Section */}
                            <ClassInformationSection
                                data={classDetails}
                                onChange={(updates) => setClassDetails(prev => ({ ...prev, ...updates }))}
                            />

                            {/* Notification Section */}
                            <NotificationSection
                                data={notificationSettings}
                                onChange={(updates) => setNotificationSettings(prev => ({ ...prev, ...updates }))}
                            />

                            {/* Preview Section */}
                            {isPreviewMode && (
                                <PreviewSection
                                    classDetails={classDetails}
                                    scheduleSettings={scheduleSettings}
                                    courseData={courseDetail?.data}
                                    courseLessons={courseLessons?.data?.content}
                                    occurrenceCount={occurrenceCount}
                                />
                            )}

                            {/* Action Buttons */}
                            <Card className="p-6 border shadow-sm flex items-end justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsPreviewMode(!isPreviewMode)}
                                    >
                                        {isPreviewMode ? 'Hide Preview' : 'Show Preview'}
                                    </Button>

                                    <Button
                                        type="submit"
                                        disabled={createClassDefinition.isPending || updateClassDefinition.isPending}
                                        className="px-8"
                                    >
                                        {(createClassDefinition.isPending || updateClassDefinition.isPending)
                                            ? "Publishing..."
                                            : "Publish Class"}
                                    </Button>
                                </div>
                            </Card>
                        </form>
                    </>
                }
            </div>
        </div>
    );
};

export default ClassBuilderPage;


const ClassFormSkeleton = () => {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Top Publish Button */}
            <div className="flex justify-end">
                <div className="h-10 w-40 rounded-md bg-muted" />
            </div>

            {/* Class Details Section */}
            <Card className="p-6 space-y-4">
                <div className="h-5 w-1/3 bg-muted rounded" />
                <div className="h-10 w-full bg-muted rounded" />
                <div className="h-10 w-full bg-muted rounded" />
            </Card>

            {/* Schedule Section */}
            <Card className="p-6 space-y-4">
                <div className="h-5 w-1/4 bg-muted rounded" />
                <div className="h-10 w-full bg-muted rounded" />
                <div className="h-10 w-1/2 bg-muted rounded" />
            </Card>

            {/* Class Information Section */}
            <Card className="p-6 space-y-4">
                <div className="h-5 w-1/3 bg-muted rounded" />
                <div className="h-24 w-full bg-muted rounded" />
            </Card>

            {/* Notification Section */}
            <Card className="p-6 space-y-4">
                <div className="h-5 w-1/4 bg-muted rounded" />
                <div className="h-10 w-full bg-muted rounded" />
            </Card>

            {/* Action Buttons */}
            <Card className="p-6 flex justify-between">
                <div className="flex gap-3">
                    <div className="h-10 w-36 bg-muted rounded" />
                    <div className="h-10 w-36 bg-muted rounded" />
                </div>
            </Card>
        </div>
    );
};
