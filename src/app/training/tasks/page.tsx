'use client';

import { useState, useEffect, useRef } from 'react';
import { apiGet, apiFetch, API_BASE } from '@/lib/api';

interface TaskItem {
    id: string; title: string; description: string | null;
    batch_id: string | null; student_id: string | null;
    priority: string; status: string;
    assigned_by: string | null; due_date: string | null;
    pdf_url: string | null; created_at: string;
}

const isOverdue = (d: string | null) => d ? new Date(d) < new Date() : false;

const priorityColors: Record<string, string> = { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#f97316', URGENT: '#ef4444' };
const statusColors: Record<string, string> = { PENDING: '#94a3b8', IN_PROGRESS: '#3b82f6', COMPLETED: '#10b981' };

type ModalStep = 'method' | 'ai_config' | 'ai_review' | 'pdf' | 'assign' | 'common';

export default function TasksPage() {
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [step, setStep] = useState<ModalStep>('method');
    const [filter, setFilter] = useState('ALL');

    // Batches & Students
    const [batches, setBatches] = useState<any[]>([]);
    const [batchStudents, setBatchStudents] = useState<any[]>([]);
    const [assignTarget, setAssignTarget] = useState<'batch' | 'student'>('batch');
    const [selectedBatch, setSelectedBatch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState('');

    // Shared form fields
    const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', due_date: '' });
    const [saving, setSaving] = useState(false);

    const [aiTopic, setAiTopic] = useState('');
    const [aiDifficulty, setAiDifficulty] = useState('Intermediate');
    const [aiTaskType, setAiTaskType] = useState('CODING');
    const [aiQuestionCount, setAiQuestionCount] = useState(5);
    const [aiTimeLimit, setAiTimeLimit] = useState(0);
    const [aiRandomize, setAiRandomize] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [aiPreview, setAiPreview] = useState<any>(null);
    const [aiError, setAiError] = useState('');

    // PDF upload state
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => { loadTasks(); loadBatches(); }, []);

    const loadTasks = async () => {
        try { setTasks(await apiGet('/api/training/tasks')); } catch { } finally { setLoading(false); }
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
        setForm({ title: '', description: '', priority: 'MEDIUM', due_date: '' });
        setAiTopic(''); setAiDifficulty('Intermediate');
        setAiPreview(null); setAiError('');
        setPdfFile(null);
        setSelectedBatch(''); setSelectedStudent('');
        setAssignTarget('batch'); setBatchStudents([]);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this task?')) return;
        try {
            const resp = await apiFetch(`/api/training/tasks/${id}`, { method: 'DELETE' });
            if (!resp.ok) throw new Error('Failed to delete task');
            loadTasks();
        } catch (e) {
            console.error('Delete error', e);
            alert('Could not delete task. You may not have permission.');
        }
    };

    // ── AI Generation ────────────────────────────────────────────────────────
    const handleGenerate = async () => {
        if (!aiTopic.trim()) { setAiError('Please enter a topic.'); return; }
        setGenerating(true); setAiError(''); setAiPreview(null);
        try {
            const resp = await apiFetch('/api/training/generate-task', {
                method: 'POST',
                body: JSON.stringify({ 
                    topic: aiTopic, task_type: aiTaskType, 
                    difficulty: aiDifficulty, question_count: Number(aiQuestionCount),
                    time_limit: Number(aiTimeLimit), is_randomized: aiRandomize
                })
            });
            if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.detail || 'Failed'); }
            const result = await resp.json();
            setAiPreview(result);
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
            setStep('ai_review');
        } catch (e: any) { setAiError(e?.message || 'AI generation failed.'); }
        finally { setGenerating(false); }
    };

    // ── Save Task ───────────────────────────────────────────────────────
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
                const uploadResp = await fetch(`${API_BASE}/api/training/upload-task-pdf`, {
                    method: 'POST', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: fd,
                });
                if (uploadResp.ok) { const d = await uploadResp.json(); pdfUrl = d.url; }
            }

            const body: any = {
                ...form,
                batch_id: selectedBatch || null,
                ...(selectedStudent ? { student_id: selectedStudent } : {}),
                ...(pdfUrl ? { pdf_url: pdfUrl } : {}),
                ...(aiPreview ? { 
                    structured_content: JSON.stringify(aiPreview),
                    time_limit: aiTimeLimit,
                    is_randomized: aiRandomize
                } : {})
            };

            const resp = await apiFetch('/api/training/tasks', { method: 'POST', body: JSON.stringify(body) });
            if (!resp.ok) {
                const errJson = await resp.json().catch(() => ({}));
                throw new Error(errJson.detail || 'Failed to create');
            }
            setShowModal(false); resetModal(); loadTasks();
        } catch (e: any) {
            console.error('Task creation error:', e);
            alert(`Error: ${e.message}`);
        } finally { setSaving(false); }
    };

    const filtered = filter === 'ALL' ? tasks : tasks.filter(t => t.status === filter);

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
                    <h1 className="page-title">Tasks</h1>
                    <p className="page-subtitle">Daily & weekly practice tasks for students</p>
                </div>
                <button className="btn btn-primary" onClick={() => { resetModal(); setShowModal(true); }}>+ New Task</button>
            </div>

            {/* Stats */}
            <div className="grid-4 mb-24">
                <div className="stat-card primary"><div className="stat-icon primary">📋</div><div className="stat-info"><h3>Total Tasks</h3><div className="stat-value">{tasks.length}</div></div></div>
                <div className="stat-card accent"><div className="stat-icon accent">⏳</div><div className="stat-info"><h3>Pending</h3><div className="stat-value">{tasks.filter(t => t.status === 'PENDING').length}</div></div></div>
                <div className="stat-card success"><div className="stat-icon success">🔄</div><div className="stat-info"><h3>In Progress</h3><div className="stat-value">{tasks.filter(t => t.status === 'IN_PROGRESS').length}</div></div></div>
                <div className="stat-card danger"><div className="stat-icon danger">✅</div><div className="stat-info"><h3>Completed</h3><div className="stat-value">{tasks.filter(t => t.status === 'COMPLETED').length}</div></div></div>
            </div>

            {/* Filter Tabs */}
            <div className="tabs">
                {['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].map(s => (
                    <button key={s} className={`tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
                        {s === 'ALL' ? 'All' : s.replace(/_/g, ' ')}
                    </button>
                ))}
            </div>

            {/* Task List */}
            {loading ? <p>Loading...</p> : filtered.length === 0 ? (
                <div className="card"><div className="empty-state"><div className="empty-icon">📋</div><h3>No tasks found</h3><p className="text-sm text-muted">Create your first task to get started</p></div></div>
            ) : (
                <div className="grid-3">
                    {filtered.map(task => (
                        <div key={task.id} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: priorityColors[task.priority] }} />
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, flex: 1 }}>{task.title}</h3>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <span className="badge" style={{ background: `${statusColors[task.status]}20`, color: statusColors[task.status], fontSize: '11px' }}>
                                        {task.status.replace(/_/g, ' ')}
                                    </span>
                                    {/* Delete Button */}
                                    <button className="btn btn-sm btn-ghost" onClick={() => handleDelete(task.id)} style={{ color: '#ef4444', padding: '4px', height: '24px', minHeight: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete Task">
                                        🗑️
                                    </button>
                                </div>
                            </div>
                            
                            {task.description && <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5, margin: '0 0 12px' }}>{task.description.slice(0, 150)}{task.description.length > 150 ? '...' : ''}</p>}
                            
                            {task.pdf_url && (
                                <a href={task.pdf_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary" style={{ display: 'inline-flex', marginBottom: '12px', fontSize: '12px' }}>
                                    📄 View Document
                                </a>
                            )}
                            
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: priorityColors[task.priority], display: 'inline-block' }} />
                                    {task.priority}
                                </span>
                                {task.due_date && <span>📅 {new Date(task.due_date).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}</span>}
                                {task.assigned_by && <span>👤 {task.assigned_by}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Create Task Modal ── */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <h2 className="modal-title" style={{ margin: 0 }}>New Task</h2>
                            <button className="btn btn-sm btn-ghost" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        {/* ─ STEP: method ─ */}
                        {step === 'method' && (
                            <>
                                <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>How do you want to create this task?</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <button type="button" onClick={() => setStep('ai_config')} style={{ padding: '28px 20px', border: '2px solid var(--border)', borderRadius: '12px', background: 'var(--bg-secondary)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
                                        <div style={{ fontSize: '36px', marginBottom: '12px' }}>✨</div>
                                        <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>Generate with AI</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Describe a topic — AI builds the full task for you</div>
                                    </button>
                                    <button type="button" onClick={() => setStep('pdf')} style={{ padding: '28px 20px', border: '2px solid var(--border)', borderRadius: '12px', background: 'var(--bg-secondary)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
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
                                            <label className="form-label">Task Format</label>
                                            <select className="form-input" value={aiTaskType} onChange={e => setAiTaskType(e.target.value)}>
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
                                        <input className="form-input" value={aiTopic} onChange={e => { setAiTopic(e.target.value); setAiError(''); }} placeholder="e.g. Set up a PostgreSQL Database..." />
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
                                            <p style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>✨ AI Generated — Review</p>
                                            <h3 style={{ margin: 0, fontSize: '16px' }}>{aiPreview.title}</h3>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 10px' }}>{aiPreview.description}</p>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label className="form-label">Edit Title</label>
                                        <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label className="form-label">Edit Description</label>
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
                                    <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Read Chapter 4 and implement exercise" />
                                </div>
                                <div style={{ border: '2px dashed var(--border)', borderRadius: '10px', padding: '28px', textAlign: 'center', cursor: 'pointer', background: 'var(--bg-secondary)', marginBottom: '16px' }} onClick={() => fileRef.current?.click()}>
                                    <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => setPdfFile(e.target.files?.[0] || null)} />
                                    {pdfFile ? (
                                        <div><div style={{ fontSize: '32px', marginBottom: '8px' }}>📄</div><p style={{ fontWeight: 600, margin: '0 0 4px' }}>{pdfFile.name}</p><p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{(pdfFile.size / 1024).toFixed(1)} KB — click to change</p></div>
                                    ) : (
                                        <div><div style={{ fontSize: '40px', marginBottom: '8px' }}>📂</div><p style={{ fontWeight: 600, margin: '0 0 4px' }}>Click to upload PDF</p><p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Task instructions (PDF)</p></div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button type="button" className="btn btn-ghost" onClick={() => setStep('method')}>← Back</button>
                                    <button type="button" className="btn btn-primary" disabled={!form.title.trim()} onClick={() => setStep('assign')}>Next: Assign To →</button>
                                </div>
                            </>
                        )}

                        {/* ─ STEP: assign ─ */}
                        {step === 'assign' && (
                            <>
                                <StepIndicator steps={aiPreview ? aiSteps : pdfSteps} current={aiPreview ? 3 : 2} />
                                <p style={{ fontWeight: 600, marginBottom: '12px' }}>Who should receive this task?</p>
                                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                    {['batch', 'student'].map(t => (
                                        <button key={t} type="button" onClick={() => { setAssignTarget(t as any); setSelectedStudent(''); }}
                                            style={{ flex: 1, padding: '12px', border: `2px solid ${assignTarget === t ? 'var(--primary)' : 'var(--border)'}`, borderRadius: '10px', background: assignTarget === t ? 'var(--primary)10' : 'var(--bg-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '14px', color: assignTarget === t ? 'var(--primary)' : 'var(--text-primary)' }}>
                                            {t === 'batch' ? '🏫 Entire Batch' : '👤 Specific Student'}
                                        </button>
                                    ))}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Select Batch {assignTarget === 'batch' ? '*' : '(to pick student from)'}</label>
                                    <select className="form-input" value={selectedBatch} onChange={e => { setSelectedBatch(e.target.value); setSelectedStudent(''); loadStudents(e.target.value); }}>
                                        <option value="">— Select Batch —</option>
                                        {batches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.course_name})</option>)}
                                    </select>
                                </div>

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
                                    <button type="button" className="btn btn-primary" disabled={(!selectedBatch && assignTarget === 'batch') || (assignTarget === 'student' && !selectedStudent)} onClick={() => setStep('common')}>Next: Details →</button>
                                </div>
                            </>
                        )}

                        {/* ─ STEP: common ─ */}
                        {step === 'common' && (
                            <>
                                <StepIndicator steps={aiPreview ? aiSteps : pdfSteps} current={aiPreview ? 4 : 3} />
                                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    <div className="form-group"><label className="form-label">Title *</label><input className="form-input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                                    <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div className="form-group">
                                            <label className="form-label">Priority</label>
                                            <select className="form-input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                                                <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option>
                                            </select>
                                        </div>
                                        <div className="form-group"><label className="form-label">Due Date & Time</label><input type="datetime-local" className="form-input" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
                                    </div>

                                    <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                        📋 <strong>Assigning to:</strong> {assignTarget === 'batch' ? `${batches.find(b => b.id === selectedBatch)?.name || 'Batch'} (all)` : `${batchStudents.find((s: any) => s.id === selectedStudent)?.name || 'Student'}`}
                                        {aiPreview && <> · <span style={{ color: '#10b981' }}>✨ AI Generated</span></>}
                                        {pdfFile && <> · <span style={{ color: '#6366f1' }}>📄 {pdfFile.name}</span></>}
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                                        <button type="button" className="btn btn-ghost" onClick={() => setStep('assign')}>← Back</button>
                                        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : '✅ Create Task'}</button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
