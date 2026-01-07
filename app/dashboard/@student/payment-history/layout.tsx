import { Separator } from '@/components/ui/separator';

interface PaymentHistoryLayoutProps {
  children: React.ReactNode;
}

export default function PaymentHistoryLayout({ children }: PaymentHistoryLayoutProps) {
  return (
    <div className='space-y-8 p-4 pb-16 md:p-10'>
      <div className='flex w-full items-center justify-between lg:max-w-[75%]'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Payment History</h2>
          <div className='text-muted-foreground'>
            <p className="mt-1 text-muted-foreground">
              View and manage your past payments and transactions
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
