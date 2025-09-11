'use client';

import PageLoader from '@/components/page-loader';
import {
    getClassDefinitionOptions,
    previewRecurringClassScheduleOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

export default function ClassPreviewPage() {
    const params = useParams();
    const classId = params?.id as string;



    const { data } = useQuery({
        ...getClassDefinitionOptions({ path: { uuid: classId as string } }),
        enabled: !!classId,
    });
    const classData = data?.data;

    const { data: schedule, isLoading } = useQuery(
        previewRecurringClassScheduleOptions({
            path: { uuid: classId },
            query: {
                startDate: '2025-11-10' as any,
                endDate: '' as any
                // startDate: classData?.default_start_time as any,
                // endDate: classData?.default_end_time as any
            },
        })
    );

    return (
        <div className='space-y-6'>
            <div>This page is currently under construction</div>

            {isLoading ? <PageLoader /> : <p>{schedule?.message}</p>}
        </div>
    );
}
