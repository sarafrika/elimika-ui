'use client';

import { ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LoginButton from '@/components/LoginButton';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Badge } from '@/components/ui/badge';
import { surfaceTheme } from '@/components/data-display/page-shell';
import { Button } from '@/components/ui/button';
import { useSavedCart } from '@/hooks/use-saved-cart';
import { cn } from '@/lib/utils';
import { PublicSearch } from '@/src/features/search/components/public-search';

/** Wide public pages (the catalogue) use the screen up to 2400px instead of a 1280px column. */
export const WIDE_PUBLIC_CONTAINER = surfaceTheme.pageWide;

export function MarketingTopNav({ wide = false }: { wide?: boolean }) {
  const pathname = usePathname();

  const { data: cartData } = useSavedCart();
  const cartItemCount = cartData?.items?.length ?? 0;

  const navLinks: { label: string; href: string; external?: boolean }[] = [
    { label: 'Courses', href: '/courses' },
  ];

  const isActive = (href: string) => {
    const [path = ''] = href.split('#');
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <nav className='border-border bg-background/80 sticky top-0 z-40 border-b shadow-sm backdrop-blur-md'>
      <div
        className={cn(
          'mx-auto flex w-full items-center justify-between gap-4 py-4',
          wide ? WIDE_PUBLIC_CONTAINER : 'max-w-7xl px-6'
        )}
      >
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

        <div className='flex flex-1 items-center justify-end gap-2 md:gap-3'>
          <PublicSearch />
          <div className='hidden items-center gap-2 md:flex'>
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noopener noreferrer' : undefined}
                className={cn(
                  'hover:bg-muted hover:text-primary rounded-full px-4 py-2 text-sm font-medium transition',
                  isActive(link.href) ? 'bg-muted text-primary' : 'text-muted-foreground'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

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

          <div className='hidden md:block'>
            <ThemeSwitcher size='icon' />
          </div>

          <LoginButton />
        </div>
      </div>

      <div className='border-border border-t px-6 py-3 lg:hidden'>
        <div className='flex flex-wrap gap-2'>
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noopener noreferrer' : undefined}
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
