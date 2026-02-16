'use client';

import LoginButton from '@/components/LoginButton';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getCartOptions } from '../services/client/@tanstack/react-query.gen';
import { useCartStore } from '../store/cart-store';

export function PublicTopNav() {
  const pathname = usePathname();

  const { cartId: savedCartId } = useCartStore();
  const { data: cartData } = useQuery(getCartOptions({ path: { cartId: savedCartId as string } }));
  // @ts-ignore
  const cart = cartData?.data;
  const cartItemCount = cart?.items?.length;

  const navLinks = [
    { label: 'Catalogue', href: '/courses' },
    { label: 'Help', href: '/help' },
  ];

  const isActive = (href: string) => {
    const [path] = href.split('#');
    return pathname === path;
  };

  return (
    <nav className='border-border bg-background/80 sticky top-0 z-40 border-b shadow-sm backdrop-blur-md'>
      <div className='mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4'>
        {/* Logo */}
        <Link href='/' className='flex shrink-0 items-center gap-4 transition hover:opacity-90'>
          <Image
            alt='Elimika logo'
            src='/logos/elimika/Artboard 2.svg'
            width={180}
            height={54}
            className='h-10 w-auto drop-shadow-sm dark:hidden'
            priority
          />
          <Image
            alt='Elimika logo in white'
            src='/logos/elimika/Artboard 8.svg'
            width={180}
            height={54}
            className='hidden h-10 w-auto drop-shadow-sm dark:block'
            priority
          />
        </Link>

        {/* Navigation Links & Actions */}
        <div className='flex flex-1 items-center justify-end gap-2 md:gap-3'>
          <div className='hidden items-center gap-2 md:flex'>
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'hover:bg-muted hover:text-primary rounded-full px-4 py-2 text-sm font-medium transition',
                  isActive(link.href) ? 'bg-muted text-primary' : 'text-muted-foreground'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Cart Button with Badge */}
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

          {/* Theme Switcher */}
          <div className='hidden md:block'>
            <ThemeSwitcher size='icon' />
          </div>

          {/* Login Button */}
          <LoginButton />
        </div>
      </div>

      {/* Mobile Navigation Links */}
      <div className='border-border border-t px-6 py-3 lg:hidden'>
        <div className='flex flex-wrap gap-2'>
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className='border-border text-muted-foreground hover:border-primary/50 hover:text-primary rounded-full border px-3 py-1 text-sm transition'
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
