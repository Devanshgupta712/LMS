'use client';

import { useState, useEffect, useRef } from 'react';
import { apiGet, apiPost, getStoredUser } from '@/lib/api';

interface TimeLog {
    id: string;
    date: string;
    login_time: string;
    logout_time: string | null;
    total_minutes: number | null;
}

export default function StudentTimeTrackingPage() {
    const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
    const [stats, setStats] = useState({ avgHours: '0h', activeToday: 0, totalDays: 0 });
    const [loading, setLoading] = useState(true);
    const [showScanner, setShowScanner] = useState(false);
    const [scanMsg, setScanMsg] = useState('');
    const qrCodeRef = useRef<any>(null);
    const user = getStoredUser();

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await apiGet('/api/training/time-tracking');
            setTimeLogs(data.logs || []);
            setStats(data.stats || { avgHours: '0h', activeToday: 0, totalDays: data.logs?.length || 0 });
        } catch (err) {
            console.error('Failed to load time tracking data:', err);
        } finally {
            setLoading(false);
        }
    };

    const startScanner = async () => {
        const { Html5Qrcode } = await import('html5-qrcode');
        setShowScanner(true);
        setScanMsg('');

        setTimeout(async () => {
            try {
                const html5QrCode = new Html5Qrcode("reader");
                qrCodeRef.current = html5QrCode;

                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                };

                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    onScanSuccess,
                    undefined
                );
            } catch (err: any) {
                console.error("Scanner startup error:", err);
                setScanMsg(`Camera Error: ${err?.message || 'Access denied'}`);
            }
        }, 300);
    };

    const stopScanner = async () => {
        if (qrCodeRef.current && qrCodeRef.current.isScanning) {
            try {
                await qrCodeRef.current.stop();
            } catch (err) {
                console.error("Failed to stop scanner:", err);
            }
        }
        qrCodeRef.current = null;
        setShowScanner(false);
    };

    const onScanSuccess = async (decodedText: string) => {
        if (qrCodeRef.current) {
            await stopScanner();
        }

        try {
            setScanMsg('Processing pulse...');
            const res = await apiPost('/api/auth/attendance/scan', { qr_token: decodedText });
            const data = await res.json();

            if (res.ok) {
                alert(data.message || 'Time recorded successfully!');
                loadData();
            } else {
                alert(`Error: ${data.detail || 'Invalid QR'}`);
            }
        } catch (err) {
            alert('Server connection failed.');
        }
    };

    const isActive = timeLogs.length > 0 && !timeLogs[0].logout_time &&
        new Date(timeLogs[0].date).toDateString() === new Date().toDateString();

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Work Hours Tracking</h1>
                    <p className="page-subtitle">Scan QR to log your entry and exit times</p>
                </div>
                <button className="btn btn-primary" onClick={startScanner} style={{ background: 'linear-gradient(135deg, #0ea5e9, #2563eb)' }}>
                    ⏱️ Scan for Work Hours
                </button>
            </div>

            <div className="grid-3 mb-24">
                <div className="stat-card primary">
                    <div className="stat-icon primary">🕒</div>
                    <div className="stat-info">
                        <h3>Avg. Daily Hours</h3>
                        <div className="stat-value">{stats.avgHours}</div>
                    </div>
                </div>
                <div className="stat-card success">
                    <div className="stat-icon success">📅</div>
                    <div className="stat-info">
                        <h3>Days Tracked</h3>
                        <div className="stat-value">{timeLogs.length}</div>
                    </div>
                </div>
                <div className="stat-card accent">
                    <div className="stat-icon accent">⚡</div>
                    <div className="stat-info">
                        <h3>Current Status</h3>
                        <div className="stat-value" style={{ color: isActive ? 'var(--success)' : 'var(--text-muted)', fontSize: '1.2rem' }}>
                            {isActive ? '● Currently Active' : '○ Not Logged In'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <h3 className="font-semibold mb-16">Time Logs History</h3>
                {loading ? <p>Fetching logs...</p> : timeLogs.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">⏱️</div>
                        <h3>No time logs found</h3>
                        <p>Your work hours will appear here once you start scanning.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Login Time</th>
                                    <th>Logout Time</th>
                                    <th>Total Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                {timeLogs.map(log => (
                                    <tr key={log.id}>
                                        <td>{new Date(log.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</td>
                                        <td className="text-success font-medium">{new Date(log.login_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                        <td className="text-danger font-medium">{log.logout_time ? new Date(log.logout_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                                        <td style={{ fontWeight: 600 }}>
                                            {log.total_minutes ? `${Math.floor(log.total_minutes / 60)}h ${log.total_minutes % 60}m` : (log.logout_time ? '0m' : 'In Progress...')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showScanner && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001, padding: '16px' }}
                    onClick={stopScanner}>
                    <div style={{ background: '#0f172a', borderRadius: '24px', padding: '24px', maxWidth: '420px', width: '100%', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}
                        onClick={e => e.stopPropagation()}>
                        <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏱️</div>
                        <h2 style={{ fontSize: '20px', margin: '0 0 8px', color: '#fff', fontWeight: 700 }}>Work Hours Scanner</h2>
                        <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 24px' }}>Scan the general attendance QR code to log your time</p>

                        <div id="reader" style={{ overflow: 'hidden', borderRadius: '16px', border: '2px solid #0ea5e9', background: '#000', minHeight: '300px' }}></div>

                        {scanMsg && (
                            <div style={{ marginTop: '20px', color: '#38bdf8', fontWeight: 600 }}>{scanMsg}</div>
                        )}

                        <button className="btn btn-danger" style={{ width: '100%', marginTop: '24px', borderRadius: '12px' }} onClick={stopScanner}>✕ Close Scanner</button>
                    </div>
                </div>
            )}
        </div>
    );
}
