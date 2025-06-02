'use client'
import React from 'react'
import { Button } from './ui/button'
import { signIn } from 'next-auth/react'

export default function LoginButton() {
    return (
        <Button
            onClick={async () => await signIn("keycloak")}
        >
            Sign In
        </Button>
    )
}