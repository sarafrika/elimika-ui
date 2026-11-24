import { AccountTypeSelector } from '@/src/features/onboarding/components/AccountTypeSelector';
import { ApplicationStatusPanel } from '@/src/features/onboarding/components/ApplicationStatusPanel';

export function OnboardingLandingPage() {
  return (
    <div className='bg-background dark:bg-background flex min-h-screen items-center justify-center p-4'>
      <div className='w-full max-w-6xl'>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-elimika">Welcome to Elimika</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">What brings you to Elimika?</h1>
          <p className="mt-3 text-muted-foreground">Choose what you want to achieve. You may add more profiles later.</p>
        </div>

        <ApplicationStatusPanel />

        <AccountTypeSelector />
      </div>
    </div>
  );
}

// Development
// Business
// Finance & Accounting
// IT & Software
// Office Productivity
// Personal Development
// Design
// Marketing
// Lifestyle
// Photography & Video
// Health & Fitness
// Music
// Teaching & Academics

// - Introduce goal-based starting paths with profile and age checks
// - Add interests for all roles and require skills for teaching profiles
// - Save wallet entries through existing profile APIs
// - Share read-only account details across registration forms
// - Refine step navigation, spacing, and wallet width
// - Add wallet API mapping and error-handling tests
