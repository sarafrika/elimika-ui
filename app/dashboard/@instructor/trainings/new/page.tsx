'use client'

import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { getClassDefinitionOptions, getCourseByUuidOptions, getCourseLessonsOptions } from '../../../../../services/client/@tanstack/react-query.gen';
import { ClassDetailsFormPage } from './ClassDetailsFormPage';
import { ClassPreviewFormPage } from './ClassPreviewFormPage';
import { ClassScheduleFormPage } from './ClassScheduleFormPage';

// Types
export interface ClassDetails {
    course_uuid: string,
    title: string;
    categories: string;
    class_type: string;
    rate_card: string;
    location_type: string;
    location_name: string;
    class_limit: any;
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

    const resolveId = classId ? (classId as string) : (savedClassUuid as string);

    const { data } = useQuery({
        ...getClassDefinitionOptions({ path: { uuid: resolveId } }),
        enabled: !!resolveId
    })
    const classData = data?.data

    const {
        data: courseDetail,
    } = useQuery({
        ...getCourseByUuidOptions({ path: { uuid: classData?.course_uuid as string } }),
        enabled: !!classData?.course_uuid,
    });

    const { data: courseLessons } = useQuery({
        ...getCourseLessonsOptions({ path: { courseUuid: classData?.course_uuid as string }, query: { pageable: {} } }),
        enabled: !!classData?.course_uuid
    })

    const [currentPage, setCurrentPage] = useState(1);
    const [classDetails, setClassDetails] = useState<any>(classData);

    const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings>({
        academicPeriod: { start: '', end: '' },
        registrationPeriod: { start: '', end: '' },
        startClass: { date: "", startTime: '', endTime: '' },
        allDay: false,
        repeat: {
            interval: 1,
            unit: 'day',
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

    const handleClassDetailsChange = (field: keyof ClassDetails, value: string) => {
        setClassDetails((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleScheduleChange = (updates: Partial<ScheduleSettings>) => {
        setScheduleSettings(prev => ({ ...prev, ...updates }));
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
                    />
                )}

                {currentPage === 2 && (
                    <ClassScheduleFormPage
                        classDetails={classDetails}
                        resolvedId={resolveId as string}
                        data={scheduleSettings}
                        onClassCreated={(uuid) => setSavedClassUuid(uuid)}
                        onChange={handleScheduleChange}
                    />
                )}

                {currentPage === 3 && (
                    <ClassPreviewFormPage
                        classDetails={classDetails}
                        classUuid={resolveId as string}
                        scheduleSettings={scheduleSettings}
                    />
                )}
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg">
                <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
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
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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