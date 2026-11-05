import { surfaceTheme } from '@/components/data-display';
import { Skeleton } from '@/components/ui/skeleton';
import { SmsMessagesSkeleton } from '@/src/features/admin/pages/sms-messages-page';

export default function AdminSmsMessagesLoading() {
  return (
    <div className={`${surfaceTheme.pageWide} py-4`}>
      <div className={surfaceTheme.pageStack}>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-7 w-56' />
          <Skeleton className='h-4 w-96 max-w-full' />
        </div>
        <Skeleton className='h-20 w-full rounded-md' />
        <SmsMessagesSkeleton />
      </div>
    </div>
  );
}
