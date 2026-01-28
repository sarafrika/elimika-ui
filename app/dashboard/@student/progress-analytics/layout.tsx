import { Separator } from '@/components/ui/separator';

interface ProgressAnalyticsLayoutProps {
  children: React.ReactNode;
}

export default function ProgressAnalyticsLayout({ children }: ProgressAnalyticsLayoutProps) {
  return (
    <div className='space-y-8 p-4 pb-16 md:p-10'>
      <div className='flex w-full items-center justify-between lg:max-w-[75%]'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Progress Analytics</h2>
          <div className='text-muted-foreground'>
            <p className='text-muted-foreground mt-1'>
              Overview of your course progress and learning metrics
            </p>
          </div>
        </div>
      </div>

      <div className='flex flex-col gap-2 rounded-md border-l-4 border-yellow-500 bg-yellow-100 p-4 text-yellow-800 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4'>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
          <p className='font-medium'>🚧 This page is under construction.</p>
          <p className='text-sm text-yellow-900'>Mock template used here</p>
        </div>
      </div>

      <Separator />
      <div className='flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12'>
        <div className='mx-auto flex-1 lg:max-w-7xl'>{children}</div>
      </div>
    </div>
  );
}
