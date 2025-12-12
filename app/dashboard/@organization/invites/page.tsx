import { auth } from '../../../../services/auth';
import { search, type User } from '../../../../services/client';
import InvitesPageImproved from './_components/InvitesPageImproved';

export default async function Invitations() {
  /**
   * The following user search is to prevent the InvitesPage component from mounting if user
   * does not have organization_user domain. The reason for doing this is because this
   * component has a parallel route on the @instructor slot
   * */
  const session = await auth();
  const { data, error } = await search({
    query: {
      searchParams: {
        email_eq: session?.user.email,
      },
      pageable: {
        size: 1,
        page: 0,
      },
    },
  });

  if (!data || error || !data.data || !data.data.content) {
    return <>Error</>;
  }
  const user = data.data?.content[0] as User;
  if (!user.user_domain?.includes('organisation_user')) {
    return null;
  }

  /* End of the checks */

  return <InvitesPageImproved />;
}
