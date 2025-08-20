import { redirect } from "next/navigation";
import useServerUser from "../../../../../hooks/use-server-user";
import { ApiResponse, getTrainingBranchesByOrganisation, Organisation, TrainingBranch } from "../../../../../services/client";
import { client } from "../../../../../services/client/client.gen";
import ManageBranchForm from "./_components/ManageBranchForm";


export default async function BranchesPage() {

  /* const user = await useServerUser();
  const organisationsResponse = await client.get({
    url: "/api/v1/organisations/search",
    query: {
      searchParams: {
        user_uuid_eq: user!.uuid,
        pagination: {
          page: 0,
          size: 1
        }
      }
    },
    headers: {
      Authorization: `Bearer ${user.id_token}`
    }
  }) as ApiResponse;

  if (organisationsResponse.error) {
    return redirect("/dashboard/account/training-center");
  }

  const organisation = organisationsResponse.data as Organisation;
  const branchesResponse = await getTrainingBranchesByOrganisation({
    path: {
      uuid: organisation.uuid!
    }
  }) as ApiResponse;

  let branches: TrainingBranch[] = [];
  if (branchesResponse.data && branchesResponse.data.content) {
    branches = branchesResponse.data.content as TrainingBranch[];
  } */

  return (<ManageBranchForm />);
}
