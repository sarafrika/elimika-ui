import { InstructorOnboardingForm } from '../_components/instructor-onboarding-form';

export default function InstructorOnboardingPage() {
  return (
    <div className='relative min-h-screen bg-background'>
      <div className='relative mx-auto flex min-h-screen max-w-6xl items-start px-4 py-12'>
        <InstructorOnboardingForm />
      </div>
    </div>
  );
}
