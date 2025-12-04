'use client';

import LoginButton from '@/components/LoginButton';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function PublicTopNav() {
  const pathname = usePathname();

  // Mock cart count - in a real app, this would come from cart state/context
  const cartItemCount = 0;

  const navLinks = [
    { label: 'Courses', href: '/courses' },
    { label: 'Skills Fund', href: '/skills-fund' },
    { label: 'Instructors', href: '/instructors' },
    { label: 'Help', href: '/help' },
  ];

  const isActive = (href: string) => {
    const [path] = href.split('#');
    return pathname === path;
  };

  return (
    <nav className='sticky top-0 z-40 border-b border-border bg-background/80 shadow-sm backdrop-blur-md'>
      <div className='mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4'>
        {/* Logo */}
        <Link href='/' className='flex shrink-0 items-center gap-4 transition hover:opacity-90'>
          <Image
            alt='Elimika logo'
            src='/logos/elimika/elimika-logo-color.svg'
            width={160}
            height={48}
            className='h-10 w-auto drop-shadow-sm dark:hidden'
            priority
          />
          <Image
            alt='Elimika logo in white'
            src='/logos/elimika/elimika-logo-white.svg'
            width={160}
            height={48}
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
                  'rounded-full px-4 py-2 text-sm font-medium transition hover:bg-muted hover:text-primary',
                  isActive(link.href) ? 'bg-muted text-primary' : 'text-muted-foreground'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Cart Button with Badge */}
          <Link href='/cart' className='rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2'>
            <Button
              variant='default'
              size='sm'
              className='relative gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90 hover:shadow-xl'
            >
              <ShoppingCart className='h-4 w-4' />
              <span className='hidden sm:inline'>Cart</span>
              {cartItemCount > 0 && (
                <Badge
                  variant='destructive'
                  className='absolute -right-1.5 -top-1.5 h-5 min-w-5 rounded-full border-2 border-background px-1.5 text-xs font-bold'
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
      <div className='border-t border-border px-6 py-3 lg:hidden'>
        <div className='flex flex-wrap gap-2'>
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className='rounded-full border border-border px-3 py-1 text-sm text-muted-foreground transition hover:border-primary/50 hover:text-primary'
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
