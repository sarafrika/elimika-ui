'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck } from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/ui/phone-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { getErrorMessage } from '@/lib/error-utils';
import {
  applyForDomainMutation,
  registerMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { buildDashboardSwitchPath } from '@/src/features/dashboard/lib/active-domain-storage';
import {
  isDomainOnboardingKey,
  useAccountStatus,
  useDomainOnboarding,
} from '@/src/features/onboarding/hooks/useDomainOnboarding';
import {
  buildRegistrationRequest,
  emptyOnboardingDraft,
  isOnboardingAccountType,
  isRegisterableDomain,
  ONBOARDING_DRAFT_KEY,
  ONBOARDING_PATH,
  type OnboardingAccountType,
  type OnboardingDraft,
  personalDetailsSchema,
  type RegisterableDomain,
  readOnboardingDraft,
  requireApiSuccess,
  verificationPath,
} from '@/src/features/onboarding/lib/user-onboarding';
import { AccountTypeStep } from '@/src/features/onboarding/wizard/AccountTypeStep';
import {
  FieldError,
  FormError,
  OnboardingFrame,
  StepBody,
  StepFooter,
  SummaryRow,
} from '@/src/features/onboarding/wizard/OnboardingFrame';
import { VerifyEmailGate } from '@/src/features/onboarding/wizard/VerifyEmailGate';
import { ROLE_COPY, wizardSteps } from '@/src/features/onboarding/wizard/wizard-model';

// Step sections load on demand so the first step stays light.
const sectionLoading = () => <Skeleton className='m-6 h-56' />;
const CategoriesStep = dynamic(
  () => import('@/src/features/onboarding/wizard/ProfessionalDetails').then(m => m.CategoriesStep),
  { loading: sectionLoading }
);
const InstructorDetails = dynamic(
  () =>
    import('@/src/features/onboarding/wizard/ProfessionalDetails').then(m => m.InstructorDetails),
  { loading: sectionLoading }
);
const ProfileBasicsCard = dynamic(
  () =>
    import('@/src/features/onboarding/wizard/ProfessionalDetails').then(m => m.ProfileBasicsCard),
  { loading: sectionLoading }
);
const StudentDetails = dynamic(
  () => import('@/src/features/onboarding/wizard/StudentDetails').then(m => m.StudentDetails),
  { loading: sectionLoading }
);
const OrganisationDetails = dynamic(
  () =>
    import('@/src/features/onboarding/wizard/OrganisationDetails').then(m => m.OrganisationDetails),
  { loading: sectionLoading }
);
const OnboardingSkillsWallet = dynamic(
  () =>
    import('@/src/features/onboarding/components/OnboardingSkillsWallet').then(
      m => m.OnboardingSkillsWallet
    ),
  { loading: sectionLoading }
);
const SubmitStep = dynamic(
  () => import('@/src/features/onboarding/wizard/SubmitStep').then(m => m.SubmitStep),
  { loading: sectionLoading }
);

const PERSONAL_LABELS = { first_name: 'First name', last_name: 'Last name', email: 'Email' };
const AUTOCOMPLETE = { first_name: 'given-name', last_name: 'family-name', email: 'email' };

export default function UserOnboardingPage() {
  return (
    <Suspense fallback={<Skeleton className='mx-auto my-10 h-96 max-w-6xl' />}>
      <UserOnboardingWizard />
    </Suspense>
  );
}

function UserOnboardingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: session, status: sessionStatus } = useSession();
  const [draft, setDraft] = useState(emptyOnboardingDraft);
  const [hydrated, setHydrated] = useState(false);
  const [resumed, setResumed] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [signingIn, setSigningIn] = useState(false);

  const authenticated = sessionStatus === 'authenticated' && !session?.error;
  const userId = session?.user?.id ?? session?.user?.email ?? '';
  const wrongAccount =
    authenticated &&
    Boolean(
      (draft.ownerId && draft.ownerId !== userId) ||
        (draft.registeredEmail &&
          draft.registeredEmail.toLowerCase() !== session?.user?.email?.toLowerCase())
    );
  const domain: RegisterableDomain | '' = isRegisterableDomain(draft.domain) ? draft.domain : '';
  const steps = wizardSteps(domain);
  const live = hydrated && authenticated && !wrongAccount;
  const accountStatus = useAccountStatus(live);
  const onboarding = useDomainOnboarding(domain || undefined, live && draft.step >= 1);
  const registration = useMutation(registerMutation());
  const application = useMutation(applyForDomainMutation());
  const pending = registration.isPending || application.isPending;
  const patch = (value: Partial<OnboardingDraft>) =>
    setDraft(current => ({ ...current, ...value }));

  useEffect(() => {
    try {
      const stored = readOnboardingDraft(sessionStorage.getItem(ONBOARDING_DRAFT_KEY));
      const requested = searchParams.get('type');
      setDraft(
        !stored.domain && isOnboardingAccountType(requested)
          ? { ...stored, domain: requested }
          : stored
      );
    } catch {
      /* Keep the in-memory draft if storage is unavailable. */
    }
    setHydrated(true);
  }, [searchParams]);
  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* Onboarding can still be completed in this tab. */
    }
  }, [draft, hydrated]);

  // Progress lives on the server, so a new tab or device resumes where the person stopped.
  const applications = accountStatus.data?.domain_applications ?? [];
  useEffect(() => {
    if (!live || resumed || draft.step !== 0 || accountStatus.isPending) return;
    setResumed(true);
    const open = applications.find(
      item =>
        isRegisterableDomain(item.domain) &&
        !item.submitted_at &&
        (item.status === 'PENDING' || item.status === 'REJECTED' || item.domain === 'student')
    );
    const wanted = isRegisterableDomain(draft.domain) ? draft.domain : undefined;
    const resume = applications.find(item => item.domain === wanted && !item.submitted_at) ?? open;
    if (resume && isRegisterableDomain(resume.domain))
      patch({ domain: resume.domain, step: 2, ownerId: userId });
    else patch({ step: 1, ownerId: userId });
  }, [live, resumed, draft.step, draft.domain, accountStatus.isPending, applications, userId]);

  useEffect(() => {
    if (domain && onboarding.data?.status === 'submitted') router.replace(verificationPath(domain));
  }, [domain, onboarding.data?.status, router]);

  const held = useMemo(
    () =>
      applications
        .filter(item => item.submitted_at && item.status !== 'REJECTED')
        .flatMap(item => (item.domain ? [item.domain] : [])),
    [applications]
  );

  const accountName = authenticated
    ? session?.user?.name
    : `${draft.personal.first_name} ${draft.personal.last_name}`.trim();
  const accountEmail = authenticated ? session?.user?.email : draft.personal.email;

  const handleSignIn = async (redirectPath = ONBOARDING_PATH) => {
    setError('');
    setSigningIn(true);
    try {
      await signIn(
        'keycloak',
        { redirectTo: `${window.location.origin}${redirectPath}` },
        draft.registeredEmail
          ? { login_hint: draft.registeredEmail, prompt: 'login' }
          : { prompt: 'login' }
      );
    } catch (cause) {
      setError(getErrorMessage(cause, 'Unable to sign in. Please try again.'));
      setSigningIn(false);
    }
  };

  const continueFromAccount = () => {
    setError('');
    if (authenticated) {
      patch({ step: 1, ownerId: userId });
      return;
    }
    const details = personalDetailsSchema.safeParse(draft.personal);
    if (!details.success) {
      setFieldErrors(
        Object.fromEntries(
          details.error.issues.map(issue => [String(issue.path[0]), issue.message])
        )
      );
      return;
    }
    setFieldErrors({});
    patch({ personal: details.data, step: 1 });
  };

  const continueFromType = async (type: OnboardingAccountType) => {
    if (pending) return;
    setError('');
    if (type === 'parent') {
      if (authenticated) router.push('/dashboard');
      else void handleSignIn('/dashboard');
      return;
    }
    try {
      if (!authenticated) {
        const details = personalDetailsSchema.parse(draft.personal);
        requireApiSuccess(
          await registration.mutateAsync({
            body: buildRegistrationRequest(details, type, captchaToken),
          })
        );
        patch({ registeredEmail: details.email, step: 2 });
        setCaptchaToken('');
        return;
      }
      const alreadyRequested = applications.some(item => item.domain === type);
      if (!alreadyRequested) {
        requireApiSuccess(await application.mutateAsync({ body: { domain: type } }));
        await Promise.all([
          queryClient.invalidateQueries({ predicate: q => isDomainOnboardingKey(q.queryKey) }),
          accountStatus.refetch(),
        ]);
      }
      patch({ step: 2, ownerId: userId });
    } catch (cause) {
      setError(getErrorMessage(cause, 'Unable to continue. Please try again.'));
    }
  };

  const finish = () => {
    if (!domain) return;
    try {
      sessionStorage.removeItem(ONBOARDING_DRAFT_KEY);
    } catch {
      /* Server state remains canonical. */
    }
    if (domain === 'student') {
      toast.success('Welcome to Elimika. Your learning dashboard is ready.');
      router.push(buildDashboardSwitchPath('student'));
    } else {
      router.push(verificationPath(domain));
    }
  };

  const goTo = (step: number) => {
    setError('');
    patch({ step });
  };
  const kicker = (index: number) =>
    `Step ${index + 1} of ${steps.length}${domain && index >= 2 ? ` · ${ROLE_COPY[domain].label}` : ''}`;

  if (!hydrated || sessionStatus === 'loading' || (live && draft.step === 0 && !resumed))
    return (
      <OnboardingFrame steps={steps} current={0} title='Sarafrika account'>
        <StepBody>
          <Skeleton className='h-64 w-full' />
        </StepBody>
      </OnboardingFrame>
    );

  if (wrongAccount)
    return (
      <OnboardingFrame steps={steps} current={draft.step} title='Different account'>
        <StepBody>
          <EmptyState
            title='This sign-up belongs to a different account'
            description={`Sign in with ${draft.registeredEmail || 'the account that started this sign-up'} to resume, or start again with the account you are signed in with.`}
            action={
              <>
                <Button onClick={() => void handleSignIn()} disabled={signingIn}>
                  {signingIn && <Spinner />}Use another account
                </Button>
                <Button variant='outline' onClick={() => setDraft(emptyOnboardingDraft())}>
                  Start with this account
                </Button>
              </>
            }
          />
        </StepBody>
        <FormError message={error} />
      </OnboardingFrame>
    );

  if (draft.step >= 2 && !authenticated)
    return (
      <OnboardingFrame steps={steps} current={2} kicker={kicker(2)} title='Verify your email'>
        {draft.registeredEmail ? (
          <VerifyEmailGate
            email={draft.registeredEmail}
            domain={domain}
            stepsDone={2}
            stepsTotal={steps.length}
            signingIn={signingIn}
            onSignIn={() => void handleSignIn()}
            onChangeEmail={() =>
              setDraft(current => ({ ...current, step: 0, registeredEmail: '' }))
            }
          />
        ) : (
          <StepBody>
            <EmptyState
              icon={BadgeCheck}
              title='Sign in to continue'
              description='Sign in with your Sarafrika account to pick up where you left off.'
              action={
                <Button onClick={() => void handleSignIn()} disabled={signingIn}>
                  {signingIn && <Spinner />}Sign in to continue
                </Button>
              }
            />
          </StepBody>
        )}
        <FormError message={error} />
      </OnboardingFrame>
    );

  if (draft.step === 0) {
    const update = (name: keyof OnboardingDraft['personal'], value: string | boolean) => {
      setDraft(current => ({ ...current, personal: { ...current.personal, [name]: value } }));
      setFieldErrors(current => ({ ...current, [name]: '' }));
    };
    return (
      <OnboardingFrame
        steps={steps}
        current={0}
        title='Sarafrika account'
        description='Enter your details. We create your account after you choose your account type, then email you a link to set your password.'
      >
        <form
          noValidate
          onSubmit={event => {
            event.preventDefault();
            continueFromAccount();
          }}
        >
          <StepBody>
            <div className='grid gap-4 sm:grid-cols-2'>
              {(['first_name', 'last_name', 'email'] as const).map(name => (
                <div key={name} className='space-y-1.5'>
                  <Label htmlFor={name}>{PERSONAL_LABELS[name]}</Label>
                  <Input
                    id={name}
                    type={name === 'email' ? 'email' : 'text'}
                    autoComplete={AUTOCOMPLETE[name]}
                    value={draft.personal[name]}
                    onChange={event => update(name, event.target.value)}
                    aria-invalid={Boolean(fieldErrors[name])}
                    aria-describedby={fieldErrors[name] ? `${name}-error` : undefined}
                  />
                  {name === 'email' && !fieldErrors.email && (
                    <p className='text-muted-foreground text-xs'>Your password link goes here.</p>
                  )}
                  <FieldError id={name} message={fieldErrors[name]} />
                </div>
              ))}
              <div className='space-y-1.5'>
                <Label htmlFor='phone_number'>Phone number</Label>
                <PhoneInput
                  id='phone_number'
                  value={draft.personal.phone_number}
                  onChange={value => update('phone_number', value ?? '')}
                />
                <FieldError id='phone_number' message={fieldErrors.phone_number} />
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor='dob'>Date of birth</Label>
                <Input
                  id='dob'
                  type='date'
                  max={new Date().toLocaleDateString('en-CA')}
                  value={draft.personal.dob}
                  onChange={event => update('dob', event.target.value)}
                  aria-invalid={Boolean(fieldErrors.dob)}
                  aria-describedby={fieldErrors.dob ? 'dob-error' : undefined}
                />
                <FieldError id='dob' message={fieldErrors.dob} />
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor='gender'>Gender</Label>
                <Select
                  value={draft.personal.gender}
                  onValueChange={value => update('gender', value)}
                >
                  <SelectTrigger
                    id='gender'
                    className='w-full'
                    aria-invalid={Boolean(fieldErrors.gender)}
                  >
                    <SelectValue placeholder='Select gender' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='FEMALE'>Female</SelectItem>
                    <SelectItem value='MALE'>Male</SelectItem>
                    <SelectItem value='PREFER_NOT_TO_SAY'>Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError id='gender' message={fieldErrors.gender} />
              </div>
            </div>
            <div className='border-border space-y-2 border-t pt-5'>
              <div className='flex items-start gap-2.5'>
                <Checkbox
                  id='terms_accepted'
                  checked={draft.personal.terms_accepted}
                  onCheckedChange={value => update('terms_accepted', value === true)}
                />
                <Label htmlFor='terms_accepted' className='leading-5 font-normal'>
                  I accept the Sarafrika terms and conditions and privacy policy.
                </Label>
              </div>
              <FieldError id='terms_accepted' message={fieldErrors.terms_accepted} />
            </div>
            <div className='bg-primary/5 flex flex-wrap items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm'>
              <span className='text-foreground'>
                Already have a Sarafrika account? Sign in and we will add the new role to it.
              </span>
              <Button
                type='button'
                variant='link'
                className='h-auto p-0'
                onClick={() => void handleSignIn()}
                disabled={signingIn}
              >
                {signingIn && <Spinner />}Sign in
              </Button>
            </div>
          </StepBody>
          <StepFooter backDisabled primaryLabel='Save and continue' />
        </form>
      </OnboardingFrame>
    );
  }

  if (draft.step === 1 || !domain)
    return (
      <OnboardingFrame
        steps={steps}
        current={1}
        title='Account type'
        description='Choose how you will use Elimika. You can add more roles to the same account later.'
      >
        <form
          noValidate
          onSubmit={event => {
            event.preventDefault();
            if (draft.domain) void continueFromType(draft.domain);
          }}
        >
          <StepBody>
            <AccountTypeStep
              selected={draft.domain}
              onSelect={type => patch({ domain: type })}
              held={held}
            />
            <dl className='divide-border border-border divide-y border-t'>
              <SummaryRow label='Name' value={accountName} />
              <SummaryRow label='Email' value={accountEmail} />
            </dl>
          </StepBody>
          <FormError message={error} />
          <StepFooter
            onBack={authenticated ? undefined : () => goTo(0)}
            backDisabled={authenticated}
            primaryLabel={
              draft.domain === 'parent' ? 'Sign in to see invitations' : 'Save and continue'
            }
            pendingLabel={authenticated ? 'Saving…' : 'Creating your account…'}
            pending={pending}
            primaryDisabled={!draft.domain || held.includes(draft.domain)}
          />
        </form>
      </OnboardingFrame>
    );

  const copy = ROLE_COPY[domain];
  if (draft.step === 2)
    return (
      <OnboardingFrame
        steps={steps}
        current={2}
        kicker={kicker(2)}
        title={copy.detailsTitle}
        description={copy.detailsDescription}
      >
        {onboarding.isError ? (
          <StepBody>
            <EmptyState
              title='Unable to load your onboarding'
              description={getErrorMessage(onboarding.error, 'Please try again.')}
              action={
                <Button variant='outline' onClick={() => void onboarding.refetch()}>
                  Try again
                </Button>
              }
            />
          </StepBody>
        ) : domain === 'student' ? (
          onboarding.isPending ? (
            <StepBody>
              <Skeleton className='h-40 w-full' />
            </StepBody>
          ) : (
            <StudentDetails
              onboarding={onboarding.data}
              onBack={() => goTo(1)}
              onDone={() => goTo(3)}
            />
          )
        ) : domain === 'organisation_user' ? (
          <OrganisationDetails
            onboarding={onboarding.data}
            onBack={() => goTo(1)}
            onDone={() => goTo(3)}
          />
        ) : domain === 'instructor' ? (
          <InstructorDetails onBack={() => goTo(1)} onDone={() => goTo(3)} />
        ) : (
          <CategoriesStep onBack={() => goTo(1)} onDone={() => goTo(3)} />
        )}
      </OnboardingFrame>
    );

  if (draft.step === 3) {
    const walletStep = onboarding.data?.steps?.find(step => step.key === 'skills_wallet');
    return (
      <OnboardingFrame
        steps={steps}
        current={3}
        kicker={kicker(3)}
        title='Skills wallet'
        description='Your record of skills, education and experience. Everything you add is saved to your profile and reused by every role you hold.'
      >
        <StepBody>
          {walletStep?.required && (
            <p
              className={
                walletStep.complete
                  ? 'bg-success/10 text-foreground rounded-lg px-4 py-3 text-sm'
                  : 'bg-warning/10 text-foreground rounded-lg px-4 py-3 text-sm'
              }
            >
              {walletStep.complete
                ? `At least one skill added. That is all a ${copy.label} needs; the rest is optional.`
                : `Add at least one skill under My Skills. A ${copy.label} profile needs it before review.`}
            </p>
          )}
          {domain === 'course_creator' && <ProfileBasicsCard />}
          <OnboardingSkillsWallet key={userId} />
        </StepBody>
        <StepFooter
          onBack={() => goTo(2)}
          primaryLabel='Save and continue'
          onPrimary={() => goTo(4)}
        />
      </OnboardingFrame>
    );
  }

  return (
    <OnboardingFrame
      steps={steps}
      current={4}
      kicker={kicker(4)}
      title={domain === 'student' ? 'Get started' : 'Submit for review'}
      description={
        domain === 'student'
          ? 'Check your details, then start learning.'
          : `Check your information, then submit your ${copy.label} onboarding for admin verification.`
      }
    >
      <SubmitStep
        domain={domain}
        name={accountName}
        email={accountEmail}
        onboarding={onboarding.data}
        onboardingPending={onboarding.isPending}
        onBack={() => goTo(3)}
        onSubmitted={finish}
      />
    </OnboardingFrame>
  );
}
