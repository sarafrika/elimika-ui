import { OrganisationOnboardingPage as OrganisationOnboardingView } from '@/src/features/onboarding/pages/OrganisationOnboardingPage';

export default async function OrganisationOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const { step } = await searchParams;
  const initialStep = step === 'activities' ? 2 : step === 'verification' ? 3 : 1;
  return <OrganisationOnboardingView initialStep={initialStep} />;
}
