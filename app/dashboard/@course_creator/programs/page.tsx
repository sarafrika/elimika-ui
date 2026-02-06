'use client';

import { useState } from 'react';
import { useCourseCreator } from '../../../../context/course-creator-context';
import CreateProgramWizard from './_components/CreateProgramWizard';
import ProgramsList from './_components/ProgramList';
import ProgramPreview from './_components/ProgramPreview';

type ViewMode = 'list' | 'create' | 'preview';

const ProgramsPage = () => {
    const [view, setView] = useState<ViewMode>('list');
    const creator = useCourseCreator()
    const [selectedProgramUuid, setSelectedProgramUuid] = useState<string | null>(
        null
    );
    const [editingProgram, setEditingProgram] = useState<any>(null);

    const handleCreateNew = () => {
        setEditingProgram(null);
        setView('create');
    };

    const handleEdit = (program: any) => {
        setEditingProgram(program);
        setView('create');
    };

    const handlePreview = (programUuid: string) => {
        setSelectedProgramUuid(programUuid);
        setView('preview');
    };

    const handleBackToList = () => {
        setView('list');
        setSelectedProgramUuid(null);
        setEditingProgram(null);
    };

    return (
        <div className='min-h-screen bg-background'>
            {/* Header */}
            {/* <div className='flex items-end justify-end'>
                {view === 'list' && (
                    <Button
                        onClick={handleCreateNew}
                        className='rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90'
                    >
                        <PlusCircle /> Create Program
                    </Button>
                )}
            </div> */}

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

                {view === 'create' && (
                    <CreateProgramWizard
                        editingProgram={editingProgram}
                        onComplete={handleBackToList}
                        onCancel={handleBackToList}
                        setEditingProgram={setEditingProgram}
                        creator={creator}
                    />
                )}

                {view === 'preview' && (
                    <ProgramPreview
                        programUuid={selectedProgramUuid}
                        onBack={handleBackToList}
                        onEdit={handleEdit}
                        editingProgram={editingProgram}
                    />
                )}
            </div>
        </div>
    );
};

export default ProgramsPage;
