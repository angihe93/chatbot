"use server";
import { auth } from "~/lib/auth"

export const signIn = async (email: string, password: string) => {
    try {
        await auth.api.signInEmail({
            body: {
                email,
                password
            }
        })
        console.log("signed in")
        return {
            success: true,
            message: "Signed in successfully"
        }
    }
    catch (error) {
        const e = error as Error
        console.log("Error signing in", error)
        return {
            success: false,
            message: e.message || "an unknown error occurred"
        }
    }
}

export const signUp = async (name: string, email: string, password: string) => {
    try {
        console.log(name, email, password)
        await auth.api.signUpEmail({
            body: {
                email,
                password,
                name
            }
        })
        console.log("signed up")
        return {
            success: true,
            message: "Signed up successfully"
        }
    }
    catch (error) {
        const e = error as Error
        console.log("Error signing up", error)
        return {
            success: false,
            message: e.message || "an unknown error occurred"
        }
    }
}