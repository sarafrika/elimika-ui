import { Mail } from 'lucide-react';

function InvitesPage() {
  return (
    <div className='flex flex-col items-center justify-center gap-4 py-24 text-center'>
      <div className='bg-muted rounded-full p-5'>
        <Mail className='text-muted-foreground h-8 w-8' />
      </div>
      <div className='space-y-1'>
        <h3 className='text-lg font-semibold'>No invites</h3>
        <p className='text-muted-foreground max-w-xs text-sm'>
          You don't have any pending invites right now. Check back later.
        </p>
      </div>
    </div>
  );
}

export default InvitesPage;
