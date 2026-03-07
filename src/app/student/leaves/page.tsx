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
        const reader = new FileReader();
        reader.onload = () => {
            setForm(prev => ({ ...prev, proof_base64: reader.result as string, proof_name: file.name }));
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const user = getStoredUser();
        if (!user) {
            setError('User session not found. Please log out and log in again.');
            return;
        }
        if (!user.id) {
            setError('User ID is missing from session. Please log in again.');
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
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="form-group"><label>Start Date</label><input className="form-input" type="date" required value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
                            <div className="form-group"><label>End Date</label><input className="form-input" type="date" required value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
                        </div>

                        <div className="form-group">
                            <label>Reason</label>
                            <textarea className="form-input" rows={3} required placeholder="Explain reason for leave..." value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
                        </div>

                        <div className="form-group">
                            <label>Attachment (Optional)</label>
                            <input type="file" accept="image/*,application/pdf" className="form-input" onChange={handleFile} />
                            {form.proof_name && <small style={{ color: '#0066ff', marginTop: '4px', display: 'block' }}>📎 {form.proof_name}</small>}
                        </div>

                        <button type="submit" className="btn btn-primary">Submit Request</button>
                    </form>
                </div>
            </div>
        </div>
    );
}
