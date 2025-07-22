import React from "react"
import OrganizationsPage from "./_components/OrganizationsPage"
import { fetchClient } from "@/services/api/fetch-client"
import ErrorPage from "@/components/ErrorPage"
import { sampleOrganizations } from "../overview/sample-admin-data"

export default async function Page() {
  const response = await fetchClient.GET("/api/v1/organisations", {
    params: {
      query: {
        //@ts-ignore
        page: 0,
        size: 100,
      },
    },
  })
  if (response.error) {
    console.error(response.error)
    return <ErrorPage message={response.error.message || "Something went wrong while fetching organizations"} />
  }
  const organizations = response.data?.data?.content

  // Use sample data if API returns no organizations
  const organizationData = organizations && organizations.length > 0 ? organizations : sampleOrganizations

  return <OrganizationsPage organizations={organizationData} />
}
