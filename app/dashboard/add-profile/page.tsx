import React from 'react';
import AddProfileSelector from './_components/add-profile-selector';

export default function AddProfilePage() {
  return (
    <div className='from-background via-blue-50 to-blue-100 dark:from-background dark:via-blue-950 dark:to-blue-900 flex min-h-screen items-center justify-center bg-gradient-to-br p-4'>
      <div className='w-full max-w-6xl'>
        <div className='mb-12 text-center'>
          <h1 className='text-foreground mb-4 text-4xl font-bold'>Add a New Profile</h1>
          <p className='text-muted-foreground mx-auto max-w-2xl text-lg'>
            Expand your Elimika experience by adding a new role to your account. You can switch
            between your profiles anytime.
          </p>
        </div>

        <AddProfileSelector />

        <div className='mt-8 text-center'>
          <p className='text-muted-foreground text-sm'>
            You can manage all your profiles from the dashboard switcher.
          </p>
        </div>
      </div>
    </div>
  );
}