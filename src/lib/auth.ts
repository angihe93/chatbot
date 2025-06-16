import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "~/server/db"
import { nextCookies } from "better-auth/next-js"
import { schema } from "~/server/db/schema"

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET)
    throw new Error("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not set. Set them to use Google social sign-in in better auth")

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET
if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET)
    throw new Error("GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET is not set. Set them to use Github social sign-in in better auth")


export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema,
    }),
    emailAndPassword: {
        enabled: true
    },
    socialProviders: {
        google: {
            clientId: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
        },
        github: {
            clientId: GITHUB_CLIENT_ID,
            clientSecret: GITHUB_CLIENT_SECRET,
        },
    },
    trustedOrigins: ["http://localhost:3000", "https://chatbot-ii0sklmw4-angi09387-gmailcoms-projects.vercel.app"],

    // the nextCookies plugin will automatically set cookies for you whenever a Set-Cookie header is present in the response
    plugins: [nextCookies()] // make sure this is the last plugin in the array
})
