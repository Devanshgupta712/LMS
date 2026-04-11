'use client';

import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api';

interface Feedback {
    id: string; target_type: string; target_id: string;
    student_name: string; rating: number; comments: string;
    is_anonymous: boolean; created_at: string;
}

export default function AdminFeedbackPage() {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFeedbacks();
    }, []);

    const loadFeedbacks = async () => {
        setLoading(true);
        try {
            const res = await apiGet('/api/sessions/feedback/admin');
            setFeedbacks(res || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const avgRating = feedbacks.length > 0 ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1) : '0.0';
    const totalFeedbacks = feedbacks.length;
    const sessionFeedbacks = feedbacks.filter(f => f.target_type === 'SESSION').length;
    const trainerFeedbacks = feedbacks.filter(f => f.target_type === 'TRAINER').length;

    return (
        <div className="reveal-on-scroll active">
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h1 className="page-title">Analytics & Feedback</h1>
                    <p className="page-subtitle">Track student ratings across classes, trainers, and curriculum modules.</p>
                </div>
            </div>

            <div className="grid-4 mb-24">
                <div className="stat-card primary">
                    <div className="stat-icon primary">⭐</div>
                    <div className="stat-info"><h3>Global Average</h3><div className="stat-value">{avgRating} / 5</div></div>
                </div>
                <div className="stat-card accent">
                    <div className="stat-icon accent">📝</div>
                    <div className="stat-info"><h3>Total Reviews</h3><div className="stat-value">{totalFeedbacks}</div></div>
                </div>
                <div className="stat-card success">
                    <div className="stat-icon success">📅</div>
                    <div className="stat-info"><h3>Session Reviews</h3><div className="stat-value">{sessionFeedbacks}</div></div>
                </div>
                <div className="stat-card info">
                    <div className="stat-icon info">👨‍🏫</div>
                    <div className="stat-info"><h3>Trainer Reviews</h3><div className="stat-value">{trainerFeedbacks}</div></div>
                </div>
            </div>

            <div className="glass-premium" style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                {loading ? (
                    <div style={{ padding: '80px', textAlign: 'center' }}><div className="animate-spin" style={{ fontSize: '32px' }}>🔄</div></div>
                ) : feedbacks.length === 0 ? (
                    <div style={{ padding: '80px', textAlign: 'center' }}>
                        <div style={{ fontSize: '64px', marginBottom: '24px' }}>💬</div>
                        <h3 style={{ fontSize: '20px', fontWeight: 700 }}>No Feedback Yet</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Students haven&apos;t submitted any evaluations.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border)' }}>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Submitting Student</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target Area</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rating</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Review / Comments</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Submitted At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {feedbacks.map(f => (
                                    <tr key={f.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover-lift">
                                        <td style={{ padding: '20px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: f.is_anonymous ? 'var(--bg-secondary)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.is_anonymous ? 'var(--text-muted)' : '#fff', fontWeight: 700 }}>
                                                    {f.is_anonymous ? '🎭' : f.student_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div style={{ fontWeight: 600, fontSize: '14px' }}>{f.student_name}</div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 24px' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '12px', background: f.target_type === 'TRAINER' ? 'rgba(56,189,248,0.1)' : 'rgba(99,102,241,0.1)', color: f.target_type === 'TRAINER' ? 'var(--info)' : 'var(--primary)' }}>
                                                {f.target_type}
                                            </span>
                                        </td>
                                        <td style={{ padding: '20px 24px' }}>
                                            <div style={{ display: 'flex', gap: '2px', color: '#fbbf24', fontSize: '16px' }}>
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <span key={i} style={{ opacity: i < f.rating ? 1 : 0.2 }}>★</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 24px', maxWidth: '300px' }}>
                                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, fontStyle: f.comments ? 'normal' : 'italic' }}>
                                                "{f.comments || 'No written commentary provided.'}"
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 24px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                            {new Date(f.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
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
