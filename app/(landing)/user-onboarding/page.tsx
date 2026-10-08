'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  LayoutGrid,
  ShieldCheck,
  UserRound,
  Wallet,
} from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { OnboardingSkillsWallet } from '@/src/features/onboarding/components/OnboardingSkillsWallet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { httpStatusOf } from '@/lib/api-errors';
import { STALE_TIMES } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import {
  applyForDomainMutation,
  getAllCategoriesOptions,
  getSummaryOptions,
  registerMutation,
  submitCurrentForVerificationMutation,
  updateCategoriesMutation,
} from '@/services/client/@tanstack/react-query.gen';
import {
  creatorOnboardingOptions,
  creatorOnboardingQueryKey,
  useCourseCreatorOnboarding,
} from '@/src/features/onboarding/hooks/useCourseCreatorOnboarding';
import {
  buildRegistrationRequest,
  emptyOnboardingDraft,
  ONBOARDING_DRAFT_KEY,
  ONBOARDING_VERIFICATION_PATH,
  type OnboardingDraft,
  personalDetailsSchema,
  readOnboardingDraft,
  requireApiData,
  requireApiSuccess,
} from '@/src/features/onboarding/lib/user-onboarding';
import { WALLET_SECTIONS } from '@/src/features/onboarding/lib/wallet-sections';

const STEPS = [
  { label: 'Sarafrika account', icon: BadgeCheck },
  { label: 'Sarafrika products', icon: LayoutGrid },
  { label: 'Account type', icon: UserRound },
  { label: 'Categories', icon: BookOpen },
  { label: 'Skills wallet', icon: Wallet },
  { label: 'Submit for review', icon: ShieldCheck },
];

const ACCOUNT_TYPES = [
  {
    id: 'course_creator',
    name: 'Course Creator',
    detail: 'Design and publish courses.',
    available: true,
  },
  { id: 'instructor', name: 'Instructor', detail: 'Deliver live classes.', available: false },
  { id: 'student', name: 'Student', detail: 'Enrol and learn at your own pace.', available: false },
  {
    id: 'organisation_user',
    name: 'Organisation',
    detail: 'Manage learning programmes.',
    available: false,
  },
  { id: 'parent', name: 'Parent', detail: "Support your child's learning.", available: false },
];

export default function UserOnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, status: sessionStatus } = useSession();
  const [draft, setDraft] = useState(emptyOnboardingDraft);
  const [hydrated, setHydrated] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [categoryPage, setCategoryPage] = useState(0);
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
  const needsSignIn = draft.step >= 3 && !authenticated;
  const onboarding = useCourseCreatorOnboarding(
    hydrated && authenticated && !wrongAccount && draft.step >= 2
  );
  const categoriesQuery = useQuery({
    ...getAllCategoriesOptions({ query: { pageable: { page: categoryPage, size: 24 } } }),
    select: response => requireApiData(response),
    enabled: hydrated && authenticated && !wrongAccount && draft.step === 3,
    staleTime: STALE_TIMES.reference,
  });
  const registration = useMutation(registerMutation());
  const walletSummary = useQuery({
    ...getSummaryOptions(),
    select: requireApiData,
    enabled: hydrated && authenticated && !wrongAccount && draft.step === 5,
    staleTime: STALE_TIMES.entity,
  });
  const application = useMutation(applyForDomainMutation(creatorOnboardingOptions));
  const saveCategories = useMutation(updateCategoriesMutation(creatorOnboardingOptions));
  const submit = useMutation(submitCurrentForVerificationMutation(creatorOnboardingOptions));
  const pending =
    registration.isPending || application.isPending || saveCategories.isPending || submit.isPending;
  const patch = (value: Partial<OnboardingDraft>) =>
    setDraft(current => ({ ...current, ...value }));

  useEffect(() => {
    try {
      setDraft(readOnboardingDraft(sessionStorage.getItem(ONBOARDING_DRAFT_KEY)));
    } catch {
      /* Keep the in-memory draft if storage is unavailable. */
    }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* Onboarding can still be completed in this tab. */
    }
  }, [draft, hydrated]);
  useEffect(() => {
    if (
      onboarding.data?.verification_status === 'SUBMITTED' ||
      onboarding.data?.verification_status === 'APPROVED'
    )
      router.replace(ONBOARDING_VERIFICATION_PATH);
  }, [onboarding.data?.verification_status, router]);
  useEffect(() => {
    if (hydrated && authenticated && !wrongAccount && draft.step >= 3 && !draft.ownerId)
      setDraft(current => ({ ...current, ownerId: userId }));
  }, [hydrated, authenticated, wrongAccount, draft.step, draft.ownerId, userId]);

  // Restore server selections once when resuming; refreshes must not overwrite edits.
  const [restoredCreator, setRestoredCreator] = useState('');
  useEffect(() => {
    const state = onboarding.data;
    if (!state?.course_creator_uuid || restoredCreator === state.course_creator_uuid) return;
    setRestoredCreator(state.course_creator_uuid);
    setDraft(current =>
      current.categories.length
        ? current
        : {
            ...current,
            categories: (state.categories ?? []).flatMap(item =>
              item.category_uuid ? [{ uuid: item.category_uuid, name: '' }] : []
            ),
          }
    );
  }, [onboarding.data, restoredCreator]);
  useEffect(() => {
    const page = categoriesQuery.data?.content;
    if (!page?.length) return;
    setDraft(current => ({
      ...current,
      categories: current.categories.map(selected => ({
        ...selected,
        name: page.find(category => category.uuid === selected.uuid)?.name ?? selected.name,
      })),
    }));
  }, [categoriesQuery.data]);

  const accountName = authenticated
    ? session?.user?.name
    : `${draft.personal.first_name} ${draft.personal.last_name}`.trim();
  const accountEmail = authenticated ? session?.user?.email : draft.personal.email;
  const hasCreatorProfile = Boolean(onboarding.data?.course_creator_uuid);
  const canAdvance = useMemo(() => {
    if (draft.step === 1) return draft.product === 'elimika';
    if (draft.step === 2)
      return (
        draft.domain === 'course_creator' &&
        (!authenticated ||
          (!onboarding.isPending &&
            (!onboarding.isError || httpStatusOf(onboarding.error) === 404)))
      );
    if (draft.step === 3)
      return draft.categories.length > 0 && hasCreatorProfile && !onboarding.isError;
    return true;
  }, [
    draft,
    authenticated,
    onboarding.isPending,
    onboarding.isError,
    onboarding.error,
    hasCreatorProfile,
  ]);

  const handleSignIn = async () => {
    setError('');
    setSigningIn(true);
    try {
      await signIn(
        'keycloak',
        { redirectTo: `${window.location.origin}/user-onboarding` },
        draft.registeredEmail
          ? { login_hint: draft.registeredEmail, prompt: 'login' }
          : { prompt: 'login' }
      );
    } catch (cause) {
      setError(getErrorMessage(cause, 'Unable to sign in. Please try again.'));
      setSigningIn(false);
    }
  };

  const advance = async () => {
    if (pending || !canAdvance) return;
    setError('');
    try {
      if (draft.step === 0) {
        if (!authenticated) {
          const details = personalDetailsSchema.safeParse(draft.personal);
          if (!details.success) {
            setFieldErrors(
              Object.fromEntries(
                details.error.issues.map(issue => [String(issue.path[0]), issue.message])
              )
            );
            return;
          }
          patch({ personal: details.data, step: 1 });
        } else patch({ step: 1, ownerId: userId });
        setFieldErrors({});
        return;
      }
      if (draft.step === 2) {
        if (!authenticated) {
          // The selected domain completes the registration payload here.
          const details = personalDetailsSchema.parse(draft.personal);
          requireApiSuccess(
            await registration.mutateAsync({
              body: buildRegistrationRequest(details, captchaToken),
            })
          );
          patch({ registeredEmail: details.email, step: 3 });
          setCaptchaToken('');
          toast.success('Check your email to set your password and verify your Sarafrika account.');
        } else {
          if (!hasCreatorProfile) {
            requireApiSuccess(
              await application.mutateAsync({ body: { domain: 'course_creator' } })
            );
            await queryClient.invalidateQueries({ queryKey: creatorOnboardingQueryKey() });
          }
          patch({ step: 3, ownerId: userId });
        }
        return;
      }
      if (draft.step === 3) {
        const response = await saveCategories.mutateAsync({
          body: { category_uuids: draft.categories.map(category => category.uuid) },
        });
        requireApiData(response);
        queryClient.setQueryData(creatorOnboardingQueryKey(), response);
        patch({ step: 4 });
        toast.success('Categories saved.');
        return;
      }
      if (draft.step === 5) {
        const response = await submit.mutateAsync({});
        requireApiData(response);
        queryClient.setQueryData(creatorOnboardingQueryKey(), response);
        try {
          sessionStorage.removeItem(ONBOARDING_DRAFT_KEY);
        } catch {
          /* Server state remains canonical. */
        }
        router.push(ONBOARDING_VERIFICATION_PATH);
        return;
      }
      patch({ step: draft.step + 1 });
    } catch (cause) {
      setError(getErrorMessage(cause, 'Unable to continue. Please try again.'));
    }
  };

  if (!hydrated || sessionStatus === 'loading')
    return (
      <OnboardingFrame step={0}>
        <Skeleton className='h-64 w-full' />
      </OnboardingFrame>
    );
  if (wrongAccount)
    return (
      <OnboardingFrame step={draft.step}>
        <EmptyState
          title='This draft belongs to a different account'
          description={`Sign in with ${draft.registeredEmail || 'the account that started this onboarding'} to resume, or start onboarding for your signed-in account.`}
          action={
            <>
              <Button onClick={() => void handleSignIn()} disabled={signingIn}>
                {signingIn && <Spinner />}Use another account
              </Button>
              <Button
                variant='outline'
                onClick={() => {
                  setDraft(emptyOnboardingDraft());
                  setRestoredCreator('');
                  queryClient.removeQueries({ queryKey: creatorOnboardingQueryKey() });
                }}
              >
                Start with this account
              </Button>
            </>
          }
        />
        {error && (
          <p role='alert' className='text-destructive mt-4 text-sm'>
            {error}
          </p>
        )}
      </OnboardingFrame>
    );
  if (needsSignIn)
    return (
      <OnboardingFrame step={3}>
        <EmptyState
          icon={BadgeCheck}
          title={draft.registeredEmail ? 'Verify your Sarafrika account' : 'Sign in to continue'}
          description={
            draft.registeredEmail
              ? `Check ${draft.registeredEmail} for the link to set your password and verify your email. Then sign in to choose your categories. Your progress is saved in this tab.`
              : 'Sign in with your Sarafrika account to resume onboarding.'
          }
          action={
            <Button onClick={() => void handleSignIn()} disabled={signingIn}>
              {signingIn && <Spinner />}Sign in and continue
            </Button>
          }
        />
        {error && (
          <p role='alert' className='text-destructive mt-4 text-sm'>
            {error}
          </p>
        )}
      </OnboardingFrame>
    );

  const updatePersonal = (name: keyof OnboardingDraft['personal'], value: string | boolean) => {
    setDraft(current => ({ ...current, personal: { ...current.personal, [name]: value } }));
    setFieldErrors(current => ({ ...current, [name]: '' }));
  };
  return (
    <OnboardingFrame step={draft.step}>
      <form
        onSubmit={event => {
          event.preventDefault();
          void advance();
        }}
      >
        <fieldset disabled={pending} className='space-y-5'>
          {draft.step === 0 &&
            (authenticated ? (
              <>
                <p className='text-muted-foreground text-sm'>
                  Continue with your existing Sarafrika account.
                </p>
                <dl>
                  <SummaryRow label='Name' value={session?.user?.name} />
                  <SummaryRow label='Email' value={session?.user?.email} />
                </dl>
              </>
            ) : (
              <>
                <p className='text-muted-foreground text-sm'>
                  Enter your details. Your account will be created after you choose Elimika and your
                  account type.
                </p>
                <div className='grid gap-4 sm:grid-cols-2'>
                  {(['first_name', 'last_name', 'email'] as const).map(name => (
                    <Field
                      key={name}
                      label={
                        { first_name: 'First name', last_name: 'Last name', email: 'Email' }[name]
                      }
                      id={name}
                      error={fieldErrors[name]}
                    >
                      <Input
                        id={name}
                        type={name === 'email' ? 'email' : 'text'}
                        autoComplete={
                          { first_name: 'given-name', last_name: 'family-name', email: 'email' }[
                            name
                          ]
                        }
                        required
                        value={draft.personal[name]}
                        onChange={event => updatePersonal(name, event.target.value)}
                        aria-invalid={Boolean(fieldErrors[name])}
                        aria-describedby={fieldErrors[name] ? `${name}-error` : undefined}
                      />
                    </Field>
                  ))}
                  <Field label='Phone number' id='phone_number' error={fieldErrors.phone_number}>
                    <PhoneInput
                      id='phone_number'
                      value={draft.personal.phone_number}
                      onChange={value => updatePersonal('phone_number', value ?? '')}
                    />
                  </Field>
                  <Field label='Date of birth' id='dob' error={fieldErrors.dob}>
                    <Input
                      id='dob'
                      type='date'
                      required
                      max={new Date().toLocaleDateString('en-CA')}
                      value={draft.personal.dob}
                      onChange={event => updatePersonal('dob', event.target.value)}
                      aria-invalid={Boolean(fieldErrors.dob)}
                      aria-describedby={fieldErrors.dob ? 'dob-error' : undefined}
                    />
                  </Field>
                  <Field label='Gender' id='gender' error={fieldErrors.gender}>
                    <Select
                      value={draft.personal.gender}
                      onValueChange={value => updatePersonal('gender', value)}
                    >
                      <SelectTrigger
                        id='gender'
                        aria-invalid={Boolean(fieldErrors.gender)}
                        aria-describedby={fieldErrors.gender ? 'gender-error' : undefined}
                      >
                        <SelectValue placeholder='Select gender' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='MALE'>Male</SelectItem>
                        <SelectItem value='FEMALE'>Female</SelectItem>
                        <SelectItem value='PREFER_NOT_TO_SAY'>Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <div className='flex items-center gap-2'>
                  <Checkbox
                    id='terms_accepted'
                    checked={draft.personal.terms_accepted}
                    onCheckedChange={value => updatePersonal('terms_accepted', value === true)}
                    aria-describedby={
                      fieldErrors.terms_accepted ? 'terms_accepted-error' : undefined
                    }
                  />
                  <Label htmlFor='terms_accepted'>
                    I accept the Sarafrika terms and conditions.
                  </Label>
                </div>
                {fieldErrors.terms_accepted && (
                  <p id='terms_accepted-error' role='alert' className='text-destructive text-sm'>
                    {fieldErrors.terms_accepted}
                  </p>
                )}
                <Field label='Captcha token (optional)' id='captcha_token'>
                  <Input
                    id='captcha_token'
                    value={captchaToken}
                    onChange={event => setCaptchaToken(event.target.value)}
                    autoComplete='off'
                  />
                </Field>
                <Button
                  type='button'
                  variant='link'
                  onClick={() => void handleSignIn()}
                  disabled={signingIn}
                >
                  {signingIn && <Spinner />}Already have a Sarafrika account? Sign in
                </Button>
              </>
            ))}
          {draft.step === 1 && (
            <>
              <p className='text-muted-foreground text-sm'>
                Choose the Sarafrika product you want to join.
              </p>
              <ChoiceCard
                title='Elimika'
                detail='Teaching, courses and digital workbooks.'
                selected={draft.product === 'elimika'}
                onSelect={() => patch({ product: 'elimika' })}
              />
            </>
          )}
          {draft.step === 2 && (
            <>
              <p className='text-muted-foreground text-sm'>
                Choose your account type. Course Creator is currently available for onboarding.
              </p>
              <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                {ACCOUNT_TYPES.map(type => (
                  <ChoiceCard
                    key={type.id}
                    title={type.name}
                    detail={type.detail}
                    disabled={!type.available}
                    selected={draft.domain === type.id}
                    onSelect={() => patch({ domain: 'course_creator' })}
                  />
                ))}
              </div>
              <dl>
                <SummaryRow label='Name' value={accountName} />
                <SummaryRow label='Email' value={accountEmail} />
              </dl>
              {!authenticated && (
                <p className='text-muted-foreground text-sm'>
                  Continuing creates your Sarafrika account with the Course Creator domain. Check
                  your email afterwards to set your password.
                </p>
              )}
              {authenticated && onboarding.isPending && (
                <p className='text-muted-foreground flex items-center gap-2 text-sm'>
                  <Spinner />
                  Checking your account…
                </p>
              )}
              {authenticated && onboarding.isError && httpStatusOf(onboarding.error) !== 404 && (
                <QueryError error={onboarding.error} retry={() => void onboarding.refetch()} />
              )}
            </>
          )}
          {draft.step === 3 && (
            <>
              <p className='text-muted-foreground text-sm'>
                Select the categories you want to create courses in. Continue to save your
                selections.
              </p>
              {onboarding.isPending ? (
                <Skeleton className='h-24 w-full' />
              ) : onboarding.isError ? (
                <QueryError error={onboarding.error} retry={() => void onboarding.refetch()} />
              ) : null}
              {categoriesQuery.isPending ? (
                <Skeleton className='h-48 w-full' />
              ) : categoriesQuery.isError ? (
                <QueryError
                  error={categoriesQuery.error}
                  retry={() => void categoriesQuery.refetch()}
                />
              ) : (
                <>
                  <div className='grid gap-2 sm:grid-cols-2'>
                    {categoriesQuery.data?.content
                      ?.filter(category => category.uuid && category.is_active !== false)
                      .map(category => {
                        const uuid = category.uuid;
                        if (!uuid) return null;
                        const selected = draft.categories.some(item => item.uuid === uuid);
                        return (
                          <ChoiceCard
                            key={uuid}
                            title={category.name}
                            detail={category.description ?? ''}
                            selected={selected}
                            onSelect={() =>
                              patch({
                                categories: selected
                                  ? draft.categories.filter(item => item.uuid !== uuid)
                                  : [...draft.categories, { uuid, name: category.name }],
                              })
                            }
                          />
                        );
                      })}
                  </div>
                  {!categoriesQuery.data?.content?.some(
                    category => category.uuid && category.is_active !== false
                  ) && (
                    <EmptyState
                      title='No categories available'
                      description='Please try another page or check again later.'
                    />
                  )}
                  <div className='flex items-center justify-between gap-3'>
                    <Button
                      type='button'
                      variant='outline'
                      disabled={categoryPage === 0 || categoriesQuery.isFetching}
                      onClick={() => setCategoryPage(current => current - 1)}
                    >
                      Previous
                    </Button>
                    <span className='text-muted-foreground text-sm'>Page {categoryPage + 1}</span>
                    <Button
                      type='button'
                      variant='outline'
                      disabled={
                        !categoriesQuery.data?.metadata?.hasNext || categoriesQuery.isFetching
                      }
                      onClick={() => setCategoryPage(current => current + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </>
              )}
              <p className='text-muted-foreground text-sm'>
                {draft.categories.length} categories selected
              </p>
            </>
          )}
          {draft.step === 4 && (
            <OnboardingSkillsWallet key={userId} />
          )}
          {draft.step === 5 && (
            <>
              <p className='text-muted-foreground text-sm'>
                Review your information and submit your course creator onboarding for admin
                verification.
              </p>
              <dl className='divide-border divide-y'>
                <SummaryRow label='Name' value={accountName} />
                <SummaryRow label='Email' value={accountEmail} />
                <SummaryRow label='Product' value='Elimika' />
                <SummaryRow label='Account type' value='Course Creator' />
                <SummaryRow
                  label='Categories'
                  value={draft.categories
                    .map(category => category.name || category.uuid)
                    .join(', ')}
                />
                {WALLET_SECTIONS.filter(section => section.key !== 'verification').map(section => (
                  <SummaryRow
                    key={section.key}
                    label={section.label}
                    value={
                      walletSummary.isPending
                        ? 'Loading…'
                        : walletSummary.isError
                          ? 'Unable to load wallet summary'
                          : `${Number(walletSummary.data?.section_counts?.[section.key === 'credentials' ? 'certifications' : section.key] ?? 0) + (section.key === 'credentials' ? Number(walletSummary.data?.section_counts?.documents ?? 0) : 0)} record(s)`
                    }
                  />
                ))}
              </dl>
              {onboarding.data?.review_reason && (
                <p className='text-muted-foreground text-sm'>
                  Previous review: {onboarding.data.review_reason}
                </p>
              )}
            </>
          )}
        </fieldset>
        {error && (
          <p role='alert' className='text-destructive mt-5 text-sm whitespace-pre-line'>
            {error}
          </p>
        )}
        <div className='border-border mt-8 flex items-center justify-between gap-3 border-t pt-5'>
          <Button
            type='button'
            variant='outline'
            disabled={pending || draft.step === 0 || draft.step === 3}
            onClick={() => {
              setError('');
              patch({ step: draft.step - 1 });
            }}
          >
            <ArrowLeft />
            Back
          </Button>
          <Button type='submit' disabled={pending || !canAdvance}>
            {pending ? <Spinner /> : draft.step === 5 ? <ShieldCheck /> : <ArrowRight />}
            {draft.step === 5
              ? pending
                ? 'Submitting…'
                : 'Submit for verification'
              : draft.step === 4
                ? 'Skip for now'
                : pending
                  ? 'Saving…'
                  : 'Continue'}
          </Button>
        </div>
      </form>
    </OnboardingFrame>
  );
}

function QueryError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <EmptyState
      title='Unable to load onboarding information'
      description={getErrorMessage(error, 'Please try again.')}
      action={
        <Button type='button' variant='outline' onClick={retry}>
          Try again
        </Button>
      }
    />
  );
}
function Field({
  label,
  id,
  error,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className='space-y-1.5'>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p id={`${id}-error`} role='alert' className='text-destructive text-sm'>
          {error}
        </p>
      )}
    </div>
  );
}
function SummaryRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className='flex justify-between gap-4 py-3 text-sm'>
      <dt className='text-muted-foreground'>{label}</dt>
      <dd className='text-foreground text-right font-medium'>{value || '—'}</dd>
    </div>
  );
}
function ChoiceCard({
  title,
  detail,
  selected,
  disabled,
  onSelect,
}: {
  title: string;
  detail: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <Button
      type='button'
      variant='outline'
      disabled={disabled}
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        'h-auto w-full flex-col items-start p-4 text-left whitespace-normal',
        selected && 'border-primary bg-primary/5'
      )}
    >
      <span className='flex w-full items-center justify-between gap-2 font-semibold'>
        {title}
        {selected && <CheckCircle2 className='text-primary h-4 w-4 shrink-0' />}
      </span>
      <span className='text-muted-foreground text-xs leading-5'>{detail}</span>
      {disabled && <span className='text-muted-foreground text-xs'>Coming soon</span>}
    </Button>
  );
}
function OnboardingFrame({ step, children }: { step: number; children: ReactNode }) {
  return (
    <div className='bg-muted/40 min-h-screen'>
      <div className='mx-auto max-w-6xl px-4 py-10 sm:px-6'>
        <h1 className='text-foreground text-2xl font-bold'>User Onboarding</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Join Elimika with your Sarafrika account and submit your course creator profile for
          review.
        </p>
        <ol className='my-8 flex items-center gap-2' aria-label='Onboarding progress'>
          {STEPS.map((item, index) => {
            const Icon = item.icon;
            return (
              <li
                key={item.label}
                aria-current={step === index ? 'step' : undefined}
                className='flex flex-1 items-center gap-2'
              >
                <span
                  className={cn(
                    'grid h-8 w-8 shrink-0 place-items-center rounded-full border',
                    step >= index
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground'
                  )}
                >
                  {step > index ? (
                    <CheckCircle2 className='h-4 w-4' />
                  ) : (
                    <Icon className='h-4 w-4' />
                  )}
                </span>
                <span className='hidden text-sm font-medium lg:block'>{item.label}</span>
              </li>
            );
          })}
        </ol>
        <Card>
          <CardContent className='p-6 sm:p-8'>
            <h2 className='text-foreground mb-5 text-lg font-semibold'>{STEPS[step]?.label}</h2>
            {children}
          </CardContent>
        </Card>
        <Button asChild variant='link' className='mt-4'>
          <Link href='/'>Back home</Link>
        </Button>
      </div>
    </div>
  );
}
