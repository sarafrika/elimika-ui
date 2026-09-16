import { Skeleton } from '@/components/ui/skeleton';
import { adminTheme } from '../_components/ui/admin-theme';

export default function CategoriesLoading() {
  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <Skeleton className='h-9 w-56' />
        <Skeleton className='h-5 w-full max-w-md' />
        <Skeleton className='h-96 w-full' />
      </div>
    </main>
  );
}
