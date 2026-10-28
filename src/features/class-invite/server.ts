import 'server-only';

import { getClassDefinition } from '@/services/client';

/** Metadata must see only what a logged-out crawler can read. */
export async function getPublicClassInvite(classId: string) {
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(classId)) return null;

  try {
    const { data, error } = await getClassDefinition({
      path: { uuid: classId },
      auth: () => undefined,
      fetch: globalThis.fetch,
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    });
    if (error) return null;
    const definition = data?.data?.class_definition;
    if (definition?.class_visibility !== 'PUBLIC' || !definition.is_active) return null;
    return definition;
  } catch {
    return null;
  }
}
