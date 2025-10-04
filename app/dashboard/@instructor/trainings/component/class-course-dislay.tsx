import { Badge } from '@/components/ui/badge'
import { CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useInstructorInfo } from '@/hooks/use-instructor-info'
import { getCourseByUuidOptions, getCourseLessonsOptions } from '@/services/client/@tanstack/react-query.gen'
import { useQuery } from '@tanstack/react-query'
import { Calendar, Clock, MapPin, Users } from 'lucide-react'

type Props = {
    courseUuid: string
    classInfo: any
}

export default function ClassCourseDisplay({ courseUuid, classInfo }: Props) {
    const { data: courseDetail, isLoading, isError } = useQuery({
        ...getCourseByUuidOptions({ path: { uuid: courseUuid } }),
        enabled: !!courseUuid,
    })
    const course = courseDetail?.data

    const { data: courseLessons } = useQuery({
        ...getCourseLessonsOptions({
            path: { courseUuid },
            query: { pageable: { page: 0, size: 100 } },
        }),
        enabled: !!courseUuid,
    });

    const { instructorInfo } = useInstructorInfo({ instructorUuid: classInfo?.default_instructor_uuid as string })

    if (isLoading) {
        return (
            <div className='space-y-2'>
                <Skeleton className='h-4 w-2/3' />
                <Skeleton className='h-4 w-1/2' />
                <Skeleton className='h-4 w-1/4' />
            </div>
        )
    }

    if (isError) {
        return (
            <div className='text-red-500 text-sm'>
                Failed to load course details.
            </div>
        )
    }

    if (!course) {
        return <div className='text-muted-foreground text-sm'>Course not found.</div>
    }

    return (
        <>
            <div className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2">{course?.name}</CardTitle>
                        {/* {classData.subtitle && (
                      <p className="text-muted-foreground mt-1">{classData.subtitle}</p>
                    )} */}

                        {/* <div className="flex items-start gap-2">
                            <ClipboardList className="w-4 h-4 mt-0.5" />
                            <div className="flex-1">
                                <HTMLTextPreview htmlContent={course?.prerequisites as string} />
                            </div>
                        </div> */}
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <Badge variant={course?.status === 'published' ? 'default' : 'secondary'}>
                    {`${course?.status?.charAt(0).toUpperCase() + course?.status?.slice(1)} Course`}
                </Badge>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span className='italic'>
                        e.g: Sep 1, 2025 - Dec 15, 2025
                    </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>
                        {classInfo.default_start_time} - {classInfo.default_end_time}
                    </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {/* @ts-ignore */}
                    <span>Instructor: {instructorInfo?.data?.full_name}</span>
                </div>

                {classInfo.location_type && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{classInfo.location_type} • {classInfo.max_participants} students</span>
                    </div>
                )}

                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>
                            {courseLessons?.data?.content?.length}{"  "}
                            {courseLessons?.data?.content?.length === 1 ? "lesson" : "lessons"} • {course?.total_duration_display}
                        </span>

                    </div>
                    {!course?.is_free ? (
                        <div className="flex items-center gap-1">
                            <span>${course?.price}</span>
                        </div>
                    ) : "Free class"}
                </div>

                {/* <div className='space-y-3' >
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Repeat className="w-4 h-4" />
                        <span>
                            <RecurrenceDaysCell recurrenceUuid={classInfo.recurrence_pattern_uuid} />
                        </span>
                    </div>
                </div> */}

                <div className="flex flex-wrap gap-1">
                    <div className="flex flex-wrap gap-2">
                        {course?.category_names?.map((category: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                                {category}
                            </Badge>
                        ))}
                    </div>

                    {/* {classData.targetAudience.map((audience, index) => (
                        <Badge key={index} variant="outline" className="text-xs">{audience}</Badge>
                    ))} */}
                </div>
            </div>
        </>
    )
}
