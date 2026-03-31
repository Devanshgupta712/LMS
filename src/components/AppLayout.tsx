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
                <header className="glass-premium" style={{ 
                    padding: '12px 24px', 
                    borderRadius: '20px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: '32px',
                    position: 'sticky',
                    top: '20px',
                    zIndex: 900,
                    border: '1px solid var(--border)'
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
                                    borderRadius: '12px', 
                                    border: '1px solid var(--border)', 
                                    background: 'var(--bg-tertiary)', 
                                    color: 'var(--text-primary)',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    outline: 'none',
                                    transition: 'all 0.2s ease'
                                }} 
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Theme Toggle */}
                        <button 
                            onClick={toggleTheme}
                            className="hover-lift"
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '12px',
                                background: 'var(--bg-tertiary)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                fontSize: '18px'
                            }}
                        >
                            {theme === 'dark' ? '☀️' : '🌙'}
                        </button>

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
                                className="hover-lift"
                                style={{ 
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '12px',
                                    background: 'var(--bg-tertiary)', 
                                    border: '1px solid var(--border)', 
                                    cursor: 'pointer', 
                                    position: 'relative', 
                                    fontSize: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                🔔
                                {unreadCount > 0 && (
                                    <span style={{
                                        position: 'absolute', top: '8px', right: '8px',
                                        width: '8px', height: '8px',
                                        background: '#ef4444', borderRadius: '50%', border: '2px solid var(--bg-tertiary)'
                                    }} />
                                )}
                            </button>

                            {showNotifs && (
                                <div
                                    onMouseLeave={() => setShowNotifs(false)}
                                    className="glass-premium"
                                    style={{
                                        position: 'absolute', top: 'calc(100% + 12px)', right: '0',
                                        width: '320px', borderRadius: '16px', border: '1px solid var(--border)',
                                        zIndex: 1000, overflow: 'hidden'
                                    }}
                                >
                                    <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Notifications</h3>
                                        {unreadCount > 0 && <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)' }}>{unreadCount} New</span>}
                                    </div>
                                    <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                                        {notifications.length === 0 ? (
                                            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                                                <div style={{ fontSize: '24px', marginBottom: '12px' }}>📭</div>
                                                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '13px', fontWeight: 600 }}>All caught up!</p>
                                            </div>
                                        ) : (
                                            notifications.slice(0, 5).map(n => (
                                                <div
                                                    key={n.id}
                                                    style={{
                                                        padding: '16px', 
                                                        borderBottom: '1px solid var(--border)',
                                                        background: n.read ? 'transparent' : 'var(--primary-glow)', 
                                                        cursor: 'pointer',
                                                        transition: 'background 0.2s'
                                                    }}
                                                    onClick={() => {
                                                        const link = ['SUPER_ADMIN', 'ADMIN'].includes(user.role) ? '/notifications' : `/${user.role.toLowerCase()}/notifications`;
                                                        window.location.href = link;
                                                    }}
                                                >
                                                    <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-primary)' }}>{n.title}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{n.message}</div>
                                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px', fontWeight: 600 }}>
                                                        {new Date(n.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div style={{ padding: '12px', textAlign: 'center', background: 'var(--bg-tertiary)' }}>
                                        <a
                                            href={['SUPER_ADMIN', 'ADMIN'].includes(user.role) ? '/notifications' : `/${user.role.toLowerCase()}/notifications`}
                                            style={{ color: 'var(--primary)', fontSize: '12px', textDecoration: 'none', fontWeight: 700 }}
                                        >
                                            View All Activity
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 4px' }} />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 4px 4px 12px' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{user.role}</div>
                            </div>
                            <div style={{ 
                                width: '36px', 
                                height: '36px', 
                                borderRadius: '10px', 
                                background: 'var(--primary)', 
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px'
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
