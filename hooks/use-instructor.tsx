import { search } from "@/services/api/actions";
import { Instructor, User } from "@/services/api/schema";
import { useAppStore } from "@/store/app-store";
import { useSession } from "next-auth/react";

export default function useInstructor(user: User | null) {
    return useAppStore("instructor", async () => {
        if (!user) return null;
        const results = await search("/api/v1/instructors/search", { user_uuid_eq: user.uuid });
        return results.length > 0 ? results[0] : null;
    }) as Instructor
};