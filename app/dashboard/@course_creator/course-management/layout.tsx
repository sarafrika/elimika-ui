'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';

interface CourseManagementLayoutProps {
  children: React.ReactNode;
}

const sidebarNavItems = [
  {
    title: 'Drafts',
    href: '/dashboard/course-management/drafts',
  },
  {
    title: 'Published',
    href: '/dashboard/course-management/published',
  },
];

const navItems = [
  { label: 'All', href: '/dashboard/course-management/all' },
  { label: 'Drafts', href: '/dashboard/course-management/drafts' },
  { label: 'Published', href: '/dashboard/course-management/published' },
];

export default function CourseManagementLayout({ children }: CourseManagementLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const hideNav = pathname.startsWith('/dashboard/course-management/create-new-course');

  return (
    <div className='space-y-6 p-4 pb-16 md:py-10'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-[22px] font-bold tracking-tight'>Course Management</h2>
          <p className='text-muted-foreground text-[14px]'>
            Manage your course drafts and published courses.
          </p>
        </div>
      </div>
      <Separator />
      <div className='flex flex-col space-y-8 lg:flex-col lg:space-y-0 lg:space-x-6'>
        {/* {!hideNav && (
          <aside className=''>
            <nav className='flex space-x-2 lg:mb-6 lg:flex-row lg:space-y-1 lg:space-x-6'>
              {sidebarNavItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    buttonVariants({ variant: 'ghost' }),
                    pathname === item.href
                      ? 'bg-muted hover:bg-muted'
                      : 'hover:bg-transparent hover:underline',
                    'justify-start lg:min-w-[200px] lg:justify-center'
                  )}
                >
                  {item.title}
                </Link>
              ))}
            </nav>
          </aside>
        )} */}
        <div className='lg:auto w-full flex-1'>
          {!hideNav && (
            <div className='mx-auto flex w-6xl gap-4 rounded-xl p-2'>
              {navItems.map(item => {
                const isActive = pathname === item.href;

                return (
                  <Button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    variant='ghost'
                    className={cn(
                      'rounded-lg transition-colors',
                      'bg-muted/100 hover:bg-muted',
                      'text-muted-foreground minw-fit px-5 py-2',
                      isActive && 'bg-primary text-primary-foreground hover:bg-primary'
                    )}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}
