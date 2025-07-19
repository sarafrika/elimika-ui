"use client"

import StudentProfileGeneralForm from "./_components/StudentProfileForm";
import { search } from "@/services/api/actions";
import { useSession } from "next-auth/react";
import { Student, User } from "@/services/api/schema";
import Spinner from "@/components/ui/spinner";
import { useAppStore } from "@/store/app-store";
import { useEffect, useState } from "react";

export default function StudentProfileGeneralPage() {
  const { data } = useSession();
  const user = data ? data.user : null;
  const student = useAppStore("student", async () => {
    const results = await search("/api/v1/students/search", { user_uuid_eq: user!.uuid });
    return results.length > 0 ? results[0] : null;
  }) as Student;

  return (<>
    {
      user ?
        <StudentProfileGeneralForm user={user as User} {...(student ? { student } : {})} /> :
        <Spinner />
    }
  </>);

}

/* export default async function StudentProfileGeneralPage() {
  const session = await auth();

  const user = session!.user as any as UserType;

  let profilePicBlob;
  if (user && user.profile_image_url) {
    const imageResp = await fetch("http://api.elimika.sarafrika.com/api/v1/users/profile-image/63c6ad60-9d27-4b58-8019-f13a7aed13db", {
      headers: { Authorization: `Bearer ${session?.user.accessToken}` }
    });
    profilePicBlob = await imageResp.blob();
    console.log("imageBlob", profilePicBlob);
  }

  const studentResult = await search("/api/v1/students/search", { user_uuid_eq: user?.uuid! }) as StudentType[];
  let student = studentResult[0] ?? null;

  return (<>
    <StudentProfileGeneralForm {...{
      user,
      ...(student ? { student } : {}),
      ...(profilePicBlob ? { profilePicBlob } : {})
    }} />
  </>);

} */