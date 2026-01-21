'use client';

import { elimikaDesignSystem } from "@/lib/design-system";

const LibraryPage = () => {

    return (
        <div className={elimikaDesignSystem.components.pageContainer}>
            {/* Header */}
            <section className='mb-6'>
                <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                    <div>
                        <h1 className="text-foreground text-2xl font-bold">Library</h1>
                        <p className="text-muted-foreground text-sm">
                            Explore and manage all available resources, documents, and learning materials in the library.
                        </p>
                    </div>
                </div>
            </section>

            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 rounded-md shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <p className="font-medium">🚧 This page is under construction.</p>
                    <p className="text-sm text-yellow-900"></p>
                </div>
            </div>

            {/* Library Component */}
            <section></section>
        </div>
    );
};

export default LibraryPage;