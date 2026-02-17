// ─── Domain Types ────────────────────────────────────────────────────────────

export type UserDomain = "instructor" | "student" | "admin" | "course_creator" | "organisation";

// ─── Shared Profile (header data — same across all domains) ──────────────────

export interface SharedUserProfile {
    uuid: string;
    user_uuid: string;
    full_name: string;
    avatar_url?: string;
    email?: string;
    phone?: string;
    website?: string;
    bio?: string;
    is_online?: boolean;
}

// ─── Domain-specific raw data shapes (from your existing contexts) ────────────

export interface InstructorProfile extends SharedUserProfile {
    professional_headline?: string;
    admin_verified: boolean;
    formatted_location?: string;
    latitude?: number;
    longitude?: number;
    created_date: string;
    updated_date: string;
}

export interface StudentProfile extends SharedUserProfile {
    demographic_tag?: string | null;
    full_name: string;
    first_guardian_name?: string;
    first_guardian_mobile?: string;
    second_guardian_name?: string;
    second_guardian_mobile?: string;
    primaryGuardianContact?: string;
    secondaryGuardianContact?: string;
    allGuardianContacts?: string[];
    created_date: string;
    updated_date?: string | null;
}

export interface AdminProfile extends SharedUserProfile {
    role_label?: string;
    department?: string;
}

export interface CourseCreatorProfile extends SharedUserProfile {
    specialty?: string;
}

export interface OrganisationProfile extends SharedUserProfile {
    org_name?: string;
    reg_number?: string;
}

// ─── Tab Registry (the key pattern) ──────────────────────────────────────────

/**
 * Props injected into every domain tab component.
 * Each tab gets the resolved shared profile + the user_uuid
 * so it can make its own domain-specific API calls.
 */
export interface DomainTabProps {
    userUuid: string;
    domain: UserDomain;
    sharedProfile: SharedUserProfile;
}

export interface TabDefinition {
    id: string;
    label: string;
    /** The component that renders the tab content. Handles its own data fetching. */
    component: React.ComponentType<DomainTabProps>;
}

// ─── ProfilePage Props ────────────────────────────────────────────────────────

export interface ProfilePageProps {
    /**
     * List of tab definitions for the active domain.
     * Pass different arrays per domain — the shell doesn't care about content.
     */
    tabs: TabDefinition[];
    /**
     * Resolved shared profile to display in the header.
     * Normalise your domain-specific profile into this shape upstream.
     */
    profile: SharedUserProfile;
    /** Whether the profile is loading (shows skeleton). */
    isLoading?: boolean;
    /** Optional badge to display next to the user's name. */
    headerBadge?: React.ReactNode;
    /** Default tab id to open. Defaults to first tab. */
    defaultTab?: string;
}