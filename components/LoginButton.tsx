'use client'
import React from 'react'
import { Button } from './ui/button'
import { signIn } from 'auth'

export default function LoginButton() {
    return (
        <Button
            onClick={async () => await signIn("keycloak")}
        >
            Sign In
        </Button>
    )
}