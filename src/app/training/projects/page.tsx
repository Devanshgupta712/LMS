'use client';

import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '@/lib/api';

interface Milestone {
    id: string; title: string; description: string | null;
    due_date: string | null; is_completed: boolean; order: number;
}

interface ProjectItem {
    id: string; title: string; description: string | null;
    tech_stack: string | null; github_url: string | null;
    batch_id: string | null; status: string;
    trainer_name: string | null; start_date: string | null;
    end_date: string | null; max_team_size: number;
    progress: number; milestones: Milestone[]; created_at: string;
}

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    NOT_STARTED: { color: '#94a3b8', bg: '#94a3b820', label: 'Not Started' },
    IN_PROGRESS: { color: '#3b82f6', bg: '#3b82f620', label: 'In Progress' },
    UNDER_REVIEW: { color: '#f59e0b', bg: '#f59e0b20', label: 'Under Review' },
    COMPLETED: { color: '#10b981', bg: '#10b98120', label: 'Completed' },
};

export default function ProjectsPage() {
    const [projects, setProjects] = useState<ProjectItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [form, setForm] = useState({
        title: '', description: '', tech_stack: '', github_url: '',
        max_team_size: '4', start_date: '', end_date: '',
    });
    const [milestones, setMilestones] = useState<{ title: string; due_date: string }[]>([]);

    useEffect(() => { loadProjects(); }, []);

    const loadProjects = async () => {
        try { setProjects(await apiGet('/api/training/projects')); } catch { } finally { setLoading(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        await apiPost('/api/training/projects', {
            ...form, max_team_size: parseInt(form.max_team_size) || 4,
            milestones: milestones.filter(m => m.title.trim()),
        });
        setShowModal(false);
        setForm({ title: '', description: '', tech_stack: '', github_url: '', max_team_size: '4', start_date: '', end_date: '' });
        setMilestones([]);
        loadProjects();
    };

    const addMilestone = () => setMilestones([...milestones, { title: '', due_date: '' }]);

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Projects</h1>
                    <p className="page-subtitle">Detailed project tracking with milestones & progress</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
            </div>

            {/* Stats */}
            <div className="grid-4 mb-24">
                <div className="stat-card primary"><div className="stat-icon primary">🏗️</div><div className="stat-info"><h3>Total Projects</h3><div className="stat-value">{projects.length}</div></div></div>
                <div className="stat-card accent"><div className="stat-icon accent">🔄</div><div className="stat-info"><h3>In Progress</h3><div className="stat-value">{projects.filter(p => p.status === 'IN_PROGRESS').length}</div></div></div>
                <div className="stat-card success"><div className="stat-icon success">✅</div><div className="stat-info"><h3>Completed</h3><div className="stat-value">{projects.filter(p => p.status === 'COMPLETED').length}</div></div></div>
                <div className="stat-card danger"><div className="stat-icon danger">👀</div><div className="stat-info"><h3>Under Review</h3><div className="stat-value">{projects.filter(p => p.status === 'UNDER_REVIEW').length}</div></div></div>
            </div>

            {/* Project Cards */}
            {loading ? <p>Loading...</p> : projects.length === 0 ? (
                <div className="card"><div className="empty-state"><div className="empty-icon">🏗️</div><h3>No projects yet</h3><p className="text-sm text-muted">Create your first project with milestones</p></div></div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {projects.map(project => {
                        const config = statusConfig[project.status] || statusConfig.NOT_STARTED;
                        const isExpanded = expanded === project.id;
                        return (
                            <div key={project.id} className="card" style={{ cursor: 'pointer', transition: 'all 0.3s' }} onClick={() => setExpanded(isExpanded ? null : project.id)}>
                                {/* Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                                            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{project.title}</h3>
                                            <span className="badge" style={{ background: config.bg, color: config.color }}>{config.label}</span>
                                        </div>
                                        {project.description && <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>{project.description}</p>}
                                    </div>
                                    <span style={{ color: '#64748b', fontSize: '20px', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>▼</span>
                                </div>

                                {/* Meta Row */}
                                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
                                    {project.tech_stack && (
                                        <span>🛠️ {project.tech_stack.split(',').map(t => (
                                            <span key={t} style={{ background: '#2563eb15', color: '#60a5fa', padding: '2px 8px', borderRadius: '12px', marginLeft: '4px', fontSize: '11px' }}>{t.trim()}</span>
                                        ))}</span>
                                    )}
                                    {project.trainer_name && <span>👤 {project.trainer_name}</span>}
                                    <span>👥 Team: {project.max_team_size}</span>
                                    {project.github_url && <a href={project.github_url} target="_blank" rel="noopener" onClick={e => e.stopPropagation()} style={{ color: '#60a5fa' }}>🔗 GitHub</a>}
                                </div>

                                {/* Progress Bar */}
                                <div style={{ marginBottom: isExpanded ? '20px' : '0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
                                        <span style={{ color: '#64748b' }}>Progress</span>
                                        <span style={{ color: config.color, fontWeight: 600 }}>{project.progress}%</span>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', background: '#1e2130', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: `${project.progress}%`, height: '100%', background: config.color, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                                    </div>
                                </div>

                                {/* Expanded: Milestones + Dates */}
                                {isExpanded && (
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px', animation: 'fadeIn 0.3s ease' }}>
                                        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', fontSize: '13px' }}>
                                            {project.start_date && <span style={{ color: '#94a3b8' }}>📅 Start: {new Date(project.start_date).toLocaleDateString()}</span>}
                                            {project.end_date && <span style={{ color: '#94a3b8' }}>🏁 End: {new Date(project.end_date).toLocaleDateString()}</span>}
                                        </div>

                                        {project.milestones.length > 0 ? (
                                            <div>
                                                <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0', marginBottom: '12px' }}>Milestones</h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {project.milestones.map((ms, idx) => (
                                                        <div key={ms.id} style={{
                                                            display: 'flex', alignItems: 'center', gap: '12px',
                                                            padding: '10px 14px', background: ms.is_completed ? '#10b98110' : '#1e2130',
                                                            borderRadius: '10px', border: `1px solid ${ms.is_completed ? '#10b98130' : 'rgba(255,255,255,0.04)'}`,
                                                        }}>
                                                            <div style={{
                                                                width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                                                                background: ms.is_completed ? '#10b981' : '#2d3148',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                fontSize: '12px', color: '#fff', fontWeight: 600,
                                                            }}>
                                                                {ms.is_completed ? '✓' : idx + 1}
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <span style={{ fontWeight: 500, color: ms.is_completed ? '#6ee7b7' : '#e2e8f0', fontSize: '14px' }}>{ms.title}</span>
                                                                {ms.description && <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>{ms.description}</p>}
                                                            </div>
                                                            {ms.due_date && <span style={{ fontSize: '12px', color: '#64748b' }}>{new Date(ms.due_date).toLocaleDateString()}</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <p style={{ color: '#64748b', fontSize: '13px' }}>No milestones defined</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
                        <h2 className="modal-title">Create New Project</h2>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="form-group"><label className="form-label">Project Title</label><input className="form-input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. E-Commerce Platform" /></div>
                            <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Project overview and objectives..." /></div>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">Tech Stack</label><input className="form-input" value={form.tech_stack} onChange={e => setForm({ ...form, tech_stack: e.target.value })} placeholder="React, Node.js, PostgreSQL" /></div>
                                <div className="form-group"><label className="form-label">GitHub URL</label><input className="form-input" value={form.github_url} onChange={e => setForm({ ...form, github_url: e.target.value })} placeholder="https://github.com/..." /></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">Start Date</label><input type="date" className="form-input" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">End Date</label><input type="date" className="form-input" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
                            </div>
                            <div className="form-group"><label className="form-label">Max Team Size</label><input type="number" className="form-input" value={form.max_team_size} onChange={e => setForm({ ...form, max_team_size: e.target.value })} /></div>

                            {/* Milestones */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <label className="form-label" style={{ margin: 0 }}>Milestones</label>
                                    <button type="button" className="btn btn-ghost btn-sm" onClick={addMilestone}>+ Add Milestone</button>
                                </div>
                                {milestones.map((ms, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                        <input className="form-input" placeholder={`Milestone ${idx + 1}`} value={ms.title} style={{ flex: 1 }}
                                            onChange={e => { const m = [...milestones]; m[idx].title = e.target.value; setMilestones(m); }} />
                                        <input type="date" className="form-input" value={ms.due_date} style={{ width: '160px' }}
                                            onChange={e => { const m = [...milestones]; m[idx].due_date = e.target.value; setMilestones(m); }} />
                                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMilestones(milestones.filter((_, i) => i !== idx))}>✕</button>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Project</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
