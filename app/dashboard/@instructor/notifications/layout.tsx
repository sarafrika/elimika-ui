'use client';

import { Separator } from '@/components/ui/separator';

interface NotificationsLayoutProps {
    children: React.ReactNode;
}

export default function NotificationsLayout({ children }: NotificationsLayoutProps) {
    return (
        <div className='space-y-6 p-4 pb-16 md:p-10'>
            <div className='flex items-center justify-between'>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
                    <p className="text-muted-foreground">
                        Stay informed with real-time updates on new bookings, student messages, and important account activity.
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
