'use client';

import { useState } from 'react';
import { apiPost, getStoredUser } from '@/lib/api';

export default function StudentLeavesPage() {
    const [form, setForm] = useState({ start_date: '', end_date: '', leave_type: 'OTHER', reason: '', proof_base64: '', proof_name: '' });
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // Validation for images only
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            setError('Please upload a PNG or JPG image.');
            return;
        }

        // Compress image client-side to keep payload small
        const img = new Image();
        img.onload = () => {
            const MAX = 800;
            let w = img.width, h = img.height;
            if (w > MAX || h > MAX) {
                const ratio = Math.min(MAX / w, MAX / h);
                w = Math.round(w * ratio);
                h = Math.round(h * ratio);
            }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
            const compressed = canvas.toDataURL('image/jpeg', 0.6);
            setForm(prev => ({ ...prev, proof_base64: compressed, proof_name: file.name }));
        };
        img.src = URL.createObjectURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        // Client-side validation
        if (form.leave_type === 'MEDICAL' && !form.proof_base64) {
            setError('Medical proof is required for medical leave.');
            return;
        }
        if (form.leave_type === 'OTHER' && !form.reason.trim()) {
            setError('Please provide a reason for the leave.');
            return;
        }

        const user = getStoredUser();
        if (!user) {
            setError('User session not found. Please log out and log in again.');
            return;
        }
        try {
            const res = await apiPost('/api/training/leave-request', { user_id: user.id, ...form });
            if (res.ok) {
                setSubmitted(true);
                setForm({ start_date: '', end_date: '', leave_type: 'OTHER', reason: '', proof_base64: '', proof_name: '' });
            } else {
                const data = await res.json().catch(() => ({}));
                setError(data.detail || 'Failed to submit leave request.');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        }
    };

    return (
        <div className="animate-in">
            <div className="page-header"><div><h1 className="page-title">Apply for Leave</h1><p className="page-subtitle">Submit leave requests for approval</p></div></div>

            <div style={{ maxWidth: '600px' }}>
                <div className="card">
                    <h3 className="font-semibold mb-16">New Leave Request</h3>
                    {submitted && (
                        <div style={{ background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.3)', borderRadius: '12px', padding: '12px', color: '#4ade80', marginBottom: '16px', fontSize: '14px' }}>
                            ✅ Leave request submitted successfully! It will be reviewed by admin.
                        </div>
                    )}
                    {error && (
                        <div style={{ background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.3)', borderRadius: '12px', padding: '12px', color: '#f87171', marginBottom: '16px', fontSize: '14px' }}>
                            ⚠️ {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="form-group">
                            <label>Leave Type</label>
                            <select 
                                className="form-input" 
                                value={form.leave_type} 
                                onChange={e => setForm({ ...form, leave_type: e.target.value })}
                            >
                                <option value="MEDICAL">Medical</option>
                                <option value="INTERVIEW">Interview</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="form-group"><label>Start Date</label><input className="form-input" type="date" required value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
                            <div className="form-group"><label>End Date</label><input className="form-input" type="date" required value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
                        </div>

                        {form.leave_type !== 'INTERVIEW' && (
                            <div className="form-group">
                                <label>Reason {form.leave_type === 'OTHER' ? '(Mandatory)' : '(Optional)'}</label>
                                <textarea 
                                    className="form-input" 
                                    rows={3} 
                                    required={form.leave_type === 'OTHER'}
                                    placeholder="Explain reason for leave..." 
                                    value={form.reason} 
                                    onChange={e => setForm({ ...form, reason: e.target.value })} 
                                />
                            </div>
                        )}

                        {form.leave_type === 'MEDICAL' && (
                            <div className="form-group">
                                <label>Medical Proof (PNG/JPG Image) <span style={{color: 'red'}}>*</span></label>
                                <input type="file" accept="image/png,image/jpeg" className="form-input" onChange={handleFile} />
                                {form.proof_name && <small style={{ color: '#0066ff', marginTop: '4px', display: 'block' }}>📎 {form.proof_name}</small>}
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary">Submit Request</button>
                    </form>
                </div>
            </div>
        </div>
    );
}
