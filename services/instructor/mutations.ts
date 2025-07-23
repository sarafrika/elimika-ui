import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateInstructorProfile } from './actions';
import { Instructor } from '@/lib/types/instructor';

export const useUpdateInstructorProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (instructor: Instructor) => updateInstructorProfile(instructor),
    onSuccess: data => {
      queryClient.invalidateQueries({
        queryKey: ['instructor', data.data.user_uuid],
      });
    },
  });
};
