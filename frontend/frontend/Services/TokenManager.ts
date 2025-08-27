// src/lib/auth/tokenManager.ts
import { NextRequest, NextResponse } from 'next/server';
/**

 Token Manager for Next.js App Router
 Server-side utilities only - for use in API routes and server components
 */

interface TokenData {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
}
// Cookie configuration
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
};
const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';
/**

 Server-side token management (API routes only)
 */
export const serverTokenManager = {
// Get tokens from request cookies (API routes)
    getTokensFromRequest(request: NextRequest) {
        const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
        const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
        return { accessToken, refreshToken };
    },

// Set tokens in response cookies (API routes only)
    setTokens(response: NextResponse, tokens: TokenData) {
        const { accessToken, refreshToken } = tokens;
// Set access token cookie (1 hour)
        response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
            ...COOKIE_OPTIONS,
            maxAge: 60 * 60, // 1 hour
        });

// Set refresh token cookie if provided (7 days)
        if (refreshToken) {
            response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
                ...COOKIE_OPTIONS,
                maxAge: 60 * 60 * 24 * 7, // 7 days
            });
        }

        return response;
    },
// Clear tokens (logout)
    clearTokens(response: NextResponse) {
        response.cookies.delete(ACCESS_TOKEN_COOKIE);
        response.cookies.delete(REFRESH_TOKEN_COOKIE);
        return response;
    },
// Extract token from request headers or cookies
    getTokenFromRequest(request: NextRequest): string | null {
// First check Authorization header
        const authHeader = request.headers.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
// Then check cookies
        return request.cookies.get(ACCESS_TOKEN_COOKIE)?.value || null;
    }
};