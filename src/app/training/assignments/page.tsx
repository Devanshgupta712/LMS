'use client';

import { useState, useEffect, useRef } from 'react';
import { apiGet, apiPost, apiFetch, API_BASE } from '@/lib/api';

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
    const [modalTab, setModalTab] = useState<'ai' | 'pdf'>('ai');

    // Shared form fields
    const [form, setForm] = useState({ title: '', description: '', type: 'CODING', total_marks: '100', due_date: '' });
    const [saving, setSaving] = useState(false);

    // AI generation state
    const [aiTopic, setAiTopic] = useState('');
    const [aiDifficulty, setAiDifficulty] = useState('Intermediate');
    const [generating, setGenerating] = useState(false);
    const [aiPreview, setAiPreview] = useState<any>(null);
    const [aiError, setAiError] = useState('');

    // PDF upload state
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const [viewSubmissions, setViewSubmissions] = useState<any>(null);
    const [submissionsData, setSubmissionsData] = useState<any[]>([]);

    useEffect(() => { loadAssignments(); }, []);

    const loadAssignments = async () => {
        try { setAssignments(await apiGet('/api/training/assignments')); } catch { } finally { setLoading(false); }
    };

    const resetModal = () => {
        setModalTab('ai');
        setForm({ title: '', description: '', type: 'CODING', total_marks: '100', due_date: '' });
        setAiTopic(''); setAiDifficulty('Intermediate');
        setAiPreview(null); setAiError('');
        setPdfFile(null);
    };

    // ── AI Generation ────────────────────────────────────────────────────────
    const handleGenerate = async () => {
        if (!aiTopic.trim()) { setAiError('Please enter a topic.'); return; }
        setGenerating(true); setAiError(''); setAiPreview(null);
        try {
            const resp = await apiFetch('/api/training/generate-task', {
                method: 'POST',
                body: JSON.stringify({ topic: aiTopic, task_type: form.type, difficulty: aiDifficulty })
            });
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error(err.detail || 'Generation failed');
            }
            const result = await resp.json();
            setAiPreview(result);
            // Auto-fill form fields from AI result
            setForm(f => ({
                ...f,
                title: result.title || '',
                description: [
                    result.description || '',
                    result.requirements?.length ? '\n\nRequirements:\n' + result.requirements.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n') : '',
                    result.hints?.length ? '\n\nHints:\n' + result.hints.map((h: string) => `• ${h}`).join('\n') : '',
                    result.estimated_hours ? `\n\nEstimated Time: ${result.estimated_hours} hours` : ''
                ].join('')
            }));
        } catch (e: any) {
            setAiError(e?.message || 'AI generation failed. Please try again.');
        } finally { setGenerating(false); }
    };

    // ── Save Assignment ───────────────────────────────────────────────────────
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim()) return;
        setSaving(true);
        try {
            let pdfUrl: string | undefined;

            // If PDF tab and file selected — upload first
            if (modalTab === 'pdf' && pdfFile) {
                const fd = new FormData();
                fd.append('file', pdfFile);
                const token = localStorage.getItem('auth_token');
                const uploadResp = await fetch(`${API_BASE}/api/training/upload-assignment-pdf`, {
                    method: 'POST',
                    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                    body: fd,
                });
                if (uploadResp.ok) {
                    const uploadData = await uploadResp.json();
                    pdfUrl = uploadData.url;
                }
            }

            await apiPost('/api/training/assignments', {
                ...form,
                total_marks: parseInt(form.total_marks) || 100,
                ...(pdfUrl ? { pdf_url: pdfUrl } : {})
            });
            setShowModal(false);
            resetModal();
            loadAssignments();
        } catch { } finally { setSaving(false); }
    };

    const handleViewSubmissions = async (assignment: any) => {
        setViewSubmissions(assignment);
        setSubmissionsData([]);
        try {
            const data = await apiGet(`/api/training/assignments/${assignment.id}/submissions`);
            setSubmissionsData(data);
        } catch (e) { console.error('Failed to load submissions', e); }
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
                <button className="btn btn-primary" onClick={() => { resetModal(); setShowModal(true); }}>+ New Assignment</button>
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
                                            <span style={{ color: isOverdue(a.due_date) ? '#ef4444' : 'var(--text-muted)' }}>
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

            {/* ── Create Assignment Modal ── */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 className="modal-title" style={{ margin: 0 }}>New Assignment</h2>
                            <button className="btn btn-sm btn-ghost" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        {/* Tab Switcher */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '10px' }}>
                            <button
                                type="button"
                                onClick={() => setModalTab('ai')}
                                style={{
                                    flex: 1, padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                    fontWeight: 600, fontSize: '14px', transition: 'all 0.2s',
                                    background: modalTab === 'ai' ? 'var(--primary)' : 'transparent',
                                    color: modalTab === 'ai' ? '#fff' : 'var(--text-secondary)',
                                }}
                            >
                                ✨ Generate with AI
                            </button>
                            <button
                                type="button"
                                onClick={() => setModalTab('pdf')}
                                style={{
                                    flex: 1, padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                    fontWeight: 600, fontSize: '14px', transition: 'all 0.2s',
                                    background: modalTab === 'pdf' ? 'var(--primary)' : 'transparent',
                                    color: modalTab === 'pdf' ? '#fff' : 'var(--text-secondary)',
                                }}
                            >
                                📄 Upload PDF
                            </button>
                        </div>

                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                            {/* ── AI TAB ── */}
                            {modalTab === 'ai' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--bg-secondary)' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <label className="form-label">Assignment Type</label>
                                            <select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                                <option value="CODING">💻 Coding</option>
                                                <option value="WRITTEN">✍️ Written</option>
                                                <option value="MCQ">📝 MCQ</option>
                                                <option value="PROJECT">🏗️ Project</option>
                                            </select>
                                        </div>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <label className="form-label">Difficulty</label>
                                            <select className="form-input" value={aiDifficulty} onChange={e => setAiDifficulty(e.target.value)}>
                                                <option>Beginner</option>
                                                <option>Intermediate</option>
                                                <option>Advanced</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label className="form-label">Topic / Subject</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input
                                                className="form-input"
                                                value={aiTopic}
                                                onChange={e => setAiTopic(e.target.value)}
                                                placeholder="e.g. Spring Boot REST API, React Hooks, SQL Joins..."
                                                style={{ flex: 1 }}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-primary"
                                                onClick={handleGenerate}
                                                disabled={generating}
                                                style={{ whiteSpace: 'nowrap' }}
                                            >
                                                {generating ? '⏳ Generating...' : '✨ Generate'}
                                            </button>
                                        </div>
                                    </div>
                                    {aiError && <p style={{ color: '#ef4444', fontSize: '13px', margin: 0 }}>⚠️ {aiError}</p>}
                                    {aiPreview && (
                                        <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid #10b98130' }}>
                                            <p style={{ fontSize: '12px', color: '#10b981', fontWeight: 600, margin: '0 0 4px' }}>✅ AI Generated — review & edit below</p>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                {aiPreview.requirements?.map((r: string, i: number) => (
                                                    <span key={i} style={{ fontSize: '11px', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '99px', color: 'var(--text-secondary)' }}>✓ {r}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── PDF TAB ── */}
                            {modalTab === 'pdf' && (
                                <div
                                    style={{ border: '2px dashed var(--border)', borderRadius: '10px', padding: '24px', textAlign: 'center', cursor: 'pointer', background: 'var(--bg-secondary)' }}
                                    onClick={() => fileRef.current?.click()}
                                >
                                    <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => setPdfFile(e.target.files?.[0] || null)} />
                                    {pdfFile ? (
                                        <div>
                                            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📄</div>
                                            <p style={{ fontWeight: 600, margin: '0 0 4px' }}>{pdfFile.name}</p>
                                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{(pdfFile.size / 1024).toFixed(1)} KB — click to change</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <div style={{ fontSize: '40px', marginBottom: '8px' }}>📂</div>
                                            <p style={{ fontWeight: 600, margin: '0 0 4px' }}>Click to upload PDF</p>
                                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Assignment instructions / task sheet</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── Common Fields ── */}
                            <div className="form-group">
                                <label className="form-label">Title *</label>
                                <input className="form-input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Build a Student Management API" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description / Instructions</label>
                                <textarea className="form-input" rows={5} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Will be auto-filled by AI, or write manually..." />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                        <option value="CODING">💻 Coding</option>
                                        <option value="WRITTEN">✍️ Written</option>
                                        <option value="MCQ">📝 MCQ</option>
                                        <option value="PROJECT">🏗️ Project</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Total Marks</label>
                                    <input type="number" className="form-input" value={form.total_marks} onChange={e => setForm({ ...form, total_marks: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Due Date</label>
                                    <input type="date" className="form-input" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '4px' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Creating...' : 'Create Assignment'}
                                </button>
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
                            <div className="empty-state"><div className="empty-icon">📭</div><p className="text-muted">No students have submitted this assignment yet.</p></div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {submissionsData.map(sub => (
                                    <div key={sub.id} className="card" style={{ padding: '16px', background: 'var(--bg-secondary)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <h3 style={{ margin: 0 }}>{sub.student_name}</h3>
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : 'Submitted'}
                                            </span>
                                        </div>
                                        {sub.content && (
                                            <div style={{ marginBottom: '12px' }}>
                                                <strong style={{ fontSize: '13px' }}>Submission:</strong>
                                                <pre style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '12px', borderRadius: '8px', overflowX: 'auto', fontSize: '12px', marginTop: '4px', border: '1px solid var(--border)' }}>
                                                    {sub.content.slice(0, 400)}{sub.content.length > 400 ? '...' : ''}
                                                </pre>
                                            </div>
                                        )}
                                        {sub.file_url && (
                                            <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                📥 Download PDF
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
