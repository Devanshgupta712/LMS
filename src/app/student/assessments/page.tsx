'use client';

import { useState, useEffect, useRef } from 'react';
import { apiGet, apiFetch } from '@/lib/api';

export default function StudentAssessmentsPage() {
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSubmission, setActiveSubmission] = useState<any>(null);
    const [submitLoading, setSubmitLoading] = useState(false);
    
    // Drag/Drop & Text Area State
    const [content, setContent] = useState('');
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => { loadAssignments(); }, []);

    const loadAssignments = async () => {
        try {
            setAssignments(await apiGet('/api/training/assignments'));
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitLoading(true);
        try {
            const formData = new FormData();
            if (content) formData.append('content', content);
            if (file) formData.append('file', file);

            await apiFetch(`/api/training/assignments/${activeSubmission.id}/submit`, {
                method: 'POST',
                body: formData
            });
            setActiveSubmission(null);
            setContent('');
            setFile(null);
            loadAssignments();
        } catch (error) {
            console.error(error);
            alert("Error submitting. Please try again.");
        } finally {
            setSubmitLoading(false);
        }
    };

    return (
        <div className="animate-in">
            <div className="page-header"><div><h1 className="page-title">My Assignments</h1><p className="page-subtitle">Complete assignments & receive instant AI evaluation</p></div></div>

            <div className="grid-4 mb-24 reveal-on-scroll active">
                <div className="stat-card primary"><div className="stat-icon primary">📝</div><div className="stat-info"><h3>Total</h3><div className="stat-value">{assignments.length}</div></div></div>
                <div className="stat-card success"><div className="stat-icon success">✅</div><div className="stat-info"><h3>Completed</h3><div className="stat-value">{assignments.filter(a => a.status === 'COMPLETED').length}</div></div></div>
                <div className="stat-card accent"><div className="stat-icon accent">🤖</div><div className="stat-info"><h3>AI Avg Score</h3><div className="stat-value">{assignments.filter(a => a.my_submission?.marks).length > 0 ? Math.round(assignments.filter(a => a.my_submission?.marks).reduce((s, a) => s + (a.my_submission.marks || 0), 0) / assignments.filter(a => a.my_submission?.marks).length) : 0}/100</div></div></div>
                <div className="stat-card danger"><div className="stat-icon danger">⏰</div><div className="stat-info"><h3>Pending</h3><div className="stat-value">{assignments.filter(a => a.status === 'PENDING').length}</div></div></div>
            </div>

            {loading ? <p>Loading...</p> : assignments.length === 0 ? (
                <div className="card"><div className="empty-state"><div className="empty-icon">📝</div><h3>No tasks assigned</h3></div></div>
            ) : (
                <div className="glass-premium reveal-on-scroll active" style={{ padding: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                        {assignments.map(a => (
                            <div key={a.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <h3 style={{ margin: 0, fontWeight: 600 }}>{a.title}</h3>
                                    <span className={`badge ${a.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>
                                        {a.status}
                                    </span>
                                </div>
                                
                                <p className="text-muted text-sm" style={{ margin: 0, height: '40px', overflow: 'hidden' }}>
                                    {a.description?.slice(0, 80)}...
                                </p>

                                <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                                    <span style={{ padding: '4px 8px', background: 'var(--bg-secondary)', borderRadius: '4px' }}>🏆 {a.total_marks} Pts</span>
                                    <span style={{ padding: '4px 8px', background: 'var(--bg-secondary)', borderRadius: '4px' }}>📅 {new Date(a.due_date).toLocaleDateString()}</span>
                                </div>

                                {a.status === 'COMPLETED' && a.my_submission ? (
                                    <div style={{ background: 'rgba(74, 222, 128, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(74, 222, 128, 0.2)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <span>🤖</span>
                                            <span style={{ fontWeight: 600, color: 'var(--primary)' }}>AI Score: {a.my_submission.marks}/{a.total_marks}</span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>"{a.my_submission.feedback}"</p>
                                    </div>
                                ) : (
                                    <button className="btn btn-primary" style={{ width: '100%', marginTop: 'auto' }} onClick={() => setActiveSubmission(a)}>
                                        Begin Task
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Twin-Input Submission Modal */}
            {activeSubmission && (
                <div className="modal-overlay" onClick={() => setActiveSubmission(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 className="modal-title" style={{ margin: 0 }}>{activeSubmission.title}</h2>
                            <button className="btn btn-sm btn-ghost" style={{ padding: '6px' }}>✨ Help Me Understand</button>
                        </div>
                        
                        <div className="p-4 rounded-xl mb-4" style={{ background: 'var(--bg-secondary)', fontSize: '14px' }}>
                            {activeSubmission.description}
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            
                            {/* Track A: Code Editor */}
                            <div className="form-group">
                                <label className="form-label">Write or Paste Code</label>
                                <textarea className="form-input" rows={8} style={{ fontFamily: 'monospace' }} placeholder="def solve_problem():&#10;    pass" value={content} onChange={e => setContent(e.target.value)} disabled={file !== null} />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <hr style={{ flex: 1, borderColor: 'var(--border)' }} />
                                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>OR</span>
                                <hr style={{ flex: 1, borderColor: 'var(--border)' }} />
                            </div>
                            
                            {/* Track B: PDF Drag & Drop */}
                            <div className="form-group">
                                <label className="form-label">Upload PDF</label>
                                <div 
                                    onDragOver={e => e.preventDefault()} 
                                    onDrop={handleFileDrop}
                                    style={{ border: '2px dashed var(--border-light)', padding: '32px', borderRadius: '12px', textAlign: 'center', background: content ? 'var(--bg-primary)' : 'var(--bg-secondary)', opacity: content ? 0.5 : 1, transition: '0.2s' }}
                                >
                                    {file ? (
                                        <div style={{ color: 'var(--primary)', fontWeight: 600 }}>📄 {file.name}</div>
                                    ) : (
                                        <div>
                                            <p style={{ margin: '0 0 8px 0' }}>Drag & drop your PDF file here</p>
                                            <input type="file" accept=".pdf" onChange={e => e.target.files && setFile(e.target.files[0])} disabled={content.length > 0} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setActiveSubmission(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitLoading || (!content && !file)}>
                                    {submitLoading ? '🤖 AI Evaluator Processing...' : 'Submit Submissions'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
