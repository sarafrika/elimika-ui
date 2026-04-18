'use client';

import { ChevronRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import type { CredentialItem } from '../data';

type CredentialCertificateCardProps = {
  item: CredentialItem;
  ownerName: string;
};

function CertificatePreview({
  ownerName,
  issuer,
  documentLabel,
}: {
  ownerName: string;
  issuer: string;
  documentLabel: string;
}) {
  return (
    <div className='relative overflow-hidden rounded-t-[16px] border-b bg-[linear-gradient(180deg,color-mix(in_srgb,var(--background)_96%,white_4%),color-mix(in_srgb,var(--background)_88%,var(--el-accent-azure)_12%))] p-4'>
      <div className='rounded-[12px] border border-[color-mix(in_srgb,var(--border)_85%,white)] bg-white/95 p-4 shadow-[0_18px_40px_-28px_rgba(26,56,126,0.55)]'>
        <div className='flex items-start justify-between gap-4 border-b pb-3'>
          <div>
            <p className='text-foreground text-xl font-semibold'>{documentLabel}</p>
            <p className='text-muted-foreground text-xs'>{issuer} credential authority</p>
          </div>
          <div className='h-14 w-11 rounded-sm border-2 border-[color-mix(in_srgb,var(--primary)_35%,white)] bg-[linear-gradient(180deg,white,color-mix(in_srgb,var(--el-accent-azure)_18%,white))]' />
        </div>
        <div className='space-y-3 pt-4'>
          <div className='h-2.5 w-28 rounded-full bg-[color-mix(in_srgb,var(--primary)_12%,white)]' />
          <div className='text-foreground text-2xl font-semibold'>{ownerName}</div>
          <div className='h-2 w-40 rounded-full bg-muted' />
          <div className='h-2 w-32 rounded-full bg-muted/75' />
        </div>
      </div>
      <div className='absolute right-5 bottom-5 h-14 w-14 rounded-full border border-[color-mix(in_srgb,var(--primary)_18%,white)] bg-white/85 shadow-sm' />
    </div>
  );
}

export function CredentialCertificateCard({
  item,
  ownerName,
}: CredentialCertificateCardProps) {
  const StatusIcon = item.statusIcon;

  return (
    <Card className='gap-0 overflow-hidden rounded-[18px] border-white/60 bg-card/95 py-0 shadow-sm'>
      <CertificatePreview
        ownerName={ownerName}
        issuer={item.issuer}
        documentLabel={item.documentLabel}
      />

      <div className='space-y-4 px-5 py-4'>
        <div className='space-y-2'>
          <h3 className='text-foreground text-[1.65rem] font-semibold tracking-tight'>
            {item.title}
          </h3>
          <div className='flex flex-wrap items-center gap-3 text-base'>
            <span className='text-[1.45rem] font-semibold text-[color-mix(in_srgb,var(--primary)_62%,var(--el-accent-amber))]'>
              {item.issuer}
            </span>
            <span className='text-muted-foreground'>|</span>
            <span className='text-muted-foreground'>{item.stage}</span>
            <Badge
              variant='secondary'
              className='rounded-lg bg-[color-mix(in_srgb,var(--primary)_8%,white)] px-3 py-1 text-primary'
            >
              {item.level}
            </Badge>
          </div>
        </div>

        <div className='flex flex-wrap gap-2'>
          <Badge
            variant='outline'
            className='min-h-10 rounded-lg border-white/70 bg-background/80 px-3 text-sm font-medium text-muted-foreground'
          >
            <StatusIcon className='text-success size-4' />
            {item.status}
          </Badge>
          <Button variant='outline' className='min-h-10 rounded-lg border-white/70 bg-background/80 px-4'>
            {item.actionLabel}
            <ChevronRight className='size-4' />
          </Button>
        </div>
      </div>
    </Card>
  );
}
