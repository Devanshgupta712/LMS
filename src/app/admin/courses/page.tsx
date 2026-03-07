'use client';

import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete, getStoredUser } from '@/lib/api';

interface Course {
    id: string; name: string; description: string | null;
    duration: string | null; fee: number; is_active: boolean;
    created_at: string; batch_count: number; student_count: number;
}

const EMPTY_FORM = { name: '', description: '', duration: '', fee: '' };

export default function CoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editCourse, setEditCourse] = useState<Course | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const user = getStoredUser();
    const canEdit = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

    useEffect(() => { loadCourses(); }, []);

    const loadCourses = async () => {
        try { setCourses(await apiGet('/api/admin/courses')); }
        catch { } finally { setLoading(false); }
    };

    const openCreate = () => {
        setEditCourse(null); setForm(EMPTY_FORM); setError(''); setShowModal(true);
    };

    const openEdit = (c: Course) => {
        setEditCourse(c);
        setForm({ name: c.name, description: c.description || '', duration: c.duration || '', fee: String(c.fee) });
        setError(''); setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setError(''); setSubmitting(true);
        try {
            const payload = { name: form.name, description: form.description, duration: form.duration, fee: parseFloat(form.fee) || 0 };
            const res = editCourse
                ? await apiPatch(`/api/admin/courses/${editCourse.id}`, { ...payload, is_active: editCourse.is_active })
                : await apiPost('/api/admin/courses', payload);
            if (res.ok) {
                setShowModal(false); loadCourses();
            } else {
                const d = await res.json().catch(() => ({}));
                setError(Array.isArray(d.detail) ? d.detail.map((e: any) => e.msg).join('; ') : d.detail || 'Failed.');
            }
        } catch (err: any) { setError(err.message || 'Network error.'); }
        finally { setSubmitting(false); }
    };

    const handleToggleActive = async (c: Course) => {
        const res = await apiPatch(`/api/admin/courses/${c.id}`, { is_active: !c.is_active });
        if (res.ok) loadCourses();
    };

    const handleDelete = async (c: Course) => {
        if (!confirm(`Delete "${c.name}"? This cannot be undone.`)) return;
        const res = await apiDelete(`/api/admin/courses/${c.id}`);
        if (res.ok) { loadCourses(); }
        else {
            const d = await res.json().catch(() => ({}));
            alert(d.detail || 'Failed to delete course.');
        }
    };

    const totalBatches = courses.reduce((a, c) => a + c.batch_count, 0);
    const totalStudents = courses.reduce((a, c) => a + c.student_count, 0);

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Courses</h1>
                    <p className="page-subtitle">Manage all courses offered at AppTechno Software</p>
                </div>
                {canEdit && <button className="btn btn-primary" onClick={openCreate}>+ New Course</button>}
            </div>

            <div className="grid-4 mb-24">
                <div className="stat-card primary"><div className="stat-icon primary">📚</div><div className="stat-info"><h3>Total Courses</h3><div className="stat-value">{courses.length}</div></div></div>
                <div className="stat-card accent"><div className="stat-icon accent">👥</div><div className="stat-info"><h3>Total Batches</h3><div className="stat-value">{totalBatches}</div></div></div>
                <div className="stat-card success"><div className="stat-icon success">🎓</div><div className="stat-info"><h3>Total Students</h3><div className="stat-value">{totalStudents}</div></div></div>
                <div className="stat-card danger"><div className="stat-icon danger">✅</div><div className="stat-info"><h3>Active</h3><div className="stat-value">{courses.filter(c => c.is_active).length}</div></div></div>
            </div>

            <div className="card">
                {loading ? <p>Loading...</p> : courses.length === 0 ? (
                    <div className="empty-state"><div className="empty-icon">📚</div><h3>No courses yet</h3><p>Create your first course to get started.</p></div>
                ) : (
                    <div className="table-responsive"><table className="table">
                        <thead><tr>
                            <th>Course Name</th><th>Duration</th><th>Fee</th><th>Batches</th><th>Students</th><th>Status</th>
                            {canEdit && <th>Actions</th>}
                        </tr></thead>
                        <tbody>{courses.map(c => (
                            <tr key={c.id}>
                                <td><strong>{c.name}</strong><br /><span className="text-sm text-muted">{c.description}</span></td>
                                <td>{c.duration || '-'}</td>
                                <td>₹{c.fee.toLocaleString()}</td>
                                <td>{c.batch_count}</td>
                                <td>{c.student_count}</td>
                                <td>
                                    <span
                                        className={`badge ${c.is_active ? 'badge-success' : 'badge-danger'}`}
                                        style={{ cursor: canEdit ? 'pointer' : 'default' }}
                                        title={canEdit ? 'Click to toggle' : ''}
                                        onClick={() => canEdit && handleToggleActive(c)}
                                    >
                                        {c.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                {canEdit && (
                                    <td>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button className="btn btn-sm btn-secondary" onClick={() => openEdit(c)}>✏️ Edit</button>
                                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c)} disabled={c.batch_count > 0} title={c.batch_count > 0 ? 'Delete batches first' : 'Delete course'}>🗑</button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}</tbody>
                    </table></div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">{editCourse ? `Edit — ${editCourse.name}` : 'Create New Course'}</h2>
                        {error && (
                            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '8px', padding: '10px', color: '#f87171', fontSize: '13px', marginBottom: '12px' }}>
                                ⚠️ {error}
                            </div>
                        )}
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="form-group"><label>Course Name</label><input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                            <div className="form-group"><label>Description</label><textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div className="form-group"><label>Duration</label><input className="form-input" placeholder="e.g. 6 months" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} /></div>
                                <div className="form-group"><label>Fee (₹)</label><input className="form-input" type="number" min="0" value={form.fee} onChange={e => setForm({ ...form, fee: e.target.value })} /></div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Saving...' : editCourse ? 'Save Changes' : 'Create Course'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
