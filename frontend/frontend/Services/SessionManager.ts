// src/lib/auth/sessionManager.ts
/**

 Session storage utilities for client-side only
 Used for temporary data like MFA tokens and pending emails
 */
export const sessionManager = {
    setTempToken(token: string) {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('mfa_temp_token', token);
        }
    },

    getTempToken(): string | null {
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem('mfa_temp_token');
        }
        return null;
    },
    clearTempToken() {
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('mfa_temp_token');
        }
    },
    setPendingEmail(email: string) {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('pending_email', email);
        }
    },
    getPendingEmail(): string | null {
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem('pending_email');
        }
        return null;
    },
    clearPendingEmail() {
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('pending_email');
        }
    },
    setResetEmail(email: string) {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('reset_email', email);
        }
    },
    getResetEmail(): string | null {
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem('reset_email');
        }
        return null;
    },
    clearResetEmail() {
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('reset_email');
        }
    }
};
