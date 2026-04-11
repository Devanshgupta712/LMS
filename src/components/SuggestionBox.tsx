'use client';

import { useState, useRef } from 'react';
import { apiPost } from '@/lib/api';

const CATEGORIES = ['General', 'Curriculum', 'Technical', 'Faculty', 'Infrastructure', 'Other'];

export default function SuggestionBox() {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ message: '', category: 'General', screenshot_base64: '' });
    const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Ensure file is an image
        if (!file.type.startsWith('image/')) {
            alert('Please upload a valid image file (PNG, JPG, JPEG)');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setForm(f => ({ ...f, screenshot_base64: base64String }));
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.message.trim()) return;
        setStatus('sending');
        try {
            await apiPost('/api/auth/suggestions', form);
            setStatus('sent');
            setForm({ message: '', category: 'General', screenshot_base64: '' });
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

                                {/* Screenshot Upload */}
                                <div className="form-group mb-0">
                                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Attach Screenshot (Optional)</span>
                                        {form.screenshot_base64 && (
                                            <span 
                                                style={{ color: 'var(--danger)', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                                                onClick={() => {
                                                    setForm(f => ({ ...f, screenshot_base64: '' }));
                                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                                }}
                                            >
                                                Remove Image
                                            </span>
                                        )}
                                    </label>
                                    
                                    {!form.screenshot_base64 ? (
                                        <div 
                                            onClick={() => fileInputRef.current?.click()}
                                            style={{
                                                border: '2px dashed var(--border)',
                                                borderRadius: '12px',
                                                padding: '20px',
                                                textAlign: 'center',
                                                cursor: 'pointer',
                                                background: 'var(--bg-secondary)',
                                                transition: 'all 0.2s',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                                        >
                                            <div style={{ fontSize: '24px' }}>🖼️</div>
                                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Click to upload screenshot</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PNG, JPG, or JPEG (Max 5MB)</div>
                                            <input 
                                                type="file" 
                                                ref={fileInputRef} 
                                                onChange={handleFileChange} 
                                                accept="image/png, image/jpeg, image/jpg" 
                                                style={{ display: 'none' }} 
                                            />
                                        </div>
                                    ) : (
                                        <div style={{ 
                                            position: 'relative', 
                                            width: '100%', 
                                            height: '140px', 
                                            borderRadius: '12px', 
                                            overflow: 'hidden',
                                            border: '1px solid var(--border)',
                                            background: '#000'
                                        }}>
                                            <img 
                                                src={form.screenshot_base64} 
                                                alt="Suggestion Preview" 
                                                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                                            />
                                        </div>
                                    )}
                                </div>

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
