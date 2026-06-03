'use client';

import { toast } from 'sonner';
import { buildSocialShareUrl, openShareWindow } from '../../../../../../lib/share';


type ShareClassCourseProps = {
    courseTitle: string;
    courseUrl: string;
};

export default function ShareClassCourse({
    courseTitle,
    courseUrl,
}: ShareClassCourseProps) {
    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(courseUrl);
            toast.success('Course link copied');
        } catch {
            toast.error('Failed to copy course link');
        }
    };

    const shareItems = [
        {
            label: 'Facebook',
            variant: 'primary',
            icon: 'f',
            onClick: () =>
                openShareWindow(
                    buildSocialShareUrl('facebook', {
                        title: courseTitle,
                        url: courseUrl,
                        description: `Check out this course: ${courseTitle}`,
                    })
                ),
        },
        {
            label: 'Twitter',
            variant: 'secondary',
            icon: '𝕏',
            onClick: () =>
                openShareWindow(
                    buildSocialShareUrl('twitter', {
                        title: courseTitle,
                        url: courseUrl,
                        description: `Check out this course: ${courseTitle}`,
                    })
                ),
        },
        {
            label: 'LinkedIn',
            variant: 'accent',
            icon: 'in',
            onClick: () =>
                openShareWindow(
                    buildSocialShareUrl('linkedin', {
                        title: courseTitle,
                        url: courseUrl,
                        description: `Check out this course: ${courseTitle}`,
                    })
                ),
        },
        {
            label: 'Copy Link',
            variant: 'muted',
            icon: '🔗',
            onClick: handleCopyLink,
        },
    ];

    return (
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-foreground sm:text-base">
                Share this course
            </h3>

            <div className="flex items-center gap-3">
                {shareItems.map((item) => (
                    <button
                        key={item.label}
                        title={item.label}
                        onClick={item.onClick}
                        disabled={!courseUrl}
                        className={`
              h-8 w-8 sm:h-9 sm:w-9 rounded-full
              flex items-center justify-center
              text-xs font-bold
              transition-opacity hover:opacity-80 cursor-pointer
              disabled:opacity-50 disabled:cursor-not-allowed
              ${item.variant === 'primary'
                                ? 'bg-muted-foreground/80 text-primary-foreground'
                                : item.variant === 'secondary'
                                    ? 'bg-secondary text-secondary-foreground'
                                    : item.variant === 'accent'
                                        ? 'bg-accent text-accent-foreground'
                                        : 'bg-muted text-muted-foreground'
                            }
            `}
                    >
                        {item.icon}
                    </button>
                ))}
            </div>
        </div>
    );
}