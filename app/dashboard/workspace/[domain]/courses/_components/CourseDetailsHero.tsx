import { Award, BookOpen, Clock, FileCheck, Globe, Users } from "lucide-react";
import StarRating from "./StarRating";

export default function CourseDetailsHero() {
    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            {/* Video Thumbnail */}
            <div className="relative rounded-xl overflow-hidden aspect-video bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 cursor-pointer group shadow-lg">
                {/* Background decoration */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-4 left-4 w-16 h-16 border-2 border-yellow-400 rounded-full"></div>
                    <div className="absolute bottom-8 right-8 w-24 h-24 border border-blue-400 rounded-full"></div>
                    <div className="absolute top-1/2 right-12 w-8 h-8 border border-blue-300 rounded-full"></div>
                </div>

                {/* Python logo illustration */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-4 mb-2">
                            {/* Simple Python snake icon */}
                            <svg viewBox="0 0 60 60" className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 drop-shadow-lg">
                                <ellipse cx="22" cy="20" rx="14" ry="16" fill="#3B82F6" />
                                <ellipse cx="38" cy="40" rx="14" ry="16" fill="#F59E0B" />
                                <circle cx="16" cy="14" r="3" fill="white" />
                                <circle cx="44" cy="46" r="3" fill="white" />
                                <rect x="20" y="28" width="20" height="4" rx="2" fill="#1E3A5F" />
                            </svg>
                        </div>
                        <p className="text-white font-black text-lg sm:text-xl lg:text-2xl tracking-tight drop-shadow">PYTHON</p>
                        <p className="text-white font-bold text-base sm:text-lg lg:text-xl">PROGRAMMING</p>
                        <p className="text-blue-200 text-xs sm:text-sm">From Basics to Advanced</p>
                    </div>
                </div>

                {/* Preview badge */}
                <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1 backdrop-blur-sm">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                    Preview
                </div>

                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/90 rounded-full flex items-center justify-center shadow-2xl">
                        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-800 ml-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>

                {/* Permanent play circle */}
                <div className="absolute inset-0 flex items-center justify-center group-hover:opacity-0 transition-opacity">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 border-2 border-white/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Course Title & Info */}
            <div className="flex flex-col gap-3 sm:gap-4">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-blue-900 leading-tight">
                    Python Programming: From Basics to Advanced
                </h1>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs sm:text-sm font-semibold rounded-full">
                        <Award className="w-3.5 h-3.5" />
                        Certificate Course
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 text-green-700 text-xs sm:text-sm font-semibold rounded-full">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Beginner
                    </span>
                </div>

                <StarRating rating={4.8} reviewCount={256} size="md" />

                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                    Master Python programming from the ground up. Learn core concepts, data structures, and build real-world projects.
                </p>

                {/* Instructor / Duration / Students */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-amber-200 overflow-hidden flex items-center justify-center shrink-0">
                            <svg viewBox="0 0 28 28" className="w-full h-full" fill="none">
                                <circle cx="14" cy="14" r="14" fill="#FDE68A" />
                                <circle cx="14" cy="11" r="4" fill="#92400E" />
                                <path d="M5 23c0-4.97 4.03-9 9-9s9 4.03 9 9" fill="#92400E" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs">Instructor</p>
                            <p className="font-semibold text-gray-800 text-xs sm:text-sm">James Mwangi</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                        <div>
                            <p className="text-gray-400 text-xs">Duration</p>
                            <p className="font-semibold text-gray-800 text-xs sm:text-sm">8 weeks / 40 hours</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-gray-400 shrink-0" />
                        <div>
                            <p className="text-gray-400 text-xs">Students</p>
                            <p className="font-semibold text-gray-800 text-xs sm:text-sm">1,250 Enrolled</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-2 sm:gap-4 py-3 sm:py-4 border-t border-b border-gray-100">
                {[
                    { icon: <BookOpen className="w-4 h-4 text-blue-500" />, label: "40+", sub: "Lessons" },
                    { icon: <FileCheck className="w-4 h-4 text-green-500" />, label: "6", sub: "Assessments" },
                    { icon: <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, label: "Hands-on", sub: "Projects" },
                    { icon: <Award className="w-4 h-4 text-purple-500" />, label: "Certificate", sub: "of Completion" },
                    { icon: <Globe className="w-4 h-4 text-sky-500" />, label: "English", sub: "Language" },
                ].map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5 min-w-fit">
                        {item.icon}
                        <div>
                            <span className="text-xs sm:text-sm font-bold text-gray-800">{item.label}</span>
                            <span className="text-xs text-gray-500 ml-0.5">{item.sub}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}