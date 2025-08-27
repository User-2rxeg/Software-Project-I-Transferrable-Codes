// src/app/api/auth/logout/route.ts
import {NextRequest, NextResponse} from "next/server";
import {serverTokenManager} from "../../../../../Services/TokenManager";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3334';
export async function POST(request: NextRequest) {
    try {
        const { accessToken } = await serverTokenManager.getTokens();
        if (accessToken) {
            // Call backend logout to blacklist token
            await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
            });
        }

// Clear cookies
        const response = NextResponse.json({ success: true });
        serverTokenManager.clearTokens(response);

        return response;
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { error: 'Logout failed' },
            { status: 500 }
        );
    }
}