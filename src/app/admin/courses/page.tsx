'use client';

import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '@/lib/api';

interface Course {
    id: string;
    name: string;
    description: string | null;
    duration: string | null;
    fee: number;
    is_active: boolean;
    created_at: string;
    batch_count: number;
    student_count: number;
}

export default function CoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: '', description: '', duration: '', fee: '' });

    useEffect(() => { loadCourses(); }, []);

    const loadCourses = async () => {
        try {
            const data = await apiGet('/api/admin/courses');
            setCourses(data);
        } catch { } finally { setLoading(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await apiPost('/api/admin/courses', {
            name: form.name, description: form.description,
            duration: form.duration, fee: parseFloat(form.fee) || 0,
        });
        if (res.ok) { setShowModal(false); setForm({ name: '', description: '', duration: '', fee: '' }); loadCourses(); }
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
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Course</button>
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
                        <thead><tr><th>Course Name</th><th>Duration</th><th>Fee</th><th>Batches</th><th>Students</th><th>Status</th></tr></thead>
                        <tbody>{courses.map(c => (
                            <tr key={c.id}>
                                <td><strong>{c.name}</strong><br /><span className="text-sm text-muted">{c.description}</span></td>
                                <td>{c.duration || '-'}</td><td>₹{c.fee.toLocaleString()}</td>
                                <td>{c.batch_count}</td><td>{c.student_count}</td>
                                <td><span className={`badge ${c.is_active ? 'badge-success' : 'badge-danger'}`}>{c.is_active ? 'Active' : 'Inactive'}</span></td>
                            </tr>
                        ))}</tbody>
                    </table></div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">Create New Course</h2>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="form-group"><label>Course Name</label><input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                            <div className="form-group"><label>Description</label><textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                            <div className="form-group"><label>Duration</label><input className="form-input" placeholder="e.g. 6 months" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} /></div>
                            <div className="form-group"><label>Fee (₹)</label><input className="form-input" type="number" value={form.fee} onChange={e => setForm({ ...form, fee: e.target.value })} /></div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Course</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
