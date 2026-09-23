'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { extractList, extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import { getErrorMessage } from '@/lib/error-utils';
import { invalidateGeneratedQueryIds } from '@/src/features/dashboard/workflow-query-invalidation';
import {
  type CertificateTemplate,
  type ContentType,
  createCertificateTemplate,
  createContentType,
  createDifficultyLevel,
  createGradingLevel,
  deleteCertificateTemplate,
  deleteContentType,
  deleteDifficultyLevel,
  deleteGradingLevel,
  type DifficultyLevel,
  type DocumentTypeOption,
  type GradingLevel,
  updateCertificateTemplate,
  updateContentType,
  updateDifficultyLevel,
  updateGradingLevel,
} from '@/services/client';
import {
  getAllContentTypesOptions,
  getAllDifficultyLevelsOptions,
  getAllGradingLevelsOptions,
  getCertificateTemplatesOptions,
  listDocumentTypesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { configQuery } from '../lib/admin-queries';

export const CONFIG_PAGE_SIZE = 25;

const CONFIG_QUERY_IDS = [
  'getAllContentTypes',
  'searchContentTypes',
  'getMediaContentTypes',
  'getAllDifficultyLevels',
  'getAllGradingLevels',
  'getCertificateTemplates',
  'searchCertificateTemplates',
] as const;

/**
 * The backend accepts these template types; the generated enum carries a different set
 * (PARTICIPATION and CUSTOM are rejected, PROGRAM_COMPLETION is missing), so the UI
 * offers only what the server will take.
 */
export const TEMPLATE_TYPES = [
  { value: 'course_completion', label: 'Course completion' },
  { value: 'program_completion', label: 'Program completion' },
  { value: 'achievement', label: 'Achievement' },
] as const;

/** Content types: paged. */
export function useContentTypes(page = 0) {
  const query = useQuery({
    ...getAllContentTypesOptions({ query: { pageable: { page, size: CONFIG_PAGE_SIZE } } }),
    ...configQuery,
  });

  const { items, totalRows, pageCount } = useMemo(() => {
    const { items: rows, metadata } = extractPage<ContentType>(query.data);
    return {
      items: rows,
      totalRows: getTotalFromMetadata(metadata),
      pageCount: metadata.totalPages ?? 1,
    };
  }, [query.data]);

  return { contentTypes: items, totalRows, pageCount, query };
}

/** Difficulty levels: an ordered list, not paged. */
export function useDifficultyLevels() {
  const query = useQuery({ ...getAllDifficultyLevelsOptions(), ...configQuery });
  const levels = useMemo(() => extractList<DifficultyLevel>(query.data), [query.data]);
  return { levels, query };
}

/** Grading levels: paged. */
export function useGradingLevels(page = 0) {
  const query = useQuery({
    ...getAllGradingLevelsOptions({ query: { pageable: { page, size: CONFIG_PAGE_SIZE } } }),
    ...configQuery,
  });

  const { items, totalRows, pageCount } = useMemo(() => {
    const { items: rows, metadata } = extractPage<GradingLevel>(query.data);
    return {
      items: rows,
      totalRows: getTotalFromMetadata(metadata),
      pageCount: metadata.totalPages ?? 1,
    };
  }, [query.data]);

  return { levels: items, totalRows, pageCount, query };
}

/** Certificate templates: paged. */
export function useCertificateTemplates(page = 0) {
  const query = useQuery({
    ...getCertificateTemplatesOptions({ query: { pageable: { page, size: CONFIG_PAGE_SIZE } } }),
    ...configQuery,
  });

  const { items, totalRows, pageCount } = useMemo(() => {
    const { items: rows, metadata } = extractPage<CertificateTemplate>(query.data);
    return {
      items: rows,
      totalRows: getTotalFromMetadata(metadata),
      pageCount: metadata.totalPages ?? 1,
    };
  }, [query.data]);

  return { templates: items, totalRows, pageCount, query };
}

/** Document types: read-only, seeded by migration. */
export function useDocumentTypeCatalogue() {
  const query = useQuery({ ...listDocumentTypesOptions(), ...configQuery });
  const documentTypes = useMemo(() => extractList<DocumentTypeOption>(query.data), [query.data]);
  return { documentTypes, query };
}

export interface ContentTypeValues {
  name: string;
  mime_types: string[];
  max_file_size_mb?: number | null;
}

export interface DifficultyLevelValues {
  name: string;
  level_order: number;
  description?: string;
}

export interface GradingLevelValues {
  name: string;
  points: number;
  level_order: number;
}

export interface CertificateTemplateValues {
  name: string;
  template_type: string;
  template_html: string;
  template_css?: string;
  background_image_url?: string;
  active: boolean;
}

/** One place for the toast and the refresh, so every config write behaves the same. */
function useConfigMutation<TVariables>(
  run: (variables: TVariables) => Promise<unknown>,
  describe: (variables: TVariables) => { done: string; failed: string }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: run,
    onSuccess: async (_data, variables) => {
      await invalidateGeneratedQueryIds(queryClient, CONFIG_QUERY_IDS);
      toast.success(describe(variables).done);
    },
    onError: (error, variables) =>
      toast.error(getErrorMessage(error, describe(variables).failed)),
  });
}

export function useSaveContentType() {
  return useConfigMutation(
    async ({ uuid, values }: { uuid?: string; values: ContentTypeValues }) => {
      const body: ContentType = {
        name: values.name,
        mime_types: values.mime_types,
        max_file_size_mb: values.max_file_size_mb ?? null,
      };
      if (uuid) return updateContentType({ path: { uuid }, body, throwOnError: true });
      return createContentType({ body, throwOnError: true });
    },
    ({ values }) => ({
      done: `${values.name} saved`,
      failed: `Could not save ${values.name} — the name may already be taken`,
    })
  );
}

export function useDeleteContentType() {
  return useConfigMutation(
    async ({ uuid }: { uuid: string; name: string }) =>
      deleteContentType({ path: { uuid }, throwOnError: true }),
    ({ name }) => ({
      done: `${name} deleted`,
      failed: `Could not delete ${name} — lesson content may still use it`,
    })
  );
}

export function useSaveDifficultyLevel() {
  return useConfigMutation(
    async ({ uuid, values }: { uuid?: string; values: DifficultyLevelValues }) => {
      const body: DifficultyLevel = {
        name: values.name,
        level_order: values.level_order,
        description: values.description,
      };
      if (uuid) return updateDifficultyLevel({ path: { uuid }, body, throwOnError: true });
      return createDifficultyLevel({ body, throwOnError: true });
    },
    ({ values }) => ({
      done: `${values.name} saved`,
      failed: `Could not save ${values.name} — the name and the order must both be unique`,
    })
  );
}

export function useDeleteDifficultyLevel() {
  return useConfigMutation(
    async ({ uuid }: { uuid: string; name: string }) =>
      deleteDifficultyLevel({ path: { uuid }, throwOnError: true }),
    ({ name }) => ({
      done: `${name} deleted`,
      failed: `Could not delete ${name} — courses may still use it`,
    })
  );
}

export function useSaveGradingLevel() {
  return useConfigMutation(
    async ({ uuid, values }: { uuid?: string; values: GradingLevelValues }) => {
      const body: GradingLevel = {
        name: values.name,
        points: values.points,
        level_order: values.level_order,
      };
      if (uuid) return updateGradingLevel({ path: { uuid }, body, throwOnError: true });
      return createGradingLevel({ body, throwOnError: true });
    },
    ({ values }) => ({
      done: `${values.name} saved`,
      failed: `Could not save ${values.name} — the name and the order must both be unique`,
    })
  );
}

export function useDeleteGradingLevel() {
  return useConfigMutation(
    async ({ uuid }: { uuid: string; name: string }) =>
      deleteGradingLevel({ path: { uuid }, throwOnError: true }),
    ({ name }) => ({ done: `${name} deleted`, failed: `Could not delete ${name}` })
  );
}

export function useSaveCertificateTemplate() {
  return useConfigMutation(
    async ({ uuid, values }: { uuid?: string; values: CertificateTemplateValues }) => {
      // template_type is typed against the generated enum, which does not match what the
      // backend accepts; the UI only offers the server's own values.
      const body = {
        name: values.name,
        template_type: values.template_type,
        template_html: values.template_html,
        template_css: values.template_css,
        background_image_url: values.background_image_url,
        active: values.active,
      } as unknown as CertificateTemplate;

      if (uuid) {
        return updateCertificateTemplate({
          path: { templateUuid: uuid },
          body,
          throwOnError: true,
        });
      }
      return createCertificateTemplate({ body, throwOnError: true });
    },
    ({ values }) => ({
      done: `${values.name} saved`,
      failed: `Could not save ${values.name}`,
    })
  );
}

export function useDeleteCertificateTemplate() {
  return useConfigMutation(
    async ({ uuid }: { uuid: string; name: string }) =>
      deleteCertificateTemplate({ path: { templateUuid: uuid }, throwOnError: true }),
    ({ name }) => ({ done: `${name} deleted`, failed: `Could not delete ${name}` })
  );
}
