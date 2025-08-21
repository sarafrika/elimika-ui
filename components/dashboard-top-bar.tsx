'use client';

import { useIsMobile } from '@/hooks/use-mobile';
import { AppBreadcrumb } from '@/components/ui/app-breadcrumb';
import DashboardViewSwitcher from '@/components/dashboard-view-switcher';
import { DomainSwitcher } from '@/components/domain-switcher';

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
        !isMobile && <AppBreadcrumb />
      ) : (
        <>
          {!isMobile && <AppBreadcrumb />}
          <div className='flex-1' />
          <div className='flex items-center gap-3'>
            <DomainSwitcher />
            <DashboardViewSwitcher />
          </div>
        </>
      )}
    </div>
  );
}
