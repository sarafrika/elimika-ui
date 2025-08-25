import React from 'react';
import AccountTypeSelector from './_components/account-type-selector';

const OnboardingPage = () => {
  return (
    <div className='from-background via-primary/5 to-primary/10 dark:from-background dark:via-primary/10 dark:to-primary/20 flex min-h-screen items-center justify-center bg-gradient-to-br p-4'>
      <div className='w-full max-w-6xl'>
        <div className='mb-12 text-center'>
          <h1 className='text-foreground mb-4 text-4xl font-bold'>Welcome to Elimika!</h1>
          <p className='text-muted-foreground mx-auto max-w-2xl text-lg'>
            To help us personalize your experience, please select your primary role and we&apos;ll
            guide you through the setup process.
          </p>
        </div>

        <AccountTypeSelector />

        <div className='mt-8 text-center'>
          <p className='text-muted-foreground text-sm'>
            Don&apos;t worry, you can always change your role or add additional roles later.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
