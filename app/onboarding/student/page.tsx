import { StudentOnboardingForm } from '../_components/student-onboarding-form';

export default function StudentOnboardingPage() {
  return (
    <div className='relative min-h-screen bg-background'>
      <div className='relative mx-auto flex min-h-screen max-w-6xl items-start px-4 py-12'>
        <StudentOnboardingForm />
      </div>
    </div>
  );
}
