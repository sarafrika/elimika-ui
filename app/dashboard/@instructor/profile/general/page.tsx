"use client"
import { search } from "@/services/api/actions";
import { components, Instructor, User } from "@/services/api/schema";
import { schemas } from "@/services/api/zod-client";
import { auth } from "@/services/auth";
import { z } from "zod";
import InstructorProfile from "./_component/InstructorProfile";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Spinner from "@/components/ui/spinner";
import { useAppStore } from "@/store/app-store";
import useInstructor from "@/hooks/use-instructor";

type UserType = z.infer<typeof schemas.User>
type InstructorType = components["schemas"]["Instructor"]

export default function InstructorProfilePage() {
  const session = useSession();

  const user = session.data ? session.data.user as User : null;
  const instructor = useInstructor(user);

  return (<>
    {user && instructor ? <InstructorProfile {...{ user, instructor }} /> : <Spinner />}
  </>);
}