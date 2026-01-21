'use client';

import { useState } from "react";
import { elimikaDesignSystem } from "../../../../lib/design-system";
import BookingsPage from "../bookings/page";

const WaitingListPage = () => {
    const [activeTab, setActiveTab] = useState('waiting-list');

    const tabs = [
        { id: 'waiting-list', label: 'Waiting Lists', icon: '⏳' },
        { id: 'bookings', label: 'Bookings', icon: '📋' }
    ];

    return (
        <div className={elimikaDesignSystem.components.pageContainer}>
            {/* Header */}
            <section className='mb-6'>
                <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Class Waiting Lists</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            View and manage students waitlisted for fully booked classes, and enroll them as seats become available.
                        </p>
                    </div>
                </div>
            </section>

            {/* Alert Banner */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 rounded-md shadow-sm mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <p className="font-medium">🚧 This page is under construction.</p>
                </div>
            </div>

            {/* Stylish Tabs */}
            <section className="mb-8">
                <div className="relative border-b border-border">
                    <div className="flex gap-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    relative px-6 py-3 font-medium text-md transition-all duration-300 ease-in-out
                                    hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-t-lg
                                    ${activeTab === tab.id
                                        ? 'text-primary'
                                        : 'text-muted-foreground hover:bg-muted'
                                    }
                                `}
                            >
                                <span className="flex items-center gap-2">
                                    <span className="text-md">{tab.label}</span>
                                </span>

                                {/* Active indicator */}
                                {activeTab === tab.id && (
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-primary/90 rounded-full transform transition-all duration-300" />
                                )}

                                {/* Hover effect background */}
                                <span
                                    className={`
                                        absolute inset-0 rounded-t-lg transition-opacity duration-300
                                        ${activeTab === tab.id
                                            ? 'bg-accent opacity-100'
                                            : 'bg-transparent opacity-0 hover:opacity-100'
                                        }
                                        -z-10
                                    `}
                                />
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Tab Content */}
            <section className="animate-fadeIn">
                {activeTab === "waiting-list" && (
                    <div className="p-6 bg-card rounded-lg border border-border shadow-sm">
                        <h2 className="text-xl font-semibold mb-4 text-foreground">Waiting List of Students</h2>
                        <p className="text-muted-foreground">Student waiting list content will appear here.</p>
                    </div>
                )}

                {activeTab === "bookings" && (
                    <div className="transition-all duration-300">
                        <BookingsPage />
                    </div>
                )}
            </section>

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default WaitingListPage;