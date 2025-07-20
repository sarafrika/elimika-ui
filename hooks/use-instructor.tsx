import { useUser } from "@/context/user-context";
import { search } from "@/services/api/actions";
import { Instructor, User } from "@/services/api/schema";
import { useAppStore } from "@/store/app-store";
import { useState } from "react";



export default function useInstructor() {
    const user = useUser();
    const [instructor, setInstructor] = useState<Instructor | null>(null);
    /* return useAppStore("instructor", async () => {
        if (!user) return null;
        const results = await search("/api/v1/instructors/search", { user_uuid_eq: user.uuid });
        return results.length > 0 ? results[0] : null;
    }) as Instructor */

    return instructor;
};