// src/lib/services/adminApi.ts


import apiClient from "./apiC";

export interface SystemUser {
    _id: string;
    name: string;
    email: string;
    role: 'student' | 'instructor' | 'admin';
    isEmailVerified: boolean;
    mfaEnabled: boolean;
    createdAt: string;
    updatedAt: string;
}export interface SystemCourse {
    _id: string;
    title: string;
    description: string;
    instructorId: string;
    status: 'active' | 'draft' | 'archived';
    studentsEnrolled: string[];
    createdAt: string;
    archivedAt?: string;
}export interface Enrollment {
    courseId: string;
    courseTitle: string;
    userId: string;
    name: string;
    email: string;
}export interface BackupData {
    _id: string;
    backupDate: string;
    dataType: string;
    storageLink: string;
}export interface AuditLog {
    _id: string;
    userId?: string;
    event: string;
    timestamp: string;
    details: Record<string, any>;
}class AdminService {
// User Management
    async listUsers(params: {
        q?: string;
        role?: string;
        verified?: string;
        page?: number;
        limit?: number;
    }) {
        const queryParams = new URLSearchParams();
        if (params.q) queryParams.append('q', params.q);
        if (params.role) queryParams.append('role', params.role);
        if (params.verified) queryParams.append('verified', params.verified);
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());const response = await apiClient.get(`/admin/users?${queryParams.toString()}`);
        return response.data;
    }async updateUserRole(userId: string, role: string) {
        const response = await apiClient.patch(`/admin/users/${userId}/role, { role }`);
        return response.data;
    }// Course Management
    async listCourses(params: {
        q?: string;
        status?: string;
        page?: number;
        limit?: number;
    }) {
        const queryParams = new URLSearchParams();
        if (params.q) queryParams.append('q', params.q);
        if (params.status) queryParams.append('status', params.status);
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());const response = await apiClient.get(`/admin/courses?${queryParams.toString()}`);
        return response.data;
    }async updateCourseStatus(courseId: string, status: 'active' | 'draft' | 'archived') {
        const response = await apiClient.patch(`/admin/courses/${courseId}/status, { status }`);
        return response.data;
    }async archiveCourse(courseId: string) {
        const response = await apiClient.patch(`/admin/courses/${courseId}/archive`);
        return response.data;
    }async deleteCourse(courseId: string) {
        const response = await apiClient.delete(`/admin/courses/${courseId}`);
        return response.data;
    }async archiveOutdatedCourses(beforeDate: string) {
        const response = await apiClient.post(`/admin/courses/archive-outdated?before=${beforeDate}`);
        return response.data;
    }// Enrollments
    async listEnrollments(params: {
        q?: string;
        courseId?: string;
        userId?: string;
        page?: number;
        limit?: number;
    }) {
        const queryParams = new URLSearchParams();
        if (params.q) queryParams.append('q', params.q);
        if (params.courseId) queryParams.append('courseId', params.courseId);
        if (params.userId) queryParams.append('userId', params.userId);
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());const response = await apiClient.get(`/admin/enrollments?${queryParams.toString()}`);
        return response.data;
    }// Announcements
    async announceToAll(message: string) {
        const response = await apiClient.post('/admin/announce/all', { message });
        return response.data;
    }async announceToRole(role: string, message: string) {
        const response = await apiClient.post('/admin/announce/role', { role, message });
        return response.data;
    }async announceToCourse(courseId: string, message: string, to: 'students' | 'instructor' | 'all' = 'all') {
        const response = await apiClient.post('/admin/announce/course', { courseId, message, to });
        return response.data;
    }// Backups
    async runBackup(dataType: 'users' | 'courses' | 'performances' | 'all') {
        const response = await apiClient.post('/backups/run', { dataType });
        return response.data;
    }async listBackups(page: number = 1, limit: number = 20) {
        const response = await apiClient.get(`/backups?page=${page}&limit=${limit}`);
        return response.data;
    }async deleteBackup(backupId: string) {
        const response = await apiClient.delete(`/backups/${backupId}`);
        return response.data;
    }// Audit Logs
    async getAuditLogs(params: {
        page?: number;
        limit?: number;
        userId?: string;
        event?: string;
        from?: string;
        to?: string;
    }) {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.userId) queryParams.append('userId', params.userId);
        if (params.event) queryParams.append('event', params.event);
        if (params.from) queryParams.append('from', params.from);
        if (params.to) queryParams.append('to', params.to);const response = await apiClient.get(`/audit?${queryParams.toString()}`);
        return response.data;
    }async getFailedLogins(page: number = 1, limit: number = 20) {
        const response = await apiClient.get(`/audit/security/failed-logins?page=${page}&limit=${limit}`);
        return response.data;
    }async getUnauthorizedAccess(page: number = 1, limit: number = 20) {
        const response = await apiClient.get(`/audit/security/unauthorized?page=${page}&limit=${limit}`);
        return response.data;
    }async purgeOldAuditLogs(days: number) {
        const response = await apiClient.delete(`/audit/purge/older-than/${days}`);
        return response.data;
    }// Analytics
    async getInstructorDashboard(instructorId: string) {
        const response = await apiClient.get(`/analytics/instructor/${instructorId}/dashboard`);
        return response.data;
    }async getStudentSummary(studentId: string) {
        const response = await apiClient.get(`/analytics/student/${studentId}/summary`);
        return response.data;
    }// Notification Audit
    async getNotificationAudit(page: number = 1, limit: number = 20) {
        const response = await apiClient.get(`/notifications/audit?page=${page}&limit=${limit}`);
        return response.data;
    }
}export const adminService = new AdminService();