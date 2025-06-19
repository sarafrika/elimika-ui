'use client'
import React from "react";
import { useRouter } from "next/navigation";

interface ErrorPageProps {
    message: string;
    details?: string;
    actionLabel?: string;
    onAction?: () => void;
}

export default function ErrorPage({ message, details, actionLabel = "Go Home", onAction }: ErrorPageProps) {
    const router = useRouter();
    const handleAction = () => {
        if (onAction) {
            onAction();
        } else {
            router.push("/");
        }
    };

    return (
        <main className="flex h-full w-full flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900" role="main" aria-label="Error page">
            <section className="flex flex-col items-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full">
                <div className="mb-4 animate-bounce text-5xl" aria-hidden="true">
                    <span role="img" aria-label="Error">❌</span>
                </div>
                <h2 className="mb-2 text-2xl font-extrabold text-gray-800 dark:text-gray-100">An Error Occurred</h2>
                <p className="text-gray-600 dark:text-gray-300 text-center mb-2">{message}</p>
                {details && (
                    <pre className="text-xs text-red-400 bg-red-50 dark:bg-gray-900 rounded p-2 mb-2 w-full overflow-x-auto" aria-label="Error details">{details}</pre>
                )}
                <button
                    onClick={handleAction}
                    className="mt-4 px-6 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold shadow transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                    autoFocus
                >
                    {actionLabel}
                </button>
            </section>
        </main>
    );
};


