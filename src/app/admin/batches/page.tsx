'use client';

import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

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
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ course_id: '', name: '', start_date: '', end_date: '', schedule_time: '', trainer_id: '' });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [currentUserRole, setCurrentUserRole] = useState<string>('');

    // Roster Modal State
    const [viewStudentsId, setViewStudentsId] = useState<string | null>(null);
    const [viewStudentsName, setViewStudentsName] = useState<string>('');
    const [studentsList, setStudentsList] = useState<any[]>([]);
    const [allStudents, setAllStudents] = useState<any[]>([]);
    const [enrollStudentId, setEnrollStudentId] = useState('');

    useEffect(() => { 
        loadData(); 
        const role = localStorage.getItem('auth_role') || '';
        setCurrentUserRole(role);
    }, []);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            const payload = {
                course_id: form.course_id || null,
                name: form.name,
                start_date: form.start_date,
                end_date: form.end_date,
                schedule_time: form.schedule_time || null,
                trainer_id: form.trainer_id || null,
            };
            
            if (editingId) {
                await apiPut(`/api/admin/batches/${editingId}`, payload);
                setShowModal(false);
                setEditingId(null);
                setForm({ course_id: '', name: '', start_date: '', end_date: '', schedule_time: '', trainer_id: '' });
                loadData();
            } else {
                const res = await apiPost('/api/admin/batches', payload);
                if (res.ok) {
                    setShowModal(false);
                    setForm({ course_id: '', name: '', start_date: '', end_date: '', schedule_time: '', trainer_id: '' });
                    loadData();
                } else {
                    const d = await res.json().catch(() => ({}));
                    if (Array.isArray(d.detail)) {
                        setError(d.detail.map((e: any) => `${e.loc?.join('.')} — ${e.msg}`).join('; '));
                    } else {
                        setError(d.detail || d.message || JSON.stringify(d) || 'Failed to create batch.');
                    }
                }
            }
        } catch (err: any) {
            setError(err.message || 'Network error.');
        } finally {
            setSubmitting(false);
        }
    };
    
    const openEdit = (b: Batch) => {
        setEditingId(b.id);
        setForm({
            course_id: b.course_name ? courses.find(c => c.name === b.course_name)?.id || '' : '',
            name: b.name,
            start_date: b.start_date.split('T')[0],
            end_date: b.end_date.split('T')[0],
            schedule_time: b.schedule_time || '',
            trainer_id: b.trainer_name ? trainers.find(t => t.name === b.trainer_name)?.id || '' : ''
        });
        setShowModal(true);
    };
    
    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to permanently delete batch "${name}"? All enrolled students and records will be completely removed.`)) return;
        try {
            await apiDelete(`/api/admin/batches/${id}`);
            loadData();
        } catch (err: any) {
            alert(err.message || 'Failed to delete');
        }
    };

    const handleViewStudents = async (id: string, name: string) => {
        setViewStudentsId(id);
        setViewStudentsName(name);
        setStudentsList([]);
        try {
            const [batchStudents, allStuds] = await Promise.all([
                apiGet(`/api/training/batches/${id}/students`),
                apiGet(`/api/admin/students?role=STUDENT`)
            ]);
            setStudentsList(batchStudents);
            setAllStudents(allStuds);
        } catch {}
    };

    const handleEnrollStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!enrollStudentId || !viewStudentsId) return;
        try {
            await apiPost(`/api/admin/users/${enrollStudentId}/assign-batch`, { batch_id: viewStudentsId });
            setEnrollStudentId('');
            handleViewStudents(viewStudentsId, viewStudentsName); // Reload
        } catch { alert("Failed to enroll student."); }
    };

    const handleRemoveStudent = async (studentId: string) => {
        if (!viewStudentsId || !confirm("Remove this student from the batch?")) return;
        try {
            await apiDelete(`/api/admin/users/${studentId}/batches/${viewStudentsId}`);
            setStudentsList(studentsList.filter(s => s.id !== studentId));
        } catch { alert("Failed to remove student."); }
    };

    return (
        <div className="animate-in">
            <div className="page-header">
                <div><h1 className="page-title">Batches</h1><p className="page-subtitle">Manage training batches</p></div>
                {['SUPER_ADMIN', 'ADMIN'].includes(currentUserRole) && (
                    <button className="btn btn-primary" onClick={() => { setError(''); setShowModal(true); }}>+ New Batch</button>
                )}
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
            <div className="grid-3">
                {batches.map(b => (
                    <div className="card-glass" key={b.id} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: 'var(--primary)' }}>{b.name}</h3>
                            <p className="text-sm" style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontWeight: 600 }}>{b.course_name || 'Independent Batch'}</p>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '16px' }}>📅</span> 
                                    <span>{new Date(b.start_date).toLocaleDateString()}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '16px' }}>👥</span> 
                                    <span>{b.student_count} Students Enrolled</span>
                                </div>
                                {b.schedule_time && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '16px' }}>⏰</span> 
                                        <span>{b.schedule_time}</span>
                                    </div>
                                )}
                                {b.trainer_name && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--info-dark)', fontWeight: 600 }}>
                                        <span style={{ fontSize: '16px' }}>👨‍🏫</span> 
                                        <span>{b.trainer_name}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                            <span className={`badge ${b.is_active ? 'badge-success' : 'badge-danger'}`}>{b.is_active ? 'Active' : 'Ended'}</span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn btn-sm btn-primary" onClick={() => handleViewStudents(b.id, b.name)}>Student</button>
                                {['SUPER_ADMIN', 'ADMIN'].includes(currentUserRole.toUpperCase()) && (
                                    <>
                                        <button className="btn btn-sm btn-ghost" onClick={() => openEdit(b)}>Edit</button>
                                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(b.id, b.name)}>Delete</button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <h2 className="modal-title">{editingId ? 'Modify Training Batch' : 'Initialize New Batch'}</h2>
                        <p style={{ margin: '-16px 0 24px', color: 'var(--text-secondary)', fontSize: '14px' }}>Configure session schedules and assign trainers for the new cohort.</p>

                        {error && (
                            <div className="badge badge-danger" style={{ width: '100%', justifyContent: 'center', padding: '12px', marginBottom: '20px', borderRadius: '12px' }}>
                                ⚠️ {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="form-group">
                                <label className="form-label">Associated Course Program</label>
                                <select className="form-select" value={form.course_id} onChange={e => setForm({ ...form, course_id: e.target.value })}>
                                    <option value="">Independent Training (No Course)</option>
                                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Batch Identity Name</label>
                                <input className="form-input" placeholder="e.g. FullStack-2024-B1" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Commencement Date</label>
                                    <input className="form-input" type="date" required value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Expected Completion</label>
                                    <input className="form-input" type="date" required value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Schedule Timeframe</label>
                                    <input className="form-input" placeholder="e.g. 10:00 AM - 01:00 PM" value={form.schedule_time} onChange={e => setForm({ ...form, schedule_time: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Designated Lead Trainer</label>
                                    <select className="form-select" value={form.trainer_id} onChange={e => setForm({ ...form, trainer_id: e.target.value })}>
                                        <option value="">Unassigned (No Trainer)</option>
                                        {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => { setShowModal(false); setEditingId(null); }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Processing Session...' : (editingId ? 'Commit Changes' : 'Launch Batch')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Roster Modal */}
            {viewStudentsId && (
                <div className="modal-overlay" onClick={() => setViewStudentsId(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 className="modal-title" style={{ margin: 0 }}>Roster: {viewStudentsName}</h2>
                            <button className="btn btn-sm btn-ghost" onClick={() => setViewStudentsId(null)}>✕ Close</button>
                        </div>

                        {/* Add Student Form */}
                        {['SUPER_ADMIN', 'ADMIN'].includes(currentUserRole) && (
                            <div className="card" style={{ padding: '16px', marginBottom: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                                <h4 style={{ margin: '0 0 12px' }}>➕ Enroll Student</h4>
                                <form onSubmit={handleEnrollStudent} style={{ display: 'flex', gap: '12px' }}>
                                    <select className="form-select" style={{ flex: 1 }} value={enrollStudentId} onChange={e => setEnrollStudentId(e.target.value)} required>
                                        <option value="">— Select a Student —</option>
                                        {allStudents.filter(u => !studentsList.some(s => s.id === u.id)).map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                                        ))}
                                    </select>
                                    <button type="submit" className="btn btn-primary" disabled={!enrollStudentId}>Add</button>
                                </form>
                            </div>
                        )}

                        {studentsList.length === 0 ? (
                            <div className="empty-state"><div className="empty-icon">👥</div><p className="text-muted">No students enrolled in this batch.</p></div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {studentsList.map(s => (
                                    <div key={s.id} className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                <h3 style={{ margin: 0, fontSize: '15px' }}>{s.name}</h3>
                                                <span className="badge" style={{ fontSize: '10px', background: 'var(--bg-secondary)' }}>{s.student_id}</span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>{s.email}</p>
                                        </div>
                                        
                                        <div style={{ flex: 1, padding: '0 24px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px', fontWeight: 600 }}>
                                                <span>Assignments Progress</span>
                                                <span style={{ color: s.progress_percentage === 100 ? 'var(--success)' : 'var(--text-primary)' }}>
                                                    {s.progress_percentage || 0}% ({s.completed || 0}/{s.total_activities || 0})
                                                </span>
                                            </div>
                                            <div style={{ height: '6px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ width: `${s.progress_percentage || 0}%`, height: '100%', background: s.progress_percentage === 100 ? 'var(--success)' : 'var(--primary)', transition: 'width 0.3s ease' }} />
                                            </div>
                                        </div>

                                        {['SUPER_ADMIN', 'ADMIN'].includes(currentUserRole) && (
                                            <div>
                                                <button className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => handleRemoveStudent(s.id)}>Remove</button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
