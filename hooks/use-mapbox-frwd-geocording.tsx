import { useQuery } from '@tanstack/react-query';

export default function useMapboxForwardGeocording({ address }: { address?: string }) {
  const { data, isLoading } = useQuery({
    queryFn: async () => fetch(''),
    queryKey: ['location'],
  });
}
