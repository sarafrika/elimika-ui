import StarRating from "./StarRating";

const breakdown = [
    { stars: 5, pct: 84 },
    { stars: 4, pct: 12 },
    { stars: 3, pct: 3 },
    { stars: 2, pct: 1 },
    { stars: 1, pct: 0 },
];

export default function CourseRating() {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-4">Course Rating</h3>

            <div className="flex items-center gap-3 sm:gap-4 mb-4">
                <div className="text-center shrink-0">
                    <p className="text-3xl sm:text-4xl font-black text-gray-900">4.8</p>
                    <StarRating rating={4.8} size="sm" showCount={false} />
                    <p className="text-xs text-gray-500 mt-1">256 reviews</p>
                </div>
                <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                    {breakdown.map((row) => (
                        <div key={row.stars} className="flex items-center gap-2 text-xs">
                            <div className="flex items-center gap-0.5 shrink-0">
                                <span className="text-amber-400">★</span>
                                <span className="text-gray-600">{row.stars}</span>
                            </div>
                            <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${row.pct}%` }}></div>
                            </div>
                            <span className="text-gray-500 shrink-0 w-6 text-right">{row.pct}%</span>
                        </div>
                    ))}
                </div>
            </div>

            <button className="w-full border border-gray-300 hover:border-blue-500 hover:text-blue-700 text-gray-700 font-semibold py-2 px-4 rounded-lg text-xs sm:text-sm transition-colors">
                Write a Review
            </button>
        </div>
    );
}