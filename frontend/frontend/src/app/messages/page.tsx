// src/app/messages/page.tsx
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';


import io, { Socket } from 'socket.io-client';
import {
    MessageSquare,
    Send,
    Search,
    Paperclip,
    MoreVertical,
    User,
    Users,
    Circle,
    Check,
    CheckCheck,
    ArrowLeft,
    Plus,
    X,
    Image as ImageIcon,
    File
} from 'lucide-react';
import apiClient from "../../../Services/apiC";
import {useAuth} from "@/Contexts/AuthContext";

interface Message {
    id: string;
    sender: string;
    content: string;
    attachmentUrl?: string;
    timestamp: string;
    read?: boolean;
}
interface Conversation {
    _id: string;
    participants: Array<{
        _id: string;
        name: string;
        email: string;
        role: string;
    }>;
    isGroup: boolean;
    groupName?: string;
    lastMessage?: any;
    lastMessageAt?: string;
    unreadCount?: number;
}
interface ChatPayload {
    chatId: string;
    message: Message;
}
export default function MessagesPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
// State
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [groupName, setGroupName] = useState('');
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
// Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
// Initialize WebSocket
    useEffect(() => {
        if (!user) return;
        const socketInstance = io('ws://localhost:3555/ws/chat', {
            auth: {
                token: localStorage.getItem('accessToken')
            },
            transports: ['websocket', 'polling']
        });

        socketInstance.on('connect', () => {
            console.log('Connected to chat server');
            // Join all conversation rooms
            conversations.forEach(conv => {
                socketInstance.emit('chat:join', conv._id);
            });
        });

        socketInstance.on('chat:newMessage', (payload: ChatPayload) => {
            handleNewMessage(payload);
        });

        socketInstance.on('chat:read', ({ chatId, reader, upToMessageId }) => {
            if (selectedConversation?._id === chatId) {
                setMessages(prev => prev.map(msg =>
                    msg.id === upToMessageId ? { ...msg, read: true } : msg
                ));
            }
        });

        socketInstance.on('user:online', (userId: string) => {
            setOnlineUsers(prev => new Set(prev).add(userId));
        });

        socketInstance.on('user:offline', (userId: string) => {
            setOnlineUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [user]);
// Fetch conversations
    useEffect(() => {
        fetchConversations();
        fetchAvailableUsers();
    }, []);
// Scroll to bottom on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    const fetchConversations = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/chat/rooms');
            setConversations(response.data.items || []);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };
    const fetchAvailableUsers = async () => {
        try {
            const response = await apiClient.get('/users/search?limit=100');
            setAvailableUsers(response.data.items?.filter((u: any) => u._id !== user?.id) || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };
    const fetchMessages = async (conversationId: string) => {
        try {
            const response = await apiClient.get(`/chat/${conversationId}/history`);
            setMessages(response.data.items?.map((msg: any) => ({
                id: msg._id,
                sender: msg.sender,
                content: msg.content,
                attachmentUrl: msg.attachmentUrl,
                timestamp: msg.createdAt
            })) || []);
            // Mark as read
            await apiClient.post(`/chat/${conversationId}/read`);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };
    const handleNewMessage = useCallback((payload: ChatPayload) => {
        if (selectedConversation?._id === payload.chatId) {
            setMessages(prev => [...prev, payload.message]);
        }
// Update conversation list
        setConversations(prev => prev.map(conv =>
            conv._id === payload.chatId
                ? { ...conv, lastMessage: payload.message, lastMessageAt: payload.message.timestamp }
                : conv
        ).sort((a, b) =>
            new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
        ));
    }, [selectedConversation]);
    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation || sending) return;
        setSending(true);
        try {
            await apiClient.post(`/chat/${selectedConversation._id}/messages`, {
                content: newMessage
            });
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };
    const createNewChat = async () => {
        if (selectedUsers.length === 0) return;
        try {
            const isGroup = selectedUsers.length > 1;
            const response = await apiClient.post('/chat/rooms', {
                participants: selectedUsers,
                isGroup,
                groupName: isGroup ? groupName : undefined
            });

            setShowNewChatModal(false);
            setSelectedUsers([]);
            setGroupName('');
            await fetchConversations();
            setSelectedConversation(response.data);
        } catch (error) {
            console.error('Error creating chat:', error);
        }
    };
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !selectedConversation) return;
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await apiClient.post('/uploads', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            await apiClient.post(`/chat/${selectedConversation._id}/messages`, {
                content: `Shared a file: ${file.name}`,
                attachmentUrl: response.data.url
            });
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    };
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        if (isToday) {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    const getOtherParticipant = (conversation: Conversation) => {
        if (conversation.isGroup) return null;
        return conversation.participants.find(p => p._id !== user?.id);
    };
    const getConversationName = (conversation: Conversation) => {
        if (conversation.isGroup) {
            return conversation.groupName || 'Group Chat';
        }
        const other = getOtherParticipant(conversation);
        return other?.name || 'Unknown User';
    };
    const getConversationAvatar = (conversation: Conversation) => {
        if (conversation.isGroup) {
            return <Users className="w-5 h-5" />;
        }
        return <User className="w-5 h-5" />;
    };
    const isUserOnline = (userId: string) => {
        return onlineUsers.has(userId);
    };
    const filteredConversations = conversations.filter(conv => {
        const name = getConversationName(conv).toLowerCase();
        return name.includes(searchQuery.toLowerCase());
    });
    const filteredUsers = availableUsers.filter(u =>
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase())
    );
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }
    return (
        <div className="h-screen bg-gray-50 flex">

            {/* Conversations List */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
                        <button
                            onClick={() => setShowNewChatModal(true)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <Plus className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                    </div>
                </div>

                {/* Conversations */}
                <div className="flex-1 overflow-y-auto">
                    {filteredConversations.length === 0 ? (
                        <div className="p-8 text-center">
                            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500">No conversations yet</p>
                            <button
                                onClick={() => setShowNewChatModal(true)}
                                className="mt-4 text-blue-600 hover:text-blue-700 text-sm"
                            >
                                Start a new chat
                            </button>
                        </div>
                    ) : (
                        filteredConversations.map(conversation => {
                            const other = getOtherParticipant(conversation);
                            const isSelected = selectedConversation?._id === conversation._id;
                            const isOnline = other && isUserOnline(other._id);

                            return (
                                <button
                                    key={conversation._id}
                                    onClick={() => {
                                        setSelectedConversation(conversation);
                                        fetchMessages(conversation._id);
                                        if (socket) {
                                            socket.emit('chat:join', conversation._id);
                                        }
                                    }}
                                    className={`w-full p-4 hover:bg-gray-50 flex items-start space-x-3 transition-colors ${
                                        isSelected ? 'bg-blue-50' : ''
                                    }`}
                                >
                                    <div className="relative">
                                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                                            {getConversationAvatar(conversation)}
                                        </div>
                                        {isOnline && (
                                            <Circle className="absolute bottom-0 right-0 w-3 h-3 text-green-500 fill-current" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0 text-left">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {getConversationName(conversation)}
                                            </p>
                                            {conversation.lastMessageAt && (
                                                <span className="text-xs text-gray-500">
                      {formatTime(conversation.lastMessageAt)}
                    </span>
                                            )}
                                        </div>
                                        {conversation.lastMessage && (
                                            <p className="text-sm text-gray-500 truncate">
                                                {conversation.lastMessage.content}
                                            </p>
                                        )}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => setSelectedConversation(null)}
                                    className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                                    {getConversationAvatar(selectedConversation)}
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900">
                                        {getConversationName(selectedConversation)}
                                    </h3>
                                    {!selectedConversation.isGroup && (
                                        <p className="text-xs text-gray-500">
                                            {isUserOnline(getOtherParticipant(selectedConversation)?._id || '')
                                                ? 'Online'
                                                : 'Offline'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <button className="p-2 hover:bg-gray-100 rounded-lg">
                                <MoreVertical className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                            {messages.map((message, index) => {
                                const isOwn = message.sender === user?.id;
                                const showDate = index === 0 ||
                                    new Date(message.timestamp).toDateString() !==
                                    new Date(messages[index - 1].timestamp).toDateString();

                                return (
                                    <div key={message.id}>
                                        {showDate && (
                                            <div className="text-center text-xs text-gray-500 my-4">
                                                {new Date(message.timestamp).toLocaleDateString()}
                                            </div>
                                        )}

                                        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                                isOwn
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-white border border-gray-200'
                                            }`}>
                                                <p className={`text-sm ${isOwn ? 'text-white' : 'text-gray-900'}`}>
                                                    {message.content}
                                                </p>

                                                {message.attachmentUrl && (
                                                    <a
                                                        href={message.attachmentUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`inline-flex items-center mt-2 text-xs ${
                                                            isOwn ? 'text-blue-100' : 'text-blue-600'
                                                        } hover:underline`}
                                                    >
                                                        <File className="w-3 h-3 mr-1" />
                                                        View attachment
                                                    </a>
                                                )}


                                                <div className={`flex items-center justify-end mt-1 space-x-1 text-xs ${
                                                    isOwn ? 'text-blue-100' : 'text-gray-500'
                                                }`}>
                                                    <span>{formatTime(message.timestamp)}</span>
                                                    {isOwn && (
                                                        message.read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="bg-white border-t border-gray-200 p-4">
                            <div className="flex items-end space-x-2">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <Paperclip className="w-5 h-5 text-gray-600" />
                                </button>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />

                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            sendMessage();
                                        }
                                    }}
                                    placeholder="Type a message..."
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none"
                                    rows={1}
                                />

                                <button
                                    onClick={sendMessage}
                                    disabled={!newMessage.trim() || sending}
                                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                            <p className="text-gray-500">Choose a chat from the list or start a new one</p>
                        </div>
                    </div>
                )}
            </div>

            {/* New Chat Modal */}
            {showNewChatModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">New Message</h3>
                            <button
                                onClick={() => {
                                    setShowNewChatModal(false);
                                    setSelectedUsers([]);
                                    setGroupName('');
                                    setUserSearch('');
                                }}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* User Search */}
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>

                        {/* Selected Users */}
                        {selectedUsers.length > 0 && (
                            <div className="mb-4 flex flex-wrap gap-2">
                                {selectedUsers.map(userId => {
                                    const user = availableUsers.find(u => u._id === userId);
                                    return (
                                        <span
                                            key={userId}
                                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center"
                                        >
                  {user?.name}
                                            <button
                                                onClick={() => setSelectedUsers(prev => prev.filter(id => id !== userId))}
                                                className="ml-2"
                                            >
                    <X className="w-3 h-3" />
                  </button>
                </span>
                                    );
                                })}
                            </div>
                        )}

                        {/* Group Name (if multiple users selected) */}
                        {selectedUsers.length > 1 && (
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="Group name (optional)"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                        )}

                        {/* User List */}
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {filteredUsers.map(user => (
                                <button
                                    key={user._id}
                                    onClick={() => {
                                        if (selectedUsers.includes(user._id)) {
                                            setSelectedUsers(prev => prev.filter(id => id !== user._id));
                                        } else {
                                            setSelectedUsers(prev => [...prev, user._id]);
                                        }
                                    }}
                                    className={`w-full p-3 flex items-center justify-between rounded-lg transition-colors ${
                                        selectedUsers.includes(user._id)
                                            ? 'bg-blue-50 border-blue-200'
                                            : 'hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                            <User className="w-4 h-4 text-gray-500" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                            <p className="text-xs text-gray-500">{user.role}</p>
                                        </div>
                                    </div>
                                    {selectedUsers.includes(user._id) && (
                                        <Check className="w-4 h-4 text-blue-600" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowNewChatModal(false);
                                    setSelectedUsers([]);
                                    setGroupName('');
                                    setUserSearch('');
                                }}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createNewChat}
                                disabled={selectedUsers.length === 0}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                Start Chat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
