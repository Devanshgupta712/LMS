'use client';

import { useState, useEffect, useRef } from 'react';
import { apiGet, apiFetch, API_BASE } from '@/lib/api';

interface AssignmentItem {
    id: string; title: string; description: string | null;
    type: string; batch_id: string | null; total_marks: number;
    assigned_by: string | null; due_date: string | null;
    submission_count: number; created_at: string;
}

const typeIcons: Record<string, string> = { CODING: '💻', WRITTEN: '✍️', MCQ: '📝', PROJECT: '🏗️' };
const typeColors: Record<string, string> = { CODING: '#6366f1', WRITTEN: '#10b981', MCQ: '#f59e0b', PROJECT: '#06b6d4' };

type ModalStep = 'method' | 'ai_config' | 'ai_review' | 'pdf' | 'assign' | 'common';

export default function AssignmentsPage() {
    const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [step, setStep] = useState<ModalStep>('method');

    // Batches & Students
    const [batches, setBatches] = useState<any[]>([]);
    const [batchStudents, setBatchStudents] = useState<any[]>([]);
    const [assignTarget, setAssignTarget] = useState<'batch' | 'student'>('batch');
    const [selectedBatch, setSelectedBatch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState('');

    // Form
    const [form, setForm] = useState({ title: '', description: '', type: 'CODING', total_marks: '100', due_date: '', time_limit: '0' });
    const [saving, setSaving] = useState(false);

    // AI generation
    const [aiTopic, setAiTopic] = useState('');
    const [aiDifficulty, setAiDifficulty] = useState('Intermediate');
    const [aiQuestionCount, setAiQuestionCount] = useState(5);
    const [aiTimeLimit, setAiTimeLimit] = useState(0);
    const [aiRandomize, setAiRandomize] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [aiPreview, setAiPreview] = useState<any>(null);
    const [aiError, setAiError] = useState('');

    // PDF upload
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    // Submissions
    const [viewSubmissions, setViewSubmissions] = useState<any>(null);
    const [submissionsData, setSubmissionsData] = useState<any[]>([]);
    const [subFilter, setSubFilter] = useState<'ALL' | 'SUBMITTED' | 'PENDING'>('ALL');

    useEffect(() => { loadAssignments(); loadBatches(); }, []);

    const loadAssignments = async () => {
        try { setAssignments(await apiGet('/api/training/assignments')); } catch { } finally { setLoading(false); }
    };

    const loadBatches = async () => {
        try { setBatches(await apiGet('/api/admin/batches')); } catch { }
    };

    const loadStudents = async (batchId: string) => {
        if (!batchId) { setBatchStudents([]); return; }
        try {
            const data = await apiGet(`/api/training/batches/${batchId}/students`);
            setBatchStudents(data);
        } catch { setBatchStudents([]); }
    };

    const resetModal = () => {
        setStep('method');
        setForm({ title: '', description: '', type: 'CODING', total_marks: '100', due_date: '', time_limit: '0' });
        setAiTopic(''); setAiDifficulty('Intermediate');
        setAiQuestionCount(5); setAiTimeLimit(0); setAiRandomize(true);
        setAiPreview(null); setAiError('');
        setPdfFile(null);
        setSelectedBatch(''); setSelectedStudent('');
        setAssignTarget('batch'); setBatchStudents([]);
    };

    // ── AI Generation ─────────────────────────────────────────────────────────
    const handleGenerate = async () => {
        if (!aiTopic.trim()) { setAiError('Please enter a topic.'); return; }
        setGenerating(true); setAiError(''); setAiPreview(null);
        try {
            const resp = await apiFetch('/api/training/generate-task', {
                method: 'POST',
                body: JSON.stringify({ 
                    topic: aiTopic, 
                    task_type: form.type, 
                    difficulty: aiDifficulty, 
                    question_count: Number(aiQuestionCount),
                    time_limit: Number(aiTimeLimit),
                    is_randomized: aiRandomize
                })
            });
            if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.detail || 'Failed'); }
            const result = await resp.json();
            setAiPreview(result);

            // Keep the description concise for a cleaner student UI
            let generatedDescription = result.description || '';
            
            // If it's a coding task, we might want some detail in description, 
            // but for MCQ the structured UI handles it better.
            if (form.type === 'CODING' && result.questions?.[0]) {
                const q = result.questions[0];
                generatedDescription += `\n\nProblem: ${q.question}`;
            }

            setForm(f => ({
                ...f,
                title: result.title || f.title,
                description: generatedDescription,
                time_limit: (aiTimeLimit || 0).toString(),
                total_marks: (result.total_marks || f.total_marks).toString()
            }));
            setStep('ai_review');
        } catch (e: any) { setAiError(e?.message || 'AI generation failed.'); }
        finally { setGenerating(false); }
    };

    // ── Save Assignment ────────────────────────────────────────────────────────
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim()) return;
        setSaving(true);
        try {
            let pdfUrl: string | undefined;
            if (pdfFile) {
                const fd = new FormData();
                fd.append('file', pdfFile);
                const token = localStorage.getItem('auth_token');
                const uploadResp = await fetch(`${API_BASE}/api/training/upload-assignment-pdf`, {
                    method: 'POST', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: fd,
                });
                if (uploadResp.ok) { const d = await uploadResp.json(); pdfUrl = d.url; }
            }

            const body: any = {
                ...form, 
                total_marks: parseInt(form.total_marks) || 100,
                time_limit: parseInt(form.time_limit) || 0,
                batch_id: selectedBatch || null,
                is_randomized: aiRandomize,
                ...(selectedStudent ? { student_id: selectedStudent } : {}),
                ...(pdfUrl ? { pdf_url: pdfUrl } : {}),
                ...(aiPreview ? { structured_content: JSON.stringify(aiPreview) } : {})
            };

            const resp = await apiFetch('/api/training/assignments', { method: 'POST', body: JSON.stringify(body) });
            if (!resp.ok) throw new Error('Failed to create');
            setShowModal(false); resetModal(); loadAssignments();
        } catch { } finally { setSaving(false); }
    };

    const handleViewSubmissions = async (assignment: any) => {
        setViewSubmissions(assignment); setSubmissionsData([]);
        try { setSubmissionsData(await apiGet(`/api/training/assignments/${assignment.id}/submissions`)); } catch { }
    };

    const isOverdue = (d: string | null) => !!d && new Date(d) < new Date();

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this assignment?')) return;
        try {
            const resp = await apiFetch(`/api/training/assignments/${id}`, { method: 'DELETE' });
            if (!resp.ok) throw new Error('Failed to delete assignment');
            loadAssignments();
        } catch (e) {
            console.error('Delete error', e);
            alert('Could not delete assignment. You may not have permission.');
        }
    };

    // ── Steps rendering ───────────────────────────────────────────────────────
    const StepIndicator = ({ steps, current }: { steps: string[]; current: number }) => (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '20px' }}>
            {steps.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: 700,
                        background: i < current ? '#10b981' : i === current ? 'var(--primary)' : 'var(--border)',
                        color: i <= current ? '#fff' : 'var(--text-muted)',
                    }}>{i < current ? '✓' : i + 1}</div>
                    <span style={{ fontSize: '12px', color: i === current ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: i === current ? 600 : 400 }}>{s}</span>
                    {i < steps.length - 1 && <div style={{ width: '24px', height: '1px', background: 'var(--border)' }} />}
                </div>
            ))}
        </div>
    );

    const aiSteps = ['Method', 'Configure', 'Review', 'Assign', 'Details'];
    const pdfSteps = ['Method', 'Upload PDF', 'Assign', 'Details'];

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

            {/* Table */}
            {loading ? <p>Loading...</p> : assignments.length === 0 ? (
                <div className="card"><div className="empty-state"><div className="empty-icon">📝</div><h3>No assignments yet</h3><p className="text-sm text-muted">Create your first assignment</p></div></div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead><tr><th>Assignment</th><th>Type</th><th>Marks</th><th>Due Date</th><th>Submissions</th><th>Status</th><th>Action</th></tr></thead>
                        <tbody>
                            {assignments.map(a => (
                                <tr key={a.id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{a.title}</div>
                                        {a.description && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{a.description.slice(0, 60)}...</div>}
                                    </td>
                                    <td><span className="badge" style={{ background: `${typeColors[a.type]}20`, color: typeColors[a.type] }}>{typeIcons[a.type]} {a.type}</span></td>
                                    <td style={{ fontWeight: 600 }}>{a.total_marks}</td>
                                    <td>{a.due_date ? <span style={{ color: isOverdue(a.due_date) ? '#ef4444' : 'var(--text-muted)' }}>{new Date(a.due_date).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}{isOverdue(a.due_date) && ' ⚠️'}</span> : '—'}</td>
                                    <td><button className="badge badge-primary" onClick={() => handleViewSubmissions(a)} style={{ cursor: 'pointer', border: 'none' }}>{a.submission_count} submitted</button></td>
                                    <td><span className={`badge ${isOverdue(a.due_date) ? 'badge-danger' : 'badge-success'}`}>{isOverdue(a.due_date) ? 'Overdue' : 'Active'}</span></td>
                                    <td>
                                        <button className="btn btn-sm btn-ghost" onClick={() => handleDelete(a.id)} style={{ color: '#ef4444', padding: '4px 8px' }} title="Delete Assignment">
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Create Modal ── */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <h2 className="modal-title" style={{ margin: 0 }}>New Assignment</h2>
                            <button className="btn btn-sm btn-ghost" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        {/* ─ STEP: method ─ */}
                        {step === 'method' && (
                            <>
                                <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>How do you want to create this assignment?</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setStep('ai_config')}
                                        style={{ padding: '28px 20px', border: '2px solid var(--border)', borderRadius: '12px', background: 'var(--bg-secondary)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}
                                        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
                                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                                    >
                                        <div style={{ fontSize: '36px', marginBottom: '12px' }}>✨</div>
                                        <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>Generate with AI</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Describe a topic — AI builds the full task for you</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStep('pdf')}
                                        style={{ padding: '28px 20px', border: '2px solid var(--border)', borderRadius: '12px', background: 'var(--bg-secondary)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}
                                        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
                                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                                    >
                                        <div style={{ fontSize: '36px', marginBottom: '12px' }}>📄</div>
                                        <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>Upload PDF</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Upload a task sheet or instructions PDF</div>
                                    </button>
                                </div>
                            </>
                        )}

                        {/* ─ STEP: ai_config ─ */}
                        {step === 'ai_config' && (
                            <>
                                <StepIndicator steps={aiSteps} current={1} />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
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
                                                <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                                            </select>
                                        </div>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <label className="form-label">Items Count</label>
                                            <input type="number" min={1} max={25} className="form-input" value={aiQuestionCount} onChange={e => setAiQuestionCount(parseInt(e.target.value) || 5)} />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <label className="form-label">Time Limit (mins, 0=none)</label>
                                            <input type="number" min={0} className="form-input" value={aiTimeLimit} onChange={e => setAiTimeLimit(parseInt(e.target.value) || 0)} />
                                        </div>
                                        <div className="form-group" style={{ margin: 0, display: 'flex', alignItems: 'center', paddingTop: '28px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
                                                <input type="checkbox" checked={aiRandomize} onChange={e => setAiRandomize(e.target.checked)} style={{ transform: 'scale(1.2)' }} />
                                                Shuffle questions per student
                                            </label>
                                        </div>
                                    </div>

                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label className="form-label">Topic / Subject *</label>
                                        <input className="form-input" value={aiTopic} onChange={e => { setAiTopic(e.target.value); setAiError(''); }}
                                            placeholder="e.g. Spring Boot REST API, React Hooks, SQL Joins..." />
                                        {aiError && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '6px' }}>⚠️ {aiError}</p>}
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                        <button type="button" className="btn btn-ghost" onClick={() => setStep('method')}>← Back</button>
                                        <button type="button" className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
                                            {generating ? '⏳ Generating...' : '✨ Generate Task'}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ─ STEP: ai_review ─ */}
                        {step === 'ai_review' && aiPreview && (
                            <>
                                <StepIndicator steps={aiSteps} current={2} />
                                <div style={{ background: 'var(--bg-secondary)', borderRadius: '10px', padding: '16px', marginBottom: '16px', border: '1px solid #10b98130' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                        <div>
                                            <p style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>✨ AI Generated — Review & Edit</p>
                                            <h3 style={{ margin: 0, fontSize: '16px' }}>{aiPreview.title}</h3>
                                        </div>
                                        <span style={{ fontSize: '11px', padding: '2px 8px', background: `${typeColors[form.type]}20`, color: typeColors[form.type], borderRadius: '99px', fontWeight: 600 }}>
                                            {aiDifficulty}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 10px' }}>{aiPreview.description}</p>
                                    {aiPreview.requirements?.length > 0 && (
                                        <div>
                                            <p style={{ fontSize: '12px', fontWeight: 600, margin: '0 0 6px' }}>Requirements:</p>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                {aiPreview.requirements.map((r: string, i: number) => (
                                                    <div key={i} style={{ fontSize: '12px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                                                        <span style={{ color: '#10b981', fontWeight: 700 }}>{i + 1}.</span> {r}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {aiPreview.hints?.length > 0 && (
                                        <div style={{ marginTop: '10px' }}>
                                            <p style={{ fontSize: '12px', fontWeight: 600, margin: '0 0 4px' }}>💡 Hints:</p>
                                            {aiPreview.hints.map((h: string, i: number) => (
                                                <div key={i} style={{ fontSize: '12px', color: 'var(--text-muted)' }}>• {h}</div>
                                            ))}
                                        </div>
                                    )}
                                    {aiPreview.estimated_hours && (
                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', marginBottom: 0 }}>⏱ Estimated: {aiPreview.estimated_hours} hours</p>
                                    )}
                                </div>

                                {/* Editable fields */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label className="form-label">Edit Title</label>
                                        <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label className="form-label">Edit Description / Instructions</label>
                                        <textarea className="form-input" rows={5} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                                    <button type="button" className="btn btn-ghost" onClick={() => setStep('ai_config')}>← Regenerate</button>
                                    <button type="button" className="btn btn-primary" onClick={() => setStep('assign')}>Next: Assign To →</button>
                                </div>
                            </>
                        )}

                        {/* ─ STEP: pdf ─ */}
                        {step === 'pdf' && (
                            <>
                                <StepIndicator steps={pdfSteps} current={1} />
                                <div className="form-group" style={{ margin: '0 0 14px' }}>
                                    <label className="form-label">Title *</label>
                                    <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Build a Student Management API" />
                                </div>
                                <div
                                    style={{ border: '2px dashed var(--border)', borderRadius: '10px', padding: '28px', textAlign: 'center', cursor: 'pointer', background: 'var(--bg-secondary)', marginBottom: '16px' }}
                                    onClick={() => fileRef.current?.click()}
                                >
                                    <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => setPdfFile(e.target.files?.[0] || null)} />
                                    {pdfFile ? (
                                        <div><div style={{ fontSize: '32px', marginBottom: '8px' }}>📄</div>
                                            <p style={{ fontWeight: 600, margin: '0 0 4px' }}>{pdfFile.name}</p>
                                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{(pdfFile.size / 1024).toFixed(1)} KB — click to change</p>
                                        </div>
                                    ) : (
                                        <div><div style={{ fontSize: '40px', marginBottom: '8px' }}>📂</div>
                                            <p style={{ fontWeight: 600, margin: '0 0 4px' }}>Click to upload PDF</p>
                                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Task sheet or instructions (PDF only)</p>
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button type="button" className="btn btn-ghost" onClick={() => setStep('method')}>← Back</button>
                                    <button type="button" className="btn btn-primary" disabled={!form.title.trim()} onClick={() => setStep('assign')}>Next: Assign To →</button>
                                </div>
                            </>
                        )}

                        {/* ─ STEP: assign ─ */}
                        {(step === 'assign') && (
                            <>
                                <StepIndicator steps={step === 'assign' ? (aiPreview ? aiSteps : pdfSteps) : []} current={aiPreview ? 3 : 2} />
                                <p style={{ fontWeight: 600, marginBottom: '12px' }}>Who should receive this assignment?</p>

                                {/* Radio toggle */}
                                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                    {['batch', 'student'].map(t => (
                                        <button key={t} type="button" onClick={() => { setAssignTarget(t as any); setSelectedStudent(''); }}
                                            style={{ flex: 1, padding: '12px', border: `2px solid ${assignTarget === t ? 'var(--primary)' : 'var(--border)'}`, borderRadius: '10px', background: assignTarget === t ? 'var(--primary)10' : 'var(--bg-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '14px', color: assignTarget === t ? 'var(--primary)' : 'var(--text-primary)' }}>
                                            {t === 'batch' ? '🏫 Entire Batch' : '👤 Specific Student'}
                                        </button>
                                    ))}
                                </div>

                                {/* Batch selector */}
                                <div className="form-group">
                                    <label className="form-label">Select Batch {assignTarget === 'batch' ? '*' : '(to pick student from)'}</label>
                                    <select className="form-input" value={selectedBatch} onChange={e => { setSelectedBatch(e.target.value); setSelectedStudent(''); loadStudents(e.target.value); }}>
                                        <option value="">— Select Batch —</option>
                                        {batches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.course_name})</option>)}
                                    </select>
                                </div>

                                {/* Student selector */}
                                {assignTarget === 'student' && selectedBatch && (
                                    <div className="form-group">
                                        <label className="form-label">Select Student *</label>
                                        <select className="form-input" value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
                                            <option value="">— Select Student —</option>
                                            {batchStudents.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
                                        </select>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                                    <button type="button" className="btn btn-ghost" onClick={() => setStep(aiPreview ? 'ai_review' : 'pdf')}>← Back</button>
                                    <button type="button" className="btn btn-primary"
                                        disabled={!selectedBatch && assignTarget === 'batch' || (assignTarget === 'student' && !selectedStudent)}
                                        onClick={() => setStep('common')}>
                                        Next: Details →
                                    </button>
                                </div>
                            </>
                        )}

                        {/* ─ STEP: common ─ */}
                        {step === 'common' && (
                            <>
                                <StepIndicator steps={aiPreview ? aiSteps : pdfSteps} current={aiPreview ? 4 : 3} />
                                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Title *</label>
                                        <input className="form-input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Description / Instructions</label>
                                        <textarea className="form-input" rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
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
                                            <label className="form-label">Marks</label>
                                            <input type="number" className="form-input" value={form.total_marks} onChange={e => setForm({ ...form, total_marks: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Due Time</label>
                                            <input type="datetime-local" className="form-input" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Limit (Min)</label>
                                            <input type="number" placeholder="0 = No limit" className="form-input" value={form.time_limit} onChange={e => setForm({ ...form, time_limit: e.target.value })} />
                                        </div>
                                    </div>

                                    {/* Summary */}
                                    <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                        📋 <strong>Assigning to:</strong> {assignTarget === 'batch'
                                            ? `${batches.find(b => b.id === selectedBatch)?.name || 'Selected batch'} (all students)`
                                            : `${batchStudents.find((s: any) => s.id === selectedStudent)?.name || 'Selected student'}`
                                        }
                                        {aiPreview && <> · <span style={{ color: '#10b981' }}>✨ AI Generated</span></>}
                                        {pdfFile && <> · <span style={{ color: '#6366f1' }}>📄 {pdfFile.name}</span></>}
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                        <button type="button" className="btn btn-ghost" onClick={() => setStep('assign')}>← Back</button>
                                        <button type="submit" className="btn btn-primary" disabled={saving}>
                                            {saving ? 'Creating...' : '✅ Create Assignment'}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ── Submissions Modal ── */}
            {viewSubmissions && (
                <div className="modal-overlay" onClick={() => { setViewSubmissions(null); setSubmissionsData([]); }}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 className="modal-title" style={{ margin: 0 }}>Submissions: {viewSubmissions.title}</h2>
                            <button className="btn btn-sm btn-ghost" onClick={() => { setViewSubmissions(null); setSubmissionsData([]); }}>✕ Close</button>
                        </div>
                        {submissionsData.length === 0 ? (
                            <div className="empty-state"><div className="empty-icon">📭</div><p className="text-muted">No submissions yet.</p></div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                    <button className={`btn btn-sm ${subFilter === 'ALL' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSubFilter('ALL')}>All</button>
                                    <button className={`btn btn-sm ${subFilter === 'SUBMITTED' ? 'btn-success' : 'btn-ghost'}`} onClick={() => setSubFilter('SUBMITTED')}>Completed</button>
                                    <button className={`btn btn-sm ${subFilter === 'PENDING' ? 'btn-danger' : 'btn-ghost'}`} onClick={() => setSubFilter('PENDING')}>Missing</button>
                                </div>
                                {submissionsData.filter(s => subFilter === 'ALL' ? true : subFilter === 'SUBMITTED' ? s.status === 'SUBMITTED' : s.status !== 'SUBMITTED').map(sub => (
                                    <div key={sub.id} className="card" style={{ padding: '16px', background: 'var(--bg-secondary)', border: sub.proctoring_report?.auto_submitted ? '1px solid #ef444430' : (sub.status !== 'SUBMITTED' ? '1px dashed #ef444450' : '1px solid var(--border)') }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {sub.student_name}
                                                    {sub.status !== 'SUBMITTED' && <span className="badge badge-warning" style={{ fontSize: '10px' }}>{sub.status}</span>}
                                                </h3>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                    {sub.status === 'SUBMITTED' ? (sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : 'Processing') : 'Awaiting Submission'}
                                                </div>
                                            </div>
                                            {(sub.status === 'SUBMITTED' || sub.status === 'IN_PROGRESS') && (
                                                <div style={{ textAlign: 'right' }}>
                                                    {sub.proctoring_report?.auto_submitted && (
                                                        <span className="badge badge-danger" style={{ marginBottom: '4px', display: 'inline-block' }}>⚠️ AUTO-SUBMITTED</span>
                                                    )}
                                                    <div style={{ fontSize: '11px', fontWeight: 600 }}>
                                                        ⏱️ {Math.floor((sub.proctoring_report?.completion_time || 0) / 60)}m {(sub.proctoring_report?.completion_time || 0) % 60}s
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Proctoring Report Brief */}
                                        {(sub.status === 'SUBMITTED' || sub.status === 'IN_PROGRESS') && (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tab Switches</div>
                                                    <div style={{ fontSize: '14px', fontWeight: 700, color: sub.proctoring_report?.tab_switches > 0 ? '#ef4444' : 'inherit' }}>{sub.proctoring_report?.tab_switches || 0}</div>
                                                </div>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>FS Exits</div>
                                                    <div style={{ fontSize: '14px', fontWeight: 700, color: sub.proctoring_report?.fullscreen_exits > 0 ? '#ef4444' : 'inherit' }}>{sub.proctoring_report?.fullscreen_exits || 0}</div>
                                                </div>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Face Violations</div>
                                                    <div style={{ fontSize: '14px', fontWeight: 700, color: sub.proctoring_report?.face_violations > 0 ? '#ef4444' : 'inherit' }}>{sub.proctoring_report?.face_violations || 0}</div>
                                                </div>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mic Interrupts</div>
                                                    <div style={{ fontSize: '14px', fontWeight: 700, color: sub.proctoring_report?.mic_violations > 0 ? '#ef4444' : 'inherit' }}>{sub.proctoring_report?.mic_violations || 0}</div>
                                                </div>
                                            </div>
                                        )}

                                        {sub.content && sub.status === 'SUBMITTED' && (
                                            <pre style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '12px', borderRadius: '8px', overflowX: 'auto', fontSize: '12px', border: '1px solid var(--border)', marginTop: '4px' }}>
                                                {sub.content.slice(0, 400)}{sub.content.length > 400 ? '...' : ''}
                                            </pre>
                                        )}
                                        {sub.file_url && sub.status === 'SUBMITTED' && (
                                            <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '12px' }}>📥 Download PDF</a>
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
