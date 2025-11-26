'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RuleForm } from '../../_components/RuleForm';
import { Button } from '@/components/ui/button';

export default function CreateSystemRulePage() {
  const router = useRouter();

  return (
    <div className='mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <p className='text-xs uppercase tracking-wide text-muted-foreground'>System rules</p>
          <h1 className='text-3xl font-bold leading-tight'>Create a new rule</h1>
          <p className='text-muted-foreground text-sm'>
            Define category, scope, and payload values. All fields are responsive and easy to edit on any device.
          </p>
        </div>
        <Button variant='ghost' asChild className='gap-2'>
          <Link href='/dashboard/system-config'>
            <ArrowLeft className='h-4 w-4' />
            Back to rules
          </Link>
        </Button>
      </div>

      <RuleForm
        mode='create'
        onCancel={() => router.push('/dashboard/system-config')}
        onSuccess={() => router.push('/dashboard/system-config')}
      />
    </div>
  );
}
