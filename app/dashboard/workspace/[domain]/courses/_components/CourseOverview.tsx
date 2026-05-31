"use client";
import { CheckCircle2, ChevronDown, ChevronUp, Play } from "lucide-react";
import { useState } from "react";

const curriculum = [
    { title: "1. Introduction to Python", lessons: 5, duration: "2h 30m" },
    { title: "2. Python Fundamentals", lessons: 10, duration: "5h 20m" },
    { title: "3. Data Structures", lessons: 8, duration: "4h 10m" },
    { title: "4. Functions & Modules", lessons: 6, duration: "3h 05m" },
    { title: "5. Object-Oriented Programming", lessons: 8, duration: "4h 30m" },
    { title: "6. Real-World Projects", lessons: 5, duration: "6h 25m" },
];

const learnings = [
    "Understand Python syntax and core concepts",
    "Work with data structures and control flow",
    "Build real-world applications and projects",
    "Use functions, modules and error handling",
    "Work with files, APIs and databases",
    "Apply best practices in coding",
];

export default function CourseOverview() {
    const [expanded, setExpanded] = useState(false);
    const [openModules, setOpenModules] = useState<number[]>([]);

    const toggle = (i: number) => setOpenModules((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);

    return (
        <div className="flex flex-col gap-6 sm:gap-8">
            {/* About */}
            <section>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3">About this course</h2>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    This comprehensive Python course is designed for beginners who want to learn programming from scratch and for intermediate learners who want to strengthen their skills.
                    {expanded && (
                        <span> You'll go from writing your first line of code to building complex applications with databases, APIs, and object-oriented architecture. Structured around real-world projects, this course ensures you graduate job-ready.</span>
                    )}
                </p>
                <button onClick={() => setExpanded(!expanded)} className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 transition-colors">
                    {expanded ? "Show less" : "Show more"}
                    {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
            </section>

            {/* What you'll learn */}
            <section>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">What you&apos;ll learn</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {learnings.map((item, i) => (
                        <div key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                            <span className="text-sm sm:text-base text-gray-700">{item}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Curriculum */}
            <section>
                <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900">Course Curriculum</h2>
                    <button
                        onClick={() => setOpenModules(openModules.length === curriculum.length ? [] : curriculum.map((_, i) => i))}
                        className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium transition-colors"
                    >
                        {openModules.length === curriculum.length ? "Collapse All" : "Expand All"}
                    </button>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                    {curriculum.map((mod, i) => (
                        <div key={i}>
                            <button
                                onClick={() => toggle(i)}
                                className="w-full flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 hover:bg-gray-50 transition-colors text-left gap-2"
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${openModules.includes(i) ? "rotate-180" : ""}`} />
                                    <span className="text-xs sm:text-sm font-semibold text-gray-800 truncate">{mod.title}</span>
                                </div>
                                <div className="flex items-center gap-3 sm:gap-5 shrink-0 text-xs sm:text-sm text-gray-500">
                                    <span className="hidden xs:block">{mod.lessons} Lessons</span>
                                    <span>{mod.duration}</span>
                                    <Play className="w-4 h-4 text-gray-400 hover:text-blue-600 transition-colors" />
                                </div>
                            </button>
                            {openModules.includes(i) && (
                                <div className="bg-gray-50 px-4 sm:px-6 py-3 text-xs sm:text-sm text-gray-500 border-t border-gray-100">
                                    <p>{mod.lessons} lessons • {mod.duration} total</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex flex-wrap gap-4 sm:gap-6 mt-3 text-xs sm:text-sm text-gray-600">
                    <span><strong>Total Lessons:</strong> 42</span>
                    <span><strong>Total Duration:</strong> 8 weeks / 40 hours</span>
                </div>
            </section>

            {/* Meet your instructor */}
            <section>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Meet your instructor</h2>
                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 p-4 sm:p-5 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-200 overflow-hidden flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 80 80" className="w-full h-full" fill="none">
                            <circle cx="40" cy="40" r="40" fill="#FDE68A" />
                            <circle cx="40" cy="32" r="14" fill="#92400E" />
                            <path d="M10 70c0-16.569 13.431-30 30-30s30 13.431 30 30" fill="#92400E" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-bold text-gray-900">James Mwangi</h3>
                        <p className="text-xs sm:text-sm text-gray-500 mb-2">Senior Software Engineer & Educator</p>
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-3 sm:mb-4">
                            James has over 8 years of experience in software development and training. He has taught thousands of students and built scalable applications using Python.
                        </p>
                        <div className="flex flex-wrap gap-4 sm:gap-6">
                            {[
                                { val: "12+", label: "Courses" },
                                { val: "8,500+", label: "Students" },
                                { val: "4.9 ★", label: "Instructor Rating" },
                            ].map((stat, i) => (
                                <div key={i} className="text-center">
                                    <p className="text-sm sm:text-base font-black text-gray-900">{stat.val}</p>
                                    <p className="text-xs text-gray-500">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}