'use client';

import { Share2 } from 'lucide-react';
import { useState } from 'react';
import { LinkShareCard } from '@/components/shared/link-share-card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { buildSocialShareUrl, openShareWindow } from '@/lib/share';
import { classSharePath, type ClassShareScope } from './class-share';

export function ShareAllClassesButton({
  kind,
  uuid,
}: {
  kind: ClassShareScope['kind'];
  uuid?: string;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant='outline'
        disabled={!uuid}
        onClick={() => {
          if (!uuid) return;
          setUrl(`${window.location.origin}${classSharePath({ kind, uuid })}`);
          setOpen(true);
        }}
      >
        <Share2 className='size-4' />
        Share all classes
      </Button>
      <DialogContent className='max-h-[90dvh] overflow-y-auto sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>Share all classes</DialogTitle>
          <DialogDescription>
            Share your {kind}&apos;s class listing with learners.
          </DialogDescription>
        </DialogHeader>
        <LinkShareCard
          title='Class listing link'
          description='Learners can browse your classes and open individual class invites.'
          url={url}
          footer={
            <div className='flex flex-wrap gap-2'>
              {(['whatsapp', 'facebook', 'twitter', 'linkedin', 'email'] as const).map(platform => (
                <Button
                  key={platform}
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    openShareWindow(
                      buildSocialShareUrl(platform, {
                        title: 'Explore our classes on Elimika',
                        url,
                      })
                    )
                  }
                >
                  {
                    {
                      whatsapp: 'WhatsApp',
                      facebook: 'Facebook',
                      twitter: 'X',
                      linkedin: 'LinkedIn',
                      email: 'Email',
                    }[platform]
                  }
                </Button>
              ))}
            </div>
          }
        />
      </DialogContent>
    </Dialog>
  );
}
