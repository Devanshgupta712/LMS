'use client';

import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api';

export default function AdminReportsPage() {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => { apiGet('/api/admin/dashboard').then(setStats).catch(() => { }); }, []);

    return (
        <div className="animate-in">
            <div className="page-header">
                <div><h1 className="page-title">Admin Reports</h1><p className="page-subtitle">Comprehensive analytics and insights</p></div>
            </div>

            <div className="grid-4 mb-24">
                <div className="stat-card primary"><div className="stat-icon primary">🎓</div><div className="stat-info"><h3>Total Students</h3><div className="stat-value">{stats?.total_students || 0}</div></div></div>
                <div className="stat-card accent"><div className="stat-icon accent">📚</div><div className="stat-info"><h3>Courses</h3><div className="stat-value">{stats?.total_courses || 0}</div></div></div>
                <div className="stat-card success"><div className="stat-icon success">👥</div><div className="stat-info"><h3>Batches</h3><div className="stat-value">{stats?.total_batches || 0}</div></div></div>
                <div className="stat-card danger"><div className="stat-icon danger">🎯</div><div className="stat-info"><h3>Active Leads</h3><div className="stat-value">{stats?.total_leads || 0}</div></div></div>
            </div>

            <div className="grid-2">
                <div className="card">
                    <h3 className="font-semibold mb-16">Enrollment Trends</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((m, i) => (
                            <div key={m} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ width: '40px', fontSize: '13px', color: '#94a3b8' }}>{m}</span>
                                <div style={{ flex: 1, height: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                                    <div style={{ width: `${20 + i * 12}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: '6px', transition: 'width 0.5s' }} />
                                </div>
                                <span style={{ width: '30px', fontSize: '13px', color: '#a5b4fc', textAlign: 'right' }}>{Math.floor(Math.random() * 20) + 5}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="card">
                    <h3 className="font-semibold mb-16">Revenue Breakdown</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[{ label: 'Full Stack Dev', pct: 45, color: '#6366f1' }, { label: 'Data Science', pct: 35, color: '#8b5cf6' }, { label: 'Digital Marketing', pct: 20, color: '#a78bfa' }].map(item => (
                            <div key={item.label}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span className="text-sm">{item.label}</span><span className="text-sm text-muted">{item.pct}%</span></div>
                                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}><div style={{ width: `${item.pct}%`, height: '100%', background: item.color, borderRadius: '4px' }} /></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
