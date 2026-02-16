'use client';

import { elimikaDesignSystem } from '@/lib/design-system';
import { Users } from 'lucide-react';
import { useState } from 'react';
import BookingsPage from '../bookings/page';

const WaitingListPage = () => {
  const [activeTab, setActiveTab] = useState('waiting-list');

  const tabs = [
    { id: 'waiting-list', label: 'Waiting Lists', icon: '⏳' },
    { id: 'bookings', label: 'Bookings', icon: '📋' },
  ];

  return (
    <div className={elimikaDesignSystem.components.pageContainer}>
      {/* Header */}
      <section className='mb-6'>
        <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-foreground text-2xl font-bold'>Class Waiting Lists</h1>
            <p className='text-muted-foreground mt-1 text-sm'>
              View and manage students waitlisted for fully booked classes, and enroll them as seats
              become available.
            </p>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className='mb-8'>
        <div className='border-border relative overflow-x-auto border-b'>
          <div className='flex min-w-max gap-1'>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-md hover:text-foreground focus:ring-ring relative rounded-t-lg px-4 py-2 font-medium transition-all duration-300 ease-in-out focus:ring-2 focus:ring-offset-2 focus:outline-none sm:px-6 sm:py-3 ${activeTab === tab.id ? 'text-primary' : 'text-muted-foreground hover:bg-muted'} `}
              >
                <span className='flex items-center gap-2'>
                  <span className='text-md'>{tab.label}</span>
                </span>

                {/* Active indicator */}
                {activeTab === tab.id && (
                  <span className='absolute right-0 bottom-0 left-0 h-0.5 transform rounded-full transition-all duration-300' />
                )}

                {/* Hover effect background */}
                <span
                  className={`absolute inset-0 transition-opacity duration-300 ${activeTab === tab.id ? 'opacity-100' : 'bg-transparent opacity-0 hover:opacity-100'} -z-10`}
                />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tab Content */}
      <section className='animate-fadeIn'>
        {activeTab === 'waiting-list' && (
          <div className='bg-card border-border rounded-lg border p-4 shadow-sm sm:p-6'>
            <h2 className='text-foreground mb-4 text-xl font-semibold'>Waiting List</h2>

            <div className='flex flex-col items-center justify-center rounded-md p-8 text-center'>
              <Users className='text-muted-foreground mb-3 h-8 w-8' />

              <p className='text-foreground text-sm font-medium sm:text-base'>
                No students in the waiting list
              </p>

              <p className='text-muted-foreground mt-1 max-w-sm text-xs sm:text-sm'>
                Students who request to join your class but haven’t been enrolled yet will appear
                here.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className='transition-all duration-300'>
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
