import AddProfileSelector from './_components/add-profile-selector';
import ManageProfileActions from './_components/manage-profile-actions';

export default function AddProfilePage() {
  return (
    <div className='from-background dark:from-background flex min-h-screen items-center justify-center bg-gradient-to-br via-blue-50 to-blue-100 p-4 dark:via-blue-950 dark:to-blue-900'>
      <div className='w-full max-w-6xl space-y-8'>
        <div className='rounded-3xl border border-white/40 bg-white/60 px-6 py-5 text-center shadow-sm backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/70'>
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
