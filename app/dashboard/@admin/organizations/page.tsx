import React from 'react'
import { OrganisationDtoReadable } from '@/api-client/types.gen'
import { getAllOrganisations } from '@/api-client/sdk.gen'
import OrganizationsPage from './_components/OrganizationsPage'

export default async function Page() {
    let organizations: OrganisationDtoReadable[] = []
    try {
        const response = await getAllOrganisations({
            query: {
                pageable: {
                    page: 0,
                    size: 100,
                    sort: ['created_date,desc']
                }
            }
        })

        if (response.data?.data?.content) {
            organizations = response.data.data.content
        }
    } catch (error) {
        console.error('Error fetching organizations:', error)
        // Handle error appropriately - maybe show error state
    }

    return <OrganizationsPage organizations={organizations} />
}
