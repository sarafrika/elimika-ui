'use client';

import { useQueries } from '@tanstack/react-query';
import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState
} from 'react';
import { TrainingCenter } from '../lib/types';
import { ApiResponse, getTrainingBranchesByOrganisation, getUsersByOrganisation, TrainingBranch, User } from '../services/client';
import { useUserProfile } from './profile-context';

export interface UseTrainingCenterReturn {
  trainingCenter: TrainingCenter | null;
  loading: boolean;
  error: Error | null;
  refetchTrainingCenter: () => Promise<void>;
}

const initialState: Omit<UseTrainingCenterReturn, 'refetchTrainingCenter'> = {
  trainingCenter: null,
  loading: true,
  error: null,
};

/* export function useTrainingCenter(): UseTrainingCenterReturn {

  const [state, setState] = useState(initialState);
  const { data: session } = useSession();

  const trainingCenterSlug = useMemo(() => {
    const orgs = session?.decoded?.organization;
    if (Array.isArray(orgs) && orgs.length > 0) {
      return orgs[0];
    }
    return null;
  }, [session?.decoded?.organization]);

  const fetchTrainingCenter = useCallback(async () => {
    if (!trainingCenterSlug) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: new Error('No training center slug found'),
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const param = new URLSearchParams({ slug_eq: trainingCenterSlug });
      const response = await fetchTrainingCenters(0, param.toString());

      if (!response.success || response.data.content.length === 0) {
        throw new Error('No training center found');
      }

      const trainingCenter = response.data.content[0];
      if (trainingCenter) {
        setState({ trainingCenter, loading: false, error: null });
      } else {
        throw new Error('Training center is undefined');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Something went wrong while fetching training center.';
      setState({
        trainingCenter: null,
        loading: false,
        error: new Error(errorMessage),
      });
      toast.error(errorMessage);
    }
  }, [trainingCenterSlug]);

  useEffect(() => {
    fetchTrainingCenter();
  }, [fetchTrainingCenter]);

  return { ...state, refetchTrainingCenter: fetchTrainingCenter };
} */

// const TrainingCenterContext = createContext<UseTrainingCenterReturn | null>(null);

export function useTrainingCenter() {
  return useContext(TrainingCenterContext);
}

const TrainingCenterContext = createContext<TrainingCenter | null>(null);

export function TrainingCenterProvider({ children }: { children: ReactNode }) {
  // const trainingCenterData = useTrainingCenter();
  const user = useUserProfile();
  const [organization, setOrganization] = useState<TrainingCenter | null>(
    (user && user.organizations && user.organizations.length > 0 ?
      user.organizations[0]! : null) as TrainingCenter | null
  );

  const [branchesQuery, usersQuery] = useQueries({
    queries: [
      {
        queryFn: () => getTrainingBranchesByOrganisation({
          path: {
            uuid: organization!.uuid!
          }
        }),
        queryKey: ["training-branches"],
        enabled: !organization || !organization.branches || organization.branches.length === 0
      },

      {
        queryFn: () => getUsersByOrganisation({
          path: {
            uuid: organization!.uuid!
          }
        }),
        queryKey: ["training-users"],
        enabled: !organization || !organization.branches || organization.branches.length === 0
      }
    ]
  })

  useMemo(() => {
    if (organization) {
      let branches: TrainingBranch[] = [], users: User[] = []
      if (!branchesQuery.isError && branchesQuery.data) {
        const branchResp = branchesQuery.data.data as ApiResponse
        branches = (branchResp.data!.content ?? []) as TrainingBranch[]
      }
      if (!usersQuery.isError && usersQuery.data) {
        const orgUsresResp = usersQuery.data.data as ApiResponse;
        users = (orgUsresResp.data!.content ?? []) as User[]
      }
      setOrganization({
        ...organization,
        branches,
        users
      });
    }
  }, [branchesQuery.isSuccess, usersQuery.isSuccess])

  return (
    <TrainingCenterContext.Provider value={organization}>
      {children}
    </TrainingCenterContext.Provider>
  );
}

export function useTrainingCenterContext() {
  const context = useContext(TrainingCenterContext);

  if (!context) {
    throw new Error('useTrainingCenterContext must be used within a TrainingCenterProvider');
  }

  return context;
}
