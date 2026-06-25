import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { adminTheme } from '../_components/ui/admin-theme';
import { AdminPageHeader } from '../_components/ui/AdminPageHeader';
import { RulesTable } from './_components/RulesTable';

export default function SystemConfigPage() {
  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='System configuration'
          description='Define platform rules and policies, scoped globally or per organisation.'
          actions={
            <Button asChild>
              <Link href='/dashboard/system-config/rules/new'>
                <Plus className='size-4' />
                New rule
              </Link>
            </Button>
          }
        />
        <RulesTable />
      </div>
    </main>
  );
}
