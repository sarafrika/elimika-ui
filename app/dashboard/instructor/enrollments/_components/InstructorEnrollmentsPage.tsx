'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Mail,
  UserCheck,
  UserRoundPlus,
  Users,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { PageHeader } from '../../../../../components/page-header';

function TabLoading() {
  return (
    <div className='space-y-4 p-4' role='status' aria-label='Loading enrollments'>
      <Skeleton className='h-10 w-64 max-w-full rounded-lg' />
      <Skeleton className='h-80 w-full rounded-xl' />
    </div>
  );
}

const StudentsTab = dynamic(
  () => import('./EnrollmentStudentsTab').then(module => module.EnrollmentStudentsTab),
  { loading: TabLoading }
);
const WaitingListTab = dynamic(
  () =>
    import('../../training-hub/waiting-list/_components/InstructorWaitingListPage').then(
      module => module.InstructorWaitingListPage
    ),
  { loading: TabLoading }
);
const BookingRequestsTab = dynamic(() => import('./BookingRequestsTab'), {
  loading: TabLoading,
});
const ClassInvitesTab = dynamic(() => import('./ClassInvitesTab'), {
  loading: TabLoading,
});

const TABS = [
  { id: 'all-students', label: 'All Students', icon: Users },
  { id: 'active', label: 'Active', icon: UserCheck },
  { id: 'waiting-list', label: 'Waiting List', icon: UserRoundPlus },
  { id: 'booking-requests', label: 'Booking Requests', icon: CalendarClock },
  { id: 'class-invites', label: 'Class Invites', icon: Mail },
] as const;

type TabId = (typeof TABS)[number]['id'];

function isTabId(value: string | null): value is TabId {
  return TABS.some(tab => tab.id === value);
}

export function InstructorEnrollmentsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const tab = isTabId(requestedTab) ? requestedTab : 'all-students';
  const tabRowRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef(new Map<TabId, HTMLButtonElement>());

  useEffect(() => {
    tabRefs.current.get(tab)?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }, [tab]);

  const handleTabChange = (nextTab: string) => {
    if (!isTabId(nextTab)) return;

    const params = new URLSearchParams(searchParams.toString());
    if (nextTab === 'all-students') {
      params.delete('tab');
    } else {
      params.set('tab', nextTab);
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const scrollTabs = (direction: 'left' | 'right') => {
    tabRowRef.current?.scrollBy({
      left: direction === 'left' ? -280 : 280,
      behavior: 'smooth',
    });
  };

  return (
    <div className='w-full min-w-0 px-3 py-4 sm:px-6 sm:py-6'>
      <PageHeader
        eyebrow='INSTRUCTOR ENROLLMENTS'
        title='Enrollments'
        description='Manage students, waiting lists, booking requests, and class invitations.'
      />

      <Tabs value={tab} onValueChange={handleTabChange} className='min-w-0 gap-0'>
        <div className='mt-4 flex min-w-0 items-center gap-1'>
          <Button
            type='button'
            variant='outline'
            size='icon'
            aria-label='Scroll tabs left'
            onClick={() => scrollTabs('left')}
            className='border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground size-7 rounded-full'
          >
            <ChevronLeft className='size-4' />
          </Button>

          <div
            ref={tabRowRef}
            className='min-w-0 flex-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
          >
            <TabsList
              aria-label='Enrollment sections'
              className='h-auto justify-start gap-2 rounded-none bg-transparent p-0'
            >
              {TABS.map(({ id, label, icon: Icon }) => (
                <TabsTrigger
                  key={id}
                  value={id}
                  ref={element => {
                    if (element) {
                      tabRefs.current.set(id, element);
                    } else {
                      tabRefs.current.delete(id);
                    }
                  }}
                  className='border-border bg-card text-muted-foreground hover:border-primary hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground shrink-0 gap-2 rounded-full border px-4 py-1.5 font-normal data-[state=active]:shadow-sm'
                >
                  <Icon className='size-3.5' />
                  <span>{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <Button
            type='button'
            variant='outline'
            size='icon'
            aria-label='Scroll tabs right'
            onClick={() => scrollTabs('right')}
            className='border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground size-7 rounded-full'
          >
            <ChevronRight className='size-4' />
          </Button>
        </div>

        <TabsContent value='all-students' className='min-w-0 py-4'>
          <StudentsTab key='all' scope='all' />
        </TabsContent>
        <TabsContent value='active' className='min-w-0 py-4'>
          <StudentsTab key='active' scope='active' />
        </TabsContent>
        <TabsContent value='waiting-list' className='min-w-0 py-4'>
          <WaitingListTab />
        </TabsContent>
        <TabsContent value='booking-requests' className='min-w-0 py-4'>
          <BookingRequestsTab />
        </TabsContent>
        <TabsContent value='class-invites' className='min-w-0 py-4'>
          <ClassInvitesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
