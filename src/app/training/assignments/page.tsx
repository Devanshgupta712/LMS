'use client';

import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiFetch } from '@/lib/api';

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
    CODING: '#0066ff', WRITTEN: '#10b981', MCQ: '#f59e0b', PROJECT: '#06b6d4',
};

export default function AssignmentsPage() {
    const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', type: 'CODING', total_marks: '100', due_date: '' });
    const [generating, setGenerating] = useState(false);
    const [aiTopic, setAiTopic] = useState('');
    const [viewSubmissions, setViewSubmissions] = useState<any>(null);
    const [submissionsData, setSubmissionsData] = useState<any[]>([]);

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

    const handleAiGenerate = async () => {
        if (!aiTopic.trim()) return;
        setGenerating(true);
        try {
            const formData = new FormData();
            formData.append('topic', aiTopic);
            const res = await apiFetch('/api/training/assignments/ai-generate', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data?.description) {
                setForm(prev => ({ ...prev, description: data.description }));
            }
        } catch (e) {
            console.error("AI Generation failed:", e);
        } finally {
            setGenerating(false);
            setAiTopic('');
        }
    };

    const handleViewSubmissions = async (assignment: any) => {
        setViewSubmissions(assignment);
        try {
            const data = await apiGet(`/api/training/assignments/${assignment.id}/submissions`);
            setSubmissionsData(data);
        } catch (e) { console.error("Failed to load subs", e); }
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
                                        {a.description && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{a.description.slice(0, 60)}...</div>}
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
                                        <button className="badge badge-primary" onClick={() => handleViewSubmissions(a)} style={{ cursor: 'pointer', border: 'none' }}>
                                            {a.submission_count} submitted
                                        </button>
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
                            
                            {/* AI Magic Track */}
                            <div className="p-4 rounded-xl mb-2" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}>
                                <label className="form-label" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    ✨ Let AI Write the Instructions
                                </label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input className="form-input" value={aiTopic} onChange={e => setAiTopic(e.target.value)} placeholder="e.g. Build a weather app using REST APIs" disabled={generating} />
                                    <button type="button" className="btn btn-primary" onClick={handleAiGenerate} disabled={generating || !aiTopic}>
                                        {generating ? '🪄 Thinking...' : 'Generate Context'}
                                    </button>
                                </div>
                            </div>

                            <div className="form-group"><label className="form-label">Description / Constraints</label><textarea className="form-input" rows={6} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Assignment instructions..." /></div>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">Type</label>
                                    <select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                        <option value="CODING">💻 Coding</option><option value="WRITTEN">✍️ Written</option><option value="MCQ">📝 MCQ</option><option value="PROJECT">🏗️ Project</option>
                                    </select>
                                </div>
                                <div className="form-group"><label className="form-label">Total Marks</label><input type="number" className="form-input" value={form.total_marks} onChange={e => setForm({ ...form, total_marks: e.target.value })} /></div>
                            </div>
                            <div className="form-group"><label className="form-label">Due Date</label><input type="date" className="form-input" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Assignment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Submissions Modal */}
            {viewSubmissions && (
                <div className="modal-overlay" onClick={() => { setViewSubmissions(null); setSubmissionsData([]); }}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 className="modal-title" style={{ margin: 0 }}>Submissions: {viewSubmissions.title}</h2>
                            <button className="btn btn-sm btn-ghost" onClick={() => { setViewSubmissions(null); setSubmissionsData([]); }}>✕ Close</button>
                        </div>

                        {submissionsData.length === 0 ? (
                            <p className="text-muted">No students have submitted this assignment yet.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {submissionsData.map(sub => (
                                    <div key={sub.id} className="card" style={{ padding: '16px', background: 'var(--bg-secondary)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <h3 style={{ margin: 0 }}>{sub.student_name}</h3>
                                            <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>AI Score: {sub.marks !== null ? sub.marks : '-'} / {viewSubmissions.total_marks}</span>
                                        </div>
                                        {sub.feedback && (
                                            <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px' }}>
                                                <strong>AI Feedback:</strong> {sub.feedback}
                                            </div>
                                        )}
                                        {sub.content && (
                                            <div style={{ marginBottom: '12px' }}>
                                                <strong>Code Output:</strong>
                                                <pre style={{ background: '#1e293b', color: '#e2e8f0', padding: '12px', borderRadius: '8px', overflowX: 'auto', fontSize: '12px', marginTop: '4px' }}>
                                                    {sub.content.slice(0, 300)}{sub.content.length > 300 ? '...' : ''}
                                                </pre>
                                            </div>
                                        )}
                                        {sub.file_url && (
                                            <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary" style={{ display: 'inline-block', background: 'var(--primary)' }}>
                                                📥 Download Cloudinary PDF
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
