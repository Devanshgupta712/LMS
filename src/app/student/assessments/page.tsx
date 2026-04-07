'use client';

import { useState, useEffect, useRef } from 'react';
import { apiGet, apiFetch } from '@/lib/api';
import WebDevEditor from '@/components/WebDevEditor';

export default function StudentAssessmentsPage() {
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSubmission, setActiveSubmission] = useState<any>(null);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitDone, setSubmitDone] = useState(false);

    const [content, setContent] = useState('');
    const [file, setFile] = useState<File | null>(null);

    // Browser Lock State
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const tabCountRef = useRef(0);

    useEffect(() => { loadAssignments(); }, []);

    // Tab Switching Detection Setup
    useEffect(() => {
        if (!activeSubmission) {
            setTabSwitchCount(0);
            tabCountRef.current = 0;
            return;
        }

        const onVisibilityChange = () => {
            if (document.hidden && activeSubmission && !submitDone) {
                tabCountRef.current += 1;
                setTabSwitchCount(tabCountRef.current);
                if (tabCountRef.current >= 3) {
                    forceSubmit('tab_limit_exceeded');
                }
            }
        };

        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => document.removeEventListener('visibilitychange', onVisibilityChange);
    }, [activeSubmission, submitDone]);

    const loadAssignments = async () => {
        try {
            setAssignments(await apiGet('/api/training/assignments'));
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const forceSubmit = async (reason: string) => {
        alert(`Assignment Auto-Submitted: ${reason.replace('_', ' ')}`);
        submitHandler(true);
    };

    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
    };

    const submitHandler = async (isAuto = false) => {
        setSubmitLoading(true);
        try {
            const formData = new FormData();
            if (content) formData.append('content', content);
            if (file) formData.append('file', file);

            const res = await apiFetch(`/api/training/assignments/${activeSubmission.id}/submit`, {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                setSubmitDone(true);
                setTimeout(() => {
                    setActiveSubmission(null);
                    setContent('');
                    setFile(null);
                    setSubmitDone(false);
                    setTabSwitchCount(0);
                    tabCountRef.current = 0;
                    loadAssignments();
                }, 1500);
            } else {
                alert('Submission failed. Please try again.');
            }
        } catch (error) {
            console.error(error);
            alert('Error submitting. Please try again.');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        submitHandler(false);
    };

    const isOverdue = (dueDate: string | null) => {
        if (!dueDate) return false;
        return new Date(dueDate) < new Date();
    };

    const pending = assignments.filter(a => !a.my_submission);
    const completed = assignments.filter(a => a.my_submission);

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Assignments</h1>
                    <p className="page-subtitle">View and submit your graded assignments</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid-4 mb-24">
                <div className="stat-card primary"><div className="stat-icon primary">📝</div><div className="stat-info"><h3>Total</h3><div className="stat-value">{assignments.length}</div></div></div>
                <div className="stat-card success"><div className="stat-icon success">✅</div><div className="stat-info"><h3>Submitted</h3><div className="stat-value">{completed.length}</div></div></div>
                <div className="stat-card danger"><div className="stat-icon danger">⏰</div><div className="stat-info"><h3>Pending</h3><div className="stat-value">{pending.length}</div></div></div>
                <div className="stat-card accent"><div className="stat-icon accent">⚠️</div><div className="stat-info"><h3>Overdue</h3><div className="stat-value">{pending.filter(a => isOverdue(a.due_date)).length}</div></div></div>
            </div>

            {loading ? <p>Loading...</p> : assignments.length === 0 ? (
                <div className="card"><div className="empty-state"><div className="empty-icon">📝</div><h3>No assignments yet</h3><p className="text-sm text-muted">Your trainer hasn't posted any assignments yet.</p></div></div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                    {assignments.map(a => (
                        <div key={a.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <h3 style={{ margin: 0, fontWeight: 600 }}>{a.title}</h3>
                                <span className={`badge ${a.my_submission ? 'badge-success' : isOverdue(a.due_date) ? 'badge-danger' : 'badge-warning'}`}>
                                    {a.my_submission ? 'Submitted' : isOverdue(a.due_date) ? 'Overdue' : 'Pending'}
                                </span>
                            </div>

                            <p className="text-muted text-sm" style={{ margin: 0 }}>
                                {a.description?.slice(0, 100)}{a.description?.length > 100 ? '...' : ''}
                            </p>

                            <div style={{ display: 'flex', gap: '8px', fontSize: '12px', flexWrap: 'wrap' }}>
                                <span style={{ padding: '4px 8px', background: 'var(--bg-secondary)', borderRadius: '4px' }}>🏆 {a.total_marks} Marks</span>
                                {a.due_date && (
                                    <span style={{ padding: '4px 8px', background: 'var(--bg-secondary)', borderRadius: '4px', color: isOverdue(a.due_date) ? '#ef4444' : 'inherit' }}>
                                        📅 {new Date(a.due_date).toLocaleDateString()}
                                    </span>
                                )}
                            </div>

                            {a.my_submission ? (
                                <div style={{ background: 'rgba(74, 222, 128, 0.08)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(74, 222, 128, 0.2)', fontSize: '13px', color: '#4ade80' }}>
                                    ✅ Submitted successfully
                                </div>
                            ) : (
                                <button
                                    className="btn btn-primary"
                                    style={{ width: '100%', marginTop: 'auto' }}
                                    onClick={() => { setActiveSubmission(a); setContent(''); setFile(null); setSubmitDone(false); }}
                                    disabled={isOverdue(a.due_date)}
                                >
                                    {isOverdue(a.due_date) ? 'Deadline Passed' : 'Submit Assignment'}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Submission Modal */}
            {activeSubmission && (
                <div className="modal-overlay" onClick={() => setActiveSubmission(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '95vw', maxWidth: 'none', height: '95vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 className="modal-title" style={{ margin: 0 }}>{activeSubmission.title}</h2>
                            <button className="btn btn-sm btn-ghost" onClick={() => setActiveSubmission(null)}>✕</button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {activeSubmission.description && (
                                <div style={{ background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '10px', fontSize: '14px', marginBottom: '16px', lineHeight: 1.6 }}>
                                    {activeSubmission.description}
                                </div>
                            )}

                        {submitDone ? (
                            <div style={{ textAlign: 'center', padding: '32px', color: '#4ade80' }}>
                                <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
                                <h3>Submitted Successfully!</h3>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                                {tabSwitchCount > 0 && (
                                    <div style={{ color: 'red', fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>
                                        ⚠️ Tab Switches: {tabSwitchCount}/3 (Warning: Assignment will auto-submit on 3rd switch!)
                                    </div>
                                )}

                                {/* Web Dev Editor */}
                                {file === null && (
                                    <WebDevEditor 
                                        code={content} 
                                        onChange={(val) => setContent(val)} 
                                    />
                                )}

                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <hr style={{ flex: 1, borderColor: 'var(--border)' }} />
                                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>OR</span>
                                    <hr style={{ flex: 1, borderColor: 'var(--border)' }} />
                                </div>

                                {/* PDF Upload */}
                                <div className="form-group">
                                    <label className="form-label">Upload PDF</label>
                                    <div
                                        onDragOver={e => e.preventDefault()}
                                        onDrop={handleFileDrop}
                                        style={{
                                            border: '2px dashed var(--border)',
                                            padding: '28px',
                                            borderRadius: '12px',
                                            textAlign: 'center',
                                            opacity: content ? 0.4 : 1,
                                            transition: '0.2s',
                                            background: 'var(--bg-secondary)'
                                        }}
                                    >
                                        {file ? (
                                            <div style={{ color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                📄 {file.name}
                                                <button type="button" onClick={() => setFile(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                                            </div>
                                        ) : (
                                            <div>
                                                <p style={{ margin: '0 0 8px 0', color: 'var(--text-muted)' }}>Drag & drop your PDF here</p>
                                                <input type="file" accept=".pdf" onChange={e => e.target.files && setFile(e.target.files[0])} disabled={content.length > 0} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                                    <button type="button" className="btn btn-ghost" onClick={() => setActiveSubmission(null)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={submitLoading || (!content && !file)}>
                                        {submitLoading ? '⏳ Submitting...' : '📤 Submit Assignment'}
                                    </button>
                                </div>
                            </form>
                        )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
