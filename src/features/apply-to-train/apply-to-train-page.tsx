'use client';

import { PageHeader } from '@/components/dashboard/page-header';
import { SectionError } from '@/components/data/async-section';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';
import { skillsMatchesHref } from '@/src/features/dashboard/lib/skills-matches-url';
import { useTrainingApplication } from '@/src/features/rate-card/hooks';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ApplyToTrainWizard, headingFor, type WizardHeading } from './apply-to-train-wizard';
import { ProfileStrip } from './components/profile-strip';
import { myTrainingApplicationsHref, trackApplicationHref } from './links';
import type { ApplyKind } from './types';
import { useDeepLinkItem } from './use-deep-link-item';

/**
 * The instructor's apply-to-train page. `?item=&kind=` preselects a course or programme;
 * `&application=` edits that pending application.
 */
export function ApplyToTrainPage({ embedded = false }: { embedded?: boolean }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { replaceBreadcrumbs } = useBreadcrumb();

  const itemUuid = searchParams.get('item');
  const kind: ApplyKind | null = itemUuid
    ? searchParams.get('kind') === 'program'
      ? 'program'
      : 'course'
    : null;
  const applicationUuid = itemUuid ? searchParams.get('application') : null;

  const deepLink = useDeepLinkItem(kind, itemUuid);
  const edited = useTrainingApplication(kind ?? 'course', itemUuid, applicationUuid);
  const [heading, setHeading] = useState<WizardHeading>(() => headingFor('course', null));
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    if (embedded) return;
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: dashboardUrl('instructor', 'overview') },
      {
        id: 'training-hub',
        title: 'Training hub',
        url: dashboardUrl('instructor', 'training-hub'),
      },
      { id: 'apply', title: 'Apply to train', url: pathname, isLast: true },
    ]);
  }, [replaceBreadcrumbs, pathname, embedded]);

  const onReset = useCallback(() => {
    setResetKey(key => key + 1);
    router.replace(embedded ? skillsMatchesHref('apply-to-train') : pathname, { scroll: false });
  }, [router, pathname, embedded]);

  const waitingItem = Boolean(itemUuid) && deepLink.loading;
  const waitingApplication =
    Boolean(applicationUuid) && edited.query.isLoading && !edited.application;

  let body: React.ReactNode;
  if (itemUuid && deepLink.error) {
    body = (
      <SectionError
        title='Couldn’t load this course'
        error={deepLink.error}
        onRetry={() => void deepLink.refetch()}
      />
    );
  } else if (applicationUuid && edited.query.error) {
    body = (
      <SectionError
        title='Couldn’t load your application'
        error={edited.query.error}
        onRetry={() => void edited.query.refetch()}
      />
    );
  } else if (waitingItem || waitingApplication) {
    body = <WizardSkeleton />;
  } else if (itemUuid && deepLink.notFound) {
    body = (
      <EmptyState
        variant='card'
        title='This course isn’t available'
        description='It may have been unpublished. Pick another one to apply for.'
        action={
          <Button variant='outline' size='sm' onClick={onReset}>
            Browse the catalogue
          </Button>
        }
      />
    );
  } else if (applicationUuid && edited.application && edited.application.status !== 'pending') {
    body = (
      <EmptyState
        variant='card'
        title='This application can no longer be edited'
        description='The creator has already decided on it.'
        action={
          <Button asChild variant='outline' size='sm'>
            <Link href={trackApplicationHref(kind ?? 'course', itemUuid ?? '')}>
              View application
            </Link>
          </Button>
        }
      />
    );
  } else {
    body = (
      <ApplyToTrainWizard
        key={`${resetKey}:${itemUuid ?? ''}:${applicationUuid ?? ''}`}
        initialItem={deepLink.item}
        application={applicationUuid ? edited.application : null}
        onHeading={setHeading}
        onReset={onReset}
      />
    );
  }

  return (
    <div className='mx-auto w-full max-w-[1600px] space-y-5 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]'>
      <PageHeader
        eyebrow={heading.eyebrow}
        title={
          applicationUuid && heading.title === 'Apply to train'
            ? 'Edit your application'
            : heading.title
        }
        description={heading.description}
        actions={
          <Button asChild variant='outline'>
            <Link href={myTrainingApplicationsHref()}>My applications</Link>
          </Button>
        }
      />
      <ProfileStrip />
      {body}
    </div>
  );
}

function WizardSkeleton() {
  return (
    <div className='space-y-5'>
      <Skeleton className='h-14 w-full rounded-2xl' />
      <div className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]'>
        <Skeleton className='h-96 rounded-2xl' />
        <Skeleton className='h-72 rounded-2xl' />
      </div>
    </div>
  );
}
