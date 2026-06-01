export default function ShareCourse() {
    return (
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm">
            <h3 className="font-bold text-foreground text-sm sm:text-base mb-3">
                Share this course
            </h3>

            <div className="flex items-center gap-3">
                {[
                    { label: "Facebook", variant: "primary", icon: "f" },
                    { label: "Twitter", variant: "secondary", icon: "𝕏" },
                    { label: "LinkedIn", variant: "accent", icon: "in" },
                    { label: "Copy Link", variant: "muted", icon: "🔗" },
                ].map((s) => (
                    <button
                        key={s.label}
                        title={s.label}
                        className={`
                            w-8 h-8 sm:w-9 sm:h-9 rounded-full
                            flex items-center justify-center
                            text-xs font-bold transition-opacity hover:opacity-80
                            ${s.variant === "primary"
                                ? "bg-primary text-primary-foreground"
                                : s.variant === "secondary"
                                    ? "bg-secondary text-secondary-foreground"
                                    : s.variant === "accent"
                                        ? "bg-accent text-accent-foreground"
                                        : "bg-muted text-muted-foreground"
                            }
                        `}
                    >
                        {s.icon}
                    </button>
                ))}
            </div>
        </div>
    );
}