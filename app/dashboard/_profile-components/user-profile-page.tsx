'use client';

/**
 * UserProfilePage.tsx
 *
 * The top-level page component.
 * Reads the active domain from context, resolves the correct shared profile,
 * picks the right tab registry, and hands everything to ProfilePage.
 *
 * ProfilePage itself stays completely dumb — it just renders what it's given.
 */

import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';
import { useUserProfile } from '../../../context/profile-context';
import { useUserDomain } from '../../../context/user-domain-context';
import { instructorTabs } from './instructors-tab';
import { ProfilePage } from './profile-page';
import { studentTabs } from './students-tab';
import type { SharedUserProfile, TabDefinition, UserDomain } from './types';

// ─── Domain → Tab Registry map ────────────────────────────────────────────────

const TAB_REGISTRY: Record<UserDomain, TabDefinition[]> = {
    instructor: instructorTabs,
    student: studentTabs,
    admin: instructorTabs,   // placeholder — create adminTabs when ready
    course_creator: instructorTabs,   // placeholder — create courseCreatorTabs when ready
    organisation: instructorTabs,   // placeholder — create organisationTabs when ready
};

// ─── Profile normaliser ───────────────────────────────────────────────────────
// Each domain has slightly different field names — normalise them here
// so ProfilePage always gets the same SharedUserProfile shape.

function normaliseProfile(
    domain: UserDomain,
    user: ReturnType<typeof useUserProfile>
): SharedUserProfile | null {
    switch (domain) {
        case 'instructor': {
            const p = user?.instructor;

            if (!p) return null;
            return {
                uuid: p.uuid,
                user_uuid: p.user_uuid,
                full_name: p.full_name,
                email: user?.email,
                phone: user?.phone,
                website: p.website,
                bio: p.bio,
                avatar_url: user?.avatar_url,
                is_online: true,
            };
        }

        case 'student': {
            const p = user?.student;
            if (!p) return null;
            return {
                uuid: p.uuid,
                user_uuid: p.user_uuid,
                full_name: p.full_name,
                email: user?.email,
                phone: user?.phone,
                avatar_url: user?.avatar_url,
                is_online: false,
            };
        }

        case 'admin': {
            const p = user?.admin;
            if (!p) return null;
            return {
                uuid: p.uuid,
                user_uuid: p.user_uuid,
                full_name: p.full_name,
                email: user?.email,
                phone: user?.phone,
                avatar_url: user?.avatar_url,
            };
        }

        case 'course_creator': {
            const p = user?.course_creator;
            if (!p) return null;
            return {
                uuid: p.uuid,
                user_uuid: p.user_uuid,
                full_name: p.full_name,
                email: user?.email,
                phone: user?.phone,
                avatar_url: user?.avatar_url,
            };
        }

        case 'organisation': {
            const p = user?.organization;
            if (!p) return null;
            return {
                uuid: p.uuid,
                user_uuid: p.user_uuid,
                full_name: p.org_name ?? p.full_name,
                email: user?.email,
                phone: user?.phone,
                avatar_url: user?.avatar_url,
            };
        }
    }
}

function DomainBadge({ domain, user }: { domain: UserDomain; user: ReturnType<typeof useUserProfile> }) {
    if (domain === 'instructor' && user?.instructor?.admin_verified) {
        return <Badge>✓ Verified Instructor</Badge>;
    }
    if (domain === 'admin') {
        return <Badge variant="destructive">Admin</Badge>;
    }
    if (domain === 'course_creator') {
        return <Badge variant="secondary">Course Creator</Badge>;
    }
    return null;
}

export default function UserProfilePage() {
    const user = useUserProfile();
    const userDomain = useUserDomain();
    const domain = (userDomain?.activeDomain ?? 'instructor') as UserDomain;

    const profile = useMemo(
        () => normaliseProfile(domain, user),
        [domain, user]
    );

    const tabs = TAB_REGISTRY[domain] ?? instructorTabs;

    if (!profile) {
        return (
            <ProfilePage
                tabs={tabs}
                profile={{ uuid: '', user_uuid: '', full_name: '' }}
                isLoading={true}
            />
        );
    }

    return (
        <ProfilePage
            tabs={tabs}
            profile={profile}
            headerBadge={<DomainBadge domain={domain} user={user} />}
        />
    );
}