'use client';

import clsx from 'clsx';
import {
    BookOpen,
    Laptop,
    Music,
    Palette,
    Trophy,
    Users,
} from 'lucide-react';
import { useState } from 'react';

type TabKey =
    | 'all'
    | 'music'
    | 'sports'
    | 'technology'
    | 'arts'
    | 'education';

export default function CommunitiesPage() {
    const [activeTab, setActiveTab] = useState<TabKey>('all');

    const tabs = [
        {
            key: 'all' as TabKey,
            label: 'All',
            icon: Users,
            count: 0,
        },
        {
            key: 'music' as TabKey,
            label: 'Music',
            icon: Music,
            count: 0,
        },
        {
            key: 'sports' as TabKey,
            label: 'Sports',
            icon: Trophy,
            count: 0,
        },
        {
            key: 'technology' as TabKey,
            label: 'Technology',
            icon: Laptop,
            count: 0,
        },
        {
            key: 'arts' as TabKey,
            label: 'Arts',
            icon: Palette,
            count: 0,
        },
        {
            key: 'education' as TabKey,
            label: 'Education',
            icon: BookOpen,
            count: 0,
        },
    ];

    return (
        <div className="flex flex-col md:flex-row gap-6">
            {/* LEFT MENU (desktop) / TOP MENU (mobile) */}
            <div className="md:w-64 border border-border rounded-md">
                <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible py-4">
                    {tabs.map(({ key, label, count, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={clsx(
                                'flex items-center justify-between gap-3 rounded-md px-4 py-3 text-sm whitespace-nowrap transition',
                                activeTab === key
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-muted'
                            )}
                        >
                            <span className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {label}
                            </span>
                            <span className="text-xs opacity-80">
                                ({count})
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1">
                {activeTab === 'all' && <div>All Communities</div>}
                {activeTab === 'music' && <div>Music Communities</div>}
                {activeTab === 'sports' && <div>Sports Communities</div>}
                {activeTab === 'technology' && <div>Technology Communities</div>}
                {activeTab === 'arts' && <div>Arts Communities</div>}
                {activeTab === 'education' && <div>Education Communities</div>}
            </div>
        </div>
    );
}
