// src/app/auth/register/page.tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {useAuth} from "@/Contexts/AuthContext";
import {sessionManager} from "../../../../Services/SessionM";
const CheckIcon = () => <span className="register-checkIcon">✓</span>;
const XIcon = () => <span className="register-xIcon">✗</span>;
const EyeIcon = ({ open }: { open: boolean }) => <span>{open ? '👁' : '👁‍🗨'}</span>;
const calculatePasswordStrength = (password: string): { score: number; message: string; color: string } => {
    let score = 0;
    const checks = {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        numbers: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    Object.values(checks).forEach(passed => { if (passed) score++; });

    const strengthLevels = [
        { min: 0, message: 'Very Weak', color: '#ef4444' },
        { min: 1, message: 'Weak', color: '#f97316' },
        { min: 2, message: 'Fair', color: '#eab308' },
        { min: 3, message: 'Good', color: '#84cc16' },
        { min: 4, message: 'Strong', color: '#22c55e' },
        { min: 5, message: 'Very Strong', color: '#10b981' },
    ];

    const level = strengthLevels.reverse().find(l => score >= l.min) || strengthLevels[0];
    return { score: (score / 5) * 100, message: level.message, color: level.color };
};
const roleDescriptions = {
    student: {
        title: 'Student',
        description: 'Access courses, take quizzes, track progress, and join study groups',
        icon: '🎓',
    },
    instructor: {
        title: 'Instructor',
        description: 'Create courses, manage students, view analytics, and teach',
        icon: '👨‍🏫',
    },
    admin: {
        title: 'Administrator',
        description: 'Manage platform, users, security, and system settings',
        icon: '⚡',
    },
};
type UserRole = 'student' | 'instructor' | 'admin';
export default function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student' as UserRole,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({score: 0, message: '', color: ''});
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const {register} = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (formData.password) {
            setPasswordStrength(calculatePasswordStrength(formData.password));
        }
    }, [formData.password]);

    const validateField = (name: string, value: string): string => {
        switch (name) {
            case 'name':
                if (!value.trim()) return 'Name is required';
                if (value.length < 2) return 'Name must be at least 2 characters';
                return '';

            case 'email':
                if (!value) return 'Email is required';
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) return 'Invalid email format';
                return '';

            case 'password':
                if (!value) return 'Password is required';
                if (value.length < 8) return 'Password must be at least 8 characters';
                return '';

            case 'confirmPassword':
                if (!value) return 'Please confirm your password';
                if (value !== formData.password) return 'Passwords do not match';
                return '';

            default:
                return '';
        }
    };

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setFormData(prev => ({...prev, [name]: value}));

        if (touchedFields.has(name)) {
            const error = validateField(name, value);
            setFieldErrors(prev => ({...prev, [name]: error}));
        }
    };

    const handleFieldBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setTouchedFields(prev => new Set(prev).add(name));
        const error = validateField(name, value);
        setFieldErrors(prev => ({...prev, [name]: error}));
    };

    const handleRoleSelect = (role: UserRole) => {
        setFormData(prev => ({...prev, role}));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const errors: Record<string, string> = {};
        Object.keys(formData).forEach(key => {
            if (key !== 'role') {
                const error = validateField(key, formData[key as keyof typeof formData] as string);
                if (error) errors[key] = error;
            }
        });

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setTouchedFields(new Set(Object.keys(errors)));
            setError('Please fix the errors before submitting');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role,
            });

            if (!result.success) {
                setError(result.error || 'Registration failed');
                return;
            }

            sessionManager.setPendingEmail(formData.email);
            router.push('/auth/verify-otp');
        } catch (err: any) {
            console.error('Registration error:', err);
            setError('Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-container">
            <div className="register-card">
                <div className="register-progress-bar">
                    <div className="register-progress-fill" style={{width: '50%'}}/>
                </div>

                <div className="register-header">
                    <h1 className="register-title">Create Your Account</h1>
                    <p className="register-subtitle">Join thousands of learners on their journey</p>
                </div>

                {error && <div className="register-errorAlert">{error}</div>}

                <form onSubmit={handleSubmit} className="register-form">
                    <div className="register-fieldGroup">
                        <label htmlFor="name" className="register-label">
                            Full Name
                        </label>
                        <div className="register-inputWrapper">
                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleFieldChange}
                                onBlur={handleFieldBlur}
                                className={`register-input ${fieldErrors.name ? 'register-inputError' : ''}`}
                                placeholder="John Doe"
                                disabled={loading}
                            />
                            {touchedFields.has('name') && (
                                <span className="register-fieldStatus">
                                {fieldErrors.name ? <XIcon/> : <CheckIcon/>}
                            </span>
                            )}
                        </div>
                        {fieldErrors.name && touchedFields.has('name') && (
                            <span className="register-errorText">{fieldErrors.name}</span>
                        )}
                    </div>

                    <div className="register-fieldGroup">
                        <label htmlFor="email" className="register-label">
                            Email Address
                        </label>
                        <div className="register-inputWrapper">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleFieldChange}
                                onBlur={handleFieldBlur}
                                className={`register-input ${fieldErrors.email ? 'register-inputError' : ''}`}
                                placeholder="john@example.com"
                                disabled={loading}
                            />
                            {touchedFields.has('email') && (
                                <span className="register-fieldStatus">
                                {fieldErrors.email ? <XIcon/> : <CheckIcon/>}
                            </span>
                            )}
                        </div>
                        {fieldErrors.email && touchedFields.has('email') && (
                            <span className="register-errorText">{fieldErrors.email}</span>
                        )}
                    </div>

                    <div className="register-fieldGroup">
                        <label className="register-label">I want to join as</label>
                        <div className="register-roleGrid">
                            {(Object.keys(roleDescriptions) as UserRole[]).map((role) => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => handleRoleSelect(role)}
                                    className={`register-roleCard ${formData.role === role ? 'register-roleCardActive' : ''}`}
                                    disabled={loading}
                                >
                                    <div className="register-roleIcon">{roleDescriptions[role].icon}</div>
                                    <div className="register-roleContent">
                                        <h3 className="register-roleTitle">{roleDescriptions[role].title}</h3>
                                        <p className="register-roleDescription">{roleDescriptions[role].description}</p>
                                    </div>
                                    {formData.role === role && (
                                        <div className="register-roleCheck">
                                            <CheckIcon/>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="register-fieldGroup">
                        <label htmlFor="password" className="register-label">
                            Password
                        </label>
                        <div className="register-inputWrapper">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={handleFieldChange}
                                onBlur={handleFieldBlur}
                                className={`register-input ${fieldErrors.password ? 'register-inputError' : ''}`}
                                placeholder="Create a strong password"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="register-eyeButton"
                            >
                                <EyeIcon open={showPassword}/>
                            </button>
                        </div>
                        {formData.password && (
                            <div className="register-passwordStrength">
                                <div className="register-strength-bar">
                                    <div
                                        className="register-strengthFill"
                                        style={{
                                            width: `${passwordStrength.score}%`,
                                            backgroundColor: passwordStrength.color,
                                        }}
                                    />
                                </div>
                                <span
                                    className="register-strengthText"
                                    style={{color: passwordStrength.color}}
                                >
                                {passwordStrength.message}
                            </span>
                            </div>
                        )}
                        {fieldErrors.password && touchedFields.has('password') && (
                            <span className="register-errorText">{fieldErrors.password}</span>
                        )}
                    </div>

                    <div className="register-fieldGroup">
                        <label htmlFor="confirmPassword" className="register-label">
                            Confirm Password
                        </label>
                        <div className="register-inputWrapper">
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={formData.confirmPassword}
                                onChange={handleFieldChange}
                                onBlur={handleFieldBlur}
                                className={`register-input ${fieldErrors.confirmPassword ? 'register-inputError' : ''}`}
                                placeholder="Re-enter your password"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="register-eyeButton"
                            >
                                <EyeIcon open={showConfirmPassword}/>
                            </button>
                        </div>
                        {fieldErrors.confirmPassword && touchedFields.has('confirmPassword') && (
                            <span className="register-errorText">{fieldErrors.confirmPassword}</span>
                        )}
                    </div>

                    <div className="register-terms">
                        <p className="register-termsText">
                            By creating an account, you agree to our{' '}
                            <Link href="/terms" className="register-link">Terms of Service</Link>
                            {' '}and{' '}
                            <Link href="/privacy" className="register-link">Privacy Policy</Link>
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || Object.keys(fieldErrors).some(key => fieldErrors[key])}
                        className="register-submitButton"
                    >
                        {loading ? (
                            <span className="register-loadingSpinner">Creating Account...</span>
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </form>

                <div className="register-divider">
                    <span>or</span>
                </div>

                <div className="register-socialButtons">
                    <button className="register-socialButton" disabled>
                        <span>🔍</span> Continue with Google
                    </button>
                    <button className="register-socialButton" disabled>
                        <span>📘</span> Continue with Microsoft
                    </button>
                </div>

                <p className="register-loginLink">
                    Already have an account?{' '}
                    <Link href="/auth/login" className="register-link">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}