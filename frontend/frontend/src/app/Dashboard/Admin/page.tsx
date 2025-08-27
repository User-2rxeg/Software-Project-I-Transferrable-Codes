// src/app/dashboard/admin/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { adminService } from '../../../lib/services/adminApi';
import {
    Users,
    BookOpen,
    Shield,
    Database,
    Activity,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Archive,
    Send,
    Download,
    Upload,
    Trash2,
    Edit,
    Eye,
    RefreshCw,
    HardDrive,
    Clock,
    Bell,
    Server,
    Lock,
    Unlock,
    UserCheck,
    UserX,
    FileText,
    Settings,
    ChevronRight,
    Search,
    Filter,
    MoreVertical,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    Mail,
    MessageSquare
} from 'lucide-react';
interface DashboardStats {
    totalUsers: number;
    totalCourses: number;
    activeUsers: number;
    pendingCourses: number;
    totalEnrollments: number;
    systemHealth: 'healthy' | 'warning' | 'critical';
    lastBackup: string;
    failedLogins: number;
}
export default function AdminDashboard() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [backups, setBackups] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'courses' | 'security' | 'system'>('overview');
// Filters and search
    const [userSearch, setUserSearch] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState('');
    const [courseStatusFilter, setCourseStatusFilter] = useState('');
// Modals
    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
    const [announcementType, setAnnouncementType] = useState<'all' | 'role' | 'course'>('all');
    const [announcementMessage, setAnnouncementMessage] = useState('');
    const [selectedRole, setSelectedRole] = useState('student');
    const [selectedCourse, setSelectedCourse] = useState('');
    useEffect(() => {
        if (user?.role !== 'admin') {
            router.push('/dashboard');
            return;
        }
        fetchDashboardData();
    }, [user, router]);
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            // Fetch all data in parallel
            const [
                usersData,
                coursesData,
                backupsData,
                auditData,
                failedLoginsData
            ] = await Promise.all([
                adminService.listUsers({ page: 1, limit: 100 }),
                adminService.listCourses({ page: 1, limit: 100 }),
                adminService.listBackups(1, 10),
                adminService.getAuditLogs({ page: 1, limit: 20 }),
                adminService.getFailedLogins(1, 10)
            ]);

            setUsers(usersData.items || []);
            setCourses(coursesData.items || []);
            setBackups(backupsData.items || []);
            setAuditLogs(auditData.items || []);

            // Calculate stats
            const dashboardStats: DashboardStats = {
                totalUsers: usersData.total || 0,
                totalCourses: coursesData.total || 0,
                activeUsers: usersData.items?.filter((u: any) => u.isEmailVerified).length || 0,
                pendingCourses: coursesData.items?.filter((c: any) => c.status === 'draft').length || 0,
                totalEnrollments: coursesData.items?.reduce((sum: number, c: any) =>
                    sum + (c.studentsEnrolled?.length || 0), 0) || 0,
                systemHealth: failedLoginsData.total > 10 ? 'warning' : 'healthy',
                lastBackup: backupsData.items?.[0]?.backupDate || 'Never',
                failedLogins: failedLoginsData.total || 0
            };

            setStats(dashboardStats);

        } catch (error) {
            console.error('Error fetching admin dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };
    const handleUserRoleChange = async (userId: string, newRole: string) => {
        try {
            await adminService.updateUserRole(userId, newRole);
            alert('User role updated successfully');
            await fetchDashboardData();
        } catch (error) {
            console.error('Error updating user role:', error);
            alert('Failed to update user role');
        }
    };
    const handleCourseStatusChange = async (courseId: string, newStatus: 'active' | 'draft' | 'archived') => {
        try {
            await adminService.updateCourseStatus(courseId, newStatus);
            alert(`Course ${newStatus === 'active' ? 'approved' : newStatus} successfully`);
            await fetchDashboardData();
        } catch (error) {
            console.error('Error updating course status:', error);
            alert('Failed to update course status');
        }
    };
    const handleRunBackup = async (dataType: 'users' | 'courses' | 'performances' | 'all') => {
        try {
            const result = await adminService.runBackup(dataType);
            alert(`Backup completed successfully: ${result.results?.length || 0} items backed up`);
            await fetchDashboardData();
        } catch (error) {
            console.error('Error running backup:', error);
            alert('Failed to run backup');
        }
    };
    const handleSendAnnouncement = async () => {
        try {
            if (!announcementMessage.trim()) {
                alert('Please enter a message');
                return;
            }
            if (announcementType === 'all') {
                await adminService.announceToAll(announcementMessage);
            } else if (announcementType === 'role') {
                await adminService.announceToRole(selectedRole, announcementMessage);
            } else if (announcementType === 'course' && selectedCourse) {
                await adminService.announceToCourse(selectedCourse, announcementMessage);
            }

            alert('Announcement sent successfully');
            setShowAnnouncementModal(false);
            setAnnouncementMessage('');
        } catch (error) {
            console.error('Error sending announcement:', error);
            alert('Failed to send announcement');
        }
    };
    const handleDeleteCourse = async (courseId: string) => {
        if (confirm('Are you sure you want to permanently delete this course? This action cannot be undone.')) {
            try {
                await adminService.deleteCourse(courseId);
                alert('Course deleted successfully');
                await fetchDashboardData();
            } catch (error) {
                console.error('Error deleting course:', error);
                alert('Failed to delete course');
            }
        }
    };
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
                </div>
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <Shield className="w-6 h-6 text-red-600 mr-2" />
                            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setShowAnnouncementModal(true)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
                            >
                                <Send className="w-4 h-4 mr-2" />
                                Send Announcement
                            </button>
                            <div className="flex items-center space-x-3">
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                                    <p className="text-xs text-gray-500">Administrator</p>
                                </div>
                                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center text-white font-bold">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Users</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalUsers || 0}</p>
                                <p className="text-xs text-gray-500 mt-2">
                                    {stats?.activeUsers || 0} verified
                                </p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Courses</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalCourses || 0}</p>
                                <p className="text-xs text-orange-600 mt-2">
                                    {stats?.pendingCourses || 0} pending approval
                                </p>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-lg">
                                <BookOpen className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">System Health</p>
                                <p className="text-lg font-bold text-gray-900 mt-1 capitalize">
                                    {stats?.systemHealth || 'Unknown'}
                                </p>
                                <p className="text-xs text-red-600 mt-2">
                                    {stats?.failedLogins || 0} failed logins
                                </p>
                            </div>
                            <div className={`p-3 rounded-lg ${
                                stats?.systemHealth === 'healthy' ? 'bg-green-50' :
                                    stats?.systemHealth === 'warning' ? 'bg-yellow-50' : 'bg-red-50'
                            }`}>
                                <Activity className={`w-6 h-6 ${
                                    stats?.systemHealth === 'healthy' ? 'text-green-600' :
                                        stats?.systemHealth === 'warning' ? 'text-yellow-600' : 'text-red-600'
                                }`} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Last Backup</p>
                                <p className="text-sm font-medium text-gray-900 mt-1">
                                    {stats?.lastBackup ? formatDate(stats.lastBackup) : 'Never'}
                                </p>
                                <button
                                    onClick={() => handleRunBackup('all')}
                                    className="text-xs text-blue-600 hover:text-blue-700 mt-2"
                                >
                                    Run backup now →
                                </button>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <Database className="w-6 h-6 text-gray-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
                    {(['overview', 'users', 'courses', 'security', 'system'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-md font-medium text-sm transition-all capitalize ${
                                activeTab === tab
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Recent Activity */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent System Activity</h3>
                            <div className="space-y-3">
                                {auditLogs.slice(0, 5).map((log) => (
                                    <div key={log._id} className="flex items-start space-x-3">
                                        <div className="p-2 bg-gray-50 rounded-lg">
                                            <Activity className="w-4 h-4 text-gray-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{log.event}</p>
                                            <p className="text-xs text-gray-500">{formatDate(log.timestamp)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pending Approvals */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Course Approvals</h3>
                            <div className="space-y-3">
                                {courses.filter(c => c.status === 'draft').slice(0, 5).map((course) => (
                                    <div key={course._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{course.title}</p>
                                            <p className="text-xs text-gray-500">Submitted {formatDate(course.createdAt)}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleCourseStatusChange(course._id, 'active')}
                                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleCourseStatusChange(course._id, 'archived')}
                                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                />
                                <select
                                    value={userRoleFilter}
                                    onChange={(e) => setUserRoleFilter(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                >
                                    <option value="">All Roles</option>
                                    <option value="student">Students</option>
                                    <option value="instructor">Instructors</option>
                                    <option value="admin">Admins</option>
                                </select>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {users
                                    .filter(u =>
                                        (!userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                                            u.email.toLowerCase().includes(userSearch.toLowerCase())) &&
                                        (!userRoleFilter || u.role === userRoleFilter)
                                    )
                                    .map((user) => (
                                        <tr key={user._id}>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleUserRoleChange(user._id, e.target.value)}
                                                    className="text-sm border border-gray-300 rounded px-2 py-1"
                                                >
                                                    <option value="student">Student</option>
                                                    <option value="instructor">Instructor</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                        user.isEmailVerified
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.isEmailVerified ? 'Verified' : 'Unverified'}
                    </span>
                                                {user.mfaEnabled && (
                                                    <span className="ml-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        MFA
                      </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {formatDate(user.createdAt)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button className="text-gray-400 hover:text-gray-600">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'courses' && (
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">Course Management</h3>
                            <select
                                value={courseStatusFilter}
                                onChange={(e) => setCourseStatusFilter(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="draft">Draft</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">

                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Instructor</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {courses
                                    .filter(c => !courseStatusFilter || c.status === courseStatusFilter)
                                    .map((course) => (
                                        <tr key={course._id}>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{course.title}</p>
                                                    <p className="text-xs text-gray-500 truncate max-w-xs">{course.description}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {course.instructorId}
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={course.status}
                                                    onChange={(e) => handleCourseStatusChange(course._id, e.target.value as any)}
                                                    className={`text-xs px-2 py-1 rounded-full border ${course.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' :course.status === 'draft' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :'bg-gray-100 text-gray-800 border-gray-200'}`}
                                                >
                                                    <option value="active">Active</option>
                                                    <option value="draft">Draft</option>
                                                    <option value="archived">Archived</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {course.studentsEnrolled?.length || 0}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {formatDate(course.createdAt)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => router.push(`/courses/${course._id}`)}
                                                        className="text-gray-400 hover:text-gray-600"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleCourseStatusChange(course._id, 'archived')}
                                                        className="text-yellow-400 hover:text-yellow-600"
                                                    >
                                                        <Archive className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCourse(course._id)}
                                                        className="text-red-400 hover:text-red-600"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                {activeTab === 'security' && (
                    <div className="space-y-6">
                        {/* Security Overview */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-gray-900">Failed Logins</h3>
                                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{stats?.failedLogins || 0}</p>
                                <p className="text-sm text-gray-500 mt-2">In the last 24 hours</p>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-gray-900">MFA Enabled</h3>
                                    <Shield className="w-5 h-5 text-green-500" />
                                </div>
                                <p className="text-3xl font-bold text-gray-900">
                                    {users.filter(u => u.mfaEnabled).length}
                                </p>
                                <p className="text-sm text-gray-500 mt-2">
                                    Of {users.length} total users
                                </p>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-gray-900">Unverified Users</h3>
                                    <UserX className="w-5 h-5 text-red-500" />
                                </div>
                                <p className="text-3xl font-bold text-gray-900">
                                    {users.filter(u => !u.isEmailVerified).length}
                                </p>
                                <p className="text-sm text-gray-500 mt-2">Pending verification</p>
                            </div>
                        </div>

                        {/* Audit Logs */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Audit Log</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                    {auditLogs.map((log) => (
                                        <tr key={log._id}>
                                            <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${
                          log.event.includes('FAILED') ? 'text-red-600' :
                              log.event.includes('SUCCESS') ? 'text-green-600' :
                                  'text-gray-900'
                      }`}>
                        {log.event}
                      </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {log.userId || 'System'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {formatDate(log.timestamp)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {JSON.stringify(log.details).slice(0, 50)}...
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'system' && (
                    <div className="space-y-6">
                        {/* Backup Management */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Backup Management</h3>
                                <button
                                    onClick={() => handleRunBackup('all')}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center"
                                >
                                    <Database className="w-4 h-4 mr-2" />
                                    Run Full Backup
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <button
                                    onClick={() => handleRunBackup('users')}
                                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                                >
                                    <Users className="w-6 h-6 text-gray-600 mb-2" />
                                    <p className="text-sm font-medium">Backup Users</p>
                                </button>
                                <button
                                    onClick={() => handleRunBackup('courses')}
                                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                                >
                                    <BookOpen className="w-6 h-6 text-gray-600 mb-2" />
                                    <p className="text-sm font-medium">Backup Courses</p>
                                </button>
                                <button
                                    onClick={() => handleRunBackup('performances')}
                                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                                >
                                    <Activity className="w-6 h-6 text-gray-600 mb-2" />
                                    <p className="text-sm font-medium">Backup Performance</p>
                                </button>
                                <button
                                    onClick={() => adminService.purgeOldAuditLogs(30)}
                                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                                >
                                    <Trash2 className="w-6 h-6 text-gray-600 mb-2" />
                                    <p className="text-sm font-medium">Purge Old Logs</p>
                                </button>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-medium text-gray-900">Recent Backups</h4>
                                {backups.map((backup) => (
                                    <div key={backup._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {backup.dataType} backup
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatDate(backup.backupDate)}
                                            </p>
                                        </div>
                                        <button className="text-blue-600 hover:text-blue-700">
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* System Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                                <h4 className="font-medium text-gray-900 mb-4">Database Status</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Collections</span>
                                        <span className="text-sm font-medium">12</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Documents</span>
                                        <span className="text-sm font-medium">45,892</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Size</span>
                                        <span className="text-sm font-medium">2.4 GB</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                                <h4 className="font-medium text-gray-900 mb-4">Server Status</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">CPU Usage</span>
                                        <span className="text-sm font-medium">45%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Memory</span>
                                        <span className="text-sm font-medium">3.2/8 GB</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Uptime</span>
                                        <span className="text-sm font-medium">15 days</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                                <h4 className="font-medium text-gray-900 mb-4">API Status</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Requests/min</span>
                                        <span className="text-sm font-medium">238</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Avg Response</span>
                                        <span className="text-sm font-medium">125ms</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Error Rate</span>
                                        <span className="text-sm font-medium text-green-600">0.02%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>


            {showAnnouncementModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Announcement</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Send to:
                                </label>
                                <select
                                    value={announcementType}
                                    onChange={(e) => setAnnouncementType(e.target.value as any)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="all">All Users</option>
                                    <option value="role">Specific Role</option>
                                    <option value="course">Course Participants</option>
                                </select>
                            </div>

                            {announcementType === 'role' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Role:
                                    </label>
                                    <select
                                        value={selectedRole}
                                        onChange={(e) => setSelectedRole(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="student">Students</option>
                                        <option value="instructor">Instructors</option>
                                        <option value="admin">Admins</option>
                                    </select>
                                </div>
                            )}

                            {announcementType === 'course' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Course:
                                    </label>
                                    <select
                                        value={selectedCourse}
                                        onChange={(e) => setSelectedCourse(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="">Select a course</option>
                                        {courses.filter(c => c.status === 'active').map(course => (
                                            <option key={course._id} value={course._id}>
                                                {course.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Message:
                                </label>
                                <textarea
                                    value={announcementMessage}
                                    onChange={(e) => setAnnouncementMessage(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    rows={4}
                                    placeholder="Enter your announcement message..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowAnnouncementModal(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendAnnouncement}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Send Announcement
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}