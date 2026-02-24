'use client';

export default function SessionsPage() {
    return (
        <div className="animate-in">
            <div className="page-header">
                <div><h1 className="page-title">Live Sessions</h1><p className="page-subtitle">Schedule and manage live training sessions</p></div>
                <button className="btn btn-primary">+ Schedule Session</button>
            </div>

            <div className="grid-4 mb-24">
                <div className="stat-card primary"><div className="stat-icon primary">💻</div><div className="stat-info"><h3>Total Sessions</h3><div className="stat-value">0</div></div></div>
                <div className="stat-card accent"><div className="stat-icon accent">📅</div><div className="stat-info"><h3>Upcoming</h3><div className="stat-value">0</div></div></div>
                <div className="stat-card success"><div className="stat-icon success">✅</div><div className="stat-info"><h3>Completed</h3><div className="stat-value">0</div></div></div>
                <div className="stat-card danger"><div className="stat-icon danger">⏰</div><div className="stat-info"><h3>Hours Taught</h3><div className="stat-value">0</div></div></div>
            </div>

            <div className="card">
                <div className="empty-state" style={{ padding: '60px 16px' }}>
                    <div className="empty-icon">💻</div>
                    <h3>No Sessions Scheduled</h3>
                    <p className="text-sm text-muted">Schedule live sessions to conduct interactive training.</p>
                </div>
            </div>
        </div>
    );
}
