'use client';

import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api';

export default function PlacementReportsPage() {
    const [jobs, setJobs] = useState<any[]>([]);
    useEffect(() => { apiGet('/api/placement/jobs').then(setJobs).catch(() => { }); }, []);

    const totalApps = jobs.reduce((a: number, j: any) => a + (j.application_count || 0), 0);

    return (
        <div className="animate-in">
            <div className="page-header"><div><h1 className="page-title">Placement Reports</h1><p className="page-subtitle">Placement statistics and analytics</p></div></div>

            <div className="grid-4 mb-24">
                <div className="stat-card primary"><div className="stat-icon primary">💼</div><div className="stat-info"><h3>Open Positions</h3><div className="stat-value">{jobs.filter((j: any) => j.is_active).length}</div></div></div>
                <div className="stat-card accent"><div className="stat-icon accent">📨</div><div className="stat-info"><h3>Applications</h3><div className="stat-value">{totalApps}</div></div></div>
                <div className="stat-card success"><div className="stat-icon success">✅</div><div className="stat-info"><h3>Placed</h3><div className="stat-value">0</div></div></div>
                <div className="stat-card danger"><div className="stat-icon danger">📊</div><div className="stat-info"><h3>Placement Rate</h3><div className="stat-value">0%</div></div></div>
            </div>

            <div className="card">
                <h3 className="font-semibold mb-16">Job-wise Applications</h3>
                {jobs.length === 0 ? (
                    <div className="empty-state"><div className="empty-icon">📊</div><h3>No placement data</h3></div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {jobs.map((j: any) => (
                            <div key={j.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ width: '200px', fontSize: '13px', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.title} — {j.company}</span>
                                <div style={{ flex: 1, height: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                                    <div style={{ width: `${totalApps > 0 ? (j.application_count / totalApps) * 100 : 0}%`, height: '100%', background: 'linear-gradient(90deg, #2563eb, #2563eb)', borderRadius: '6px', minWidth: j.application_count > 0 ? '20px' : '0' }} />
                                </div>
                                <span style={{ width: '40px', fontSize: '14px', fontWeight: 600, color: '#60a5fa', textAlign: 'right' }}>{j.application_count}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
