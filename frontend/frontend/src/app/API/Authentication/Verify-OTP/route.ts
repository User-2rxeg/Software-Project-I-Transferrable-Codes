// src/app/api/auth/verify-otp/route.ts
import {NextRequest, NextResponse} from "next/server";
import {serverTokenManager} from "../../../../../Services/TokenManager";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3334';
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const backendResponse = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const data = await backendResponse.json();

        if (!backendResponse.ok) {
            return NextResponse.json(
                { error: data.message || 'Verification failed' },
                { status: backendResponse.status }
            );
        }

// Set token in cookie after OTP verification
        const response = NextResponse.json({
            success: true,
            user: data.user,
        });

        if (data.token) {
            serverTokenManager.setTokens(response, {
                accessToken: data.token,
            });
        }

        return response;
    } catch (error) {
        console.error('OTP verification error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}