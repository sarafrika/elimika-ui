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
          <div className='text-muted-foreground'>
            <p className='mt-1 text-gray-600'>Academic Achievements & Certifications </p>
          </div>
        </div>
      </div>
      <Separator />
      <div className='flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12'>
        <div className='flex-1 lg:max-w-7xl mx-auto'>{children}</div>
      </div>
    </div>
  );
}
