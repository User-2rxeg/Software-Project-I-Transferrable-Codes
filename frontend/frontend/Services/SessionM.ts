// src/lib/auth/sessionManager.ts
interface SessionData {
    accessToken?: string;
    refreshToken?: string;
    tempToken?: string;
    pendingEmail?: string;
    user?: any;
}
class SessionManager {
    private readonly ACCESS_TOKEN_KEY = 'accessToken';
    private readonly REFRESH_TOKEN_KEY = 'refreshToken';
    private readonly TEMP_TOKEN_KEY = 'tempToken';
    private readonly PENDING_EMAIL_KEY = 'pendingEmail';
    private readonly USER_KEY = 'user';
// Access Token
    setAccessToken(token: string): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
        }
    }
    getAccessToken(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(this.ACCESS_TOKEN_KEY);
        }
        return null;
    }
    clearAccessToken(): void {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(this.ACCESS_TOKEN_KEY);
        }
    }
// Refresh Token
    setRefreshToken(token: string): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
        }
    }
    getRefreshToken(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(this.REFRESH_TOKEN_KEY);
        }
        return null;
    }
    clearRefreshToken(): void {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        }
    }
// Temp Token for MFA
    setTempToken(token: string): void {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem(this.TEMP_TOKEN_KEY, token);
        }
    }
    getTempToken(): string | null {
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem(this.TEMP_TOKEN_KEY);
        }
        return null;
    }
    clearTempToken(): void {
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem(this.TEMP_TOKEN_KEY);
        }
    }
// Pending Email for OTP
    setPendingEmail(email: string): void {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem(this.PENDING_EMAIL_KEY, email);
        }
    }
    getPendingEmail(): string | null {
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem(this.PENDING_EMAIL_KEY);
        }
        return null;
    }
    clearPendingEmail(): void {
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem(this.PENDING_EMAIL_KEY);
        }
    }
// User Data
    setUser(user: any): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        }
    }
    getUser(): any | null {
        if (typeof window !== 'undefined') {
            const userStr = localStorage.getItem(this.USER_KEY);
            if (userStr) {
                try {
                    return JSON.parse(userStr);
                } catch {
                    return null;
                }
            }
        }
        return null;
    }
    clearUser(): void {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(this.USER_KEY);
        }
    }
// Clear all session data
    clearSession(): void {
        this.clearAccessToken();
        this.clearRefreshToken();
        this.clearTempToken();
        this.clearPendingEmail();
        this.clearUser();
    }
// Check if authenticated
    isAuthenticated(): boolean {
        return !!this.getAccessToken();
    }
}
export const sessionManager = new SessionManager();