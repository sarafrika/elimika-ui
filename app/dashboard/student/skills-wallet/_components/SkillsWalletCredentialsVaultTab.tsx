'use client';

import { Award, CheckCircle2, Clock, Download, Plus, ShieldCheck, XCircle } from 'lucide-react';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { WalletShareButton } from '@/app/dashboard/_components/skills-wallet/WalletShareButton';
import { downloadCredential } from '@/app/dashboard/_components/skills-wallet/credential-download';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import Spinner from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import {
  fmtDate,
  StatCard,
  type CredentialRecord,
  type SkillsWalletData,
} from './SkillsWalletShared';

type SkillsWalletCredentialsVaultTabProps = {
  data: Pick<SkillsWalletData, 'credentials' | 'externalCertificates' | 'studentName'> &
    Partial<Pick<SkillsWalletData, 'verificationEvents'>>;
  onAddCredential?: () => void;
};

export function SkillsWalletCredentialsVaultTab({
  data,
  onAddCredential,
}: SkillsWalletCredentialsVaultTabProps) {
  const rows = useMemo(
    () => [...data.credentials, ...data.externalCertificates],
    [data.credentials, data.externalCertificates]
  );
  const [downloading, setDownloading] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  useEffect(() => {
    const focusCredential = () => {
      const prefix = '#credentials/';
      if (!window.location.hash.startsWith(prefix)) return;
      const card = document.getElementById(
        `credential-${window.location.hash.slice(prefix.length)}`
      );
      card?.scrollIntoView({ block: 'center' });
      card?.focus({ preventScroll: true });
    };
    focusCredential();
    window.addEventListener('hashchange', focusCredential);
    return () => window.removeEventListener('hashchange', focusCredential);
  }, [rows]);
  const download = async (item: CredentialRecord) => {
    if (downloading) return;
    setDownloading(item.id);
    try {
      await downloadCredential(item, data.studentName);
      toast.success('Credential downloaded');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to download this credential.');
    } finally {
      setDownloading(null);
    }
  };
  const exportPdf = async () => {
    setExporting(true);
    try {
      const { exportCredentialsPdf } = await import('../credentials-pdf');
      exportCredentialsPdf({
        studentName: data.studentName,
        credentials: rows,
        verifications: data.verificationEvents ?? [],
      });
    } catch {
      toast.error('Unable to export credentials. Please try again.');
    } finally {
      setExporting(false);
    }
  };
  const verified = rows.filter(item => item.status === 'Verified').length;
  const pending = rows.filter(item => item.status === 'Pending').length;
  const expired = rows.filter(item => item.status === 'Expired').length;
  const organizations = new Set(rows.map(item => item.org)).size;

  const stats = [
    {
      icon: ShieldCheck,
      label: 'Total Credentials',
      value: rows.length,
      tint: 'bg-primary/10 text-primary',
    },
    {
      icon: CheckCircle2,
      label: 'Verified',
      value: verified,
      sub: `${rows.length ? Math.round((verified / rows.length) * 100) : 0}% of total`,
      tint: 'bg-success/10 text-success',
    },
    {
      icon: Clock,
      label: 'Pending',
      value: pending,
      sub: `${rows.length ? Math.round((pending / rows.length) * 100) : 0}% of total`,
      tint: 'bg-warning/10 text-warning',
    },
    {
      icon: XCircle,
      label: 'Expired',
      value: expired,
      sub: `${rows.length ? Math.round((expired / rows.length) * 100) : 0}% of total`,
      tint: 'bg-destructive/10 text-destructive',
    },
    {
      icon: Award,
      label: 'Issuing Orgs',
      value: organizations,
      tint: 'bg-secondary text-secondary-foreground',
    },
  ];

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'Verified') {
      return (
        <Badge className='bg-success/10 text-success border-0'>
          <CheckCircle2 className='mr-1 h-3 w-3' /> Verified
        </Badge>
      );
    }

    if (status === 'Pending') {
      return (
        <Badge className='bg-warning/10 text-warning border-0'>
          <Clock className='mr-1 h-3 w-3' /> Pending
        </Badge>
      );
    }

    return (
      <Badge className='bg-destructive/10 text-destructive border-0'>
        <XCircle className='mr-1 h-3 w-3' /> Expired
      </Badge>
    );
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div className='flex items-center gap-2'>
          <h2 className='text-xl font-semibold'>Credentials Vault</h2>
          <ShieldCheck className='text-primary h-5 w-5' />
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            onClick={() => void exportPdf()}
            disabled={exporting || rows.length === 0}
          >
            {exporting ? <Spinner /> : <Download className='h-3 w-3' />}
            Export PDF
          </Button>

          <Button className='bg-primary hover:bg-primary/90' onClick={onAddCredential}>
            <Plus className='h-3 w-3' /> Add Credential
          </Button>
        </div>
      </div>
      <p className='text-muted-foreground -mt-4 text-sm'>
        Store, manage and verify your certificates, licenses, degrees and credentials. Export
        includes verification proofs for sharing.
      </p>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-5'>
        {stats.map(stat => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {rows.length > 0 ? (
          rows.map(item => (
            <Card
              key={item.id}
              id={`credential-${encodeURIComponent(item.id)}`}
              tabIndex={-1}
              className='overflow-hidden rounded-sm pt-0'
            >
              <div className='from-primary/10 to-success/10 relative grid h-28 place-items-center bg-gradient-to-br'>
                <Award className='text-primary h-10 w-10' />
                <div className='absolute top-2 right-2'>
                  <StatusBadge status={item.status} />
                </div>
              </div>
              <CardContent className='p-4 pt-0'>
                <p className='font-medium'>{item.name}</p>
                <p className='text-muted-foreground text-xs'>{item.org}</p>
                <p className='text-muted-foreground mt-1 text-xs'>
                  Issued: {fmtDate(item.issued_at)}
                </p>
                <div className='mt-2'>
                  <p className='text-muted-foreground text-[10px] tracking-wider uppercase'>
                    Credential ID
                  </p>
                  <p className='font-mono text-xs'>{item.credential_code}</p>
                </div>
                <div className='mt-3 flex items-center gap-1'>
                  <WalletShareButton
                    compact
                    title={item.name}
                    label='Share'
                    getUrl={() => {
                      const url = toAuthenticatedMediaUrl(item.document_url);
                      return url
                        ? new URL(url, window.location.origin).href
                        : `${window.location.origin}${window.location.pathname}#credentials/${encodeURIComponent(item.id)}`;
                    }}
                  />
                  <Button
                    size='sm'
                    variant='ghost'
                    className='h-7 flex-1 text-xs'
                    aria-label={`Download ${item.name}`}
                    onClick={() => void download(item)}
                    disabled={Boolean(downloading)}
                  >
                    {downloading === item.id ? <Spinner /> : <Download className='mr-1 h-3 w-3' />}{' '}
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className='xl:col-span-4'>
            <CardContent className='text-muted-foreground p-8 text-center text-sm'>
              No certificates are connected yet. The vault is ready for both platform-issued and
              external uploads.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
