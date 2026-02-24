'use client';

import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api';

interface TimeLog {
    id: string;
    date: string;
    login_time: string;
    logout_time: string | null;
    total_minutes: number | null;
    user: {
        name: string;
        email: string;
        student_id: string | null;
    };
}

export default function TimeTrackingPage() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [logs, setLogs] = useState<TimeLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ avgHours: '0h', activeToday: 0, onTime: 0, late: 0 });
    const [showQrModal, setShowQrModal] = useState(false);
    const [qrUrl, setQrUrl] = useState('');

    useEffect(() => {
        loadData();
    }, [selectedDate]);

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

    const generateQrCode = () => {
        // Expiration 24 hours from now
        const expDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const payload = {
            type: "GENERAL_LOGIN",
            exp: expDate
        };
        const token = btoa(JSON.stringify(payload));
        setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${token}`);
        setShowQrModal(true);
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
                    <p className="page-subtitle">Monitor student and trainer login hours</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="form-control"
                        style={{ width: 'auto' }}
                    />
                    <button className="btn btn-primary" onClick={generateQrCode} style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }}>
                        📸 Show General QR
                    </button>
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
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* General QR Modal */}
            {showQrModal && (
                <div className="modal-backdrop" onClick={() => setShowQrModal(false)}>
                    <div className="modal card" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ margin: 0 }}>General Attendance QR</h3>
                            <button className="btn btn-ghost" onClick={() => setShowQrModal(false)} style={{ padding: '4px 8px' }}>✕</button>
                        </div>

                        <p className="text-muted mb-24 text-sm">
                            Trainees can scan this QR code using the Trainee application to log their arrival and departure times for today.
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
