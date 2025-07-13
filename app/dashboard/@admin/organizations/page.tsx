import React from "react"
import OrganizationsPage from "./_components/OrganizationsPage"
import { fetchClient } from "@/services/api/fetch-client"
import ErrorPage from "@/components/ErrorPage"
import { sampleOrganizations } from "../overview/sample-admin-data"

// Dummy organizations for layout preview
// const dummyOrganizations: OrganisationDto[] = [
//   {
//     uuid: "org-123e4567-e89b-12d3-a456-426614174000",
//     name: "Elimika Training Institute",
//     description:
//       "A leading provider of professional development and technical training programs across East Africa. We specialize in digital skills, leadership development, and industry-specific certifications.",
//     domain: "elimika.co.ke",
//     code: "ETI001",
//     slug: "elimika-training-institute",
//     active: true,
//     created_date: "2023-01-15T08:30:00Z",
//     updated_date: "2024-01-20T14:45:00Z",
//   },
//   {
//     uuid: "org-456e7890-e89b-12d3-a456-426614174001",
//     name: "Skills Development Academy",
//     description:
//       "Focused on bridging the skills gap in technology and business through comprehensive training programs and workshops.",
//     domain: "skillsdev.org",
//     code: "SDA002",
//     slug: "skills-development-academy",
//     active: true,
//     created_date: "2023-03-22T10:15:00Z",
//     updated_date: "2024-01-18T16:20:00Z",
//   },
//   {
//     uuid: "org-789e0123-e89b-12d3-a456-426614174002",
//     name: "Professional Learning Hub",
//     description:
//       "Delivering high-quality corporate training solutions and professional certification programs for working professionals.",
//     domain: "prolearn.com",
//     code: "PLH003",
//     slug: "professional-learning-hub",
//     active: false,
//     created_date: "2023-07-10T12:00:00Z",
//     updated_date: "2024-01-10T09:30:00Z",
//   },
//   {
//     uuid: "org-012e3456-e89b-12d3-a456-426614174003",
//     name: "Digital Innovation Center",
//     description:
//       "Specializing in cutting-edge technology training including AI, blockchain, and data science for the next generation of tech leaders.",
//     domain: "digitalinnovation.tech",
//     code: "DIC004",
//     slug: "digital-innovation-center",
//     active: true,
//     created_date: "2023-09-05T14:25:00Z",
//     updated_date: "2024-01-25T11:10:00Z",
//   },
// ]

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
