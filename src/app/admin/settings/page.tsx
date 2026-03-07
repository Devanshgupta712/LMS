'use client';

import { useState, useEffect } from 'react';
import { apiGet, apiPut } from '@/lib/api';

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const [geofence, setGeofence] = useState({
        office_latitude: '',
        office_longitude: '',
        office_radius_meters: ''
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const res = await apiGet('/api/admin/settings/geofence');
            setGeofence({
                office_latitude: res.office_latitude?.toString() || '',
                office_longitude: res.office_longitude?.toString() || '',
                office_radius_meters: res.office_radius_meters?.toString() || ''
            });
        } catch (error) {
            console.error('Failed to load settings:', error);
            setMessage({ text: 'Failed to load current settings.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveGeofence = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });

        const lat = parseFloat(geofence.office_latitude);
        const lng = parseFloat(geofence.office_longitude);
        const radius = parseInt(geofence.office_radius_meters, 10);

        if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
            setMessage({ text: 'Please enter valid numbers for latitude, longitude, and radius.', type: 'error' });
            return;
        }

        try {
            setSaving(true);
            const res = await apiPut('/api/admin/settings/geofence', {
                office_latitude: lat,
                office_longitude: lng,
                office_radius_meters: radius
            });
            if (res.status === 'success') {
                setMessage({ text: 'Geofence settings saved successfully!', type: 'success' });
            } else {
                setMessage({ text: 'Failed to save settings.', type: 'error' });
            }
        } catch (error) {
            console.error('Failed to save geofence:', error);
            setMessage({ text: 'An error occurred while saving.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">System Settings</h1>
                    <p className="page-subtitle">Configure global application settings and security rules</p>
                </div>
            </div>

            {message.text && (
                <div style={{
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '24px',
                    background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    color: message.type === 'success' ? '#4ade80' : '#f87171',
                    fontWeight: 600
                }}>
                    {message.type === 'success' ? '✅ ' : '❌ '} {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                <div className="card">
                    <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🌍 Attendance Geofencing
                    </h2>
                    <p className="text-muted text-sm mb-24">
                        Restrict QR code punch-ins to a specific physical radius from your institute's location. Set to 0 to disable.
                    </p>

                    {loading ? (
                        <p>Loading settings...</p>
                    ) : (
                        <form onSubmit={handleSaveGeofence}>
                            <div className="grid-3 mb-24">
                                <div className="form-group mb-0">
                                    <label>Office Latitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        className="form-input"
                                        placeholder="e.g. 28.6139"
                                        value={geofence.office_latitude}
                                        onChange={e => setGeofence({ ...geofence, office_latitude: e.target.value })}
                                        required
                                    />
                                    <small className="text-muted" style={{ display: 'block', marginTop: '6px' }}>Format: decimal degrees (e.g. 28.6139)</small>
                                </div>
                                <div className="form-group mb-0">
                                    <label>Office Longitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        className="form-input"
                                        placeholder="e.g. 77.2090"
                                        value={geofence.office_longitude}
                                        onChange={e => setGeofence({ ...geofence, office_longitude: e.target.value })}
                                        required
                                    />
                                    <small className="text-muted" style={{ display: 'block', marginTop: '6px' }}>Format: decimal degrees (e.g. 77.2090)</small>
                                </div>
                                <div className="form-group mb-0">
                                    <label>Allowed Radius (Meters)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="e.g. 200"
                                        value={geofence.office_radius_meters}
                                        onChange={e => setGeofence({ ...geofence, office_radius_meters: e.target.value })}
                                        required
                                        min="0"
                                    />
                                    <small className="text-muted" style={{ display: 'block', marginTop: '6px' }}>Maximum distance allowed from office to scan QR (e.g. 200)</small>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={saving}
                                style={{
                                    height: '52px',
                                    padding: '0 32px',
                                    fontSize: '15px',
                                    fontWeight: 700
                                }}
                            >
                                {saving ? 'Saving...' : '💾 Save Settings'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
