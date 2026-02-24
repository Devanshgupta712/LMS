'use client';

import { useState } from 'react';
import { apiPost } from '@/lib/api';
import { getStoredUser } from '@/lib/api';

export default function StudentLeavesPage() {
    const [form, setForm] = useState({ start_date: '', end_date: '', reason: '' });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const user = getStoredUser();
        if (!user) return;
        const res = await apiPost('/api/training/leave-request', { user_id: user.id, ...form });
        if (res.ok) { setSubmitted(true); setForm({ start_date: '', end_date: '', reason: '' }); }
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
                        <div className="form-group"><label>Start Date</label><input className="form-input" type="date" required value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
                        <div className="form-group"><label>End Date</label><input className="form-input" type="date" required value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
                        <div className="form-group"><label>Reason</label><textarea className="form-input" rows={3} required placeholder="Explain reason for leave..." value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></div>
                        <button type="submit" className="btn btn-primary">Submit Request</button>
                    </form>
                </div>
                <div className="card">
                    <h3 className="font-semibold mb-16">Leave Balance</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                            <span>Casual Leave</span><span style={{ fontWeight: 600, color: '#4ade80' }}>8 / 12</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                            <span>Sick Leave</span><span style={{ fontWeight: 600, color: '#4ade80' }}>5 / 6</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                            <span>Emergency</span><span style={{ fontWeight: 600, color: '#fbbf24' }}>2 / 3</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
