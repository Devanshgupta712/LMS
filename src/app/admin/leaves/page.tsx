'use client';

import { useState, useEffect } from 'react';
import { apiGet, apiPatch } from '@/lib/api';
import { getStoredUser } from '@/lib/api';

interface LeaveReq {
    id: string; start_date: string; end_date: string; reason: string | null;
    status: string; created_at: string; user_name: string; user_role: string; user_student_id: string | null;
}

export default function LeavesPage() {
    const [leaves, setLeaves] = useState<LeaveReq[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => { loadLeaves(); }, []);

    const loadLeaves = async () => {
        try { setLeaves(await apiGet('/api/admin/leaves')); } catch { } finally { setLoading(false); }
    };

    const handleAction = async (id: string, status: string) => {
        const user = getStoredUser();
        await apiPatch('/api/admin/leaves', { id, status, approved_by_id: user?.id });
        loadLeaves();
    };

    const filtered = filter === 'ALL' ? leaves : leaves.filter(l => l.status === filter);

    return (
        <div className="animate-in">
            <div className="page-header">
                <div><h1 className="page-title">Leave Requests</h1><p className="page-subtitle">Approve or reject leave requests</p></div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(s => (
                    <button key={s} className={`btn ${filter === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(s)}>{s} ({s === 'ALL' ? leaves.length : leaves.filter(l => l.status === s).length})</button>
                ))}
            </div>

            <div className="card">
                {loading ? <p>Loading...</p> : filtered.length === 0 ? (
                    <div className="empty-state"><div className="empty-icon">🗓️</div><h3>No leave requests</h3></div>
                ) : (
                    <div className="table-responsive"><table className="table">
                        <thead><tr><th>Student</th><th>Period</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>{filtered.map(l => (
                            <tr key={l.id}>
                                <td><strong>{l.user_name}</strong><br /><span className="text-sm text-muted">{l.user_student_id || l.user_role}</span></td>
                                <td>{new Date(l.start_date).toLocaleDateString()} - {new Date(l.end_date).toLocaleDateString()}</td>
                                <td>{l.reason || '-'}</td>
                                <td><span className={`badge ${l.status === 'APPROVED' ? 'badge-success' : l.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>{l.status}</span></td>
                                <td>{l.status === 'PENDING' && (
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button className="btn btn-sm btn-success" onClick={() => handleAction(l.id, 'APPROVED')}>✅ Approve</button>
                                        <button className="btn btn-sm btn-danger" onClick={() => handleAction(l.id, 'REJECTED')}>❌ Reject</button>
                                    </div>
                                )}</td>
                            </tr>
                        ))}</tbody>
                    </table></div>
                )}
            </div>
        </div>
    );
}
