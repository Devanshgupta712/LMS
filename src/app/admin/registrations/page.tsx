'use client';

import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '@/lib/api';

interface Registration {
    id: string; student_name: string; student_email: string; student_sid: string | null;
    course_name: string; batch_name: string | null; fee_amount: number; fee_paid: number;
    status: string; created_at: string;
}

export default function RegistrationsPage() {
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try { setRegistrations(await apiGet('/api/admin/registrations')); } catch { } finally { setLoading(false); }
    };

    const totalFee = registrations.reduce((a, r) => a + r.fee_amount, 0);
    const totalPaid = registrations.reduce((a, r) => a + r.fee_paid, 0);

    return (
        <div className="animate-in">
            <div className="page-header">
                <div><h1 className="page-title">Registrations</h1><p className="page-subtitle">Track student registrations and fee payments</p></div>
            </div>

            <div className="grid-4 mb-24">
                <div className="stat-card primary"><div className="stat-icon primary">📝</div><div className="stat-info"><h3>Total Registrations</h3><div className="stat-value">{registrations.length}</div></div></div>
                <div className="stat-card success"><div className="stat-icon success">💰</div><div className="stat-info"><h3>Total Revenue</h3><div className="stat-value">₹{totalFee.toLocaleString()}</div></div></div>
                <div className="stat-card accent"><div className="stat-icon accent">✅</div><div className="stat-info"><h3>Collected</h3><div className="stat-value">₹{totalPaid.toLocaleString()}</div></div></div>
                <div className="stat-card danger"><div className="stat-icon danger">⚠️</div><div className="stat-info"><h3>Pending</h3><div className="stat-value">₹{(totalFee - totalPaid).toLocaleString()}</div></div></div>
            </div>

            <div className="card">
                {loading ? <p>Loading...</p> : registrations.length === 0 ? (
                    <div className="empty-state"><div className="empty-icon">📝</div><h3>No registrations yet</h3><p>Registrations will appear here when students enroll in courses.</p></div>
                ) : (
                    <div className="table-responsive"><table className="table">
                        <thead><tr><th>Student</th><th>Course</th><th>Batch</th><th>Fee</th><th>Paid</th><th>Balance</th><th>Status</th><th>Date</th></tr></thead>
                        <tbody>{registrations.map(r => (
                            <tr key={r.id}>
                                <td><strong>{r.student_name}</strong><br /><span className="text-sm text-muted">{r.student_sid || r.student_email}</span></td>
                                <td>{r.course_name}</td>
                                <td>{r.batch_name || '-'}</td>
                                <td>₹{r.fee_amount.toLocaleString()}</td>
                                <td style={{ color: '#4ade80' }}>₹{r.fee_paid.toLocaleString()}</td>
                                <td style={{ color: r.fee_amount - r.fee_paid > 0 ? '#f87171' : '#4ade80' }}>₹{(r.fee_amount - r.fee_paid).toLocaleString()}</td>
                                <td><span className={`badge ${r.status === 'CONFIRMED' ? 'badge-success' : r.status === 'PENDING' ? 'badge-warning' : 'badge-danger'}`}>{r.status}</span></td>
                                <td className="text-sm text-muted">{new Date(r.created_at).toLocaleDateString()}</td>
                            </tr>
                        ))}</tbody>
                    </table></div>
                )}
            </div>
        </div>
    );
}
