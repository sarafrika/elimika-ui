import { useQuery } from '@tanstack/react-query';
import { getInstructorByUuidOptions } from '../services/client/@tanstack/react-query.gen';

type Params = {
    instructorUuid?: string;
};

export function useInstructorInfo({ instructorUuid }: Params) {
    const {
        data: instructorInfo,
        isLoading,
        isError,
    } = useQuery({
        ...getInstructorByUuidOptions({
            path: { uuid: instructorUuid as string },
        }),
        enabled: !!instructorUuid,
    });

    return {
        instructorInfo,
        isLoading,
        isError,
    };
}
