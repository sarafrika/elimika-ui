import { NextRequest, NextResponse } from "next/server";
import { auth, } from "../../../services/auth";

export async function POST(req: NextRequest) {
    console.log(req.url);

    const session = await auth();
    // console.log(session)

    if (!session) return new NextResponse("Unauthorized noma", { status: 401 });
    // update user session
    await fetch("/api/auth/signin/keycloak")

    return new NextResponse("success");
}