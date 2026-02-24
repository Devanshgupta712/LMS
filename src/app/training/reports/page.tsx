'use client';

import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api';

export default function TrainingReportsPage() {
    const [projects, setProjects] = useState<any[]>([]);
    useEffect(() => { apiGet('/api/training/projects').then(setProjects).catch(() => { }); }, []);

    const allTasks = projects.flatMap((p: any) => p.tasks || []);
    const completed = allTasks.filter((t: any) => t.status === 'COMPLETED').length;
    const inProgress = allTasks.filter((t: any) => t.status === 'IN_PROGRESS').length;
    const overdue = allTasks.filter((t: any) => t.status === 'OVERDUE').length;

    return (
        <div className="animate-in">
            <div className="page-header"><div><h1 className="page-title">Training Reports</h1><p className="page-subtitle">Project progress and training analytics</p></div></div>

            <div className="grid-4 mb-24">
                <div className="stat-card primary"><div className="stat-icon primary">🏗️</div><div className="stat-info"><h3>Projects</h3><div className="stat-value">{projects.length}</div></div></div>
                <div className="stat-card success"><div className="stat-icon success">✅</div><div className="stat-info"><h3>Completed Tasks</h3><div className="stat-value">{completed}</div></div></div>
                <div className="stat-card accent"><div className="stat-icon accent">🔄</div><div className="stat-info"><h3>In Progress</h3><div className="stat-value">{inProgress}</div></div></div>
                <div className="stat-card danger"><div className="stat-icon danger">⚠️</div><div className="stat-info"><h3>Overdue</h3><div className="stat-value">{overdue}</div></div></div>
            </div>

            <div className="card">
                <h3 className="font-semibold mb-16">Project Progress</h3>
                {projects.length === 0 ? (
                    <div className="empty-state"><div className="empty-icon">📈</div><h3>No project data</h3></div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {projects.map((p: any) => {
                            const tasks = p.tasks || [];
                            const done = tasks.filter((t: any) => t.status === 'COMPLETED').length;
                            const pct = tasks.length > 0 ? Math.round(done / tasks.length * 100) : 0;
                            return (
                                <div key={p.id}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}><span>{p.title}</span><span className="text-sm text-muted">{done}/{tasks.length} tasks ({pct}%)</span></div>
                                    <div style={{ height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px' }}><div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #4ade80, #22c55e)', borderRadius: '5px', transition: 'width 0.5s' }} /></div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
