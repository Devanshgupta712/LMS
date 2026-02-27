'use client';

import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '@/lib/api';

interface Student { id: string; name: string; email: string; phone: string | null; student_id: string | null; role: string; is_active: boolean; created_at: string; }

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', phone: '', password: 'welcome123' });

    useEffect(() => { loadStudents(); }, []);

    const loadStudents = async () => {
        try { setStudents(await apiGet('/api/admin/students')); } catch { } finally { setLoading(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await apiPost('/api/admin/students', form);
        if (res.ok) { setShowModal(false); setForm({ name: '', email: '', phone: '', password: 'welcome123' }); loadStudents(); }
    };

    return (
        <div className="animate-in">
            <div className="page-header">
                <div><h1 className="page-title">Students</h1><p className="page-subtitle">Manage student records and IDs</p></div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Student</button>
            </div>

            <div className="grid-4 mb-24">
                <div className="stat-card primary"><div className="stat-icon primary">🎓</div><div className="stat-info"><h3>Total Students</h3><div className="stat-value">{students.length}</div></div></div>
                <div className="stat-card success"><div className="stat-icon success">✅</div><div className="stat-info"><h3>Active</h3><div className="stat-value">{students.filter(s => s.is_active).length}</div></div></div>
            </div>

            <div className="card">
                {loading ? <p>Loading...</p> : students.length === 0 ? (
                    <div className="empty-state"><div className="empty-icon">🎓</div><h3>No students yet</h3></div>
                ) : (
                    <div className="table-responsive"><table className="table">
                        <thead><tr><th>Student ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th>Joined</th></tr></thead>
                        <tbody>{students.map(s => (
                            <tr key={s.id}>
                                <td><span style={{ fontFamily: 'monospace', color: '#3399ff' }}>{s.student_id || '-'}</span></td>
                                <td><strong>{s.name}</strong></td><td>{s.email}</td><td>{s.phone || '-'}</td>
                                <td><span className={`badge ${s.is_active ? 'badge-success' : 'badge-danger'}`}>{s.is_active ? 'Active' : 'Inactive'}</span></td>
                                <td>{new Date(s.created_at).toLocaleDateString()}</td>
                            </tr>
                        ))}</tbody>
                    </table></div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">Add New Student</h2>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="form-group"><label>Full Name</label><input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                            <div className="form-group"><label>Email</label><input className="form-input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                            <div className="form-group"><label>Phone</label><input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                            <div className="form-group"><label>Password</label><input className="form-input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
                            <p className="text-sm text-muted">Student ID will be auto-generated (APC-YYYY-XXXX)</p>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Add Student</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
