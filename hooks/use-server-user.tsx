import { redirect } from 'next/navigation';
import { auth } from '../services/auth';
import { type ApiResponse, search, type SearchResponse, type User } from '../services/client';

export default async function useServerUser() {
  const session = await auth();
  if (!session) {
    return redirect('/');
  }

  const userResp = (await search({
    query: {
      searchParams: { email_eq: session.user.email },
    },
  })) as ApiResponse;

  const searchResponse = userResp.data as SearchResponse;

  if (
    searchResponse.error ||
    !searchResponse.data ||
    !searchResponse.data.content ||
    searchResponse.data.content.length === 0
  ) {
    return redirect('/');
  }

  return {
    ...searchResponse.data.content[0],
    id_token: session.user.id_token,
  } as User & { id_token: string };
}
