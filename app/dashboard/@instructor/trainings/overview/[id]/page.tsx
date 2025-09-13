'use client';

import Spinner from '@/components/ui/spinner';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import {
    getClassDefinitionOptions,
    previewRecurringClassScheduleOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

export default function ClassPreviewPage() {
    const params = useParams();
    const classId = params?.id as string;
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



    const { data } = useQuery({
        ...getClassDefinitionOptions({ path: { uuid: classId as string } }),
        enabled: !!classId,
    });
    const classData = data?.data;

    const { data: schedule, isLoading, isPending, error, isError, isSuccess } = useQuery(
        previewRecurringClassScheduleOptions({
            path: { uuid: classId },
            query: {
                startDate: '2025-09-10' as any,
                endDate: '' as any
                // startDate: classData?.default_start_time as any,
                // endDate: classData?.default_end_time as any
            },
        })
    );

    return (
        <div className="space-y-6">
            {(isLoading || isPending) ? (
                <div className='flex flex-row gap-2 items-center' >
                    <p className="animate-pulse italic">Generating class schedule...</p>
                    <Spinner className='animate-bounce' />
                </div>
            ) : (
                <>
                    {isSuccess && schedule?.message && (
                        <div>
                            <p>{schedule.message}</p>
                        </div>
                    )}
                    {isError && (
                        <div>
                            <p>{(error as { error?: string })?.error || 'An error occurred.'}</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
