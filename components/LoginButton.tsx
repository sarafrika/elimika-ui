'use client';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { useState } from 'react';
import { Button } from './ui/button';
import Spinner from './ui/spinner';

const DASHBOARD_OVERVIEW_PATH = '/dashboard/overview';

export default function LoginButton() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);

  if (session?.user?.email) {
    return <Button onClick={() => router.push(DASHBOARD_OVERVIEW_PATH)}>Go to Dashboard</Button>;
  }

  // status === "unauthenticated"
  return (
    <Button
      onClick={async evt => {
        evt.currentTarget.disabled = true;
        setIsSigningIn(true);
        await signIn('keycloak', {
          redirectTo: `${window.location.origin}${DASHBOARD_OVERVIEW_PATH}`,
        });
      }}
    >
      {isSigningIn ? <Spinner /> : 'Sign In'}
    </Button>
  );
}
