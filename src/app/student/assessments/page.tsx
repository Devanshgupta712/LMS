'use client';

export default function StudentAssessmentsPage() {
    const assessments = [
        { title: 'HTML/CSS Fundamentals', status: 'COMPLETED', score: 85, total: 100, date: '2026-01-20' },
        { title: 'JavaScript Basics', status: 'COMPLETED', score: 72, total: 100, date: '2026-02-05' },
        { title: 'React.js Advanced', status: 'PENDING', score: null, total: 100, date: '2026-02-28' },
    ];

    return (
        <div className="animate-in">
            <div className="page-header"><div><h1 className="page-title">My Assessments</h1><p className="page-subtitle">View and take assigned assessments</p></div></div>

            <div className="grid-4 mb-24">
                <div className="stat-card primary"><div className="stat-icon primary">📝</div><div className="stat-info"><h3>Total</h3><div className="stat-value">{assessments.length}</div></div></div>
                <div className="stat-card success"><div className="stat-icon success">✅</div><div className="stat-info"><h3>Completed</h3><div className="stat-value">{assessments.filter(a => a.status === 'COMPLETED').length}</div></div></div>
                <div className="stat-card accent"><div className="stat-icon accent">📊</div><div className="stat-info"><h3>Avg Score</h3><div className="stat-value">{Math.round(assessments.filter(a => a.score).reduce((a, b) => a + (b.score || 0), 0) / assessments.filter(a => a.score).length)}%</div></div></div>
                <div className="stat-card danger"><div className="stat-icon danger">⏰</div><div className="stat-info"><h3>Pending</h3><div className="stat-value">{assessments.filter(a => a.status === 'PENDING').length}</div></div></div>
            </div>

            <div className="card">
                <div className="table-responsive"><table className="table">
                    <thead><tr><th>Assessment</th><th>Date</th><th>Score</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>{assessments.map((a, i) => (
                        <tr key={i}>
                            <td><strong>{a.title}</strong></td>
                            <td className="text-sm text-muted">{new Date(a.date).toLocaleDateString()}</td>
                            <td>{a.score !== null ? <span style={{ color: a.score >= 70 ? '#4ade80' : '#f87171', fontWeight: 600 }}>{a.score}/{a.total}</span> : '-'}</td>
                            <td><span className={`badge ${a.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>{a.status}</span></td>
                            <td>{a.status === 'PENDING' ? <button className="btn btn-sm btn-primary">Start</button> : <button className="btn btn-sm btn-ghost">View</button>}</td>
                        </tr>
                    ))}</tbody>
                </table></div>
            </div>
        </div>
    );
}
