"use client";
import { useState } from "react";

const tabs = ["Overview", "Lessons", "Assessment", "Requirements", "Schedule", "Reviews (256)", "FAQs"];

export default function CourseTabNav() {
    const [active, setActive] = useState("Overview");
    return (
        <div className="border-b border-gray-200 w-full overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-0 min-w-max">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActive(tab)}
                        className={`px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${active === tab
                            ? "border-blue-700 text-blue-700"
                            : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        </div>
    );
}