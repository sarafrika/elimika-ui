import AddProfileSelector from './_components/add-profile-selector';
import ManageProfileActions from './_components/manage-profile-actions';

export default function AddProfilePage() {
  return (
    <div className='bg-background dark:bg-background relative flex min-h-screen items-center justify-center overflow-hidden p-4'>
      <div className='relative w-full max-w-6xl space-y-8'>
        <div className='border-border/60 bg-card/90 shadow-primary/5 dark:bg-card/70 rounded-3xl border px-6 py-5 text-center shadow-lg backdrop-blur-sm'>
          <h1 className='text-foreground text-2xl font-semibold sm:text-3xl'>Add a new profile</h1>
          <p className='text-muted-foreground mt-1 text-sm sm:text-base'>
            Extend your Elimika account with another role—you can switch anytime.
          </p>
        </div>

        <AddProfileSelector />

        <div className='mt-8 text-center'>
          <p className='text-muted-foreground text-sm'>
            You can manage all your profiles from the dashboard switcher.
          </p>
        </div>

        <ManageProfileActions />
      </div>
    </div>
  );
}
