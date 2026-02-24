'use client';

import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api';

export default function StudentCoursesPage() {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiGet('/api/auth/my-courses').then(setCourses).catch(() => { }).finally(() => setLoading(false));
    }, []);

    return (
        <div className="animate-in">
            <div className="page-header"><div><h1 className="page-title">My Courses</h1><p className="page-subtitle">Your enrolled courses and fee details</p></div></div>

            <div className="card">
                {loading ? <p>Loading...</p> : courses.length === 0 ? (
                    <div className="empty-state"><div className="empty-icon">📚</div><h3>No registered courses found</h3></div>
                ) : (
                    <div className="grid-3">{courses.map((c: any) => (
                        <div key={c.id} className="card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ height: '8px', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: '4px 4px 0 0', margin: '-16px -16px 16px' }} />
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
