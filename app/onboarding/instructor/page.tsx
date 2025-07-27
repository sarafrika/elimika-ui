import {
  SharedOnboardingForm
} from '@/app/onboarding/_components/shared-onboarding-form';

export default function InstructorOnboardingPage() {
  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <SharedOnboardingForm userType='instructor' />
    </div>
  );
}
