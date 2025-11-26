'use client';

import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { RuleForm } from '../../_components/RuleForm';
import { useSystemRule } from '@/services/admin/system-config';
import { Card, CardContent } from '@/components/ui/card';

export default function EditSystemRulePage() {
  const params = useParams();
  const router = useRouter();
  const ruleId = typeof params?.uuid === 'string' ? params.uuid : Array.isArray(params?.uuid) ? params?.uuid[0] : '';

  const { data: rule, isLoading, error } = useSystemRule(ruleId ?? null);

  return (
    <div className='mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <p className='text-xs uppercase tracking-wide text-muted-foreground'>System rules</p>
          <h1 className='text-3xl font-bold leading-tight'>Edit rule</h1>
          <p className='text-muted-foreground text-sm'>Update status, scheduling, and payload for this rule.</p>
        </div>
        <Button variant='ghost' asChild className='gap-2'>
          <Link href='/dashboard/system-config'>
            <ArrowLeft className='h-4 w-4' />
            Back to rules
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <Card className='border-border/60 shadow-sm'>
          <CardContent className='flex items-center gap-3 py-6 text-muted-foreground'>
            <Loader2 className='h-4 w-4 animate-spin' />
            Loading rule details…
          </CardContent>
        </Card>
      ) : error ? (
        <Card className='border-destructive/50 bg-destructive/10 shadow-sm'>
          <CardContent className='py-6 text-sm text-destructive'>
            Unable to load this rule. Please try again.
          </CardContent>
        </Card>
      ) : rule ? (
        <RuleForm
          mode='edit'
          rule={rule}
          onCancel={() => router.push('/dashboard/system-config')}
          onSuccess={() => router.push('/dashboard/system-config')}
        />
      ) : null}
    </div>
  );
}
