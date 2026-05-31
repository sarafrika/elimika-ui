"use client";
import { Award, BookOpen, Download, FileCheck, Globe, Infinity, Monitor, Search, Shield, Wrench } from "lucide-react";

export default function EnrollSidebar() {
    return (
        <div className="flex flex-col gap-4 sm:gap-5">
            {/* Enroll Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm">
                <p className="text-sm text-gray-500 font-medium mb-1">Enroll in this course</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 mb-4">From Ksh 12,500</p>

                <div className="flex flex-col gap-2.5 sm:gap-3">
                    <button className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 sm:py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm sm:text-base shadow-md hover:shadow-lg">
                        Enroll Now
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </button>
                    <button className="w-full border border-gray-300 hover:border-blue-500 hover:text-blue-700 text-gray-700 font-semibold py-2.5 sm:py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm sm:text-base">
                        <Search className="w-4 h-4" />
                        Search Instructor
                    </button>
                </div>

                {/* Guarantees */}
                <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-100">
                    {[
                        { icon: <Shield className="w-4 h-4 text-gray-400 shrink-0" />, text: "30-Day Money-Back Guarantee" },
                        { icon: <Infinity className="w-4 h-4 text-gray-400 shrink-0" />, text: "Full Lifetime Access" },
                        { icon: <Monitor className="w-4 h-4 text-gray-400 shrink-0" />, text: "Access on Mobile & Desktop" },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                            {item.icon}
                            <span className="text-xs sm:text-sm text-gray-600">{item.text}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Course Details Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm">
                <div className="flex flex-col gap-3">
                    {[
                        { label: "Lecture Type", value: "In-Person", icon: <Globe className="w-4 h-4 text-gray-400 shrink-0" /> },
                        { label: "Location", value: "Starthmore School", icon: <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
                        { label: "Classroom", value: "Art Room", icon: <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-gray-500">
                                {item.icon}
                                <span className="text-xs sm:text-sm">{item.label}</span>
                            </div>
                            <span className="text-xs sm:text-sm font-semibold text-gray-800 text-right">{item.value}</span>
                        </div>
                    ))}

                    <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm text-gray-500">Start Date</span>
                            <span className="text-xs sm:text-sm text-gray-400 italic">TBA</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm text-gray-500">End Date</span>
                            <span className="text-xs sm:text-sm text-gray-400 italic">TBA</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm text-gray-500">Classes Schedule</span>
                            <div className="flex items-center gap-1">
                                <span className="text-xs sm:text-sm font-semibold text-gray-800">Wed, Fri.</span>
                                <button className="text-xs text-blue-600 hover:underline ml-1">view Schedule</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* This course includes */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm">
                <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-3">This course includes</h3>
                <div className="flex flex-col gap-2">
                    {[
                        { icon: <BookOpen className="w-4 h-4 text-gray-500 shrink-0" />, text: "40+ Lessons" },
                        { icon: <FileCheck className="w-4 h-4 text-gray-500 shrink-0" />, text: "6 Assessments" },
                        { icon: <Wrench className="w-4 h-4 text-gray-500 shrink-0" />, text: "6 Hands-on Projects" },
                        { icon: <Download className="w-4 h-4 text-gray-500 shrink-0" />, text: "Downloadable Resources" },
                        { icon: <Infinity className="w-4 h-4 text-gray-500 shrink-0" />, text: "Full Lifetime Access" },
                        { icon: <Award className="w-4 h-4 text-gray-500 shrink-0" />, text: "Certificate of Completion" },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                            {item.icon}
                            <span className="text-xs sm:text-sm text-gray-700">{item.text}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}