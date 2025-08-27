// src/lib/api/apiClient.ts
import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import {sessionManager} from  './SessionM'
// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Important for cookies
});
// Request interceptor
apiClient.interceptors.request.use(
    (config) => {
// Add auth token if available
        const token = sessionManager.getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
// Log request in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
        }

        return config;
    },
    (error: AxiosError) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
    }
);
// Response interceptor
apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
// Log response in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.status);
        }
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as any;
// Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Try to refresh token
                const refreshToken = sessionManager.getRefreshToken();
                if (refreshToken) {
                    const response = await axios.post(
                        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/refresh`,
                        { refreshToken },
                        { withCredentials: true }
                    );

                    const { accessToken } = response.data;
                    sessionManager.setAccessToken(accessToken);

                    // Retry original request
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed, redirect to login
                sessionManager.clearSession();
                window.location.href = '/auth/login';
                return Promise.reject(refreshError);
            }
        }

// Handle other errors
        if (error.response?.status === 403) {
            console.error('[API] Forbidden - Insufficient permissions');
        } else if (error.response?.status === 404) {
            console.error('[API] Not Found');
        } else if (error.response?.status === 500) {
            console.error('[API] Internal Server Error');
        }

// Log error in development
        if (process.env.NODE_ENV === 'development') {
            console.error(
                `[API Error] ${error.config?.method?.toUpperCase() || 'UNKNOWN'} ${error.config?.url || 'UNKNOWN_URL'}`,
                error.response?.status,
                error.response?.data
            );
        }


        return Promise.reject(error);
    }
);
export { apiClient };
export default apiClient;