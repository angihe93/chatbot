"use client"

import { authClient } from "~/lib/auth-client"
import { Button } from "./ui/button"
import { useRouter } from "next/navigation"

export function Logout() {
    const router = useRouter()
    const handleLogout = async () => {
        await authClient.signOut()
        router.push("/login");
    }

    return (
        <Button onClick={handleLogout}>
            Logout
        </Button>
    )
}