'use client';

import { useState, useEffect } from 'react';
import { apiGet, apiPatch, getStoredUser } from '@/lib/api';

interface LeaveReq {
    id: string; start_date: string; end_date: string; reason: string | null;
    leave_type: string; proof_url: string | null;
    status: string; created_at: string; user_name: string; user_role: string; user_student_id: string | null;
}

export default function LeavesPage() {
    const [leaves, setLeaves] = useState<LeaveReq[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [actionError, setActionError] = useState<string | null>(null);
    const user = getStoredUser();
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    useEffect(() => { loadLeaves(); }, []);

    const loadLeaves = async () => {
        try { setLeaves(await apiGet('/api/admin/leaves')); } catch { } finally { setLoading(false); }
    };

    const handleAction = async (id: string, status: string) => {
        setActionError(null);
        try {
            await apiPatch('/api/admin/leaves', { id, status });
            loadLeaves();
        } catch (err: any) {
            setActionError(err?.message || 'Failed to update leave status');
        }
    };

    const ROLES = ['ALL', 'STUDENT', 'TRAINER', 'ADMIN', 'MARKETER'];
    const filtered = leaves
        .filter(l => filter === 'ALL' || l.status === filter)
        .filter(l => roleFilter === 'ALL' || l.user_role === roleFilter);

    const getRoleBadge = (role: string) => {
        const map: Record<string, string> = { STUDENT: '#0ea5e9', TRAINER: '#10b981', ADMIN: '#f59e0b', MARKETER: '#ec4899', SUPER_ADMIN: '#6366f1' };
        return map[role] || '#888';
    };

    return (
        <div className="animate-in">
            <div className="page-header">
                <div><h1 className="page-title">Leave Requests</h1><p className="page-subtitle">Approve or reject leave requests</p></div>
            </div>

            {actionError && (
                <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', color: '#f87171', fontSize: '14px' }}>
                    ⚠️ {actionError}
                </div>
            )}

            {/* Status Filters */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(s => (
                    <button key={s} className={`btn ${filter === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(s)}>
                        {s} ({s === 'ALL' ? leaves.length : leaves.filter(l => l.status === s).length})
                    </button>
                ))}
            </div>

            {/* Role Filters */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {ROLES.map(r => (
                    <button
                        key={r}
                        onClick={() => setRoleFilter(r)}
                        style={{
                            padding: '5px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                            fontSize: '12px', fontWeight: 600, transition: 'all 0.2s',
                            background: roleFilter === r ? getRoleBadge(r) : 'rgba(255,255,255,0.05)',
                            color: roleFilter === r ? '#fff' : 'var(--text-muted)',
                        }}
                    >
                        {r === 'TRAINER' ? '🏋️' : r === 'STUDENT' ? '🎓' : r === 'ADMIN' ? '🔑' : r === 'MARKETER' ? '📣' : '🌐'} {r}
                        <span style={{ opacity: 0.7, fontSize: '11px', marginLeft: '4px' }}>
                            ({r === 'ALL' ? leaves.length : leaves.filter(l => l.user_role === r).length})
                        </span>
                    </button>
                ))}
            </div>

            <div className="card">
                {loading ? <p>Loading...</p> : filtered.length === 0 ? (
                    <div className="empty-state"><div className="empty-icon">🗓️</div><h3>No leave requests</h3></div>
                ) : (
                    <div className="table-responsive"><table className="table">
                        <thead><tr><th>Person</th><th>Period</th><th>Type / Reason</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>{filtered.map(l => (
                            <tr key={l.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <strong>{l.user_name}</strong>
                                        <span style={{ background: getRoleBadge(l.user_role), color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 700 }}>
                                            {l.user_role}
                                        </span>
                                        {l.user_role === 'TRAINER' && (
                                            <span title="Only Super Admin can approve" style={{ fontSize: '12px' }}>🔒</span>
                                        )}
                                    </div>
                                    <div className="text-sm text-muted">{l.user_student_id || l.user_role}</div>
                                </td>
                                <td>{new Date(l.start_date).toLocaleDateString()} — {new Date(l.end_date).toLocaleDateString()}</td>
                                <td>
                                    <strong>{l.leave_type || 'OTHER'}</strong><br />
                                    <span className="text-muted text-sm">{l.reason || '-'}</span>
                                    {l.leave_type === 'MEDICAL' && l.proof_url && (() => {
                                        const fname = l.proof_url.split('/').pop() || l.proof_url;
                                        const proofHref = `https://api.appteknow.com/api/uploads/${fname}`;
                                        return (
                                            <div style={{ marginTop: '4px' }}>
                                                <a href={proofHref} target="_blank" rel="noopener noreferrer" style={{ color: '#0066ff', fontSize: '12px' }}>📄 View Proof</a>
                                            </div>
                                        );
                                    })()}
                                </td>
                                <td><span className={`badge ${l.status === 'APPROVED' ? 'badge-success' : l.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>{l.status}</span></td>
                                <td>
                                    {l.user_role === 'TRAINER' && !isSuperAdmin ? (
                                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>🔒 Super Admin only</span>
                                    ) : (
                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                            {l.status !== 'APPROVED' && (
                                                <button
                                                    className="btn btn-sm btn-success"
                                                    onClick={() => handleAction(l.id, 'APPROVED')}
                                                    title={l.status === 'REJECTED' ? 'Reverse rejection → Approve' : 'Approve'}
                                                >✅ Approve</button>
                                            )}
                                            {l.status !== 'REJECTED' && (
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => handleAction(l.id, 'REJECTED')}
                                                    title={l.status === 'APPROVED' ? 'Reverse approval → Reject' : 'Reject'}
                                                >❌ Reject</button>
                                            )}
                                            {l.status !== 'PENDING' && (
                                                <button
                                                    className="btn btn-sm btn-ghost"
                                                    onClick={() => handleAction(l.id, 'PENDING')}
                                                    title="Reset to Pending"
                                                >↩ Reset</button>
                                            )}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}</tbody>
                    </table></div>
                )}
            </div>
        </div>
    );
}
