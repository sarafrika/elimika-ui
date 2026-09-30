'use client';

import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseFormReturn } from 'react-hook-form';
import {
  addProgramCourseMutation,
  addProgramRequirementMutation,
  createTrainingProgramMutation,
  deleteProgramRequirementMutation,
  getAllTrainingProgramsQueryKey,
  getProgramCoursesQueryKey,
  getProgramRequirementsQueryKey,
  getTrainingProgramByUuidQueryKey,
  removeProgramCourseMutation,
  searchProgramCoursesQueryKey,
  searchTrainingProgramsQueryKey,
  updateProgramCourseMutation,
  updateProgramRequirementMutation,
  updateTrainingProgramMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { TrainingProgram } from '@/services/client/types.gen';
import { withoutProgramLifecycle } from '@/components/programs/program-lifecycle';
import { assertProgramResponse, programBody, type ProgramFormValues } from './program-schema';

export function useSaveProgram(
  form: UseFormReturn<ProgramFormValues>,
  creatorUuid: string,
  program?: TrainingProgram
) {
  const queryClient = useQueryClient();
  const savedProgram = useRef(program);
  const savedRequirements = useRef(
    new Set(form.getValues('requirements').flatMap(row => (row.uuid ? [row.uuid] : [])))
  );
  const savedCourses = useRef(new Set(form.getValues('courses').map(row => row.courseUuid)));
  const createProgram = useMutation(createTrainingProgramMutation());
  const updateProgram = useMutation(updateTrainingProgramMutation());
  const addRequirement = useMutation(addProgramRequirementMutation());
  const updateRequirement = useMutation(updateProgramRequirementMutation());
  const deleteRequirement = useMutation(deleteProgramRequirementMutation());
  const addCourse = useMutation(addProgramCourseMutation());
  const updateCourse = useMutation(updateProgramCourseMutation());
  const removeCourse = useMutation(removeProgramCourseMutation());

  return useMutation({
    mutationFn: async ({ values }: { values: ProgramFormValues }) => {
      if (!creatorUuid)
        throw new Error('Your course creator profile is still loading. Please try again.');
      const body = programBody(values, creatorUuid, savedProgram.current);
      let uuid = savedProgram.current?.uuid;
      if (uuid) {
        const response = await updateProgram.mutateAsync({
          path: { uuid },
          body,
          bodySerializer: withoutProgramLifecycle,
        });
        assertProgramResponse(response, 'Unable to save program details');
        savedProgram.current = response.data ?? { ...body, uuid };
      } else {
        const response = await createProgram.mutateAsync({
          body,
          bodySerializer: withoutProgramLifecycle,
        });
        assertProgramResponse(response, 'Unable to create program');
        if (!response.uuid)
          throw new Error('The program could not be confirmed. No program ID was returned.');
        uuid = response.uuid;
        savedProgram.current = response;
      }

      // Record each successful operation immediately so retries cannot duplicate completed additions.
      const currentRequirements = new Set(
        values.requirements.flatMap(row => (row.uuid ? [row.uuid] : []))
      );
      for (const requirementUuid of savedRequirements.current) {
        if (currentRequirements.has(requirementUuid)) continue;
        const response = await deleteRequirement.mutateAsync({
          path: { programUuid: uuid, requirementUuid },
        });
        assertProgramResponse(response, 'Unable to remove requirement');
        savedRequirements.current.delete(requirementUuid);
      }
      for (const [index, row] of values.requirements.entries()) {
        const body = {
          program_uuid: uuid,
          requirement_type: row.requirementType,
          requirement_text: row.requirementText.trim(),
          is_mandatory: row.isMandatory,
        };
        const response = row.uuid
          ? await updateRequirement.mutateAsync({
              path: { programUuid: uuid, requirementUuid: row.uuid },
              body,
            })
          : await addRequirement.mutateAsync({ path: { programUuid: uuid }, body });
        assertProgramResponse(response, 'Unable to save requirement');
        const requirementUuid = response.data?.uuid ?? row.uuid;
        if (!requirementUuid)
          throw new Error(
            'A requirement was not confirmed by the server. Reload before trying again.'
          );
        savedRequirements.current.add(requirementUuid);
        form.setValue(`requirements.${index}.uuid`, requirementUuid);
      }

      const currentCourses = new Set(values.courses.map(row => row.courseUuid));
      for (const [index, row] of values.courses.entries()) {
        const body = {
          program_uuid: uuid,
          course_uuid: row.courseUuid,
          sequence_order: index + 1,
          is_required: row.isRequired,
          prerequisite_course_uuid: row.prerequisiteCourseUuid || null,
        };
        const response = savedCourses.current.has(row.courseUuid)
          ? await updateCourse.mutateAsync({
              path: { programUuid: uuid, courseUuid: row.courseUuid },
              body,
            })
          : await addCourse.mutateAsync({ path: { programUuid: uuid }, body });
        assertProgramResponse(response, 'Unable to save curriculum');
        savedCourses.current.add(row.courseUuid);
        if (response.data?.uuid)
          form.setValue(`courses.${index}.associationUuid`, response.data.uuid);
      }
      // Save retained courses first so removed prerequisites are no longer referenced.
      for (const courseUuid of [...savedCourses.current].reverse()) {
        if (currentCourses.has(courseUuid)) continue;
        const response = await removeCourse.mutateAsync({
          path: { programUuid: uuid, courseUuid },
        });
        assertProgramResponse(response, 'Unable to remove course');
        savedCourses.current.delete(courseUuid);
      }
      return uuid;
    },
    onSettled: async () => {
      const uuid = savedProgram.current?.uuid;
      if (!uuid) return;
      // Invalidate all parameter variants using prefixes from the canonical generated keys.
      const keys = [
        getTrainingProgramByUuidQueryKey({ path: { uuid } }),
        getProgramCoursesQueryKey({ path: { programUuid: uuid } }),
        getProgramRequirementsQueryKey({ path: { programUuid: uuid }, query: { pageable: {} } }),
        searchProgramCoursesQueryKey({ query: { searchParams: {}, pageable: {} } }),
        searchTrainingProgramsQueryKey({ query: { searchParams: {}, pageable: {} } }),
        getAllTrainingProgramsQueryKey({ query: { pageable: {} } }),
      ];
      await Promise.all(
        keys.map(queryKey =>
          queryClient.invalidateQueries({ queryKey: [{ _id: queryKey[0]._id }] })
        )
      );
    },
  });
}
