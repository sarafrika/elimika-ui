'use client';

import { elimikaDesignSystem } from '@/lib/design-system';

const LibraryPage = () => {
  return (
    <div className={elimikaDesignSystem.components.pageContainer}>
      {/* Header */}
      <section className='mb-6'>
        <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-foreground text-2xl font-bold'>Library</h1>
            <p className='text-muted-foreground text-sm'>
              Explore and manage all available resources, documents, and learning materials in the
              library.
            </p>
          </div>
        </div>
      </section>

      <div className='flex flex-col gap-2 rounded-md border-l-4 border-yellow-500 bg-yellow-100 p-4 text-yellow-800 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4'>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
          <p className='font-medium'>🚧 This page is under construction.</p>
          <p className='text-sm text-yellow-900'></p>
        </div>
      </div>

      {/* Library Component */}
      <section></section>
    </div>
  );
};

export default LibraryPage;
