import { PublicTopNav } from '@/components/PublicTopNav';
import { GuardianRegistration } from '@/src/features/guardians/GuardianRegistration';

export default async function GuardianLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <div className='bg-background text-foreground min-h-screen'>
      <PublicTopNav />
      <main className='mx-auto w-full max-w-xl px-4 py-10 sm:px-6'>
        <GuardianRegistration token={token} />
      </main>
    </div>
  );
}
