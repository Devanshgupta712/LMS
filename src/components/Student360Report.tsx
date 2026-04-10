'use client';

import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api';

interface Props {
    studentId: string;
    onClose: () => void;
}

export default function Student360Report({ studentId, onClose }: Props) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        apiGet(`/api/training/students/${studentId}/full-report`)
            .then(setData)
            .catch(err => {
                console.error("360 Report Error:", err);
                setError("Failed to load student report. Please try again later.");
            })
            .finally(() => setLoading(false));
    }, [studentId]);

    const getGradeColor = (p: number) => {
        if (p >= 80) return '#10b981';
        if (p >= 60) return '#f59e0b';
        return '#ef4444';
    };

    if (loading) return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth: '400px', textAlign: 'center', padding: '40px' }}>
                <div className="spinner" style={{ margin: '0 auto 20px' }} />
                <p>Generating 360° Report...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth: '400px', textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '40px', marginBottom: '20px' }}>⚠️</div>
                <h3 style={{ marginBottom: '10px' }}>Connection Error</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>{error}</p>
                <button onClick={onClose} className="btn btn-primary" style={{ width: '100%' }}>Close</button>
            </div>
        </div>
    );

    if (!data && !loading) return null;

    const { student, stats, academics, violations_detail, attendance } = data;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', width: '95%', maxHeight: '90vh', overflowY: 'auto', padding: '0' }}>
                {/* Header Section */}
                <div style={{ background: 'var(--primary)', color: '#fff', padding: '32px', position: 'relative' }}>
                    <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}>✕ Close</button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '16px', background: 'rgba(255,255,255,0.2)', fontSize: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            👤
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 800 }}>{student.name}</h2>
                            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '14px' }}>{student.email} • Student ID: {student.student_id || 'N/A'}</p>
                            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                                <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>📅 Joined {new Date(student.joined_at).toLocaleDateString()}</span>
                                <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>🏆 Batch Student</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '32px' }}>
                    {/* Stats Ribbon */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
                        <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Overall Grade</div>
                            <div style={{ fontSize: '32px', fontWeight: 800, color: getGradeColor(stats.grade_percentage) }}>{stats.grade_percentage}%</div>
                        </div>
                        <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Attendance</div>
                            <div style={{ fontSize: '32px', fontWeight: 800, color: stats.attendance_percentage > 75 ? 'var(--success)' : 'var(--danger)' }}>{stats.attendance_percentage}%</div>
                        </div>
                        <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Effort (Hours)</div>
                            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary)' }}>{stats.total_work_hours}h</div>
                        </div>
                        <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Violations</div>
                            <div style={{ fontSize: '32px', fontWeight: 800, color: stats.total_violations > 5 ? 'var(--danger)' : 'inherit' }}>{stats.total_violations}</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
                        {/* Left Column: Academics */}
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>📝 Academic Record</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {academics.map((a: any) => (
                                    <div key={a.id} style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: 700 }}>{a.title}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{a.type} • {a.status}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '16px', fontWeight: 800, color: a.marks > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>{a.marks} / {a.total_marks}</div>
                                            {a.submitted_at && <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{new Date(a.submitted_at).toLocaleDateString()}</div>}
                                        </div>
                                    </div>
                                ))}
                                {academics.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No academic data found.</p>}
                            </div>
                        </div>

                        {/* Right Column: Integrity & Presence */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>🛡️ Proctoring Violations</h3>
                                <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '16px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div style={{ padding: '12px', background: '#fff', borderRadius: '8px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '20px', fontWeight: 800, color: violations_detail.TAB_SWITCH > 0 ? 'var(--danger)' : 'inherit' }}>{violations_detail.TAB_SWITCH}</div>
                                            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Tab Switch</div>
                                        </div>
                                        <div style={{ padding: '12px', background: '#fff', borderRadius: '8px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '20px', fontWeight: 800, color: violations_detail.FACE_LOSS > 0 ? 'var(--danger)' : 'inherit' }}>{violations_detail.FACE_LOSS}</div>
                                            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Face Loss</div>
                                        </div>
                                        <div style={{ padding: '12px', background: '#fff', borderRadius: '8px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '20px', fontWeight: 800, color: violations_detail.FULLSCREEN_EXIT > 0 ? 'var(--danger)' : 'inherit' }}>{violations_detail.FULLSCREEN_EXIT}</div>
                                            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>FS Exit</div>
                                        </div>
                                        <div style={{ padding: '12px', background: '#fff', borderRadius: '8px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '20px', fontWeight: 800, color: violations_detail.MIC_OFF > 0 ? 'var(--danger)' : 'inherit' }}>{violations_detail.MIC_OFF}</div>
                                            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Mic Off</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>📍 Attendance Breakdown</h3>
                                <div style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span>Present</span><span style={{ fontWeight: 700, color: 'var(--success)' }}>{attendance.present}</span></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span>Late</span><span style={{ fontWeight: 700, color: '#f59e0b' }}>{attendance.late}</span></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span>Absent</span><span style={{ fontWeight: 700, color: 'var(--danger)' }}>{attendance.absent}</span></div>
                                        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 700 }}><span>Total Records</span><span>{attendance.total}</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
