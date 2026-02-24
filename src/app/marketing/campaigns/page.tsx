'use client';

import { useState } from 'react';

export default function CampaignsPage() {
    const [campaigns] = useState([
        { id: '1', name: 'January 2026 Intake', type: 'Email', status: 'ACTIVE', sent: 1250, opened: 820, converted: 45, date: '2026-01-05' },
        { id: '2', name: 'Full Stack Dev Workshop', type: 'WhatsApp', status: 'COMPLETED', sent: 500, opened: 340, converted: 28, date: '2025-12-20' },
        { id: '3', name: 'Career Guidance Webinar', type: 'Social Media', status: 'DRAFT', sent: 0, opened: 0, converted: 0, date: '2026-02-15' },
    ]);

    const statusColor: Record<string, string> = { ACTIVE: 'badge-success', COMPLETED: 'badge-accent', DRAFT: 'badge-warning', PAUSED: 'badge-danger' };

    return (
        <div className="animate-in">
            <div className="page-header">
                <div><h1 className="page-title">Campaigns</h1><p className="page-subtitle">Email, WhatsApp, and social media campaigns</p></div>
                <button className="btn btn-primary">+ New Campaign</button>
            </div>

            <div className="grid-4 mb-24">
                <div className="stat-card primary"><div className="stat-icon primary">📧</div><div className="stat-info"><h3>Total Campaigns</h3><div className="stat-value">{campaigns.length}</div></div></div>
                <div className="stat-card accent"><div className="stat-icon accent">📨</div><div className="stat-info"><h3>Total Sent</h3><div className="stat-value">{campaigns.reduce((a, c) => a + c.sent, 0).toLocaleString()}</div></div></div>
                <div className="stat-card success"><div className="stat-icon success">👁️</div><div className="stat-info"><h3>Opened</h3><div className="stat-value">{campaigns.reduce((a, c) => a + c.opened, 0).toLocaleString()}</div></div></div>
                <div className="stat-card danger"><div className="stat-icon danger">🔄</div><div className="stat-info"><h3>Conversions</h3><div className="stat-value">{campaigns.reduce((a, c) => a + c.converted, 0)}</div></div></div>
            </div>

            <div className="card">
                <div className="table-responsive"><table className="table">
                    <thead><tr><th>Campaign</th><th>Type</th><th>Sent</th><th>Opened</th><th>Converted</th><th>Status</th><th>Date</th></tr></thead>
                    <tbody>{campaigns.map(c => (
                        <tr key={c.id}>
                            <td><strong>{c.name}</strong></td>
                            <td>{c.type}</td>
                            <td>{c.sent.toLocaleString()}</td>
                            <td>{c.opened.toLocaleString()} <span className="text-sm text-muted">({c.sent > 0 ? Math.round(c.opened / c.sent * 100) : 0}%)</span></td>
                            <td>{c.converted}</td>
                            <td><span className={`badge ${statusColor[c.status]}`}>{c.status}</span></td>
                            <td className="text-sm text-muted">{new Date(c.date).toLocaleDateString()}</td>
                        </tr>
                    ))}</tbody>
                </table></div>
            </div>
        </div>
    );
}
