import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../services/auth";
import { getInstructorEducation, getInstructorExperience, getInstructorMemberships, getInstructorSkills, Instructor, InstructorEducation, InstructorExperience, InstructorProfessionalMembership, InstructorSkill, Organisation, searchInstructors, SearchResponse, searchStudents, Student, User } from "../../../services/client";
import { getUserByEmail } from "../../../services/user/actions";

type InstructorProfileType = Instructor & {
    educations: InstructorEducation[],
    experience: InstructorExperience[],
    membership: InstructorProfessionalMembership[],
    skills: InstructorSkill[]
}

type UserProfileType = User & {
    student?: Student,
    instructor?: InstructorProfileType
    organization?: Organisation
}

export async function GET(request: NextRequest) {
    const session = await auth();

    if (!session || !session.user) {
        return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    const userResp = await getUserByEmail(session.user.email);
    if (!userResp) {
        return new NextResponse(JSON.stringify({ error: "User not found" }), { status: 404 })
    }

    const user = {
        ...userResp,
        ...session.user,
        dob: new Date(userResp.dob ?? Date.now())
    } as UserProfileType;

    if (user.user_domain && user.user_domain.length > 0) {
        // Add student data in profile
        if (user.user_domain.includes("student")) {
            const searchResponse = await searchStudents({
                query: {
                    searchParams: {
                        user_uuid_eq: user.uuid
                    }
                }
            });

            const respData = searchResponse.data as SearchResponse;

            if (
                !respData.error &&
                respData.data!.content &&
                respData.data!.content.length > 0
            ) {
                user.student = respData.data!.content[0] as unknown as Student;
            }
        }

        // Include Instructor data in profile
        if (user.user_domain.includes("instructor")) {
            const instructorSearchResponse = await searchInstructors({
                query: {
                    searchParams: {
                        user_uuid_eq: user.uuid
                    }
                }
            });
            const responseData = instructorSearchResponse.data as SearchResponse;

            if (
                !responseData.error &&
                responseData.data &&
                responseData.data.content &&
                responseData.data.content.length > 0
            ) {
                user.instructor = responseData.data.content[0] as unknown as InstructorProfileType;

                // Add instructor education
                const instructorEducation = await getInstructorEducation({
                    path: {
                        instructorUuid: user.instructor.uuid!
                    }
                });

                if (
                    !instructorEducation.error &&
                    instructorEducation.data &&
                    instructorEducation.data.data
                ) {
                    user.instructor.educations = instructorEducation.data.data as unknown as InstructorEducation[]
                }

                // Add instructor experience
                const instructorExperience = await getInstructorExperience({
                    path: {
                        instructorUuid: user.instructor.uuid!
                    }
                });

                const expResp = instructorExperience.data as SearchResponse

                if (
                    !expResp.error &&
                    expResp.data &&
                    expResp.data.content
                ) {
                    user.instructor.experience = expResp.data.content as unknown as InstructorExperience[]
                }

                // Add instructor experience
                const instructorMembership = await getInstructorMemberships({
                    path: {
                        instructorUuid: user.instructor.uuid!
                    }
                });

                const memResp = instructorMembership.data as SearchResponse;

                if (
                    !memResp.error &&
                    memResp.data &&
                    memResp.data.content
                ) {
                    user.instructor.membership = memResp.data.content as unknown as InstructorProfessionalMembership[]
                }

                // Add instructor skills
                const instructorSkills = await getInstructorSkills({
                    path: {
                        instructorUuid: user.instructor.uuid!
                    }
                });

                const skillsResp = instructorSkills.data as SearchResponse;

                if (
                    !skillsResp.error &&
                    skillsResp.data &&
                    skillsResp.data.content
                ) {
                    user.instructor.skills = skillsResp.data.content as unknown as InstructorSkill[]
                }
            }
        }


        // TODO: Add organisation data in profile
    }

    return new NextResponse(JSON.stringify(user))
}