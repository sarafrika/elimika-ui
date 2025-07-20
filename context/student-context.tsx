import { StudentStoreType, useStudentStore } from "@/store/student-store";
import { createContext, ReactNode, useEffect } from "react";

export const StudentContext = createContext<StudentStoreType | null>(null)
export default function StudentContextProvider({children}:{children:ReactNode}){
    const studentStore = useStudentStore();
    useEffect(()=>{
        if(!studentStore.student){
            studentStore.getStudent();
        }
    }, [])
    return (<StudentContext.Provider value={studentStore}>
        {children}
    </StudentContext.Provider>);
}