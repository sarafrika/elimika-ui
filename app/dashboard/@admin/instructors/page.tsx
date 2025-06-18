import React from 'react'
import { Instructor } from '@/services/api/schema'
import { fetchClient } from '@/services/api/fetch-client'
import InstructorsPage from './_components/InstructorsPage'
import ErrorPage from '@/components/ErrorPage'

export default async function Page() {
    const response = await fetchClient.GET("/api/v1/instructors", {
        params: {
            query: {
                //@ts-ignore
                page: 0,
                size: 20,
                sort: ['desc']
            }
        }
    })

    if (response.error) {
        console.error(response)
        return <ErrorPage message={response.error.message || "Something went wrong while fetching instructors"} />
    }

    const instructors = response.data?.data?.content
    return <InstructorsPage instructors={instructors || []} />
} 