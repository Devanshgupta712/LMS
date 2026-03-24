'use client';

import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '@/lib/api';

interface Student { 
    id: string; 
    name: string; 
    email: string; 
    phone: string | null; 
    student_id: string | null; 
    role: string; 
    is_active: boolean; 
    created_at: string; 
    attendance_percentage: number | null;
    days_present: number;
    days_absent: number;
    leaves_taken: number;
}

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', phone: '', password: 'welcome123' });
    
    // Report Modal State
    const [reportModal, setReportModal] = useState<{isOpen: boolean, data: any | null, loading: boolean}>({ isOpen: false, data: null, loading: false });

    useEffect(() => { loadStudents(); }, []);

    const loadStudents = async () => {
        try { setStudents(await apiGet('/api/admin/students')); } catch { } finally { setLoading(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await apiPost('/api/admin/students', form);
        if (res.ok) { setShowModal(false); setForm({ name: '', email: '', phone: '', password: 'welcome123' }); loadStudents(); }
    };

    const openReport = async (studentId: string) => {
        setReportModal({ isOpen: true, data: null, loading: true });
        try {
            const data = await apiGet(`/api/admin/students/${studentId}/report`);
            setReportModal({ isOpen: true, data, loading: false });
        } catch (e) {
            setReportModal({ isOpen: true, data: null, loading: false });
        }
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
                        <thead>
                            <tr>
                                <th>Student ID</th>
                                <th>Name / Email</th>
                                <th>Status</th>
                                <th>Attendance %</th>
                                <th>Leaves</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>{students.map(s => (
                            <tr key={s.id}>
                                <td><span style={{ fontFamily: 'monospace', color: '#3399ff', fontWeight: 600 }}>{s.student_id || '-'}</span></td>
                                <td>
                                    <strong>{s.name}</strong><br/>
                                    <span style={{fontSize: '12px', color: 'var(--text-muted)'}}>{s.email}</span>
                                </td>
                                <td><span className={`badge ${s.is_active ? 'badge-success' : 'badge-danger'}`}>{s.is_active ? 'Active' : 'Inactive'}</span></td>
                                <td>
                                    <div style={{fontWeight: 700, fontSize: '15px', color: s.attendance_percentage !== null && s.attendance_percentage < 75 ? 'var(--danger)' : 'var(--success)'}}>
                                        {s.attendance_percentage ?? 0}%
                                    </div>
                                    <div style={{fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)'}}>{s.days_present} P / {s.days_absent} A</div>
                                </td>
                                <td><span style={{fontWeight: 600, color: s.leaves_taken > 0 ? 'var(--accent)' : 'inherit'}}>{s.leaves_taken}</span></td>
                                <td>
                                    <button className="btn btn-primary" style={{padding: '6px 16px', fontSize: '13px', borderRadius: '8px'}} onClick={() => openReport(s.id)}>Report</button>
                                </td>
                            </tr>
                        ))}</tbody>
                    </table></div>
                )}
            </div>

            {/* Create Student Modal */}
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

            {/* Comprehensive Report Modal */}
            {reportModal.isOpen && (
                <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={() => setReportModal({ isOpen: false, data: null, loading: false })}>
                    <div className="modal" style={{maxWidth: '750px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '32px'}} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 className="modal-title" style={{ margin: 0, fontSize: '24px' }}>Student Report</h2>
                            <button className="btn btn-ghost" style={{padding: '8px', fontSize: '18px'}} onClick={() => setReportModal({ isOpen: false, data: null, loading: false })}>✕</button>
                        </div>
                        
                        {reportModal.loading ? <div style={{padding: '60px', textAlign: 'center', fontSize: '16px', color: 'var(--text-muted)'}}>Loading comprehensive report...</div> : 
                         reportModal.data ? (
                            <div>
                                {/* Profile Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '24px', borderRadius: '20px', marginBottom: '24px', border: '1px solid var(--border)' }}>
                                    <div>
                                        <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>{reportModal.data.student.name}</h3>
                                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px', fontWeight: 500 }}>
                                            <span style={{color: '#3399ff'}}>{reportModal.data.student.student_id}</span> • {reportModal.data.student.email}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right', background: 'var(--bg-primary)', padding: '16px 24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                        <div style={{ fontSize: '32px', fontWeight: 900, color: reportModal.data.stats.attendance_percentage < 75 ? 'var(--danger)' : 'var(--success)' }}>
                                            {reportModal.data.stats.attendance_percentage}%
                                        </div>
                                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>Overall Attendance</p>
                                    </div>
                                </div>

                                {/* Metrics Grid */}
                                <div className="grid-4 mb-24" style={{ gap: '16px' }}>
                                    <div className="stat-card" style={{padding: '20px', border: '1px solid var(--border)'}}>
                                        <div style={{color: 'var(--success)', fontWeight: 800, fontSize: '28px'}}>{reportModal.data.stats.days_present}</div>
                                        <div style={{fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)'}}>Days Present</div>
                                    </div>
                                    <div className="stat-card" style={{padding: '20px', border: '1px solid var(--border)'}}>
                                        <div style={{color: 'var(--danger)', fontWeight: 800, fontSize: '28px'}}>{reportModal.data.stats.days_absent}</div>
                                        <div style={{fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)'}}>Days Absent</div>
                                    </div>
                                    <div className="stat-card" style={{padding: '20px', border: '1px solid var(--border)'}}>
                                        <div style={{color: 'var(--accent)', fontWeight: 800, fontSize: '28px'}}>{reportModal.data.stats.leaves_taken}</div>
                                        <div style={{fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)'}}>Approved Leaves</div>
                                    </div>
                                    <div className="stat-card" style={{padding: '20px', border: '1px solid var(--border)'}}>
                                        <div style={{color: '#38bdf8', fontWeight: 800, fontSize: '28px'}}>
                                            {Math.floor((reportModal.data.stats.total_punch_minutes || 0) / 60)}h {(reportModal.data.stats.total_punch_minutes || 0) % 60}m
                                        </div>
                                        <div style={{fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)'}}>Inst. Hours</div>
                                    </div>
                                </div>

                                {/* Class Attendance Timeline */}
                                <h3 style={{fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)'}}>Class Attendance Timeline</h3>
                                <div style={{background: 'var(--bg-secondary)', borderRadius: '20px', padding: '4px', border: '1px solid var(--border)', marginBottom: '32px'}}>
                                    {reportModal.data.attendance_logs.length === 0 ? (
                                        <div style={{padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 500}}>No class attendance records logged.</div>
                                    ) : (
                                        <div style={{maxHeight: '300px', overflowY: 'auto'}}>
                                            <table className="table" style={{background: 'transparent', margin: 0}}>
                                                <thead>
                                                    <tr>
                                                        <th style={{position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 1}}>Date</th>
                                                        <th style={{position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 1}}>Batch Session</th>
                                                        <th style={{position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 1}}>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {reportModal.data.attendance_logs.map((log: any) => (
                                                        <tr key={log.id} style={{borderBottom: '1px solid var(--border)'}}>
                                                            <td style={{fontWeight: 500, color: 'var(--text-primary)'}}>{new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                                            <td style={{color: 'var(--text-muted)'}}>{log.batch_name}</td>
                                                            <td>
                                                                <span className={`badge ${log.status === 'PRESENT' || log.status === 'LATE' ? 'badge-success' : 'badge-danger'}`} style={{fontWeight: 700, padding: '4px 10px'}}>
                                                                    {log.status === 'LATE' ? 'LATE (PRESENT)' : log.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {/* Institute Time Tracking Timeline */}
                                <h3 style={{fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)'}}>Institute Tracking (Punch In/Out)</h3>
                                <div style={{background: 'var(--bg-secondary)', borderRadius: '20px', padding: '4px', border: '1px solid var(--border)'}}>
                                    {!reportModal.data.time_logs || reportModal.data.time_logs.length === 0 ? (
                                        <div style={{padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 500}}>No punch records found for this student.</div>
                                    ) : (
                                        <div style={{maxHeight: '300px', overflowY: 'auto'}}>
                                            <table className="table" style={{background: 'transparent', margin: 0}}>
                                                <thead>
                                                    <tr>
                                                        <th style={{position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 1}}>Date</th>
                                                        <th style={{position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 1}}>Punch In</th>
                                                        <th style={{position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 1}}>Punch Out</th>
                                                        <th style={{position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 1}}>Duration</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {reportModal.data.time_logs.map((log: any) => (
                                                        <tr key={log.id} style={{borderBottom: '1px solid var(--border)'}}>
                                                            <td style={{fontWeight: 500, color: 'var(--text-primary)'}}>{new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                                            <td style={{color: 'var(--success)', fontWeight: 600}}>{new Date(log.login_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</td>
                                                            <td style={{color: 'var(--danger)', fontWeight: 600}}>{log.logout_time ? new Date(log.logout_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}</td>
                                                            <td style={{fontWeight: 700, color: '#38bdf8'}}>
                                                                {log.total_minutes ? `${Math.floor(log.total_minutes / 60)}h ${log.total_minutes % 60}m` : (log.logout_time ? '0m' : 'Active...')}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div style={{padding: '40px', textAlign: 'center', color: 'var(--danger)', fontWeight: 600}}>Failed to safely retrieve report data. Please try again.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
