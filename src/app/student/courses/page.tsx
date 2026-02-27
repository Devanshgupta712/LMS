'use client';

import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api';

export default function StudentCoursesPage() {
    const [courses, setCourses] = useState<any[]>([]);
    const [timeLog, setTimeLog] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiGet('/api/auth/my-courses').then(setCourses).catch(() => { });
        apiGet('/api/training/time-tracking?date=' + new Date().toISOString().split('T')[0])
            .then(data => {
                if (data.logs && data.logs.length > 0) {
                    setTimeLog(data.logs[0]);
                }
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="animate-in">
            <div className="page-header"><div><h1 className="page-title">My Courses</h1><p className="page-subtitle">Your enrolled courses and fee details</p></div></div>

            {/* Daily Punch Summary Widget */}
            <div className="card-glass mb-24" style={{
                padding: '20px 24px',
                background: 'linear-gradient(90deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.8))',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid var(--border)',
                borderRadius: '16px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontSize: '28px', background: 'rgba(99, 102, 241, 0.1)', padding: '12px', borderRadius: '12px' }}>🕒</div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '15px', color: '#94a3b8' }}>Today's Work Hours</h3>
                        <p style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 700 }}>
                            {timeLog ? (
                                timeLog.logout_time ? (
                                    `${Math.floor(timeLog.total_minutes / 60)}h ${timeLog.total_minutes % 60}m logged`
                                ) : (
                                    <span style={{ color: 'var(--success)' }}>⚡ Active Session (since {new Date(timeLog.login_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                                )
                            ) : 'No sessions recorded today'}
                        </p>
                    </div>
                </div>
                <a href="/student/time-tracking" className="btn btn-sm btn-ghost" style={{ padding: '8px 16px' }}>View History →</a>
            </div>

            <div className="card">
                {loading ? <p>Loading...</p> : courses.length === 0 ? (
                    <div className="empty-state"><div className="empty-icon">📚</div><h3>No registered courses found</h3></div>
                ) : (
                    <div className="grid-3">{courses.map((c: any) => (
                        <div key={c.id} className="card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ height: '8px', background: 'linear-gradient(90deg, #0066ff, #0066ff)', borderRadius: '4px 4px 0 0', margin: '-16px -16px 16px' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <h3 style={{ margin: '0 0 8px', fontSize: '16px' }}>{c.name}</h3>
                                <span className={`badge ${c.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>{c.status}</span>
                            </div>
                            <p className="text-sm text-muted" style={{ margin: '0 0 12px' }}>{c.description}</p>
                            <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
                                <span>⏱️ {c.duration || '-'}</span>
                                <span>📅 {c.registration_date ? new Date(c.registration_date).toLocaleDateString() : '-'}</span>
                            </div>

                            {/* Fee Information Block */}
                            <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                                    <span style={{ color: '#94a3b8' }}>Total Fee:</span>
                                    <span style={{ fontWeight: 600 }}>₹{c.fee_total?.toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                                    <span style={{ color: '#94a3b8' }}>Fee Paid:</span>
                                    <span style={{ fontWeight: 600, color: '#4ade80' }}>₹{c.fee_paid?.toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingTop: '8px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                                    <span style={{ color: '#94a3b8' }}>Balance:</span>
                                    <span style={{ fontWeight: 600, color: (c.fee_total - c.fee_paid) > 0 ? '#f87171' : '#4ade80' }}>
                                        ₹{(c.fee_total - c.fee_paid).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}</div>
                )}
            </div>
        </div>
    );
}
