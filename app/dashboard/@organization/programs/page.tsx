'use client';

import { useState } from 'react';
import CreateProgramWizard from './_components/CreateProgramWizard';
import ProgramsList from './_components/ProgramList';
import ProgramPreview from './_components/ProgramPreview';

type ViewMode = 'list' | 'create' | 'preview';

const ProgramsPage = () => {
    const [view, setView] = useState<ViewMode>('list');
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
        <div className='min-h-screen bg-background p-6'>
            {/* Header */}
            <div className='mb-6 flex items-start justify-between'>
                <div className='flex items-start gap-4'>
                    <div className='flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-muted text-2xl'>
                        📚
                    </div>
                    <div>
                        <h1 className='text-2xl font-bold text-foreground'>
                            Training Programs
                        </h1>
                        <p className='text-muted-foreground'>
                            Create, manage, and monitor comprehensive training programs
                        </p>
                    </div>
                </div>

                {view === 'list' && (
                    <button
                        onClick={handleCreateNew}
                        className='rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90'
                    >
                        + Create Program
                    </button>
                )}
            </div>

            {/* Content Area */}
            <div className=''>
                {view === 'list' && (
                    <ProgramsList
                        onEdit={handleEdit}
                        onPreview={handlePreview}
                    />
                )}

                {view === 'create' && (
                    <CreateProgramWizard
                        editingProgram={editingProgram}
                        onComplete={handleBackToList}
                        onCancel={handleBackToList}
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
