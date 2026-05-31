"use client";

import { Heart, Share2 } from "lucide-react";
import { useUserDomain } from "../../../../../../context/user-domain-context";
import CourseDetailsHero from "./CourseDetailsHero";
import CourseOverview from "./CourseOverview";
import CourseRating from "./CourseRating";
import CourseTabNav from "./CourseTabNav";
import EnrollSidebar from "./EnrollSidebar";
import ShareCourse from "./ShareCourse";
import StudentsAlsoBought from "./StudentsAlsoBought";

function ClassCourseDetailsPage({ courseId }: { courseId: string }) {

    const { activeDomain } = useUserDomain();

    return (
        <div className="min-h-screen font-sans">

            <main className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                {/* Share / Wishlist row */}
                <div className="flex justify-end gap-2 mb-4 sm:mb-6">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm text-gray-600 border border-gray-200 rounded-lg hover:border-gray-400 hover:text-gray-800 transition-colors bg-white shadow-sm">
                        <Share2 className="w-3.5 h-3.5" />
                        Share
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm text-gray-600 border border-gray-200 rounded-lg hover:border-red-300 hover:text-red-500 transition-colors bg-white shadow-sm">
                        <Heart className="w-3.5 h-3.5" />
                        Wishlist
                    </button>
                </div>

                {/* Main 2-column layout */}
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 xl:gap-10 items-start">
                    {/* LEFT: Main content */}
                    <div className="w-full lg:flex-1 min-w-0 flex flex-col gap-5 sm:gap-6">
                        {/* Course Hero (video + title + badges + features) */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 lg:p-6 shadow-sm">
                            <CourseDetailsHero />
                        </div>

                        {/* Tabs + Overview content */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-4 sm:px-5 lg:px-6 pt-4 sm:pt-5">
                                <CourseTabNav />
                            </div>
                            <div className="px-4 sm:px-5 lg:px-6 py-4 sm:py-5 lg:py-6">
                                <CourseOverview />
                            </div>
                        </div>

                        {/* Students Also Bought */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 lg:p-6 shadow-sm">
                            <StudentsAlsoBought />
                        </div>
                    </div>

                    {/* RIGHT: Sidebar */}
                    <div className="w-full lg:w-80 xl:w-96 shrink-0 flex flex-col gap-4 sm:gap-5 lg:sticky lg:top-20">
                        <EnrollSidebar />
                        <CourseRating />
                        <ShareCourse />
                    </div>
                </div>
            </main>
        </div>
    );
}

export default ClassCourseDetailsPage;