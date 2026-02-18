
export type UserDomain = "instructor" | "student" | "admin" | "course_creator" | "organization";


export interface SharedUserProfile {
    uuid: string;
    user_uuid: string;
    full_name: string;
    avatar_url?: string;
    profile_image_url: string;
    email?: string;
    phone?: string;
    website?: string;
    bio?: string;
    is_online?: boolean;
    address?: string;
}


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

// ─── Tab Registry 
export interface DomainTabProps {
    userUuid: string;
    domain: UserDomain;
    sharedProfile: SharedUserProfile;
}

export interface TabDefinition {
    id: string;
    label: string;
    component: React.ComponentType<DomainTabProps>;
}


export interface ProfilePageProps {

    tabs: TabDefinition[];

    profile: SharedUserProfile;
    isLoading?: boolean;
    headerBadge?: React.ReactNode;
    defaultTab?: string;
}