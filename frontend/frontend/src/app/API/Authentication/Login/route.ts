// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {serverTokenManager} from "../../../../../Services/TokenManager";


const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3334';
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
// Call backend login endpoint
        const backendResponse = await fetch(`${BACKEND_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const data = await backendResponse.json();

        if (!backendResponse.ok) {
            return NextResponse.json(
                { error: data.message || 'Login failed' },
                { status: backendResponse.status }
            );
        }

// Handle MFA required case
        if (data.mfaRequired && data.tempToken) {
            return NextResponse.json({
                mfaRequired: true,
                tempToken: data.tempToken
            });
        }

// Successful login - set cookies
        const response = NextResponse.json({
            success: true,
            user: data.user,
        });

// Set tokens in httpOnly cookies
        serverTokenManager.setTokens(response, {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}