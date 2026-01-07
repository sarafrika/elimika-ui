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
            <p className="mt-1 text-muted-foreground">
              Overview of your course progress and learning metrics
            </p>
          </div>
        </div>
      </div>
      <Separator />
      <div className='flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12'>
        <div className='mx-auto flex-1 lg:max-w-7xl'>{children}</div>
      </div>
    </div>
  );
}
