// src/contexts/AuthContext.tsx
'use client';
import  { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {sessionManager} from "../../Services/SessionM";
//import {sessionManager} from "../lib/auth/sessionManager";



// User type based on your backend
export interface User {
    _id: string;
    id?: string;
    email: string;
    name: string;
    role: 'student' | 'instructor' | 'admin';
    profileImage?: string;
    isEmailVerified: boolean;
    mfaEnabled?: boolean;
    profileComplete?: boolean;
    enrolledCourses?: string[];
    teachingCourses?: string[];
}
interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    isAuthenticated: boolean;
// Auth methods
    login: (email: string, password: string) => Promise<LoginResult>;
    register: (data: RegisterData) => Promise<RegisterResult>;
    verifyOTP: (email: string, otp: string) => Promise<VerifyResult>;
    verifyMFA: (tempToken: string, code: string) => Promise<MFAResult>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
// Password reset
    forgotPassword: (email: string) => Promise<void>;
    resetPassword: (email: string, otp: string, newPassword: string) => Promise<void>;
    resendOTP: (email: string) => Promise<void>;
}
interface LoginResult {
    success: boolean;
    mfaRequired?: boolean;
    tempToken?: string;
    user?: User;
    error?: string;
}
interface RegisterData {
    name: string;
    email: string;
    password: string;
    role: string;
}
interface RegisterResult {
    success: boolean;
    message?: string;
    userId?: string;
    error?: string;
}
interface VerifyResult {
    success: boolean;
    user?: User;
    error?: string;
}
interface MFAResult {
    success: boolean;
    user?: User;
    error?: string;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
// Public routes that don't require authentication
const PUBLIC_ROUTES = [
    '/auth/login',
    '/auth/register',
    '/auth/verify-otp',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/mfa-verify',
    '/',
];
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();
// Check authentication status on mount and route changes
    const checkAuth = useCallback(async () => {
        try {
// First check if we have a token
            const token = sessionManager.getAccessToken();
            if (!token && !PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
                router.push('/auth/login');
                setLoading(false);
                return;
            }
            const response = await fetch('/api/auth/me', {
                credentials: 'include',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            });

            if (response.ok) {
                const userData = await response.json();
                // Fix: Ensure user has id field
                const userWithId = {
                    ...userData,
                    id: userData.id || userData._id
                };
                setUser(userWithId);
                setError(null);
            } else {
                setUser(null);
                sessionManager.clearSession();

                if (!PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
                    router.push('/auth/login');
                }
            }
        } catch (err) {
            console.error('Auth check failed:', err);
            setUser(null);
            setError('Failed to verify authentication');
        } finally {
            setLoading(false);
        }
    }, [pathname, router]);

// src/contexts/AuthContext.tsx - Update the login and verifyOTP methods
// In the login method, after successful login:
    const login = async (email: string, password: string): Promise<LoginResult> => {
        try {
            setError(null);
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                credentials: 'include',
            });
            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: data.error || 'Login failed'
                };
            }

            if (data.mfaRequired) {
                sessionManager.setTempToken(data.tempToken);
                return {
                    success: true,
                    mfaRequired: true,
                    tempToken: data.tempToken,
                };
            }

            // Fix: Ensure user has id field
            const userData = {
                ...data.user,
                id: data.user.id || data.user._id  // Ensure id is always available
            };

            setUser(userData);
            sessionManager.setUser(userData);

            // Store tokens if provided
            if (data.accessToken) {
                sessionManager.setAccessToken(data.accessToken);
            }
            if (data.refreshToken) {
                sessionManager.setRefreshToken(data.refreshToken);
            }

            return {
                success: true,
                user: userData,
            };
        } catch (err) {
            const errorMessage = 'Network error. Please try again.';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };
// Register method
    const register = async (data: RegisterData): Promise<RegisterResult> => {
        try {
            setError(null);
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });


            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: result.error || 'Registration failed',
                };
            }

            // Store email for OTP verification
            sessionManager.setPendingEmail(data.email);

            return {
                success: true,
                message: result.message,
                userId: result.userId,
            };
        } catch (err) {
            const errorMessage = 'Network error. Please try again.';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };
// Similar fix for verifyOTP:
    const verifyOTP = async (email: string, otp: string): Promise<VerifyResult> => {
        try {
            setError(null);
            const response = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
                credentials: 'include',
            });
            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: data.error || 'Verification failed',
                };
            }

            sessionManager.clearPendingEmail();

            // Fix: Ensure user has id field
            const userData = {
                ...data.user,
                id: data.user.id || data.user._id
            };

            setUser(userData);
            sessionManager.setUser(userData);

            // Store tokens if provided
            if (data.accessToken) {
                sessionManager.setAccessToken(data.accessToken);
            }
            if (data.refreshToken) {
                sessionManager.setRefreshToken(data.refreshToken);
            }

            return {
                success: true,
                user: userData,
            };
        } catch (err) {
            const errorMessage = 'Network error. Please try again.';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };
// Verify MFA
    const verifyMFA = async (tempToken: string, code: string): Promise<MFAResult> => {
        try {
            setError(null);
            const response = await fetch('/api/auth/mfa/verify-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tempToken, token: code }),
                credentials: 'include',
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: data.error || 'MFA verification failed',
                };
            }

            // Clear temp token
            sessionManager.clearTempToken();

            // Set user
            setUser(data.user);

            return {
                success: true,
                user: data.user,
            };
        } catch (err) {
            const errorMessage = 'Network error. Please try again.';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };
// Logout
    const logout = async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            setUser(null);
            sessionManager.clearTempToken();
            sessionManager.clearPendingEmail();
            router.push('/auth/login');
        }
    };
// Refresh user data
    const refreshUser = async () => {
        await checkAuth();
    };
// Forgot password
    const forgotPassword = async (email: string) => {
        const response = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to send reset code');
        }
    };
// Reset password
    const resetPassword = async (email: string, otp: string, newPassword: string) => {
        const response = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otpCode: otp, newPassword }),
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to reset password');
        }
    };
// Resend OTP
    const resendOTP = async (email: string) => {
        const response = await fetch('/api/auth/resend-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to resend OTP');
        }
    };
    const value: AuthContextType = {
        user,
        loading,
        error,
        isAuthenticated: !!user,
        login,
        register,
        verifyOTP,
        verifyMFA,
        logout,
        refreshUser,
        forgotPassword,
        resetPassword,
        resendOTP,
    };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
// Custom hook to use auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
// HOC for protected routes
export function withAuth<P extends object>(
    Component: React.ComponentType<P>,
    allowedRoles?: string[]
) {
    return function ProtectedComponent(props: P) {
        const { user, loading, isAuthenticated } = useAuth();
        const router = useRouter();
        useEffect(() => {
            if (!loading) {
                if (!isAuthenticated) {
                    router.push('/auth/login');
                } else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
                    router.push('/unauthorized');
                }
            }
        }, [loading, isAuthenticated, user, router]);

        if (loading) {
            return (
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            );
        }

        if (!isAuthenticated) {
            return null;
        }

        if (allowedRoles && user && !allowedRoles.includes(user.role)) {
            return null;
        }

        return <Component {...props} />;
    };
}
