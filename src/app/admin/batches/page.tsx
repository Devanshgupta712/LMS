'use client';

import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '@/lib/api';

interface Batch {
    id: string; name: string; start_date: string; end_date: string;
    is_active: boolean; course_name: string; trainer_name: string | null; student_count: number; schedule_time: string | null;
}

export default function BatchesPage() {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [trainers, setTrainers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ course_id: '', name: '', start_date: '', end_date: '', schedule_time: '', trainer_id: '' });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [b, c, t] = await Promise.all([
                apiGet('/api/admin/batches').catch(() => []),
                apiGet('/api/admin/courses').catch(() => []),
                apiGet('/api/admin/students?role=TRAINER').catch(() => []),
            ]);
            setBatches(b); setCourses(c); setTrainers(t);
            if (!c || c.length === 0) setError('No courses found. Please create a course first before creating a batch.');
            else setError('');
        } catch {
            setError('Failed to load data. Please refresh.');
        } finally { setLoading(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            const payload = {
                course_id: form.course_id,
                name: form.name,
                start_date: form.start_date,
                end_date: form.end_date,
                schedule_time: form.schedule_time,
                trainer_id: form.trainer_id || null,
                leave_quota: 0,
            };
            const res = await apiPost('/api/admin/batches', payload);
            if (res.ok) {
                setShowModal(false);
                setForm({ course_id: '', name: '', start_date: '', end_date: '', schedule_time: '', trainer_id: '' });
                loadData();
            } else {
                const d = await res.json().catch(() => ({}));
                setError(d.detail || JSON.stringify(d) || 'Failed to create batch.');
            }
        } catch (err: any) {
            setError(err.message || 'Network error.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="animate-in">
            <div className="page-header">
                <div><h1 className="page-title">Batches</h1><p className="page-subtitle">Manage training batches</p></div>
                <button className="btn btn-primary" onClick={() => { setError(''); setShowModal(true); }}>+ New Batch</button>
            </div>

            {error && (
                <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', padding: '10px 16px', marginBottom: '16px', color: '#f59e0b', fontSize: '14px' }}>
                    ⚠️ {error} {courses.length === 0 && <a href="/admin/courses" style={{ color: '#0066ff', marginLeft: '8px' }}>→ Go to Courses →</a>}
                </div>
            )}

            <div className="card">
                {loading ? <p>Loading...</p> : batches.length === 0 ? (
                    <div className="empty-state"><div className="empty-icon">👥</div><h3>No batches yet</h3><p>Create courses first, then create batches.</p></div>
                ) : (
                    <div className="grid-3">{batches.map(b => (
                        <div className="card" key={b.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <h3 style={{ margin: '0 0 8px', fontSize: '16px' }}>{b.name}</h3>
                            <p className="text-sm text-muted" style={{ margin: '0 0 12px' }}>{b.course_name}</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px', color: '#94a3b8' }}>
                                <span>📅 {new Date(b.start_date).toLocaleDateString()}</span>
                                <span>👥 {b.student_count} students</span>
                                {b.schedule_time && <span>⏰ {b.schedule_time}</span>}
                            </div>
                            {b.trainer_name && <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#3399ff' }}>👨‍🏫 {b.trainer_name}</p>}
                            <span className={`badge ${b.is_active ? 'badge-success' : 'badge-danger'}`} style={{ marginTop: '8px', display: 'inline-block' }}>{b.is_active ? 'Active' : 'Ended'}</span>
                        </div>
                    ))}</div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">Create New Batch</h2>
                        {error && (
                            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '8px', padding: '10px', color: '#f87171', fontSize: '13px', marginBottom: '12px' }}>
                                ⚠️ {error}
                            </div>
                        )}
                        {courses.length === 0 && (
                            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', padding: '10px', color: '#fbbf24', fontSize: '13px', marginBottom: '12px' }}>
                                ⚠️ No courses available. <a href="/admin/courses" style={{ color: '#60a5fa' }}>Create a course first →</a>
                            </div>
                        )}
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="form-group"><label>Course</label>
                                <select className="form-input" required value={form.course_id} onChange={e => setForm({ ...form, course_id: e.target.value })}>
                                    <option value="">Select course</option>{courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group"><label>Batch Name</label><input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div className="form-group"><label>Start Date</label><input className="form-input" type="date" required value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
                                <div className="form-group"><label>End Date</label><input className="form-input" type="date" required value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
                            </div>
                            <div className="form-group"><label>Schedule Time</label><input className="form-input" placeholder="e.g. 10:00 - 12:00" value={form.schedule_time} onChange={e => setForm({ ...form, schedule_time: e.target.value })} /></div>
                            <div className="form-group"><label>Trainer <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span></label>
                                <select className="form-input" value={form.trainer_id} onChange={e => setForm({ ...form, trainer_id: e.target.value })}>
                                    <option value="">No trainer assigned</option>{trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Creating...' : 'Create Batch'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
