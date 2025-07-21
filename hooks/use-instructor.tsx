import { useUser } from "@/context/user-context";
import { search } from "@/services/api/actions";
import { Instructor, User } from "@/services/api/schema";
import { useState } from "react";



export default function useInstructor() {
    const user = useUser();
    const [instructor, setInstructor] = useState<Instructor | null>(null);
    return instructor;
};