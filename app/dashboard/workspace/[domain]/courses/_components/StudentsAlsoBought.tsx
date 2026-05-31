import StarRating from "./StarRating";

const relatedCourses = [
    { title: "JavaScript Complete Guide", price: "Ksh 10,500", rating: 4.7, reviews: 180, bg: "bg-yellow-400", label: "JS", textColor: "text-yellow-900" },
    { title: "React.js For Beginners", price: "Ksh 11,000", rating: 4.6, reviews: 210, bg: "bg-sky-500", label: "⚛", textColor: "text-white" },
    { title: "Node.js Essentials", price: "Ksh 9,500", rating: 4.6, reviews: 165, bg: "bg-green-700", label: "N", textColor: "text-green-200" },
];

export default function StudentsAlsoBought() {
    return (
        <section>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Students also bought</h2>
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {relatedCourses.map((course, i) => (
                    <div key={i} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
                        <div className={`${course.bg} p-4 sm:p-6 flex items-center justify-center aspect-video`}>
                            <span className={`text-2xl sm:text-3xl font-black ${course.textColor}`}>{course.label}</span>
                        </div>
                        <div className="p-3 sm:p-4">
                            <h3 className="text-xs sm:text-sm font-bold text-gray-800 leading-tight mb-1.5 group-hover:text-blue-700 transition-colors">{course.title}</h3>
                            <StarRating rating={course.rating} reviewCount={course.reviews} size="sm" />
                            <p className="text-xs sm:text-sm font-bold text-gray-900 mt-2">From {course.price}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}