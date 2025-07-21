"use client"

import UserDataProvider from "@/context/data-context";
import StudentContextProvider from "@/context/student-context";
import { ReactNode } from "react";

export default function StudentLayout({ children }: { children: ReactNode }) {
    return (<>
        <StudentContextProvider>
            {children}
        </StudentContextProvider>
    </>);
}