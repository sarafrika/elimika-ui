'use client';

import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
    buildSocialShareUrl,
    openShareWindow,
} from '../../../../../../lib/share';

type ShareClassCourseProps = {
    courseTitle: string;
    courseUrl: string;
};

type ShareClassProps = {
    classTitle: string;
    classUrl: string;
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
            icon: 'f',
            variant: 'default' as const,
            href: buildSocialShareUrl('facebook', {
                title: courseTitle,
                url: courseUrl,
                description: `Check out this course: ${courseTitle}`,
            }),
        },
        {
            label: 'Twitter',
            icon: '𝕏',
            variant: 'secondary' as const,
            href: buildSocialShareUrl('twitter', {
                title: courseTitle,
                url: courseUrl,
                description: `Check out this course: ${courseTitle}`,
            }),
        },
        {
            label: 'LinkedIn',
            icon: 'in',
            variant: 'outline' as const,
            href: buildSocialShareUrl('linkedin', {
                title: courseTitle,
                url: courseUrl,
                description: `Check out this course: ${courseTitle}`,
            }),
        },
    ];

    return (
        <div className="bg-card border border-border rounded-md p-4 sm:p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-foreground sm:text-base">
                Share this course
            </h3>

            <div className="flex items-center gap-3">
                {shareItems.map((item) => (
                    <Button
                        key={item.label}
                        asChild
                        size="icon"
                        variant={item.variant}
                        disabled={!courseUrl}
                    >
                        <a
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={item.label}
                            onClick={(e) => {
                                e.preventDefault();
                                openShareWindow(item.href);
                            }}
                        >
                            {item.icon}
                        </a>
                    </Button>
                ))}

                <Button
                    size="icon"
                    variant="ghost"
                    title="Copy Link"
                    onClick={handleCopyLink}
                    disabled={!courseUrl}
                >
                    🔗
                </Button>
            </div>
        </div>
    );
}

export function ShareClass({
    classTitle,
    classUrl,
}: ShareClassProps) {
    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(classUrl);
            toast.success('Class link copied');
        } catch {
            toast.error('Failed to copy class link');
        }
    };

    const shareItems = [
        {
            label: 'Facebook',
            icon: 'f',
            variant: 'default' as const,
            href: buildSocialShareUrl('facebook', {
                title: classTitle,
                url: classUrl,
                description: `Check out this class: ${classTitle}`,
            }),
        },
        {
            label: 'Twitter',
            icon: '𝕏',
            variant: 'secondary' as const,
            href: buildSocialShareUrl('twitter', {
                title: classTitle,
                url: classUrl,
                description: `Check out this course: ${classTitle}`,
            }),
        },
        {
            label: 'LinkedIn',
            icon: 'in',
            variant: 'outline' as const,
            href: buildSocialShareUrl('linkedin', {
                title: classTitle,
                url: classUrl,
                description: `Check out this class: ${classTitle}`,
            }),
        },
    ];

    return (
        <div className="bg-card border border-border rounded-md p-4 sm:p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-foreground sm:text-base">
                Share this class
            </h3>

            <div className="flex items-center gap-3">
                {shareItems.map((item) => (
                    <Button
                        key={item.label}
                        asChild
                        size="icon"
                        variant={item.variant}
                        disabled={!classUrl}
                    >
                        <a
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={item.label}
                            onClick={(e) => {
                                e.preventDefault();
                                openShareWindow(item.href);
                            }}
                        >
                            {item.icon}
                        </a>
                    </Button>
                ))}

                <Button
                    size="icon"
                    variant="ghost"
                    title="Copy Link"
                    onClick={handleCopyLink}
                    disabled={!classUrl}
                >
                    🔗
                </Button>
            </div>
        </div>
    );
}