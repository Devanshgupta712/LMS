'use client';

import { useState, useEffect } from 'react';
import { apiGet, apiPost, getStoredUser } from '@/lib/api';

interface Job { id: string; title: string; company: string; description: string | null; location: string | null; salary: string | null; is_active: boolean; application_count: number; created_at: string; }

export default function JobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ title: '', company: '', description: '', location: '', salary: '' });
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const user = getStoredUser();
        if (user) {
            if (user.role === 'STUDENT') {
                window.location.href = '/student/jobs';
                return;
            }
            setIsAdmin(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN');
        }
        loadJobs();
    }, []);

    const loadJobs = async () => {
        try { setJobs(await apiGet('/api/placement/jobs')); } catch { } finally { setLoading(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await apiPost('/api/placement/jobs', form);
        if (res.ok) { setShowModal(false); setForm({ title: '', company: '', description: '', location: '', salary: '' }); loadJobs(); }
    };

    return (
        <div className="animate-in">
            <div className="page-header">
                <div><h1 className="page-title">Job Board</h1><p className="page-subtitle">Manage placement opportunities</p></div>
                {isAdmin && <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Post Job</button>}
            </div>

            <div className="grid-4 mb-24">
                <div className="stat-card primary"><div className="stat-icon primary">💼</div><div className="stat-info"><h3>Total Jobs</h3><div className="stat-value">{jobs.length}</div></div></div>
                <div className="stat-card success"><div className="stat-icon success">✅</div><div className="stat-info"><h3>Active</h3><div className="stat-value">{jobs.filter(j => j.is_active).length}</div></div></div>
                <div className="stat-card accent"><div className="stat-icon accent">📨</div><div className="stat-info"><h3>Applications</h3><div className="stat-value">{jobs.reduce((a, j) => a + j.application_count, 0)}</div></div></div>
            </div>

            <div className="card">
                {loading ? <p>Loading...</p> : jobs.length === 0 ? (
                    <div className="empty-state"><div className="empty-icon">💼</div><h3>No jobs posted yet</h3></div>
                ) : (
                    <div className="grid-3">{jobs.map(j => (
                        <div key={j.id} className="card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <h3 style={{ margin: '0 0 4px', fontSize: '16px' }}>{j.title}</h3>
                            <p style={{ margin: '0 0 8px', color: '#3399ff', fontSize: '14px' }}>{j.company}</p>
                            {j.description && <p className="text-sm text-muted" style={{ margin: '0 0 12px', lineHeight: '1.5' }}>{j.description}</p>}
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '13px', color: '#94a3b8' }}>
                                {j.location && <span>📍 {j.location}</span>}
                                {j.salary && <span>💰 {j.salary}</span>}
                                <span>📨 {j.application_count} applications</span>
                            </div>
                            <span className={`badge ${j.is_active ? 'badge-success' : 'badge-danger'}`} style={{ marginTop: '12px', display: 'inline-block' }}>{j.is_active ? 'Active' : 'Closed'}</span>
                        </div>
                    ))}</div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">Post New Job</h2>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="form-group"><label>Job Title</label><input className="form-input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                            <div className="form-group"><label>Company</label><input className="form-input" required value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
                            <div className="form-group"><label>Description</label><textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                            <div className="form-group"><label>Location</label><input className="form-input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
                            <div className="form-group"><label>Salary</label><input className="form-input" placeholder="e.g. 4-6 LPA" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} /></div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Post Job</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
