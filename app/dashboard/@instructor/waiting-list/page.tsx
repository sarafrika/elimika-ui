'use client';

import { elimikaDesignSystem } from '@/lib/design-system';
import { Users } from 'lucide-react';

const WaitingListPage = () => {

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
