'use client';

import { DomainSwitcher } from '@/components/domain-switcher';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { AppBreadcrumb } from '@/components/ui/app-breadcrumb';
import { useIsMobile } from '@/hooks/use-mobile';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useUserDomain } from '../context/user-domain-context';
import { getCartOptions } from '../services/client/@tanstack/react-query.gen';
import { useCartStore } from '../store/cart-store';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

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
  const domain = useUserDomain();
  const { cartId: savedCartId } = useCartStore();
  const { data: cartData } = useQuery({
    ...getCartOptions({
      path: { cartId: savedCartId ?? '' },
    }),
    enabled: !!savedCartId,
    retry: 1,
  });

  // @ts-ignore
  const cart = cartData?.data;
  const cartItemCount = cart?.items?.length;

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

          {domain?.activeDomain === 'student' && (
            <Link
              href='/cart'
              className='focus-visible:ring-primary/50 rounded-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
            >
              <Button
                variant='default'
                size='sm'
                className='bg-primary text-primary-foreground hover:bg-primary/90 relative gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-lg transition hover:shadow-xl'
              >
                <ShoppingCart className='h-4 w-4' />
                <span className='hidden sm:inline'>Cart</span>
                {cartItemCount > 0 && (
                  <Badge
                    variant='destructive'
                    className='border-background absolute -top-1.5 -right-1.5 h-5 min-w-5 rounded-full border-2 px-1.5 text-xs font-bold'
                  >
                    {cartItemCount > 9 ? '9+' : cartItemCount}
                  </Badge>
                )}
              </Button>
            </Link>
          )}

          <ThemeSwitcher size='icon' />
          <DomainSwitcher />
        </div>
      )}
    </div>
  );
}
