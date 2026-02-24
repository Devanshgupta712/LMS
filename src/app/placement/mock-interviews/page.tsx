'use client';

import { useState, useEffect } from 'react';
import { apiGet, getStoredUser } from '@/lib/api';

export default function MockInterviewsPage() {
    const [interviews, setInterviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const user = getStoredUser();
        if (user) setIsAdmin(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN');
        apiGet('/api/placement/mock-interviews').then(setInterviews).catch(() => { }).finally(() => setLoading(false));
    }, []);

    return (
        <div className="animate-in">
            <div className="page-header">
                <div><h1 className="page-title">Mock Interviews</h1><p className="page-subtitle">Schedule and track mock interview sessions</p></div>
                {isAdmin && <button className="btn btn-primary">+ Schedule Interview</button>}
            </div>

            <div className="grid-4 mb-24">
                <div className="stat-card primary"><div className="stat-icon primary">🎤</div><div className="stat-info"><h3>Total</h3><div className="stat-value">{interviews.length}</div></div></div>
                <div className="stat-card success"><div className="stat-icon success">✅</div><div className="stat-info"><h3>Completed</h3><div className="stat-value">{interviews.filter((i: any) => i.status === 'COMPLETED').length}</div></div></div>
                <div className="stat-card accent"><div className="stat-icon accent">📅</div><div className="stat-info"><h3>Upcoming</h3><div className="stat-value">{interviews.filter((i: any) => i.status === 'SCHEDULED').length}</div></div></div>
            </div>

            <div className="card">
                {loading ? <p>Loading...</p> : interviews.length === 0 ? (
                    <div className="empty-state" style={{ padding: '60px 16px' }}>
                        <div className="empty-icon">🎤</div>
                        <h3>No Mock Interviews Scheduled</h3>
                        <p className="text-sm text-muted">Schedule mock interviews to prepare students for placements.</p>
                    </div>
                ) : (
                    <div className="table-responsive"><table className="table">
                        <thead><tr><th>Student</th><th>Interviewer</th><th>Date</th><th>Score</th><th>Status</th></tr></thead>
                        <tbody>{interviews.map((i: any) => (
                            <tr key={i.id}>
                                <td><strong>{i.student_name || 'Student'}</strong></td>
                                <td>{i.interviewer_name || '-'}</td>
                                <td>{i.scheduled_at ? new Date(i.scheduled_at).toLocaleDateString() : '-'}</td>
                                <td>{i.score !== null ? `${i.score}/10` : '-'}</td>
                                <td><span className={`badge ${i.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>{i.status}</span></td>
                            </tr>
                        ))}</tbody>
                    </table></div>
                )}
            </div>
        </div>
    );
}
