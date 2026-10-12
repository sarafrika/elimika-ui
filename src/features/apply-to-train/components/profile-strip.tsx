'use client';

import { Check, Mail, MapPin, Phone, WalletCards } from 'lucide-react';
import { useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUserProfile } from '@/context/profile-context';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { WalletSheet } from './wallet-sheet';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || 'IN';

/** Who is applying, and the reminder that their skills wallet goes along. */
export function ProfileStrip() {
  const profile = useUserProfile();
  const instructor = profile?.instructor;
  const [walletOpen, setWalletOpen] = useState(false);
  const name = instructor?.full_name || profile?.full_name || 'Your profile';
  const location = instructor?.location_name || instructor?.formatted_location || null;
  const image = toAuthenticatedMediaUrl(profile?.profile_image_url);

  return (
    <section className='bg-card flex flex-wrap items-center gap-x-6 gap-y-4 rounded-2xl border px-5 py-4 shadow-sm'>
      <div className='flex min-w-0 flex-[1_1_320px] items-center gap-3.5'>
        <Avatar className='size-12'>
          {image ? <AvatarImage src={image} alt='' /> : null}
          <AvatarFallback className='bg-primary/10 text-primary font-bold'>
            {initials(name)}
          </AvatarFallback>
        </Avatar>
        <div className='min-w-0'>
          <div className='text-foreground flex flex-wrap items-center gap-2 font-bold'>
            {name}
            {instructor?.admin_verified ? (
              <Badge variant='outline' className='border-success/40 bg-success/10 text-success'>
                <Check aria-hidden className='size-3' />
                Verified
              </Badge>
            ) : null}
          </div>
          <div className='text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm'>
            {profile?.email ? (
              <span className='inline-flex items-center gap-1'>
                <Mail aria-hidden className='size-3.5' />
                {profile.email}
              </span>
            ) : null}
            {profile?.phone_number ? (
              <span className='inline-flex items-center gap-1'>
                <Phone aria-hidden className='size-3.5' />
                {profile.phone_number}
              </span>
            ) : null}
            {location ? (
              <span className='inline-flex items-center gap-1'>
                <MapPin aria-hidden className='size-3.5' />
                {location}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <div className='border-primary/30 bg-primary/5 flex items-center gap-3 rounded-xl border px-3.5 py-2.5'>
        <WalletCards aria-hidden className='text-primary size-5 shrink-0' />
        <div className='text-sm'>
          <p className='text-foreground font-semibold'>Skills wallet shared automatically</p>
          <p className='text-muted-foreground'>Profile, credentials and wallet go with every application</p>
        </div>
        <Button type='button' variant='ghost' size='sm' className='text-primary' onClick={() => setWalletOpen(true)}>
          Preview
        </Button>
      </div>
      <WalletSheet open={walletOpen} onOpenChange={setWalletOpen} />
    </section>
  );
}
