'use client';

import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete, getStoredUser } from '@/lib/api';

interface UserItem { id: string; name: string; email: string; role: string; phone: string | null; is_active: boolean; created_at: string; }

export default function UsersPage() {
    const [users, setUsers] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [showModal, setShowModal] = useState(false);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [passwordModal, setPasswordModal] = useState({ show: false, targetUser: null as UserItem | null, newPassword: '' });
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'TRAINER', phone: '' });

    useEffect(() => {
        const user = getStoredUser();
        if (user) {
            setIsSuperAdmin(user.role === 'SUPER_ADMIN');
            setIsAdmin(user.role === 'ADMIN');
        }
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try { setUsers(await apiGet('/api/admin/students?all=true')); } catch { } finally { setLoading(false); }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiPost('/api/auth/register', newUser);
            setShowModal(false);
            setNewUser({ name: '', email: '', password: '', role: 'TRAINER', phone: '' });
            alert('User created successfully!');
            loadUsers();
        } catch (err: any) {
            alert('Error creating user: ' + (err.message || 'Unknown error'));
        }
    };

    const roles = ['ALL', 'SUPER_ADMIN', 'ADMIN', 'TRAINER', 'MARKETER', 'STUDENT'];
    const filtered = filter === 'ALL' ? users : users.filter(u => u.role === filter);
    const roleColors: Record<string, string> = { SUPER_ADMIN: 'badge-danger', ADMIN: 'badge-warning', TRAINER: 'badge-accent', MARKETER: 'badge-info', STUDENT: 'badge-success' };

    const handleToggleStatus = async (user: UserItem) => {
        try {
            await apiPatch(`/api/admin/users/${user.id}/status`, {
                is_active: !user.is_active
            });
            loadUsers();
        } catch (err: any) {
            alert('Error updating status: ' + (err.message || 'Unknown error'));
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!passwordModal.targetUser) return;
        try {
            await apiPatch(`/api/admin/users/${passwordModal.targetUser.id}/password`, {
                new_password: passwordModal.newPassword
            });
            setPasswordModal({ show: false, targetUser: null, newPassword: '' });
            alert('Password updated successfully!');
        } catch (err: any) {
            alert('Error updating password: ' + (err.message || 'Unknown error'));
        }
    };

    const handleDeleteUser = async (user: UserItem) => {
        if (!confirm(`Are you absolutely sure you want to completely delete the user "${user.name}"? This cannot be undone.`)) return;
        try {
            await apiDelete(`/api/admin/users/${user.id}`);
            loadUsers();
        } catch (err: any) {
            alert('Error deleting user: ' + (err.message || 'Unknown error'));
        }
    };

    return (
        <div className="animate-in">
            <div className="page-header">
                <div><h1 className="page-title">User Management</h1><p className="page-subtitle">All system users and their roles</p></div>
                {isSuperAdmin && <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Create User</button>}
            </div>

            <div className="grid-4 mb-24">
                <div className="stat-card primary"><div className="stat-icon primary">👤</div><div className="stat-info"><h3>Total Users</h3><div className="stat-value">{users.length}</div></div></div>
                <div className="stat-card accent"><div className="stat-icon accent">👨‍🏫</div><div className="stat-info"><h3>Trainers</h3><div className="stat-value">{users.filter(u => u.role === 'TRAINER').length}</div></div></div>
                <div className="stat-card success"><div className="stat-icon success">🎓</div><div className="stat-info"><h3>Students</h3><div className="stat-value">{users.filter(u => u.role === 'STUDENT').length}</div></div></div>
                <div className="stat-card danger"><div className="stat-icon danger">🔑</div><div className="stat-info"><h3>Admins</h3><div className="stat-value">{users.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length}</div></div></div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {roles.map(r => (<button key={r} className={`btn ${filter === r ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(r)}>{r.replace('_', ' ')} ({r === 'ALL' ? users.length : users.filter(u => u.role === r).length})</button>))}
            </div>

            <div className="card">
                {loading ? <p>Loading...</p> : (
                    <div className="table-responsive"><table className="table">
                        <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Joined</th>{(isSuperAdmin || isAdmin) && <th>Actions</th>}</tr></thead>
                        <tbody>{filtered.map(u => (
                            <tr key={u.id}>
                                <td><strong>{u.name}</strong></td>
                                <td>{u.email}</td><td>{u.phone || '-'}</td>
                                <td><span className={`badge ${roleColors[u.role] || 'badge-info'}`}>{u.role.replace('_', ' ')}</span></td>
                                <td><span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>{u.is_active ? 'Active' : 'Suspended'}</span></td>
                                <td className="text-sm text-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                                {(isSuperAdmin || isAdmin) && (
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                className="btn btn-sm btn-info"
                                                onClick={() => setPasswordModal({ show: true, targetUser: u, newPassword: '' })}
                                                disabled={(isAdmin && (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN')) || (isSuperAdmin && u.role === 'SUPER_ADMIN')}
                                                style={{ opacity: ((isAdmin && (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN')) || (isSuperAdmin && u.role === 'SUPER_ADMIN')) ? 0.3 : 1 }}
                                            >
                                                Change Password
                                            </button>
                                            <button
                                                className={`btn btn-sm ${u.is_active ? 'btn-warning' : 'btn-success'}`}
                                                onClick={() => handleToggleStatus(u)}
                                                disabled={u.role === 'SUPER_ADMIN'}
                                                style={{ opacity: u.role === 'SUPER_ADMIN' ? 0.3 : 1 }}
                                            >
                                                {u.is_active ? 'Suspend' : 'Activate'}
                                            </button>
                                            {isSuperAdmin && (
                                                <button
                                                    className="btn btn-sm btn-error"
                                                    onClick={() => handleDeleteUser(u)}
                                                    disabled={u.role === 'SUPER_ADMIN'}
                                                    style={{ opacity: u.role === 'SUPER_ADMIN' ? 0.3 : 1 }}
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}</tbody>
                    </table></div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">Create New User</h2>
                        <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="form-group"><label>Name</label><input className="form-input" required value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} /></div>
                            <div className="form-group"><label>Email</label><input className="form-input" type="email" required value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} /></div>
                            <div className="form-group"><label>Phone</label><input className="form-input" value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })} /></div>
                            <div className="form-group"><label>Password</label><input className="form-input" type="password" required value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} /></div>
                            <div className="form-group"><label>Role</label>
                                <select className="form-input" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                                    <option value="TRAINER">Trainer</option>
                                    <option value="MARKETER">Marketer</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="STUDENT">Student</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {passwordModal.show && passwordModal.targetUser && (
                <div className="modal-overlay" onClick={() => setPasswordModal({ show: false, targetUser: null, newPassword: '' })}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">Change Password for {passwordModal.targetUser.name}</h2>
                        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="form-group">
                                <label>New Password</label>
                                <input
                                    className="form-input"
                                    type="password"
                                    required
                                    value={passwordModal.newPassword}
                                    onChange={e => setPasswordModal({ ...passwordModal, newPassword: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setPasswordModal({ show: false, targetUser: null, newPassword: '' })}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Password</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
