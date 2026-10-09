import { ListPageSkeleton } from '@/app/dashboard/instructor/_components/route-skeletons';

export default function InstructorNotificationsLoading() {
  return <ListPageSkeleton tabs={3} rows={8} filters={false} />;
}
