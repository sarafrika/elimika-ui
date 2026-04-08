'use client';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { useState } from 'react';
import { Button } from './ui/button';
import Spinner from './ui/spinner';

export default function LoginButton() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);

  if (session?.user?.email) {
    return <Button onClick={() => router.push('/dashboard/all-courses')}>Go to Dashboard</Button>;
  }

  // status === "unauthenticated"
  return (
    <Button
      onClick={async evt => {
        evt.currentTarget.disabled = true;
        setIsSigningIn(true);
        await signIn('keycloak', {
          redirectTo: `${window.location.origin}/dashboard/all-courses`,
        });
      }}
    >
      {isSigningIn ? <Spinner /> : 'Sign In'}
    </Button>
  );
}
