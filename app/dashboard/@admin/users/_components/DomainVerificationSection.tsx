'use client';

import { useMutation } from '@tanstack/react-query';
import { BadgeCheck, GraduationCap, ShieldCheck, ShieldX, Star } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { CredentialDocument, CredentialRecord, DomainVerification } from '@/services/admin/credential-review';
import {
  unverifyCourseCreatorMutation,
  unverifyInstructorMutation,
  verifyCourseCreatorMutation,
  verifyInstructorMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { adminTheme } from '../../_components/ui/admin-theme';
import {
  CredentialDocumentCard,
  CredentialReviewDialog,
} from '../../_components/ui/credential-review';
import { DetailGrid } from '../../_components/ui/DetailPanel';
import { SectionCard } from '../../_components/ui/SectionCard';
import { StatusBadge } from '../../_components/ui/StatusBadge';

function RecordList({ title, records }: { title: string; records: CredentialRecord[] }) {
  if (!records.length) return null;
  return (
    <div className='space-y-2'>
      <p className={adminTheme.sectionLabel}>{title}</p>
      <div className='space-y-3'>
        {records.map(record => (
          <div key={record.id} className='rounded-md border border-border/60 bg-muted/20 p-3'>
            <div className='mb-2'>
              <p className='text-sm font-medium text-foreground'>{record.title}</p>
              {record.subtitle ? (
                <p className='text-xs text-muted-foreground'>{record.subtitle}</p>
              ) : null}
            </div>
            <DetailGrid items={record.details} columns={3} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DomainVerificationSection({
  domain,
  verifierIdentity,
  onChanged,
}: {
  domain: DomainVerification;
  verifierIdentity: string;
  onChanged: () => void;
}) {
  const [active, setActive] = useState<CredentialDocument | null>(null);

  const verifyInstructor = useMutation(verifyInstructorMutation());
  const unverifyInstructor = useMutation(unverifyInstructorMutation());
  const verifyCreator = useMutation(verifyCourseCreatorMutation());
  const unverifyCreator = useMutation(unverifyCourseCreatorMutation());
  const isPending =
    verifyInstructor.isPending ||
    unverifyInstructor.isPending ||
    verifyCreator.isPending ||
    unverifyCreator.isPending;

  const toggleDomainVerification = async () => {
    const verify = !domain.adminVerified;
    try {
      if (domain.role === 'instructor') {
        const mutation = verify ? verifyInstructor : unverifyInstructor;
        await mutation.mutateAsync({ path: { uuid: domain.profileUuid } });
      } else {
        const mutation = verify ? verifyCreator : unverifyCreator;
        await mutation.mutateAsync({ path: { uuid: domain.profileUuid } });
      }
      toast.success(verify ? `${domain.roleLabel} verified` : `${domain.roleLabel} verification revoked`);
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Action failed');
    }
  };

  const verifiedDocs = domain.documents.filter(d => d.isVerified).length;

  return (
    <SectionCard
      title={
        <span className='flex items-center gap-2'>
          <GraduationCap className='size-4 text-muted-foreground' />
          {domain.roleLabel}
        </span>
      }
      description={domain.headline || domain.location || `${domain.documents.length} document(s)`}
      actions={
        <div className='flex items-center gap-2'>
          <StatusBadge
            status={domain.adminVerified ? 'verified' : 'pending'}
            label={domain.adminVerified ? 'Verified' : 'Unverified'}
          />
          <Button
            size='sm'
            variant={domain.adminVerified ? 'outline' : 'default'}
            disabled={isPending}
            onClick={toggleDomainVerification}
          >
            {domain.adminVerified ? (
              <>
                <ShieldX className='size-4' />
                Revoke
              </>
            ) : (
              <>
                <BadgeCheck className='size-4' />
                Verify {domain.roleLabel.toLowerCase()}
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className='space-y-6'>
        {/* Profile summary */}
        <DetailGrid
          items={[
            { label: 'Headline', value: domain.headline || '—' },
            { label: 'Location', value: domain.location || '—' },
            {
              label: 'Documents',
              value: `${verifiedDocs}/${domain.documents.length} verified`,
            },
          ]}
          columns={3}
        />

        {/* Documents */}
        <div className='space-y-2'>
          <p className={adminTheme.sectionLabel}>Documents</p>
          {domain.documents.length ? (
            <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
              {domain.documents.map(document => (
                <CredentialDocumentCard
                  key={document.id}
                  document={document}
                  onReview={() => setActive(document)}
                />
              ))}
            </div>
          ) : (
            <p className='flex items-center gap-2 rounded-md border border-dashed border-border/60 bg-muted/20 px-3 py-3 text-sm text-muted-foreground'>
              <ShieldCheck className='size-4' />
              No documents uploaded for this domain.
            </p>
          )}
        </div>

        {/* Skills */}
        {domain.skills.length ? (
          <div className='space-y-2'>
            <p className={adminTheme.sectionLabel}>Skills</p>
            <div className='flex flex-wrap gap-1.5'>
              {domain.skills.map(skill => (
                <Badge key={skill} variant='secondary' className='font-normal capitalize'>
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        <RecordList title='Education' records={domain.education} />
        <RecordList title='Certifications' records={domain.certifications} />
        <RecordList title='Experience' records={domain.experience} />
        <RecordList title='Memberships' records={domain.memberships} />

        {/* Authored content */}
        <RecordList title={domain.contentLabel} records={domain.content} />

        {/* Reviews */}
        {domain.reviews.length ? (
          <div className='space-y-2'>
            <p className={adminTheme.sectionLabel}>
              <span className='flex items-center gap-1.5'>
                Reviews
                {domain.averageRating != null ? (
                  <span className='inline-flex items-center gap-1 text-foreground'>
                    <Star className='size-3.5 fill-warning text-warning' />
                    {domain.averageRating} · {domain.reviewCount}
                  </span>
                ) : null}
              </span>
            </p>
            <div className='space-y-3'>
              {domain.reviews.map(record => (
                <div key={record.id} className='rounded-md border border-border/60 bg-muted/20 p-3'>
                  <div className='mb-2'>
                    <p className='text-sm font-medium text-foreground'>{record.title}</p>
                    {record.subtitle ? (
                      <p className='text-xs text-muted-foreground'>{record.subtitle}</p>
                    ) : null}
                  </div>
                  <DetailGrid items={record.details} columns={2} />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <CredentialReviewDialog
        document={active}
        verifierIdentity={verifierIdentity}
        onClose={() => setActive(null)}
        onVerified={onChanged}
      />
    </SectionCard>
  );
}
