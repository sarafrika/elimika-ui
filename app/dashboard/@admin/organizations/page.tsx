import { Badge } from '../../../../components/ui/badge';
import { Card } from '../../../../components/ui/card';
import AdminOrganisationsPage from './organizations-page';

export default function Page() {
  return (
    <div className='flex flex-col gap-6 p-6'>
      <div>
        <Badge
          variant='outline'
          className='border-primary/60 bg-primary/10 text-xs font-semibold tracking-wide uppercase'
        >
          Organization Management
        </Badge>
        <div className='bg-card relative mt-4 overflow-hidden rounded-3xl'>
          <div className='flex flex-col'>
            <p className='text-muted-foreground max-w-3xl text-sm leading-relaxed'>
              Manage organization accounts, assign roles and permissions, and monitor system access
              from a centralized dashboard.
            </p>
          </div>
        </div>
      </div>

      <Card className='h-[calc(75vh-4rem)] gap-0 overflow-hidden p-2 sm:h-[calc(82vh-4rem)] md:h-[calc(81vh)]'>
        <AdminOrganisationsPage />;
      </Card>
    </div>
  );
}
