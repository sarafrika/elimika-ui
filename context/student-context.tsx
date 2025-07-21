import { StudentStoreType, useStudentStore } from "@/store/student-store";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useUser } from "./user-context";
import { search } from "@/services/api/actions";
import { Student } from "@/services/api/schema";

const StudentContext = createContext<Student | null>(null)
export default function StudentContextProvider({ children }: { children: ReactNode }) {
    const user = useUser();
    const [student, setStudent] = useState(null);
    useEffect(() => {
        if (user) {
            search("/api/v1/students/search", { user_uuid_eq: user?.uuid })
                .then(result => {
                    if (result.length > 0) {
                        setStudent(result[0]);
                    }
                })
        }
    }, [user]);
    return (<StudentContext.Provider value={student}>
        {children}
    </StudentContext.Provider>);
}

export function useStudent(){
    return useContext(StudentContext);
}