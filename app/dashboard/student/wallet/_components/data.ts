

type Bucket = "personal" | "skills_fund" | "rewards" | "marketplace_credits" | "refunds";

export const PAYABLE_ITEMS = [
    "Course",
    "Class",
    "Assessment",
    "Certification",
    "Marketplace Item",
    "Equipment",
    "Competition",
    "Ticket",
] as const;

export const BUCKET_META: Record<Bucket, { label: string; hint: string }> = {
    personal: { label: "Personal Wallet", hint: "Your own funds — no restrictions" },
    skills_fund: { label: "Skills Fund", hint: "Funder-allocated learning credit" },
    rewards: { label: "Rewards", hint: "Earned credits from learning & referrals" },
    marketplace_credits: { label: "Marketplace Credits", hint: "For equipment and marketplace items" },
    refunds: { label: "Refund Balance", hint: "Landed here when the original bucket expired" },
};

export const BUCKET_RULES: Partial<Record<Bucket, { restricted: boolean; purpose: string; allowed: string[] }>> = {
    skills_fund: {
        restricted: true,
        purpose: "Courses, assessments & certifications only",
        allowed: ["Course", "Assessment", "Certification"],
    },
    marketplace_credits: {
        restricted: true,
        purpose: "Marketplace items & equipment only",
        allowed: ["Marketplace Item", "Equipment"],
    },
};



/* =========================================================================
   Mock data seed
   ========================================================================= */
