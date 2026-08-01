'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  GraduationCap,
  ShieldCheck,
  UserRoundPlus,
  XCircle,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { AsyncSection } from '@/components/data/async-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { GuardianDetailsRequest, GuardianRelationshipTypeEnum } from '@/services/client';
import {
  acceptInvitationByTokenMutation,
  declineInvitationByTokenMutation,
  getInvitationByTokenOptions,
  submitGuardianDetailsMutation,
} from '@/services/client/@tanstack/react-query.gen';

type Outcome = 'accepted' | 'declined' | 'guardian-requested';

const RELATIONSHIPS = [
  { value: 'PARENT', label: 'Parent' },
  { value: 'GUARDIAN', label: 'Guardian' },
  { value: 'SPONSOR', label: 'Sponsor' },
];

export function InvitationContent() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? '';
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';

  const [acknowledged, setAcknowledged] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [needsGuardian, setNeedsGuardian] = useState(false);
  const [guardian, setGuardian] = useState<GuardianDetailsRequest>({
    guardian_email: '',
    guardian_name: '',
    guardian_relationship_type: 'PARENT',
    guardian_phone: '',
  });

  const invitationQuery = useQuery({
    ...getInvitationByTokenOptions({ path: { token } }),
    enabled: Boolean(token),
    retry: false,
  });
  const invitation = invitationQuery.data?.data;

  const accept = useMutation(acceptInvitationByTokenMutation());
  const decline = useMutation(declineInvitationByTokenMutation());
  const nominateGuardian = useMutation(submitGuardianDetailsMutation());

  /** Where Keycloak should return the visitor once they have an account. */
  const returnHere = useMemo(
    () => (typeof window === 'undefined' ? '' : `${window.location.origin}/invitations/${token}`),
    [token]
  );

  const onAccept = async () => {
    try {
      const response = await accept.mutateAsync({
        path: { token },
        body: {
          scope_acknowledged: true,
          date_of_birth: dateOfBirth ? new Date(dateOfBirth) : null,
        },
      });
      const result = response?.data;
      if (result?.guardian_consent_required) {
        setNeedsGuardian(true);
        toast.info('We need a parent or guardian to approve this.');
        return;
      }
      setOutcome('accepted');
      toast.success(result?.message ?? 'You have joined the organisation.');
    } catch (err) {
      toast.error('Could not accept this invitation', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  const onDecline = async () => {
    try {
      await decline.mutateAsync({ path: { token } });
      setOutcome('declined');
    } catch (err) {
      toast.error('Could not decline this invitation', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  const onNominateGuardian = async () => {
    try {
      await nominateGuardian.mutateAsync({ path: { token }, body: guardian });
      setOutcome('guardian-requested');
    } catch (err) {
      toast.error('Could not send the request', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  if (outcome) {
    return <OutcomePanel outcome={outcome} organisationName={invitation?.organisation_name} />;
  }

  return (
    <AsyncSection
      loading={invitationQuery.isLoading && !invitationQuery.data}
      error={invitationQuery.error}
      skeleton={<Skeleton className='h-[520px] w-full rounded-xl' />}
      errorTitle='This invitation link is not valid'
      onRetry={invitationQuery.refetch}
    >
      <Card>
        <CardHeader>
          <Badge variant='secondary' className='mb-2 w-fit gap-1'>
            <Building2 className='h-3 w-3' /> Invitation
          </Badge>
          <CardTitle className='text-2xl'>
            {invitation?.organisation_name ?? 'An organisation'} has invited you
          </CardTitle>
          <CardDescription>
            {invitation?.inviter_name ? `${invitation.inviter_name} invited ` : 'You were invited '}
            {invitation?.masked_recipient_email} to join as a {invitation?.domain_name ?? 'student'}
            .
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-5'>
          {invitation?.message ? (
            <blockquote className='border-muted-foreground/30 text-muted-foreground border-l-2 pl-3 text-sm italic'>
              {invitation.message}
            </blockquote>
          ) : null}

          {invitation?.class_count ? (
            <div className='bg-muted/30 flex items-center gap-2 rounded-md border p-3 text-sm'>
              <GraduationCap className='text-muted-foreground h-4 w-4' />
              <span>
                {invitation.class_count} class{invitation.class_count === 1 ? '' : 'es'} will be
                shown to you once you accept — you still choose which to enrol in.
              </span>
            </div>
          ) : null}

          <ScopeDisclosure organisationName={invitation?.organisation_name} />

          {invitation?.expires_at ? (
            <p className='text-muted-foreground flex items-center gap-1.5 text-xs'>
              <CalendarClock className='h-3.5 w-3.5' />
              This invitation expires on {new Date(invitation.expires_at).toLocaleDateString()}.
            </p>
          ) : null}

          {!invitation?.actionable ? (
            <p className='border-destructive/30 bg-destructive/5 text-destructive rounded-md border p-3 text-sm'>
              This invitation is no longer open.
            </p>
          ) : needsGuardian ? (
            <GuardianForm
              value={guardian}
              onChange={setGuardian}
              onSubmit={onNominateGuardian}
              submitting={nominateGuardian.isPending}
            />
          ) : !isAuthenticated ? (
            <SignInPrompt
              existingUser={Boolean(invitation?.existing_platform_user)}
              onContinue={() => signIn('keycloak', { redirectTo: returnHere })}
              loading={status === 'loading'}
            />
          ) : (
            <AcceptControls
              acknowledged={acknowledged}
              onAcknowledgedChange={setAcknowledged}
              dateOfBirth={dateOfBirth}
              onDateOfBirthChange={setDateOfBirth}
              onAccept={onAccept}
              onDecline={onDecline}
              accepting={accept.isPending}
              declining={decline.isPending}
            />
          )}
        </CardContent>
      </Card>
    </AsyncSection>
  );
}

/**
 * The consent copy. States plainly what accepting does and does not give away — an
 * organisation only ever sees the student's activity in its own courses and classes.
 */
function ScopeDisclosure({ organisationName }: { organisationName?: string }) {
  const name = organisationName ?? 'This organisation';
  return (
    <div className='border-primary/30 bg-primary/5 rounded-md border p-4'>
      <p className='mb-2 flex items-center gap-2 text-sm font-semibold'>
        <ShieldCheck className='text-primary h-4 w-4' /> What {name} will be able to see
      </p>
      <ul className='text-muted-foreground space-y-1.5 text-sm'>
        <li className='flex gap-2'>
          <CheckCircle2 className='text-primary mt-0.5 h-3.5 w-3.5 shrink-0' />
          Your enrolment, attendance and performance in <strong>its own courses and classes</strong>
          .
        </li>
        <li className='flex gap-2'>
          <XCircle className='text-muted-foreground mt-0.5 h-3.5 w-3.5 shrink-0' />
          Not your learning with any other institution on Elimika.
        </li>
        <li className='flex gap-2'>
          <XCircle className='text-muted-foreground mt-0.5 h-3.5 w-3.5 shrink-0' />
          Not your wallet, payments or anything else on your account.
        </li>
      </ul>
      <p className='text-muted-foreground mt-2 text-xs'>
        You can leave the organisation at any time.
      </p>
    </div>
  );
}

function SignInPrompt({
  existingUser,
  onContinue,
  loading,
}: {
  existingUser: boolean;
  onContinue: () => void;
  loading: boolean;
}) {
  return (
    <div className='space-y-3 border-t pt-4'>
      <p className='text-muted-foreground text-sm'>
        {existingUser
          ? 'Sign in to your Elimika account to accept or decline this invitation.'
          : 'Create your Elimika account to accept this invitation. Signing up on its own does not join you to the organisation — you will come back here and decide.'}
      </p>
      <Button onClick={onContinue} disabled={loading} className='w-full sm:w-auto'>
        <UserRoundPlus className='mr-2 h-4 w-4' />
        {existingUser ? 'Sign in to continue' : 'Create an account to continue'}
        <ArrowRight className='ml-2 h-4 w-4' />
      </Button>
    </div>
  );
}

function AcceptControls({
  acknowledged,
  onAcknowledgedChange,
  dateOfBirth,
  onDateOfBirthChange,
  onAccept,
  onDecline,
  accepting,
  declining,
}: {
  acknowledged: boolean;
  onAcknowledgedChange: (v: boolean) => void;
  dateOfBirth: string;
  onDateOfBirthChange: (v: string) => void;
  onAccept: () => void;
  onDecline: () => void;
  accepting: boolean;
  declining: boolean;
}) {
  return (
    <div className='space-y-4 border-t pt-4'>
      <div className='space-y-2'>
        <Label htmlFor='dob' className='text-muted-foreground text-xs uppercase'>
          Date of birth
        </Label>
        <Input
          id='dob'
          type='date'
          value={dateOfBirth}
          onChange={e => onDateOfBirthChange(e.target.value)}
          max={new Date().toISOString().slice(0, 10)}
          className='sm:max-w-xs'
        />
        <p className='text-muted-foreground text-xs'>
          Only needed if we do not already have it. It is never shared with the organisation — we
          use it to check whether a parent or guardian needs to approve this.
        </p>
      </div>

      <label className='flex cursor-pointer items-start gap-2.5 text-sm'>
        <Checkbox
          checked={acknowledged}
          onCheckedChange={v => onAcknowledgedChange(v === true)}
          className='mt-0.5'
        />
        <span className='text-muted-foreground'>
          I understand what this organisation will be able to see about my learning with them.
        </span>
      </label>

      <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
        <Button variant='outline' onClick={onDecline} disabled={declining || accepting}>
          Decline
        </Button>
        <Button onClick={onAccept} disabled={!acknowledged || accepting || declining}>
          {accepting ? 'Joining…' : 'Accept and join'}
        </Button>
      </div>
    </div>
  );
}

function GuardianForm({
  value,
  onChange,
  onSubmit,
  submitting,
}: {
  value: GuardianDetailsRequest;
  onChange: (v: GuardianDetailsRequest) => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const ready = value.guardian_email.trim() !== '' && value.guardian_name.trim() !== '';
  return (
    <div className='space-y-4 border-t pt-4'>
      <div className='border-warning/30 bg-warning/5 rounded-md border p-3 text-sm'>
        <p className='font-medium'>We need a parent or guardian to approve this</p>
        <p className='text-muted-foreground mt-1'>
          You are under the age we can accept consent from directly. Tell us who to ask and we will
          email them their own link. Nothing is set up until they approve.
        </p>
      </div>

      <div className='grid gap-3 sm:grid-cols-2'>
        <div className='space-y-2'>
          <Label htmlFor='g-name'>Their full name</Label>
          <Input
            id='g-name'
            value={value.guardian_name}
            onChange={e => onChange({ ...value, guardian_name: e.target.value })}
            required
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='g-rel'>Relationship to you</Label>
          <Select
            value={value.guardian_relationship_type}
            onValueChange={v =>
              onChange({ ...value, guardian_relationship_type: v as GuardianRelationshipTypeEnum })
            }
          >
            <SelectTrigger id='g-rel'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RELATIONSHIPS.map(r => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='g-email'>Their email address</Label>
        <Input
          id='g-email'
          type='email'
          value={value.guardian_email}
          onChange={e => onChange({ ...value, guardian_email: e.target.value })}
          required
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='g-phone'>Their phone number (optional)</Label>
        <Input
          id='g-phone'
          value={value.guardian_phone ?? ''}
          onChange={e => onChange({ ...value, guardian_phone: e.target.value })}
        />
      </div>

      <div className='flex justify-end'>
        <Button onClick={onSubmit} disabled={!ready || submitting}>
          {submitting ? 'Sending…' : 'Ask them to approve'}
        </Button>
      </div>
    </div>
  );
}

function OutcomePanel({
  outcome,
  organisationName,
}: {
  outcome: Outcome;
  organisationName?: string;
}) {
  const copy = {
    accepted: {
      icon: <CheckCircle2 className='text-success h-8 w-8' />,
      title: `You have joined ${organisationName ?? 'the organisation'}`,
      body: 'Any classes they shared with you are now available in your dashboard. You still choose which ones to enrol in.',
      cta: { href: '/dashboard/student', label: 'Go to my dashboard' },
    },
    declined: {
      icon: <XCircle className='text-muted-foreground h-8 w-8' />,
      title: 'Invitation declined',
      body: 'Nothing was shared and no account changes were made. The organisation can send a fresh invitation if you change your mind.',
      cta: { href: '/', label: 'Back to Elimika' },
    },
    'guardian-requested': {
      icon: <ShieldCheck className='text-primary h-8 w-8' />,
      title: 'We have asked your parent or guardian',
      body: 'They will get an email with their own link. Nothing is set up until they approve it.',
      cta: { href: '/', label: 'Back to Elimika' },
    },
  }[outcome];

  return (
    <Card>
      <CardContent className='flex flex-col items-center gap-4 py-14 text-center'>
        {copy.icon}
        <div className='space-y-1.5'>
          <h2 className='text-xl font-semibold'>{copy.title}</h2>
          <p className='text-muted-foreground mx-auto max-w-md text-sm'>{copy.body}</p>
        </div>
        <Button asChild>
          <a href={copy.cta.href}>{copy.cta.label}</a>
        </Button>
      </CardContent>
    </Card>
  );
}
