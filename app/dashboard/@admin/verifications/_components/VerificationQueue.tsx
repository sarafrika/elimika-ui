'use client';

import { Search, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CredentialDocument } from '@/services/admin/credential-review';
import {
  CredentialDocumentCard,
  CredentialReviewDialog,
} from '../../_components/ui/credential-review';

type RoleTab = 'all' | 'instructor' | 'course_creator';
type StatusFilter = 'all' | 'pending' | 'verified';

export function VerificationQueue({
  documents,
  verifierIdentity,
}: {
  documents: CredentialDocument[];
  verifierIdentity: string;
}) {
  const [role, setRole] = useState<RoleTab>('all');
  const [status, setStatus] = useState<StatusFilter>('pending');
  const [search, setSearch] = useState('');
  const [active, setActive] = useState<CredentialDocument | null>(null);

  const counts = useMemo(
    () => ({
      all: documents.length,
      instructor: documents.filter(d => d.role === 'instructor').length,
      course_creator: documents.filter(d => d.role === 'course_creator').length,
      pending: documents.filter(d => d.statusTone === 'warning').length,
    }),
    [documents]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return documents.filter(document => {
      if (role !== 'all' && document.role !== role) return false;
      if (status === 'pending' && document.statusTone !== 'warning') return false;
      if (status === 'verified' && !document.isVerified) return false;
      if (!term) return true;
      return [document.ownerName, document.title, document.documentTypeLabel].some(value =>
        value.toLowerCase().includes(term)
      );
    });
  }, [documents, role, status, search]);

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
        <Tabs value={role} onValueChange={value => setRole(value as RoleTab)}>
          <TabsList>
            <TabsTrigger value='all'>All · {counts.all}</TabsTrigger>
            <TabsTrigger value='instructor'>Instructors · {counts.instructor}</TabsTrigger>
            <TabsTrigger value='course_creator'>Creators · {counts.course_creator}</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className='flex flex-1 flex-wrap items-center justify-end gap-2'>
          <div className='relative min-w-[200px] flex-1 sm:max-w-xs'>
            <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder='Search by owner or document…'
              className='h-9 rounded-md border-border/70 bg-background pl-9 shadow-sm'
            />
          </div>
          <Select value={status} onValueChange={value => setStatus(value as StatusFilter)}>
            <SelectTrigger className='h-9 w-[150px] rounded-md border-border/70 bg-background shadow-sm'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='pending'>Pending ({counts.pending})</SelectItem>
              <SelectItem value='verified'>Verified</SelectItem>
              <SelectItem value='all'>All statuses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          variant='card'
          title='Nothing to review'
          description='No documents match the current filters. New submissions will appear here.'
        />
      ) : (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'>
          {filtered.map(document => (
            <CredentialDocumentCard
              key={document.id}
              document={document}
              showOwner
              onReview={() => setActive(document)}
            />
          ))}
        </div>
      )}

      <CredentialReviewDialog
        document={active}
        verifierIdentity={verifierIdentity}
        onClose={() => setActive(null)}
      />
    </div>
  );
}
