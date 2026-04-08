'use client';

import { useState, useEffect } from 'react';
import { apiPost, apiGet, apiFetch, getStoredUser } from '@/lib/api';

interface LeaveHistory {
    id: string;
    start_date: string;
    end_date: string;
    leave_type: string;
    reason: string | null;
    rejection_reason: string | null;
    status: string;
    proof_url: string | null;
}

export default function StudentLeavesPage() {
    const [form, setForm] = useState({ start_date: '', end_date: '', leave_type: 'OTHER', reason: '', proof_base64: '', proof_name: '' });
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const [history, setHistory] = useState<LeaveHistory[]>([]);
    const [stats, setStats] = useState({ quota: 0, taken: 0, remaining: 0, pending: 0 });
    const [loading, setLoading] = useState(true);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [historyData, statsData] = await Promise.all([
                apiGet('/api/training/leave-history'),
                apiGet('/api/training/leave-stats')
            ]);
            setHistory(historyData);
            setStats(statsData);
        } catch (err) {
            console.error('Failed to load data', err);
        } finally {
            setLoading(false);
        }
    };

    const loadHistory = async () => {
        try {
            const [h, s] = await Promise.all([
                apiGet('/api/training/leave-history'),
                apiGet('/api/training/leave-stats')
            ]);
            setHistory(h);
            setStats(s);
        } catch (err) { }
    };

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            setSelectedFile(null);
            setForm(prev => ({ ...prev, proof_base64: '', proof_name: '' }));
            return;
        }
        
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            setError('Please upload a PNG, JPG image or a PDF file.');
            return;
        }

        setSelectedFile(file);
        
        // Preview handling
        const reader = new FileReader();
        reader.onload = () => {
            setForm(prev => ({ ...prev, proof_base64: reader.result as string, proof_name: file.name }));
        };
        reader.readAsDataURL(file);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        // Client-side validation
        if ((form.leave_type === 'OTHER' || form.leave_type === 'WORK_FROM_HOME') && !form.reason.trim()) {
            setError('Please provide a reason for the leave.');
            return;
        }

        const user = getStoredUser();
        if (!user) {
            setError('User session not found. Please log out and log in again.');
            return;
        }

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
                loadHistory(); 
                setTimeout(() => setSubmitted(false), 5000);
            } else {
                const data = await res.json().catch(() => ({}));
                setError(data.detail || 'Failed to submit leave request.');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        }
    };

    const handleCancel = async (id: string) => {
        if (!confirm('Are you sure you want to cancel this pending leave request?')) return;
        try {
            const res = await apiFetch(`/api/training/leave-cancel/${id}`, { method: 'POST' });
            if (res.ok) {
                loadHistory();
            } else {
                const data = await res.json().catch(() => ({}));
                alert(data.detail || 'Failed to cancel leave.');
            }
        } catch (err) {
            alert('Error cancelling leave.');
        }
    };

    return (
        <div className="animate-in">
            <div className="page-header"><div><h1 className="page-title">Apply for Leave</h1><p className="page-subtitle">Submit leave requests and track your balance</p></div></div>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div className="glass-premium hover-lift reveal-on-scroll active" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className="text-xs text-muted fw-600">Total Quota</span>
                    <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{stats.quota} <span className="text-xs text-muted">Days</span></span>
                </div>
                <div className="glass-premium hover-lift reveal-on-scroll active" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className="text-xs text-muted fw-600" style={{ color: '#10b981' }}>Leaves Taken</span>
                    <span style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>{stats.taken}</span>
                </div>
                <div className="glass-premium hover-lift reveal-on-scroll active" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className="text-xs text-muted fw-600" style={{ color: '#0066ff' }}>Remaining Balance</span>
                    <span style={{ fontSize: '24px', fontWeight: 700, color: '#0066ff' }}>{stats.remaining}</span>
                </div>
                <div className="glass-premium hover-lift reveal-on-scroll active" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className="text-xs text-muted fw-600" style={{ color: '#f59e0b' }}>Pending Requests</span>
                    <span style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>{stats.pending}</span>
                </div>
            </div>

            <div style={{ maxWidth: '850px' }}>
                <div className="glass-premium reveal-on-scroll active" style={{ padding: '40px' }}>
                    <h3 className="h3 mb-24">New Leave Request</h3>
                    {submitted && (
                        <div style={{ background: 'var(--success-glow)', border: '1px solid var(--success)', borderRadius: '12px', padding: '16px', color: 'var(--success)', marginBottom: '24px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span>✅</span> Leave request submitted successfully! It will be reviewed by admin.
                        </div>
                    )}
                    {error && (
                        <div style={{ background: 'var(--danger-glow)', border: '1px solid var(--danger)', borderRadius: '12px', padding: '16px', color: 'var(--danger)', marginBottom: '24px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span>⚠️</span> {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Leave Type</label>
                            <select 
                                className="form-input" 
                                value={form.leave_type} 
                                onChange={e => setForm({ ...form, leave_type: e.target.value })}
                                style={{ width: '100%' }}
                            >
                                <option value="MEDICAL">Medical</option>
                                <option value="INTERVIEW">Interview</option>
                                <option value="WORK_FROM_HOME">Work From Home</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Start Date</label>
                                <input className="form-input" type="date" required value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} style={{ width: '100%' }} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>End Date</label>
                                <input className="form-input" type="date" required value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} style={{ width: '100%' }} />
                            </div>
                        </div>

                        {form.leave_type !== 'INTERVIEW' && (
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
                                    Reason {(form.leave_type === 'OTHER' || form.leave_type === 'WORK_FROM_HOME') ? '(Mandatory)' : '(Optional)'}
                                </label>
                                <textarea 
                                    className="form-input" 
                                    rows={4} 
                                    required={form.leave_type === 'OTHER' || form.leave_type === 'WORK_FROM_HOME'}
                                    placeholder={form.leave_type === 'WORK_FROM_HOME' ? 'Describe the work you will do from home...' : 'Explain reason for leave...'} 
                                    value={form.reason} 
                                    onChange={e => setForm({ ...form, reason: e.target.value })} 
                                    style={{ width: '100%', resize: 'none' }}
                                />
                            </div>
                        )}

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
                                Proof Attachment (Image or PDF) {form.leave_type === 'MEDICAL' ? '— Mandatory' : '— Optional'}
                            </label>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <div style={{ flex: 1 }}>
                                    <input type="file" accept="image/png,image/jpeg,application/pdf" className="form-input" onChange={handleFile} required={form.leave_type === 'MEDICAL'} style={{ width: '100%' }} />
                                    {form.proof_name && <small style={{ color: 'var(--primary)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.51a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                                        {form.proof_name}
                                    </small>}
                                </div>
                                {form.proof_base64 && (
                                    <div style={{ width: '64px', height: '64px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                                        {form.proof_name.toLowerCase().endsWith('.pdf') ? (
                                            <div style={{ fontSize: '20px' }}>📄</div>
                                        ) : (
                                            <img src={form.proof_base64} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg hover-lift shadow-md" style={{ width: '100%', marginTop: '8px' }}>🚀 Submit Request</button>
                    </form>
                </div>
            </div>

            <div style={{ marginTop: '40px' }}>
                <h3 className="font-semibold mb-16">My Leave History</h3>
                <div className="glass-premium reveal-on-scroll active" style={{ padding: 0, overflow: 'hidden' }}>
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading records...</div>
                    ) : history.length === 0 ? (
                        <div style={{ padding: '60px', textAlign: 'center' }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>🗓️</div>
                            <h3 style={{ color: 'var(--text-muted)' }}>No leave history found</h3>
                            <p className="text-sm text-muted">Submit your first leave request above.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Dates</th>
                                        <th>Type</th>
                                        <th>Status</th>
                                        <th>Details</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map(req => (
                                        <tr key={req.id}>
                                            <td style={{ whiteSpace: 'nowrap' }}>
                                                <div style={{ fontWeight: 600 }}>{new Date(req.start_date).toLocaleDateString()}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>to {new Date(req.end_date).toLocaleDateString()}</div>
                                            </td>
                                            <td>
                                                <span style={{ fontSize: '13px', fontWeight: 500 }}>{req.leave_type.replace(/_/g, ' ')}</span>
                                            </td>
                                            <td>
                                                <span className={`badge ${req.status === 'APPROVED' ? 'badge-success' : req.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="text-sm" style={{ maxWidth: '250px' }}>{req.reason || '-'}</div>
                                                {req.rejection_reason && (
                                                    <div style={{ marginTop: '4px', padding: '6px 10px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '6px', fontSize: '12px', color: '#ef4444', borderLeft: '3px solid #ef4444' }}>
                                                        <strong>Rejection Reason:</strong> {req.rejection_reason}
                                                    </div>
                                                )}
                                                {req.proof_url && (
                                                    <a href={req.proof_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#0066ff', borderBottom: '1px solid #0066ff', marginTop: '4px', display: 'inline-block' }}>
                                                        View Proof {(req.proof_url.toLowerCase().endsWith('.pdf') || req.proof_url.startsWith('data:application/pdf') || req.proof_url.includes('/raw/upload/')) ? '📄' : '🖼️'}
                                                    </a>
                                                )}
                                            </td>
                                            <td>
                                                {req.status === 'PENDING' && (
                                                    <button 
                                                        onClick={() => handleCancel(req.id)}
                                                        style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer', fontWeight: 600, padding: '4px 8px' }}
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
