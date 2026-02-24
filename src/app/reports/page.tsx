'use client';

export default function ReportsPage() {
    return (
        <div className="animate-in">
            <div className="page-header"><div><h1 className="page-title">Violation Reports</h1><p className="page-subtitle">System alerts and violation tracking</p></div></div>

            <div className="grid-4 mb-24">
                <div className="stat-card primary"><div className="stat-icon primary">⚠️</div><div className="stat-info"><h3>Total Reports</h3><div className="stat-value">0</div></div></div>
                <div className="stat-card danger"><div className="stat-icon danger">🔴</div><div className="stat-info"><h3>Critical</h3><div className="stat-value">0</div></div></div>
                <div className="stat-card accent"><div className="stat-icon accent">🔵</div><div className="stat-info"><h3>Under Review</h3><div className="stat-value">0</div></div></div>
                <div className="stat-card success"><div className="stat-icon success">✅</div><div className="stat-info"><h3>Resolved</h3><div className="stat-value">0</div></div></div>
            </div>

            <div className="card">
                <div className="empty-state" style={{ padding: '60px 16px' }}>
                    <div className="empty-icon">⚠️</div>
                    <h3>No Violation Reports</h3>
                    <p className="text-sm text-muted">Violation reports will appear here when disciplinary issues are logged.</p>
                </div>
            </div>
        </div>
    );
}
