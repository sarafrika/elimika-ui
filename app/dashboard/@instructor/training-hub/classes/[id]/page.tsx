// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
'use client';

import { AlertTriangle } from 'lucide-react';
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useClassDetails } from '../../../../../../hooks/use-class-details';
import ClassCourseDetailsPage from '../../../../workspace/[domain]/courses/_components/ClassCourseDetailsPage';
import ClassProgramDetailsPage from '../../../../workspace/[domain]/courses/_components/ClassProgramDetaisPage';

type Props = {
    params: Promise<{ domain: string; id: string }>;
};

function PageNotFound() {
    return <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="w-full max-w-md rounded-xl border bg-card p-6 text-center shadow-sm">

            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="h-6 w-6" />
            </div>

            <h2 className="text-lg font-semibold text-foreground">
                Unable to load class
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                We couldn’t retrieve the class information at this time.
                This may be due to a network issue or the class may no longer exist.
            </p>

            <div className="mt-5 flex items-center justify-center gap-3">
                <button
                    onClick={() => window.location.reload()}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                    Try again
                </button>

                <button
                    onClick={() => window.history.back()}
                    className="rounded-md border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                    Go back
                </button>
            </div>
        </div>
    </div>
}

export default function TrainingHubClassCoursePage({ params }: Props) {
    const resolvedParams = React.use(params);
    const { id: classId } = resolvedParams;

    const { data: classData, isLoading, isError } = useClassDetails(classId);

    if (isLoading && !classData) {
        return (
            <div className="space-y-4 px-4 py-6 sm:px-6">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96 max-w-full" />
                <Skeleton className="h-64 rounded-xl" />
                <div className="grid gap-4 md:grid-cols-2">
                    <Skeleton className="h-40 rounded-xl" />
                    <Skeleton className="h-40 rounded-xl" />
                </div>
            </div>
        );
    }

    if (isError || !classData) {
        return <PageNotFound />;
    }

    if (classData?.course?.uuid) {
        return (
            <ClassCourseDetailsPage
                courseId={classData.course.uuid}
                classData={classData}
                type={'class'}
            />
        );
    }

    if (classData?.program?.uuid) {
        return (
            <ClassProgramDetailsPage
                programId={classData.program.uuid}
                classData={classData}
                type={"class"}
            />
        );
    }

    return <PageNotFound />;
}

