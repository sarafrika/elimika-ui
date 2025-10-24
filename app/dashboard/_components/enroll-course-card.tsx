import RichTextRenderer from '@/components/editors/richTextRenders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, MapPin } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useDifficultyLevels } from '../../../hooks/use-difficultyLevels';

interface EnrollCourseCardProps {
    cls: any;
    isFull: boolean;
    enrollmentPercentage: number;
    handleEnroll: (cls: any) => void
}

export default function EnrollCourseCard({
    cls,
    isFull,
    enrollmentPercentage,
    handleEnroll
}: EnrollCourseCardProps) {
    const router = useRouter();
    const { difficultyMap } = useDifficultyLevels();
    const difficultyName = difficultyMap[cls?.course?.difficulty_uuid] || "Unknown";

    return (
        <div className="group cursor-pointer max-w-[360px]">
            <div className="relative h-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-2xl p-[2px] shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                <div className="h-full bg-white rounded-2xl overflow-hidden">
                    {/* Image Header */}
                    <div className="relative h-48 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-cyan-400/20 to-indigo-500/20 z-10" />
                        <Image
                            src={
                                cls?.course?.thumbnail_url ||
                                'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop'
                            }
                            alt={cls?.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            width={200}
                            height={50}
                        />

                        {/* Badges */}
                        <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-2">
                            <Badge className={`backdrop-blur-sm`}>
                                <MapPin className="w-3 h-3 mr-1" />
                                {cls?.location_type.replace('_', ' ')}
                            </Badge>
                            <Badge className={`backdrop-blur-sm`}>
                                {difficultyName}
                            </Badge>
                        </div>

                        {isFull && (
                            <div className="absolute top-3 right-3 z-20">
                                <Badge className="bg-red-500/90 text-white backdrop-blur-sm">FULL</Badge>
                            </div>
                        )}

                        {/* Floating Add to Cart */}
                        <Button
                            size="icon"
                            variant="secondary"
                            className="absolute bottom-3 right-3 z-30 rounded-full bg-white/90 hover:bg-blue-100 border border-blue-200"
                            onClick={(e) => {
                                e.stopPropagation();
                                toast.success('Implement add to cart:', cls.uuid);
                            }}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="w-4 h-4 text-blue-600"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.6 8h13.2L17 13M7 13h10m-4 8a1 1 0 100-2 1 1 0 000 2zm-6 0a1 1 0 100-2 1 1 0 000 2z"
                                />
                            </svg>
                        </Button>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 space-y-4">
                        <div className="space-y-2">
                            <h3 className="line-clamp-2 group-hover:text-blue-600 transition-colors">{cls?.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                                <span className="line-clamp-1">{cls?.course?.name}</span>
                            </div>
                        </div>

                        <div className="text-sm text-muted-foreground line-clamp-2">
                            <RichTextRenderer htmlString={cls?.description} maxChars={50} />
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                            {cls?.course?.category_names?.slice(0, 2).map((category: any, idx: any) => (
                                <Badge
                                    key={idx}
                                    variant="outline"
                                    className="text-xs bg-blue-50/50 text-blue-700 border-blue-200/50"
                                >
                                    {category}
                                </Badge>
                            ))}
                        </div>

                        {/* Instructor */}
                        <div className="flex items-center gap-2 p-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100/50">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm shadow-md">
                                {cls?.instructor?.full_name?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground">Instructor</p>
                                <p className="text-sm truncate">{cls?.instructor?.full_name}</p>
                            </div>
                        </div>

                        {/* Enrollment Progress */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Enrollment</span>
                                <span className={enrollmentPercentage >= 80 ? 'text-orange-600' : 'text-blue-600'}>
                                    {enrollmentPercentage?.toFixed(0)}%
                                </span>
                            </div>
                            <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${enrollmentPercentage >= 80
                                        ? 'bg-gradient-to-r from-orange-400 to-red-500'
                                        : 'bg-gradient-to-r from-blue-400 to-indigo-500'
                                        }`}
                                    style={{ width: `${enrollmentPercentage}%` }}
                                />
                            </div>
                        </div>

                        {/* Footer: Enroll + Add to Cart */}
                        <div className="flex items-center justify-between pt-3 border-t border-blue-100/50">
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-medium text-gray-900">KES {cls?.training_fee || 'N/A'}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEnroll(cls);
                                    }}
                                >
                                    Enroll Now
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
