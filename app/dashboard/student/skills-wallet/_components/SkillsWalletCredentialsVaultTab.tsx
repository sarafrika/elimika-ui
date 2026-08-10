'use client';

import { Award, CheckCircle2, Clock, Download, Plus, Share2, ShieldCheck, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { fmtDate, StatCard, type SkillsWalletData } from './SkillsWalletShared';

type SkillsWalletCredentialsVaultTabProps = {
  data: Pick<SkillsWalletData, 'credentials' | 'externalCertificates' | 'studentName'>;
  onAddCredential?: () => void;
};

export function SkillsWalletCredentialsVaultTab({
  data,
  onAddCredential,
}: SkillsWalletCredentialsVaultTabProps) {
  const rows = [...data.credentials, ...data.externalCertificates];
  const verified = rows.filter(item => item.status === 'Verified').length;
  const pending = rows.filter(item => item.status === 'Pending').length;
  const expired = rows.filter(item => item.status === 'Expired').length;
  const organizations = new Set(rows.map(item => item.org)).size;

  const stats = [
    { icon: ShieldCheck, label: 'Total Credentials', value: rows.length, tint: 'bg-primary/10 text-primary' },
    { icon: CheckCircle2, label: 'Verified', value: verified, sub: `${rows.length ? Math.round((verified / rows.length) * 100) : 0}% of total`, tint: 'bg-success/10 text-success' },
    { icon: Clock, label: 'Pending', value: pending, sub: `${rows.length ? Math.round((pending / rows.length) * 100) : 0}% of total`, tint: 'bg-warning/10 text-warning' },
    { icon: XCircle, label: 'Expired', value: expired, sub: `${rows.length ? Math.round((expired / rows.length) * 100) : 0}% of total`, tint: 'bg-destructive/10 text-destructive' },
    { icon: Award, label: 'Issuing Orgs', value: organizations, tint: 'bg-secondary text-secondary-foreground' },
  ];

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'Verified') {
      return (
        <Badge className='border-0 bg-success/10 text-success'>
          <CheckCircle2 className='mr-1 h-3 w-3' /> Verified
        </Badge>
      );
    }

    if (status === 'Pending') {
      return (
        <Badge className='border-0 bg-warning/10 text-warning'>
          <Clock className='mr-1 h-3 w-3' /> Pending
        </Badge>
      );
    }

    return (
      <Badge className='border-0 bg-destructive/10 text-destructive'>
        <XCircle className='mr-1 h-3 w-3' /> Expired
      </Badge>
    );
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div className='flex items-center gap-2'>
          <h2 className='text-xl font-semibold'>Credentials Vault</h2>
          <ShieldCheck className='h-5 w-5 text-primary' />
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline'>
            <Download className='h-3 w-3' />
            Export PDF
          </Button>

          <Button className='bg-primary hover:bg-primary/90' onClick={onAddCredential}>
            <Plus className='h-3 w-3' /> Add Credential
          </Button>
        </div>
      </div>
      <p className='-mt-4 text-sm text-muted-foreground'>
        Store, manage and verify your certificates, licenses, degrees and credentials. Export includes verification proofs for sharing.
      </p>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-5'>
        {stats.map(stat => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {rows.length > 0 ? (
          rows.map(item => (
            <Card key={item.id} className='overflow-hidden pt-0 rounded-sm'>
              <div className='relative grid h-28 place-items-center bg-gradient-to-br from-primary/10 to-success/10'>
                <Award className='h-10 w-10 text-primary' />
                <div className='absolute right-2 top-2'>
                  <StatusBadge status={item.status} />
                </div>
              </div>
              <CardContent className='p-4 pt-0'>
                <p className='font-medium'>{item.name}</p>
                <p className='text-xs text-muted-foreground'>{item.org}</p>
                <p className='mt-1 text-xs text-muted-foreground'>Issued: {fmtDate(item.issued_at)}</p>
                <div className='mt-2'>
                  <p className='text-[10px] uppercase tracking-wider text-muted-foreground'>Credential ID</p>
                  <p className='font-mono text-xs'>{item.credential_code}</p>
                </div>
                <div className='mt-3 flex items-center gap-1'>
                  <Button size='sm' variant='ghost' className='h-7 flex-1 text-xs'>
                    <Share2 className='mr-1 h-3 w-3' /> Share
                  </Button>
                  <Button size='sm' variant='ghost' className='h-7 flex-1 text-xs'>
                    <Download className='mr-1 h-3 w-3' /> Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className='xl:col-span-4'>
            <CardContent className='p-8 text-center text-sm text-muted-foreground'>
              No certificates are connected yet. The vault is ready for both platform-issued and external uploads.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
