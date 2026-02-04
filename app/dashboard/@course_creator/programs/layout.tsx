'use client';

import { Separator } from '@/components/ui/separator';

interface ProgramManagementLayoutProps {
    children: React.ReactNode;
}


export default function ProgramManagementLayout({ children }: ProgramManagementLayoutProps) {
    return (
        <div className='space-y-6 p-4 pb-16 md:py-10'>
            <div className='flex items-center justify-between'>
                <div>
                    <h2 className='text-[22px] font-bold tracking-tight'>
                        Training Programs
                    </h2>
                    <p className='text-muted-foreground text-[14px]'>
                        Bundle courses together to create certificate, diploma or degree training programs
                    </p>
                </div>
            </div>
            <Separator />
            <div className='flex flex-col space-y-8 lg:flex-col lg:space-y-0 lg:space-x-6'>
                {children}
            </div>
        </div>
    );
}
