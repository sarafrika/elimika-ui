import { Skeleton } from '@/components/ui/skeleton'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, ClipboardList, DollarSign, Hourglass } from 'lucide-react'
import HTMLTextPreview from '../../../../../components/editors/html-text-preview'
import { getCourseByUuidOptions } from '../../../../../services/client/@tanstack/react-query.gen'

type Props = {
    courseUuid: string
}

export default function ClassCourseDisplay({ courseUuid }: Props) {
    const {
        data: courseDetail,
        isLoading,
        isError,
        error,
    } = useQuery({
        ...getCourseByUuidOptions({ path: { uuid: courseUuid } }),
        enabled: !!courseUuid,
    })

    const course = courseDetail?.data

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
                {/* Optionally: display error?.message */}
            </div>
        )
    }

    if (!course) {
        return <div className='text-muted-foreground text-sm'>Course not found.</div>
    }

    return (
        <div className="space-y-2.5 text-sm text-muted-foreground">
            <div className="text-base text-foreground">Course Details</div>

            <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span>{course?.name}</span>
            </div>

            <div className="flex items-start gap-2">
                <ClipboardList className="w-4 h-4 mt-0.5" />
                <div className="flex-1">
                    <HTMLTextPreview htmlContent={course?.prerequisites as string} />
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Hourglass className="w-4 h-4" />
                <span>{course?.total_duration_display || 'N/A'}</span>
            </div>

            <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span>{Number(course?.price || 0).toLocaleString()} KES</span>
            </div>
        </div>
    )
}
