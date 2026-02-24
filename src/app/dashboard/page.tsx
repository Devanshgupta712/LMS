'use client';

import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api';
import { getStoredUser } from '@/lib/api';

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
        <div className="animate-in">
            <div style={{
                background: 'var(--gradient-primary)',
                borderRadius: 'var(--border-radius-lg)',
                padding: '40px 32px',
                marginBottom: '32px',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-md)'
            }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.02em' }}>
                        Welcome back, {name.split(' ')[0]} 👋
                    </h1>
                    <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>Here&apos;s what&apos;s happening today at Apptech Careers</p>
                </div>
                {/* Decorative background circles */}
                <div style={{ position: 'absolute', right: '-10%', top: '-50%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(40px)' }} />
                <div style={{ position: 'absolute', right: '10%', bottom: '-50%', width: '200px', height: '200px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(30px)' }} />
            </div>

            {/* Stats Grid */}
            <div className="grid-4 mb-24">
                {role === 'SUPER_ADMIN' || role === 'ADMIN' ? (
                    <>
                        <div className="stat-card primary">
                            <div className="stat-icon primary">🎓</div>
                            <div className="stat-info">
                                <h3>Total Students</h3>
                                <div className="stat-value">{stats?.total_students || 0}</div>
                            </div>
                        </div>
                        <div className="stat-card accent">
                            <div className="stat-icon accent">📚</div>
                            <div className="stat-info">
                                <h3>Active Courses</h3>
                                <div className="stat-value">{stats?.total_courses || 0}</div>
                            </div>
                        </div>
                        <div className="stat-card success">
                            <div className="stat-icon success">👥</div>
                            <div className="stat-info">
                                <h3>Batches</h3>
                                <div className="stat-value">{stats?.total_batches || 0}</div>
                            </div>
                        </div>
                        <div className="stat-card danger">
                            <div className="stat-icon danger">🎯</div>
                            <div className="stat-info">
                                <h3>Active Leads</h3>
                                <div className="stat-value">{stats?.total_leads || 0}</div>
                            </div>
                        </div>
                    </>
                ) : role === 'TRAINER' ? (
                    <>
                        <div className="stat-card primary">
                            <div className="stat-icon primary">👥</div>
                            <div className="stat-info">
                                <h3>My Batches</h3>
                                <div className="stat-value">0</div>
                            </div>
                        </div>
                        <div className="stat-card accent">
                            <div className="stat-icon accent">✅</div>
                            <div className="stat-info">
                                <h3>Today&apos;s Attendance</h3>
                                <div className="stat-value">0%</div>
                            </div>
                        </div>
                        <div className="stat-card success">
                            <div className="stat-icon success">🏗️</div>
                            <div className="stat-info">
                                <h3>Active Projects</h3>
                                <div className="stat-value">0</div>
                            </div>
                        </div>
                        <div className="stat-card danger">
                            <div className="stat-icon danger">⚠️</div>
                            <div className="stat-info">
                                <h3>Pending Tasks</h3>
                                <div className="stat-value">0</div>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="stat-card primary">
                            <div className="stat-icon primary">📚</div>
                            <div className="stat-info">
                                <h3>My Courses</h3>
                                <div className="stat-value">0</div>
                            </div>
                        </div>
                        <div className="stat-card accent">
                            <div className="stat-icon accent">✅</div>
                            <div className="stat-info">
                                <h3>Attendance</h3>
                                <div className="stat-value">0%</div>
                            </div>
                        </div>
                        <div className="stat-card success">
                            <div className="stat-icon success">📝</div>
                            <div className="stat-info">
                                <h3>Tasks Done</h3>
                                <div className="stat-value">0</div>
                            </div>
                        </div>
                        <div className="stat-card danger">
                            <div className="stat-icon danger">⏰</div>
                            <div className="stat-info">
                                <h3>Pending</h3>
                                <div className="stat-value">0</div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Quick Actions + Recent */}
            <div className="grid-2 mt-8">
                <div className="card-glass">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>Quick Actions</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {(role === 'SUPER_ADMIN' || role === 'ADMIN') && (
                            <>
                                <a href="/admin/courses" className="sidebar-link" style={{ borderRadius: '12px', background: 'var(--bg-secondary)', padding: '14px 16px', border: '1px solid var(--border)' }}>
                                    <span className="link-icon">📚</span>
                                    <span style={{ fontWeight: 600 }}>Manage Courses</span>
                                </a>
                                <a href="/admin/batches" className="sidebar-link" style={{ borderRadius: '12px', background: 'var(--bg-secondary)', padding: '14px 16px', border: '1px solid var(--border)' }}>
                                    <span className="link-icon">👥</span>
                                    <span style={{ fontWeight: 600 }}>Manage Batches</span>
                                </a>
                                <a href="/admin/students" className="sidebar-link" style={{ borderRadius: '12px', background: 'var(--bg-secondary)', padding: '14px 16px', border: '1px solid var(--border)' }}>
                                    <span className="link-icon">🎓</span>
                                    <span style={{ fontWeight: 600 }}>Manage Students</span>
                                </a>
                                <a href="/marketing/leads" className="sidebar-link" style={{ borderRadius: '12px', background: 'var(--bg-secondary)', padding: '14px 16px', border: '1px solid var(--border)' }}>
                                    <span className="link-icon">🎯</span>
                                    <span style={{ fontWeight: 600 }}>Manage Leads</span>
                                </a>
                            </>
                        )}
                        {role === 'TRAINER' && (
                            <>
                                <a href="/training/attendance" className="sidebar-link" style={{ borderRadius: '12px', background: 'var(--bg-secondary)', padding: '14px 16px', border: '1px solid var(--border)' }}>
                                    <span className="link-icon">✅</span>
                                    <span style={{ fontWeight: 600 }}>Mark Attendance</span>
                                </a>
                                <a href="/training/projects" className="sidebar-link" style={{ borderRadius: '12px', background: 'var(--bg-secondary)', padding: '14px 16px', border: '1px solid var(--border)' }}>
                                    <span className="link-icon">🏗️</span>
                                    <span style={{ fontWeight: 600 }}>Manage Projects</span>
                                </a>
                            </>
                        )}
                        {role === 'STUDENT' && (
                            <>
                                <a href="/placement/jobs" className="sidebar-link" style={{ borderRadius: '12px', background: 'var(--bg-secondary)', padding: '14px 16px', border: '1px solid var(--border)' }}>
                                    <span className="link-icon">💼</span>
                                    <span style={{ fontWeight: 600 }}>Browse Jobs</span>
                                </a>
                            </>
                        )}
                    </div>
                </div>

                <div className="card-glass">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>Recent Activity</h3>
                    <div className="empty-state" style={{ padding: '60px 16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px dashed var(--border-light)' }}>
                        <div className="empty-icon" style={{ fontSize: '2.5rem', marginBottom: '16px', opacity: 0.5 }}>�</div>
                        <p className="text-sm text-muted">No recent activity yet. Your feed will appear here.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
