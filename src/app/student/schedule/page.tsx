'use client';

import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '@/lib/api';

interface Session {
    id: string; title: string; description: string;
    batch_id: string; trainer_id: string;
    start_time: string; end_time: string;
    status: string; meeting_link: string | null; resources_url: string | null;
}

export default function StudentSchedulePage() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'UPCOMING' | 'PAST'>('UPCOMING');
    
    // Feedback Modal State
    const [feedbackModal, setFeedbackModal] = useState<Session | null>(null);
    const [rating, setRating] = useState(0);
    const [comments, setComments] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [submittingFeedback, setSubmittingFeedback] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await apiGet('/api/sessions');
            setSessions(res || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const submitFeedback = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!feedbackModal || rating === 0) return alert('Please provide a star rating.');
        
        setSubmittingFeedback(true);
        try {
            const payload = {
                target_type: 'SESSION',
                target_id: feedbackModal.id,
                rating,
                comments,
                is_anonymous: isAnonymous
            };
            await apiPost('/api/sessions/feedback', payload);
            setFeedbackModal(null);
            setRating(0); setComments(''); setIsAnonymous(false);
            alert('Feedback submitted successfully!');
        } catch (err: any) {
            alert(err.message || 'Failed to submit feedback');
        } finally {
            setSubmittingFeedback(false);
        }
    };

    const upcoming = sessions.filter(s => s.status === 'SCHEDULED' || s.status === 'ONGOING');
    const past = sessions.filter(s => s.status === 'COMPLETED' || s.status === 'CANCELLED');
    const displayed = activeTab === 'UPCOMING' ? upcoming : past;

    return (
        <div className="reveal-on-scroll active">
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Class Schedule</h1>
                    <p className="page-subtitle">View your upcoming live classes, join meetings, and access post-class materials.</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                <button className={`btn ${activeTab === 'UPCOMING' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('UPCOMING')}>
                    Upcoming Classes ({upcoming.length})
                </button>
                <button className={`btn ${activeTab === 'PAST' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('PAST')}>
                    Past Classes ({past.length})
                </button>
            </div>

            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}><div className="animate-spin" style={{ fontSize: '32px' }}>🔄</div></div>
            ) : displayed.length === 0 ? (
                <div className="glass-premium" style={{ padding: '80px', textAlign: 'center', borderRadius: '24px' }}>
                    <div style={{ fontSize: '64px', marginBottom: '24px' }}>🛋️</div>
                    <h3 style={{ fontSize: '20px', fontWeight: 700 }}>No {activeTab.toLowerCase()} classes.</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Relax! You have no classes scheduled for now.</p>
                </div>
            ) : (
                <div className="grid-3">
                    {displayed.map(s => (
                        <div key={s.id} className="card hover-lift" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div style={{ marginBottom: 'auto' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '12px', background: s.status === 'ONGOING' ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.1)', color: s.status === 'ONGOING' ? 'var(--success)' : 'var(--primary)', letterSpacing: '0.05em' }}>
                                        {s.status}
                                    </span>
                                </div>
                                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px', lineHeight: 1.3 }}>{s.title}</h3>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.5 }}>{s.description || 'No description provided.'}</p>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '13px', color: 'var(--text-primary)' }}>
                                    <span style={{ fontSize: '16px' }}>🕒</span> 
                                    <span style={{ fontWeight: 600 }}>{new Date(s.start_time).toLocaleString('en-IN', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})}</span>
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '24px', marginBottom: '20px' }}>
                                    Duration: {Math.round((new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 60000)} mins
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {activeTab === 'UPCOMING' && s.meeting_link && (
                                    <a href={s.meeting_link} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ width: '100%', textAlign: 'center', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none' }}>🎥 Join Meeting</a>
                                )}
                                {s.resources_url && (
                                    <a href={s.resources_url} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ width: '100%', textAlign: 'center', color: 'var(--info)', border: '1px solid var(--border)' }}>📚 View Resources</a>
                                )}
                                {s.status === 'COMPLETED' && (
                                    <button className="btn btn-sm btn-ghost" style={{ width: '100%', marginTop: '4px' }} onClick={() => setFeedbackModal(s)}>⭐ Rate this Session</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Feedback Lightbox Modal */}
            {feedbackModal && (
                <div className="modal-overlay" onClick={() => !submittingFeedback && setFeedbackModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <div style={{ fontSize: '40px', marginBottom: '8px' }}>⭐</div>
                            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Class Feedback</h2>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>{feedbackModal.title}</p>
                        </div>

                        <form onSubmit={submitFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                {[1, 2, 3, 4, 5].map(star => (
                                    <span 
                                        key={star} 
                                        onClick={() => setRating(star)}
                                        style={{ fontSize: '32px', cursor: 'pointer', transition: 'all 0.2s', filter: rating >= star ? 'grayscale(0%)' : 'grayscale(100%) opacity(30%)', transform: rating === star ? 'scale(1.2)' : 'scale(1)' }}
                                    >
                                        ⭐
                                    </span>
                                ))}
                            </div>
                            
                            <div className="form-group mb-0">
                                <label className="form-label">Additional Comments (Optional)</label>
                                <textarea className="form-textarea" rows={4} placeholder="What did you like? What could be improved?" value={comments} onChange={e => setComments(e.target.value)} />
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: isAnonymous ? 'rgba(99,102,241,0.08)' : 'var(--bg-secondary)', padding: '12px', borderRadius: '12px', border: `1px solid ${isAnonymous ? '#6366f1' : 'var(--border)'}` }}>
                                <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#6366f1' }} />
                                <div style={{ fontSize: '13px', fontWeight: 600 }}>Submit Anonymously</div>
                                <div style={{ marginLeft: 'auto', fontSize: '18px' }}>🎭</div>
                            </label>

                            <div className="modal-footer" style={{ marginTop: '4px' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setFeedbackModal(null)} disabled={submittingFeedback}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', border: 'none', color: '#000' }} disabled={submittingFeedback || rating === 0}>
                                    {submittingFeedback ? 'Posting...' : 'Submit Evaluation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
