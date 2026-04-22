'use client';

import { useEffect, useMemo, useState } from 'react';

type ProfileQrCodeProps = {
  targetUrl?: string;
};

export function ProfileQrCode({ targetUrl }: ProfileQrCodeProps) {
  const [browserUrl, setBrowserUrl] = useState('');
  const qrTarget = targetUrl || browserUrl;
  const qrImageUrl = useMemo(() => {
    if (!qrTarget) return '';

    return `https://api.qrserver.com/v1/create-qr-code/?size=144x144&margin=6&data=${encodeURIComponent(qrTarget)}`;
  }, [qrTarget]);

  useEffect(() => {
    if (targetUrl || typeof window === 'undefined') return;

    setBrowserUrl(window.location.href);
  }, [targetUrl]);

  return (
    <a
      href={qrTarget || '#'}
      aria-label='Open this skills wallet'
      className='border-border bg-background grid size-[4.5rem] shrink-0 place-items-center overflow-hidden rounded-md border p-1'
    >
      {qrImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qrImageUrl} alt='' className='h-full w-full object-contain' />
      ) : (
        <span className='bg-muted block size-full animate-pulse rounded-sm' />
      )}
    </a>
  );
}
