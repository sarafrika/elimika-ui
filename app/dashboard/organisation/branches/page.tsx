import { BranchesDirectory } from '@/src/features/organisation/branches/components/branches-directory';
import { OrgPage } from '../_components/org-page';

export default function BranchesPage() {
  return (
    <OrgPage>
      <BranchesDirectory />
    </OrgPage>
  );
}
