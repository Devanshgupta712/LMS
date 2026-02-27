'use client';

import { useState, useEffect, useRef } from 'react';
import { apiGet, apiPost, getStoredUser } from '@/lib/api';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface AttendanceRecord {
    id: string;
    date: string;
    status: string;
    remarks: string | null;
}

interface TimeLog {
    id: string;
    date: string;
    login_time: string;
    logout_time: string | null;
    total_minutes: number | null;
}

export default function StudentAttendancePage() {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [showScanner, setShowScanner] = useState(false);
    const [scanMsg, setScanMsg] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
    const user = getStoredUser();

    useEffect(() => {
        if (user) {
            loadAttendance();
        }
    }, []);

    const loadAttendance = async () => {
        try {
            setLoading(true);
            const [attData, timeData] = await Promise.all([
                apiGet(`/api/training/attendance?student_id=${user.id}`),
                apiGet(`/api/training/time-tracking`)
            ]);
            setRecords(attData);
            setTimeLogs(timeData.logs || []);
        } catch (err) {
            console.error('Failed to load attendance:', err);
        } finally {
            setLoading(false);
        }
    };

    const qrCodeRef = useRef<any>(null);

    const startScanner = async () => {
        const { Html5Qrcode } = await import('html5-qrcode');
        setShowScanner(true);
        setScanMsg('');
        setIsScanning(true);

        // Request geolocation for radius check
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => setUserLocation(null),
                { enableHighAccuracy: true, timeout: 5000 }
            );
        }

        // Small delay to ensure the 'reader' div is in the DOM
        setTimeout(async () => {
            try {
                const html5QrCode = new Html5Qrcode("reader");
                qrCodeRef.current = html5QrCode;

                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                };

                // Explicitly request back camera (environment)
                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    onScanSuccess,
                    undefined // Ignore manual errors
                );
            } catch (err: any) {
                console.error("Scanner startup error:", err);
                setScanMsg(`Camera Error: ${err?.message || 'Access denied'}`);
                setIsScanning(false);
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
        setIsScanning(false);
    };

    const [scanResult, setScanResult] = useState<{
        success: boolean;
        message: string;
        session?: any;
        status?: string;
    } | null>(null);

    const onScanSuccess = async (decodedText: string) => {
        // Stop scanning immediately on success
        if (qrCodeRef.current) {
            await stopScanner();
        }

        try {
            setScanMsg('Processing QR code...');
            const scanBody: any = { qr_token: decodedText };
            if (userLocation) {
                scanBody.latitude = userLocation.lat;
                scanBody.longitude = userLocation.lng;
            }
            const res = await apiPost('/api/auth/attendance/scan', scanBody);
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
                loadAttendance();
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

    const onScanFailure = () => {
        // Handle scan failure if needed
    };

    const downloadCSV = () => {
        if (records.length === 0) return;
        const rows = [['Date', 'Status', 'Remarks']];
        records.forEach(r => {
            rows.push([r.date.split('T')[0], r.status, r.remarks || '']);
        });
        const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `my_attendance_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const presentDays = records.filter(r => r.status === 'PRESENT').length;
    const statsPercentage = records.length > 0 ? Math.round((presentDays / records.length) * 100) : 0;

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Attendance</h1>
                    <p className="page-subtitle">Track your attendance record and scan QR codes</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-ghost" onClick={downloadCSV} disabled={records.length === 0}>
                        📥 Download CSV
                    </button>
                    <button className="btn btn-primary" onClick={startScanner} style={{ background: 'linear-gradient(135deg, #2563eb, #2563eb)' }}>
                        📱 Scan QR Code
                    </button>
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
                    Scan the institute's official QR code to record your arrival and departure.
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

            <div className="grid-4 mb-24">
                <div className="stat-card primary"><div className="stat-icon primary">✅</div><div className="stat-info"><h3>Present</h3><div className="stat-value">{presentDays}</div></div></div>
                <div className="stat-card danger"><div className="stat-icon danger">❌</div><div className="stat-info"><h3>Absent</h3><div className="stat-value">{records.filter(r => r.status === 'ABSENT').length}</div></div></div>
                <div className="stat-card success"><div className="stat-icon success">📊</div><div className="stat-info"><h3>Percentage</h3><div className="stat-value">{statsPercentage}%</div></div></div>
                <div className="stat-card accent"><div className="stat-icon accent">📅</div><div className="stat-info"><h3>Total Sessions</h3><div className="stat-value">{records.length}</div></div></div>
            </div>

            <div className="card">
                <h3 className="font-semibold mb-16">Attendance History</h3>
                {loading ? <p>Loading attendance...</p> : records.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📅</div>
                        <h3>No attendance records</h3>
                        <p>Your marked attendance will appear here.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map(r => (
                                    <tr key={r.id}>
                                        <td>{new Date(r.date).toLocaleDateString('en-IN', { dateStyle: 'long' })}</td>
                                        <td>
                                            <span className={`badge ${r.status === 'PRESENT' ? 'badge-success' : r.status === 'ABSENT' ? 'badge-danger' : 'badge-warning'}`}>
                                                {r.status}
                                            </span>
                                        </td>
                                        <td className="text-muted">{r.remarks || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* QR Scanner Modal — Mobile-Optimized */}
            {showScanner && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.98)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001, padding: '16px' }}
                    onClick={stopScanner}>
                    <div style={{ background: '#09090b', borderRadius: '24px', padding: '24px', maxWidth: '420px', width: '100%', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', maxHeight: '95vh', overflowY: 'auto', boxShadow: '0 0 50px rgba(0,0,0,0.5)' }}
                        onClick={e => e.stopPropagation()}>
                        <div style={{ fontSize: '32px', marginBottom: '16px' }}>📱</div>
                        <h2 style={{ fontSize: '22px', margin: '0 0 8px', color: '#fff', fontWeight: 700 }}>Scan Attendance</h2>
                        <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 24px' }}>Center the QR code in the box below</p>

                        <div id="reader" style={{ overflow: 'hidden', borderRadius: '16px', border: '2px solid var(--primary)', background: '#000', minHeight: '300px' }}></div>

                        {scanMsg && (
                            <div style={{
                                marginTop: '20px', padding: '14px', borderRadius: '14px', fontSize: '14px', fontWeight: 600,
                                background: scanMsg.includes('Error') ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                                color: scanMsg.includes('Error') ? '#f87171' : '#4ade80',
                                border: `1px solid ${scanMsg.includes('Error') ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`
                            }}>
                                {scanMsg}
                            </div>
                        )}

                        <button className="btn btn-danger" style={{ width: '100%', marginTop: '24px', minHeight: '52px', fontSize: '15px', borderRadius: '14px' }} onClick={stopScanner}>✕ Cancel Scanning</button>
                    </div>
                </div>
            )}

            {scanResult && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10002, padding: '16px', backdropFilter: 'blur(12px)' }}
                    onClick={() => setScanResult(null)}>
                    <div className="animate-in" style={{ background: '#09090b', borderRadius: '32px', padding: '48px 32px', maxWidth: '400px', width: '100%', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
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

                        <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>
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
                            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '20px', padding: '24px', marginBottom: '32px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <span style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>{new Date(scanResult.session.login_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                                </div>
                                {scanResult.session.logout_time && (
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                            <span style={{ color: '#64748b', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Departure</span>
                                            <span style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>{new Date(scanResult.session.logout_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                                        </div>
                                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '16px 0' }} />
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>Duration Logged</span>
                                            <span style={{ color: '#0ea5e9', fontSize: '16px', fontWeight: 900 }}>
                                                {scanResult.session.duration || (scanResult.session.total_minutes ? `${Math.floor(scanResult.session.total_minutes / 60)}h ${scanResult.session.total_minutes % 60}m` : '0m')}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        <button className="btn btn-primary" style={{ width: '100%', borderRadius: '14px', padding: '16px', fontWeight: 700, fontSize: '15px' }} onClick={() => setScanResult(null)}>
                            Continue
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

