import { Badge } from '../../../../components/ui/badge';
import { Card } from '../../../../components/ui/card';
import InstructorsPage from './_components/InstructorsPage';

export default function Page() {
  return (
    <div className='flex flex-col gap-6 p-6'>
      <div>
        <Badge
          variant='outline'
          className='border-primary/60 bg-primary/10 text-xs font-semibold tracking-wide uppercase'
        >
          Instructor Management
        </Badge>
        <div className='bg-card relative mt-4 overflow-hidden rounded-3xl'>
          <div className='flex flex-col'>
            <p className='text-muted-foreground max-w-3xl text-sm leading-relaxed'>
              Manage instructor accounts, assign roles and permissions, and monitor system access
              from a centralized dashboard.
            </p>
          </div>
        </div>
      </div>

      <Card className='p-2'>
        <InstructorsPage />;
      </Card>
    </div>
  );
}
