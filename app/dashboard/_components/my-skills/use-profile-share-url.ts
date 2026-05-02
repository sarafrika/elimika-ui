'use client';

import { useEffect, useState } from 'react';

export type ProfileShareDomain = 'instructor' | 'student' | 'course_creator';

export function useProfileShareUrl(userUuid?: string | null, domain: ProfileShareDomain = 'instructor') {
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    if (!userUuid || typeof window === 'undefined') {
      setShareUrl('');
      return;
    }

    setShareUrl(`${window.location.origin}/profile-user/${userUuid}?domain=${domain}`);
  }, [domain, userUuid]);

  return shareUrl;
}
