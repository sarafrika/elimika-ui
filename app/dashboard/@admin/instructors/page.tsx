import React from 'react'
import { Instructor } from '@/api-client/models/Instructor'
import { InstructorManagementService } from '@/api-client/services/InstructorManagementService'
import InstructorsPage from './_components/InstructorsPage'

export default async function Page() {
    let instructors: Instructor[] = []

    try {
        const response = await InstructorManagementService.getAllInstructors({
            page: 0,
            size: 100,
            sort: ['created_date,desc']
        })

        if (response.data?.content) {
            instructors = response.data.content
        }
    } catch (error) {
        console.error('Error fetching instructors:', error)
        // Handle error appropriately - maybe show error state
    }

    return <InstructorsPage instructors={instructors} />
} 