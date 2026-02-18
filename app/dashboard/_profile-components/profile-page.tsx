'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Briefcase, Globe, Mail, MapPin, Phone } from 'lucide-react';
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import type { ProfilePageProps } from './types';

function ProfileHeaderSkeleton() {
    return (
        <div className="bg-card border border-border rounded-2xl p-7">
            <div className="flex items-start gap-6 mb-6">
                <Skeleton className="w-[90px] h-[90px] rounded-xl shrink-0" />
                <div className="flex-1 space-y-3">
                    <Skeleton className="h-7 w-48" />
                    <div className="flex gap-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                    <Skeleton className="h-6 w-44" />
                </div>
            </div>
            <div className="flex gap-2 pt-4 border-t border-border">
                {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-9 w-24 rounded-lg" />
                ))}
            </div>
        </div>
    );
}

function MetaItem({ icon, value }: { icon: React.ReactNode; value?: string }) {
    if (!value) return null;
    return (
        <span className="flex items-center gap-1.5 text-muted-foreground text-sm">
            {icon}
            <span>{value}</span>
        </span>
    );
}

export function ProfilePage({
    tabs,
    profile,
    isLoading = false,
    headerBadge,
    defaultTab,
}: ProfilePageProps) {
    const [activeTabId, setActiveTabId] = useState(defaultTab ?? tabs[0]?.id ?? '');

    const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];
    const TabContent = activeTab?.component;

    if (isLoading) {
        return (
            <div className="p-6 space-y-0">
                <ProfileHeaderSkeleton />
            </div>
        );
    }

    const initials = profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="p-6 space-y-0 font-sans">
            <div className="bg-card border border-border rounded-2xl p-7">

                {/* Avatar + Info Row */}
                <div className="flex items-start gap-6 mb-6">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                        <Avatar className="w-[90px] h-[90px] rounded-xl">
                            <AvatarImage
                                src={profile?.profile_image_url || profile?.avatar_url}
                                alt={profile?.full_name}
                                className="object-cover"
                            />
                            <AvatarFallback className="rounded-xl text-lg font-semibold bg-primary/10 text-primary">
                                {initials}
                            </AvatarFallback>
                        </Avatar>

                        {profile.is_online && (
                            <span className="absolute top-0.5  right-1.5 w-4 h-4 rounded-full bg-success/50 border-2 border-card" />
                        )}
                    </div>

                    {/* Name + Meta */}
                    <div className="flex-1 min-w-0">
                        {/* Name row */}
                        <div className="flex items-center justify-between gap-3 mb-2">
                            <h1 className="text-2xl font-bold text-foreground tracking-tight truncate">
                                {profile.full_name}
                            </h1>
                            {headerBadge && <div className="shrink-0">{headerBadge}</div>}
                        </div>

                        {/* Secondary meta */}
                        <div className="flex flex-wrap gap-x-5 gap-y-1 mb-3">
                            <MetaItem
                                icon={<Briefcase className="w-4 h-4 text-muted-foreground" />}
                                value={profile.professional_headline}
                            />
                            <MetaItem
                                icon={<MapPin className="w-4 h-4 text-muted-foreground" />}
                                value={profile.address}
                            />
                        </div>

                        <div className="flex flex-col space-y-3 mb-3">
                            <MetaItem
                                icon={<Phone className="w-4 h-4 text-muted-foreground" />}
                                value={profile.phone}
                            />
                            <MetaItem
                                icon={<Mail className="w-4 h-4 text-muted-foreground" />}
                                value={profile.email}
                            />
                            <MetaItem
                                icon={<Globe className="w-4 h-4 text-muted-foreground" />}
                                value={profile.website}
                            />
                        </div>


                        {/* ID badge */}
                        <span className="inline-block bg-muted text-muted-foreground text-xs font-bold px-3 py-1 rounded-md tracking-wider">
                            ID {profile.uuid}
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-1 pt-4 border-t border-border">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTabId(tab.id)}
                            className={cn(
                                'px-4.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer',
                                activeTabId === tab.id
                                    ? 'bg-primary/80 rounded-full text-primary-foreground font-semibold'
                                    : 'text-muted-foreground hover:bg-muted rounded-full hover:text-foreground'
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {TabContent && (
                <div key={activeTabId} className="animate-in fade-in-0 duration-200">
                    <TabContent
                        userUuid={profile.user_uuid}
                        domain={'student'}
                        sharedProfile={profile}
                    />
                </div>
            )}
        </div>
    );
}