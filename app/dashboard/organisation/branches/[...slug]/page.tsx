import { ArrowLeft, Building2, Mail, MapPin, MapPinOff, Pencil, Phone } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/dashboard';
import { PinnedPlaceCard } from '@/components/maps/pinned-place-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { townFromAddress } from '@/lib/geocoding';
import { getTrainingBranchByUuid, type TrainingBranch } from '@/services/client';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';
import { OrgPage } from '../../_components/org-page';
import BranchOverviewStats from '../_components/branch-overview-stats';
import TabSection from '../_components/tabsection';
import type { Action } from './utils';

const ALL_BRANCHES_HREF = dashboardUrl('organisation', 'settings?tab=branches');

function BackLink() {
  return (
    <Link
      href={ALL_BRANCHES_HREF}
      className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm'
    >
      <ArrowLeft className='h-4 w-4' />
      All branches
    </Link>
  );
}

function initialsOf(name?: string | null) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('');
}

function ContactPerson({ branch }: { branch: TrainingBranch }) {
  return (
    <div className='flex min-w-0 flex-col gap-2'>
      <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
        Contact person
      </p>
      <div className='flex min-w-0 items-center gap-2'>
        <span className='bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold'>
          {initialsOf(branch.poc_name) || '—'}
        </span>
        <span className='text-foreground truncate font-semibold'>
          {branch.poc_name || 'No contact person'}
        </span>
      </div>
      <div className='flex flex-wrap gap-1.5'>
        {branch.poc_email ? (
          <Badge variant='outline' asChild>
            <a href={`mailto:${branch.poc_email}`}>
              <Mail />
              {branch.poc_email}
            </a>
          </Badge>
        ) : null}
        {branch.poc_telephone ? (
          <Badge variant='outline' asChild>
            <a href={`tel:${branch.poc_telephone}`}>
              <Phone />
              {branch.poc_telephone}
            </a>
          </Badge>
        ) : null}
      </div>
    </div>
  );
}

function NoPinCard({ branch, editHref }: { branch: TrainingBranch; editHref: string }) {
  return (
    <section className='border-border/70 bg-card text-card-foreground overflow-hidden rounded-xl border shadow-sm'>
      <div className='border-border/70 bg-muted/40 text-muted-foreground flex min-h-56 flex-col items-center justify-center gap-2 border-b p-6 text-center text-sm'>
        <MapPinOff className='h-6 w-6' />
        <p className='text-foreground font-semibold'>No pin yet</p>
        <p className='max-w-sm'>
          Classes and jobs at this branch take the branch pin as their location. Set it so learners
          and instructors know where to go.
        </p>
        <Button asChild size='sm' className='mt-1'>
          <Link href={editHref}>
            <MapPin className='h-4 w-4' />
            Set branch location
          </Link>
        </Button>
      </div>
      <div className='grid gap-5 p-4 sm:p-5 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]'>
        <div className='flex min-w-0 flex-col gap-2'>
          <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
            Location
          </p>
          <p className='text-foreground text-base font-semibold'>
            {branch.branch_name || 'Untitled branch'}
          </p>
          <p className='text-muted-foreground text-sm'>{branch.address || 'No address recorded'}</p>
        </div>
        <ContactPerson branch={branch} />
      </div>
    </section>
  );
}

export default async function ViewBranch({ params }: { params: Promise<{ slug: Action[] }> }) {
  const {
    slug: [branch_uuid],
  } = await params;

  if (!branch_uuid || branch_uuid === 'new' || branch_uuid === 'edit') {
    return null;
  }

  const branchResp = await getTrainingBranchByUuid({ path: { uuid: branch_uuid } });
  const branch = branchResp.error ? undefined : branchResp.data?.data;

  if (!branch?.uuid) {
    return (
      <OrgPage className='space-y-6'>
        <BackLink />
        <EmptyState
          variant='card'
          icon={Building2}
          title='Branch not found'
          description='This branch may have been deleted, or you no longer have access to it.'
          action={
            <Button asChild variant='outline'>
              <Link href={ALL_BRANCHES_HREF}>All branches</Link>
            </Button>
          }
        />
      </OrgPage>
    );
  }

  const editHref = dashboardUrl('organisation', `branches/edit/${branch.uuid}`);
  const town = townFromAddress(branch.address);
  const where = town ? ` in ${town}` : '';
  const hasPin = Number.isFinite(branch.latitude) && Number.isFinite(branch.longitude);

  return (
    <OrgPage className='space-y-6'>
      <div className='space-y-4'>
        <BackLink />
        <PageHeader
          title={branch.branch_name || 'Branch'}
          description={
            hasPin
              ? `Training site${where}. Classes and jobs here use this pin as their location.`
              : `Training site${where}. Set its pin so classes and jobs here have a location.`
          }
          actions={
            <Button asChild variant='outline'>
              <Link href={editHref}>
                <Pencil className='h-4 w-4' />
                Edit branch
              </Link>
            </Button>
          }
        />
      </div>

      {hasPin ? (
        <PinnedPlaceCard
          name={branch.branch_name || 'Branch'}
          address={branch.address}
          latitude={branch.latitude as number}
          longitude={branch.longitude as number}
          size='lg'
          sourceChip='Branch pin'
          actions={
            <>
              <Button asChild variant='outline' size='sm'>
                <Link href={editHref}>
                  <MapPin className='h-4 w-4' />
                  Edit location
                </Link>
              </Button>
              <span className='text-muted-foreground text-xs'>
                Moving the pin updates jobs and classes the next time they are saved.
              </span>
            </>
          }
          aside={<ContactPerson branch={branch} />}
        />
      ) : (
        <NoPinCard branch={branch} editHref={editHref} />
      )}

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <BranchOverviewStats
          organisationUuid={branch.organisation_uuid ?? ''}
          branchUuid={branch.uuid}
        />
      </div>

      <TabSection branch={branch} />
    </OrgPage>
  );
}
