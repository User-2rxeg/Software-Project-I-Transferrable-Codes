// src/app/auth/login/page.tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {useAuth} from "@/Contexts/AuthContext";
import {sessionManager} from "../../../../Services/SessionM";
// Icons
const EyeIcon = ({ open }: { open: boolean }) => <span>{open ? '👁' : '👁‍🗨'}</span>;
const CheckIcon = () => <span>✓</span>;
export default function Login() {
// Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
// MFA state
    const [mfaRequired, setMfaRequired] = useState(false);
    const [mfaToken, setMfaToken] = useState('');
    const [tempToken, setTempToken] = useState('');

// UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

// Use the auth context
    const { login, verifyMFA } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

// Check for success messages from other pages
    useEffect(() => {
        const resetSuccess = searchParams.get('reset');
        if (resetSuccess === 'success') {
            setSuccess('Password reset successful! Please login with your new password.');
        }

        const registered = searchParams.get('registered');
        if (registered === 'true') {
            setSuccess('Registration successful! Please login to continue.');
        }

        // Load remembered email (using localStorage for email only is safe)
        const savedEmail = localStorage.getItem('rememberedEmail');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }
    }, [searchParams]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const result = await login(email, password);

            if (!result.success) {
                setError(result.error || 'Login failed');

                // Check if email not verified
                if (result.error?.includes('not verified')) {
                    setTimeout(() => {
                        sessionManager.setPendingEmail(email);
                        router.push('/auth/verify-otp');
                    }, 3000);
                }
                return;
            }

            if (result.mfaRequired && result.tempToken) {
                setMfaRequired(true);
                setTempToken(result.tempToken);

                // Save email if remember me is checked
                if (rememberMe) {
                    localStorage.setItem('rememberedEmail', email);
                } else {
                    localStorage.removeItem('rememberedEmail');
                }
            } else if (result.user) {
                // Login successful
                handleSuccessfulLogin(result.user);
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleMfaVerify = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!mfaToken || mfaToken.length !== 6) {
            setError('Please enter a valid 6-digit code');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await verifyMFA(tempToken, mfaToken);

            if (!result.success) {
                setError(result.error || 'Invalid verification code');
                setMfaToken('');
                return;
            }

            if (result.user) {
                handleSuccessfulLogin(result.user);
            }
        } catch (err) {
            console.error('MFA verification error:', err);
            setError('Verification failed. Please try again.');
            setMfaToken('');
        } finally {
            setLoading(false);
        }
    };

    const handleSuccessfulLogin = (user: any) => {
        // Save email if remember me is checked
        if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }

        setSuccess('Login successful! Redirecting...');

        // Redirect based on role and profile completion
        setTimeout(() => {
            if (!user.profileComplete) {
                router.push('/auth/profile-setup');
            } else {
                switch(user.role) {
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
        }, 1000);
    };

// MFA Form
    if (mfaRequired) {
        return (
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <div className="login-icon">🔐</div>
                        <h1 className="login-title">Two-Factor Authentication</h1>
                        <p className="login-subtitle">
                            Enter the 6-digit code from your authenticator app
                        </p>
                    </div>

                    {error && <div className="login-errorAlert">{error}</div>}
                    {success && <div className="login-successAlert">{success}</div>}

                    <form onSubmit={handleMfaVerify} className="login-form">
                        <div className="login-fieldGroup">
                            <label htmlFor="mfaToken" className="login-label">
                                Authentication Code
                            </label>
                            <input
                                id="mfaToken"
                                type="text"
                                value={mfaToken}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                    setMfaToken(value);
                                }}
                                className="login-input login-mfaInput"
                                placeholder="000000"
                                maxLength={6}
                                autoComplete="one-time-code"
                                autoFocus
                                disabled={loading}
                            />
                            <p className="login-helpText">
                                Enter the code from Google Authenticator or similar app
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || mfaToken.length !== 6}
                            className="login-submitButton"
                        >
                            {loading ? (
                                <span className="login-loadingSpinner">Verifying...</span>
                            ) : (
                                'Verify & Login'
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setMfaRequired(false);
                                setMfaToken('');
                                setTempToken('');
                                setPassword('');
                            }}
                            className="login-backButton"
                        >
                            ← Back to login
                        </button>
                    </form>

                    <div className="login-footer">
                        <p className="login-footerText">
                            Lost your authenticator?{' '}
                            <Link href="/support" className="login-link">
                                Contact support
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

// Main Login Form
    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1 className="login-title">Welcome Back</h1>
                    <p className="login-subtitle">Sign in to continue your learning journey</p>
                </div>

                {error && <div className="login-errorAlert">{error}</div>}
                {success && <div className="login-successAlert">{success}</div>}

                <form onSubmit={handleLogin} className="login-form">
                    <div className="login-fieldGroup">
                        <label htmlFor="email" className="login-label">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="login-input"
                            placeholder="john@example.com"
                            autoComplete="email"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="login-fieldGroup">
                        <div className="login-labelRow">
                            <label htmlFor="password" className="login-label">
                                Password
                            </label>
                            <Link href="/auth/forgot-password" className="login-forgotLink">
                                Forgot password?
                            </Link>
                        </div>
                        <div className="login-inputWrapper">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="login-input"
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                required
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="login-eyeButton"
                                tabIndex={-1}
                            >
                                <EyeIcon open={showPassword} />
                            </button>
                        </div>
                    </div>

                    <div className="login-rememberRow">
                        <label className="login-checkbox">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="login-checkboxInput"
                            />
                            <span className="login-checkboxLabel">
                            {rememberMe && <CheckIcon />}
                        </span>
                            <span className="login-checkboxText">Remember me</span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !email || !password}
                        className="login-submitButton"
                    >
                        {loading ? (
                            <span className="login-loadingSpinner">Signing in...</span>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                <div className="login-divider">
                    <span>or</span>
                </div>

                <div className="login-socialButtons">
                    <button className="login-socialButton" disabled>
                        <span>🔍</span> Continue with Google
                    </button>
                    <button className="login-socialButton" disabled>
                        <span>📘</span> Continue with Microsoft
                    </button>
                </div>

                <p className="login-signupLink">
                    Don't have an account?{' '}
                    <Link href="/auth/register" className="login-link">
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    );
}