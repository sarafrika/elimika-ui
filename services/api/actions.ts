import { fetchClient } from "./fetch-client";
import { paths } from "./schema";

/**
 * Generic Search function defination
 */
type SearchEndpoints = {
    [K in keyof paths]: paths[K] extends { get: any } ? K : never;
}[keyof paths];

type QueryParams<P extends SearchEndpoints> =
    paths[P]["get"] extends { parameters: { query: infer Q } } ? Q : undefined;

export async function search<P extends SearchEndpoints>(
    endpoint: P,
    searchParams: any
) {

    const init: any = {}
    if (searchParams) {
        init.params = {
            query: {
                ...searchParams
            }
        }
    }
    const resp = await fetchClient.GET(endpoint, init);

    if (resp.error) {
        throw new Error(typeof resp.error === "string" ? resp.error : JSON.stringify(resp.error));
    }

    if (resp.data.data?.content?.length === 0) {
        throw new Error("User not found")
    }

    return resp.data.data?.content!;
}

/** End of generic search function */
