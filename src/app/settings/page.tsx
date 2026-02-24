'use client';

import { useState, useEffect } from 'react';
import { getStoredUser } from '@/lib/api';

export default function SettingsPage() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => { setUser(getStoredUser()); }, []);

    return (
        <div className="animate-in">
            <div className="page-header"><div><h1 className="page-title">Settings</h1><p className="page-subtitle">Manage your account and system preferences</p></div></div>

            <div className="grid-2">
                <div className="card">
                    <h3 className="font-semibold mb-16">Profile</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="form-group"><label>Name</label><input className="form-input" defaultValue={user?.name || ''} /></div>
                        <div className="form-group"><label>Email</label><input className="form-input" defaultValue={user?.email || ''} disabled /></div>
                        <div className="form-group"><label>Role</label><input className="form-input" defaultValue={user?.role?.replace('_', ' ') || ''} disabled /></div>
                        <button className="btn btn-primary">Update Profile</button>
                    </div>
                </div>
                <div className="card">
                    <h3 className="font-semibold mb-16">Security</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="form-group"><label>Current Password</label><input className="form-input" type="password" placeholder="Enter current password" /></div>
                        <div className="form-group"><label>New Password</label><input className="form-input" type="password" placeholder="Enter new password" /></div>
                        <div className="form-group"><label>Confirm Password</label><input className="form-input" type="password" placeholder="Confirm new password" /></div>
                        <button className="btn btn-primary">Change Password</button>
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginTop: '24px' }}>
                <h3 className="font-semibold mb-16">System Preferences</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                        { label: 'Email Notifications', desc: 'Receive email alerts for important updates', on: true },
                        { label: 'Dark Mode', desc: 'Use dark theme (currently active)', on: true },
                        { label: 'Auto-save Drafts', desc: 'Automatically save forms and drafts', on: true },
                    ].map(pref => (
                        <div key={pref.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                            <div><strong style={{ fontSize: '14px' }}>{pref.label}</strong><p className="text-sm text-muted" style={{ margin: '2px 0 0' }}>{pref.desc}</p></div>
                            <div style={{ width: '44px', height: '24px', background: pref.on ? '#4ade80' : '#374151', borderRadius: '12px', cursor: 'pointer', position: 'relative' }}>
                                <div style={{ width: '18px', height: '18px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '3px', left: pref.on ? '22px' : '4px', transition: 'left 0.2s' }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
