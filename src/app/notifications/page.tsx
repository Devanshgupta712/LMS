'use client';

import { useState, useEffect } from 'react';
import { apiGet, apiDelete, getStoredUser } from '@/lib/api';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string>('');

    useEffect(() => {
        const user = getStoredUser();
        if (user) {
            setUserRole(user.role);
        }
        loadNotifications();
    }, []);

    const loadNotifications = () => {
        setLoading(true);
        apiGet('/api/admin/notifications')
            .then(setNotifications)
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    const handleDeleteAll = async () => {
        if (!confirm('Are you sure you want to completely delete all historical notifications? This cannot be undone.')) return;
        try {
            await apiDelete('/api/admin/notifications/all');
            loadNotifications();
        } catch (err: any) {
            alert(err.message || 'Failed to delete notifications');
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Delete this notification?')) return;
        try {
            await apiDelete(`/api/admin/notifications/${id}`);
            loadNotifications();
        } catch (err: any) {
            alert(err.message || 'Failed to delete notification');
        }
    };

    const [selectedNotification, setSelectedNotification] = useState<any | null>(null);

    return (
        <div className="animate-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><h1 className="page-title">Notifications</h1><p className="page-subtitle">System notifications and alerts</p></div>
                {(userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn btn-error" onClick={handleDeleteAll}>🗑️ Clear All</button>
                        <a href="/admin/notifications" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                            + Send Notification
                        </a>
                    </div>
                )}
            </div>

            <div className="card">
                {loading ? <p>Loading...</p> : notifications.length === 0 ? (
                    <div className="empty-state" style={{ padding: '60px 16px' }}>
                        <div className="empty-icon">✅</div>
                        <h3>No Notifications</h3>
                        <p className="text-sm text-muted">The notification center is completely empty.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {notifications.map((n: any) => (
                            <div
                                key={n.id}
                                onClick={() => setSelectedNotification(n)}
                                style={{
                                    display: 'flex', gap: '12px', padding: '12px',
                                    background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
                                    transition: 'background 0.2s', alignItems: 'center'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                            >
                                <span style={{ fontSize: '20px' }}>🔔</span>
                                <div style={{ flex: 1 }}>
                                    <strong>{n.title}</strong>
                                    <p className="text-sm text-muted" style={{ margin: '4px 0 0', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.message}</p>
                                </div>
                                <span className="text-sm text-muted">{new Date(n.created_at).toLocaleDateString()}</span>
                                {(userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') && (
                                    <button
                                        onClick={(e) => handleDelete(e, n.id)}
                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px', padding: '4px' }}
                                        title="Delete this notification"
                                    >
                                        🗑️
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedNotification && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                }} onClick={() => setSelectedNotification(null)}>
                    <div
                        style={{
                            background: '#1e293b', width: '90%', maxWidth: '500px',
                            borderRadius: '16px', padding: '24px', position: 'relative',
                            border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedNotification(null)}
                            style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}
                        >×</button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🔔</div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{selectedNotification.title}</h3>
                                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                                    {new Date(selectedNotification.created_at).toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', color: '#cbd5e1', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                            {selectedNotification.message}
                        </div>
                        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn btn-primary" onClick={() => setSelectedNotification(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
