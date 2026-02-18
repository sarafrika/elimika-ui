'use client';

import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';
import { useUserProfile } from '../../../context/profile-context';
import { useUserDomain } from '../../../context/user-domain-context';
import { creatorTabs } from './course-creator-tab';
import { instructorTabs } from './instructors-tab';
import { ProfilePage } from './profile-page';
import { studentTabs } from './students-tab';
import type { SharedUserProfile, TabDefinition, UserDomain } from './types';

const TAB_REGISTRY: Record<UserDomain, TabDefinition[]> = {
    instructor: instructorTabs,
    course_creator: creatorTabs,
    student: studentTabs, // placeholder — create courseCreatorTabs when ready
    admin: instructorTabs,   // placeholder — create adminTabs when ready
    organization: instructorTabs,   // placeholder — create organisationTabs when ready
};

// Profile normaliser 
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
                phone: user?.phone_number,
                website: p.website,
                bio: p.bio,
                avatar_url: user?.profile_image_url,
                is_online: true,
                address: p.formatted_location,
                latitude: p.latitude,
                longitude: p.longitude,
                professional_headline: p.professional_headline,
                admin_verified: p.admin_verified,
                is_profile_complete: p.is_profile_complete,
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
                address: p.formatted_location || '',

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
                address: p.formatted_location || '',

            };
        }

        case 'course_creator': {
            const p = user?.courseCreator;
            // console.log(user, "user ")

            if (!p) return null;
            return {
                uuid: p.uuid,
                user_uuid: p.user_uuid,
                full_name: p.full_name,
                email: user?.email,
                phone: user?.phone_number,
                avatar_url: user?.profile_image_url,
                bio: p.bio,
                address: p.address || '',
                profile_image_url: user?.profile_image_url,
                username: user?.username,
                website: p.website,
                professional_headline: p.professional_headline,
                is_profile_complete: p.is_profile_complete,
                is_online: true,
            };
        }

        case 'organization': {
            const p = user?.organization;
            if (!p) return null;
            return {
                uuid: p.uuid,
                user_uuid: p.user_uuid,
                full_name: p.org_name ?? p.full_name,
                email: user?.email,
                phone: user?.phone,
                avatar_url: user?.avatar_url,
                address: p.formatted_location || '',

            };
        }
    }
}

function DomainBadge({ domain, user }: { domain: UserDomain; user: ReturnType<typeof useUserProfile> }) {
    if (domain === 'instructor' && user?.instructor?.admin_verified) {
        return <Badge
            variant='outline'
            className='border-primary/60 bg-primary/10 text-xs font-semibold tracking-wide uppercase'
        >
            ✓ Verified Instructor</Badge>
    }
    if (domain === 'admin' && user?.admin?.admin_verified) {
        return <Badge
            variant='outline'
            className='border-primary/60 bg-primary/10 text-xs font-semibold tracking-wide uppercase'
        >
            ✓ Verified Admin</Badge>;
    }
    if (domain === 'course_creator') {
        return <Badge
            variant='outline'
            className='border-primary/60 bg-primary/10 text-xs font-semibold tracking-wide uppercase'
        >
            ✓ Verified Course Creator</Badge>;
    }
    if (domain === 'student' && user?.student?.admin_verified) {
        return <Badge
            variant='outline'
            className='border-primary/60 bg-primary/10 text-xs font-semibold tracking-wide uppercase'
        >
            ✓ Verified Student</Badge>;
    }
    if (domain === 'organization' && user?.organizations?.admin_verified) {
        return <Badge
            variant='outline'
            className='border-primary/60 bg-primary/10 text-xs font-semibold tracking-wide uppercase'
        >
            ✓ Verified Organization</Badge>;
    }
    return null;
}

export default function UserProfilePage() {
    const user = useUserProfile();
    const userDomain = useUserDomain();

    const domain = userDomain?.activeDomain as UserDomain | undefined;

    const profile = useMemo(
        () => (domain ? normaliseProfile(domain, user) : null),
        [domain, user]
    );

    const tabs = domain && TAB_REGISTRY[domain]
        ? TAB_REGISTRY[domain]
        : [];

    if (!domain) {
        return null;
    }

    if (!profile) {
        return (
            <ProfilePage
                tabs={tabs}
                profile={{ uuid: '', user_uuid: '', full_name: '' }}
                isLoading
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
