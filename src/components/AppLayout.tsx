'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import { getStoredUser, clearToken, apiGet, apiPost } from '@/lib/api';
import ChatbotFAQ from './ChatbotFAQ';

const PUBLIC_PATHS = ['/', '/login', '/register', '/unauthorized',
    '/login/admin', '/login/trainer', '/login/marketing', '/login/student'];

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    // Notification state
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showNotifs, setShowNotifs] = useState(false);
    // Mobile sidebar state
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const stored = getStoredUser();
        if (stored) {
            setUser(stored);
            // Fetch notifications securely using the API utility
            apiGet('/api/auth/notifications')
                .then(data => {
                    if (Array.isArray(data)) setNotifications(data);
                })
                .catch(() => { });
        } else if (!PUBLIC_PATHS.includes(pathname)) {
            router.push('/');
        }
    }, [pathname, router]);

    // Pages that don't need the layout
    if (PUBLIC_PATHS.includes(pathname)) {
        return <>{children}</>;
    }

    if (!user) {
        return null; // Loading
    }

    const handleLogout = () => {
        clearToken();
        router.push('/');
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="app-layout">
            <Sidebar userRole={user.role} userName={user.name} userEmail={user.email} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="main-content">
                <div className="top-bar">
                    <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
                        ☰
                    </button>
                    <div className="search-box">
                        <span className="search-icon">🔍</span>
                        <input type="text" placeholder="Search courses, students, reports..." />
                    </div>
                    <div className="top-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

                        {/* Notifications Dropdown */}
                        <div style={{ position: 'relative' }}>
                            <button
                                className="notification-btn"
                                title="Notifications"
                                onClick={() => {
                                    const opening = !showNotifs;
                                    setShowNotifs(opening);
                                    if (opening && unreadCount > 0) {
                                        // Optimistically clear badges
                                        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                                        // Update database
                                        apiPost('/api/auth/notifications/read-all', {}).catch(() => { });
                                    }
                                }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', fontSize: '20px' }}
                            >
                                🔔
                                {unreadCount > 0 && (
                                    <span className="notification-badge" style={{
                                        position: 'absolute', top: '-5px', right: '-5px',
                                        background: '#ef4444', color: 'white', fontSize: '10px',
                                        padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold'
                                    }}>
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {showNotifs && (
                                <div
                                    onMouseLeave={() => setShowNotifs(false)}
                                    style={{
                                        position: 'absolute', top: '100%', right: '0',
                                        width: '320px', background: '#1e293b', border: '1px solid #334155',
                                        borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                                        zIndex: 50, marginTop: '8px', overflow: 'hidden'
                                    }}
                                >
                                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Notifications</h3>
                                    </div>
                                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        {notifications.length === 0 ? (
                                            <p style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', margin: 0, fontSize: '14px' }}>No notifications</p>
                                        ) : (
                                            notifications.slice(0, 5).map(n => (
                                                <div
                                                    key={n.id}
                                                    style={{
                                                        padding: '12px 16px', borderBottom: '1px solid #334155',
                                                        background: n.read ? 'transparent' : 'rgba(0, 102, 255, 0.1)', cursor: 'pointer'
                                                    }}
                                                    onClick={() => {
                                                        const link = ['SUPER_ADMIN', 'ADMIN'].includes(user.role) ? '/notifications' : `/${user.role.toLowerCase()}/notifications`;
                                                        window.location.href = link;
                                                    }}
                                                >
                                                    <div style={{ fontSize: '13px', fontWeight: n.read ? 500 : 700, marginBottom: '4px' }}>{n.title}</div>
                                                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{n.message}</div>
                                                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                                                        {new Date(n.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div style={{ padding: '8px', textAlign: 'center', background: '#0f172a' }}>
                                        <a
                                            href={['SUPER_ADMIN', 'ADMIN'].includes(user.role) ? '/notifications' : `/${user.role.toLowerCase()}/notifications`}
                                            style={{ color: '#0066ff', fontSize: '13px', textDecoration: 'none', fontWeight: 500 }}
                                        >
                                            View all notifications
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    </div>
                </div>
                {children}
            </main>
            <ChatbotFAQ />
        </div>
    );
}
