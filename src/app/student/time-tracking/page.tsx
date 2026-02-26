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

    const [scanResult, setScanResult] = useState<{
        success: boolean;
        message: string;
        session?: any;
        status?: string;
    } | null>(null);

    const onScanSuccess = async (decodedText: string) => {
        if (qrCodeRef.current) {
            await stopScanner();
        }

        try {
            setScanMsg('Processing pulse...');
            const res = await apiPost('/api/auth/attendance/scan', { qr_token: decodedText });
            let data;
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await res.json();
            } else {
                const text = await res.text();
                throw new Error(text || `Server error: ${res.status}`);
            }

            if (res.ok || (data && data.status === 'DONE')) {
                setScanResult({
                    success: true,
                    message: data.message,
                    session: data.session_info,
                    status: data.status
                });
                loadData();
            } else {
                setScanResult({
                    success: false,
                    message: data.detail || 'Invalid QR Code'
                });
            }
        } catch (err: any) {
            console.error('Scan error:', err);
            setScanResult({
                success: false,
                message: `Connection Error: ${err.message || 'Unknown error'}. Please check your internet or contact admin.`
            });
        }
    };

    const isActive = timeLogs.length > 0 && !timeLogs[0].logout_time &&
        new Date(timeLogs[0].date).toDateString() === new Date().toDateString();

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Work Hours</h1>
                    <p className="page-subtitle">Track your daily punch-in and punch-out activities</p>
                </div>
            </div>

            <div className="card-glass mb-24" style={{
                border: '2px solid var(--border)',
                padding: '32px',
                textAlign: 'center',
                background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.6))',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🕒</div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>Punch Machine</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '400px', marginInline: 'auto' }}>
                    Scan the institute's official QR code to record your arrival. Scan the same code again when leaving to record your departure.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                        className="btn btn-primary"
                        onClick={startScanner}
                        style={{
                            padding: '16px 32px',
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
                            boxShadow: '0 4px 20px rgba(37, 99, 235, 0.4)',
                            borderRadius: '16px'
                        }}
                    >
                        ⚡ Punch In / Out
                    </button>
                </div>
            </div>

            <div className="grid-3 mb-24">
                <div className="stat-card primary">
                    <div className="stat-icon primary">⏳</div>
                    <div className="stat-info">
                        <h3>Avg. Work Hours</h3>
                        <div className="stat-value">{stats.avgHours}</div>
                    </div>
                </div>
                <div className="stat-card success">
                    <div className="stat-icon success">🗓️</div>
                    <div className="stat-info">
                        <h3>Days Logged</h3>
                        <div className="stat-value">{timeLogs.length}</div>
                    </div>
                </div>
                <div className="stat-card accent">
                    <div className="stat-icon accent">✨</div>
                    <div className="stat-info">
                        <h3>Today's Total</h3>
                        <div className="stat-value" style={{ color: isActive ? 'var(--success)' : (timeLogs[0]?.total_minutes ? 'var(--accent)' : 'var(--text-muted)'), fontSize: '1.2rem', fontWeight: 800 }}>
                            {isActive ? (
                                <span className="animate-pulse">Active...</span>
                            ) : (
                                timeLogs.length > 0 && new Date(timeLogs[0].date).toDateString() === new Date().toDateString() && timeLogs[0].total_minutes
                                    ? `${Math.floor(timeLogs[0].total_minutes / 60)}h ${timeLogs[0].total_minutes % 60}m`
                                    : '0h 0m'
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 className="font-semibold">Punch History</h3>
                    <div className="badge badge-outline">Latest first</div>
                </div>

                {loading ? <p>Loading punch data...</p> : timeLogs.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📂</div>
                        <h3>No punch records</h3>
                        <p>Use the Punch Machine above to record your work hours.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Punch In</th>
                                    <th>Punch Out</th>
                                    <th>Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                {timeLogs.map(log => (
                                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td>{new Date(log.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                                        <td className="text-success" style={{ fontWeight: 600 }}>{new Date(log.login_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</td>
                                        <td className="text-danger" style={{ fontWeight: 600 }}>{log.logout_time ? new Date(log.logout_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}</td>
                                        <td style={{ fontWeight: 700, color: 'var(--accent)' }}>
                                            {log.total_minutes ? `${Math.floor(log.total_minutes / 60)}h ${log.total_minutes % 60}m` : (log.logout_time ? '0m' : <span className="animate-pulse">Tracking...</span>)}
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

            {scanResult && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10002, padding: '16px', backdropFilter: 'blur(10px)' }}
                    onClick={() => setScanResult(null)}>
                    <div className="animate-in" style={{ background: '#0f172a', borderRadius: '32px', padding: '40px 32px', maxWidth: '400px', width: '100%', border: '1px solid rgba(255,255,255,0.12)', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
                        onClick={e => e.stopPropagation()}>

                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: scanResult.success ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: scanResult.success ? '#22c55e' : '#ef4444',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '40px', margin: '0 auto 24px',
                            border: `2px solid ${scanResult.success ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                        }}>
                            {scanResult.success ? '✓' : '✕'}
                        </div>

                        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>
                            {scanResult.success ? (
                                scanResult.status === 'DONE' ? 'Day Completed!' :
                                    (scanResult.session?.punch_type === 'IN' ? 'Punched In!' : 'Punched Out!')
                            ) : 'Scan Failed'}
                        </h2>

                        {scanResult.success && scanResult.session && (
                            <div style={{ marginBottom: '24px', padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{scanResult.session.user_name}</div>
                                <div style={{ fontSize: '13px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{scanResult.session.role} • {scanResult.session.student_id}</div>
                            </div>
                        )}

                        <p style={{ color: '#94a3b8', fontSize: '15px', marginBottom: '32px', lineHeight: 1.6 }}>
                            {scanResult.message}
                        </p>

                        {scanResult.success && scanResult.session && (
                            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '20px', padding: '20px', marginBottom: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <span style={{ color: '#64748b', fontSize: '13px' }}>Arrival</span>
                                    <span style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 600 }}>{new Date(scanResult.session.login_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                                </div>
                                {scanResult.session.logout_time && (
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                            <span style={{ color: '#64748b', fontSize: '13px' }}>Departure</span>
                                            <span style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 600 }}>{new Date(scanResult.session.logout_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                                        </div>
                                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '12px 0' }} />
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>Total Duration</span>
                                            <span style={{ color: 'var(--accent)', fontSize: '15px', fontWeight: 800 }}>
                                                {scanResult.session.duration || (scanResult.session.total_minutes ? `${Math.floor(scanResult.session.total_minutes / 60)}h ${scanResult.session.total_minutes % 60}m` : '0m')}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        <button className="btn btn-primary" style={{ width: '100%', borderRadius: '14px', padding: '14px' }} onClick={() => setScanResult(null)}>
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
