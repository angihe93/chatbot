import { createAuthClient } from "better-auth/react"
export const authClient = createAuthClient({
    /** The base URL of the server (optional if you're using the same domain) */
    // baseURL: "http://localhost:3000"
})

// https://www.better-auth.com/docs/installation#create-client-instance
// Tip: You can also export specific methods if you prefer:
// export const { signIn, signUp, useSession } = createAuthClient()