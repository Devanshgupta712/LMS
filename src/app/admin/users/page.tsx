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
    const [manageModal, setManageModal] = useState({ show: false, targetUser: null as UserItem | null, details: null as any });
    const [assignModal, setAssignModal] = useState({ show: false, targetUser: null as UserItem | null, batchId: '', courseId: '' });
    const [batches, setBatches] = useState<{ id: string; name: string }[]>([]);
    const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'TRAINER', phone: '' });

    useEffect(() => {
        const user = getStoredUser();
        if (user) {
            setIsSuperAdmin(user.role === 'SUPER_ADMIN');
            setIsAdmin(user.role === 'ADMIN');
        }
        loadUsers();
        loadBatches();
        loadCourses();
    }, []);

    const loadCourses = async () => {
        try {
            const data = await apiGet('/api/admin/courses');
            setCourses(data);
        } catch (err) {
            console.error("Error loading courses:", err);
        }
    };

    const loadBatches = async () => {
        try {
            const data = await apiGet('/api/admin/batches');
            setBatches(data);
        } catch (err: any) {
            console.error("Error loading batches:", err);
            alert("Warning: Failed to load batches. " + (err.message || ""));
        }
    };

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

    const handleAssignBatch = async (e: React.FormEvent) => {
        e.preventDefault();
        const target = assignModal.targetUser || manageModal.targetUser;
        const batchId = assignModal.batchId;
        if (!target || !batchId) return;
        try {
            await apiPost(`/api/admin/users/${target.id}/assign-batch`, {
                batch_id: batchId
            });
            if (assignModal.show) setAssignModal({ show: false, targetUser: null, batchId: '', courseId: '' });
            if (manageModal.show) handleOpenManage(target); // Refresh details
            alert('Batch assigned successfully!');
            loadUsers();
        } catch (err: any) {
            alert('Error assigning batch: ' + (err.message || 'Unknown error'));
        }
    };

    const handleOpenManage = async (user: UserItem) => {
        setManageModal({ show: true, targetUser: user, details: null });
        setAssignModal({ show: false, targetUser: null, batchId: '', courseId: '' }); // Clear prev state
        try {
            const data = await apiGet(`/api/admin/students/${user.id}/details`);
            setManageModal(prev => ({ ...prev, details: data }));
        } catch (err: any) {
            alert('Error loading user details: ' + (err.message || 'Unknown error'));
        }
    };

    const handleRemoveBatch = async (userId: string, batchId: string) => {
        if (!confirm('Are you sure you want to remove this user from this batch?')) return;
        try {
            await apiDelete(`/api/admin/users/${userId}/batches/${batchId}`);
            if (manageModal.targetUser) handleOpenManage(manageModal.targetUser); // Refresh
            loadUsers();
        } catch (err: any) {
            alert('Error removing batch: ' + (err.message || 'Unknown error'));
        }
    };

    const handleAddRegistration = async (e: React.FormEvent) => {
        e.preventDefault();
        const target = manageModal.targetUser;
        if (!target || !assignModal.courseId) return;
        try {
            await apiPost('/api/admin/registrations', {
                student_id: target.id,
                course_id: assignModal.courseId,
                fee_amount: 0,
                fee_paid: 0
            });
            handleOpenManage(target);
            alert('Course registration added!');
            loadUsers();
        } catch (err: any) {
            alert('Error adding registration: ' + (err.message || 'Unknown error'));
        }
    };

    const handleRemoveRegistration = async (regId: string) => {
        if (!confirm('Are you sure you want to delete this course registration?')) return;
        try {
            await apiDelete(`/api/admin/registrations/${regId}`);
            if (manageModal.targetUser) handleOpenManage(manageModal.targetUser);
            alert('Registration removed!');
        } catch (err: any) {
            alert('Error removing registration: ' + (err.message || 'Unknown error'));
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
                                                Password
                                            </button>
                                            {u.role === 'STUDENT' && (
                                                <>
                                                    <button
                                                        className="btn btn-sm btn-accent"
                                                        onClick={() => handleOpenManage(u)}
                                                    >
                                                        Manage
                                                    </button>
                                                </>
                                            )}
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

            {manageModal.show && manageModal.targetUser && (
                <div className="modal-overlay" onClick={() => setManageModal({ show: false, targetUser: null, details: null })}>
                    <div className="modal" style={{ width: '90%', maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div>
                                <h2 className="modal-title" style={{ marginBottom: '4px' }}>Manage User</h2>
                                <p className="text-sm text-muted"><strong>{manageModal.targetUser.name}</strong> • {manageModal.targetUser.email}</p>
                            </div>
                            <button className="btn btn-ghost btn-sm" onClick={() => setManageModal({ show: false, targetUser: null, details: null })}>✕</button>
                        </div>

                        {!manageModal.details ? <p>Loading details...</p> : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div className="grid-2" style={{ gap: '24px' }}>
                                    {/* COURSES / REGISTRATIONS */}
                                    <div>
                                        <h3 style={{ marginBottom: '12px', fontSize: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: '8px', color: 'var(--text-primary)' }}>Registrations (Courses)</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                                            {manageModal.details.registrations.map((r: any) => (
                                                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                                    <div style={{ fontWeight: 500 }}>{r.course_name}</div>
                                                    <button className="btn btn-sm btn-ghost text-error" onClick={() => handleRemoveRegistration(r.id)} style={{ padding: '4px 8px' }}>Remove</button>
                                                </div>
                                            ))}
                                            {manageModal.details.registrations.length === 0 && <p className="text-muted text-sm">No registrations found</p>}
                                        </div>
                                        <form onSubmit={handleAddRegistration} style={{ display: 'flex', gap: '8px' }}>
                                            <select
                                                className="form-input"
                                                required
                                                value={assignModal.courseId}
                                                onChange={e => setAssignModal({ ...assignModal, courseId: e.target.value })}
                                            >
                                                <option value="">-- Add Course --</option>
                                                {courses.filter(c => !manageModal.details.registrations.some((r: any) => r.course_id === c.id)).map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                            <button type="submit" className="btn btn-primary btn-sm">Add</button>
                                        </form>
                                    </div>

                                    {/* BATCHES */}
                                    <div>
                                        <h3 style={{ marginBottom: '12px', fontSize: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: '8px', color: 'var(--text-primary)' }}>Assigned Batches</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                                            {manageModal.details.batches.map((b: any) => (
                                                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                                    <div>
                                                        <div style={{ fontWeight: 500 }}>{b.name}</div>
                                                        <div className="text-xs text-muted">{b.course_name}</div>
                                                    </div>
                                                    <button className="btn btn-sm btn-ghost text-error" onClick={() => handleRemoveBatch(manageModal.targetUser!.id, b.id)} style={{ padding: '4px 8px' }}>Remove</button>
                                                </div>
                                            ))}
                                            {manageModal.details.batches.length === 0 && <p className="text-muted text-sm">No batches assigned</p>}
                                        </div>
                                        <form onSubmit={handleAssignBatch} style={{ display: 'flex', gap: '8px' }}>
                                            <select
                                                className="form-input"
                                                required
                                                value={assignModal.batchId}
                                                onChange={e => setAssignModal({ ...assignModal, batchId: e.target.value })}
                                            >
                                                <option value="">-- Assign Batch --</option>
                                                {batches.length === 0 ? (
                                                    <option disabled>No batches found</option>
                                                ) : batches.filter(b => !manageModal.details.batches.some((curr: any) => curr.id === b.id)).map(b => (
                                                    <option key={b.id} value={b.id}>{b.name}</option>
                                                ))}
                                            </select>
                                            <button type="submit" className="btn btn-primary btn-sm">Add</button>
                                        </form>
                                    </div>
                                </div>

                                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button className="btn btn-ghost" onClick={() => setManageModal({ show: false, targetUser: null, details: null })}>Close</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}
