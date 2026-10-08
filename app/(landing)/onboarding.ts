import { useCallback, useEffect, useState } from "react";
import { WALLET_SECTIONS, type WalletSectionKey } from '@/src/features/onboarding/lib/wallet-sections';
export { WALLET_SECTIONS, type WalletSectionKey, type WalletField } from '@/src/features/onboarding/lib/wallet-sections';

const STORAGE_KEY = "elimika:creator-journey";

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

type WalletItem = { id: string; values: Record<string, string> };

type CoursePageKind = "lesson" | "video" | "audio" | "quiz" | "assignment";

type CoursePage = {
    id: string;
    kind: CoursePageKind;
    title: string;
    body: string;
};

type CourseLesson = {
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
type ReviewStatus = "not_submitted" | "submitted" | "approved";

type SarafrikaAccount = {
    fullName: string;
    email: string;
    connectedAt: string;
};

/** Stand-in for the Sarafrika ecosystem profile until the real sign-in is wired up. */
export const SAMPLE_SARAFRIKA_ACCOUNT: Omit<SarafrikaAccount, "connectedAt"> = {
    fullName: "Amina Otieno",
    email: "amina.otieno@sarafrika.com",
};

type CreatorJourney = {
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

const EMPTY_JOURNEY: CreatorJourney = {
    step: 0,
    account: null,
    product: null,
    accountType: null,
    categories: [],
    displayName: "",
    wallet: {
        skills: [],
        education: [],
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
