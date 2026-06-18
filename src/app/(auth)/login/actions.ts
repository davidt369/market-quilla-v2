"use server"

import { getRateLimitStatus } from "@/shared/lib/auth"

export async function checkLoginStatusAction() {
    return await getRateLimitStatus();
}
