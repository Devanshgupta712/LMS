'use client';

import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';

interface TimeLog {
    id: string;
    date: string;
    login_time: string;
    logout_time: string | null;
    total_minutes: number | null;
    user: {
        id: string;
        name: string;
        email: string;
        student_id: string | null;
    };
}

interface UserSummary {
    id: string;
    name: string;
    email: string;
    role: string;
}

export default function TimeTrackingPage() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [logs, setLogs] = useState<TimeLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ avgHours: '0h', activeToday: 0, onTime: 0, late: 0 });
    const [showQrModal, setShowQrModal] = useState(false);
    const [qrUrl, setQrUrl] = useState('');

    // Management State
    const [showManualModal, setShowManualModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingLog, setEditingLog] = useState<TimeLog | null>(null);
    const [users, setUsers] = useState<UserSummary[]>([]);
    const [formLoading, setFormLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        user_id: '',
        date: new Date().toISOString().split('T')[0],
        login_time: '',
        logout_time: ''
    });

    useEffect(() => {
        loadData();
    }, [selectedDate]);

    useEffect(() => {
        if (showManualModal) {
            loadUsers();
        }
    }, [showManualModal]);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await apiGet(`/api/training/time-tracking?date=${selectedDate}`);
            setLogs(data.logs || []);
            setStats(data.stats || { avgHours: '0h', activeToday: 0, onTime: 0, late: 0 });
        } catch (err) {
            console.error('Failed to load time tracking data:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            const data = await apiGet('/api/admin/students?role=STUDENT');
            setUsers(data || []);
        } catch (err) {
            console.error('Failed to load users:', err);
        }
    };

    const [qrType, setQrType] = useState<'PUNCH_IN' | 'PUNCH_OUT'>('PUNCH_IN');

    const generateQrCode = (type: 'PUNCH_IN' | 'PUNCH_OUT') => {
        setQrType(type);
        const expDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const payload = { type: type, exp: expDate };
        const token = btoa(JSON.stringify(payload));
        setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${token}`);
        setShowQrModal(true);
    };

    const formatTimeForInput = (isoString: string | null) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toTimeString().slice(0, 5); // HH:mm
    };

    const handleAddManual = () => {
        setFormData({
            user_id: '',
            date: selectedDate,
            login_time: '09:00',
            logout_time: '18:00'
        });
        setShowManualModal(true);
    };

    const handleEdit = (log: TimeLog) => {
        setEditingLog(log);
        setFormData({
            user_id: log.user.id,
            date: log.date.split('T')[0],
            login_time: formatTimeForInput(log.login_time),
            logout_time: formatTimeForInput(log.logout_time)
        });
        setShowEditModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this log?')) return;
        try {
            await apiDelete(`/api/training/time-tracking/${id}`);
            loadData();
        } catch (err) {
            alert('Failed to delete log');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            // Convert HH:mm to ISO
            const login_iso = new Date(`${formData.date}T${formData.login_time}`).toISOString();
            const logout_iso = formData.logout_time ? new Date(`${formData.date}T${formData.logout_time}`).toISOString() : null;

            if (showEditModal && editingLog) {
                await apiPatch(`/api/training/time-tracking/${editingLog.id}`, {
                    login_time: login_iso,
                    logout_time: logout_iso
                });
            } else {
                await apiPost('/api/training/time-tracking', {
                    user_id: formData.user_id,
                    date: formData.date,
                    login_time: login_iso,
                    logout_time: logout_iso
                });
            }
            setShowManualModal(false);
            setShowEditModal(false);
            loadData();
        } catch (err) {
            alert('Operation failed. Please check inputs.');
        } finally {
            setFormLoading(false);
        }
    };

    const formatTime = (isoString: string | null) => {
        if (!isoString) return '-';
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDuration = (minutes: number | null) => {
        if (!minutes) return '-';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m}m`;
    };

    return (
        <div className="animate-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 className="page-title">Time Tracking</h1>
                    <p className="page-subtitle">Monitor and manage trainee work hours</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="form-control"
                        style={{ width: 'auto' }}
                    />
                    <button className="btn btn-ghost" onClick={handleAddManual} style={{ border: '1px solid var(--border)' }}>
                        ➕ Manual Entry
                    </button>
                    <div style={{ display: 'flex', gap: '8px', padding: '4px', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <button className="btn btn-primary" onClick={() => generateQrCode('PUNCH_IN')} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '8px 16px' }}>
                            📥 Punch In QR
                        </button>
                        <button className="btn btn-primary" onClick={() => generateQrCode('PUNCH_OUT')} style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', padding: '8px 16px' }}>
                            📤 Punch Out QR
                        </button>
                    </div>
                    <button className="btn btn-ghost" onClick={loadData}>
                        🔄 Refresh
                    </button>
                </div>
            </div>

            <div className="grid-4 mb-24">
                <div className="stat-card primary"><div className="stat-icon primary">⏱️</div><div className="stat-info"><h3>Avg. Daily Hours</h3><div className="stat-value">{stats.avgHours}</div></div></div>
                <div className="stat-card accent"><div className="stat-icon accent">👥</div><div className="stat-info"><h3>Active Today</h3><div className="stat-value">{stats.activeToday}</div></div></div>
                <div className="stat-card success"><div className="stat-icon success">✅</div><div className="stat-info"><h3>On Time</h3><div className="stat-value">{stats.onTime}</div></div></div>
                <div className="stat-card danger"><div className="stat-icon danger">⚠️</div><div className="stat-info"><h3>Late Arrivals</h3><div className="stat-value">{stats.late}</div></div></div>
            </div>

            <div className="card">
                <h3 className="font-semibold mb-16">Time Logs — {selectedDate}</h3>
                {loading ? (
                    <p>Loading...</p>
                ) : logs.length === 0 ? (
                    <div className="empty-state" style={{ padding: '60px 16px' }}>
                        <div className="empty-icon">⏱️</div>
                        <h3>No time logs recorded</h3>
                        <p className="text-sm text-muted">Time tracking data will appear here when students log their hours for {selectedDate}.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Trainee</th>
                                    <th>ID</th>
                                    <th>Login Time</th>
                                    <th>Logout Time</th>
                                    <th>Total Duration</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.id}>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{log.user.name}</div>
                                            <div className="text-sm text-muted">{log.user.email}</div>
                                        </td>
                                        <td>{log.user.student_id || '-'}</td>
                                        <td>
                                            <span style={{ color: 'var(--success)', fontWeight: 500 }}>
                                                {formatTime(log.login_time)}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ color: 'var(--danger)', fontWeight: 500 }}>
                                                {formatTime(log.logout_time)}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{formatDuration(log.total_minutes)}</td>
                                        <td>
                                            {log.logout_time ? (
                                                <span className="badge badge-success">Completed</span>
                                            ) : (
                                                <span className="badge badge-warning">Active Now</span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(log)}>✏️</button>
                                                <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleDelete(log.id)}>🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Manual Entry / Edit Modal */}
            {(showManualModal || showEditModal) && (
                <div className="modal-backdrop" onClick={() => { setShowManualModal(false); setShowEditModal(false); }}>
                    <div className="modal card" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                        <h3 className="mb-24">{showEditModal ? 'Edit Time Log' : 'Add Manual Entry'}</h3>
                        <form onSubmit={handleSubmit}>
                            {!showEditModal && (
                                <div className="form-group mb-16">
                                    <label>Select Trainee</label>
                                    <select
                                        className="form-control"
                                        required
                                        value={formData.user_id}
                                        onChange={e => setFormData({ ...formData, user_id: e.target.value })}
                                    >
                                        <option value="">-- Choose Trainee --</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="form-group mb-16">
                                <label>Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    required
                                    disabled={showEditModal}
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>

                            <div className="grid-2 mb-24">
                                <div className="form-group">
                                    <label>Punch In Time</label>
                                    <input
                                        type="time"
                                        className="form-control"
                                        required
                                        value={formData.login_time}
                                        onChange={e => setFormData({ ...formData, login_time: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Punch Out Time</label>
                                    <input
                                        type="time"
                                        className="form-control"
                                        value={formData.logout_time}
                                        onChange={e => setFormData({ ...formData, logout_time: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => { setShowManualModal(false); setShowEditModal(false); }} style={{ flex: 1 }}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={formLoading} style={{ flex: 2 }}>
                                    {formLoading ? 'Saving...' : 'Save Log'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* General QR Modal */}
            {showQrModal && (
                <div className="modal-backdrop" onClick={() => setShowQrModal(false)}>
                    <div className="modal card" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ margin: 0 }}>{qrType === 'PUNCH_IN' ? 'Punch In QR Code' : 'Punch Out QR Code'}</h3>
                            <button className="btn btn-ghost" onClick={() => setShowQrModal(false)} style={{ padding: '4px 8px' }}>✕</button>
                        </div>

                        <p className="text-muted mb-24 text-sm">
                            {qrType === 'PUNCH_IN'
                                ? 'Trainees scan this QR using their dashboard to mark their ARRIVAL.'
                                : 'Trainees scan this QR using their dashboard to mark their DEPARTURE.'
                            }
                        </p>

                        <div style={{
                            background: '#fff',
                            padding: '24px',
                            borderRadius: '16px',
                            display: 'inline-block',
                            margin: '0 auto 24px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                        }}>
                            <img src={qrUrl} alt="General Attendance QR Code" width={250} height={250} style={{ display: 'block' }} />
                        </div>

                        <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', color: 'var(--primary)', fontWeight: 500, fontSize: '14px' }}>
                            QR Code expires in 24 hours
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
