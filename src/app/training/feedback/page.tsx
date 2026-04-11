'use client';

import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api';

export default function FeedbackPage() {
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { 
        setLoading(true);
        apiGet('/api/sessions/feedback/admin')
            .then(res => setFeedbacks(res || []))
            .catch(() => { })
            .finally(() => setLoading(false)); 
    }, []);

    return (
        <div className="reveal-on-scroll active">
            <div className="page-header">
                <div><h1 className="page-title">Student Feedback</h1><p className="page-subtitle">View and manage student feedback on training</p></div>
            </div>

            <div className="grid-4 mb-24">
                <div className="stat-card primary"><div className="stat-icon primary">💬</div><div className="stat-info"><h3>Total Feedback</h3><div className="stat-value">{feedbacks.length}</div></div></div>
                <div className="stat-card success"><div className="stat-icon success">⭐</div><div className="stat-info"><h3>Avg Rating</h3><div className="stat-value">{feedbacks.length > 0 ? (feedbacks.reduce((a: number, f: any) => a + (f.rating || 0), 0) / feedbacks.length).toFixed(1) : '-'}</div></div></div>
            </div>

            <div className="glass-premium" style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                {loading ? (
                    <div style={{ padding: '80px', textAlign: 'center' }}>
                        <div className="animate-spin" style={{ fontSize: '32px' }}>🔄</div>
                    </div>
                ) : feedbacks.length === 0 ? (
                    <div style={{ padding: '80px', textAlign: 'center' }}>
                        <div style={{ fontSize: '64px', marginBottom: '24px' }}>💬</div>
                        <h3 style={{ fontSize: '20px', fontWeight: 700 }}>No Feedback Yet</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Student feedback will appear here once submitted.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border)' }}>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Student</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rating</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Feedback</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {feedbacks.map((f: any) => (
                                    <tr key={f.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover-lift">
                                        <td style={{ padding: '20px 24px' }}>
                                            <div style={{ fontWeight: 600, fontSize: '14px' }}>{f.student_name}</div>
                                        </td>
                                        <td style={{ padding: '20px 24px' }}>
                                            <div style={{ color: '#fbbf24', fontSize: '14px' }}>
                                                {'★'.repeat(f.rating || 0)}{'☆'.repeat(5 - (f.rating || 0))}
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 24px' }}>
                                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{f.comments || 'No written commentary.'}</div>
                                        </td>
                                        <td style={{ padding: '20px 24px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                            {new Date(f.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
