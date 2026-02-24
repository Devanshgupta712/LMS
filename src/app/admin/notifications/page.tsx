'use client';

import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '@/lib/api';

export default function AdminNotificationsPage() {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [target, setTarget] = useState('ALL');
    const [userId, setUserId] = useState('');
    const [role, setRole] = useState('STUDENT');
    const [users, setUsers] = useState<any[]>([]);

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        // Fetch users to populate the target dropdown if needed
        apiGet('/api/admin/users').then(setUsers).catch(() => { });
    }, []);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccess('');
        setError('');

        try {
            await apiPost('/api/admin/notifications/send', {
                title,
                message,
                target,
                user_id: target === 'USER' ? userId : null,
                role: target === 'ROLE' ? role : null
            });
            setSuccess('Notification sent successfully!');
            setTitle('');
            setMessage('');
            setTarget('ALL');
            setUserId('');
        } catch (err: any) {
            setError(err.message || 'Failed to send notification');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Send Notifications</h1>
                    <p className="page-subtitle">Broadcast messages to users or send direct alerts</p>
                </div>
            </div>

            <div className="card" style={{ maxWidth: '600px' }}>
                <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {error && <div className="error-message" style={{ color: '#ef4444', padding: '10px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>{error}</div>}
                    {success && <div className="success-message" style={{ color: '#10b981', padding: '10px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px' }}>{success}</div>}

                    <div>
                        <label className="form-label">Notification Title</label>
                        <input
                            type="text"
                            className="form-input"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Schedule Update"
                            required
                        />
                    </div>

                    <div>
                        <label className="form-label">Message Details</label>
                        <textarea
                            className="form-input"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type the full notification message here..."
                            rows={4}
                            required
                        />
                    </div>

                    <div>
                        <label className="form-label">Target Audience</label>
                        <select
                            className="form-input"
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                        >
                            <option value="ALL">All Active Users</option>
                            <option value="ROLE">Specific User Role</option>
                            <option value="USER">Specific Individual</option>
                        </select>
                    </div>

                    {target === 'ROLE' && (
                        <div>
                            <label className="form-label">Select Role</label>
                            <select
                                className="form-input"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                required
                            >
                                <option value="STUDENT">Students</option>
                                <option value="TRAINER">Trainers / Instructors</option>
                                <option value="MARKETING">Marketing Team</option>
                                <option value="PLACEMENT">Placement Team</option>
                                <option value="ADMIN">Admins</option>
                            </select>
                        </div>
                    )}

                    {target === 'USER' && (
                        <div>
                            <label className="form-label">Select User</label>
                            <select
                                className="form-input"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                required
                            >
                                <option value="">-- Choose a user --</option>
                                {users.filter(u => u.is_active).map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.name} ({u.role}) - {u.email}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Sending...' : 'Send Notification'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
