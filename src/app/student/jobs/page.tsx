'use client';

import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api';

export default function StudentJobsPage() {
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { apiGet('/api/placement/jobs').then(setJobs).catch(() => { }).finally(() => setLoading(false)); }, []);

    return (
        <div className="animate-in">
            <div className="page-header"><div><h1 className="page-title">Job Board</h1><p className="page-subtitle">Browse and apply for job opportunities</p></div></div>

            <div className="card">
                {loading ? <p>Loading...</p> : jobs.length === 0 ? (
                    <div className="empty-state"><div className="empty-icon">💼</div><h3>No jobs available</h3></div>
                ) : (
                    <div className="grid-2">{jobs.filter((j: any) => j.is_active).map((j: any) => (
                        <div key={j.id} className="card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 4px', fontSize: '17px' }}>{j.title}</h3>
                                    <p style={{ margin: 0, color: '#a5b4fc', fontSize: '14px' }}>{j.company}</p>
                                </div>
                                <span className="badge badge-success">Active</span>
                            </div>
                            {j.description && <p className="text-sm text-muted" style={{ margin: '12px 0', lineHeight: '1.5' }}>{j.description}</p>}
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
                                {j.location && <span>📍 {j.location}</span>}
                                {j.salary && <span>💰 {j.salary}</span>}
                            </div>
                            <button className="btn btn-primary" style={{ width: '100%' }}>Apply Now</button>
                        </div>
                    ))}</div>
                )}
            </div>
        </div>
    );
}
