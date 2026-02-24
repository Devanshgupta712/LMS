'use client';

import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '@/lib/api';

interface AssignmentItem {
    id: string; title: string; description: string | null;
    type: string; batch_id: string | null; total_marks: number;
    assigned_by: string | null; due_date: string | null;
    submission_count: number; created_at: string;
}

const typeIcons: Record<string, string> = {
    CODING: '💻', WRITTEN: '✍️', MCQ: '📝', PROJECT: '🏗️',
};
const typeColors: Record<string, string> = {
    CODING: '#6366f1', WRITTEN: '#10b981', MCQ: '#f59e0b', PROJECT: '#06b6d4',
};

export default function AssignmentsPage() {
    const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', type: 'CODING', total_marks: '100', due_date: '' });

    useEffect(() => { loadAssignments(); }, []);

    const loadAssignments = async () => {
        try { setAssignments(await apiGet('/api/training/assignments')); } catch { } finally { setLoading(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        await apiPost('/api/training/assignments', {
            ...form, total_marks: parseInt(form.total_marks) || 100
        });
        setShowModal(false);
        setForm({ title: '', description: '', type: 'CODING', total_marks: '100', due_date: '' });
        loadAssignments();
    };

    const isOverdue = (dueDate: string | null) => {
        if (!dueDate) return false;
        return new Date(dueDate) < new Date();
    };

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Assignments</h1>
                    <p className="page-subtitle">Graded coursework with deadlines & submissions</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Assignment</button>
            </div>

            {/* Stats */}
            <div className="grid-4 mb-24">
                <div className="stat-card primary"><div className="stat-icon primary">📝</div><div className="stat-info"><h3>Total</h3><div className="stat-value">{assignments.length}</div></div></div>
                <div className="stat-card accent"><div className="stat-icon accent">💻</div><div className="stat-info"><h3>Coding</h3><div className="stat-value">{assignments.filter(a => a.type === 'CODING').length}</div></div></div>
                <div className="stat-card success"><div className="stat-icon success">📨</div><div className="stat-info"><h3>Submissions</h3><div className="stat-value">{assignments.reduce((s, a) => s + a.submission_count, 0)}</div></div></div>
                <div className="stat-card danger"><div className="stat-icon danger">⚠️</div><div className="stat-info"><h3>Overdue</h3><div className="stat-value">{assignments.filter(a => isOverdue(a.due_date)).length}</div></div></div>
            </div>

            {/* Assignments Table */}
            {loading ? <p>Loading...</p> : assignments.length === 0 ? (
                <div className="card"><div className="empty-state"><div className="empty-icon">📝</div><h3>No assignments yet</h3><p className="text-sm text-muted">Create your first assignment</p></div></div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead><tr>
                            <th>Assignment</th><th>Type</th><th>Marks</th><th>Due Date</th><th>Submissions</th><th>Status</th>
                        </tr></thead>
                        <tbody>
                            {assignments.map(a => (
                                <tr key={a.id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{a.title}</div>
                                        {a.description && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{a.description.slice(0, 60)}...</div>}
                                    </td>
                                    <td>
                                        <span className="badge" style={{ background: `${typeColors[a.type]}20`, color: typeColors[a.type] }}>
                                            {typeIcons[a.type]} {a.type}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{a.total_marks}</td>
                                    <td>
                                        {a.due_date ? (
                                            <span style={{ color: isOverdue(a.due_date) ? '#ef4444' : '#94a3b8' }}>
                                                {new Date(a.due_date).toLocaleDateString()}
                                                {isOverdue(a.due_date) && <span style={{ marginLeft: '6px', fontSize: '11px' }}>⚠️</span>}
                                            </span>
                                        ) : '—'}
                                    </td>
                                    <td>
                                        <span className="badge badge-primary">{a.submission_count} submitted</span>
                                    </td>
                                    <td>
                                        <span className={`badge ${isOverdue(a.due_date) ? 'badge-danger' : 'badge-success'}`}>
                                            {isOverdue(a.due_date) ? 'Overdue' : 'Active'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">Create Assignment</h2>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="form-group"><label className="form-label">Title</label><input className="form-input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. React Component Assignment" /></div>
                            <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Assignment instructions..." /></div>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">Type</label>
                                    <select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                        <option value="CODING">💻 Coding</option><option value="WRITTEN">✍️ Written</option><option value="MCQ">📝 MCQ</option><option value="PROJECT">🏗️ Project</option>
                                    </select>
                                </div>
                                <div className="form-group"><label className="form-label">Total Marks</label><input type="number" className="form-input" value={form.total_marks} onChange={e => setForm({ ...form, total_marks: e.target.value })} /></div>
                            </div>
                            <div className="form-group"><label className="form-label">Due Date</label><input type="date" className="form-input" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Assignment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
