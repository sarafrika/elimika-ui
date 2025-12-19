'use client';

import Link from 'next/link';
import { useIsMobile } from '@/hooks/use-mobile';
import { AppBreadcrumb } from '@/components/ui/app-breadcrumb';
import { DomainSwitcher } from '@/components/domain-switcher';
import { ThemeSwitcher } from '@/components/theme-switcher';

// export default function DashboardTopBar({
//   showToggle = true,
// }: {
//   showToggle?: boolean
// }) {
//   const isMobile = useIsMobile()

//   if (!showToggle) {
//     return (
//       <div className="mb-2 flex items-center justify-between px-6 pt-4">
//         {!isMobile && <AppBreadcrumb />}
//       </div>
//     )
//   }

//   return (
//     <div className="mb-2 flex items-center justify-between px-6 pt-4">
//       {!isMobile && <AppBreadcrumb />}
//       <DashboardViewSwitcher />
//     </div>
//   )
// }

// fixed topbar
export default function DashboardTopBar({ showToggle = true }: { showToggle?: boolean }) {
  const isMobile = useIsMobile();

  return (
    <div className='bg-opacity-80 sticky top-0 z-40 flex items-center px-6 py-3 backdrop-blur-sm'>
      {!showToggle ? (
        <div className='flex w-full items-center gap-3'>
          <Link
            href='/'
            className='text-foreground hover:text-primary text-base font-semibold tracking-tight transition'
          >
            Elimika
          </Link>
          {!isMobile && <AppBreadcrumb />}
        </div>
      ) : (
        <div className='flex w-full items-center gap-3'>
          <Link
            href='/'
            className='text-foreground hover:text-primary text-base font-semibold tracking-tight transition'
          >
            Elimika
          </Link>
          {!isMobile && <AppBreadcrumb />}
          <div className='flex-1' />
          <ThemeSwitcher size='icon' />
          <DomainSwitcher />
        </div>
      )}
    </div>
  );
}
