
// src/app/dashboard/layout.tsx
'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

import {
    LayoutDashboard,
    BookOpen,
    GraduationCap,
    Users,
    BarChart3,
    Settings,
    LogOut,
    ChevronRight,
    Bell,
    Search,
    Menu,
    X,
    Calendar,
    MessageSquare,
    Award,
    HelpCircle,
    User
} from 'lucide-react';
import { useState } from 'react';
import {useAuth} from "@/Contexts/AuthContext";
export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout, loading } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login');
        }
    }, [user, loading, router]);
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }
    if (!user) return null;
    const navigation = {
        student: [
            { name: 'Dashboard', href: '/dashboard/student', icon: LayoutDashboard },
            { name: 'My Courses', href: '/courses', icon: BookOpen },
            { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
            { name: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
            { name: 'Achievements', href: '/dashboard/achievements', icon: Award },
            { name: 'Settings', href: '/dashboard/settings', icon: Settings },
        ],
        instructor: [
            { name: 'Dashboard', href: '/dashboard/instructor', icon: LayoutDashboard },
            { name: 'My Courses', href: '/dashboard/instructor/courses', icon: BookOpen },
            { name: 'Students', href: '/dashboard/instructor/students', icon: Users },
            { name: 'Analytics', href: '/dashboard/instructor/analytics', icon: BarChart3 },
            { name: 'Settings', href: '/dashboard/settings', icon: Settings },
        ],
        admin: [
            { name: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
            { name: 'Users', href: '/dashboard/admin/users', icon: Users },
            { name: 'Courses', href: '/dashboard/admin/courses', icon: BookOpen },
            { name: 'Analytics', href: '/dashboard/admin/analytics', icon: BarChart3 },
            { name: 'Settings', href: '/dashboard/admin/settings', icon: Settings },
        ],
    };
    const currentNavigation = navigation[user.role as keyof typeof navigation] || navigation.student;
    const handleLogout = async () => {
        await logout();
        router.push('/auth/login');
    };
    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar - Desktop */}
            <aside
                className={`${sidebarOpen ? 'w-64' : 'w-20'} hidden lg:flex flex-col fixed inset-y-0 z-50 bg-white border-r border-gray-200 transition-all duration-300`}
            >
                {/* Logo */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
                    <Link href="/dashboard" className="flex items-center">
                        <GraduationCap className="w-8 h-8 text-blue-600" />
                        {sidebarOpen && (
                            <span className="ml-2 text-xl font-bold text-gray-900">EduLearn</span>
                        )}
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-1 rounded-lg hover:bg-gray-100"
                    >
                        <Menu className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
                {/* Navigation */}
                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                    {currentNavigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                                    isActive
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                {sidebarOpen && <span className="ml-3">{item.name}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-gray-200">
                    <div className={`flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
                        {sidebarOpen && (
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                    {user.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={handleLogout}
                            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Sidebar */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileMenuOpen(false)} />
                    <nav className="fixed top-0 left-0 bottom-0 flex flex-col w-64 bg-white">
                        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
                            <Link href="/dashboard" className="flex items-center">
                                <GraduationCap className="w-8 h-8 text-blue-600" />
                                <span className="ml-2 text-xl font-bold text-gray-900">EduLearn</span>
                            </Link>
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="p-1 rounded-lg hover:bg-gray-100"
                            >
                                <X className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>

                        <div className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                            {currentNavigation.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                                            isActive
                                                ? 'bg-blue-50 text-blue-600'
                                                : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        <span className="ml-3">{item.name}</span>
                                    </Link>
                                );
                            })}
                        </div>

                        <div className="p-4 border-t border-gray-200">
                            <button
                                onClick={handleLogout}
                                className="flex items-center w-full px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="ml-3">Logout</span>
                            </button>
                        </div>
                    </nav>
                </div>
            )}

            {/* Main Content */}
            <div className={`flex-1 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} transition-all duration-300`}>
                {/* Top Bar - Mobile */}
                <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-200">
                    <div className="flex items-center justify-between h-16 px-4">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="p-2 rounded-lg hover:bg-gray-100"
                        >
                            <Menu className="w-5 h-5 text-gray-600" />
                        </button>
                        <Link href="/dashboard" className="flex items-center">
                            <GraduationCap className="w-8 h-8 text-blue-600" />
                            <span className="ml-2 text-xl font-bold text-gray-900">EduLearn</span>
                        </Link>
                        <button className="p-2 rounded-lg hover:bg-gray-100">
                            <Bell className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
}