import { OrganizationOnboardingForm } from '../_components/organization-onboarding-form';

export default function OrganisationOnboardingPage() {
  return (
    <div className='bg-background relative min-h-screen'>
      <div className='relative mx-auto flex min-h-screen max-w-6xl items-start px-4 py-12'>
        <OrganizationOnboardingForm />
      </div>
    </div>
  );
}
