'use client';

import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPatch } from '@/lib/api';

interface Lead {
    id: string; name: string; email: string | null; phone: string | null;
    source: string | null; status: string; notes: string | null;
    assigned_to_name: string | null; activity_count: number; created_at: string;
}

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', phone: '', source: '', notes: '' });

    useEffect(() => { loadLeads(); }, []);

    const loadLeads = async () => {
        try { setLeads(await apiGet('/api/marketing/leads')); } catch { } finally { setLoading(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await apiPost('/api/marketing/leads', form);
        if (res.ok) { setShowModal(false); setForm({ name: '', email: '', phone: '', source: '', notes: '' }); loadLeads(); }
    };

    const handleStatusChange = async (id: string, status: string) => {
        await apiPatch(`/api/marketing/leads/${id}`, { status });
        loadLeads();
    };

    const statuses = ['ALL', 'NEW', 'CONTACTED', 'INTERESTED', 'CONVERTED', 'LOST'];
    const filtered = filter === 'ALL' ? leads : leads.filter(l => l.status === filter);

    const statusColors: Record<string, string> = {
        NEW: 'badge-info', CONTACTED: 'badge-warning', INTERESTED: 'badge-accent',
        CONVERTED: 'badge-success', LOST: 'badge-danger',
    };

    return (
        <div className="animate-in">
            <div className="page-header">
                <div><h1 className="page-title">Marketing Leads</h1><p className="page-subtitle">Track and manage lead pipeline</p></div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Lead</button>
            </div>

            <div className="grid-4 mb-24">
                <div className="stat-card primary"><div className="stat-icon primary">🎯</div><div className="stat-info"><h3>Total Leads</h3><div className="stat-value">{leads.length}</div></div></div>
                <div className="stat-card accent"><div className="stat-icon accent">🆕</div><div className="stat-info"><h3>New</h3><div className="stat-value">{leads.filter(l => l.status === 'NEW').length}</div></div></div>
                <div className="stat-card success"><div className="stat-icon success">🔄</div><div className="stat-info"><h3>Converted</h3><div className="stat-value">{leads.filter(l => l.status === 'CONVERTED').length}</div></div></div>
                <div className="stat-card danger"><div className="stat-icon danger">❌</div><div className="stat-info"><h3>Lost</h3><div className="stat-value">{leads.filter(l => l.status === 'LOST').length}</div></div></div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {statuses.map(s => (
                    <button key={s} className={`btn ${filter === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(s)}>
                        {s} ({s === 'ALL' ? leads.length : leads.filter(l => l.status === s).length})
                    </button>
                ))}
            </div>

            <div className="card">
                {loading ? <p>Loading...</p> : filtered.length === 0 ? (
                    <div className="empty-state"><div className="empty-icon">🎯</div><h3>No leads found</h3></div>
                ) : (
                    <div className="table-responsive"><table className="table">
                        <thead><tr><th>Name</th><th>Contact</th><th>Source</th><th>Status</th><th>Notes</th><th>Actions</th></tr></thead>
                        <tbody>{filtered.map(l => (
                            <tr key={l.id}>
                                <td><strong>{l.name}</strong></td>
                                <td><span className="text-sm">{l.email || '-'}</span><br /><span className="text-sm text-muted">{l.phone || '-'}</span></td>
                                <td>{l.source || '-'}</td>
                                <td>
                                    <select value={l.status} onChange={e => handleStatusChange(l.id, e.target.value)} className="form-input" style={{ padding: '4px 8px', fontSize: '12px', width: 'auto' }}>
                                        {statuses.filter(s => s !== 'ALL').map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </td>
                                <td className="text-sm text-muted">{l.notes || '-'}</td>
                                <td><span className="text-sm text-muted">{l.activity_count} activities</span></td>
                            </tr>
                        ))}</tbody>
                    </table></div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">Add New Lead</h2>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="form-group"><label>Name</label><input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                            <div className="form-group"><label>Email</label><input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                            <div className="form-group"><label>Phone</label><input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                            <div className="form-group"><label>Source</label><select className="form-input" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}><option value="">Select source</option><option value="Website">Website</option><option value="Social Media">Social Media</option><option value="WhatsApp">WhatsApp</option><option value="Reference">Reference</option><option value="Walk-in">Walk-in</option></select></div>
                            <div className="form-group"><label>Notes</label><textarea className="form-input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Add Lead</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
