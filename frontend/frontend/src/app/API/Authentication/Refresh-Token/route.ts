import {NextRequest, NextResponse} from "next/server";
import {serverTokenManager} from "../../../../../Services/TokenManager";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3334';
// src/app/api/auth/refresh/route.ts
export async function POST(request: NextRequest) {
    try {
        const {refreshToken} = await serverTokenManager.getTokens();
        if (!refreshToken) {
            return NextResponse.json(
                {error: 'No refresh token'},
                {status: 401}
            );
        }

        const backendResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({refreshToken}),
        });

        if (!backendResponse.ok) {
            const response = NextResponse.json(
                {error: 'Token refresh failed'},
                {status: 401}
            );
            serverTokenManager.clearTokens(response);
            return response;
        }

        const data = await backendResponse.json();

        const response = NextResponse.json({success: true});
        serverTokenManager.setTokens(response, {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
        });

        return response;
    } catch (error) {
        console.error('Refresh error:', error);
        return NextResponse.json(
            {error: 'Internal server error'},
            {status: 500}
        );
    }
}