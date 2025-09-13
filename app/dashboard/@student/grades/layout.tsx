'use client';

import { Separator } from '@/components/ui/separator';

interface GradesLayoutProps {
    children: React.ReactNode;
}

export default function GradesLayout({ children }: GradesLayoutProps) {
    return (
        <div className='space-y-8 p-4 pb-16 md:p-10'>
            <div className='flex w-full items-center justify-between lg:max-w-[75%]'>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">My Grades</h2>
                    <p className="text-gray-600 mt-1">
                        Review your course performance, final grades, and achievements. Grades reflect your progress and completion status across enrolled programs.
                    </p>
                </div>

            </div>
            <Separator />
            <div className='flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12'>
                <div className='flex-1 lg:max-w-4xl'>{children}</div>
            </div>
        </div>
    );
}
