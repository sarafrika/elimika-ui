'use client';

import { queryOptions, useQueries, useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import type { z } from 'zod';
import { asRecord } from '@/lib/error-utils';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getCourseCreatorByUuidOptions,
  getDomainOnboardingOptions,
  getInstructorByUuidOptions,
  getOrganisationByUuidOptions,
  getSessionBootstrapOptions,
  getStudentByIdOptions,
} from '@/services/client/@tanstack/react-query.gen';
import {
  type ApplicationDraft,
  applicationDraftKey,
  readApplicationDraft,
  type RegistrationRole,
} from '../lib/application-draft';
import { restoreOrganisationReviewDetails } from '../lib/organisation-onboarding';
import { requireApiData } from '../lib/user-onboarding';

function profileValues(response: unknown): Record<string, unknown> | null {
  const record = asRecord(response);
  if (!record) return null;
  if (record.error || record.success === false)
    throw new Error('Unable to load saved profile details.');
  const data = asRecord(record.data) ?? record;
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, value === null ? undefined : value])
  );
}

/** Restore accepted application values without subscribing the whole form to each keystroke. */
export function useApplicationDraft<T extends FieldValues>({
  userUuid,
  role,
  form,
  schema,
}: {
  userUuid: string | undefined;
  role: RegistrationRole;
  form: UseFormReturn<T>;
  schema: z.ZodType<T, z.ZodTypeDef, unknown>;
}) {
  const [draft, setDraft] = useState<ApplicationDraft | null>(null);
  const [loadedScope, setLoadedScope] = useState<string | null>(null);
  const restored = useRef<string | null>(null);
  const scope = userUuid ? applicationDraftKey(userUuid, role) : null;
  useEffect(() => {
    restored.current = null;
    setDraft(userUuid ? readApplicationDraft(userUuid, role) : null);
    setLoadedScope(scope);
  }, [userUuid, role, scope]);
  const currentDraft = loadedScope === scope ? draft : null;

  const bootstrap = useQuery({
    ...getSessionBootstrapOptions(),
    enabled: !!userUuid,
    staleTime: STALE_TIMES.entity,
    select: response => requireApiData(response),
    retry: false,
  });
  const owned = bootstrap.data?.user?.uuid === userUuid ? bootstrap.data : undefined;
  const review = useQuery({
    ...getDomainOnboardingOptions({
      path: {
        domain:
          role === 'course-creator'
            ? 'course_creator'
            : role === 'organisation'
              ? 'organisation_user'
              : role,
      },
    }),
    enabled: !!userUuid,
    staleTime: STALE_TIMES.entity,
    select: response => requireApiData(response),
    retry: false,
  });
  const savedUuid =
    role === 'student'
      ? owned?.profiles?.student_uuid
      : role === 'instructor'
        ? owned?.profiles?.instructor_uuid
        : role === 'course-creator'
          ? owned?.profiles?.course_creator_uuid
          : owned?.active_organisation?.organisation_uuid;
  const profileUuid = currentDraft?.profileUuid ?? savedUuid;
  const studentOptions =
    role === 'student' && profileUuid
      ? queryOptions({
          ...getStudentByIdOptions({ path: { uuid: profileUuid } }),
          enabled: !!userUuid,
          staleTime: STALE_TIMES.entity,
          select: profileValues,
          retry: false,
        })
      : undefined;
  const [student] = useQueries({
    queries: studentOptions ? [studentOptions] : [],
  });
  const instructorOptions =
    role === 'instructor' && profileUuid
      ? queryOptions({
          ...getInstructorByUuidOptions({ path: { uuid: profileUuid } }),
          enabled: !!userUuid,
          staleTime: STALE_TIMES.entity,
          select: profileValues,
          retry: false,
        })
      : undefined;
  const [instructor] = useQueries({
    queries: instructorOptions ? [instructorOptions] : [],
  });
  const creatorOptions =
    role === 'course-creator' && profileUuid
      ? queryOptions({
          ...getCourseCreatorByUuidOptions({ path: { uuid: profileUuid } }),
          enabled: !!userUuid,
          staleTime: STALE_TIMES.entity,
          select: profileValues,
          retry: false,
        })
      : undefined;
  const [creator] = useQueries({
    queries: creatorOptions ? [creatorOptions] : [],
  });
  const organisationOptions =
    role === 'organisation' && profileUuid
      ? queryOptions({
          ...getOrganisationByUuidOptions({ path: { uuid: profileUuid } }),
          enabled: !!userUuid,
          staleTime: STALE_TIMES.entity,
          select: profileValues,
          retry: false,
        })
      : undefined;
  const [organisation] = useQueries({
    queries: organisationOptions ? [organisationOptions] : [],
  });
  const query =
    role === 'student'
      ? student
      : role === 'instructor'
        ? instructor
        : role === 'course-creator'
          ? creator
          : organisation;
  useEffect(() => {
    if (!scope || loadedScope !== scope || restored.current === scope) return;
    const values = currentDraft?.values ?? query?.data;
    if (!values) return;
    const parsed = schema.safeParse({
      ...(role === 'organisation' ? restoreOrganisationReviewDetails(values) : values),
      ...(role !== 'organisation' ? { user_uuid: userUuid } : {}),
    });
    if (!parsed.success) return;
    if (!form.formState.isDirty) form.reset({ ...form.getValues(), ...parsed.data });
    restored.current = scope;
  }, [loadedScope, scope, currentDraft, query?.data, schema, form, role, userUuid]);

  const save = (values: T, uuid: string | undefined) => {
    const next: ApplicationDraft = {
      values,
      profileUuid: uuid ?? profileUuid,
      submittedAt: new Date().toISOString(),
    };
    setDraft(next);
    if (scope) {
      try {
        localStorage.setItem(scope, JSON.stringify(next));
      } catch {
        /* The API still retains the accepted profile if browser storage is unavailable. */
      }
    }
  };
  const apiSubmittedAt = review.data?.submitted_at;
  const apiDate =
    apiSubmittedAt instanceof Date
      ? apiSubmittedAt
      : apiSubmittedAt
        ? new Date(String(apiSubmittedAt))
        : null;
  const submittedAt =
    apiDate && !Number.isNaN(apiDate.getTime()) ? apiDate.toISOString() : currentDraft?.submittedAt;
  return {
    profileUuid,
    submittedAt,
    save,
    isLoading:
      !scope ||
      loadedScope !== scope ||
      bootstrap.isLoading ||
      (!!profileUuid && !!query?.isLoading),
    isError: bootstrap.isError || !!query?.isError,
  };
}
