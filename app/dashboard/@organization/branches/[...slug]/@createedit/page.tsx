import { getTrainingBranchByUuid, TrainingBranch } from '@/services/client';
import CreateEditBranchform from '../../_components/createedit-branch-form';
import { Action } from '../utils';

export default async function CreateEdit({ params }: { params: Promise<{ slug: Action[] }> }) {
  const {
    slug: [action, branch_uuid],
  } = await params;
  let branch;

  if (action == 'edit' && branch_uuid) {
    const branchResp = await getTrainingBranchByUuid({
      path: {
        uuid: branch_uuid,
      },
    });

    if (branchResp.error || !branchResp.data) {
      return <>No Branch</>;
    }
    branch = branchResp.data?.data as TrainingBranch;
  }

  return <CreateEditBranchform {...{ branch }} />;
}
