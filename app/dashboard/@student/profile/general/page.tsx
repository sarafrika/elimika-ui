import { auth } from "@/services/auth";
import StudentProfileGeneralForm from "./_components/StudentProfileForm";
import { z } from "zod";
import { schemas } from "@/services/api/zod-client";
import { search } from "@/services/api/actions";

type StudentType = z.infer<typeof schemas.Student>;
type UserType = z.infer<typeof schemas.User>

export default async function StudentProfileGeneralPage() {
  const session = await auth();
  console.log(session?.user)
  const searchResult = await search("/api/v1/users/search", { email_eq: session!.user.email! }) as UserType[];
  const user = searchResult[0] as UserType;

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

}