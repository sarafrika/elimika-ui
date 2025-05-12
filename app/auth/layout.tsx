'use client'
import { CustomIcon } from "@/components/CustomIcon"

type AuthLayoutProps = {
    children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="flex min-h-screen">
            {/* Left side with illustration */}
            <div className="hidden w-1/2 bg-muted lg:flex lg:items-center lg:justify-center">
                <div className="relative h-96 w-96">
                    <CustomIcon type="signupIllustration" className="w-full h-full" size={300} />
                </div>
            </div>

            {/* Right side with form */}
            <div className="flex w-full flex-col items-center justify-center px-4 py-12 lg:w-1/2 lg:px-12">
                <div className="mx-auto w-full max-w-md space-y-8">
                    {children}
                </div>
            </div>
        </div>
    )
} 