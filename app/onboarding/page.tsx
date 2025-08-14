import React from 'react';
import AccountTypeSelector from './_components/account-type-selector';

const OnboardingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10 dark:from-background dark:via-primary/10 dark:to-primary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Welcome to Elimika!
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            To help us personalize your experience, please select your primary role and we&apos;ll guide you through the setup process.
          </p>
        </div>
        
        <AccountTypeSelector />
        
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Don&apos;t worry, you can always change your role or add additional roles later.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
