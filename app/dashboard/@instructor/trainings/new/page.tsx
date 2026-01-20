'use client'

import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getClassDefinitionOptions, getCourseByUuidOptions, getCourseLessonsOptions } from '../../../../../services/client/@tanstack/react-query.gen';
import { ClassDetailsFormPage } from './ClassDetailsFormPage';
import { ClassPreviewFormPage } from './ClassPreviewFormPage';
import { ClassScheduleFormPage } from './ClassScheduleFormPage';

// Types
export interface ClassDetails {
    course_uuid: string;
    title: string;
    categories: string[];
    class_type: string;
    rate_card: string;
    location_type: string;
    location_name: string;
    class_limit: number;
    targetAudience: string;
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

const ClassBuilderPage = () => {
    const searchParams = useSearchParams();
    const classId = searchParams.get('id');
    const [savedClassUuid, setSavedClassUuid] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const resolveId = classId || savedClassUuid;

    // Fetch class definition if editing
    const { data: classDefinitionData, isLoading: isLoadingClass } = useQuery({
        ...getClassDefinitionOptions({ path: { uuid: resolveId as string } }),
        enabled: !!resolveId
    });
    const classData = classDefinitionData?.data;

    // Fetch course details
    const { data: courseDetail } = useQuery({
        ...getCourseByUuidOptions({ path: { uuid: classData?.course_uuid as string } }),
        enabled: !!classData?.course_uuid,
    });

    // Fetch course lessons
    const { data: courseLessons } = useQuery({
        ...getCourseLessonsOptions({
            path: { courseUuid: classData?.course_uuid as string },
            query: { pageable: {} }
        }),
        enabled: !!classData?.course_uuid
    });

    // Initialize class details state
    const [classDetails, setClassDetails] = useState<ClassDetails>({
        course_uuid: '',
        title: '',
        categories: [],
        class_type: '',
        rate_card: '',
        location_type: '',
        location_name: '',
        class_limit: 0,
        targetAudience: ''
    });

    // Initialize schedule settings state
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

    // Sync fetched class data to state when editing
    useEffect(() => {
        if (classData && !isLoadingClass) {
            setClassDetails({
                course_uuid: classData.course_uuid || '',
                title: classData.title || '',
                categories: Array.isArray(classData.categories)
                    ? classData.categories
                    : classData.categories
                        ? [classData.categories]
                        : [],
                class_type: classData.class_type || '',
                rate_card: classData.rate_card || classData?.training_fee,
                location_type: classData.location_type || '',
                location_name: classData.location_name || '',
                class_limit: classData.max_participants || courseDetail?.data?.class_limit || 0,
                targetAudience: classData.targetAudience || '',
            });

            // Parse schedule data if available
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
    }, [classData, isLoadingClass, courseDetail]);

    const handleClassDetailsChange = (updates: Partial<ClassDetails>) => {
        setClassDetails(prev => ({ ...prev, ...updates }));
    };

    const handleScheduleChange = (updates: Partial<ScheduleSettings>) => {
        setScheduleSettings(prev => ({ ...prev, ...updates }));
    };

    const handleClassCreated = (uuid: string) => {
        setSavedClassUuid(uuid);
    };

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(3, prev + 1));
    };

    const handlePreviousPage = () => {
        setCurrentPage(prev => Math.max(1, prev - 1));
    };

    const totalPages = 3;

    return (
        <div className="min-h-screen bg-background">
            <div className="bg-card border-b border-border shadow-sm">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <h1 className="text-3xl font-bold text-foreground">Class Builder</h1>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <span className={currentPage >= 1 ? 'text-primary font-semibold' : ''}>
                            Class Details
                        </span>
                        <span>→</span>
                        <span className={currentPage >= 2 ? 'text-primary font-semibold' : ''}>
                            Schedule
                        </span>
                        <span>→</span>
                        <span className={currentPage >= 3 ? 'text-primary font-semibold' : ''}>
                            Preview
                        </span>
                    </div>
                </div>
            </div>

            <div className="py-8 pb-28">
                {currentPage === 1 && (
                    <ClassDetailsFormPage
                        data={classDetails}
                        onChange={handleClassDetailsChange}
                        onNext={handleNextPage}
                    />
                )}

                {currentPage === 2 && (
                    <ClassScheduleFormPage
                        classDetails={classDetails}
                        resolvedId={resolveId as string}
                        data={scheduleSettings}
                        onClassCreated={handleClassCreated}
                        onChange={handleScheduleChange}
                        onNext={handleNextPage}
                    />
                )}

                {currentPage === 3 && (
                    <ClassPreviewFormPage
                        classDetails={classDetails}
                        classUuid={resolveId as string}
                        scheduleSettings={scheduleSettings}
                        courseData={courseDetail?.data}
                        courseLessons={courseLessons?.data?.content}
                    />
                )}
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg">
                <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Button
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                        variant="outline"
                        className="flex items-center gap-2"
                    >
                        <ChevronLeft size={20} />
                        Previous
                    </Button>

                    <div className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </div>

                    <Button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-2"
                    >
                        Next
                        <ChevronRight size={20} />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ClassBuilderPage;