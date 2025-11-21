import {
    getInstructorByUuidOptions,
} from "@/services/client/@tanstack/react-query.gen";
import { useQuery } from "@tanstack/react-query";

export function useInstructorDetails(instructorUuid?: string) {
    const {
        data,
        isLoading,
        isError,
        error,
    } = useQuery({
        ...getInstructorByUuidOptions({
            path: { uuid: instructorUuid as string },
        }),
        enabled: !!instructorUuid,
    });

    return {
        instructor: data,
        isLoading,
        isError,
        error,
    };
}
