import LoginButton from '@/components/LoginButton';
import { ThemeSwitcher } from '@/components/theme-switcher';
import Link from 'next/link';
import Image from 'next/image';

export function PublicTopNav() {
  return (
    <nav className='sticky top-0 z-40 border-b border-border/60 bg-card/80 backdrop-blur'>
      <div className='mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5'>
        <Link href='/' className='flex items-center gap-4'>
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

        <div className='flex items-center gap-4 text-sm font-medium text-muted-foreground'>
          <Link className='transition hover:text-primary focus-visible:text-primary' href='/classes'>
            Classes
          </Link>
          <Link className='transition hover:text-primary focus-visible:text-primary' href='/instructors'>
            Instructors
          </Link>
          <Link className='transition hover:text-primary focus-visible:text-primary' href='/#product'>
            Product
          </Link>
          <Link className='transition hover:text-primary focus-visible:text-primary' href='/#domains'>
            Domains
          </Link>
          <Link className='transition hover:text-primary focus-visible:text-primary' href='/#powered'>
            Powered by Sarafrika
          </Link>
          <ThemeSwitcher size='icon' />
          <LoginButton />
        </div>
      </div>
    </nav>
  );
}
