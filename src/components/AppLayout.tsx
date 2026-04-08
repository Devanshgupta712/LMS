'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import { getStoredUser, clearToken, apiGet, apiPost } from '@/lib/api';
import ChatbotFAQ from './ChatbotFAQ';
import { useTheme } from '@/components/ThemeProvider';

const PUBLIC_PATHS = [
    '/', '/login', '/register', '/unauthorized',
    '/login/admin', '/login/trainer', '/login/marketing', '/login/student',
    '/about', '/features', '/courses', '/contact'
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();
    const [user, setUser] = useState<any>(null);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showNotifs, setShowNotifs] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Scroll reveal observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => entries.forEach(e => { if (e.isIntersecting) (e.target as HTMLElement).classList.add('active'); }),
            { threshold: 0.08 }
        );
        const els = document.querySelectorAll('.reveal-on-scroll');
        els.forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, [pathname]);

    useEffect(() => {
        const stored = getStoredUser();
        if (stored) {
            setUser(stored);
            apiGet('/api/auth/notifications')
                .then(data => {
                    if (Array.isArray(data)) setNotifications(data);
                })
                .catch(() => { });
        } else if (!PUBLIC_PATHS.includes(pathname)) {
            router.push('/');
        }
    }, [pathname, router]);

    if (PUBLIC_PATHS.includes(pathname)) {
        return <>{children}</>;
    }

    if (!user) {
        return null;
    }

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="app-layout" style={{ background: 'var(--bg-primary)' }}>
            <Sidebar userRole={user.role} userName={user.name} userEmail={user.email} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            
            <main className="main-content">
                <header style={{ 
                    padding: '16px 24px', 
                    background: '#fff',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: '32px',
                    position: 'sticky',
                    top: '0',
                    zIndex: 900,
                    borderBottom: '1px solid var(--border)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
                        <button 
                            className="hover-lift" 
                            onClick={() => setSidebarOpen(true)} 
                            style={{ 
                                display: 'none', 
                                background: 'var(--bg-tertiary)', 
                                border: 'none', 
                                padding: '8px', 
                                borderRadius: '10px', 
                                cursor: 'pointer',
                                color: 'var(--text-primary)'
                            }}
                        >
                            ☰
                        </button>
                        
                        <div style={{ 
                            position: 'relative', 
                            maxWidth: '400px', 
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            <span style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)' }}>🔍</span>
                            <input 
                                type="text" 
                                placeholder="Search everything..." 
                                style={{ 
                                    width: '100%', 
                                    padding: '10px 14px 10px 42px', 
                                    borderRadius: '8px', 
                                    border: '1px solid var(--border)', 
                                    background: 'var(--bg-secondary)', 
                                    color: 'var(--text-primary)',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    outline: 'none',
                                    transition: 'all 0.2s ease'
                                }} 
                                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        {/* Notifications */}
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => {
                                    const opening = !showNotifs;
                                    setShowNotifs(opening);
                                    if (opening && unreadCount > 0) {
                                        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                                        apiPost('/api/auth/notifications/read-all', {}).catch(() => { });
                                    }
                                }}
                                style={{ 
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '8px',
                                    background: 'none', 
                                    border: 'none', 
                                    cursor: 'pointer', 
                                    position: 'relative', 
                                    fontSize: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--text-secondary)'
                                }}
                            >
                                🔔
                                {unreadCount > 0 && (
                                    <span style={{
                                        position: 'absolute', top: '8px', right: '8px',
                                        width: '8px', height: '8px',
                                        background: 'var(--danger)', borderRadius: '50%', border: '2px solid #fff'
                                    }} />
                                )}
                            </button>

                            {showNotifs && (
                                <div
                                    onMouseLeave={() => setShowNotifs(false)}
                                    style={{
                                        position: 'absolute', top: 'calc(100% + 12px)', right: '0',
                                        width: '320px', borderRadius: '12px', border: '1px solid var(--border)',
                                        background: '#fff', boxShadow: 'var(--shadow-lg)',
                                        zIndex: 1000, overflow: 'hidden'
                                    }}
                                >
                                    <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Notifications</h3>
                                    </div>
                                    <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                                        {notifications.length === 0 ? (
                                            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No notifications</p>
                                            </div>
                                        ) : (
                                            notifications.slice(0, 5).map(n => (
                                                <div
                                                    key={n.id}
                                                    style={{
                                                        padding: '16px', 
                                                        borderBottom: '1px solid var(--border)',
                                                        background: n.read ? 'transparent' : 'var(--primary-glow)', 
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{n.title}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{n.message}</div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '12px', borderLeft: '1px solid var(--border)' }}>
                            <div style={{ textAlign: 'right' }} className="desktop-only">
                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{user.role}</div>
                            </div>
                            <div style={{ 
                                width: '36px', 
                                height: '36px', 
                                borderRadius: '8px', 
                                background: 'var(--primary)', 
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '16px',
                                fontWeight: 700
                            }}>
                                {user.name.charAt(0)}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="reveal-on-scroll">
                    {children}
                </div>
            </main>
            <ChatbotFAQ />
        </div>
    );
}
