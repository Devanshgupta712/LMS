'use client';

import { useState } from 'react';
import { apiPost } from '@/lib/api';

const CATEGORIES = ['General', 'Curriculum', 'Technical', 'Faculty', 'Infrastructure', 'Other'];

export default function SuggestionBox() {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ message: '', category: 'General', is_anonymous: false });
    const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.message.trim()) return;
        setStatus('sending');
        try {
            await apiPost('/api/auth/suggestions', form);
            setStatus('sent');
            setForm({ message: '', category: 'General', is_anonymous: false });
            setTimeout(() => { setStatus('idle'); setOpen(false); }, 2200);
        } catch {
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    return (
        <>
            {/* Floating trigger button */}
            <button
                onClick={() => setOpen(true)}
                title="Submit a suggestion"
                style={{
                    position: 'fixed',
                    bottom: '90px',
                    right: '24px',
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    boxShadow: '0 4px 20px rgba(99,102,241,0.5)',
                    zIndex: 1500,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.12)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 28px rgba(99,102,241,0.7)';
                }}
                onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(99,102,241,0.5)';
                }}
            >
                💡
            </button>

            {/* Modal */}
            {open && (
                <div className="modal-overlay" onClick={() => setOpen(false)} style={{ zIndex: 3000 }}>
                    <div
                        className="modal"
                        onClick={e => e.stopPropagation()}
                        style={{ maxWidth: '480px' }}
                    >
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'
                            }}>💡</div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Suggestion Box</h2>
                                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                                    Share your ideas, feedback, or concerns with the team
                                </p>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
                            >✕</button>
                        </div>

                        {status === 'sent' ? (
                            <div style={{
                                textAlign: 'center', padding: '32px 16px',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px'
                            }}>
                                <div style={{ fontSize: '52px' }}>🎉</div>
                                <h3 style={{ margin: 0, color: 'var(--success)' }}>Thank you!</h3>
                                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                                    Your suggestion has been submitted. We read every one!
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {/* Category */}
                                <div className="form-group mb-0">
                                    <label className="form-label">Category</label>
                                    <select
                                        className="form-select"
                                        value={form.category}
                                        onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                    >
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                {/* Message */}
                                <div className="form-group mb-0">
                                    <label className="form-label">Your Suggestion</label>
                                    <textarea
                                        className="form-textarea"
                                        rows={5}
                                        placeholder="Share your idea, concern, or feedback here... Be as specific as possible!"
                                        required
                                        maxLength={2000}
                                        value={form.message}
                                        onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                                        style={{ resize: 'vertical' }}
                                    />
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right', marginTop: '4px' }}>
                                        {form.message.length}/2000
                                    </div>
                                </div>

                                {/* Anonymous toggle */}
                                <label style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '12px 14px', borderRadius: '12px', cursor: 'pointer',
                                    background: form.is_anonymous ? 'rgba(99,102,241,0.08)' : 'var(--bg-secondary)',
                                    border: `1px solid ${form.is_anonymous ? '#6366f1' : 'var(--border)'}`,
                                    transition: 'all 0.2s'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={form.is_anonymous}
                                        onChange={e => setForm(f => ({ ...f, is_anonymous: e.target.checked }))}
                                        style={{ width: '16px', height: '16px', accentColor: '#6366f1' }}
                                    />
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '13px' }}>Submit anonymously</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                            Your name won&apos;t appear on the suggestion
                                        </div>
                                    </div>
                                    <span style={{ marginLeft: 'auto', fontSize: '18px' }}>🎭</span>
                                </label>

                                {status === 'error' && (
                                    <div style={{
                                        padding: '10px 14px', borderRadius: '10px',
                                        background: 'rgba(239,68,68,0.1)', color: '#dc2626',
                                        border: '1px solid rgba(239,68,68,0.3)', fontSize: '13px'
                                    }}>
                                        ❌ Failed to submit. Please try again.
                                    </div>
                                )}

                                <div className="modal-footer" style={{ paddingTop: '4px' }}>
                                    <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={status === 'sending' || !form.message.trim()}
                                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none' }}
                                    >
                                        {status === 'sending' ? '⏳ Sending...' : '🚀 Submit Suggestion'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
