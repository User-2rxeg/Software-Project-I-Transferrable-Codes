
// src/app/dashboard/page.tsx
'use client';import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {useAuth} from "@/Contexts/AuthContext";


export default function DashboardPage() {
    const router = useRouter();
    const { user, loading, isAuthenticated } = useAuth();useEffect(() => {
// Only redirect after loading is complete
        if (!loading) {
            if (!isAuthenticated || !user) {
// Not authenticated, redirect to login
                router.push('/auth/login');
            } else {
// Authenticated, redirect based on role
                switch (user.role) {
                    case 'student':
                        router.push('/dashboard/student');
                        break;
                    case 'instructor':
                        router.push('/dashboard/instructor');
                        break;
                    case 'admin':
                        router.push('/dashboard/admin');
                        break;
                    default:
// Fallback for unknown role
                        router.push('/courses');
                }
            }
        }
    }, [user, loading, isAuthenticated, router]);// Show loading while checking auth
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Redirecting to your dashboard...</p>
            </div>
        </div>
    );
}