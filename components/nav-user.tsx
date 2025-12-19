// components/layout/nav-user.tsx (or wherever NavUser is located)
'use client';

import { ChevronsUpDown, LogOut, UserPlus } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import type { MenuItem } from '@/lib/menu';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '../context/profile-context';
import { DomainSwitcher } from '@/components/domain-switcher';
import { useUserDomain } from '@/context/user-domain-context';

type NavUserProps = {
  items: MenuItem[];
};

export function NavUser({ items }: NavUserProps) {
  const router = useRouter();
  const user = useUserProfile();
  const userDomain = useUserDomain();
  const { isMobile } = useSidebar();
  // const { data: session } = useSession();
  const activeDomain = userDomain.activeDomain ?? userDomain.domains[0] ?? '';
  const activeDomainLabel = activeDomain || 'dashboard';

  const userInitials =
    user?.full_name
      ?.split(' ')
      ?.slice(0, 2)
      ?.map(name => name?.[0])
      ?.join('') || '';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground transition-colors'
            >
              <Avatar className='bg-background h-8 w-8 rounded-md border'>
                <AvatarImage src={user?.profile_image_url ?? ''} alt={user?.full_name ?? ''} />
                <AvatarFallback className='rounded-md text-xs font-medium'>
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className='grid flex-1 text-left text-sm leading-tight'>
                <div className='flex items-center gap-2'>
                  <span className='truncate font-medium'>{user?.first_name}</span>
                  <Badge
                    variant='outline'
                    className='border-primary/20 text-primary h-5 px-1.5 py-0 text-[10px] font-normal capitalize'
                  >
                    {activeDomainLabel}
                  </Badge>
                </div>
                <span className='text-muted-foreground truncate text-xs'>{user?.email}</span>
              </div>
              <ChevronsUpDown className='text-muted-foreground ml-auto size-4' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className='border-border bg-card shadow-primary/10 w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-xl border p-4 shadow-lg'
            side={isMobile ? 'bottom' : 'right'}
            align='end'
            sideOffset={8}
          >
            <div className='flex flex-col'>
              {/* User Info */}
              <div className='mb-4 flex items-center gap-3'>
                <Avatar className='bg-background h-10 w-10 rounded-md border'>
                  <AvatarImage src={user?.profile_image_url ?? ''} alt={user?.full_name ?? ''} />
                  <AvatarFallback className='rounded-md text-sm font-medium'>
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className='flex flex-col'>
                  <span className='text-foreground text-sm font-medium'>{user?.full_name}</span>
                  <span className='text-muted-foreground text-xs'>{user?.email}</span>
                </div>
              </div>

              {/* Domain Switcher - Only show if user has multiple domains */}
              {userDomain.hasMultipleDomains && (
                <>
                  <DropdownMenuSeparator className='my-2' />
                  <div className='mb-2'>
                    <p className='text-muted-foreground mb-2 px-3 text-xs font-medium tracking-wide uppercase'>
                      Switch Dashboard
                    </p>
                    <div className='px-3'>
                      <DomainSwitcher className='w-full justify-start' />
                    </div>
                  </div>
                </>
              )}

              <DropdownMenuSeparator className='my-2' />
              {/* Profile & Logout Actions */}
              <div className='mt-0.5 flex flex-col gap-1'>
                {items.map(item => (
                  <div
                    key={item.title}
                    onClick={() => item.url && router.push(item.url)}
                    className='hover:bg-muted text-foreground flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors'
                  >
                    {item.icon && <item.icon className='size-4' />}
                    <span>{item.title}</span>
                  </div>
                ))}

                {/* Add Profile Option */}
                <div
                  onClick={() => router.push('/dashboard/add-profile')}
                  className='text-primary hover:bg-secondary/70 flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors'
                >
                  <UserPlus className='size-4' />
                  <span>Add New Profile</span>
                </div>

                <div
                  className='text-destructive hover:bg-destructive/10 hover:text-destructive flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors'
                  onClick={async () =>
                    await signOut().then(() => {
                      userDomain.clearDomain();
                      user?.clearProfile();
                    })
                  }
                >
                  <LogOut className='size-4' />
                  <span>Log out</span>
                </div>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
