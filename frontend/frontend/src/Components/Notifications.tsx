// src/components/NotificationSystem.tsx
'use client';


import { useAuth } from '@/Contexts/AuthContext';
import {useCallback, useEffect, useState} from 'react';
import io, { Socket } from 'socket.io-client';
import apiClient from "../../Services/apiC";

import {
    Bell,
    X,
    CheckCircle,
    AlertCircle,
    Info,
    MessageSquare,
    Users,
    BookOpen,
    Award,
    Calendar,
    Megaphone,
    Circle,
    Check,
    Trash2
} from 'lucide-react';
interface Notification {
    _id: string;
    type: 'announcement' | 'courseUpdate' | 'assignmentDue' | 'newMessage' | 'systemAlert' | 'quiz' | 'enrollment';
    message: string;
    read: boolean;
    createdAt: string;
    courseId?: string;
    sentBy?: {
        _id: string;
        name: string;
    };
}
export default function NotificationSystem() {
    const { user } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showToast, setShowToast] = useState(false);
    const [latestNotification, setLatestNotification] = useState<Notification | null>(null);
// Initialize WebSocket connection
    useEffect(() => {
        if (!user) return;
        const socketInstance = io('ws://localhost:3555/ws', {
            auth: {
                token: localStorage.getItem('accessToken')
            },
            transports: ['websocket', 'polling']
        });

        socketInstance.on('connect', () => {
            console.log('Connected to notification server');
        });

        socketInstance.on('notification:new', (notification: any) => {
            handleNewNotification(notification);
        });

        socketInstance.on('notification:read', (data: { id: string }) => {
            setNotifications(prev =>
                prev.map(n => n._id === data.id ? { ...n, read: true } : n)
            );
            updateUnreadCount();
        });

        socketInstance.on('notification:deleted', (data: { id: string }) => {
            setNotifications(prev => prev.filter(n => n._id !== data.id));
            updateUnreadCount();
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [user]);
// Fetch initial notifications
    useEffect(() => {
        fetchNotifications();
    }, []);
// Update unread count
    useEffect(() => {
        updateUnreadCount();
    }, [notifications]);
// Load persisted notifications from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('notifications');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setNotifications(parsed);
            } catch (error) {
                console.error('Error loading stored notifications:', error);
            }
        }
    }, []);
// Persist notifications to localStorage
    useEffect(() => {
        if (notifications.length > 0) {
            localStorage.setItem('notifications', JSON.stringify(notifications));
        }
    }, [notifications]);
    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/notifications`);
            setNotifications(response.data || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };
    const handleNewNotification = useCallback((notification: Notification) => {
        setNotifications(prev => [notification, ...prev]);
        setLatestNotification(notification);
        setShowToast(true);
// Auto-hide toast after 5 seconds
        setTimeout(() => {
            setShowToast(false);
            setLatestNotification(null);
        }, 5000);

// Play notification sound
        playNotificationSound();
    }, []);
    const updateUnreadCount = useCallback(() => {
        const count = notifications.filter(n => !n.read).length;
        setUnreadCount(count);
    }, [notifications]);
    const markAsRead = async (notificationId: string) => {
        try {
            await apiClient.patch(`/notifications/${notificationId}/read`);
            setNotifications(prev =>
                prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
            );
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };
    const markAllAsRead = async () => {
        try {
            await apiClient.patch('/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };
    const deleteNotification = async (notificationId: string) => {
        try {
            await apiClient.delete(`/notifications/${notificationId}`);
            setNotifications(prev => prev.filter(n => n._id !== notificationId));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };
    const clearAll = async () => {
        if (!confirm('Are you sure you want to clear all notifications?')) return;
        try {
            // Delete all notifications one by one (or implement bulk delete in backend)
            await Promise.all(notifications.map(n => apiClient.delete(`/notifications/${n._id}`)));
            setNotifications([]);
            localStorage.removeItem('notifications');
        } catch (error) {
            console.error('Error clearing notifications:', error);
        }
    };
    const playNotificationSound = () => {
// Create and play a notification sound
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBs');
        audio.volume = 0.3;
        audio.play().catch(() => {
// Ignore errors if audio play is blocked
        });
    };
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'announcement':
                return Megaphone;
            case 'courseUpdate':
                return BookOpen;
            case 'assignmentDue':
                return Calendar;
            case 'newMessage':
                return MessageSquare;
            case 'systemAlert':
                return AlertCircle;
            case 'quiz':
                return Award;
            case 'enrollment':
                return Users;
            default:
                return Info;
        }
    };
    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'announcement':
                return 'text-purple-600 bg-purple-100';
            case 'courseUpdate':
                return 'text-blue-600 bg-blue-100';
            case 'assignmentDue':
                return 'text-orange-600 bg-orange-100';
            case 'newMessage':
                return 'text-green-600 bg-green-100';
            case 'systemAlert':
                return 'text-red-600 bg-red-100';
            case 'quiz':
                return 'text-yellow-600 bg-yellow-100';
            case 'enrollment':
                return 'text-indigo-600 bg-indigo-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };
    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;

        return date.toLocaleDateString();
    };
    const groupNotificationsByDate = () => {
        const grouped: { [key: string]: Notification[] } = {};
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        notifications.forEach(notification => {
            const date = new Date(notification.createdAt).toDateString();
            let key = date;

            if (date === today) key = 'Today';
            else if (date === yesterday) key = 'Yesterday';

            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(notification);
        });

        return grouped;
    };
    const groupedNotifications = groupNotificationsByDate();
    return (
        <>
            {/* Notification Bell */}
            <div className="relative">
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
{unreadCount > 9 ? '9+' : unreadCount}
</span>
                    )}
                </button>
                {/* Dropdown */}
                {showDropdown && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowDropdown(false)}
                        />

                        {/* Dropdown Content */}
                        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[80vh] overflow-hidden flex flex-col">
                            {/* Header */}
                            <div className="p-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                                    <div className="flex items-center gap-2">
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllAsRead}
                                                className="text-xs text-blue-600 hover:text-blue-700"
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                        {notifications.length > 0 && (
                                            <button
                                                onClick={clearAll}
                                                className="text-xs text-gray-500 hover:text-gray-700"
                                            >
                                                Clear all
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setShowDropdown(false)}
                                            className="p-1 hover:bg-gray-100 rounded"
                                        >
                                            <X className="w-4 h-4 text-gray-500" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Notifications List */}
                            <div className="flex-1 overflow-y-auto">
                                {loading ? (
                                    <div className="p-8 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">No notifications yet</p>
                                        <p className="text-xs text-gray-400 mt-1">We'll notify you when something important happens</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {Object.entries(groupedNotifications).map(([date, dateNotifications]) => (
                                            <div key={date}>
                                                <div className="px-4 py-2 bg-gray-50">
                                                    <p className="text-xs font-medium text-gray-500">{date}</p>
                                                </div>
                                                {dateNotifications.map(notification => {
                                                    const Icon = getNotificationIcon(notification.type);
                                                    const colorClass = getNotificationColor(notification.type);

                                                    return (
                                                        <div
                                                            key={notification._id}
                                                            className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                                                                !notification.read ? 'bg-blue-50/50' : ''
                                                            }`}
                                                            onClick={() => !notification.read && markAsRead(notification._id)}
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <div className={`p-2 rounded-lg ${colorClass}`}>
                                                                    <Icon className="w-4 h-4" />
                                                                </div>

                                                                <div className="flex-1 min-w-0">
                                                                    <p className={`text-sm ${!notification.read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                                                                        {notification.message}
                                                                    </p>
                                                                    {notification.sentBy && (
                                                                        <p className="text-xs text-gray-500 mt-1">
                                                                            From: {notification.sentBy.name}
                                                                        </p>
                                                                    )}
                                                                    <p className="text-xs text-gray-400 mt-1">
                                                                        {formatTime(notification.createdAt)}
                                                                    </p>
                                                                </div>

                                                                <div className="flex items-center gap-1">
                                                                    {!notification.read && (
                                                                        <Circle className="w-2 h-2 text-blue-600 fill-current" />
                                                                    )}
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            deleteNotification(notification._id);
                                                                        }}
                                                                        className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100"
                                                                    >
                                                                        <X className="w-3 h-3 text-gray-400" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Toast Notification */}
            {showToast && latestNotification && (
                <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
                        <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${getNotificationColor(latestNotification.type)}`}>
                                {(() => {
                                    const Icon = getNotificationIcon(latestNotification.type);
                                    return <Icon className="w-4 h-4" />;
                                })()}
                            </div>

                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">New Notification</p>
                                <p className="text-sm text-gray-700 mt-1">{latestNotification.message}</p>
                            </div>

                            <button
                                onClick={() => setShowToast(false)}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
    @keyframes slide-in-right {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    .animate-slide-in-right {
      animation: slide-in-right 0.3s ease-out;
    }
  `}</style>
        </>
    );
}
