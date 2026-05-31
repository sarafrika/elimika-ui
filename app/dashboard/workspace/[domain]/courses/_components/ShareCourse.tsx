export default function ShareCourse() {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-3">Share this course</h3>
            <div className="flex items-center gap-3">
                {[
                    { label: "Facebook", color: "bg-blue-600", icon: "f" },
                    { label: "Twitter", color: "bg-sky-500", icon: "𝕏" },
                    { label: "LinkedIn", color: "bg-blue-700", icon: "in" },
                    { label: "Copy Link", color: "bg-gray-200", icon: "🔗", textColor: "text-gray-700" },
                ].map((s) => (
                    <button
                        key={s.label}
                        title={s.label}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full ${s.color} flex items-center justify-center text-white text-xs font-bold hover:opacity-80 transition-opacity ${s.textColor || ""}`}
                    >
                        {s.icon}
                    </button>
                ))}
            </div>
        </div>
    );
}