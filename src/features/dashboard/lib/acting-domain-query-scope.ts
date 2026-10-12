import { hashKey, type QueryFunction, type QueryKey } from '@tanstack/react-query';
import {
  ACTING_DOMAIN_HEADER,
  ACTING_DOMAIN_NONE,
  readRenderedActingDomain,
} from '@/src/features/dashboard/lib/active-domain-storage';

// Generated operations whose answer never depends on the dashboard: identity, profile,
// wallet, notifications and reference data. Everything else is partitioned per domain.
const DOMAIN_AGNOSTIC_OPERATION_IDS = new Set<string>([
  'getCurrentUser',
  'getCurrentAccountStatus',
  'getUserByUuid',
  'getAllUsers',
  'search',
  'lookupUserByUserNo',
  'getUserDirectory',
  'getProfileImage',
  'getSummary',
  'getSummary1',
  'listSkills',
  'listSkills1',
  'listPortfolio',
  'listMemberships',
  'listExperience',
  'listEducation',
  'listDocuments',
  'listCompetencies',
  'listCertifications',
  'listAchievements',
  'getDocumentFile',
  'skills',
  'portfolio',
  'memberships',
  'experience',
  'education',
  'documents',
  'documentFile',
  'competencies',
  'certifications',
  'achievements',
  'listNotifications',
  'getCounts',
  'getWallet',
  'listTransactions1',
  'getAllCategories',
  'getCategoryByUuid',
  'getRootCategories',
  'getSubCategories',
  'searchCategories',
  'getAllGradingLevels',
  'getAllDifficultyLevels',
  'getAllContentTypes',
  'searchContentTypes',
  'checkMimeTypeSupport',
  'getMediaContentTypes',
  'listDocumentTypes',
  'listCurrencies',
  'getDefaultCurrency',
  'listTiers',
  'listRules',
  'getRule',
]);

// Hand-rolled key roots for the same shell data (profile context, org context, wallet).
const DOMAIN_AGNOSTIC_KEY_ROOTS = new Set<string>([
  'profile',
  'user',
  'organization',
  'notifications',
  'wallet',
  'wallet-transactions',
  'getWallet',
  'reverse-geocode',
]);

const HASH_SUFFIX = '#acting=';
const HASH_SUFFIX_PATTERN = /#acting=([a-z_-]+)$/;

type GeneratedKeyHead = { _id: string; headers?: Record<string, unknown> };

function generatedKeyHead(queryKey: QueryKey | undefined): GeneratedKeyHead | null {
  const head = queryKey?.[0];
  if (!head || typeof head !== 'object' || Array.isArray(head)) return null;
  const id = (head as { _id?: unknown })._id;
  return typeof id === 'string' ? (head as GeneratedKeyHead) : null;
}

/** Whether a query's answer can change with the dashboard it is asked from. */
export function isDomainScopedQueryKey(queryKey: QueryKey | undefined): boolean {
  const generated = generatedKeyHead(queryKey);
  if (generated) return !DOMAIN_AGNOSTIC_OPERATION_IDS.has(generated._id);
  const head = queryKey?.[0];
  return !(typeof head === 'string' && DOMAIN_AGNOSTIC_KEY_ROOTS.has(head));
}

function withActingDomainHeader(queryKey: QueryKey, tag: string): QueryKey {
  const head = generatedKeyHead(queryKey);
  if (!head) return queryKey;
  const headers = head.headers ?? {};
  if (ACTING_DOMAIN_HEADER in headers) return queryKey;
  return [{ ...head, headers: { ...headers, [ACTING_DOMAIN_HEADER]: tag } }, ...queryKey.slice(1)];
}

type ScopableOptions = {
  queryKey?: QueryKey;
  queryHash?: string;
  queryFn?: unknown;
  queryKeyHashFn?: unknown;
};

/**
 * Partitions a domain-scoped query by the dashboard it is rendered on, and pins the
 * fetch to that same dashboard via the key's header, so a cache entry can never hold
 * another dashboard's answer. A restored hash keeps the domain it was stored under.
 */
export function scopeQueryOptionsToActingDomain<T extends ScopableOptions>(options: T): T {
  if (options.queryKeyHashFn || !isDomainScopedQueryKey(options.queryKey)) return options;

  const stored = options.queryHash ? HASH_SUFFIX_PATTERN.exec(options.queryHash)?.[1] : undefined;
  const tag = stored ?? readRenderedActingDomain() ?? ACTING_DOMAIN_NONE;
  const queryFn = options.queryFn;

  return {
    ...options,
    queryKeyHashFn: (queryKey: QueryKey) => `${hashKey(queryKey)}${HASH_SUFFIX}${tag}`,
    queryFn:
      typeof queryFn === 'function'
        ? ((context => {
            const original = queryFn as QueryFunction;
            return original({ ...context, queryKey: withActingDomainHeader(context.queryKey, tag) });
          }) as QueryFunction)
        : queryFn,
  };
}

/** Whether a cached query was answered for the dashboard now rendered (or for none). */
export function isQueryHashInRenderedDomain(queryHash: string): boolean {
  const stored = HASH_SUFFIX_PATTERN.exec(queryHash)?.[1];
  return !stored || stored === (readRenderedActingDomain() ?? ACTING_DOMAIN_NONE);
}
