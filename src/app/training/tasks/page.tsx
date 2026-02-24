'use client';

import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '@/lib/api';

interface TaskItem {
    id: string; title: string; description: string | null;
    batch_id: string | null; priority: string; status: string;
    assigned_by: string | null; due_date: string | null; created_at: string;
}

const priorityColors: Record<string, string> = {
    LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#f97316', URGENT: '#ef4444'
};
const statusColors: Record<string, string> = {
    PENDING: '#94a3b8', IN_PROGRESS: '#3b82f6', COMPLETED: '#10b981',
};

export default function TasksPage() {
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState('ALL');
    const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', due_date: '' });

    useEffect(() => { loadTasks(); }, []);

    const loadTasks = async () => {
        try { setTasks(await apiGet('/api/training/tasks')); } catch { } finally { setLoading(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        await apiPost('/api/training/tasks', form);
        setShowModal(false);
        setForm({ title: '', description: '', priority: 'MEDIUM', due_date: '' });
        loadTasks();
    };

    const filtered = filter === 'ALL' ? tasks : tasks.filter(t => t.status === filter);

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Tasks</h1>
                    <p className="page-subtitle">Daily & weekly practice tasks for students</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Task</button>
            </div>

            {/* Stats */}
            <div className="grid-4 mb-24">
                <div className="stat-card primary"><div className="stat-icon primary">📋</div><div className="stat-info"><h3>Total Tasks</h3><div className="stat-value">{tasks.length}</div></div></div>
                <div className="stat-card accent"><div className="stat-icon accent">⏳</div><div className="stat-info"><h3>Pending</h3><div className="stat-value">{tasks.filter(t => t.status === 'PENDING').length}</div></div></div>
                <div className="stat-card success"><div className="stat-icon success">🔄</div><div className="stat-info"><h3>In Progress</h3><div className="stat-value">{tasks.filter(t => t.status === 'IN_PROGRESS').length}</div></div></div>
                <div className="stat-card danger"><div className="stat-icon danger">✅</div><div className="stat-info"><h3>Completed</h3><div className="stat-value">{tasks.filter(t => t.status === 'COMPLETED').length}</div></div></div>
            </div>

            {/* Filter Tabs */}
            <div className="tabs">
                {['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].map(s => (
                    <button key={s} className={`tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
                        {s === 'ALL' ? 'All' : s.replace(/_/g, ' ')}
                    </button>
                ))}
            </div>

            {/* Task List */}
            {loading ? <p>Loading...</p> : filtered.length === 0 ? (
                <div className="card"><div className="empty-state"><div className="empty-icon">📋</div><h3>No tasks found</h3><p className="text-sm text-muted">Create your first task to get started</p></div></div>
            ) : (
                <div className="grid-3">
                    {filtered.map(task => (
                        <div key={task.id} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: priorityColors[task.priority] }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, flex: 1 }}>{task.title}</h3>
                                <span className="badge" style={{ background: `${statusColors[task.status]}20`, color: statusColors[task.status], fontSize: '11px' }}>
                                    {task.status.replace(/_/g, ' ')}
                                </span>
                            </div>
                            {task.description && <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: 1.5, margin: '0 0 12px' }}>{task.description}</p>}
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: '#64748b' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: priorityColors[task.priority], display: 'inline-block' }} />
                                    {task.priority}
                                </span>
                                {task.due_date && <span>📅 {new Date(task.due_date).toLocaleDateString()}</span>}
                                {task.assigned_by && <span>👤 {task.assigned_by}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">Create New Task</h2>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="form-group"><label className="form-label">Title</label><input className="form-input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Build a REST API" /></div>
                            <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Task details..." /></div>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">Priority</label>
                                    <select className="form-input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                                        <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option>
                                    </select>
                                </div>
                                <div className="form-group"><label className="form-label">Due Date</label><input type="date" className="form-input" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
