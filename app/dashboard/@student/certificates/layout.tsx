'use client';

import { Separator } from '@/components/ui/separator';

interface CertificateLayoutProps {
    children: React.ReactNode;
}

export default function CertificateLayout({ children }: CertificateLayoutProps) {
    return (
        <div className='space-y-8 p-4 pb-16 md:p-10'>
            <div className='flex w-full items-center justify-between lg:max-w-[75%]'>
                <div>
                    <h2 className='text-2xl font-bold tracking-tight'>My Certificates</h2>
                    <p className='text-muted-foreground'>
                        <p className="text-gray-600 mt-1">
                            Academic Achievements & Certifications                        </p>
                    </p>
                </div>
            </div>
            <Separator />
            <div className='flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12'>
                <div className='flex-1 lg:max-w-6xl'>{children}</div>
            </div>
        </div>
    );
}
