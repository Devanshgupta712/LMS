'use client';

import { useState } from 'react';
import { apiFetch, getStoredUser } from '@/lib/api';

export default function TrainerLeavesPage() {
    const [form, setForm] = useState({ start_date: '', end_date: '', leave_type: 'OTHER', reason: '', proof_base64: '', proof_name: '' });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            setSelectedFile(null);
            return;
        }
        setSelectedFile(file);
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
        if (!user) return;
        try {
            const formData = new FormData();
            formData.append('start_date', form.start_date);
            formData.append('end_date', form.end_date);
            formData.append('leave_type', form.leave_type);
            formData.append('reason', form.reason || '');
            if (selectedFile) {
                formData.append('proof', selectedFile);
            }

            const res = await apiFetch('/api/training/submit-leave', {
                method: 'POST',
                body: formData,
            });
            if (res.ok) {
                setSubmitted(true);
                setForm({ start_date: '', end_date: '', leave_type: 'OTHER', reason: '', proof_base64: '', proof_name: '' });
                setSelectedFile(null);
            } else {
                const data = await res.json().catch(() => ({}));
                setError(data.detail || 'Failed to submit leave request.');
            }
        } catch {
            setError('Network error. Please try again.');
        }
    };

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Apply for Leave</h1>
                    <p className="page-subtitle">Submit a leave request — approval is by Super Admin only</p>
                </div>
            </div>

            <div style={{ maxWidth: '600px' }}>
                <div className="card">
                    <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', padding: '10px 14px', marginBottom: '20px', fontSize: '13px', color: '#a5b4fc' }}>
                        ℹ️ Trainer leave requests are reviewed and approved only by the <strong>Super Admin</strong>.
                    </div>

                    <h3 className="font-semibold mb-16">New Leave Request</h3>
                    {submitted && (
                        <div style={{ background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.3)', borderRadius: '12px', padding: '12px', color: '#4ade80', marginBottom: '16px', fontSize: '14px' }}>
                            ✅ Leave request submitted! The Super Admin will review it.
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
                            <select className="form-input" value={form.leave_type} onChange={e => setForm({ ...form, leave_type: e.target.value })}>
                                <option value="OTHER">Leave</option>
                                <option value="MEDICAL">Medical</option>
                                <option value="WORK_FROM_HOME">Work From Home</option>
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="form-group"><label>Start Date</label><input className="form-input" type="date" required value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
                            <div className="form-group"><label>End Date</label><input className="form-input" type="date" required value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
                        </div>

                        <div className="form-group">
                            <label>Reason</label>
                            <textarea className="form-input" rows={3} required placeholder={form.leave_type === 'WORK_FROM_HOME' ? 'Describe the work you will do from home...' : 'Explain reason for leave...'} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
                        </div>

                        <div className="form-group">
                            <label>Attachment {form.leave_type === 'MEDICAL' ? '— Mandatory' : '(Optional)'}</label>
                            <input type="file" accept="image/*,application/pdf" className="form-input" onChange={handleFile} required={form.leave_type === 'MEDICAL'} />
                            {form.proof_name && <small style={{ color: '#0066ff', marginTop: '4px', display: 'block' }}>📎 {form.proof_name}</small>}
                        </div>

                        <button type="submit" className="btn btn-primary">Submit Request</button>
                    </form>
                </div>
            </div>
        </div>
    );
}
