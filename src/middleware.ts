// https://www.better-auth.com/docs/integrations/next#middleware

import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { auth } from "./lib/auth";
import { headers } from "next/headers";

export async function middleware(request: NextRequest) {
    const sessionCookie = getSessionCookie(request);
    console.log("middleware sessionCookie")
    console.log(sessionCookie)

    if (!sessionCookie) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/", "/dashboard", "/chat/:path*"], // Specify the routes the middleware applies to
    // matcher: ["/dashboard", "/:path*"], // Specify the routes the middleware applies to
};
