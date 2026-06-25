import { adminTheme } from '../_components/ui/admin-theme';
import { AdminPageHeader } from '../_components/ui/AdminPageHeader';
import { RulesTable } from './_components/RulesTable';

export default function SystemConfigPage() {
  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='System configuration'
          description='Define platform rules and policies, scoped globally or per organisation. Click a rule to view and edit it.'
        />
        <RulesTable />
      </div>
    </main>
  );
}
