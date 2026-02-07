'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCourseCreator } from '../../../../context/course-creator-context';
import ProgramsList from './_components/ProgramList';

type ViewMode = 'list' | 'create' | 'preview';

const ProgramsPage = () => {
    const router = useRouter()
    const [view, setView] = useState<ViewMode>('list');
    const creator = useCourseCreator()

    const handleCreateNew = () => {
        setView('create');
    };

    const handleEdit = (program: any) => {
        router.push(`/dashboard/programs/create-new-program?id=${program?.uuid}`)
    };

    const handlePreview = (programUuid: string) => {
        router.push(`/dashboard/programs/${programUuid}`)
    };

    return (
        <div className='min-h-screen bg-background'>
            {/* Content Area */}
            <div className=''>
                {view === 'list' && (
                    <ProgramsList
                        onEdit={handleEdit}
                        onPreview={handlePreview}
                        onCreate={handleCreateNew}
                        creator={creator}
                    />
                )}

            </div>
        </div>
    );
};

export default ProgramsPage;
