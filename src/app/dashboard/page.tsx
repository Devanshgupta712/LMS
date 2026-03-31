'use client';

import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api';
import { getStoredUser } from '@/lib/api';
import Link from 'next/link';

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        const u = getStoredUser();
        setUser(u);
        if (u) {
            if (u.role === 'STUDENT') {
                window.location.href = '/student/courses';
                return;
            }
            if (u.role === 'SUPER_ADMIN' || u.role === 'ADMIN') {
                apiGet('/api/admin/dashboard').then(setStats).catch(() => { });
            }
        }
    }, []);

    const role = user?.role || 'STUDENT';
    const name = user?.name || 'User';

    return (
        <div className="reveal-on-scroll active">
            {/* Unified Welcome Banner */}
            <div className="animate-stripe" style={{
                borderRadius: '24px',
                padding: '56px 40px',
                marginBottom: '40px',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-premium)'
            }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ 
                        display: 'inline-flex', 
                        padding: '6px 12px', 
                        background: 'rgba(255,255,255,0.15)', 
                        backdropFilter: 'blur(10px)',
                        borderRadius: '100px', 
                        fontSize: '12px', 
                        fontWeight: 600, 
                        marginBottom: '20px',
                        letterSpacing: '0.05em'
                    }}>
                        ✨ Welcome back, {role === 'ADMIN' ? 'Administrator' : 'Trainer'}
                    </div>
                    <h1 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 600, marginBottom: '12px', letterSpacing: '-0.04em', lineHeight: 1 }}>
                        Hello, {name.split(' ')[0]}
                    </h1>
                    <p style={{ fontSize: '18px', opacity: 0.9, fontWeight: 500, maxWidth: '600px' }}>
                        Everything looks good today. You have {unreadCount > 0 ? unreadCount : 'no'} unread notifications.
                    </p>
                </div>
                
                {/* Visual Glass Element */}
                <div className="glass-premium" style={{ 
                    position: 'absolute', 
                    right: '40px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    width: '180px', 
                    height: '180px', 
                    borderRadius: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '64px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)'
                }}>
                    ⚡
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid-4" style={{ marginBottom: '40px' }}>
                {(role === 'SUPER_ADMIN' || role === 'ADMIN') && (
                    <>
                        <Link href="/admin/students" className="glass-premium shadow-premium hover-lift" style={{ padding: '24px', borderRadius: '20px', color: 'inherit' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                <div style={{ width: '48px', height: '48px', background: 'var(--primary-glow)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🎓</div>
                                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)' }}>Students</span>
                            </div>
                            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)' }}>{stats?.total_students || 0}</div>
                        </Link>
                        <Link href="/admin/courses" className="glass-premium shadow-premium hover-lift" style={{ padding: '24px', borderRadius: '20px', color: 'inherit' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                <div style={{ width: '48px', height: '48px', background: 'hsla(280, 80%, 60%, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>📚</div>
                                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)' }}>Courses</span>
                            </div>
                            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)' }}>{stats?.total_courses || 0}</div>
                        </Link>
                        <Link href="/admin/batches" className="glass-premium shadow-premium hover-lift" style={{ padding: '24px', borderRadius: '20px', color: 'inherit' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                <div style={{ width: '48px', height: '48px', background: 'hsla(160, 80%, 60%, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>👥</div>
                                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)' }}>Batches</span>
                            </div>
                            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)' }}>{stats?.total_batches || 0}</div>
                        </Link>
                        <Link href="/marketing/leads" className="glass-premium shadow-premium hover-lift" style={{ padding: '24px', borderRadius: '20px', color: 'inherit' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                <div style={{ width: '48px', height: '48px', background: 'hsla(0, 80%, 60%, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🎯</div>
                                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)' }}>Leads</span>
                            </div>
                            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)' }}>{stats?.total_leads || 0}</div>
                        </Link>
                    </>
                )}
            </div>

            <div className="grid-2">
                {/* Actions Hub */}
                <div className="glass-premium" style={{ padding: '32px', borderRadius: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', letterSpacing: '-0.02em' }}>Quick Actions Hub</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                        {(role === 'SUPER_ADMIN' || role === 'ADMIN') && (
                            <>
                                {[
                                    { label: 'Platform Settings', href: '/admin/settings', icon: '⚙️' },
                                    { label: 'Security Reports', href: '/reports', icon: '🛡️' },
                                    { label: 'Broadcast Message', href: '/notifications', icon: '📢' }
                                ].map((action, i) => (
                                    <Link key={i} href={action.href} className="hover-lift" style={{
                                        padding: '16px',
                                        borderRadius: '16px',
                                        background: 'var(--bg-tertiary)',
                                        border: '1px solid var(--border)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px',
                                        color: 'inherit',
                                        fontWeight: 700
                                    }}>
                                        <span style={{ fontSize: '20px' }}>{action.icon}</span>
                                        <span>{action.label}</span>
                                    </Link>
                                ))}
                            </>
                        )}
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="glass-premium" style={{ padding: '32px', borderRadius: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}>Live Activity Feed</h3>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)' }}>Real-time</span>
                    </div>
                    
                    <div style={{ 
                        padding: '60px 24px', 
                        background: 'var(--bg-tertiary)', 
                        borderRadius: '20px', 
                        textAlign: 'center',
                        border: '1px dashed var(--border)'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📊</div>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', margin: 0 }}>
                            No activity recorded in the last 24 hours.
                        </p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', opacity: 0.7, marginTop: '8px' }}>
                            New logs will appear here as users interact with the system.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper for local mock unread count
const unreadCount = 0;
