'use client';

import { useState, useEffect, useRef } from 'react';
import { apiGet, apiPost, getStoredUser } from '@/lib/api';

interface UserProfile {
    id: string; name: string; email: string; phone: string | null;
    role: string; student_id: string | null; avatar: string | null;
    dob: string | null; education_status: string | null;
    highest_education: string | null; degree: string | null;
    passing_year: string | null;
    is_active: boolean; created_at: string;
}

interface DocItem {
    id: string; type: string; file_name: string;
    file_url: string; verified: boolean; created_at: string;
}

const docTypes = [
    { value: 'AADHAAR', label: 'Aadhaar Card', icon: '🪪' },
    { value: 'PAN', label: 'PAN Card', icon: '💳' },
    { value: 'RESUME', label: 'Resume / CV', icon: '📄' },
    { value: 'MARKSHEET', label: 'Marksheet', icon: '📜' },
    { value: 'CERTIFICATE', label: 'Certificate', icon: '🏅' },
    { value: 'PHOTO', label: 'Passport Photo', icon: '📷' },
    { value: 'OTHER', label: 'Other Document', icon: '📎' },
];

export default function StudentProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [documents, setDocuments] = useState<DocItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '', phone: '', dob: '', education_status: 'Studying',
        highest_education: '', degree: '', passing_year: ''
    });
    const [uploading, setUploading] = useState(false);
    const [uploadType, setUploadType] = useState('RESUME');
    const [showUpload, setShowUpload] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const user = getStoredUser();

    // Password change state
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
    const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [changingPassword, setChangingPassword] = useState(false);

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        try {
            const [p, d] = await Promise.all([
                apiGet('/api/auth/me'),
                apiGet('/api/auth/documents'),
            ]);
            setProfile(p);
            setDocuments(d);
            setEditForm({
                name: p.name, phone: p.phone || '',
                dob: p.dob || '', education_status: p.education_status || 'Studying',
                highest_education: p.highest_education || '', degree: p.degree || '',
                passing_year: p.passing_year || ''
            });
        } catch { } finally { setLoading(false); }
    };

    const handleSaveProfile = async () => {
        await fetch('/api/auth/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify(editForm),
        });
        setEditing(false);
        loadAll();
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const reader = new FileReader();
            reader.onload = async () => {
                const base64 = (reader.result as string).split(',')[1];
                await apiPost('/api/auth/documents', {
                    type: uploadType,
                    file_name: file.name,
                    file_data: base64,
                });
                setShowUpload(false);
                loadAll();
            };
            reader.readAsDataURL(file);
        } catch { } finally {
            setTimeout(() => setUploading(false), 1000);
        }
    };

    const handleDelete = async (docId: string) => {
        if (!confirm('Delete this document?')) return;
        await fetch('/api/auth/documents/' + docId, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        loadAll();
    };

    const roleColor = user?.role === 'STUDENT' ? '#06b6d4' : user?.role === 'TRAINER' ? '#10b981' : '#6366f1';
    const initials = profile ? profile.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??';

    if (loading) return <div className="animate-in"><p>Loading profile...</p></div>;

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Profile</h1>
                    <p className="page-subtitle">View your details and manage documents</p>
                </div>
            </div>

            {/* Profile Card */}
            <div className="card mb-24" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
                {/* Accent bar */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: `linear-gradient(90deg, ${roleColor}, ${roleColor}80)` }} />

                <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {/* Avatar */}
                    <div style={{
                        width: '100px', height: '100px', borderRadius: '50%',
                        background: `linear-gradient(135deg, ${roleColor}, ${roleColor}80)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '36px', fontWeight: 700, color: '#fff', flexShrink: 0,
                        boxShadow: `0 0 0 4px ${roleColor}30`,
                    }}>
                        {initials}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: '280px' }}>
                        {editing ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label">Full Name</label>
                                    <input className="form-input" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone Number</label>
                                    <input className="form-input" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} placeholder="Enter phone number" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date of Birth</label>
                                    <input className="form-input" type="date" value={editForm.dob} onChange={e => setEditForm({ ...editForm, dob: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Education Status</label>
                                    <select className="form-input" value={editForm.education_status} onChange={e => setEditForm({ ...editForm, education_status: e.target.value })}>
                                        <option value="Studying">Currently Studying</option>
                                        <option value="Passout">Passout</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Highest Education</label>
                                    <select className="form-input" value={editForm.highest_education} onChange={e => setEditForm({ ...editForm, highest_education: e.target.value })}>
                                        <option value="">Select...</option>
                                        <option value="10th">10th</option>
                                        <option value="12th">12th</option>
                                        <option value="Diploma">Diploma</option>
                                        <option value="Undergraduate">Undergraduate (B.Tech, B.Sc, BCA, etc.)</option>
                                        <option value="Postgraduate">Postgraduate (M.Tech, MCA, MBA, etc.)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Degree / Stream Details</label>
                                    <input className="form-input" value={editForm.degree} onChange={e => setEditForm({ ...editForm, degree: e.target.value })} placeholder="e.g. B.Tech in CSE" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Year of Passout</label>
                                    <input className="form-input" type="number" value={editForm.passing_year} onChange={e => setEditForm({ ...editForm, passing_year: e.target.value })} placeholder="e.g. 2024" />
                                </div>
                                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', marginTop: '8px' }}>
                                    <button className="btn btn-primary btn-sm" onClick={handleSaveProfile}>Save Changes</button>
                                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>{profile?.name}</h2>
                                    <span className="badge" style={{ background: `${roleColor}20`, color: roleColor, fontWeight: 600 }}>
                                        {profile?.role}
                                    </span>
                                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)} style={{ marginLeft: 'auto' }}>✏️ Edit</button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginTop: '16px' }}>
                                    <InfoItem icon="✉️" label="Email" value={profile?.email || ''} />
                                    <InfoItem icon="📱" label="Phone" value={profile?.phone || 'Not provided'} />
                                    <InfoItem icon="🆔" label="Student ID" value={profile?.student_id || 'N/A'} />
                                    <InfoItem icon="📅" label="Joined" value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : ''} />
                                    <InfoItem icon="🎂" label="Date of Birth" value={profile?.dob ? new Date(profile.dob).toLocaleDateString() : 'Not provided'} />
                                    <InfoItem icon="🎓" label="Education Status" value={profile?.education_status === 'Passout' ? 'Passout' : 'Currently Studying'} />
                                    <InfoItem icon="🏫" label="Highest Education" value={profile?.highest_education || 'Not provided'} />
                                    <InfoItem icon="📜" label="Degree / Details" value={profile?.degree || 'Not provided'} />
                                    <InfoItem icon="🎯" label="Passing Year" value={profile?.passing_year || 'Not provided'} />
                                    <InfoItem icon="🟢" label="Status" value={profile?.is_active ? 'Active' : 'Inactive'} />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Change Password Section */}
            <div className="card mb-24" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '20px' }}>🔒</span>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Change Password</h3>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setShowPasswordChange(!showPasswordChange); setPasswordMsg(null); }}>
                        {showPasswordChange ? '✕ Close' : '✏️ Change'}
                    </button>
                </div>

                {showPasswordChange && (
                    <div style={{ marginTop: '20px', maxWidth: '400px' }}>
                        {passwordMsg && (
                            <div style={{
                                padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px',
                                background: passwordMsg.type === 'success' ? '#10b98118' : '#ef444418',
                                color: passwordMsg.type === 'success' ? '#10b981' : '#ef4444',
                                border: `1px solid ${passwordMsg.type === 'success' ? '#10b98140' : '#ef444440'}`
                            }}>
                                {passwordMsg.text}
                            </div>
                        )}
                        <div className="form-group" style={{ marginBottom: '12px' }}>
                            <label className="form-label">Current Password</label>
                            <input
                                className="form-input"
                                type="password"
                                value={passwordForm.current_password}
                                onChange={e => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                                placeholder="Enter current password"
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: '12px' }}>
                            <label className="form-label">New Password</label>
                            <input
                                className="form-input"
                                type="password"
                                value={passwordForm.new_password}
                                onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                                placeholder="Enter new password (min 6 chars)"
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label className="form-label">Confirm New Password</label>
                            <input
                                className="form-input"
                                type="password"
                                value={passwordForm.confirm_password}
                                onChange={e => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                                placeholder="Re-enter new password"
                            />
                        </div>
                        <button
                            className="btn btn-primary"
                            disabled={changingPassword}
                            onClick={async () => {
                                setPasswordMsg(null);
                                if (passwordForm.new_password !== passwordForm.confirm_password) {
                                    setPasswordMsg({ type: 'error', text: 'New passwords do not match' });
                                    return;
                                }
                                if (passwordForm.new_password.length < 6) {
                                    setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters' });
                                    return;
                                }
                                try {
                                    setChangingPassword(true);
                                    const res = await apiPost('/api/auth/change-password', {
                                        current_password: passwordForm.current_password,
                                        new_password: passwordForm.new_password,
                                    });
                                    if (!res.ok) {
                                        const err = await res.json().catch(() => ({}));
                                        throw new Error(err.detail || 'Failed to change password');
                                    }
                                    setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
                                    setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
                                } catch (err: any) {
                                    setPasswordMsg({ type: 'error', text: err.message || 'Failed to change password' });
                                } finally {
                                    setChangingPassword(false);
                                }
                            }}
                        >
                            {changingPassword ? 'Changing...' : '🔐 Update Password'}
                        </button>
                    </div>
                )}
            </div>

            {/* Documents Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>📁 My Documents</h2>
                <button className="btn btn-primary" onClick={() => setShowUpload(true)}>+ Upload Document</button>
            </div>

            {documents.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-icon">📂</div>
                        <h3>No Documents Uploaded</h3>
                        <p className="text-sm text-muted">Upload your documents like Aadhaar, PAN, Resume, Marksheets etc.</p>
                        <button className="btn btn-primary" onClick={() => setShowUpload(true)} style={{ marginTop: '12px' }}>Upload Your First Document</button>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {documents.map(doc => {
                        const docType = docTypes.find(d => d.value === doc.type) || { icon: '📎', label: doc.type };
                        return (
                            <div key={doc.id} className="card" style={{ padding: '20px', position: 'relative' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '12px',
                                        background: doc.verified ? '#10b98118' : '#f59e0b18',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '22px', flexShrink: 0,
                                    }}>
                                        {docType.icon}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <h4 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>{docType.label}</h4>
                                            {doc.verified ? (
                                                <span className="badge badge-success" style={{ fontSize: '10px' }}>✅ Verified</span>
                                            ) : (
                                                <span className="badge" style={{ background: '#f59e0b18', color: '#f59e0b', fontSize: '10px' }}>⏳ Pending</span>
                                            )}
                                        </div>
                                        <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {doc.file_name}
                                        </p>
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px', fontSize: '12px' }}>
                                            <span style={{ color: '#64748b' }}>📅 {new Date(doc.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(doc.id)} title="Delete"
                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px', padding: '4px' }}>
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Upload Modal */}
            {showUpload && (
                <div className="modal-overlay" onClick={() => setShowUpload(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
                        <h2 className="modal-title">Upload Document</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="form-group">
                                <label className="form-label">Document Type</label>
                                <select className="form-input" value={uploadType} onChange={e => setUploadType(e.target.value)}>
                                    {docTypes.map(dt => (
                                        <option key={dt.value} value={dt.value}>{dt.icon} {dt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Choose File</label>
                                <div style={{
                                    border: '2px dashed rgba(255,255,255,0.15)', borderRadius: '14px',
                                    padding: '40px 20px', textAlign: 'center', cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = roleColor; }}
                                    onDragLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                                    onDrop={e => {
                                        e.preventDefault();
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                                        const files = e.dataTransfer.files;
                                        if (files.length > 0 && fileInputRef.current) {
                                            const dt = new DataTransfer();
                                            dt.items.add(files[0]);
                                            fileInputRef.current.files = dt.files;
                                            fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
                                        }
                                    }}
                                >
                                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>📤</div>
                                    <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
                                        {uploading ? 'Uploading...' : 'Click or drag & drop your file here'}
                                    </p>
                                    <p style={{ color: '#64748b', fontSize: '12px', marginTop: '6px' }}>PDF, JPG, PNG up to 10MB</p>
                                </div>
                                <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleUpload} style={{ display: 'none' }} />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button className="btn btn-ghost" onClick={() => setShowUpload(false)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function InfoItem({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>{icon}</span>
            <div>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>{label}</div>
                <div style={{ fontSize: '14px', color: '#e2e8f0', fontWeight: 500 }}>{value}</div>
            </div>
        </div>
    );
}
