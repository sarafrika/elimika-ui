'use client';

import clsx from 'clsx';
import {
    Heart,
    UserPlus,
    Users,
    UsersRound,
} from 'lucide-react';
import { useState } from 'react';
import AllContactsPage from './all/page';
import FavoritesPage from './favorites/page';
import FollowersPage from './followers/page';
import FriendsPage from './friends/page';
import GroupsPage from './groups/page';

type TabKey =
    | 'all'
    | 'friends'
    | 'followers'
    | 'groups'
    | 'favourites';

export default function ContactsPage() {
    const [activeTab, setActiveTab] = useState<TabKey>('all');

    const tabs = [
        {
            key: 'all' as TabKey,
            label: 'All',
            icon: Users,
            count: 0,
        },
        {
            key: 'friends' as TabKey,
            label: 'Friends',
            icon: UserPlus,
            count: 0,
        },
        {
            key: 'followers' as TabKey,
            label: 'Followers',
            icon: UsersRound,
            count: 0,
        },
        {
            key: 'groups' as TabKey,
            label: 'Groups',
            icon: Users,
            count: 0,
        },
        {
            key: 'favourites' as TabKey,
            label: 'Favourites',
            icon: Heart,
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

                            <span className="text-xs opacity-80">({count})</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1">
                {activeTab === 'all' && <AllContactsPage />}
                {activeTab === 'friends' && <FriendsPage />}
                {activeTab === 'followers' && <FollowersPage />}
                {activeTab === 'groups' && <GroupsPage />}
                {activeTab === 'favourites' && <FavoritesPage />}

            </div>
        </div>
    );
}
