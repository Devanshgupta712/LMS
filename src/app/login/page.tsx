'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser, setToken, setStoredUser } from '@/lib/api';

export default function PortalSelector() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      switch (user.role) {
        case 'SUPER_ADMIN':
        case 'ADMIN':
          router.push('/dashboard');
          break;
        case 'TRAINER':
          router.push('/training/attendance');
          break;
        case 'MARKETER':
          router.push('/marketing/leads');
          break;
        case 'STUDENT':
          router.push('/student/courses');
          break;
        default:
          break;
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || 'Invalid credentials');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setToken(data.access_token);
      setStoredUser(data.user);

      // Route based on role
      switch (data.user.role) {
        case 'SUPER_ADMIN':
        case 'ADMIN':
          router.push('/dashboard');
          break;
        case 'TRAINER':
          router.push('/training/attendance');
          break;
        case 'MARKETER':
          router.push('/marketing/leads');
          break;
        case 'STUDENT':
          router.push('/student/courses');
          break;
        default:
          router.push('/dashboard');
      }
    } catch {
      setError('Connection error. Is the backend running?');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#030014', color: '#fafafa', position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-family)' }}>

      <header style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '24px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><img src="/logo.png" alt="AppTechno" style={{ width: '32px', height: '32px', objectFit: 'contain' }} /><span style={{ fontSize: '20px', background: 'linear-gradient(135deg, #2563eb, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 900 }}>AppTechno Software</span></div>
        </div>
        <a href="/" style={{
          display: 'flex', alignItems: 'center', gap: '8px', color: '#a1a1aa', textDecoration: 'none', fontSize: '14px', fontWeight: 600,
          padding: '8px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
          transition: 'all 0.2s'
        }}
          onMouseOver={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
          onMouseOut={(e) => { e.currentTarget.style.color = '#a1a1aa'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
          Home
        </a>
      </header>

      {/* Decorative Background Elements */}
      <div style={{ position: 'absolute', top: '10%', right: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(26, 79, 160, 0.25) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', filter: 'blur(80px)' }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(237, 170, 30, 0.20) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', filter: 'blur(100px)' }} />

      <div style={{ width: '100%', maxWidth: '560px', padding: '24px', margin: '20px', position: 'relative', zIndex: 10 }}>

        {/* Main Login Card */}
        <div style={{
          background: 'rgba(15, 15, 20, 0.65)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '32px',
          padding: '48px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          position: 'relative', overflow: 'hidden'
        }}>
          {/* Subtle Card Glow */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.5), transparent)' }} />

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '24px',
              background: 'rgba(255,255,255,0.95)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 10px 30px rgba(26, 79, 160, 0.4), inset 0 2px 4px rgba(255,255,255,0.3)',
              position: 'relative', padding: '8px'
            }}>
              <img src="/logo.png" alt="AppTechno Software" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '16px' }} />
            </div>
            <h1 style={{ color: '#ffffff', fontSize: '32px', fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.04em', background: 'linear-gradient(180deg, #ffffff, #a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Welcome back
            </h1>
            <p style={{ color: '#a1a1aa', fontSize: '15px', margin: 0, fontWeight: 500 }}>
              Access your learning dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '16px', padding: '14px', color: '#fca5a5', fontSize: '14px',
                textAlign: 'center', fontWeight: 500, backdropFilter: 'blur(10px)',
                animation: 'slideDown 0.3s ease-out'
              }}>
                {error}
              </div>
            )}

            <style jsx>{`
              @keyframes slideDown {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>

            <div style={{ position: 'relative' }}>
              <label style={{
                color: email ? '#2563eb' : '#e2e8f0', fontSize: '13px', fontWeight: 600, display: 'block',
                marginBottom: '8px', transition: 'color 0.2s'
              }}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                style={{
                  width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)',
                  background: 'rgba(0, 0, 0, 0.4)', color: '#ffffff', fontSize: '15px', outline: 'none',
                  boxSizing: 'border-box', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#2563eb';
                  e.currentTarget.style.background = 'rgba(0,0,0,0.6)';
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.15), inset 0 2px 4px rgba(0,0,0,0.5)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.background = 'rgba(0,0,0,0.4)';
                  e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.5)';
                }}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <label style={{
                color: password ? '#2563eb' : '#e2e8f0', fontSize: '13px', fontWeight: 600, display: 'block',
                marginBottom: '8px', transition: 'color 0.2s'
              }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                  style={{
                    width: '100%', padding: '16px 48px 16px 16px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)',
                    background: 'rgba(0, 0, 0, 0.4)', color: '#ffffff', fontSize: '15px', outline: 'none',
                    boxSizing: 'border-box', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#2563eb';
                    e.currentTarget.style.background = 'rgba(0,0,0,0.6)';
                    e.currentTarget.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.15), inset 0 2px 4px rgba(0,0,0,0.5)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.background = 'rgba(0,0,0,0.4)';
                    e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.5)';
                  }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: '4px', fontSize: '18px', transition: 'color 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.color = '#e2e8f0'}
                  onMouseOut={(e) => e.currentTarget.style.color = '#71717a'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '16px', borderRadius: '16px', border: 'none',
              background: 'linear-gradient(135deg, #1a4fa0, #2563eb)', color: '#ffffff',
              fontSize: '16px', fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
              marginTop: '12px', opacity: loading ? 0.7 : 1,
              boxShadow: '0 8px 25px rgba(26, 79, 160, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', letterSpacing: '0.01em',
              position: 'relative', overflow: 'hidden'
            }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 15px 35px rgba(26, 79, 160, 0.5), inset 0 1px 0 rgba(255,255,255,0.3)';
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(26, 79, 160, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)';
                }
              }}
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span> Authenticating...
                </div>
              ) : 'Access Dashboard'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '14px', color: '#a1a1aa', fontWeight: 500 }}>
            Don&apos;t have an account?{' '}
            <a href="/register" style={{
              color: '#edaa1e', textDecoration: 'none', fontWeight: 600,
              borderBottom: '1px solid transparent', transition: 'border-color 0.2s', paddingBottom: '2px'
            }} onMouseOver={e => e.currentTarget.style.borderColor = '#edaa1e'} onMouseOut={e => e.currentTarget.style.borderColor = 'transparent'}>
              Apply as Student
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
