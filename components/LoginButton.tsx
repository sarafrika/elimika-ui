'use client';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useUserProfile } from '../context/profile-context';
import { Button } from './ui/button';
import Spinner from './ui/spinner';

export default function LoginButton() {
  const user = useUserProfile();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);

  if (user?.email) {
    return <Button onClick={() => router.push('/dashboard/overview')}>Go to Dashboard</Button>;
  }

  // status === "unauthenticated"
  return (
    <Button
      onClick={async evt => {
        evt.currentTarget.disabled = true;
        setIsSigningIn(true);
        await signIn('keycloak', {
          redirectTo: `${window.location.origin}/dashboard/overview`,
        });
      }}
    >
      {isSigningIn ? <Spinner /> : 'Sign In'}
    </Button>
  );
}
