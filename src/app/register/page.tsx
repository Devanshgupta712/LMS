'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', course: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [otp, setOtp] = useState('');
    const [phoneSent, setPhoneSent] = useState(false);
    const [phoneVerified, setPhoneVerified] = useState(false);
    const [phoneLoading, setPhoneLoading] = useState(false);
    const [phoneError, setPhoneError] = useState('');
    const [phoneSuccess, setPhoneSuccess] = useState('');

    const courses = [
        'Full Stack Java Development',
        'Full Stack Python Development',
        'MERN Stack Development',
        'Software Testing & Automation',
        'Data Analytics',
        'Data Science',
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!phoneVerified && form.phone) {
            setError('Please verify your phone number first');
            return;
        }

        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    phone: form.phone || null,
                    password: form.password,
                    role: 'STUDENT',
                    course: form.course || null,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.detail || 'Registration failed');
                return;
            }
            setSuccess(true);
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendOtp = async () => {
        if (!form.phone || form.phone.length < 10) {
            setPhoneError('Please enter a valid 10-digit phone number');
            return;
        }
        setPhoneError('');
        setPhoneSuccess('');
        setPhoneLoading(true);

        try {
            const res = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: form.phone }),
            });
            const data = await res.json();
            if (!res.ok) {
                setPhoneError(data.detail || 'Failed to send OTP.');
                return;
            }
            setPhoneSent(true);
            setPhoneSuccess('SMS sent! Please check your phone.');
        } catch (err: any) {
            console.error("SMS Error:", err);
            setPhoneError('Network error. Failed to send SMS.');
        } finally {
            setPhoneLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length < 6) return;
        setPhoneError('');
        setPhoneSuccess('');
        setPhoneLoading(true);
        try {
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: form.phone, otp: otp }),
            });
            const data = await res.json();
            if (!res.ok) {
                setPhoneError(data.detail || 'Invalid verification code.');
                return;
            }

            setPhoneVerified(true);
            setPhoneSuccess('Phone verified successfully!');
            setPhoneSent(false); // Hide the OTP input box
            setError('');
        } catch (err: any) {
            setPhoneError('Network error. Failed to verify SMS.');
        } finally {
            setPhoneLoading(false);
        }
    };

    const set = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));

    if (success) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', color: '#1a1a2e', fontFamily: 'var(--font-family)', position: 'relative', overflow: 'hidden' }}>
                <header style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '24px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 50 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><img src="/logo.png" alt="AppTechno" style={{ width: '32px', height: '32px', objectFit: 'contain' }} /><span style={{ fontSize: '24px', background: 'linear-gradient(135deg, #0066ff, #3399ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 900 }}>AppTechno Software</span></div>
                    </div>
                    <a href="/" style={{
                        display: 'flex', alignItems: 'center', gap: '8px', color: '#555770', textDecoration: 'none', fontSize: '14px', fontWeight: 600,
                        padding: '8px 16px', borderRadius: '12px', background: '#f5f7fa', border: '1px solid #e2e8f0',
                        transition: 'all 0.2s'
                    }}
                        onMouseOver={(e) => { e.currentTarget.style.color = '#1a1a2e'; e.currentTarget.style.background = '#eef1f6'; }}
                        onMouseOut={(e) => { e.currentTarget.style.color = '#555770'; e.currentTarget.style.background = '#f5f7fa'; }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                        Home
                    </a>
                </header>

                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80vw', height: '80vh', background: 'radial-gradient(ellipse, rgba(0, 102, 255, 0.05) 0%, rgba(255,255,255,0) 50%)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />

                <div style={{
                    textAlign: 'center', maxWidth: '460px', padding: '56px 40px', background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '32px', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)', position: 'relative', zIndex: 10
                }}>
                    <div style={{ fontSize: '72px', marginBottom: '32px', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.08))' }}>🎉</div>
                    <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '16px', color: '#1a1a2e', letterSpacing: '-0.03em' }}>Welcome aboard!</h1>
                    <p style={{ color: '#555770', lineHeight: '1.6', marginBottom: '40px', fontSize: '15px' }}>
                        Your application has been received successfully. You can now log in to the dashboard to complete your onboarding process.
                    </p>
                    <button onClick={() => router.push('/login')} style={{
                        padding: '16px 48px', background: 'linear-gradient(135deg, #0044cc, #0066ff)', color: '#ffffff',
                        border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: 700, cursor: 'pointer',
                        boxShadow: '0 4px 16px rgba(0, 102, 255, 0.25)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 102, 255, 0.35)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 102, 255, 0.25)';
                        }}>
                        Proceed to Login →
                    </button>

                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', color: '#1a1a2e', fontFamily: 'var(--font-family)', position: 'relative', overflow: 'hidden' }}>
            <header style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '24px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 50 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><img src="/logo.png" alt="AppTechno" style={{ width: '32px', height: '32px', objectFit: 'contain' }} /><span style={{ fontSize: '24px', background: 'linear-gradient(135deg, #0066ff, #3399ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 900 }}>AppTechno Software</span></div>
                </div>
                <a href="/" style={{
                    display: 'flex', alignItems: 'center', gap: '8px', color: '#555770', textDecoration: 'none', fontSize: '14px', fontWeight: 600,
                    padding: '8px 16px', borderRadius: '12px', background: '#f5f7fa', border: '1px solid #e2e8f0',
                    transition: 'all 0.2s'
                }}
                    onMouseOver={(e) => { e.currentTarget.style.color = '#1a1a2e'; e.currentTarget.style.background = '#eef1f6'; }}
                    onMouseOut={(e) => { e.currentTarget.style.color = '#555770'; e.currentTarget.style.background = '#f5f7fa'; }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                    Home
                </a>
            </header>

            {/* Decorative Background Elements */}
            <div style={{ position: 'absolute', top: '10%', right: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(0, 102, 255, 0.06) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%', filter: 'blur(80px)' }} />
            <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(255, 184, 0, 0.06) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%', filter: 'blur(100px)' }} />

            <div style={{ width: '100%', maxWidth: '560px', padding: '24px', margin: '20px', position: 'relative', zIndex: 10 }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '20px',
                        background: '#ffffff', border: '1px solid #e2e8f0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 20px',
                        boxShadow: '0 4px 16px rgba(0, 102, 255, 0.1)',
                        overflow: 'hidden', padding: '8px'
                    }}>
                        <img src="/logo.png" alt="AppTechno" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#1a1a2e', margin: '0 0 10px', letterSpacing: '-0.03em' }}>
                        Start Your Journey
                    </h1>
                    <p style={{ color: '#555770', fontSize: '15px', margin: 0, fontWeight: 500 }}>Join the premier tech learning ecosystem</p>
                </div>

                {/* Form Card */}
                <div style={{
                    background: '#ffffff', borderRadius: '32px', padding: '48px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
                }}>
                    {/* Error Alert placed above the form */}
                    {error && (
                        <div style={{
                            background: 'rgba(255, 23, 68, 0.06)', border: '1px solid rgba(255, 23, 68, 0.2)',
                            borderRadius: '16px', padding: '14px', color: '#ff1744', fontSize: '14px',
                            textAlign: 'center', fontWeight: 500, marginBottom: '24px', animation: 'slideDown 0.3s ease-out'
                        }}>
                            {error}
                        </div>
                    )}


                    <style jsx>{`
                        @keyframes slideDown {
                            from { opacity: 0; transform: translateY(-10px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                        .input-floating {
                            width: 100%; padding: 16px; border-radius: 16px; border: 1px solid #e2e8f0;
                            background: #f5f7fa; color: #1a1a2e; font-size: 15px; outline: none;
                            box-sizing: border-box; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                            box-shadow: inset 0 1px 2px rgba(0,0,0,0.04);
                        }
                        .input-floating:focus {
                            border-color: #0066ff; background: #ffffff;
                            box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.12), inset 0 1px 2px rgba(0,0,0,0.04);
                        }
                        .input-floating::placeholder {
                            color: #8e8ea0;
                        }
                    `}</style>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: form.name ? '#0066ff' : '#555770', marginBottom: '8px', transition: 'color 0.2s' }}>Full Name *</label>
                            <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Type your full name..." className="input-floating" />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: form.email ? '#0066ff' : '#555770', marginBottom: '8px', transition: 'color 0.2s' }}>Email Address *</label>
                            <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="Type your email address..." className="input-floating" />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: form.phone ? '#0066ff' : '#555770', marginBottom: '8px', transition: 'color 0.2s' }}>Phone</label>
                                <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="Optional" className="input-floating" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: form.course ? '#0066ff' : '#555770', marginBottom: '8px', transition: 'color 0.2s' }}>Interested Curriculum</label>
                                <select value={form.course} onChange={e => set('course', e.target.value)} className="input-floating" style={{ appearance: 'none' }}>
                                    <option value="" disabled style={{ color: '#8e8ea0' }}>Select a track (optional)</option>
                                    {courses.map(c => <option key={c} value={c} style={{ color: '#1a1a2e', background: '#fff' }}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: form.password ? '#0066ff' : '#555770', marginBottom: '8px', transition: 'color 0.2s' }}>Password *</label>
                                <div style={{ position: 'relative' }}>
                                    <input required type={showPassword ? "text" : "password"} value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min. 6 chars"
                                        className="input-floating" style={{ paddingRight: '48px' }} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#8e8ea0', cursor: 'pointer', padding: '4px', fontSize: '18px', transition: 'color 0.2s' }}
                                        onMouseOver={(e) => e.currentTarget.style.color = '#1a1a2e'}
                                        onMouseOut={(e) => e.currentTarget.style.color = '#8e8ea0'}
                                    >
                                        {showPassword ? '👁️' : '👁️‍🗨️'}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: form.confirmPassword ? '#0066ff' : '#555770', marginBottom: '8px', transition: 'color 0.2s' }}>Confirm Password *</label>
                                <div style={{ position: 'relative' }}>
                                    <input required type={showConfirmPassword ? "text" : "password"} value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} placeholder="Re-type password"
                                        className="input-floating" style={{ paddingRight: '48px' }} />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#8e8ea0', cursor: 'pointer', padding: '4px', fontSize: '18px', transition: 'color 0.2s' }}
                                        onMouseOver={(e) => e.currentTarget.style.color = '#1a1a2e'}
                                        onMouseOut={(e) => e.currentTarget.style.color = '#8e8ea0'}
                                    >
                                        {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} style={{
                            width: '100%', padding: '16px', marginTop: '16px',
                            background: 'linear-gradient(135deg, #0044cc, #0066ff)',
                            color: '#ffffff', border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: 700,
                            cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1,
                            boxShadow: '0 4px 16px rgba(0, 102, 255, 0.25)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', letterSpacing: '0.01em',
                        }}
                            onMouseOver={(e) => {
                                if (!loading) {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 102, 255, 0.35)';
                                }
                            }}
                            onMouseOut={(e) => {
                                if (!loading) {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 102, 255, 0.25)';
                                }
                            }}>
                            {loading ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span> Creating Account...
                                </div>
                            ) : 'Submit Application →'}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '14px', color: '#555770', fontWeight: 500 }}>
                        Already enrolled?{' '}
                        <a href="/login" style={{
                            color: '#0066ff', textDecoration: 'none', fontWeight: 600,
                            borderBottom: '1px solid transparent', transition: 'border-color 0.2s', paddingBottom: '2px'
                        }} onMouseOver={e => e.currentTarget.style.borderColor = '#0066ff'} onMouseOut={e => e.currentTarget.style.borderColor = 'transparent'}>
                            Log in here
                        </a>
                    </div>
                </div>

            </div>
        </div>
    );
}
