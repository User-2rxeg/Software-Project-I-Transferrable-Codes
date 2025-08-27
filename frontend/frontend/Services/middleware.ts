// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// Define public routes that don't require authentication
const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/register',
    '/auth/verify-otp',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/mfa-verify',
    '/auth/mfa-setup',
];
// Define role-based route access
const roleBasedRoutes = {
    admin: ['/dashboard/admin'],
    instructor: ['/dashboard/instructor', '/courses/create'],
    student: ['/dashboard/student', '/courses/[id]/learn'],
};
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
// Check if it's a public route
    const isPublicRoute = publicRoutes.some(route =>
        pathname === route || pathname.startsWith(`${route}/`)
    );
// Get the access token from cookies
    const accessToken = request.cookies.get('access_token')?.value;
// If no token and trying to access protected route, redirect to login
    if (!accessToken && !isPublicRoute) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
    }
// If has token and trying to access auth pages (except MFA setup), redirect to dashboard
    if (accessToken && pathname.startsWith('/auth/') &&
        !pathname.includes('mfa-setup') &&
        !pathname.includes('profile-setup')) {
// Parse JWT to get user role (basic parsing, not verification)
        try {
            const payload = JSON.parse(
                Buffer.from(accessToken.split('.')[1], 'base64').toString()
            );

            const dashboardUrl = new URL(`/dashboard/${payload.role}`, request.url);
            return NextResponse.redirect(dashboardUrl);
        } catch {
            // If can't parse token, just continue
        }
    }
// Check role-based access
    if (accessToken) {
        try {
            const payload = JSON.parse(
                Buffer.from(accessToken.split('.')[1], 'base64').toString()
            );
            const userRole = payload.role;

            // Check if user is trying to access another role's dashboard
            if (pathname.startsWith('/dashboard/')) {
                const requestedRole = pathname.split('/')[2];
                if (requestedRole && requestedRole !== userRole) {
                    const correctDashboard = new URL(`/dashboard/${userRole}`, request.url);
                    return NextResponse.redirect(correctDashboard);
                }
            }
        } catch {
            // Token parsing failed, let the API handle it
        }
    }
    return NextResponse.next();
}
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - static (static files)
         * - _next (Next.js internals)
         * - favicon.ico (favicon file)
         */
        '/((?!api|static|_next|favicon.ico).*)',
    ],
};

//CHECK CLAUDE FOR COMPLETE IMPLEMENTATION