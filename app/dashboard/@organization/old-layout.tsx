"use client"

import { ReactNode } from "react"
import OrganisactionProvider from "../../../context/organization-context"

export default function OrganizationLayout({ children }: { children: ReactNode }) {
    return (
        <OrganisactionProvider>{children}</OrganisactionProvider>
    )
}
