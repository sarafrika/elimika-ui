'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { ShareScopeEnum2 } from '@/services/client';
import {
  declineGuardianConsentMutation,
  getGuardianInvitationByTokenOptions,
  grantGuardianConsentMutation,
} from '@/services/client/@tanstack/react-query.gen';

const SHARE_SCOPES = [
  { value: 'FULL', label: 'Everything', hint: 'Academics and attendance' },
  { value: 'ACADEMICS', label: 'Academics only', hint: 'Grades and progress' },
  { value: 'ATTENDANCE', label: 'Attendance only', hint: 'Whether they showed up' },
];

export function GuardianConsentContent() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? '';
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';

  const [acknowledged, setAcknowledged] = useState(false);
  const [shareScope, setShareScope] = useState<ShareScopeEnum2>('FULL');
  const [outcome, setOutcome] = useState<'granted' | 'refused' | null>(null);

  const requestQuery = useQuery({
    ...getGuardianInvitationByTokenOptions({ path: { token } }),
    enabled: Boolean(token),
    retry: false,
  });
  const request = requestQuery.data?.data;

  const grant = useMutation(grantGuardianConsentMutation());
  const refuse = useMutation(declineGuardianConsentMutation());

  const returnHere = useMemo(
    () =>
      typeof window === 'undefined'
        ? ''
        : `${window.location.origin}/guardian-invitations/${token}`,
    [token]
  );

  const onGrant = async () => {
    try {
      await grant.mutateAsync({
        path: { token },
        body: { scope_acknowledged: true, share_scope: shareScope },
      });
      setOutcome('granted');
    } catch (err) {
      toast.error('Could not record your approval', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  const onRefuse = async () => {
    try {
      await refuse.mutateAsync({ path: { token } });
      setOutcome('refused');
    } catch (err) {
      toast.error('Could not record your decision', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  if (outcome) {
    return (
      <Card>
        <CardContent className='flex flex-col items-center gap-4 py-14 text-center'>
          {outcome === 'granted' ? (
            <CheckCircle2 className='text-success h-8 w-8' />
          ) : (
            <XCircle className='text-muted-foreground h-8 w-8' />
          )}
          <div className='space-y-1.5'>
            <h2 className='text-xl font-semibold'>
              {outcome === 'granted' ? 'Approved' : 'Not approved'}
            </h2>
            <p className='text-muted-foreground mx-auto max-w-md text-sm'>
              {outcome === 'granted'
                ? `${request?.student_name ?? 'They'} can now join ${request?.organisation_name ?? 'the organisation'}, and you can follow their learning from your dashboard. You can withdraw this at any time.`
                : 'Nothing was set up and the organisation gained no access.'}
            </p>
          </div>
          <Button asChild>
            <a href={outcome === 'granted' ? '/dashboard/parent' : '/'}>
              {outcome === 'granted' ? 'Go to my dashboard' : 'Back to Elimika'}
            </a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <AsyncSection
      loading={requestQuery.isLoading && !requestQuery.data}
      error={requestQuery.error}
      skeleton={<Skeleton className='h-[520px] w-full rounded-xl' />}
      errorTitle='This consent link is not valid'
      onRetry={requestQuery.refetch}
    >
      <Card>
        <CardHeader>
          <Badge variant='secondary' className='mb-2 w-fit gap-1'>
            <ShieldCheck className='h-3 w-3' /> Approval needed
          </Badge>
          <CardTitle className='text-2xl'>
            Approve {request?.student_name ?? 'a child'} joining{' '}
            {request?.organisation_name ?? 'an organisation'}?
          </CardTitle>
          <CardDescription>
            {request?.student_name ?? 'They'} ({request?.masked_student_email}) named you as their{' '}
            {(request?.guardian_relationship_type ?? 'guardian').toLowerCase()}. Because they are
            under the age we accept consent from directly, nothing has been set up without your
            approval.
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-5'>
          {request?.class_count ? (
            <div className='bg-muted/30 flex items-center gap-2 rounded-md border p-3 text-sm'>
              <GraduationCap className='text-muted-foreground h-4 w-4' />
              <span>
                {request.class_count} class{request.class_count === 1 ? '' : 'es'} would be shown to
                them — they still choose which to enrol in.
              </span>
            </div>
          ) : null}

          <div className='border-primary/30 bg-primary/5 rounded-md border p-4'>
            <p className='mb-2 flex items-center gap-2 text-sm font-semibold'>
              <ShieldCheck className='text-primary h-4 w-4' /> What{' '}
              {request?.organisation_name ?? 'the organisation'} will be able to see
            </p>
            <ul className='text-muted-foreground space-y-1.5 text-sm'>
              <li className='flex gap-2'>
                <CheckCircle2 className='text-primary mt-0.5 h-3.5 w-3.5 shrink-0' />
                Their enrolment, attendance and performance in{' '}
                <strong>its own courses and classes</strong>.
              </li>
              <li className='flex gap-2'>
                <XCircle className='text-muted-foreground mt-0.5 h-3.5 w-3.5 shrink-0' />
                Not their learning with any other institution on Elimika.
              </li>
            </ul>
          </div>

          {!request?.actionable ? (
            <p className='border-destructive/30 bg-destructive/5 text-destructive rounded-md border p-3 text-sm'>
              This request is no longer open.
            </p>
          ) : !isAuthenticated ? (
            <div className='space-y-3 border-t pt-4'>
              <p className='text-muted-foreground text-sm'>
                Sign in or create your Elimika account to make this decision. We need an account so
                the approval is recorded against you, and so you can withdraw it later.
              </p>
              <Button
                onClick={() => signIn('keycloak', { redirectTo: returnHere })}
                disabled={status === 'loading'}
                className='w-full sm:w-auto'
              >
                <UserRoundPlus className='mr-2 h-4 w-4' /> Continue to decide
                <ArrowRight className='ml-2 h-4 w-4' />
              </Button>
            </div>
          ) : (
            <div className='space-y-4 border-t pt-4'>
              <div className='space-y-2'>
                <Label
                  htmlFor='scope'
                  className='text-muted-foreground flex items-center gap-1.5 text-xs uppercase'
                >
                  <Eye className='h-3.5 w-3.5' /> What you want to see of their learning
                </Label>
                <Select value={shareScope} onValueChange={v => setShareScope(v as ShareScopeEnum2)}>
                  <SelectTrigger id='scope' className='sm:max-w-sm'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SHARE_SCOPES.map(s => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label} — {s.hint}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <label className='flex cursor-pointer items-start gap-2.5 text-sm'>
                <Checkbox
                  checked={acknowledged}
                  onCheckedChange={v => setAcknowledged(v === true)}
                  className='mt-0.5'
                />
                <span className='text-muted-foreground'>
                  I am this child&apos;s parent or guardian, and I understand what the organisation
                  will be able to see.
                </span>
              </label>

              <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
                <Button
                  variant='outline'
                  onClick={onRefuse}
                  disabled={refuse.isPending || grant.isPending}
                >
                  Do not approve
                </Button>
                <Button
                  onClick={onGrant}
                  disabled={!acknowledged || grant.isPending || refuse.isPending}
                >
                  {grant.isPending ? 'Recording…' : 'Approve'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AsyncSection>
  );
}
