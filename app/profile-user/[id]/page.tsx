'use client';

import { PublicTopNav } from '@/components/PublicTopNav';
import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';
import PublicUserProfilePage from '../public-user-profile';


export default function PublicProfilePage() {
    return (
        <div className="bg-background text-foreground min-h-screen">
            <PublicTopNav />
            <Suspense
                fallback={
                    <div className="mx-auto w-full max-w-5xl px-6 py-12 lg:py-16">
                        <Skeleton className="h-[420px] w-full rounded-[28px]" />
                    </div>
                }
            >
                <div className="mx-auto w-full max-w-6xl px-6 py-12 lg:py-16">
                    <PublicUserProfilePage />
                </div>
            </Suspense>
        </div>
    );
}