'use client';

import LoginButton from '@/components/LoginButton';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { SearchModal } from '@/components/search-modal';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Search, ChevronDown, BookOpen, Users } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function PublicTopNav() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  // Mock cart count - in a real app, this would come from cart state/context
  const cartItemCount = 0;

  const isActive = (path: string) => pathname === path;

  return (
    <nav className='sticky top-0 z-40 border-b border-blue-200/40 bg-white/80 shadow-sm shadow-blue-200/20 backdrop-blur-md dark:border-blue-500/25 dark:bg-blue-950/40 dark:shadow-blue-900/10'>
      <div className='mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-4'>
        {/* Logo */}
        <Link href='/' className='flex shrink-0 items-center gap-4 transition hover:opacity-90'>
          <Image
            alt='Elimika logo'
            src='/logos/elimika/Elimika Logo Design-02.svg'
            width={160}
            height={48}
            className='h-10 w-auto drop-shadow-sm dark:hidden'
            priority
          />
          <Image
            alt='Elimika logo in white'
            src='/logos/elimika/Elimika Logo Design-02-white.svg'
            width={160}
            height={48}
            className='hidden h-10 w-auto drop-shadow-sm dark:block'
            priority
          />
        </Link>

        {/* Search Button - Opens Modal */}
        <button
          onClick={() => setSearchOpen(true)}
          className='hidden flex-1 max-w-md items-center gap-2 rounded-full border border-blue-200/60 bg-white px-4 py-2.5 text-sm text-muted-foreground shadow-sm transition hover:border-blue-400/60 hover:bg-blue-50/50 dark:border-blue-500/30 dark:bg-blue-950/30 dark:hover:border-blue-400/40 dark:hover:bg-blue-900/30 lg:flex'
        >
          <Search className='h-4 w-4' />
          <span>Search courses, instructors...</span>
          <kbd className='ml-auto hidden rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:border-blue-500/40 dark:bg-blue-900/40 dark:text-slate-300 lg:inline-block'>
            ⌘K
          </kbd>
        </button>

        {/* Navigation Links & Actions */}
        <div className='flex items-center gap-2 md:gap-3'>
          {/* Categories Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                className='hidden gap-1.5 rounded-full px-4 text-sm font-medium text-foreground transition hover:bg-blue-50 hover:text-primary dark:hover:bg-blue-900/30 md:inline-flex'
              >
                Categories
                <ChevronDown className='h-3.5 w-3.5' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-48 rounded-2xl border-blue-200/60 bg-white/95 p-2 shadow-xl shadow-blue-200/30 backdrop-blur dark:border-blue-500/25 dark:bg-blue-950/95 dark:shadow-blue-900/20'>
              <DropdownMenuItem asChild>
                <Link href='/courses' className='flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-blue-50 dark:hover:bg-blue-900/40'>
                  <BookOpen className='h-4 w-4 text-primary' />
                  All Courses
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href='/instructors' className='flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-blue-50 dark:hover:bg-blue-900/40'>
                  <Users className='h-4 w-4 text-primary' />
                  All Instructors
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Courses Link */}
          <Link
            href='/courses'
            className={cn(
              'hidden rounded-full px-4 py-2 text-sm font-medium transition hover:bg-blue-50 hover:text-primary dark:hover:bg-blue-900/30 md:inline-flex',
              isActive('/courses')
                ? 'bg-blue-50 text-primary dark:bg-blue-900/40'
                : 'text-muted-foreground'
            )}
          >
            Courses
          </Link>

          {/* Instructors Link */}
          <Link
            href='/instructors'
            className={cn(
              'hidden rounded-full px-4 py-2 text-sm font-medium transition hover:bg-blue-50 hover:text-primary dark:hover:bg-blue-900/30 md:inline-flex',
              isActive('/instructors')
                ? 'bg-blue-50 text-primary dark:bg-blue-900/40'
                : 'text-muted-foreground'
            )}
          >
            Instructors
          </Link>

          {/* Cart Button with Badge */}
          <Link href='/cart' className='focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 focus-visible:ring-offset-2 rounded-full'>
            <Button
              variant='default'
              size='sm'
              className='relative gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-blue-200/40 transition hover:bg-primary/90 hover:shadow-xl hover:shadow-blue-200/50 dark:shadow-blue-900/20 dark:hover:shadow-blue-900/30'
            >
              <ShoppingCart className='h-4 w-4' />
              <span className='hidden sm:inline'>Cart</span>
              {cartItemCount > 0 && (
                <Badge
                  variant='destructive'
                  className='absolute -right-1.5 -top-1.5 h-5 min-w-5 rounded-full border-2 border-white px-1.5 text-xs font-bold dark:border-blue-950'
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

      {/* Mobile Search Button */}
      <div className='border-t border-blue-200/30 px-6 py-3 dark:border-blue-500/20 lg:hidden'>
        <button
          onClick={() => setSearchOpen(true)}
          className='flex w-full items-center gap-2 rounded-full border border-blue-200/60 bg-white px-4 py-2 text-sm text-muted-foreground shadow-sm transition hover:border-blue-400/60 hover:bg-blue-50/50 dark:border-blue-500/30 dark:bg-blue-950/30 dark:hover:border-blue-400/40 dark:hover:bg-blue-900/30'
        >
          <Search className='h-4 w-4' />
          <span>Search courses, instructors...</span>
        </button>
      </div>

      {/* Search Modal */}
      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </nav>
  );
}
