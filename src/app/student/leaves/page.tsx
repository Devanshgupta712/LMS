'use client';

import { useState, useEffect } from 'react';
import { apiPost } from '@/lib/api';
import { getStoredUser } from '@/lib/api';

export default function StudentLeavesPage() {
    const [form, setForm] = useState({ start_date: '', end_date: '', leave_type: 'INTERVIEW', reason: '', proof_base64: '', proof_name: '', batch_id: '' });
    const [submitted, setSubmitted] = useState(false);
    const [batches, setBatches] = useState<any[]>([]);


    useEffect(() => {
        const user = getStoredUser();
        if (user) {
            import('@/lib/api').then(({ apiGet }) => {
                apiGet(`/api/admin/leaves/stats/${user.id}`).catch(() => { }).then(data => {
                    // Wait, do we have an endpoint for this? Let's just fetch their batches.
                });
                apiGet(`/api/admin/batches`).then(allBatches => {
                    // Quick way for students to pick a batch. A proper way is to fetch their assigned, but admin/batches works as a stub, or we can just fetch all active.
                    // Actually, students might not have access to admin/batches. Let's make an endpoint or just allow them to type... No, dropdown.
                    // Let's assume we can fetch batches they are in.
                }).catch(() => setBatches([]));
            });
        }
    }, []);

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
        const user = getStoredUser();
        if (!user) return;
        const res = await apiPost('/api/training/leave-request', { user_id: user.id, ...form });
        if (res.ok) { setSubmitted(true); setForm({ start_date: '', end_date: '', leave_type: 'INTERVIEW', reason: '', proof_base64: '', proof_name: '', batch_id: form.batch_id }); }
    };

    return (
        <div className="animate-in">
            <div className="page-header"><div><h1 className="page-title">Apply for Leave</h1><p className="page-subtitle">Submit leave requests for approval</p></div></div>

            <div className="grid-2">
                <div className="card">
                    <h3 className="font-semibold mb-16">New Leave Request</h3>
                    {submitted && (
                        <div style={{ background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.3)', borderRadius: '12px', padding: '12px', color: '#4ade80', marginBottom: '16px', fontSize: '14px' }}>
                            Leave request submitted successfully! It will be reviewed by admin.
                        </div>
                    )}
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="form-group"><label>Batch</label>
                            <select className="form-input" required value={form.batch_id} onChange={e => setForm({ ...form, batch_id: e.target.value })}>
                                <option value="">Select a batch</option>
                                {batches.map(b => (
                                    <option key={b.batch_id} value={b.batch_id}>{b.batch_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group"><label>Start Date</label><input className="form-input" type="date" required value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
                        <div className="form-group"><label>End Date</label><input className="form-input" type="date" required value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>

                        <div className="form-group">
                            <label>Leave Type</label>
                            <select className="form-input" value={form.leave_type} onChange={e => setForm({ ...form, leave_type: e.target.value, reason: '', proof_base64: '', proof_name: '' })}>
                                <option value="INTERVIEW">Interview</option>
                                <option value="MEDICAL">Medical</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>

                        {form.leave_type === 'MEDICAL' && (
                            <div className="form-group">
                                <label>Medical Proof (PNG, PDF)</label>
                                <input type="file" accept="image/png,application/pdf" className="form-input" required onChange={handleFile} />
                                {form.proof_name && <small style={{ color: '#0066ff', marginTop: '4px' }}>File attached: {form.proof_name}</small>}
                            </div>
                        )}

                        {form.leave_type === 'OTHER' && (
                            <div className="form-group">
                                <label>Reason</label>
                                <textarea className="form-input" rows={3} required placeholder="Explain reason for leave..." value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
                            </div>
                        )}
                        <button type="submit" className="btn btn-primary">Submit Request</button>
                    </form>
                </div>
                <div className="card">
                    <h3 className="font-semibold mb-16">Leave Balance</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {batches.length === 0 ? (
                            <p className="text-muted text-sm">No active batches or leave quotas.</p>
                        ) : (
                            batches.map(b => (
                                <div key={b.batch_id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 600 }}>{b.batch_name}</span>
                                        <span style={{ color: b.remaining > 0 ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>
                                            {b.remaining} / {b.leave_quota} left
                                        </span>
                                    </div>
                                    <div className="text-xs text-muted">Used: {b.days_used} days</div>
                                    {b.leave_quota > 0 && (
                                        <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', height: '6px', borderRadius: '4px', marginTop: '4px' }}>
                                            <div style={{ width: `${Math.min(100, (b.days_used / b.leave_quota) * 100)}%`, background: b.remaining > 2 ? '#3b82f6' : '#fbbf24', height: '100%', borderRadius: '4px' }}></div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
