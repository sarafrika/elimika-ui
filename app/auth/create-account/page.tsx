import CreateAccountPageClient from '@/app/auth/create-account/CreateAccountPageClient';
import { getRuntimeAuthRealm } from '@/lib/runtime-config';

export const dynamic = 'force-dynamic';

export default function CreateAccountPage() {
  const authRealm = getRuntimeAuthRealm();
  return <CreateAccountPageClient authRealm={authRealm} />;
}
