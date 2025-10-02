'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Spinner from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useInstructor } from '@/context/instructor-context';
import {
    getClassDefinitionOptions,
    previewRecurringClassScheduleOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, CheckCircle, ClipboardList, Hourglass, Send, Timer, Users } from 'lucide-react';
import moment from 'moment';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import ClassScheduleList from '../../component/schedule-list';


const localizer = momentLocalizer(moment);

export default function ClassPreviewPage() {
    const params = useParams();
    const classId = params?.id as string;
    const instructor = useInstructor()
    const { replaceBreadcrumbs } = useBreadcrumb();


    useEffect(() => {
        if (!classId) return;

        replaceBreadcrumbs([
            { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
            {
                id: 'trainings',
                title: 'Training Classes',
                url: '/dashboard/trainings',
            },
            {
                id: 'preview-training',
                title: 'Preview',
                url: `/dashboard/trainings/overview/${classId}`,
                isLast: true,
            },
        ]);
    }, [replaceBreadcrumbs, classId]);

    const [date, setDate] = useState(new Date());
    const [view, setView] = useState(Views.MONTH);

    const handleToday = () => {
        setDate(new Date());
    };

    const handlePrev = () => {
        const newDate = moment(date).subtract(1, view === 'month' ? 'month' : view === 'week' ? 'week' : 'day').toDate();
        setDate(newDate);
    };

    const handleNext = () => {
        const newDate = moment(date).add(1, view === 'month' ? 'month' : view === 'week' ? 'week' : 'day').toDate();
        setDate(newDate);
    };

    const handleViewChange = (newView: any) => {
        setView(newView);
    };

    const { data } = useQuery({
        ...getClassDefinitionOptions({ path: { uuid: classId as string } }),
        enabled: !!classId,
    });
    const classData = data?.data;

    const { data: schedule, isLoading, isPending, error, isError, isSuccess, refetch } = useQuery(
        previewRecurringClassScheduleOptions({
            path: { uuid: classId as string },
            query: {
                startDate: '2025-09-27' as any,
                endDate: '' as any
                // startDate: classData?.default_start_time as any,
                // endDate: classData?.default_end_time as any
            },
        })
    );

    useEffect(() => {
        refetch();
    }, [classId, refetch])

    const classInfo = {
        title: "Advanced Mathematics",
        identifier: "Math 301 - Section A",
        date: "September 20, 2025",
        time: "10:00 AM - 11:30 AM",
        location: "Room 204, Building B",
        instructor: "Dr. Jane Smith",
    };

    const courseInfo = {
        name: "Advanced Mathematics",
        description: "An in-depth study of calculus, linear algebra, and differential equations.",
        credits: 4,
        prerequisites: "Calculus II",
    };

    return (
        <div className="space-y-6">
            <Tabs defaultValue="details" className="space-y-4">
                <TabsList className="w-full justify-start gap-2">
                    <TabsTrigger value="details" className="py-1.5 flex items-center gap-2">
                        <ClipboardList className="w-4 h-4" />
                        Class Details
                    </TabsTrigger>

                    <TabsTrigger value="waiting-list" className="py-1.5 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Waiting List
                    </TabsTrigger>

                    <TabsTrigger value="schedule" className="py-1.5 flex items-center gap-2">
                        <CalendarDays className="w-4 h-4" />
                        Class Schedule
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="details">
                    <div className="mx-auto bg-white shadow-md rounded-lg p-6 font-sans">
                        {/* Header */}
                        <div className="flex flex-col border-b pb-4 mb-4 gap-1.5">
                            <h1 className="text-2xl font-bold text-gray-900">{classData?.title}</h1>
                            <p className="text-sm text-gray-600">{classInfo.identifier}</p>
                            <div className="flex items-center space-x-4 mt-5 sm:mt-0">
                                {classData?.is_active ? (
                                    <div className="flex items-center text-green-700 font-semibold text-lg">
                                        <CheckCircle className="mr-2" /> Active
                                    </div>
                                ) : (
                                    <div className="flex items-center text-red-600 font-semibold text-lg">
                                        <Timer className="mr-2" /> Inactive
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Class Info */}
                        <section className="mb-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-2">Class Details</h2>
                            <ul className="text-gray-700 space-y-1">
                                <li><strong>Date:</strong> {classInfo.date}</li>
                                <li><strong>Time:</strong> {classInfo.time}</li>
                                <li><strong>Duration:</strong> {classData?.duration_formatted}</li>
                                <li><strong>Location:</strong> {classData?.location_type}</li>
                                <li><strong>Capacity:</strong> {classData?.capacity_info}</li>


                                <li><strong>Instructor:</strong> {instructor?.full_name}</li>
                            </ul>
                        </section>

                        {/* Course Info */}
                        <section className="mb-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-2">Course Information</h2>
                            {/* <p className="text-gray-700 mb-2">{courseInfo.description}</p>
                            <ul className="text-gray-700 space-y-1">
                                <li><strong>Course Name:</strong> {courseInfo.name}</li>
                                <li><strong>Credits:</strong> {courseInfo.credits}</li>
                                <li><strong>Prerequisites:</strong> {courseInfo.prerequisites || "None"}</li>
                            </ul> */}
                        </section>

                        {/* Actions */}
                        <div className="flex justify-end space-x-3">
                            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                                Enroll Students
                            </button>
                        </div>
                    </div>


                </TabsContent>

                <TabsContent value="waiting-list">
                    <div className="flex justify-end w-full gap-4">
                        <Button
                            variant="default"
                            onClick={() => { }}
                            className="my-4"
                        >
                            Send Invite  <Send className="ml-0.5" />
                        </Button>
                    </div>

                    <Card className="space-y-4 p-4 pb-20 justify-center items-center">
                        <div className='flex flex-col gap-3 items-center justify-center' >
                            <div className='flex flex-row mt-10'>
                                <Users className="w-4 h-4" />
                                <Hourglass className="w-4 h-4" />
                            </div>
                            <p className="text-sm italic">No one is currently on the waiting list.</p>
                        </div>

                    </Card>
                </TabsContent>

                <TabsContent value="schedule">
                    <div>
                        {(isLoading || isPending) ? (
                            <div className='flex flex-row gap-2 items-center' >
                                <p className="animate-pulse italic">Generating class schedule...</p>
                                <Spinner className='animate-bounce' />
                            </div>
                        ) : (
                            <>
                                {isSuccess && schedule?.message && (
                                    <div>
                                        {schedule?.data?.length === 0 ? (
                                            <div className="text-yellow-600 py-2">
                                                <p>{schedule.message}</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <div style={{ marginBottom: 16, display: 'flex', gap: 10 }}>
                                                    <button onClick={handleToday}>Today</button>
                                                    <button onClick={handlePrev}>Previous</button>
                                                    <button onClick={handleNext}>Next</button>
                                                    <button onClick={() => handleViewChange(Views.MONTH)}>Month</button>
                                                    <button onClick={() => handleViewChange(Views.WEEK)}>Week</button>
                                                    <button onClick={() => handleViewChange(Views.DAY)}>Day</button>
                                                </div>

                                                <Calendar
                                                    localizer={localizer}
                                                    events={
                                                        schedule?.data?.map((item) => ({
                                                            title: item.title || 'Scheduled Class',
                                                            start: new Date(item.start_time),
                                                            end: new Date(item.end_time),
                                                            resource: {
                                                                location: item.location_type || 'Unknown',
                                                                instructor: item.instructor_uuid || 'TBA',
                                                            },
                                                        })) || []
                                                    }
                                                    startAccessor="start"
                                                    endAccessor="end"
                                                    style={{ height: 600 }}
                                                    date={date}
                                                    view={view}
                                                    onNavigate={(newDate) => setDate(newDate)}
                                                    onView={(newView) => setView(newView as any)}
                                                    views={[Views.MONTH, Views.WEEK, Views.DAY]}
                                                    eventPropGetter={(event, start, end, isSelected) => {
                                                        const backgroundColor = event.resource?.location === 'ONLINE' ? '#E0F7FA' : '#E8F5E9';
                                                        const borderColor = isSelected ? '#2E7D32' : '#A5D6A7';
                                                        return {
                                                            style: {
                                                                backgroundColor,
                                                                border: `1px solid ${borderColor}`,
                                                                color: '#1B5E20',
                                                                borderRadius: '4px',
                                                                padding: '2px 4px',
                                                                fontWeight: 500,
                                                                fontSize: '0.85rem',
                                                            },
                                                        };
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}


                                <ClassScheduleList schedules={schedule?.data as any} />;


                                {isError && (
                                    <div className="text-red-600 py-2">
                                        <p>{(error as { error?: string })?.error || 'An error occurred.'}</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
