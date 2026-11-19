import type { Metadata } from 'next';
import { getPublicClassInvite } from '@/src/features/class-invite/server';
import { stripRichText } from '@/src/features/catalogue/format';
import { createPageMetadata } from '@/src/lib/seo';
import ClassInviteClient from './ClassInviteClient';
import { classSharePath, parseClassShareScope } from '@/src/features/find-classes/class-share';

type ClassInvitePageProps = {
  searchParams: Promise<{
    id?: string | string[];
    organisation?: string | string[];
    instructor?: string | string[];
  }>;
};

export async function generateMetadata({ searchParams }: ClassInvitePageProps): Promise<Metadata> {
  const params = await searchParams;
  const { id } = params;
  const classId = typeof id === 'string' ? id : undefined;
  const shareScope = parseClassShareScope(key => {
    const value = params[key as keyof typeof params];
    return typeof value === 'string' ? value : null;
  });
  if (!classId && shareScope) {
    return createPageMetadata({
      title: `Explore this ${shareScope.kind}'s classes on Elimika`,
      description: 'Browse classes, review individual invitations and register to start learning.',
      path: classSharePath(shareScope),
      noIndex: true,
    });
  }
  const invite = classId ? await getPublicClassInvite(classId) : null;
  const path = classId ? `/class-invite?${new URLSearchParams({ id: classId })}` : '/class-invite';

  // Anonymous details can be unavailable on older backend deployments or private invites.
  // Keep a useful public preview without exposing authenticated class information.
  return createPageMetadata({
    title: invite?.title || 'You’re invited to learn on Elimika',
    description: (
      stripRichText(invite?.description) ||
      'Explore your class invitation on Elimika. Review the schedule and register to start learning.'
    ).slice(0, 160),
    path,
    image: invite?.thumbnail_url,
    noIndex: true,
  });
}

export default function ClassInvitePage() {
  return <ClassInviteClient />;
}
