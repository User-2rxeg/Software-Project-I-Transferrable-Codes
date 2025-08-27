// src/app/auth/forgot-password/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {useAuth} from "@/Contexts/AuthContext";
import {sessionManager} from "../../../../Services/SessionM";

const MailIcon = () => <span>✉️</span>;
const LockIcon = () => <span>🔒</span>;
const ArrowLeftIcon = () => <span>←</span>;
export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const { forgotPassword } = useAuth();
    const router = useRouter();

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            setError('Please enter your email address');
            return;
        }

        if (!validateEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await forgotPassword(email);
            setSuccess(true);
            sessionManager.setPendingEmail(email);

            setTimeout(() => {
                router.push('/auth/reset-password');
            }, 3000);

        } catch (err: any) {
            console.error('Forgot password error:', err);
            setError(err.message || 'Failed to send reset code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="forgot-container">
                <div className="forgot-card">
                    <div className="forgot-success-content">
                        <div className="forgot-success-icon">
                            <MailIcon />
                        </div>
                        <h2 className="forgot-title">Check Your Email</h2>
                        <p className="forgot-subtitle">
                            We've sent a verification code to
                        </p>
                        <p className="forgot-email-display">{email}</p>
                        <p className="forgot-description">
                            Please check your inbox and enter the code on the next page.
                            The code will expire in 10 minutes.
                        </p>
                        <div className="forgot-success-animation">
                            <div className="forgot-success-spinner"></div>
                            <p>Redirecting to verification page...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="forgot-container">
            <div className="forgot-card">
                <div className="forgot-header">
                    <div className="forgot-icon">
                        <LockIcon />
                    </div>
                    <h1 className="forgot-title">Forgot Your Password?</h1>
                    <p className="forgot-subtitle">
                        No worries! Enter your email address and we'll send you a code to reset your password.
                    </p>
                </div>

                {error && (
                    <div className="forgot-errorAlert">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="forgot-form">
                    <div className="forgot-fieldGroup">
                        <label htmlFor="email" className="forgot-label">
                            Email Address
                        </label>
                        <div className="forgot-inputWrapper">
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setError('');
                                }}
                                className="forgot-input"
                                placeholder="Enter your registered email"
                                autoComplete="email"
                                autoFocus
                                required
                                disabled={loading}
                            />
                            <div className="forgot-input-icon">
                                <MailIcon />
                            </div>
                        </div>
                        <p className="forgot-helpText">
                            We'll send a 6-digit verification code to this email
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !email.trim()}
                        className="forgot-submitButton"
                    >
                        {loading ? (
                            <span className="forgot-loadingSpinner">Sending Code...</span>
                        ) : (
                            'Send Reset Code'
                        )}
                    </button>
                </form>

                <div className="forgot-divider"></div>

                <div className="forgot-footer">
                    <Link href="/auth/login" className="forgot-backLink">
                        <ArrowLeftIcon /> Back to Login
                    </Link>

                    <p className="forgot-footerText">
                        Don't have an account?{' '}
                        <Link href="/auth/register" className="forgot-link">
                            Sign up
                        </Link>
                    </p>

                    <p className="forgot-helpInfo">
                        Having trouble? <Link href="/support" className="forgot-link">Contact Support</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}