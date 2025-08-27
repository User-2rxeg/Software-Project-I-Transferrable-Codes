// src/app/api/auth/me/route.ts
import {NextRequest, NextResponse} from "next/server";
import {serverTokenManager} from "../../../../lib/auth/tokenManager";
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3334';
export async function GET(request: NextRequest) {
    try {
        const { accessToken } = await serverTokenManager.getTokens();
        if (!accessToken) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const backendResponse = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
        });

        if (!backendResponse.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch user' },
                { status: backendResponse.status }
            );
        }

        const user = await backendResponse.json();
        return NextResponse.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}