
// src/app/auth/reset-password/page.tsx
'use client';import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {useAuth} from "@/Contexts/AuthContext";
import {sessionManager} from "../../../../Services/SessionManager";



const LockIcon = () => <span>🔒</span>;
const KeyIcon = () => <span>🔑</span>;
const EyeIcon = ({ open }: { open: boolean }) => <span>{open ? '👁' : '👁‍🗨'}</span>;
const CheckIcon = () => <span>✓</span>;
const XIcon = () => <span>✗</span>;
const ShieldIcon = () => <span>🛡️</span>;const calculatePasswordStrength = (password: string) => {
    let score = 0;
    const checks = {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        numbers: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };Object.values(checks).forEach(passed => { if (passed) score++; });const strengthLevels = [
        { min: 0, message: 'Very Weak', color: '#ef4444' },
        { min: 1, message: 'Weak', color: '#f97316' },
        { min: 2, message: 'Fair', color: '#eab308' },
        { min: 3, message: 'Good', color: '#84cc16' },
        { min: 4, message: 'Strong', color: '#22c55e' },
        { min: 5, message: 'Very Strong', color: '#10b981' },
    ];const level = strengthLevels.reverse().find(l => score >= l.min) || strengthLevels[0];return {
        score: (score / 5) * 100,
        message: level.message,
        color: level.color,
        checks
    };
};export default function ResetPassword() {
    const [step, setStep] = useState<'verify' | 'reset' | 'success'>('verify');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [resendTimer, setResendTimer] = useState(0);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({
        score: 0,
        message: '',
        color: '',
        checks: {
            length: false,
            lowercase: false,
            uppercase: false,
            numbers: false,
            special: false,
        }
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});const { resetPassword, resendOTP } = useAuth();
    const router = useRouter();useEffect(() => {
        const storedEmail = sessionManager.getPendingEmail() || sessionManager.getResetEmail();    if (!storedEmail) {
            router.push('/auth/forgot-password');
            return;
        }    setEmail(storedEmail);
        setResendTimer(120);    if (otpRefs.current[0]) {
            otpRefs.current[0].focus();
        }
    }, [router]);useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);useEffect(() => {
        if (newPassword) {
            setPasswordStrength(calculatePasswordStrength(newPassword));
        }
    }, [newPassword]);const handleOtpChange = (index: number, value: string) => {
        if (value && !/^\d$/.test(value)) return;    const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);    if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (!otp[index] && index > 0) {
                otpRefs.current[index - 1]?.focus();
            } else {
                const newOtp = [...otp];
                newOtp[index] = '';
                setOtp(newOtp);
            }
        }    if (e.key === 'ArrowLeft' && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowRight' && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);    if (pastedData.length === 6) {
            const newOtp = pastedData.split('');
            setOtp(newOtp);
            otpRefs.current[5]?.focus();
        }
    };const handleVerifyOtp = async () => {
        const otpCode = otp.join('');    if (otpCode.length !== 6) {
            setError('Please enter the complete 6-digit code');
            return;
        }    setStep('reset');
        setError('');
    };const validatePasswords = () => {
        const errors: Record<string, string> = {};    if (!newPassword) {
            errors.newPassword = 'Password is required';
        } else if (newPassword.length < 8) {
            errors.newPassword = 'Password must be at least 8 characters';
        } else if (passwordStrength.score < 40) {
            errors.newPassword = 'Password is too weak';
        }    if (!confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
        } else if (newPassword !== confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }    setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };const handleResetPassword = async () => {
        if (!validatePasswords()) {
            return;
        }    setLoading(true);
        setError('');    try {
            const otpCode = otp.join('');
            await resetPassword(email, otpCode, newPassword);        sessionManager.clearPendingEmail();
            sessionManager.clearResetEmail();        setStep('success');        setTimeout(() => {
                router.push('/auth/login?reset=success');
            }, 3000);    } catch (err: any) {
            console.error('Reset password error:', err);
            setError(err.message || 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };const handleResendOtp = async () => {
        if (resendTimer > 0) return;    setLoading(true);
        setError('');    try {
            await resendOTP(email);
            setResendTimer(120);
            setOtp(['', '', '', '', '', '']);
            otpRefs.current[0]?.focus();
        } catch (err: any) {
            setError('Failed to resend code. Please try again.');
        } finally {
            setLoading(false);
        }
    };if (step === 'verify') {
        return (
            <div className="reset-container">
                <div className="reset-card">
                    <div className="reset-progress-bar">
                        <div className="reset-progress-fill" style={{ width: '50%' }} />
                    </div>                <div className="reset-header">
                    <div className="reset-icon">
                        <KeyIcon />
                    </div>
                    <h1 className="reset-title">Enter Verification Code</h1>
                    <p className="reset-subtitle">
                        We've sent a 6-digit code to
                    </p>
                    <p className="reset-email">{email}</p>
                </div>                {error && <div className="reset-errorAlert">{error}</div>}                <div className="reset-otp-section">
                    <div className="reset-otp-container">
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
                                className={`reset-otp-input ${digit ? 'reset-otp-filled' : ''}`}
                                disabled={loading}
                                autoComplete="off"
                            />
                        ))}
                    </div>                    <button
                    onClick={handleVerifyOtp}
                    disabled={loading || otp.join('').length !== 6}
                    className="reset-submitButton"
                >
                    {loading ? 'Verifying...' : 'Verify Code'}
                </button>                    <div className="reset-resend-section">
                    {resendTimer > 0 ? (
                        <p className="reset-resend-timer">
                            Resend code in {Math.floor(resendTimer / 60)}:{(resendTimer % 60).toString().padStart(2, '0')}
                        </p>
                    ) : (
                        <button
                            onClick={handleResendOtp}
                            className="reset-resend-button"
                            disabled={loading}
                        >
                            Didn't receive? Resend code
                        </button>
                    )}
                </div>
                </div>                <div className="reset-footer">
                    <Link href="/auth/forgot-password" className="reset-link">
                        ← Use a different email
                    </Link>
                </div>
                </div>
            </div>
        );
    }if (step === 'reset') {
        return (
            <div className="reset-container">
                <div className="reset-card">
                    <div className="reset-progress-bar">
                        <div className="reset-progress-fill" style={{ width: '100%' }} />
                    </div>                <div className="reset-header">
                    <div className="reset-icon">
                        <LockIcon />
                    </div>
                    <h1 className="reset-title">Create New Password</h1>
                    <p className="reset-subtitle">
                        Choose a strong password for your account
                    </p>
                </div>                {error && <div className="reset-errorAlert">{error}</div>}                <form onSubmit={(e) => { e.preventDefault(); handleResetPassword(); }} className="reset-form">
                    <div className="reset-fieldGroup">
                        <label className="reset-label">New Password</label>
                        <div className="reset-inputWrapper">
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className={`reset-input ${fieldErrors.newPassword ? 'reset-input-error' : ''}`}
                                placeholder="Enter new password"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="reset-eyeButton"
                            >
                                <EyeIcon open={showNewPassword} />
                            </button>
                        </div>                        {newPassword && (
                        <div className="reset-password-strength">
                            <div className="reset-strength-bar">
                                <div
                                    className="reset-strength-fill"
                                    style={{
                                        width: `${passwordStrength.score}%`,
                                        backgroundColor: passwordStrength.color
                                    }}
                                />
                            </div>
                            <span
                                className="reset-strength-text"
                                style={{ color: passwordStrength.color }}
                            >
                                    {passwordStrength.message}
                                </span>
                        </div>
                    )}                        {newPassword && (
                        <div className="reset-password-requirements">
                            <p className="reset-requirements-title">Password must contain:</p>
                            <div className="reset-requirements-grid">
                                    <span className={passwordStrength.checks.length ? 'reset-check-passed' : 'reset-check-failed'}>
                                        {passwordStrength.checks.length ? <CheckIcon /> : <XIcon />} 8+ characters
                                    </span>
                                <span className={passwordStrength.checks.uppercase ? 'reset-check-passed' : 'reset-check-failed'}>
                                        {passwordStrength.checks.uppercase ? <CheckIcon /> : <XIcon />} Uppercase
                                    </span>
                                <span className={passwordStrength.checks.lowercase ? 'reset-check-passed' : 'reset-check-failed'}>
                                        {passwordStrength.checks.lowercase ? <CheckIcon /> : <XIcon />} Lowercase
                                    </span>
                                <span className={passwordStrength.checks.numbers ? 'reset-check-passed' : 'reset-check-failed'}>
                                        {passwordStrength.checks.numbers ? <CheckIcon /> : <XIcon />} Number
                                    </span>
                                <span className={passwordStrength.checks.special ? 'reset-check-passed' : 'reset-check-failed'}>
                                        {passwordStrength.checks.special ? <CheckIcon /> : <XIcon />} Special char
                                    </span>
                            </div>
                        </div>
                    )}                        {fieldErrors.newPassword && (
                        <span className="reset-errorText">{fieldErrors.newPassword}</span>
                    )}
                    </div>                    <div className="reset-fieldGroup">
                    <label className="reset-label">Confirm New Password</label>
                    <div className="reset-inputWrapper">
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`reset-input ${fieldErrors.confirmPassword ? 'reset-input-error' : ''}`}
                            placeholder="Re-enter new password"
                            disabled={loading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="reset-eyeButton"
                        >
                            <EyeIcon open={showConfirmPassword} />
                        </button>
                    </div>                        {confirmPassword && newPassword !== confirmPassword && (
                    <span className="reset-errorText">Passwords do not match</span>
                )}                        {fieldErrors.confirmPassword && (
                    <span className="reset-errorText">{fieldErrors.confirmPassword}</span>
                )}
                </div>                    <button
                    type="submit"
                    disabled={loading || !newPassword || !confirmPassword || passwordStrength.score < 40}
                    className="reset-submitButton"
                >
                    {loading ? 'Resetting Password...' : 'Reset Password'}
                </button>
                </form>                <div className="reset-footer">
                    <Link href="/auth/login" className="reset-link">
                        ← Back to login
                    </Link>
                </div>
                </div>
            </div>
        );
    }if (step === 'success') {
        return (
            <div className="reset-container">
                <div className="reset-card">
                    <div className="reset-success-content">
                        <div className="reset-success-icon">
                            <ShieldIcon />
                        </div>
                        <h2 className="reset-title">Password Reset Successful!</h2>
                        <p className="reset-subtitle">
                            Your password has been reset successfully.
                            You can now log in with your new password.
                        </p>
                        <div className="reset-success-animation">
                            <div className="reset-success-spinner"></div>
                            <p>Redirecting to login...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }return null;
}