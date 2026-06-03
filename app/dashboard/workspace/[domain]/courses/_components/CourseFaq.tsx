"use client";

type CourseFaqProps = {
    faqs?: { question: string; answer: string }[];
    type?: "course" | "class";
};

export default function CourseFaq({ faqs, type = "course" }: CourseFaqProps) {
    if (!faqs || faqs.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground space-y-2">
                <svg
                    className="mx-auto h-12 w-12 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16h6m2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2z"
                    />
                </svg>
                <h2 className="text-lg font-semibold text-foreground">
                    No FAQs yet
                </h2>
                <p className="text-sm text-muted-foreground">
                    The {type === "course" ? "course creator" : "instructor"} hasn’t added any frequently asked questions for this {type === "course" ? "course" : "class"}.
                </p>
            </div>
        );
    }

    // Placeholder for future FAQ list rendering
    return (
        <div className="space-y-4">
            {faqs.map((faq, index) => (
                <div key={index} className="border-b border-border pb-4">
                    <h3 className="font-semibold text-foreground">{faq.question}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{faq.answer}</p>
                </div>
            ))}
        </div>
    );
}