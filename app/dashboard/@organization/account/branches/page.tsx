import { redirect } from 'next/navigation';
import useServerUser from '../../../../../hooks/use-server-user';
import {
  ApiResponse,
  getTrainingBranchesByOrganisation,
  Organisation,
  TrainingBranch,
} from '../../../../../services/client';
import { client } from '../../../../../services/client/client.gen';
import ManageBranchForm from './_components/ManageBranchForm';

export default async function BranchesPage() {
  return <ManageBranchForm />;
}
