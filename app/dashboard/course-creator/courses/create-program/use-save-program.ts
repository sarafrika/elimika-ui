'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { withoutProgramLifecycle } from '@/components/programs/program-lifecycle';
import {
  addProgramCourseMutation,
  addProgramRequirementMutation,
  createProgramAssessmentMutation,
  createTrainingProgramMutation,
  deleteProgramAssessmentMutation,
  deleteProgramRequirementMutation,
  getAllTrainingProgramsQueryKey,
  getProgramAssessmentsQueryKey,
  getProgramCoursesQueryKey,
  getProgramRequirementsQueryKey,
  getTrainingProgramByUuidQueryKey,
  removeProgramCourseMutation,
  searchProgramCoursesQueryKey,
  searchTrainingProgramsQueryKey,
  updateProgramAssessmentMutation,
  updateProgramCourseMutation,
  updateProgramRequirementMutation,
  updateTrainingProgramMutation,
  uploadProgramBannerMutation,
  uploadProgramIntroVideoMutation,
  uploadProgramThumbnailMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { TrainingProgram } from '@/services/client/types.gen';
import {
  assertProgramResponse,
  defaultProgramValues,
  type ProgramFormValues,
  programBody,
} from './program-schema';
import {
  assessmentBody,
  changedProgramRows,
  courseBody,
  programStepBody,
  requirementBody,
  sameProgramPayload,
  type ProgramSaveStep,
} from './program-save-state';
import {
  type PendingProgramMedia,
  PROGRAM_MEDIA_FIELDS,
  type ProgramMediaKey,
  saveProgramMedia,
} from './save-program-media';

const MEDIA_FORM_FIELDS = {
  thumbnail: 'thumbnailUrl',
  banner: 'bannerUrl',
  intro_video: 'videoUrl',
} as const;

function resolveProgramUuid(response: unknown): string | undefined {
  if (typeof response !== 'object' || response === null) return undefined;
  const candidate = 'data' in response ? response.data : response;
  if (typeof candidate !== 'object' || candidate === null || !('uuid' in candidate))
    return undefined;
  return typeof candidate.uuid === 'string' && candidate.uuid.trim() ? candidate.uuid : undefined;
}

export function useSaveProgram(
  form: UseFormReturn<ProgramFormValues>,
  creatorUuid: string,
  program?: TrainingProgram
) {
  const queryClient = useQueryClient();
  const savedProgram = useRef(program);
  const [programUuid, setProgramUuid] = useState(program?.uuid);
  const savedContent = useRef(
    program ? programBody(defaultProgramValues(program), creatorUuid, program) : undefined
  );
  const savedAssessments = useRef(
    new Map(
      form
        .getValues('draft.assessments')
        .flatMap(row => (row.uuid ? [[row.uuid, assessmentBody(row)] as const] : []))
    )
  );
  const createAssessment = useMutation(createProgramAssessmentMutation());
  const updateAssessment = useMutation(updateProgramAssessmentMutation());
  const deleteAssessment = useMutation(deleteProgramAssessmentMutation());
  const savedRequirements = useRef(
    new Map(
      form
        .getValues('requirements')
        .flatMap(row => (row.uuid ? [[row.uuid, requirementBody(row)] as const] : []))
    )
  );
  const savedCourses = useRef(
    new Map(
      program
        ? form
            .getValues('courses')
            .map((row, index) => [row.courseUuid, courseBody(row, index)] as const)
        : []
    )
  );
  const didWrite = useRef(false);
  const createProgram = useMutation(createTrainingProgramMutation());
  const updateProgram = useMutation(updateTrainingProgramMutation());
  const addRequirement = useMutation(addProgramRequirementMutation());
  const updateRequirement = useMutation(updateProgramRequirementMutation());
  const deleteRequirement = useMutation(deleteProgramRequirementMutation());
  const addCourse = useMutation(addProgramCourseMutation());
  const updateCourse = useMutation(updateProgramCourseMutation());
  const removeCourse = useMutation(removeProgramCourseMutation());
  const uploadThumbnail = useMutation(uploadProgramThumbnailMutation());
  const uploadBanner = useMutation(uploadProgramBannerMutation());
  const uploadVideo = useMutation(uploadProgramIntroVideoMutation());

  const mutation = useMutation({
    mutationFn: async ({
      values,
      media = {},
      onMediaUploaded,
      step,
      onCreated,
    }: {
      values: ProgramFormValues;
      step: ProgramSaveStep;
      onCreated?: (uuid: string) => void;
      media?: PendingProgramMedia;
      onMediaUploaded?: (key: ProgramMediaKey, file: File) => void;
    }) => {
      if (!creatorUuid)
        throw new Error('Your course creator profile is still loading. Please try again.');
      didWrite.current = false;
      const body = programStepBody(values, creatorUuid, savedProgram.current, step);
      let uuid = savedProgram.current?.uuid ?? programUuid;
      if (uuid && !sameProgramPayload(savedContent.current, body)) {
        didWrite.current = true;
        const response = await updateProgram.mutateAsync({
          path: { uuid },
          body,
          bodySerializer: withoutProgramLifecycle,
        });
        assertProgramResponse(response, 'Unable to save program details');
        const nextProgram = {
          ...savedProgram.current,
          ...body,
          uuid,
        };
        savedProgram.current = nextProgram;
        savedContent.current = body;
        setProgramUuid(uuid);
      } else if (!uuid) {
        didWrite.current = true;
        const response = await createProgram.mutateAsync({
          body,
          bodySerializer: withoutProgramLifecycle,
        });
        assertProgramResponse(response, 'Unable to create program');
        const createdUuid = resolveProgramUuid(response);
        if (!createdUuid)
          throw new Error('The program could not be confirmed. No program ID was returned.');
        uuid = createdUuid;
        const nextProgram = {
          ...savedProgram.current,
          ...body,
          uuid,
        };
        savedProgram.current = nextProgram;
        savedContent.current = body;
        setProgramUuid(uuid);
        onCreated?.(uuid);
      }
      if (!uuid) {
        throw new Error('The program could not be confirmed. No program ID was returned.');
      }

      // Record each successful operation immediately so retries cannot duplicate completed additions.
      if (step === 0 || step === 'requirements' || step === 'all') {
        const currentRequirements = new Set(
          values.requirements.flatMap(row => (row.uuid ? [row.uuid] : []))
        );
        for (const requirementUuid of savedRequirements.current.keys()) {
          if (currentRequirements.has(requirementUuid)) continue;
          didWrite.current = true;
          const response = await deleteRequirement.mutateAsync({
            path: { programUuid: uuid, requirementUuid },
          });
          assertProgramResponse(response, 'Unable to remove requirement');
          savedRequirements.current.delete(requirementUuid);
        }
        for (const [index, row] of values.requirements.entries()) {
          const payload = requirementBody(row);
          if (row.uuid && sameProgramPayload(savedRequirements.current.get(row.uuid), payload))
            continue;
          const body = { program_uuid: uuid, ...payload };
          didWrite.current = true;
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
          savedRequirements.current.set(requirementUuid, payload);
          form.setValue(`requirements.${index}.uuid`, requirementUuid);
        }
      }
      if (step === 1 || step === 'all') {
        const currentCourses = new Set(values.courses.map(row => row.courseUuid));
        for (const [index, row] of values.courses.entries()) {
          const payload = courseBody(row, index);
          if (sameProgramPayload(savedCourses.current.get(row.courseUuid), payload)) continue;
          const body = { program_uuid: uuid, ...payload };
          didWrite.current = true;
          const response = savedCourses.current.has(row.courseUuid)
            ? await updateCourse.mutateAsync({
                path: { programUuid: uuid, courseUuid: row.courseUuid },
                body,
              })
            : await addCourse.mutateAsync({ path: { programUuid: uuid }, body });
          assertProgramResponse(response, 'Unable to save curriculum');
          savedCourses.current.set(row.courseUuid, payload);
          if (response.data?.uuid)
            form.setValue(`courses.${index}.associationUuid`, response.data.uuid);
        }
        // Save retained courses first so removed prerequisites are no longer referenced.
        for (const courseUuid of [...savedCourses.current.keys()].reverse()) {
          if (currentCourses.has(courseUuid)) continue;
          didWrite.current = true;
          const response = await removeCourse.mutateAsync({
            path: { programUuid: uuid, courseUuid },
          });
          assertProgramResponse(response, 'Unable to remove course');
          savedCourses.current.delete(courseUuid);
        }
      }
      if (step === 2 || step === 'assessments' || step === 'all') {
        const rows = values.draft.assessments;
        const current = new Set(rows.flatMap(row => (row.uuid ? [row.uuid] : [])));
        for (const uuidToRemove of savedAssessments.current.keys()) {
          if (current.has(uuidToRemove)) continue;
          didWrite.current = true;
          const response = await deleteAssessment.mutateAsync({
            path: { uuid, assessmentUuid: uuidToRemove },
          });
          assertProgramResponse(response, 'Unable to remove assessment component');
          savedAssessments.current.delete(uuidToRemove);
        }
        // Reduce existing weights first so redistributing a 100% total does not temporarily exceed it.
        for (const row of rows) {
          const previous = row.uuid ? savedAssessments.current.get(row.uuid) : undefined;
          if (!row.uuid || !previous || Number(row.weight) >= previous.weight_percentage) continue;
          const body = assessmentBody(row);
          didWrite.current = true;
          const response = await updateAssessment.mutateAsync({
            path: { uuid, assessmentUuid: row.uuid },
            body,
          });
          assertProgramResponse(response, 'Unable to save assessment component');
          savedAssessments.current.set(row.uuid, body);
        }
        for (const [index, row] of rows.entries()) {
          const body = assessmentBody(row);
          if (row.uuid && sameProgramPayload(savedAssessments.current.get(row.uuid), body))
            continue;
          didWrite.current = true;
          const response = row.uuid
            ? await updateAssessment.mutateAsync({ path: { uuid, assessmentUuid: row.uuid }, body })
            : await createAssessment.mutateAsync({ path: { uuid }, body });
          assertProgramResponse(response, 'Unable to save assessment component');
          const assessmentUuid = response.data?.uuid ?? row.uuid;
          if (!assessmentUuid)
            throw new Error('The assessment component returned no ID. Reload before trying again.');
          savedAssessments.current.set(assessmentUuid, body);
          form.setValue(`draft.assessments.${index}.uuid`, assessmentUuid);
        }
      }
      if (step === 4 || step === 'all')
        await saveProgramMedia(
          uuid,
          media,
          (key, uuid, file) => {
            didWrite.current = true;
            if (key === 'thumbnail')
              return uploadThumbnail.mutateAsync({ path: { uuid }, body: { thumbnail: file } });
            if (key === 'banner')
              return uploadBanner.mutateAsync({ path: { uuid }, body: { banner: file } });
            return uploadVideo.mutateAsync({ path: { uuid }, body: { intro_video: file } });
          },
          (key, file, url) => {
            form.setValue(MEDIA_FORM_FIELDS[key], url);
            if (savedProgram.current) savedProgram.current[PROGRAM_MEDIA_FIELDS[key]] = url;
            onMediaUploaded?.(key, file);
          }
        );
      return uuid;
    },
    onSettled: async () => {
      const uuid = savedProgram.current?.uuid;
      if (!uuid || !didWrite.current) return;
      // Invalidate all parameter variants using prefixes from the canonical generated keys.
      const keys = [
        getTrainingProgramByUuidQueryKey({ path: { uuid } }),
        getProgramAssessmentsQueryKey({ path: { uuid } }),
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
  const hasChanges = (
    values: ProgramFormValues,
    step: ProgramSaveStep,
    media: PendingProgramMedia = {}
  ) => {
    if (!savedProgram.current?.uuid) return true;
    try {
      if (
        !sameProgramPayload(
          savedContent.current,
          programStepBody(values, creatorUuid, savedProgram.current, step)
        )
      )
        return true;
    } catch {
      // An invalid edited value is still a change; validate it before saving.
      return true;
    }
    if (
      (step === 0 || step === 'requirements' || step === 'all') &&
      changedProgramRows(
        savedRequirements.current,
        values.requirements,
        row => row.uuid,
        requirementBody
      )
    )
      return true;
    if (
      (step === 1 || step === 'all') &&
      changedProgramRows(savedCourses.current, values.courses, row => row.courseUuid, courseBody)
    )
      return true;
    if (
      (step === 2 || step === 'assessments' || step === 'all') &&
      changedProgramRows(
        savedAssessments.current,
        values.draft.assessments,
        row => row.uuid,
        assessmentBody
      )
    )
      return true;
    return (step === 4 || step === 'all') && Object.values(media).some(Boolean);
  };
  return { ...mutation, programUuid, hasChanges };
}
