'use client';

import { useState, useEffect } from 'react';
import { apiGet, getStoredUser } from '@/lib/api';

export default function AssessmentsPage() {
    const [assessments, setAssessments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const user = getStoredUser();
        if (user) setIsAdmin(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN');
        apiGet('/api/placement/assessments').then(setAssessments).catch(() => { }).finally(() => setLoading(false));
    }, []);

    return (
        <div className="animate-in">
            <div className="page-header">
                <div><h1 className="page-title">Assessments</h1><p className="page-subtitle">Technical assessments and skill evaluations</p></div>
                {isAdmin && <button className="btn btn-primary">+ Create Assessment</button>}
            </div>

            <div className="grid-4 mb-24">
                <div className="stat-card primary"><div className="stat-icon primary">📝</div><div className="stat-info"><h3>Total</h3><div className="stat-value">{assessments.length}</div></div></div>
                <div className="stat-card success"><div className="stat-icon success">✅</div><div className="stat-info"><h3>Active</h3><div className="stat-value">{assessments.filter((a: any) => a.is_active).length}</div></div></div>
            </div>

            <div className="card">
                {loading ? <p>Loading...</p> : assessments.length === 0 ? (
                    <div className="empty-state" style={{ padding: '60px 16px' }}>
                        <div className="empty-icon">📝</div>
                        <h3>No Assessments Created</h3>
                        <p className="text-sm text-muted">Create assessments to evaluate student skills before placement.</p>
                    </div>
                ) : (
                    <div className="grid-3">{assessments.map((a: any) => (
                        <div key={a.id} className="card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <h3 style={{ margin: '0 0 8px', fontSize: '16px' }}>{a.title}</h3>
                            <p className="text-sm text-muted">{a.description || 'No description'}</p>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                <span className="text-sm text-muted">⏱️ {a.duration_minutes || 60} min</span>
                                <span className="text-sm text-muted">📊 {a.total_marks || 100} marks</span>
                            </div>
                            <div style={{ marginTop: '16px' }}>
                                {isAdmin ? (
                                    <button className="btn btn-sm btn-ghost">Manage</button>
                                ) : (
                                    <button className="btn btn-sm btn-primary" style={{ width: '100%' }}>Start Assessment</button>
                                )}
                            </div>
                        </div>
                    ))}</div>
                )}
            </div>
        </div>
    );
}
