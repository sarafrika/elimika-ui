import { TrainingCenter } from "@/lib/types";
import { ApiResponse, getTrainingBranchesByOrganisation, getUsersByOrganisation, SearchResponse, TrainingBranch, User } from "@/services/client";
import { client } from "@/services/client/client.gen";
import { queryOptions, useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { createContext, ReactNode, useContext } from "react";
import CustomLoader from "../components/custom-loader";
import { useUserProfile } from "./profile-context";

const OrganisationContext = createContext<TrainingCenter | undefined>(undefined);
export const useOrganization = () => useContext(OrganisationContext);

export default function OrganisactionProvider({ children }: { children: ReactNode }) {
    const { data: session } = useSession();
    const userProfile = useUserProfile();

    const { data, isLoading } = useQuery(createQueryOptions({
        userid: userProfile?.uuid!,
        token: session?.user.id_token!
    }, {
        enabled: !!userProfile && !!session && !!session!.user
    }));

    return (
        <OrganisationContext.Provider value={data as TrainingCenter}>
            {isLoading ? <CustomLoader /> : children}
        </ OrganisationContext.Provider>
    )
}

function createQueryOptions(reqParams: { userid: string, token: string }, options?: Omit<UseQueryOptions<TrainingCenter | null>, "queryKey" | "queryFn" | "staleTime">) {
    return queryOptions({
        ...options,
        queryKey: ["organization"],
        queryFn: async () => {

            const orgResp = await client.get({
                url: "/api/v1/organisations/search",
                query: {
                    searchParams: {
                        user_uuid_eq: reqParams.userid!
                    },
                    pageable: {
                        size: 1,
                        page: 0
                    }
                },
                headers: {
                    Authorization: `Bearer ${reqParams.token}`
                }
            }) as ApiResponse;

            const orgRespData = orgResp.data as SearchResponse;

            if (!orgRespData.data || !orgRespData.data.content || orgRespData.data.content.length === 0)
                return null;

            const organizationData = {
                ...orgRespData.data.content[0]
            } as TrainingCenter;

            const branchesResp = await getTrainingBranchesByOrganisation({
                path: {
                    uuid: organizationData.uuid!
                },
                query: {
                    pageable: { page: 0, size: 5 }
                }
            }) as ApiResponse;

            const branchesData = branchesResp.data as SearchResponse;
            if (branchesData.data && branchesData.data.content)
                organizationData.branches = branchesData.data.content as unknown as TrainingBranch[];

            const orgUsersResp = await getUsersByOrganisation({
                path: {
                    uuid: organizationData.uuid!
                },
                query: {
                    pageable: { page: 0, size: 5 }
                }
            }) as ApiResponse;

            const orgUsersData = orgUsersResp.data as SearchResponse;
            if (orgUsersData.data && orgUsersData.data.content)
                organizationData.users = orgUsersData.data.content as unknown as User[];


            // TODO: get organization branches, courses, instructures and users
            return organizationData;

        },
        staleTime: 1000 * 60 * 15,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true
    });
}
