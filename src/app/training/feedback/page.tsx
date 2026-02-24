'use client';

import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api';

export default function FeedbackPage() {
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { apiGet('/api/training/feedback').then(setFeedbacks).catch(() => { }).finally(() => setLoading(false)); }, []);

    return (
        <div className="animate-in">
            <div className="page-header">
                <div><h1 className="page-title">Student Feedback</h1><p className="page-subtitle">View and manage student feedback on training</p></div>
            </div>

            <div className="grid-4 mb-24">
                <div className="stat-card primary"><div className="stat-icon primary">💬</div><div className="stat-info"><h3>Total Feedback</h3><div className="stat-value">{feedbacks.length}</div></div></div>
                <div className="stat-card success"><div className="stat-icon success">⭐</div><div className="stat-info"><h3>Avg Rating</h3><div className="stat-value">{feedbacks.length > 0 ? (feedbacks.reduce((a: number, f: any) => a + (f.rating || 0), 0) / feedbacks.length).toFixed(1) : '-'}</div></div></div>
            </div>

            <div className="card">
                {loading ? <p>Loading...</p> : feedbacks.length === 0 ? (
                    <div className="empty-state" style={{ padding: '60px 16px' }}>
                        <div className="empty-icon">💬</div>
                        <h3>No Feedback Yet</h3>
                        <p className="text-sm text-muted">Student feedback will appear here once submitted.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {feedbacks.map((f: any) => (
                            <div key={f.id} className="card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <strong>{f.student_name || 'Student'}</strong>
                                    <span style={{ color: '#fbbf24' }}>{'⭐'.repeat(f.rating || 0)}</span>
                                </div>
                                <p className="text-sm text-muted" style={{ marginTop: '8px' }}>{f.comment || 'No comment'}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
