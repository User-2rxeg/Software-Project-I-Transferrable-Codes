// src/lib/api/apiClient.ts
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555';
/**

 API Client for Backend Communication
 Uses cookies for authentication (httpOnly cookies set by API routes)
 */
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Always send cookies
});

// Request interceptor - No need to add token from localStorage
// Request interceptor - No need to add token from localStorage
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        // For server-side requests, we need to forward cookies
        if (typeof window === 'undefined') {
            try {
                // Server-side: get cookies from Next.js
                const { cookies } = await import('next/headers');
                const cookieStore = await cookies(); // Add await here
                const accessToken = cookieStore.get('access_token')?.value;
                if (accessToken && config.headers) {
                    config.headers.Authorization = `Bearer ${accessToken}`;
                }
            } catch (error) {
                // Handle the case where we're in an environment that doesn't support cookies()
                console.warn('Could not access cookies from next/headers:', error);
            }
        }
        // Client-side: cookies are automatically sent with withCredentials: true
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);
// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
// Handle 401 errors (token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Try to refresh token using Next.js API route
                const refreshResponse = await fetch('/api/auth/refresh', {
                    method: 'POST',
                    credentials: 'include',
                });

                if (refreshResponse.ok) {
                    // Retry the original request
                    return apiClient(originalRequest);
                } else {
                    // Refresh failed, redirect to login
                    if (typeof window !== 'undefined') {
                        window.location.href = '../../app/api/auth/login';
                    }
                    return Promise.reject(error);
                }
            } catch (refreshError) {
                // Refresh failed
                if (typeof window !== 'undefined') {
                    window.location.href = '../../app/api/auth/login';
                }
                return Promise.reject(refreshError);
            }
        }

// Handle other error status codes
        if (error.response?.status === 403) {
            console.error('Permission denied');
        } else if (error.response?.status === 404) {
            console.error('Resource not found');
        } else if (error.response?.status === 500) {
            console.error('Server error');
        } else if (error.message === 'Network Error') {
            console.error('Network error - please check your connection');
        }

        return Promise.reject(error);
    }
);
export default apiClient;
/**

 Helper function for handling API errors
 */
export const handleApiError = (error: any): string => {
    if (error.response?.data?.message) {
        return error.response.data.message;
    }
    if (error.message) {
        return error.message;
    }
    return 'An unexpected error occurred';
};

/**

 Auth-specific API calls
 These use the Next.js API routes instead of calling backend directly
 */



/**
 * Auth-specific API calls
 * These use the Next.js API routes instead of calling backend directly
 */
export const authAPI = {
    login: async (email: string, password: string) => {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include',
        });
        return response.json();
    },

    register: async (data: any) => {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return response.json();
    },

    verifyOTP: async (email: string, otp: string) => {
        const response = await fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp }),
            credentials: 'include',
        });
        return response.json();
    },

    logout: async () => {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
        });
        return response.json();
    },

    getCurrentUser: async () => {
        const response = await fetch('/api/auth/me', {
            credentials: 'include',
        });
        if (!response.ok) throw new Error('Not authenticated');
        return response.json();
    },
};

