'use client';

import { FileText } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/ui/empty-state';
import type { CredentialDocument } from '@/services/admin/credential-review';
import {
  CredentialDocumentCard,
  CredentialReviewDialog,
} from '../../_components/ui/credential-review';

interface CredentialReviewSectionProps {
  documents: CredentialDocument[];
  verifierIdentity: string;
}

export function CredentialReviewSection({ documents, verifierIdentity }: CredentialReviewSectionProps) {
  const [active, setActive] = useState<CredentialDocument | null>(null);

  if (documents.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        variant='compact'
        title='No documents uploaded'
        description='This user has not submitted any credentials for verification yet.'
      />
    );
  }

  return (
    <>
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
        {documents.map(document => (
          <CredentialDocumentCard
            key={document.id}
            document={document}
            onReview={() => setActive(document)}
          />
        ))}
      </div>

      <CredentialReviewDialog
        document={active}
        verifierIdentity={verifierIdentity}
        onClose={() => setActive(null)}
      />
    </>
  );
}
