'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export default function AdminQrDisplayPage() {
    const [qrSecret, setQrSecret] = useState('');
    const [qrUrl, setQrUrl] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchQrConfig = async () => {
        try {
            setLoading(true);
            const res = await apiFetch('/api/training/qr-config');
            if (!res.ok) throw new Error('Failed to fetch QR config');
            const data = await res.json();
            if (data?.qr_secret) {
                setQrSecret(data.qr_secret);
                setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(data.qr_secret)}`);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQrConfig();
        // Refresh QR config every 30 minutes just in case of rotation
        const interval = setInterval(fetchQrConfig, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0a0a',
            color: '#fff',
            padding: '24px',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            <div style={{
                textAlign: 'center',
                maxWidth: '600px',
                width: '100%',
                animation: 'fadeIn 0.8s ease-out'
            }}>
                <div style={{ marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '12px', background: 'linear-gradient(to right, #60a5fa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Punch Machine
                    </h1>
                    <p style={{ fontSize: '1.25rem', color: '#94a3b8', fontWeight: 500 }}>
                        Scan to Record Attendance & Work Hours
                    </p>
                </div>

                <div style={{
                    background: '#fff',
                    padding: '40px',
                    borderRadius: '40px',
                    boxShadow: '0 25px 50px -12px rgba(96, 165, 250, 0.3)',
                    display: 'inline-block',
                    marginBottom: '40px',
                    position: 'relative'
                }}>
                    {loading ? (
                        <div style={{ width: '400px', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                            <div className="animate-pulse">Loading Pulse...</div>
                        </div>
                    ) : qrUrl ? (
                        <img src={qrUrl} alt="Punch QR" style={{ width: '400px', height: '400px', display: 'block' }} />
                    ) : (
                        <div style={{ color: '#ef4444' }}>{error || 'Failed to generate QR'}</div>
                    )}
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '20px',
                    textAlign: 'left'
                }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>👋</div>
                        <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Punch In</div>
                        <div style={{ color: '#64748b', fontSize: '12px' }}>Scan when you arrive at the institute</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>🚶</div>
                        <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Punch Out</div>
                        <div style={{ color: '#64748b', fontSize: '12px' }}>Scan before you leave for the day</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
                        <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Local Time</div>
                        <div style={{ color: '#64748b', fontSize: '12px' }}>Records follow Indian Standard Time</div>
                    </div>
                </div>

                <style jsx global>{`
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .animate-pulse {
                        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                    }
                    @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: .5; }
                    }
                `}</style>
            </div>

            <div style={{ position: 'fixed', bottom: '24px', color: '#475569', fontSize: '12px' }}>
                LMS Global Punch Station • v2.1.0
            </div>
        </div>
    );
}
