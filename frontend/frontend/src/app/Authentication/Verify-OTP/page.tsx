// src/app/auth/verify-otp/page.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {useAuth} from "@/Contexts/AuthContext";
import {sessionManager} from "../../../../Services/SessionM";


export default function VerifyOTP() {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [resendTimer, setResendTimer] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { verifyOTP, resendOTP } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const storedEmail = sessionManager.getPendingEmail();

        if (storedEmail) {
            setEmail(storedEmail);
            setResendTimer(120);
        } else {
            setError('No email found for verification. Please register first.');
            setTimeout(() => {
                router.push('/auth/register');
            }, 3000);
        }

        if (otpRefs.current[0]) {
            otpRefs.current[0].focus();
        }
    }, [router]);

    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);

    const handleOtpChange = (index: number, value: string) => {
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (!otp[index] && index > 0) {
                otpRefs.current[index - 1]?.focus();
            } else {
                const newOtp = [...otp];
                newOtp[index] = '';
                setOtp(newOtp);
            }
        }

        if (e.key === 'ArrowLeft' && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowRight' && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);

        if (pastedData.length === 6) {
            const newOtp = pastedData.split('');
            setOtp(newOtp);
            otpRefs.current[5]?.focus();
        }
    };

    const handleVerifySubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            setError('Please enter the complete 6-digit code');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await verifyOTP(email, otpCode);

            if (!result.success) {
                setError(result.error || 'Invalid or expired code');
                setOtp(['', '', '', '', '', '']);
                otpRefs.current[0]?.focus();
                return;
            }

            sessionManager.clearPendingEmail();
            setSuccess('Email verified successfully! Redirecting...');

            setTimeout(() => {
                const user = result.user;
                if (!user?.profileComplete) {
                    router.push('/auth/profile-setup');
                } else {
                    switch(user?.role) {
                        case 'admin':
                            router.push('/dashboard/admin');
                            break;
                        case 'instructor':
                            router.push('/dashboard/instructor');
                            break;
                        default:
                            router.push('/dashboard/student');
                    }
                }
            }, 1500);
        } catch (err: any) {
            console.error('Verification error:', err);
            setError('Verification failed. Please try again.');
            setOtp(['', '', '', '', '', '']);
            otpRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendTimer > 0 || !email) return;

        setLoading(true);
        setError('');

        try {
            await resendOTP(email);
            setSuccess('New verification code sent to your email!');
            setResendTimer(120);
            setOtp(['', '', '', '', '', '']);
            otpRefs.current[0]?.focus();
        } catch (err: any) {
            setError('Failed to resend code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!email) {
        return (
            <div className="verify-container">
                <div className="verify-card">
                    <div className="verify-header">
                        <p className="verify-subtitle">Redirecting to registration...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="register-container">
            <div className="register-card">
                <div className="register-progress-bar">
                    <div className="register-progress-fill" style={{ width: '100%' }} />
                </div>

                <div className="register-header">
                    <div className="register-verify-icon">✉️</div>
                    <h1 className="register-title">Verify Your Email</h1>
                    <p className="register-subtitle">
                        We've sent a 6-digit verification code to
                    </p>
                    <p className="verify-email">{email}</p>
                </div>

                {error && (
                    <div className="register-errorAlert">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="register-successAlert">
                        {success}
                    </div>
                )}

                <form onSubmit={handleVerifySubmit} className="register-form">
                    <div className="register-otpContainer">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => { otpRefs.current[index] = el; }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                onPaste={index === 0 ? handleOtpPaste : undefined}
                                className={`register-otpInput ${digit ? 'register-otpInputFilled' : ''}`}
                                disabled={loading}
                                autoComplete="off"
                                aria-label={`Digit ${index + 1}`}
                            />
                        ))}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || otp.join('').length !== 6}
                        className="register-submitButton"
                    >
                        {loading ? (
                            <span className="register-loadingSpinner">Verifying...</span>
                        ) : (
                            'Verify Email'
                        )}
                    </button>

                    <div className="register-resendSection">
                        {resendTimer > 0 ? (
                            <p className="register-resendTimer">
                                Resend code in {Math.floor(resendTimer / 60)}:{(resendTimer % 60).toString().padStart(2, '0')}
                            </p>
                        ) : (
                            <button
                                type="button"
                                onClick={handleResendOtp}
                                className="register-resendButton"
                                disabled={loading}
                            >
                                Didn't receive a code? <span>Resend</span>
                            </button>
                        )}
                    </div>
                </form>

                <div className="verify-footer">
                    <Link href="/auth/register" className="verify-backLink">
                        ← Back to registration
                    </Link>

                    <div className="verify-help">
                        <p className="verify-helpText">
                            Having trouble? Check your spam folder or{' '}
                            <Link href="/support" className="verify-helpLink">
                                contact support
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );}