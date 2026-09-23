import { useCallback, useEffect, useState } from "react";

export const STORAGE_KEY = "elimika:creator-journey";

export type WalletSectionKey =
    | "skills"
    | "portfolio"
    | "credentials"
    | "competencies"
    | "experience"
    | "achievements"
    | "verification";

export type WalletField = {
    key: string;
    label: string;
    placeholder?: string;
    type?: "text" | "date" | "textarea" | "select";
    options?: string[];
};

export type WalletSection = {
    key: WalletSectionKey;
    label: string;
    summary: string;
    addLabel: string;
    titleField: string;
    fields: WalletField[];
};

const STATUS_OPTIONS = ["Pending", "Verified", "Rejected"];

export const WALLET_SECTIONS: WalletSection[] = [
    {
        key: "skills",
        label: "My Skills",
        summary:
            "Skill taxonomy, proficiency level, evidence, verification and last assessed date.",
        addLabel: "Add skill",
        titleField: "skill",
        fields: [
            { key: "skill", label: "Skill", placeholder: "e.g. Curriculum design" },
            { key: "taxonomy", label: "Taxonomy / category", placeholder: "e.g. Teaching & Learning" },
            {
                key: "proficiency",
                label: "Proficiency level",
                type: "select",
                options: ["Beginner", "Intermediate", "Advanced", "Expert"],
            },
            { key: "evidence", label: "Evidence", placeholder: "Link or short description" },
            { key: "verificationStatus", label: "Verification status", type: "select", options: STATUS_OPTIONS },
            { key: "lastAssessed", label: "Last assessed date", type: "date" },
        ],
    },
    {
        key: "portfolio",
        label: "Portfolio",
        summary: "Projects, performances, work samples, media and selected evidence.",
        addLabel: "Add portfolio item",
        titleField: "title",
        fields: [
            { key: "title", label: "Title", placeholder: "e.g. Nairobi Choir Masterclass" },
            {
                key: "type",
                label: "Type",
                type: "select",
                options: ["Project", "Performance", "Work sample", "Media", "Other"],
            },
            { key: "link", label: "Media or evidence link", placeholder: "https://" },
            { key: "date", label: "Date", type: "date" },
            { key: "description", label: "Description", type: "textarea" },
        ],
    },
    {
        key: "credentials",
        label: "Credentials Vault",
        summary:
            "Certificates, badges, awards, external credentials, issuer and verification status.",
        addLabel: "Add credential",
        titleField: "name",
        fields: [
            { key: "name", label: "Credential", placeholder: "e.g. TVET Trainer Certificate" },
            {
                key: "type",
                label: "Type",
                type: "select",
                options: ["Certificate", "Badge", "Award", "External credential"],
            },
            { key: "issuer", label: "Issuer", placeholder: "e.g. TVET Authority" },
            { key: "issuedOn", label: "Issued on", type: "date" },
            { key: "credentialId", label: "Credential ID / link", placeholder: "ID or URL" },
            { key: "verificationStatus", label: "Verification status", type: "select", options: STATUS_OPTIONS },
        ],
    },
    {
        key: "competencies",
        label: "Competencies",
        summary: "Competency framework, level attained, assessment evidence and verification.",
        addLabel: "Add competency",
        titleField: "competency",
        fields: [
            { key: "competency", label: "Competency", placeholder: "e.g. Learner assessment" },
            { key: "framework", label: "Framework", placeholder: "e.g. CBET Unit 4" },
            {
                key: "level",
                label: "Level attained",
                type: "select",
                options: ["Level 1", "Level 2", "Level 3", "Level 4", "Level 5"],
            },
            { key: "evidence", label: "Assessment evidence", type: "textarea" },
            { key: "verificationStatus", label: "Verification status", type: "select", options: STATUS_OPTIONS },
        ],
    },
    {
        key: "experience",
        label: "Experience",
        summary: "Training, work, volunteering, projects and relevant experience.",
        addLabel: "Add experience",
        titleField: "role",
        fields: [
            { key: "role", label: "Role", placeholder: "e.g. Lead Trainer" },
            { key: "organisation", label: "Organisation", placeholder: "e.g. Sarafrika Academy" },
            {
                key: "type",
                label: "Type",
                type: "select",
                options: ["Training", "Work", "Volunteering", "Project"],
            },
            { key: "startDate", label: "Start date", type: "date" },
            { key: "endDate", label: "End date", type: "date" },
            { key: "description", label: "What you did", type: "textarea" },
        ],
    },
    {
        key: "achievements",
        label: "Achievements",
        summary: "Awards, milestones, competitions, unlocked skills and recognitions.",
        addLabel: "Add achievement",
        titleField: "title",
        fields: [
            { key: "title", label: "Achievement", placeholder: "e.g. National Music Award" },
            {
                key: "type",
                label: "Type",
                type: "select",
                options: ["Award", "Milestone", "Competition", "Unlocked skill", "Recognition"],
            },
            { key: "awardedBy", label: "Awarded by", placeholder: "e.g. Kenya Music Festival" },
            { key: "date", label: "Date", type: "date" },
            { key: "description", label: "Details", type: "textarea" },
        ],
    },
    {
        key: "verification",
        label: "Verification",
        summary: "Who verified the skill, evidence source, verification date and status.",
        addLabel: "Add verification record",
        titleField: "subject",
        fields: [
            { key: "subject", label: "Item verified", placeholder: "e.g. Curriculum design skill" },
            { key: "verifier", label: "Verified by", placeholder: "Name and role" },
            { key: "evidenceSource", label: "Evidence source", placeholder: "Document, referee, platform" },
            { key: "verifiedOn", label: "Verification date", type: "date" },
            { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
        ],
    },
];

export const COURSE_CATEGORIES = [
    "Music & Performing Arts",
    "Visual Arts & Design",
    "Technology & Digital Skills",
    "Business & Entrepreneurship",
    "Languages & Communication",
    "Sciences & Mathematics",
    "Health & Wellbeing",
    "Trades & Technical Skills",
];

export type WalletItem = { id: string; values: Record<string, string> };

export type CoursePageKind = "lesson" | "video" | "audio" | "quiz" | "assignment";

export type CoursePage = {
    id: string;
    kind: CoursePageKind;
    title: string;
    body: string;
};

export type CourseLesson = {
    id: string;
    title: string;
    pages: CoursePage[];
};

export type CourseModule = {
    id: string;
    title: string;
    lessons: CourseLesson[];
};

export type CourseDraft = {
    id: string;
    title: string;
    code: string;
    category: string;
    level: string;
    description: string;
    modules: CourseModule[];
    status: "draft" | "submitted" | "approved";
    submittedAt: string | null;
};

export function courseStats(course: CourseDraft) {
    const modules = course.modules?.length ?? 0;
    const lessons = (course.modules ?? []).reduce((sum, m) => sum + m.lessons.length, 0);
    const pages = (course.modules ?? []).reduce(
        (sum, m) => sum + m.lessons.reduce((inner, l) => inner + l.pages.length, 0),
        0,
    );
    return { modules, lessons, pages };
}

export function courseReadyForApproval(course: CourseDraft) {
    return course.title.trim().length > 0 && (course.modules ?? []).some((m) => m.lessons.length > 0);
}

export type ReviewStatus = "not_submitted" | "submitted" | "approved";

export type SarafrikaAccount = {
    fullName: string;
    email: string;
    connectedAt: string;
};

/** Stand-in for the Sarafrika ecosystem profile until the real sign-in is wired up. */
export const SAMPLE_SARAFRIKA_ACCOUNT: Omit<SarafrikaAccount, "connectedAt"> = {
    fullName: "Amina Otieno",
    email: "amina.otieno@sarafrika.com",
};

export type CreatorJourney = {
    step: number;
    account: SarafrikaAccount | null;
    product: string | null;
    accountType: string | null;
    categories: string[];
    displayName: string;
    wallet: Record<WalletSectionKey, WalletItem[]>;
    reviewStatus: ReviewStatus;
    submittedAt: string | null;
    approvedAt: string | null;
    courses: CourseDraft[];
};

export const EMPTY_JOURNEY: CreatorJourney = {
    step: 0,
    account: null,
    product: null,
    accountType: null,
    categories: [],
    displayName: "",
    wallet: {
        skills: [],
        portfolio: [],
        credentials: [],
        competencies: [],
        experience: [],
        achievements: [],
        verification: [],
    },
    reviewStatus: "not_submitted",
    submittedAt: null,
    approvedAt: null,
    courses: [],
};

function normalise(raw: unknown): CreatorJourney {
    if (!raw || typeof raw !== "object") return EMPTY_JOURNEY;
    const parsed = raw as Partial<CreatorJourney>;
    return {
        ...EMPTY_JOURNEY,
        ...parsed,
        wallet: { ...EMPTY_JOURNEY.wallet, ...(parsed.wallet ?? {}) },
        categories: parsed.categories ?? [],
        courses: (parsed.courses ?? []).map((course) => ({ ...course, modules: course.modules ?? [] })),
    };
}

export function newId() {
    return Math.random().toString(36).slice(2, 10);
}

export function useCreatorJourney() {
    const [journey, setJourney] = useState<CreatorJourney>(EMPTY_JOURNEY);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (raw) setJourney(normalise(JSON.parse(raw)));
        } catch {
            // ignore unreadable storage
        }
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (!hydrated) return;
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(journey));
        } catch {
            // private mode — keep in memory
        }
    }, [journey, hydrated]);

    const patch = useCallback((changes: Partial<CreatorJourney>) => {
        setJourney((current) => ({ ...current, ...changes }));
    }, []);

    const addWalletItem = useCallback((section: WalletSectionKey) => {
        setJourney((current) => ({
            ...current,
            wallet: {
                ...current.wallet,
                [section]: [...current.wallet[section], { id: newId(), values: {} }],
            },
        }));
    }, []);

    const updateWalletItem = useCallback(
        (section: WalletSectionKey, id: string, field: string, value: string) => {
            setJourney((current) => ({
                ...current,
                wallet: {
                    ...current.wallet,
                    [section]: current.wallet[section].map((item) =>
                        item.id === id ? { ...item, values: { ...item.values, [field]: value } } : item,
                    ),
                },
            }));
        },
        [],
    );

    const removeWalletItem = useCallback((section: WalletSectionKey, id: string) => {
        setJourney((current) => ({
            ...current,
            wallet: {
                ...current.wallet,
                [section]: current.wallet[section].filter((item) => item.id !== id),
            },
        }));
    }, []);

    const reset = useCallback(() => setJourney(EMPTY_JOURNEY), []);

    return {
        journey,
        hydrated,
        patch,
        setJourney,
        addWalletItem,
        updateWalletItem,
        removeWalletItem,
        reset,
    };
}

export function walletFilledCount(journey: CreatorJourney) {
    return WALLET_SECTIONS.filter((section) => journey.wallet[section.key].length > 0).length;
}
