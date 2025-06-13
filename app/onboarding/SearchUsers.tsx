'use client'
import { tanstackClient } from '@/api/tanstack-client'
import { useSession } from 'next-auth/react'
import React from 'react'

type Props = {}

export default function SearchUsers({ }: Props) {
    const session = useSession()
    const { data: user, isPending } = tanstackClient.useQuery("get", "/api/v1/users/search", {
        params: {
            query: {
                page: 0,
                size: 1,
                email: session?.data?.user?.email,
            },
        },
    })
    if (isPending) return <div>Loading...</div>
    console.log(user)
    return (
        <div>SearchUsers</div>
    )
}