import {
  HeaderSkeleton,
  OrgLoadingPage,
  TabsSkeleton,
} from '@/app/dashboard/organisation/_components/org-loading';
import { SectionCardSkeleton } from '@/components/data-display/section-card';

export default function SettingsLoading() {
  return (
    <OrgLoadingPage>
      <HeaderSkeleton action={false} />
      <TabsSkeleton count={5} />
      <div className='grid gap-4 sm:grid-cols-2'>
        <SectionCardSkeleton rows={4} />
        <SectionCardSkeleton rows={4} />
      </div>
    </OrgLoadingPage>
  );
}
