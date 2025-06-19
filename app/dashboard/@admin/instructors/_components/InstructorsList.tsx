import React from 'react'
import { Instructor } from '@/services/api/schema'
import InstructorFilters from './InstructorFilters'
import InstructorCard from './InstructorCard'

interface InstructorsListProps {
    instructors: Instructor[]
    selectedInstructor: Instructor | null
    searchQuery: string
    setSearchQuery: (query: string) => void
    statusFilter: string
    setStatusFilter: (status: string) => void
    sortOrder: 'asc' | 'desc'
    setSortOrder: (order: 'asc' | 'desc') => void
    onInstructorSelect: (instructor: Instructor) => void
    onInstructorDelete: (instructor: Instructor) => void
    getStatusBadgeComponent: (instructorId: string) => React.ReactElement
}

export default function InstructorsList({
    instructors,
    selectedInstructor,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortOrder,
    setSortOrder,
    onInstructorSelect,
    onInstructorDelete,
    getStatusBadgeComponent,
}: InstructorsListProps) {
    return (
        <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r bg-background flex flex-col">
            {/* Search and Filters Header */}
            <InstructorFilters
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
            />

            {/* Instructor List */}
            <div className="flex-1 overflow-y-auto">
                {instructors.map((instructor) => (
                    <InstructorCard
                        key={instructor.uuid}
                        instructor={instructor}
                        isSelected={selectedInstructor?.uuid === instructor.uuid}
                        onSelect={onInstructorSelect}
                        onDelete={onInstructorDelete}
                        getStatusBadgeComponent={getStatusBadgeComponent}
                    />
                ))}
            </div>
        </div>
    )
} 